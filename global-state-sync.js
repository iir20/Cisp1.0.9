/**
 * Global State Synchronization System
 * 
 * This system ensures that wallet connection status, balances, and NFT collections
 * are properly synchronized across all pages of the application.
 */

class GlobalStateSync {
    constructor() {
        this.isInitialized = false;
        this.syncInterval = null;
        this.pageVisibilityState = 'visible';
        this.walletSyncEnabled = true;
        this.balanceSyncEnabled = true;
        this.nftSyncEnabled = true;
        this.lastSyncTime = 0;
    }

    init() {
        if (this.isInitialized) {
            console.log('Global state sync already initialized');
            return;
        }

        console.log('Initializing global state synchronization system');

        // Set up page visibility tracking
        document.addEventListener('visibilitychange', () => {
            this.pageVisibilityState = document.visibilityState;
            if (document.visibilityState === 'visible') {
                this.performFullSync();
            }
        });

        // Set up periodic sync
        this.syncInterval = setInterval(() => this.performSync(), 3000);

        // Set up storage event listener for cross-tab synchronization
        window.addEventListener('storage', (event) => this.handleStorageEvent(event));

        // Perform initial sync
        this.performFullSync();
        
        // Set global reference
        this.isInitialized = true;
    }

    /**
     * Perform a full synchronization of wallet, balances, and NFTs
     */
    async performFullSync() {
        console.log('Performing full state synchronization');
        this.lastSyncTime = Date.now();
        
        try {
            // First sync wallet state (wallet must be available for balances/NFTs)
            if (this.walletSyncEnabled) {
                await this.syncWalletState();
            }
            
            // Then sync blockchain balances
            if (this.balanceSyncEnabled) {
                await this.syncBalances();
            }
            
            // Finally sync NFT collection
            if (this.nftSyncEnabled) {
                await this.syncNFTs();
            }
            
            // Update UI displays
            this.updateUIDisplays();
        } catch (error) {
            console.error('Error during full sync:', error);
        }
    }

    /**
     * Perform regular sync based on timing and changes
     */
    async performSync() {
        // Skip if page is not visible
        if (this.pageVisibilityState !== 'visible') return;
        
        // Determine what needs to be synced based on time since last sync
        const now = Date.now();
        const timeSinceLastSync = now - this.lastSyncTime;
        
        try {
            // Always sync wallet state on every sync
            if (this.walletSyncEnabled) {
                await this.syncWalletState();
            }
            
            // Sync balances every 5 seconds
            if (this.balanceSyncEnabled && timeSinceLastSync >= 5000) {
                await this.syncBalances();
            }
            
            // Sync NFTs every 10 seconds
            if (this.nftSyncEnabled && timeSinceLastSync >= 10000) {
                await this.syncNFTs();
            }
            
            // Update last sync time if we synced balances or NFTs
            if (timeSinceLastSync >= 5000) {
                this.lastSyncTime = now;
            }
            
            // Update UI displays
            this.updateUIDisplays();
        } catch (error) {
            console.error('Error during regular sync:', error);
        }
    }

    /**
     * Handle localStorage changes from other tabs
     */
    handleStorageEvent(event) {
        // React to changes in storage from other tabs
        if (!event || !event.key) return;
        
        try {
            if (event.key === 'current_wallet_id') {
                // Wallet connection changed in another tab
                this.syncWalletState();
            } else if (event.key === 'blockchain_balances') {
                // Balances changed in another tab
                this.syncBalances();
            } else if (event.key === 'cisp_nfts') {
                // NFTs changed in another tab
                this.syncNFTs();
            }
        } catch (error) {
            console.error('Error handling storage event:', error);
        }
    }

    /**
     * Synchronize wallet connection state
     */
    async syncWalletState() {
        if (!window.cispWallet) {
            console.warn('Wallet system not available for sync');
            return;
        }
        
        try {
            // Ensure wallet system is initialized
            if (!window.cispWallet.isInitialized) {
                await window.cispWallet.init();
            }
            
            // Check for current wallet ID in storage
            const storedWalletId = sessionStorage.getItem('current_wallet_id') || localStorage.getItem('current_wallet_id');
            
            // If there's a stored wallet ID but no current wallet, try to connect
            if (storedWalletId && !window.cispWallet.isWalletConnected()) {
                if (window.cispWallet.wallets.has(storedWalletId)) {
                    // Don't use the connect method as it shows notifications
                    window.cispWallet.currentWallet = window.cispWallet.wallets.get(storedWalletId);
                    window.cispWallet._broadcastWalletChange();
                    console.log(`Auto-connected wallet: ${storedWalletId}`);
                }
            } 
            // If there's no stored wallet ID but a current wallet, disconnect
            else if (!storedWalletId && window.cispWallet.isWalletConnected()) {
                window.cispWallet.disconnectWallet();
                console.log('Disconnected wallet due to missing storage ID');
            }
        } catch (error) {
            console.error('Error syncing wallet state:', error);
        }
    }

    /**
     * Synchronize blockchain balances
     */
    async syncBalances() {
        if (!window.blockchain) {
            console.warn('Blockchain system not available for sync');
            return;
        }
        
        try {
            // Ensure blockchain is initialized
            if (!window.blockchain.isInitialized) {
                await window.blockchain.init();
            }
            
            // Load latest balances
            window.blockchain.loadBalances();
            
            // If wallet is connected, sync wallet object with blockchain balances
            if (window.cispWallet && window.cispWallet.isWalletConnected()) {
                const wallet = window.cispWallet.currentWallet;
                const address = wallet.address;
                
                // Make sure wallet has a balance object
                if (!wallet.balance) wallet.balance = {};
                
                // Get latest balances from blockchain
                const cisBalance = window.blockchain.getBalance(address, 'CIS');
                const xCisBalance = window.blockchain.getBalance(address, 'xCIS');
                
                // Update wallet object if different
                if (wallet.balance.CIS !== cisBalance) {
                    wallet.balance.CIS = cisBalance;
                    window.cispWallet._save();
                }
                
                if (wallet.balance.xCIS !== xCisBalance) {
                    wallet.balance.xCIS = xCisBalance;
                    window.cispWallet._save();
                }
            }
        } catch (error) {
            console.error('Error syncing balances:', error);
        }
    }

    /**
     * Synchronize NFT collection
     */
    async syncNFTs() {
        if (!window.nftSystem) {
            console.warn('NFT system not available for sync');
            return;
        }
        
        try {
            // First, load the latest NFT state
            window.nftSystem.loadState();
            
            // Repair NFT database to ensure consistent data
            if (typeof window.nftSystem.scanAndRepairNFTDatabase === 'function') {
                window.nftSystem.scanAndRepairNFTDatabase();
            }
            
            // Update NFT displays if wallet is connected
            if (window.cispWallet && window.cispWallet.isWalletConnected()) {
                // Find all NFT collection containers
                const nftContainers = document.querySelectorAll('[data-nft-container]');
                nftContainers.forEach(container => {
                    if (typeof window.nftSystem.displayUserNFTs === 'function') {
                        window.nftSystem.displayUserNFTs(container);
                    }
                });
                
                // Also check for the main collection container
                const mainCollection = document.getElementById('nft-collection');
                if (mainCollection && typeof window.nftSystem.displayUserNFTs === 'function') {
                    window.nftSystem.displayUserNFTs(mainCollection);
                }
            }
        } catch (error) {
            console.error('Error syncing NFTs:', error);
        }
    }

    /**
     * Update all UI displays based on current state
     */
    updateUIDisplays() {
        try {
            // Update balance displays
            if (window.blockchain && window.cispWallet && window.cispWallet.isWalletConnected()) {
                const address = window.cispWallet.currentWallet.address;
                
                // Update specific balance displays
                const balanceElements = document.querySelectorAll(`[data-balance-for="${address}"], [data-current-wallet-balance]`);
                balanceElements.forEach(element => {
                    const currencyType = element.getAttribute('data-currency-type') || 'CIS';
                    const balance = window.blockchain.getBalance(address, currencyType);
                    element.textContent = balance;
                });
                
                // Update any wallet address displays
                const addressElements = document.querySelectorAll('[data-wallet-address]');
                addressElements.forEach(element => {
                    element.textContent = address;
                });
            }
            
            // Update wallet connection UI elements
            this.updateWalletConnectionUI();
        } catch (error) {
            console.error('Error updating UI displays:', error);
        }
    }

    /**
     * Update UI elements based on wallet connection state
     */
    updateWalletConnectionUI() {
        try {
            const isConnected = window.cispWallet && window.cispWallet.isWalletConnected();
            
            // Update elements with data-requires-wallet attribute
            const walletRequiredElements = document.querySelectorAll('[data-requires-wallet]');
            walletRequiredElements.forEach(element => {
                if (isConnected) {
                    element.classList.remove('wallet-required');
                    element.removeAttribute('disabled');
                } else {
                    element.classList.add('wallet-required');
                    element.setAttribute('disabled', 'disabled');
                }
            });
            
            // Update elements that should only show when wallet is connected
            const walletConnectedElements = document.querySelectorAll('[data-wallet-connected-only]');
            walletConnectedElements.forEach(element => {
                element.style.display = isConnected ? '' : 'none';
            });
            
            // Update elements that should only show when wallet is disconnected
            const walletDisconnectedElements = document.querySelectorAll('[data-wallet-disconnected-only]');
            walletDisconnectedElements.forEach(element => {
                element.style.display = !isConnected ? '' : 'none';
            });
            
            // Remove any "connect wallet first" notifications if wallet is connected
            if (isConnected && window.notifications) {
                // Find and remove any connect wallet warnings
                const notificationsContainer = document.querySelector('.notifications-container');
                if (notificationsContainer) {
                    const connectWarnings = notificationsContainer.querySelectorAll('.notification-warning, .notification-error');
                    connectWarnings.forEach(notification => {
                        if (notification.textContent.toLowerCase().includes('connect') && 
                            notification.textContent.toLowerCase().includes('wallet')) {
                            notification.remove();
                        }
                    });
                }
            }
        } catch (error) {
            console.error('Error updating wallet connection UI:', error);
        }
    }
}

// Create global instance
window.globalStateSync = new GlobalStateSync();

// Initialize when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize with a slight delay to ensure other systems are loaded first
    setTimeout(() => {
        window.globalStateSync.init();
    }, 500);
}); 