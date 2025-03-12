// NFT Marketplace System

class NFTMarketplace {
    constructor() {
        this.listings = [];
        this.auctions = [];
        this.minPrice = 100; // Minimum price in xCIS
        this.marketplaceFee = 0.025; // 2.5% marketplace fee
        this.minAuctionDuration = 3600000; // 1 hour in milliseconds
        this.maxAuctionDuration = 604800000; // 1 week in milliseconds
        this.minBidIncrement = 0.1; // 10% minimum bid increase
        
        this.loadListings();
        this.loadAuctions();
        this.startAuctionMonitor();
    }

    loadListings() {
        try {
            const saved = localStorage.getItem('nft_listings');
            if (saved) {
                this.listings = JSON.parse(saved);
            }
        } catch (error) {
            console.error('Error loading listings:', error);
            this.listings = [];
        }
    }

    saveListings() {
        try {
            localStorage.setItem('nft_listings', JSON.stringify(this.listings));
        } catch (error) {
            console.error('Error saving listings:', error);
        }
    }

    loadAuctions() {
        try {
            const saved = localStorage.getItem('nft_auctions');
            if (saved) {
                this.auctions = JSON.parse(saved);
                // Resume active auctions
                this.auctions.forEach(auction => {
                    if (auction.status === 'active') {
                        this.scheduleAuctionEnd(auction);
                    }
                });
            }
        } catch (error) {
            console.error('Error loading auctions:', error);
            this.auctions = [];
        }
    }

    saveAuctions() {
        try {
            localStorage.setItem('nft_auctions', JSON.stringify(this.auctions));
        } catch (error) {
            console.error('Error saving auctions:', error);
        }
    }

    startAuctionMonitor() {
        setInterval(() => {
            const now = Date.now();
            this.auctions.forEach(auction => {
                if (auction.status === 'active' && now >= auction.endTime) {
                    this.finalizeAuction(auction.id);
                }
            });
        }, 60000); // Check every minute
    }

    scheduleAuctionEnd(auction) {
        const timeUntilEnd = auction.endTime - Date.now();
        if (timeUntilEnd > 0) {
            setTimeout(() => this.finalizeAuction(auction.id), timeUntilEnd);
        }
    }

    async listNFT(sellerAddress, nftId, price, currency = 'xCIS', listingType = 'fixed') {
        if (!window.blockchain.addresses[sellerAddress]) {
            throw new Error('Invalid seller address');
        }

        if (price < this.minPrice) {
            throw new Error(`Minimum listing price is ${this.minPrice} xCIS`);
        }

        const nft = window.blockchain.getNFT(nftId);
        if (!nft || nft.owner !== sellerAddress) {
            throw new Error('You do not own this NFT');
        }

        // Check if NFT is already listed or in auction
        if (this.isNFTListed(nftId)) {
            throw new Error('This NFT is already listed');
        }

        const listing = {
            id: Date.now(),
            nftId,
            seller: sellerAddress,
            price,
            currency,
            status: 'active',
            createdAt: Date.now(),
            type: listingType,
            history: [{
                type: 'list',
                price,
                timestamp: Date.now()
            }]
        };

        this.listings.push(listing);
        this.saveListings();
        window.notifications.show('NFT listed successfully!', 'success');
        return listing;
    }

    async createAuction(sellerAddress, nftId, startingPrice, duration) {
        if (duration < this.minAuctionDuration || duration > this.maxAuctionDuration) {
            throw new Error(`Auction duration must be between 1 hour and 1 week`);
        }

        if (startingPrice < this.minPrice) {
            throw new Error(`Minimum starting price is ${this.minPrice} xCIS`);
        }

        const nft = window.blockchain.getNFT(nftId);
        if (!nft || nft.owner !== sellerAddress) {
            throw new Error('You do not own this NFT');
        }

        if (this.isNFTListed(nftId)) {
            throw new Error('This NFT is already listed or in auction');
        }

        const auction = {
            id: Date.now(),
            nftId,
            seller: sellerAddress,
            startingPrice,
            currentPrice: startingPrice,
            highestBidder: null,
            startTime: Date.now(),
            endTime: Date.now() + duration,
            status: 'active',
            bids: [],
            history: [{
                type: 'auction_start',
                price: startingPrice,
                timestamp: Date.now()
            }]
        };

        this.auctions.push(auction);
        this.saveAuctions();
        this.scheduleAuctionEnd(auction);
        
        window.notifications.show('Auction created successfully!', 'success');
        return auction;
    }

    async placeBid(bidderAddress, auctionId, bidAmount) {
        const auction = this.auctions.find(a => a.id === auctionId && a.status === 'active');
        if (!auction) {
            throw new Error('Auction not found or already ended');
        }

        if (auction.seller === bidderAddress) {
            throw new Error('You cannot bid on your own auction');
        }

        const minBid = auction.currentPrice * (1 + this.minBidIncrement);
        if (bidAmount < minBid) {
            throw new Error(`Minimum bid must be ${minBid} xCIS`);
        }

        const bidder = window.blockchain.addresses[bidderAddress];
        if (!bidder || bidder.balance < bidAmount) {
            throw new Error('Insufficient balance for bid');
        }

        // Return previous highest bid if exists
        if (auction.highestBidder) {
            const previousBidder = window.blockchain.addresses[auction.highestBidder];
            previousBidder.balance += auction.currentPrice;
        }

        // Process new bid
        bidder.balance -= bidAmount;
        auction.currentPrice = bidAmount;
        auction.highestBidder = bidderAddress;
        auction.bids.push({
            bidder: bidderAddress,
            amount: bidAmount,
            timestamp: Date.now()
        });
        auction.history.push({
            type: 'bid',
            bidder: bidderAddress,
            price: bidAmount,
            timestamp: Date.now()
        });

        // Extend auction if bid is placed near end
        const timeLeft = auction.endTime - Date.now();
        if (timeLeft < 300000) { // 5 minutes
            auction.endTime += 300000; // Add 5 minutes
            this.scheduleAuctionEnd(auction);
        }

        this.saveAuctions();
        window.blockchain.saveState();
        
        window.notifications.show('Bid placed successfully!', 'success');
        return auction;
    }

    async finalizeAuction(auctionId) {
        const auction = this.auctions.find(a => a.id === auctionId && a.status === 'active');
        if (!auction) return;

        try {
            if (auction.highestBidder) {
                // Calculate fees
                const fee = auction.currentPrice * this.marketplaceFee;
                const sellerAmount = auction.currentPrice - fee;

                // Transfer NFT
                const nft = window.blockchain.getNFT(auction.nftId);
                nft.owner = auction.highestBidder;

                // Update seller balance
                window.blockchain.addresses[auction.seller].balance += sellerAmount;

                auction.history.push({
                    type: 'auction_end',
                    winner: auction.highestBidder,
                    price: auction.currentPrice,
                    timestamp: Date.now()
                });

                window.notifications.show(
                    `Auction ended! NFT sold to ${auction.highestBidder} for ${auction.currentPrice} xCIS`,
                    'success'
                );
            } else {
                auction.history.push({
                    type: 'auction_end',
                    result: 'no_bids',
                    timestamp: Date.now()
                });

                window.notifications.show('Auction ended with no bids', 'info');
            }

            auction.status = 'ended';
            this.saveAuctions();
            window.blockchain.saveState();
        } catch (error) {
            console.error('Error finalizing auction:', error);
            window.notifications.show('Error finalizing auction', 'error');
        }
    }

    async buyNFT(buyerAddress, listingId) {
        const listing = this.listings.find(l => l.id === listingId && l.status === 'active');
        if (!listing) {
            throw new Error('Listing not found or no longer active');
        }

        const buyer = window.blockchain.addresses[buyerAddress];
        if (!buyer) {
            throw new Error('Invalid buyer address');
        }

        if (buyer.balance < listing.price) {
            throw new Error(`Insufficient balance. Need ${listing.price} ${listing.currency}`);
        }

        try {
            // Calculate marketplace fee
            const fee = listing.price * this.marketplaceFee;
            const sellerAmount = listing.price - fee;

            // Transfer payment
            buyer.balance -= listing.price;
            window.blockchain.addresses[listing.seller].balance += sellerAmount;

            // Transfer NFT
            const nft = window.blockchain.getNFT(listing.nftId);
            nft.owner = buyerAddress;
            
            // Update listing
            listing.status = 'sold';
            listing.soldAt = Date.now();
            listing.buyer = buyerAddress;
            listing.finalPrice = listing.price;
            listing.history.push({
                type: 'sale',
                buyer: buyerAddress,
                price: listing.price,
                timestamp: Date.now()
            });

            this.saveListings();
            window.blockchain.saveState();

            window.notifications.show('NFT purchased successfully!', 'success');
            return true;
        } catch (error) {
            console.error('Error processing purchase:', error);
            throw new Error('Failed to process purchase');
        }
    }

    async cancelListing(sellerAddress, listingId) {
        const listing = this.listings.find(l => l.id === listingId);
        if (!listing || listing.status !== 'active') {
            throw new Error('Listing not found or no longer active');
        }

        if (listing.seller !== sellerAddress) {
            throw new Error('You are not the seller of this NFT');
        }

        listing.status = 'cancelled';
        listing.cancelledAt = Date.now();
        listing.history.push({
            type: 'cancel',
            timestamp: Date.now()
        });

        this.saveListings();
        window.notifications.show('Listing cancelled successfully', 'success');
        return true;
    }

    async cancelAuction(sellerAddress, auctionId) {
        const auction = this.auctions.find(a => a.id === auctionId && a.status === 'active');
        if (!auction) {
            throw new Error('Auction not found or already ended');
        }

        if (auction.seller !== sellerAddress) {
            throw new Error('You are not the seller of this NFT');
        }

        if (auction.bids.length > 0) {
            throw new Error('Cannot cancel auction with active bids');
        }

        auction.status = 'cancelled';
        auction.history.push({
            type: 'auction_cancel',
            timestamp: Date.now()
        });

        this.saveAuctions();
        window.notifications.show('Auction cancelled successfully', 'success');
        return true;
    }

    getActiveListings() {
        return this.listings.filter(listing => listing.status === 'active');
    }

    getActiveAuctions() {
        return this.auctions.filter(auction => auction.status === 'active');
    }

    getUserActivity(address) {
        const listings = this.listings.filter(l => 
            l.seller === address || l.buyer === address
        );

        const auctions = this.auctions.filter(a =>
            a.seller === address || a.highestBidder === address ||
            a.bids.some(bid => bid.bidder === address)
        );

        return { listings, auctions };
    }

    getMarketStats() {
        const stats = {
            totalListings: this.listings.length,
            activeListings: this.getActiveListings().length,
            totalAuctions: this.auctions.length,
            activeAuctions: this.getActiveAuctions().length,
            totalVolume: 0,
            auctionVolume: 0,
            recentSales: [],
            topSales: []
        };

        // Calculate volumes and collect sales
        const sales = [];
        
        this.listings.forEach(listing => {
            if (listing.status === 'sold') {
                stats.totalVolume += listing.finalPrice;
                sales.push({
                    type: 'listing',
                    price: listing.finalPrice,
                    timestamp: listing.soldAt,
                    nftId: listing.nftId
                });
            }
        });

        this.auctions.forEach(auction => {
            if (auction.status === 'ended' && auction.highestBidder) {
                stats.totalVolume += auction.currentPrice;
                stats.auctionVolume += auction.currentPrice;
                sales.push({
                    type: 'auction',
                    price: auction.currentPrice,
                    timestamp: auction.endTime,
                    nftId: auction.nftId
                });
            }
        });

        // Sort sales by timestamp and price
        sales.sort((a, b) => b.timestamp - a.timestamp);
        stats.recentSales = sales.slice(0, 10);

        sales.sort((a, b) => b.price - a.price);
        stats.topSales = sales.slice(0, 10);

        return stats;
    }

    isNFTListed(nftId) {
        return this.listings.some(l => l.nftId === nftId && l.status === 'active') ||
               this.auctions.some(a => a.nftId === nftId && a.status === 'active');
    }

    getPriceHistory(nftId) {
        const history = [];

        // Get listing history
        this.listings.forEach(listing => {
            if (listing.nftId === nftId) {
                history.push(...listing.history);
            }
        });

        // Get auction history
        this.auctions.forEach(auction => {
            if (auction.nftId === nftId) {
                history.push(...auction.history);
            }
        });

        // Sort by timestamp
        history.sort((a, b) => a.timestamp - b.timestamp);
        return history;
    }
}

// Initialize NFT marketplace
window.nftMarketplace = new NFTMarketplace(); 