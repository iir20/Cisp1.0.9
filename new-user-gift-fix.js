/**
 * New User Gift Fix
 * 
 * This script ensures that new users properly receive their welcome gift 
 * (initial tokens and NFT) when creating a new wallet.
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('New User Gift Fix script loaded');
    
    // Function to ensure new users receive their welcome gift
    function fixNewUserGift() {
        try {
            console.log('Setting up new user gift fix...');
            
            // Check if wallet system is available
            if (!window.cispWallet) {
                console.warn('Wallet system not available, deferring new user gift fix');
                setTimeout(fixNewUserGift, 1000);
                return;
            }
            
            // Original createWallet method
            const originalCreateWallet = window.cispWallet.createWallet;
            
            // Enhanced createWallet method
            window.cispWallet.createWallet = async function(...args) {
                try {
                    console.log('Creating new wallet with enhanced gift functionality...');
                    
                    // Call original method to create the wallet
                    const wallet = await originalCreateWallet.apply(this, args);
                    console.log('Wallet created:', wallet);
                    
                    // Check if wallet was created successfully
                    if (!wallet || !wallet.address) {
                        console.error('Failed to create wallet');
                        return wallet;
                    }
                    
                    const walletAddress = wallet.address;
                    console.log(`New wallet address: ${walletAddress}`);
                    
                    // Ensure the wallet has a balance object
                    if (!wallet.balance) {
                        wallet.balance = { CIS: 0, xCIS: 0 };
                    }
                    
                    // Make sure blockchain is available
                    ensureBlockchainAvailable();
                    
                    // Grant initial tokens to the new wallet
                    await grantInitialTokens(walletAddress);
                    
                    // Create welcome NFT for the new wallet
                    await createWelcomeNFT(walletAddress);
                    
                    // Update the wallet display
                    if (typeof window.updateWalletDisplay === 'function') {
                        window.updateWalletDisplay(wallet);
                    }
                    
                    console.log('New user gift processing completed');
                    
                    // Return the wallet
                    return wallet;
                } catch (error) {
                    console.error('Error in enhanced createWallet:', error);
                    
                    // Fall back to original method
                    if (originalCreateWallet) {
                        return originalCreateWallet.apply(this, args);
                    }
                    
                    throw error;
                }
            };
            
            // Function to ensure blockchain is available
            function ensureBlockchainAvailable() {
                if (!window.blockchain) {
                    console.log('No blockchain instance found, looking for alternatives');
                    
                    if (window.cispChain) {
                        console.log('Found cispChain, using it as blockchain');
                        window.blockchain = window.cispChain;
                    } else {
                        console.log('Creating new blockchain instance');
                        if (typeof Blockchain === 'function') {
                            window.blockchain = new Blockchain();
                        } else {
                            console.error('Blockchain class not found, cannot create instance');
                        }
                    }
                }
                
                return !!window.blockchain;
            }
            
            // Function to grant initial tokens to new users
            async function grantInitialTokens(address) {
                try {
                    console.log(`Granting initial tokens to ${address}`);
                    
                    // Initial token amount
                    const initialAmount = 100;
                    
                    // Grant tokens using available methods
                    if (window.blockchain) {
                        // Try using built-in methods
                        if (typeof window.blockchain.grantInitialTokens === 'function') {
                            await window.blockchain.grantInitialTokens(address, initialAmount);
                            console.log(`Granted ${initialAmount} tokens using blockchain.grantInitialTokens`);
                        } 
                        else if (typeof window.blockchain.addBalance === 'function') {
                            await window.blockchain.addBalance(address, 'xCIS', initialAmount);
                            console.log(`Granted ${initialAmount} tokens using blockchain.addBalance`);
                        }
                        else {
                            // Direct update to balances if methods are not available
                            try {
                                if (window.blockchain.balances) {
                                    const key = `${address}_xCIS`;
                                    const currentBalance = window.blockchain.balances.get(key) || 0;
                                    window.blockchain.balances.set(key, currentBalance + initialAmount);
                                    
                                    // Save state if possible
                                    if (typeof window.blockchain._save === 'function' || 
                                        typeof window.blockchain.saveState === 'function') {
                                        (window.blockchain._save || window.blockchain.saveState).call(window.blockchain);
                                    }
                                    
                                    console.log(`Granted ${initialAmount} tokens via direct blockchain.balances update`);
                                }
                            } catch (error) {
                                console.error('Error directly updating blockchain balance:', error);
                            }
                        }
                    }
                    
                    // Also update wallet object directly
                    try {
                        const wallet = window.cispWallet.getWalletByAddress ? 
                            window.cispWallet.getWalletByAddress(address) : 
                            window.cispWallet.wallets?.get(address);
                            
                        if (wallet) {
                            if (!wallet.balance) wallet.balance = {};
                            wallet.balance.xCIS = (wallet.balance.xCIS || 0) + initialAmount;
                            
                            // Save wallet state
                            if (typeof window.cispWallet._save === 'function') {
                                window.cispWallet._save();
                            }
                            
                            console.log(`Updated wallet object with initial balance: ${wallet.balance.xCIS} xCIS`);
                        }
                    } catch (error) {
                        console.error('Error updating wallet object balance:', error);
                    }
                    
                    // Notify user
                    if (window.notifications) {
                        window.notifications.show('success', `Welcome! You received ${initialAmount} xCIS as a welcome gift.`);
                    }
                    
                    return true;
                } catch (error) {
                    console.error('Error granting initial tokens:', error);
                    return false;
                }
            }
            
            // Function to create welcome NFT for new users
            async function createWelcomeNFT(address) {
                try {
                    console.log(`Creating welcome NFT for ${address}`);
                    
                    // Check if NFT system is available
                    if (!window.nftSystem) {
                        console.warn('NFT system not available, cannot create welcome NFT');
                        return false;
                    }
                    
                    // Create welcome NFT
                    if (typeof window.nftSystem.mintRandomNFT === 'function') {
                        const nft = await window.nftSystem.mintRandomNFT(address);
                        console.log('Created welcome NFT:', nft);
                        
                        // Notify user
                        if (window.notifications) {
                            window.notifications.show('success', 'You received a welcome NFT! Check your collection.');
                        }
                        
                        return true;
                    } else {
                        console.warn('mintRandomNFT function not available in NFT system');
                        return false;
                    }
                } catch (error) {
                    console.error('Error creating welcome NFT:', error);
                    return false;
                }
            }
            
            // Also add a global function to manually trigger the gift if needed
            window.triggerNewUserGift = async function(address) {
                if (!address && window.cispWallet && typeof window.cispWallet.getCurrentWallet === 'function') {
                    const currentWallet = window.cispWallet.getCurrentWallet();
                    address = currentWallet?.address;
                }
                
                if (!address) {
                    console.error('No address provided and no current wallet found');
                    return false;
                }
                
                console.log(`Manually triggering new user gift for ${address}`);
                
                // Ensure blockchain is available
                ensureBlockchainAvailable();
                
                // Grant initial tokens
                await grantInitialTokens(address);
                
                // Create welcome NFT
                await createWelcomeNFT(address);
                
                return true;
            };
            
            console.log('New user gift fix set up successfully');
        } catch (error) {
            console.error('Error setting up new user gift fix:', error);
        }
    }
    
    // Apply the fix after a short delay to ensure all systems are loaded
    setTimeout(fixNewUserGift, 1000);
}); 