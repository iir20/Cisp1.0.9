// Advanced Mining Logic for CISP Blockchain
class MiningSystem {
    constructor() {
        this.mining = false;
        this.difficulty = 4;
        this.blockReward = 50;
        this.hashRate = 0;
        this.totalMined = 0;
        this.miningPower = 1;
        this.upgradeLevel = 0;
        this.isInitialized = false;
        this.miningInterval = null;
        this.hashCalculationTime = 1000; // ms between hash calculations
        this.lastRewardTime = 0;
        this.minRewardInterval = 30000; // minimum 30 seconds between rewards
        
        // Element references
        this.miningContainer = null;
        this.hashRateDisplay = null;
        this.totalMinedDisplay = null;
        this.miningPowerDisplay = null;
        this.startMiningBtn = null;
        this.stopMiningBtn = null;
        this.upgradeMiningBtn = null;
    }

    initialize() {
        try {
            console.log('Initializing mining system...');
            
            // Check if already initialized
            if (this.isInitialized) {
                console.log('Mining system already initialized');
                return true;
            }
            
            // Check if blockchain and wallet system are available
            if (!window.blockchain) {
                console.warn('Mining system: Blockchain not available, skipping initialization');
                return false;
            }

            // Try to initialize UI if we're on a page with mining UI elements
            this.initializeUI();
            
            // Load mining stats even if UI isn't available
            this.loadMiningStats();
            
            // Set up listeners for wallet changes
            this.setupWalletListeners();
            
            // Mark as initialized
            this.isInitialized = true;
            console.log('Mining system initialized successfully');
            return true;
        } catch (error) {
            console.error('Error initializing mining system:', error);
            return false;
        }
    }

    initializeUI() {
        try {
            // Get references to mining UI elements
            this.miningContainer = document.getElementById('mining-container');
            
            if (!this.miningContainer) {
                console.log('Mining UI not available on this page');
                return false;
            }
            
            console.log('Setting up mining UI elements');
            
            // Get all the mining UI elements
            this.hashRateDisplay = document.getElementById('hashrate-display');
            this.totalMinedDisplay = document.getElementById('total-mined-display');
            this.miningPowerDisplay = document.getElementById('mining-power-display');
            this.startMiningBtn = document.getElementById('start-mining-btn');
            this.stopMiningBtn = document.getElementById('stop-mining-btn');
            this.upgradeMiningBtn = document.getElementById('upgrade-mining-btn');
            
            // Set up event listeners if elements exist
            if (this.startMiningBtn) {
                this.startMiningBtn.addEventListener('click', () => this.startMining());
            }
            
            if (this.stopMiningBtn) {
                this.stopMiningBtn.addEventListener('click', () => this.stopMining());
            }
            
            if (this.upgradeMiningBtn) {
                this.upgradeMiningBtn.addEventListener('click', () => this.upgradeMiningPower());
            }
            
            // Update UI with current stats
            this.updateUI();
            
            return true;
        } catch (error) {
            console.error('Error initializing mining UI:', error);
            return false;
        }
    }

    loadMiningStats() {
        try {
            const savedStats = localStorage.getItem('mining_stats');
            if (savedStats) {
                const stats = JSON.parse(savedStats);
                this.totalMined = stats.totalMined || 0;
                this.miningPower = stats.miningPower || 1;
                this.upgradeLevel = stats.upgradeLevel || 0;
                console.log('Loaded mining stats:', stats);
            }
        } catch (error) {
            console.error('Error loading mining stats:', error);
        }
    }

    saveMiningStats() {
        try {
            const stats = {
                totalMined: this.totalMined,
                miningPower: this.miningPower,
                upgradeLevel: this.upgradeLevel,
                lastSaved: Date.now()
            };
            localStorage.setItem('mining_stats', JSON.stringify(stats));
        } catch (error) {
            console.error('Error saving mining stats:', error);
        }
    }

    updateUI() {
        try {
            // Update UI elements if they exist
            if (this.hashRateDisplay) {
                this.hashRateDisplay.textContent = this.hashRate.toFixed(2) + ' H/s';
            }
            
            if (this.totalMinedDisplay) {
                this.totalMinedDisplay.textContent = this.totalMined.toFixed(2) + ' CIS';
            }
            
            if (this.miningPowerDisplay) {
                this.miningPowerDisplay.textContent = this.miningPower.toFixed(2) + 'x';
            }
            
            // Update button states
            if (this.startMiningBtn && this.stopMiningBtn) {
                if (this.mining) {
                    this.startMiningBtn.style.display = 'none';
                    this.stopMiningBtn.style.display = 'inline-block';
                } else {
                    this.startMiningBtn.style.display = 'inline-block';
                    this.stopMiningBtn.style.display = 'none';
                }
            }
            
            // Update upgrade button cost
            if (this.upgradeMiningBtn) {
                const upgradeCost = this.getUpgradeCost();
                this.upgradeMiningBtn.textContent = `Upgrade (${upgradeCost} xCIS)`;
                
                // Check if user can afford upgrade
                const canAfford = this.canAffordUpgrade();
                this.upgradeMiningBtn.disabled = !canAfford;
                if (canAfford) {
                    this.upgradeMiningBtn.classList.remove('disabled');
                } else {
                    this.upgradeMiningBtn.classList.add('disabled');
                }
            }
        } catch (error) {
            console.error('Error updating mining UI:', error);
        }
    }

    setupWalletListeners() {
        try {
            // Listen for wallet changes
            window.addEventListener('walletChanged', (event) => {
                console.log('Wallet changed, updating mining UI');
                this.updateUI();
            });
        } catch (error) {
            console.error('Error setting up wallet listeners:', error);
        }
    }

    setupMiningInterval() {
        // Clear any existing interval
        if (this.miningInterval) {
            clearInterval(this.miningInterval);
        }
        
        // Set up new interval based on mining power
        const interval = Math.max(100, Math.floor(this.hashCalculationTime / this.miningPower));
        
        this.miningInterval = setInterval(() => {
            this.simulateMining();
        }, interval);
        
        console.log(`Mining interval set up: ${interval}ms`);
    }

    startMining() {
        try {
            // Check if wallet is connected
            if (!window.cispWallet || !window.cispWallet.isWalletConnected()) {
                if (window.notifications) {
                    window.notifications.show('warning', 'Please connect your wallet first');
                }
                console.log('Cannot start mining: wallet not connected');
                return false;
            }
            
            if (this.mining) {
                console.log('Mining already in progress');
                return false;
            }
            
            console.log('Starting mining process...');
            this.mining = true;
            this.hashRate = 0;
            
            // Set up mining interval
            this.setupMiningInterval();
            
            // Update UI
            this.updateUI();
            
            if (window.notifications) {
                window.notifications.show('success', 'Mining started');
            }
            
            return true;
        } catch (error) {
            console.error('Error starting mining:', error);
            return false;
        }
    }

    stopMining() {
        try {
            if (!this.mining) {
                console.log('Mining not in progress');
                return false;
            }
            
            console.log('Stopping mining process...');
            this.mining = false;
            
            // Clear mining interval
            if (this.miningInterval) {
                clearInterval(this.miningInterval);
                this.miningInterval = null;
            }
            
            // Update UI
            this.updateUI();
            
            if (window.notifications) {
                window.notifications.show('info', 'Mining stopped');
            }
            
            return true;
        } catch (error) {
            console.error('Error stopping mining:', error);
            return false;
        }
    }

    simulateMining() {
        try {
            // Check if wallet is still connected
            if (!window.cispWallet || !window.cispWallet.isWalletConnected()) {
                this.stopMining();
                if (window.notifications) {
                    window.notifications.show('error', 'Mining stopped: wallet disconnected');
                }
                return;
            }
            
            // Generate a random hash
            const randomHash = Math.random().toString(36).substring(2, 15);
            
            // Calculate hashrate (simulated)
            this.hashRate = this.miningPower * (Math.random() * 2 + 8); // 8-10 H/s per mining power
            
            // Check if we found a block (simplified mining simulation)
            const now = Date.now();
            const timeSinceLastReward = now - this.lastRewardTime;
            
            // Only give rewards if enough time has passed since last reward
            if (timeSinceLastReward >= this.minRewardInterval) {
                // Chance to find a block increases with mining power but remains relatively rare
                const chanceToFindBlock = (0.01 * this.miningPower) / this.difficulty; // 1% base chance per mining power
                const randomValue = Math.random();
                
                if (randomValue < chanceToFindBlock) {
                    this.processBlockReward();
                    this.lastRewardTime = now;
                }
            }
            
            // Update UI occasionally to avoid performance issues
            if (Math.random() < 0.1) { // Update UI roughly every 10 iterations
                this.updateUI();
            }
        } catch (error) {
            console.error('Error in mining simulation:', error);
        }
    }

    processBlockReward() {
        try {
            console.log('Block found! Processing reward...');
            
            // Get current wallet address
            const currentWallet = window.cispWallet.getCurrentWallet();
            if (!currentWallet) {
                console.error('No wallet connected, cannot process reward');
                return;
            }
            
            const walletAddress = currentWallet.address;
            
            // Calculate block reward (base reward * mining power)
            const reward = this.blockReward * (1 + (this.miningPower * 0.1));
            console.log(`Calculated reward: ${reward} CIS for wallet ${walletAddress}`);
            
            // Update total mined
            this.totalMined += reward;
            
            // Add reward to blockchain balance
            if (window.blockchain) {
                // Use the appropriate method to add mining reward
                if (window.blockchain.grantInitialTokens) {
                    window.blockchain.grantInitialTokens(walletAddress, reward);
                    console.log(`Granted ${reward} CIS to ${walletAddress} using grantInitialTokens`);
                }
                else if (window.blockchain.createTransaction) {
                    window.blockchain.createTransaction('MINING_REWARD', walletAddress, reward, 'mining');
                    console.log(`Granted ${reward} CIS to ${walletAddress} using createTransaction`);
                }
            }
            
            // Save mining stats
            this.saveMiningStats();
            
            // Notify user
            if (window.notifications) {
                window.notifications.show('success', `Block found! Earned ${reward.toFixed(2)} CIS`);
            }
            
            // Update UI
            this.updateUI();
        } catch (error) {
            console.error('Error processing block reward:', error);
        }
    }

    upgradeMiningPower() {
        try {
            // Check if wallet is connected
            if (!window.cispWallet || !window.cispWallet.isWalletConnected()) {
                if (window.notifications) {
                    window.notifications.show('warning', 'Please connect your wallet first');
                }
                console.log('Cannot upgrade mining power: wallet not connected');
                return false;
            }
            
            // Get upgrade cost
            const upgradeCost = this.getUpgradeCost();
            
            // Check if user can afford upgrade
            if (!this.canAffordUpgrade()) {
                if (window.notifications) {
                    window.notifications.show('error', `Not enough xCIS for upgrade. Need ${upgradeCost} xCIS`);
                }
                console.log(`Cannot afford upgrade: needs ${upgradeCost} xCIS`);
                return false;
            }
            
            console.log(`Upgrading mining power. Cost: ${upgradeCost} xCIS`);
            
            // Deduct upgrade cost
            const currentWallet = window.cispWallet.getCurrentWallet();
            const walletAddress = currentWallet.address;
            
            // Create a transaction to deduct xCIS
            if (window.blockchain) {
                const xCISBalance = window.blockchain.getBalance(walletAddress, 'xCIS');
                window.blockchain.updateBalance(walletAddress, -upgradeCost, 'xCIS');
                console.log(`Deducted ${upgradeCost} xCIS from ${walletAddress}. New balance: ${xCISBalance - upgradeCost}`);
            }
            
            // Increase mining power
            this.upgradeLevel++;
            this.miningPower = 1 + (this.upgradeLevel * 0.5); // Each upgrade adds 0.5x mining power
            
            // Save mining stats
            this.saveMiningStats();
            
            // Update UI
            this.updateUI();
            
            // Notify user
            if (window.notifications) {
                window.notifications.show('success', `Mining power upgraded to ${this.miningPower.toFixed(2)}x`);
            }
            
            // If mining is in progress, update the interval
            if (this.mining) {
                this.setupMiningInterval();
            }
            
            return true;
        } catch (error) {
            console.error('Error upgrading mining power:', error);
            return false;
        }
    }

    getUpgradeCost() {
        // Calculate cost based on current upgrade level: 50 * (level + 1)^2
        return 50 * Math.pow(this.upgradeLevel + 1, 2);
    }

    canAffordUpgrade() {
        try {
            const upgradeCost = this.getUpgradeCost();
            
            if (!window.cispWallet || !window.cispWallet.isWalletConnected()) {
                return false;
            }
            
            const currentWallet = window.cispWallet.getCurrentWallet();
            if (!currentWallet || !currentWallet.balance) {
                return false;
            }
            
            const xCISBalance = currentWallet.balance.xCIS || 0;
            return xCISBalance >= upgradeCost;
        } catch (error) {
            console.error('Error checking if can afford upgrade:', error);
            return false;
        }
    }
}

// Create global instance
window.miningSystem = new MiningSystem();

// Initialize when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.miningSystem.initialize();
});
