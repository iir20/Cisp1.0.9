// Referral System and Token Transfer Management

class ReferralSystem {
    constructor() {
        this.levels = [
            { level: 1, required: 5, reward: { xcis: 50, nft: false }, title: "Cosmic Starter" },
            { level: 2, required: 10, reward: { xcis: 100, nft: true }, title: "Space Explorer" },
            { level: 3, required: 20, reward: { xcis: 200, nft: false }, title: "Star Navigator" },
            { level: 4, required: 35, reward: { xcis: 350, nft: true }, title: "Galaxy Pioneer" },
            { level: 5, required: 50, reward: { xcis: 500, nft: false }, title: "Nebula Master" },
            { level: 6, required: 75, reward: { xcis: 750, nft: true }, title: "Cosmic Elite" },
            { level: 7, required: 100, reward: { xcis: 1000, nft: false }, title: "Universe Sage" },
            { level: 8, required: 150, reward: { xcis: 1500, nft: true }, title: "Celestial Lord" },
            { level: 9, required: 200, reward: { xcis: 2000, nft: false }, title: "Cosmic Overlord" },
            { level: 10, required: 300, reward: { xcis: 3000, nft: true }, title: "Cosmic Legend" }
        ];
    }

    async init() {
        try {
            // Load saved referral data
            this.loadReferralData();
            console.log('Referral system initialized');
        } catch (error) {
            console.error('Error initializing referral system:', error);
        }
    }

    loadReferralData() {
        const savedData = localStorage.getItem('referralData');
        this.referralData = savedData ? JSON.parse(savedData) : {};
    }

    saveReferralData() {
        localStorage.setItem('referralData', JSON.stringify(this.referralData));
    }

    generateReferralCode(address) {
        // Generate a unique referral code based on address and timestamp
        const timestamp = Date.now().toString(36);
        const addressPart = address.substring(2, 8);
        return `${addressPart}-${timestamp}`.toUpperCase();
    }

    async applyReferralCode(userAddress, referralCode) {
        try {
            // Validate referral code
            const referrer = this.findReferrerByCode(referralCode);
            if (!referrer) {
                throw new Error('Invalid referral code');
            }

            if (referrer === userAddress) {
                throw new Error('Cannot use your own referral code');
            }

            // Initialize user's referral data if not exists
            if (!this.referralData[userAddress]) {
                this.referralData[userAddress] = {
                    referralCode: this.generateReferralCode(userAddress),
                    referrer: referrer,
                    referrals: [],
                    level: 0,
                    totalRewards: 0,
                    claimedRewards: []
                };
            }

            // Update referrer's data
            if (!this.referralData[referrer]) {
                this.referralData[referrer] = {
                    referralCode: this.generateReferralCode(referrer),
                    referrer: null,
                    referrals: [],
                    level: 0,
                    totalRewards: 0,
                    claimedRewards: []
                };
            }

            // Add user to referrer's referrals if not already added
            if (!this.referralData[referrer].referrals.includes(userAddress)) {
                this.referralData[referrer].referrals.push(userAddress);
                await this.checkAndUpdateLevel(referrer);
            }

            this.saveReferralData();
            return true;
        } catch (error) {
            console.error('Error applying referral code:', error);
            throw error;
        }
    }

    findReferrerByCode(code) {
        for (const [address, data] of Object.entries(this.referralData)) {
            if (data.referralCode === code) {
                return address;
            }
        }
        return null;
    }

    async checkAndUpdateLevel(address) {
        const userData = this.referralData[address];
        if (!userData) return;

        const referralCount = userData.referrals.length;
        let newLevel = 0;

        // Find the highest level achieved
        for (const levelData of this.levels) {
            if (referralCount >= levelData.required) {
                newLevel = levelData.level;
            } else {
                break;
            }
        }

        // If level increased, grant rewards
        if (newLevel > userData.level) {
            for (let i = userData.level + 1; i <= newLevel; i++) {
                await this.grantLevelRewards(address, i);
            }
            userData.level = newLevel;
            this.saveReferralData();
        }
    }

    async grantLevelRewards(address, level) {
        const levelData = this.levels[level - 1];
        if (!levelData) return;

        const reward = levelData.reward;
        const userData = this.referralData[address];

        // Grant xCIS tokens
        if (reward.xcis > 0) {
            await window.blockchain.grantTokens(address, reward.xcis);
            userData.totalRewards += reward.xcis;
        }

        // Grant NFT if applicable
        if (reward.nft) {
            const nft = await window.nftSystem.mintRandomNFT(address);
            userData.claimedRewards.push({
                type: 'nft',
                id: nft.id,
                level: level,
                timestamp: Date.now()
            });
        }

        // Save updated data
        this.saveReferralData();

        // Show notification
        const rewardText = `${reward.xcis} xCIS${reward.nft ? ' + Random NFT' : ''}`;
        window.notifications?.show(
            `Level ${level} Achieved! (${levelData.title})\nRewards: ${rewardText}`,
            'success',
            8000
        );
    }

    getReferralStats(address) {
        const userData = this.referralData[address] || {
            referralCode: null,
            referrals: [],
            level: 0,
            totalRewards: 0
        };

        const currentLevel = this.levels[userData.level] || this.levels[0];
        const nextLevel = this.levels[userData.level] || null;

        return {
            referralCode: userData.referralCode || this.generateReferralCode(address),
            totalReferrals: userData.referrals.length,
            currentLevel: userData.level,
            levelTitle: currentLevel.title,
            totalRewards: userData.totalRewards,
            nextLevelRequirement: nextLevel ? nextLevel.required : null,
            remainingForNextLevel: nextLevel ? nextLevel.required - userData.referrals.length : 0
        };
    }
}

class TokenTransfer {
    static async sendTokens(fromAddress, toAddress, amount, tokenType = 'xCIS') {
        try {
            if (!window.cispChain) throw new Error('Blockchain not initialized');
            
            const sender = window.cispChain.addresses[fromAddress];
            if (!sender || sender[tokenType] < amount) {
                throw new Error('Insufficient balance');
            }

            // Initialize recipient address if it doesn't exist
            if (!window.cispChain.addresses[toAddress]) {
                window.cispChain.addresses[toAddress] = { xCIS: 0, CIS: 0, nfts: [] };
            }

            // Perform transfer
            window.cispChain.addresses[fromAddress][tokenType] -= amount;
            window.cispChain.addresses[toAddress][tokenType] += amount;

            // Save blockchain state
            window.cispChain.saveState();

            return {
                success: true,
                message: `Successfully sent ${amount} ${tokenType} to ${toAddress}`,
                transaction: {
                    from: fromAddress,
                    to: toAddress,
                    amount: amount,
                    type: tokenType,
                    timestamp: Date.now()
                }
            };
        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }

    static async transferNFT(fromAddress, toAddress, nftId) {
        try {
            if (!window.cispChain) throw new Error('Blockchain not initialized');
            
            const sender = window.cispChain.addresses[fromAddress];
            if (!sender) throw new Error('Sender address not found');

            const nftIndex = sender.nfts.findIndex(nft => nft.id === nftId);
            if (nftIndex === -1) throw new Error('NFT not found in sender\'s collection');

            // Initialize recipient address if it doesn't exist
            if (!window.cispChain.addresses[toAddress]) {
                window.cispChain.addresses[toAddress] = { xCIS: 0, CIS: 0, nfts: [] };
            }

            // Transfer NFT
            const nft = sender.nfts.splice(nftIndex, 1)[0];
            nft.owner = toAddress;
            window.cispChain.addresses[toAddress].nfts.push(nft);

            // Save blockchain state
            window.cispChain.saveState();

            return {
                success: true,
                message: `Successfully transferred NFT #${nftId} to ${toAddress}`,
                nft: nft
            };
        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }
}

// Initialize global instances
window.referralSystem = new ReferralSystem();
window.tokenTransfer = TokenTransfer; 