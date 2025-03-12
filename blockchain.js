/**
 * Cosmic Space Protocol Blockchain (CISP)
 * A lightweight blockchain implementation for the Cosmic Space Protocol
 */

class Block {
    constructor(index, timestamp, transactions, previousHash = '') {
        this.index = index;
        this.timestamp = timestamp;
        this.transactions = transactions;
        this.previousHash = previousHash;
        this.nonce = 0;
        this.hash = '';
    }

    async calculateHash() {
        const data = this.index + 
            this.previousHash + 
            this.timestamp + 
            JSON.stringify(this.transactions) + 
            this.nonce;
        return await SHA256(data);
    }

    async mineBlock(difficulty) {
        const target = Array(difficulty + 1).join("0");
        while (!this.hash || !this.hash.startsWith(target)) {
            this.nonce++;
            this.hash = await this.calculateHash();
        }
        return this.hash;
    }
}

class Transaction {
    constructor(fromAddress, toAddress, amount, type = 'TRANSFER') {
        this.fromAddress = fromAddress;
        this.toAddress = toAddress;
        this.amount = amount;
        this.type = type; // TRANSFER, MINT, REWARD, NFT_MINT
        this.timestamp = Date.now();
        this.signature = '';
    }

    calculateHash() {
        return SHA256(
            this.fromAddress +
            this.toAddress +
            this.amount +
            this.type +
            this.timestamp
        ).toString();
    }

    signTransaction(signingKey) {
        // In a real implementation, this would use proper key signing
        // For now we'll use a simplified approach
        if (!signingKey) {
            throw new Error('No signing key provided');
        }

        const hashTx = this.calculateHash();
        // In a real implementation, we would use the private key to sign
        this.signature = SHA256(hashTx + signingKey).toString();
    }

    isValid() {
        // Minting and reward transactions don't need a signature
        if (this.fromAddress === null) return true;

        if (!this.signature || this.signature.length === 0) {
            throw new Error('No signature in this transaction');
        }

        // In a real implementation, we would verify the signature with the public key
        // For now, we'll just check if it exists
        return true;
    }
}

class Blockchain {
    constructor() {
        this.balances = new Map();
        this.transactions = [];
        this.addresses = {};
        this.nftCollections = {};
        this.difficulty = 2;
        this.miningReward = 10;
        this.conversionRate = 0.1; // 1 xCIS = 0.1 CIS
        
        // Mining configuration
        this.maxSupplyXCIS = 21000000; // 21 million xCIS
        this.circulatingSupplyXCIS = 0;
        this.blockReward = 50; // Initial block reward
        this.halveningInterval = 210000; // Number of blocks between halvings
        this.lastBlockTime = Date.now();
        this.blockTime = 30000; // Target block time in milliseconds (30 seconds)
        
        // Load state from localStorage if available
        this.loadState();
    }

    async init() {
        // Load from localStorage if exists
        const savedData = localStorage.getItem('blockchain_data');
        if (savedData) {
            const data = JSON.parse(savedData);
            this.balances = new Map(data.balances);
            this.transactions = data.transactions;
        }
    }

    async addBalance(address, token, amount) {
        if (!address) {
            throw new Error('Address is required');
        }
        
        if (!token) {
            throw new Error('Token type is required');
        }
        
        if (isNaN(amount) || amount <= 0) {
            throw new Error('Amount must be a positive number');
        }
        
        // Create address entry if it doesn't exist
        if (!this.balances.has(address)) {
            this.balances.set(address, {});
        }
        
        const addressBalances = this.balances.get(address);
        
        // Initialize token balance if it doesn't exist
        if (!addressBalances[token]) {
            addressBalances[token] = 0;
        }
        
        // Add the amount
        addressBalances[token] += amount;
        
        // Save to localStorage
        this._save();
        
        // Create a transaction record for this balance addition
        const transaction = new Transaction(
            null, // From null for minting/airdrop transactions
            address,
            amount,
            'MINT' // This is a minting transaction
        );
        
        // Add transaction to history
        this.transactions.push(transaction);
        
        // Update circulating supply for xCIS
        if (token === 'xCIS') {
            this.circulatingSupplyXCIS += amount;
        }
        
        // Emit event for UI updates
        const event = new CustomEvent('balance:updated', {
            detail: {
                address,
                token,
                newBalance: addressBalances[token]
            }
        });
        document.dispatchEvent(event);
        
        return addressBalances[token];
    }

    getBalance(address, token) {
        if (!address || !token) {
            return 0;
        }
        
        const addressBalances = this.balances.get(address);
        if (!addressBalances) {
            return 0;
        }
        
        return addressBalances[token] || 0;
    }

    _save() {
        try {
            // Save balances
            localStorage.setItem('cisp_balances', JSON.stringify(Array.from(this.balances.entries())));
            
            // Save transactions (keep only the last 100 for performance)
            const recentTransactions = this.transactions.slice(-100);
            localStorage.setItem('cisp_transactions', JSON.stringify(recentTransactions));
            
            // Save other state
            localStorage.setItem('cisp_state', JSON.stringify({
                circulatingSupplyXCIS: this.circulatingSupplyXCIS,
                lastBlockTime: this.lastBlockTime,
                difficulty: this.difficulty
            }));
        } catch (error) {
            console.error('Error saving blockchain state:', error);
        }
    }

    loadState() {
        try {
            // Load balances
            const savedBalances = localStorage.getItem('cisp_balances');
            if (savedBalances) {
                this.balances = new Map(JSON.parse(savedBalances));
            }
            
            // Load transactions
            const savedTransactions = localStorage.getItem('cisp_transactions');
            if (savedTransactions) {
                this.transactions = JSON.parse(savedTransactions);
            }
            
            // Load other state
            const savedState = localStorage.getItem('cisp_state');
            if (savedState) {
                const state = JSON.parse(savedState);
                this.circulatingSupplyXCIS = state.circulatingSupplyXCIS || 0;
                this.lastBlockTime = state.lastBlockTime || Date.now();
                this.difficulty = state.difficulty || 2;
            }
        } catch (error) {
            console.error('Error loading blockchain state:', error);
            // Initialize with defaults if loading fails
            this.balances = new Map();
            this.transactions = [];
            this.circulatingSupplyXCIS = 0;
            this.lastBlockTime = Date.now();
            this.difficulty = 2;
        }
    }

    async grantInitialTokens(address, amount = 100) {
        if (!address) {
            console.error('No address provided to grantInitialTokens');
            return false;
        }
        
        console.log(`Granting ${amount} xCIS to ${address}`);
        
        try {
            // Create a transaction for the initial tokens
            const txId = 'TX' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5).toUpperCase();
            
            // Record the transaction in pending transactions
            const tx = {
                txId: txId,
                timestamp: Date.now(),
                fromAddress: 'SYSTEM_FAUCET',
                toAddress: address,
                amount: amount,
                type: 'initial_grant',
                status: 'confirmed',
                confirmations: 1
            };
            
            this.pendingTransactions.push(tx);
            
            // Add to user's balance directly
            await this.addBalance(address, 'xCIS', amount);
            
            // Update circulating supply
            this.circulatingSupplyXCIS += amount;
            
            // Save state
            this._save();
            
            console.log(`Successfully granted ${amount} xCIS to ${address}`);
            
            // If wallet system exists, also update the wallet object
            if (window.cispWallet) {
                const wallet = window.cispWallet.getWalletByAddress ? 
                    window.cispWallet.getWalletByAddress(address) : 
                    window.cispWallet.wallets?.get(address);
                    
                if (wallet) {
                    // Ensure wallet has a balance object
                    if (!wallet.balance) wallet.balance = {};
                    
                    // Add to existing balance or set initial balance
                    wallet.balance.xCIS = (wallet.balance.xCIS || 0) + amount;
                    
                    // Save wallet state
                    if (typeof window.cispWallet._save === 'function') {
                        window.cispWallet._save();
                    }
                    
                    // Broadcast wallet change if this is the current wallet
                    if (window.cispWallet.currentWallet?.address === address && 
                        typeof window.cispWallet._broadcastWalletChange === 'function') {
                        window.cispWallet._broadcastWalletChange();
                    }
                    
                    console.log(`Updated wallet object for ${address} with balance: ${wallet.balance.xCIS} xCIS`);
                }
            }
            
            return true;
        } catch (error) {
            console.error(`Error granting initial tokens:`, error);
            return false;
        }
    }

    async processMinedBlock(block, minerAddress) {
        try {
            // Validate block
            if (!block || !block.hash || !minerAddress) {
                throw new Error('Invalid block data');
            }

            // Calculate reward based on current difficulty
            const reward = 0.1; // Base reward
            
            // Update miner's balance
            const currentBalance = this.getBalanceXCIS(minerAddress);
            this.addBalance(minerAddress, 'xCIS', currentBalance + reward);

            return {
                success: true,
                reward: reward,
                newDifficulty: 2.0 // Fixed difficulty for now
            };
        } catch (error) {
            console.error('Error processing block:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

// Export core classes first
window.Block = Block;
window.Transaction = Transaction;
window.Blockchain = Blockchain;
window.SHA256 = SHA256;

// Initialize blockchain and wallet manager
async function initializeBlockchain() {
    try {
        console.log('Initializing blockchain and wallet system...');
        
        // Create blockchain instance if not exists
        if (!window.blockchain) {
            window.blockchain = new Blockchain();
        }
        
        // Initialize blockchain
        await window.blockchain.init();
        
        // Make blockchain globally available
        window.cispChain = window.blockchain;
        
        console.log('Blockchain initialized successfully');
        
        // Dispatch initialization complete event
        window.dispatchEvent(new CustomEvent('blockchainInitialized'));
        
        return true;
    } catch (error) {
        console.error('Error during initialization:', error);
        window.dispatchEvent(new CustomEvent('blockchainInitError', { detail: error }));
        throw error;
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initializeBlockchain());
} else {
    initializeBlockchain();
}

// SHA-256 hashing function implementation
async function SHA256(data) {
    try {
        // Convert data to string if it's not already
        const dataString = typeof data === 'string' ? data : JSON.stringify(data);
        
        // Use browser's crypto API
        const encoder = new TextEncoder();
        const dataBuffer = encoder.encode(dataString);
        const hashBuffer = await window.crypto.subtle.digest('SHA-256', dataBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (error) {
        console.error('Error in SHA256:', error);
        // Fallback to simple hash if crypto API fails
        return fallbackSHA256(data);
    }
}

function fallbackSHA256(data) {
    const dataString = typeof data === 'string' ? data : JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < dataString.length; i++) {
        const char = dataString.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16).padStart(64, '0');
}

// Wallet Management Class
class WalletManager {
    constructor() {
        this.wallets = {};
        this.currentWallet = null;
        this.loadWallets();
        
        // Bind methods to instance
        this.getWallets = this.getWallets.bind(this);
        this.getCurrentWallet = this.getCurrentWallet.bind(this);
        this.createWallet = this.createWallet.bind(this);
        this.setCurrentWallet = this.setCurrentWallet.bind(this);
        this.disconnectWallet = this.disconnectWallet.bind(this);
    }

    loadWallets() {
        try {
            const savedWallets = localStorage.getItem('CISP_Wallets');
            if (savedWallets) {
                this.wallets = JSON.parse(savedWallets);
            }
            
            const currentWalletAddress = localStorage.getItem('CISP_CurrentWallet');
            if (currentWalletAddress) {
                this.currentWallet = this.wallets[currentWalletAddress];
            }
            
            console.log('Wallets loaded:', Object.keys(this.wallets).length);
        } catch (error) {
            console.error('Error loading wallets:', error);
            this.wallets = {};
            this.currentWallet = null;
        }
    }

    getWallets() {
        return Object.values(this.wallets);
    }

    getCurrentWallet() {
        return this.currentWallet;
    }

    async createWallet(name) {
        try {
            console.log('Starting wallet creation process');
            if (!window.cispChain) {
                throw new Error('Blockchain not initialized');
            }

            const walletData = await window.cispChain.createWallet(name);
            if (!walletData.success) {
                throw new Error(walletData.error || 'Failed to create wallet');
            }

            const wallet = {
                address: walletData.address,
                name: walletData.name,
                balances: walletData.balance
            };

            this.wallets[wallet.address] = wallet;
            this.currentWallet = wallet;
            this.saveWallets();

            console.log('Wallet created successfully:', wallet);

            // Dispatch wallet creation event
            const event = new CustomEvent('walletCreated', {
                detail: walletData
            });
            window.dispatchEvent(event);

            return walletData;
        } catch (error) {
            console.error('Error creating wallet:', error);
            throw error;
        }
    }

    saveWallets() {
        try {
            localStorage.setItem('CISP_Wallets', JSON.stringify(this.wallets));
            if (this.currentWallet) {
                localStorage.setItem('CISP_CurrentWallet', this.currentWallet.address);
            } else {
                localStorage.removeItem('CISP_CurrentWallet');
            }
            console.log('Wallets saved to localStorage');
        } catch (error) {
            console.error('Error saving wallets:', error);
        }
    }

    setCurrentWallet(address) {
        if (!this.wallets[address]) {
            throw new Error('Wallet not found');
        }
        this.currentWallet = this.wallets[address];
        this.saveWallets();

        // Dispatch wallet changed event
        const event = new CustomEvent('walletChanged', {
            detail: this.currentWallet
        });
        window.dispatchEvent(event);
    }

    disconnectWallet() {
        this.currentWallet = null;
        this.saveWallets();

        // Dispatch wallet changed event
        const event = new CustomEvent('walletChanged', {
            detail: null
        });
        window.dispatchEvent(event);
    }
}

// Make the blockchain instance globally available
window.blockchain = window.blockchain || new Blockchain(); 