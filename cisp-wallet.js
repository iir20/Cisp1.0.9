/**
 * CISP Wallet System
 * Native wallet implementation for the Cosmic Space Protocol
 */

class CISPWallet {
    constructor() {
        this.wallets = new Map();
        this.currentWallet = null;
        this.isInitialized = false;
        this.isConnecting = false;
        this.connectionListeners = [];
    }

    async init() {
        try {
            if (this.isInitialized) {
                console.log('Wallet system already initialized');
                return true;
            }
            
            console.log('Initializing CISP Wallet system');
            
            // Load wallets from localStorage
            const walletData = localStorage.getItem('cisp_wallets');
            if (walletData) {
                try {
                    const parsedWallets = JSON.parse(walletData);
                    this.wallets = new Map(Object.entries(parsedWallets));
                } catch (e) {
                    console.error('Error parsing wallet data:', e);
                    this.wallets = new Map();
                }
            }
            
            // Load current wallet from localStorage or sessionStorage
            const currentWalletId = sessionStorage.getItem('current_wallet_id') || localStorage.getItem('current_wallet_id');
            if (currentWalletId && this.wallets.has(currentWalletId)) {
                this.currentWallet = this.wallets.get(currentWalletId);
                
                // Broadcast wallet connection event
                this._broadcastWalletChange();
                console.log(`Wallet auto-connected: ${this.currentWallet.address}`);
            }
            
            // Set up cross-page wallet synchronization
            window.addEventListener('storage', (event) => {
                if (event.key === 'current_wallet_id') {
                    this._synchronizeWallet(event.newValue);
                }
            });
            
            // Set up global connection check
            this._setupConnectionCheck();
            
            this.isInitialized = true;
            return true;
        } catch (error) {
            console.error('Error initializing wallet system:', error);
            return false;
        }
    }

    async createWallet() {
        try {
            this.isConnecting = true;
            if (!this.isInitialized) await this.init();
            
            // Generate wallet address (simplified for demo)
            const address = 'CISP' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5).toUpperCase();
            
            // Generate seed phrase
            const seedPhrase = this._generateSeedPhrase();
            
            // Create wallet object
            const wallet = {
                address,
                seedPhrase,
                createdAt: Date.now(),
                lastAccessed: Date.now(),
                balance: {
                    CIS: 0,
                    xCIS: 100 // Initial tokens
                }
            };
            
            // Add to wallets collection
            this.wallets.set(address, wallet);
            
            // Set as current wallet
            this.currentWallet = wallet;
            
            // Update localStorage
            this._save();
            
            // Store current wallet ID in both storages for cross-page access
            localStorage.setItem('current_wallet_id', address);
            sessionStorage.setItem('current_wallet_id', address);
            
            // Add welcome token if blockchain is available
            if (window.blockchain) {
                await window.blockchain.grantInitialTokens(address, 100);
            }
            
            // Create welcome NFT if NFT system is available
            if (window.nftSystem) {
                try {
                    const welcomeNFT = await window.nftSystem.mintRandomNFT(address);
                    console.log('Created welcome NFT:', welcomeNFT);
                } catch (e) {
                    console.error('Error creating welcome NFT:', e);
                }
            }
            
            // Broadcast wallet connection event
            this._broadcastWalletChange();
            
            // Notify user
            if (window.notifications) {
                window.notifications.show('success', `Wallet created successfully! Your address: ${address}`);
            }
            
            this.isConnecting = false;
            return wallet;
        } catch (error) {
            this.isConnecting = false;
            console.error('Error creating wallet:', error);
            
            // Notify user of error
            if (window.notifications) {
                window.notifications.show('error', 'Failed to create wallet: ' + error.message);
            }
            
            throw error;
        }
    }

    connectWallet(address) {
        try {
            this.isConnecting = true;
            if (!address) {
                throw new Error('Wallet address is required');
            }
            
            if (!this.wallets.has(address)) {
                throw new Error('Wallet not found: ' + address);
            }
            
            // Set as current wallet
            this.currentWallet = this.wallets.get(address);
            this.currentWallet.lastAccessed = Date.now();
            
            // Store current wallet ID in both storages for cross-page access
            localStorage.setItem('current_wallet_id', address);
            sessionStorage.setItem('current_wallet_id', address);
            
            // Save wallet state
            this._save();
            
            // Broadcast wallet connection event
            this._broadcastWalletChange();
            
            // Notify user
            if (window.notifications) {
                window.notifications.show('success', `Wallet connected: ${address}`);
            }
            
            this.isConnecting = false;
            return this.currentWallet;
        } catch (error) {
            this.isConnecting = false;
            console.error('Error connecting wallet:', error);
            
            // Notify user of error
            if (window.notifications) {
                window.notifications.show('error', 'Failed to connect wallet: ' + error.message);
            }
            
            throw error;
        }
    }

    disconnectWallet() {
        try {
            this.currentWallet = null;
            
            // Remove current wallet ID from storage
            localStorage.removeItem('current_wallet_id');
            sessionStorage.removeItem('current_wallet_id');
            
            // Broadcast wallet disconnection event
            this._broadcastWalletChange();
            
            // Notify user
            if (window.notifications) {
                window.notifications.show('info', 'Wallet disconnected');
            }
            
            return true;
        } catch (error) {
            console.error('Error disconnecting wallet:', error);
            return false;
        }
    }

    isWalletConnected() {
        return !!this.currentWallet;
    }

    getCurrentWallet() {
        return this.currentWallet;
    }

    getWalletByAddress(address) {
        return this.wallets.get(address);
    }

    getAllWallets() {
        return Array.from(this.wallets.values());
    }

    async updateWalletBalance(address, currency, amount) {
        if (!this.wallets.has(address)) {
            console.error('Wallet not found:', address);
            return false;
        }
        
        const wallet = this.wallets.get(address);
        wallet.balance[currency] = amount;
        
        // Update if it's the current wallet
        if (this.currentWallet && this.currentWallet.address === address) {
            this.currentWallet = wallet;
            this._broadcastWalletChange();
        }
        
        this._save();
        return true;
    }

    // Private method to generate seed phrase
    _generateSeedPhrase() {
        const words = [
            'cosmic', 'space', 'protocol', 'galaxy', 'star', 'planet', 'meteor', 
            'asteroid', 'comet', 'nebula', 'quasar', 'black', 'hole', 'universe', 
            'exploration', 'discovery', 'mission', 'rocket', 'satellite', 'orbit', 
            'lunar', 'solar', 'system', 'colony', 'station', 'module', 'quantum', 
            'gravity', 'fusion', 'energy', 'matter', 'dark', 'light', 'void', 
            'dimension', 'portal', 'wormhole', 'infinity', 'beyond', 'eternal'
        ];
        
        let seedPhrase = '';
        for (let i = 0; i < 12; i++) {
            const randomIndex = Math.floor(Math.random() * words.length);
            seedPhrase += (seedPhrase ? ' ' : '') + words[randomIndex];
        }
        
        return seedPhrase;
    }

    // Private method to save wallet state
    _save() {
        try {
            // Convert Map to object for storing
            const walletsObj = Object.fromEntries(this.wallets.entries());
            localStorage.setItem('cisp_wallets', JSON.stringify(walletsObj));
            
            // Also save current wallet ID if available
            if (this.currentWallet) {
                localStorage.setItem('current_wallet_id', this.currentWallet.address);
                sessionStorage.setItem('current_wallet_id', this.currentWallet.address);
            }
        } catch (error) {
            console.error('Error saving wallet state:', error);
        }
    }

    // New method to broadcast wallet change event
    _broadcastWalletChange() {
        // Use a custom event to notify the application of wallet changes
        const walletEvent = new CustomEvent('walletChanged', {
            detail: this.currentWallet
        });
        
        // Dispatch the event
        window.dispatchEvent(walletEvent);
        
        // Also notify registered listeners
        this.connectionListeners.forEach(listener => {
            try {
                listener(this.currentWallet);
            } catch (e) {
                console.error('Error in wallet connection listener:', e);
            }
        });
        
        console.log('Broadcast wallet change event:', this.currentWallet?.address || 'disconnected');
    }

    // New method to synchronize wallet state across pages
    _synchronizeWallet(walletId) {
        try {
            // Check if we need to update current wallet
            if (!walletId) {
                if (this.currentWallet) {
                    this.currentWallet = null;
                    this._broadcastWalletChange();
                }
                return;
            }
            
            // If wallet ID is different from current and exists in our collection
            if ((!this.currentWallet || this.currentWallet.address !== walletId) && this.wallets.has(walletId)) {
                this.currentWallet = this.wallets.get(walletId);
                this._broadcastWalletChange();
            }
        } catch (error) {
            console.error('Error synchronizing wallet:', error);
        }
    }

    // New method to setup periodic connection check
    _setupConnectionCheck() {
        // Check every 3 seconds if we need to synchronize wallet state
        setInterval(() => {
            const storedWalletId = sessionStorage.getItem('current_wallet_id') || localStorage.getItem('current_wallet_id');
            
            // If no wallet ID stored but we have a current wallet, disconnect
            if (!storedWalletId && this.currentWallet) {
                this.disconnectWallet();
                return;
            }
            
            // If wallet ID stored but no current wallet or different wallet, connect
            if (storedWalletId && (!this.currentWallet || this.currentWallet.address !== storedWalletId)) {
                if (this.wallets.has(storedWalletId)) {
                    // Silently reconnect without notification
                    this.currentWallet = this.wallets.get(storedWalletId);
                    this._broadcastWalletChange();
                }
            }
        }, 3000);
    }

    // Add a wallet connection listener
    addConnectionListener(listener) {
        if (typeof listener === 'function') {
            this.connectionListeners.push(listener);
            
            // If wallet is already connected, notify immediately
            if (this.currentWallet) {
                try {
                    listener(this.currentWallet);
                } catch (e) {
                    console.error('Error in wallet connection listener:', e);
                }
            }
        }
    }

    // Remove a wallet connection listener
    removeConnectionListener(listener) {
        this.connectionListeners = this.connectionListeners.filter(l => l !== listener);
    }
}

// Create global instance
window.cispWallet = new CISPWallet();

// Initialize the wallet system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.cispWallet.init().then(success => {
        console.log('Wallet system initialization ' + (success ? 'successful' : 'failed'));
    });
});
