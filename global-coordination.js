/**
 * Global Coordination System for Cosmic Interstellar Space Protocol
 * 
 * This module ensures all systems work together properly and all pages
 * are synchronized with each other.
 */

class GlobalCoordination {
    constructor() {
        this.isInitialized = false;
        this.readySystems = {
            wallet: false,
            blockchain: false,
            nft: false,
            notifications: false,
            effects: false
        };
        this.initCallbacks = [];
        this.debug = false;
    }
    
    /**
     * Initialize the global coordination system
     */
    init() {
        if (this.isInitialized) {
            this.log('Global coordination already initialized');
            return;
        }
        
        this.log('Initializing global coordination system');
        
        // Listen for system ready events
        this.setupSystemListeners();
        
        // Check if systems are already initialized
        this.checkInitializedSystems();
        
        // Set up cross-page navigation enhancement
        this.enhancePageNavigation();
        
        // Set up periodic checks
        this.startPeriodicChecks();
        
        this.isInitialized = true;
    }
    
    /**
     * Register system initializations
     */
    setupSystemListeners() {
        // Listen for wallet system ready
        document.addEventListener('wallet:ready', () => {
            this.readySystems.wallet = true;
            this.log('Wallet system ready');
            this.checkAllSystemsReady();
        });
        
        // Listen for blockchain system ready
        document.addEventListener('blockchain:ready', () => {
            this.readySystems.blockchain = true;
            this.log('Blockchain system ready');
            this.checkAllSystemsReady();
        });
        
        // Listen for NFT system ready
        document.addEventListener('nft:systemReady', () => {
            this.readySystems.nft = true;
            this.log('NFT system ready');
            this.checkAllSystemsReady();
        });
        
        // Listen for notifications system ready
        document.addEventListener('notifications:ready', () => {
            this.readySystems.notifications = true;
            this.log('Notifications system ready');
            this.checkAllSystemsReady();
        });
        
        // Listen for cosmic effects ready
        document.addEventListener('effects:ready', () => {
            this.readySystems.effects = true;
            this.log('Cosmic effects ready');
            this.checkAllSystemsReady();
        });
    }
    
    /**
     * Check if systems are already initialized
     */
    checkInitializedSystems() {
        // Check wallet system
        if (window.cispWallet && window.cispWallet.isInitialized) {
            this.readySystems.wallet = true;
            this.log('Wallet system already initialized');
        }
        
        // Check blockchain system
        if ((window.blockchain || window.cispChain) && 
            (window.blockchain?.isInitialized || window.cispChain?.isInitialized)) {
            this.readySystems.blockchain = true; 
            this.log('Blockchain system already initialized');
        }
        
        // Check NFT system
        if (window.nftSystem && window.nftSystem.isInitialized) {
            this.readySystems.nft = true;
            this.log('NFT system already initialized');
        }
        
        // Check notifications system
        if (window.notifications && window.notifications.initialized) {
            this.readySystems.notifications = true;
            this.log('Notifications system already initialized');
        }
        
        // Check cosmic effects
        if (window.enhancedCosmicEffects && window.enhancedCosmicEffects.isInitialized) {
            this.readySystems.effects = true;
            this.log('Cosmic effects already initialized');
        }
        
        // Check if all systems are ready
        this.checkAllSystemsReady();
    }
    
    /**
     * Check if all systems are ready
     */
    checkAllSystemsReady() {
        const allReady = Object.values(this.readySystems).every(ready => ready);
        
        if (allReady) {
            this.log('All systems ready');
            this.onAllSystemsReady();
        } else {
            this.log('Waiting for systems: ' + 
                Object.entries(this.readySystems)
                    .filter(([_, ready]) => !ready)
                    .map(([system]) => system)
                    .join(', ')
            );
        }
    }
    
    /**
     * Run when all systems are ready
     */
    onAllSystemsReady() {
        // Dispatch event
        document.dispatchEvent(new CustomEvent('systems:allReady'));
        
        // Synchronize all systems
        this.synchronizeAllSystems();
        
        // Run callbacks
        this.initCallbacks.forEach(callback => {
            try {
                callback();
            } catch (error) {
                console.error('Error in init callback:', error);
            }
        });
    }
    
    /**
     * Register a callback to run when all systems are ready
     */
    onReady(callback) {
        if (typeof callback !== 'function') return;
        
        // If all systems are already ready, run callback immediately
        if (Object.values(this.readySystems).every(ready => ready)) {
            try {
                callback();
            } catch (error) {
                console.error('Error in ready callback:', error);
            }
        } else {
            // Otherwise, add to queue
            this.initCallbacks.push(callback);
        }
    }
    
    /**
     * Synchronize all systems to ensure they work properly together
     */
    synchronizeAllSystems() {
        this.log('Synchronizing all systems');
        
        // Ensure wallet is properly synchronized
        if (window.improvedWalletSync) {
            window.improvedWalletSync.syncWallet(true);
        }
        
        // Ensure NFT state is loaded
        if (window.nftSystem) {
            window.nftSystem.loadState();
        }
        
        // Update UI elements
        this.updatePageUIElements();
    }
    
    /**
     * Update UI elements based on current state
     */
    updatePageUIElements() {
        // Update balance displays
        this.updateBalanceDisplays();
        
        // Update NFT displays
        this.updateNFTDisplays();
        
        // Update page-specific elements
        this.updatePageSpecificElements();
    }
    
    /**
     * Update balance displays across the page
     */
    updateBalanceDisplays() {
        const wallet = this.getCurrentWallet();
        if (!wallet) return;
        
        const blockchain = window.blockchain || window.cispChain;
        if (!blockchain) return;
        
        try {
            // Get balances
            const xcisBalance = blockchain.getBalance(wallet.address, 'xCIS') || 0;
            const cisBalance = blockchain.getBalance(wallet.address, 'CIS') || 0;
            
            // Dispatch balance update event
            document.dispatchEvent(new CustomEvent('balance:updated', {
                detail: {
                    address: wallet.address,
                    xCIS: xcisBalance,
                    CIS: cisBalance
                }
            }));
        } catch (error) {
            console.error('Error updating balance displays:', error);
        }
    }
    
    /**
     * Update NFT displays on the current page
     */
    updateNFTDisplays() {
        const wallet = this.getCurrentWallet();
        if (!wallet || !window.nftSystem) return;
        
        // Dispatch event for NFT displays to update
        document.dispatchEvent(new CustomEvent('nft:update', {
            detail: {
                address: wallet.address
            }
        }));
    }
    
    /**
     * Update page-specific elements
     */
    updatePageSpecificElements() {
        const currentPath = window.location.pathname;
        
        // Home page
        if (currentPath.includes('home.html') || currentPath.endsWith('/')) {
            this.updateHomePage();
        }
        // NFT page
        else if (currentPath.includes('nft.html')) {
            this.updateNFTPage();
        }
        // Staking page
        else if (currentPath.includes('staking.html')) {
            this.updateStakingPage();
        }
        // Convert page
        else if (currentPath.includes('convert.html')) {
            this.updateConvertPage();
        }
    }
    
    /**
     * Update home page elements
     */
    updateHomePage() {
        const wallet = this.getCurrentWallet();
        if (!wallet) return;
        
        // Update welcome message
        const welcomeMessage = document.querySelector('.welcome-message');
        if (welcomeMessage) {
            welcomeMessage.textContent = `Welcome back, ${this.formatAddress(wallet.address)}!`;
        }
        
        // Update feature cards
        const featureCards = document.querySelectorAll('.feature-card');
        featureCards.forEach(card => {
            // Add animation class if not already present
            if (!card.classList.contains('animated')) {
                card.classList.add('animated');
                setTimeout(() => {
                    card.classList.add('fade-in');
                }, 100 + Math.random() * 500);
            }
        });
    }
    
    /**
     * Update NFT page elements
     */
    updateNFTPage() {
        // Update NFT preview if on mint tab
        const previewContainer = document.getElementById('nft-preview');
        if (previewContainer) {
            const categorySelect = document.getElementById('mint-category');
            if (categorySelect) {
                const event = new Event('change');
                categorySelect.dispatchEvent(event);
            }
        }
    }
    
    /**
     * Update staking page elements
     */
    updateStakingPage() {
        // Update staking stats
        // Implementation depends on staking page structure
    }
    
    /**
     * Update convert page elements
     */
    updateConvertPage() {
        // Update conversion rates and form
        // Implementation depends on convert page structure
    }
    
    /**
     * Enhance page navigation with animations and state preservation
     */
    enhancePageNavigation() {
        // Add click handlers to all navigation links
        document.addEventListener('click', (e) => {
            // Check if it's a navigation link
            if (e.target.tagName === 'A' && 
                e.target.href && 
                e.target.href.includes(window.location.hostname) &&
                !e.target.getAttribute('target')) {
                
                // Prevent default navigation
                e.preventDefault();
                
                // Get target URL
                const targetUrl = e.target.href;
                
                // Store current state
                this.storeCurrentState();
                
                // Animate transition out
                document.body.classList.add('page-transition-out');
                
                // Navigate after animation
                setTimeout(() => {
                    window.location.href = targetUrl;
                }, 300);
            }
        });
        
        // Add page load animation
        document.addEventListener('DOMContentLoaded', () => {
            document.body.classList.add('page-transition-in');
            
            // Add styles for transitions if not already present
            this.addTransitionStyles();
        });
    }
    
    /**
     * Add CSS styles for page transitions
     */
    addTransitionStyles() {
        const style = document.createElement('style');
        style.textContent = `
            body {
                opacity: 1;
                transition: opacity 0.3s ease;
            }
            
            body.page-transition-out {
                opacity: 0;
            }
            
            body.page-transition-in {
                animation: fadeIn 0.5s ease forwards;
            }
            
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }
    
    /**
     * Store current state in sessionStorage for cross-page continuity
     */
    storeCurrentState() {
        // Store scroll position
        sessionStorage.setItem('scrollPosition', window.scrollY.toString());
        
        // Store active tab if applicable
        const activeTab = document.querySelector('.nav-button.active, .tab-button.active');
        if (activeTab && activeTab.dataset.tab) {
            sessionStorage.setItem('activeTab', activeTab.dataset.tab);
        }
    }
    
    /**
     * Restore state from sessionStorage
     */
    restoreState() {
        // Restore scroll position
        const scrollPosition = sessionStorage.getItem('scrollPosition');
        if (scrollPosition) {
            window.scrollTo(0, parseInt(scrollPosition));
        }
        
        // Restore active tab if applicable
        const activeTab = sessionStorage.getItem('activeTab');
        if (activeTab) {
            const tabButton = document.querySelector(`[data-tab="${activeTab}"]`);
            if (tabButton) {
                tabButton.click();
            }
        }
    }
    
    /**
     * Start periodic checks to ensure synchronization
     */
    startPeriodicChecks() {
        // Check every 10 seconds
        setInterval(() => {
            this.checkAllSystems();
        }, 10000);
    }
    
    /**
     * Check if all systems are still functional
     */
    checkAllSystems() {
        // Check wallet system
        if (window.cispWallet && typeof window.cispWallet.isWalletConnected === 'function') {
            const walletConnected = window.cispWallet.isWalletConnected();
            
            // If wallet shows connected but we don't have a current wallet address, fix it
            if (walletConnected && !this.getCurrentWallet()) {
                this.log('Wallet inconsistency detected, fixing...');
                if (window.improvedWalletSync) {
                    window.improvedWalletSync.syncWallet(true);
                }
            }
        }
        
        // Ensure NFT system is working
        if (window.nftSystem && window.cispWallet?.currentWallet) {
            const nfts = window.nftSystem.getNFTsByOwner(window.cispWallet.currentWallet.address);
            if (Array.isArray(nfts)) {
                this.log(`NFT system check: User has ${nfts.length} NFTs`);
            }
        }
    }
    
    /**
     * Get current wallet from available sources
     */
    getCurrentWallet() {
        if (window.improvedWalletSync && typeof window.improvedWalletSync.getCurrentWallet === 'function') {
            return window.improvedWalletSync.getCurrentWallet();
        }
        
        if (window.cispWallet) {
            if (typeof window.cispWallet.getCurrentWallet === 'function') {
                return window.cispWallet.getCurrentWallet();
            }
            return window.cispWallet.currentWallet;
        }
        
        return null;
    }
    
    /**
     * Format address for display
     */
    formatAddress(address) {
        if (!address) return '';
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    }
    
    /**
     * Logging with prefix
     */
    log(message) {
        if (this.debug) {
            console.log(`[GlobalCoord] ${message}`);
        }
    }
}

// Initialize global coordination system
const globalCoordination = new GlobalCoordination();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    globalCoordination.init();
    
    // Make globally available
    window.globalCoordination = globalCoordination;
    
    // Add special classes for animation
    document.body.classList.add('cosmic-animated');
    
    // Dispatch an event that can be listened for
    document.dispatchEvent(new CustomEvent('coordination:ready'));
});

// Expose coordination to global scope
window.globalCoordination = globalCoordination; 