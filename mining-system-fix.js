/**
 * Mining System Fix
 * 
 * This script fixes issues with the mining system, ensuring it can find
 * the blockchain and properly distribute mining rewards.
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('Mining System Fix script loaded');
    
    // Function to fix mining system issues
    function fixMiningSystem() {
        try {
            console.log('Applying mining system fixes...');
            
            // Check if mining system is loaded
            if (!window.miningSystem) {
                console.warn('Mining system not found, cannot apply fixes');
                return;
            }
            
            // Check if mining system is already initialized
            if (window.miningSystem.isInitialized) {
                console.log('Mining system already initialized, no need to reinitialize');
            } else {
                console.log('Mining system needs initialization');
            }
            
            // Function to ensure blockchain is available to the mining system
            function ensureBlockchainAvailable() {
                // First check for blockchain global
                if (!window.blockchain) {
                    console.log('No blockchain instance found, creating one');
                    
                    // Try to find existing blockchain instance under different names
                    if (window.cispChain) {
                        console.log('Found cispChain, using it as blockchain');
                        window.blockchain = window.cispChain;
                    } else {
                        console.log('Creating new blockchain instance');
                        if (typeof Blockchain === 'function') {
                            window.blockchain = new Blockchain();
                        } else {
                            console.error('Blockchain class not found, cannot create instance');
                            return false;
                        }
                    }
                }
                
                // Make blockchain available to the mining system
                console.log('Blockchain instance is now available');
                return true;
            }
            
            // Function to reinitialize mining system
            function reinitializeMiningSystem() {
                try {
                    console.log('Reinitializing mining system');
                    
                    // First ensure blockchain is available
                    if (!ensureBlockchainAvailable()) {
                        console.error('Cannot reinitialize mining system without blockchain');
                        return false;
                    }
                    
                    // Reset initialization flag
                    window.miningSystem.isInitialized = false;
                    
                    // Call initialize method
                    const result = window.miningSystem.initialize();
                    console.log('Mining system reinitialization', result ? 'successful' : 'failed');
                    
                    return result;
                } catch (error) {
                    console.error('Error reinitializing mining system:', error);
                    return false;
                }
            }
            
            // Function to patch mining reward processing
            function patchMiningRewardProcessing() {
                try {
                    console.log('Patching mining reward processing');
                    
                    // Original processBlockReward method
                    const originalProcessBlockReward = window.miningSystem.processBlockReward;
                    
                    // Create patched version
                    window.miningSystem.processBlockReward = function() {
                        try {
                            console.log('Running patched processBlockReward');
                            
                            // Get current wallet address
                            const currentWallet = window.cispWallet?.getCurrentWallet();
                            if (!currentWallet) {
                                console.error('No wallet connected, cannot process reward');
                                return;
                            }
                            
                            const walletAddress = currentWallet.address;
                            
                            // Calculate block reward
                            const reward = this.blockReward * (1 + (this.miningPower * 0.1));
                            console.log(`Calculated reward: ${reward} CIS for wallet ${walletAddress}`);
                            
                            // Update total mined
                            this.totalMined += reward;
                            
                            // Add reward to blockchain balance
                            if (window.blockchain) {
                                // Use the appropriate method to add mining reward
                                if (typeof window.blockchain.grantInitialTokens === 'function') {
                                    window.blockchain.grantInitialTokens(walletAddress, reward);
                                    console.log(`Granted ${reward} CIS to ${walletAddress} using grantInitialTokens`);
                                }
                                else if (typeof window.blockchain.addBalance === 'function') {
                                    window.blockchain.addBalance(walletAddress, 'CIS', reward);
                                    console.log(`Granted ${reward} CIS to ${walletAddress} using addBalance`);
                                }
                                else if (typeof window.blockchain.createTransaction === 'function') {
                                    window.blockchain.createTransaction('MINING_REWARD', walletAddress, reward, 'mining');
                                    console.log(`Granted ${reward} CIS to ${walletAddress} using createTransaction`);
                                }
                                else {
                                    // Direct update to blockchain balances if methods not available
                                    try {
                                        if (window.blockchain.balances) {
                                            const key = `${walletAddress}_CIS`;
                                            const currentBalance = window.blockchain.balances.get(key) || 0;
                                            window.blockchain.balances.set(key, currentBalance + reward);
                                            console.log(`Granted ${reward} CIS to ${walletAddress} using direct balance update`);
                                        }
                                    } catch (error) {
                                        console.error('Error directly updating blockchain balance:', error);
                                    }
                                }
                            } else if (window.cispChain) {
                                // Fallback to cispChain if available
                                if (typeof window.cispChain.addBalance === 'function') {
                                    window.cispChain.addBalance(walletAddress, 'CIS', reward);
                                    console.log(`Granted ${reward} CIS to ${walletAddress} using cispChain.addBalance`);
                                }
                            }
                            
                            // Also update wallet object directly
                            if (window.cispWallet && currentWallet) {
                                if (!currentWallet.balance) {
                                    currentWallet.balance = {};
                                }
                                
                                currentWallet.balance.CIS = (currentWallet.balance.CIS || 0) + reward;
                                
                                if (typeof window.cispWallet._save === 'function') {
                                    window.cispWallet._save();
                                }
                                
                                if (typeof window.cispWallet._broadcastWalletChange === 'function') {
                                    window.cispWallet._broadcastWalletChange();
                                }
                                
                                console.log(`Updated wallet object with new CIS balance: ${currentWallet.balance.CIS}`);
                            }
                            
                            // Save mining stats
                            this.saveMiningStats();
                            
                            // Notify user
                            if (window.notifications) {
                                window.notifications.show('success', `Block found! Earned ${reward.toFixed(2)} CIS`);
                            }
                            
                            // Update UI
                            this.updateUI();
                            
                            console.log('Mining reward processed successfully');
                            
                            return true;
                        } catch (error) {
                            console.error('Error in patched processBlockReward:', error);
                            
                            // Try to run original method if available
                            if (typeof originalProcessBlockReward === 'function') {
                                console.log('Falling back to original processBlockReward method');
                                return originalProcessBlockReward.apply(this, arguments);
                            }
                            
                            return false;
                        }
                    };
                    
                    console.log('Mining reward processing patched successfully');
                    return true;
                } catch (error) {
                    console.error('Error patching mining reward processing:', error);
                    return false;
                }
            }
            
            // Ensure blockchain is available
            ensureBlockchainAvailable();
            
            // Patch mining reward processing
            patchMiningRewardProcessing();
            
            // Reinitialize mining system
            reinitializeMiningSystem();
            
            console.log('Mining system fixes applied');
        } catch (error) {
            console.error('Error applying mining system fixes:', error);
        }
    }
    
    // Apply the fixes after a short delay to ensure all systems are loaded
    setTimeout(fixMiningSystem, 1000);
}); 