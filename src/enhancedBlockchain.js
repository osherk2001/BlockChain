const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const EnhancedTransaction = require('./models/enhancedTransaction');
const EnhancedBlock = require('./models/enhancedBlock');
const { EnhancedBloomFilter } = require('./utils/enhancedBloomFilter');
const { EnhancedMerkleTree } = require('./utils/enhancedMerkleTree');
const { LightWallet } = require('./utils/lightWallet');

/**
 * Enhanced Blockchain Implementation
 * Integrates all features: Bloom Filter, Merkle Tree, Light Wallet, SegWit, EIP-1559, Coin Burning
 */
class EnhancedBlockchain {
  /**
   * Create a new enhanced blockchain
   * @param {Object} config - Blockchain configuration
   */
  constructor(config = {}) {
    this.chain = [];
    this.pendingTransactions = [];
    this.mempool = new Map();
    this.balances = new Map();
    this.nonces = new Map();
    
    // Configuration
    this.difficulty = config.difficulty || 2;
    this.blockReward = config.blockReward || 50;
    this.initialBalance = config.initialBalance || 300;
    this.maxTransactionsPerBlock = 4;
    
    // Enhanced features
    this.bloomFilter = new EnhancedBloomFilter(4096, 5, 'BlockchainBloomFilter');
    this.merkleTree = new EnhancedMerkleTree([], 'BlockchainMerkleTree');
    this.lightWallets = new Map();
    
    // Coin burning tracking
    this.totalCoinsBurned = 0;
    this.totalCoinsMined = 0;
    this.totalCoinsInNetwork = 0;
    
    // Initialize wallets
    this.wallets = new Map();
    this._initializeWallets();
    
    // Create genesis block
    this._createGenesisBlock();
    
    // Load initial transactions
    this._loadInitialTransactions();
  }

  /**
   * Initialize wallets with pre-mined coins
   */
  _initializeWallets() {
    const walletAddresses = [
      '0x1111111111111111111111111111111111111111',
      '0x2222222222222222222222222222222222222222',
      '0x3333333333333333333333333333333333333333',
      '0x4444444444444444444444444444444444444444',
      '0x5555555555555555555555555555555555555555',
      '0x6666666666666666666666666666666666666666',
      '0x7777777777777777777777777777777777777777',
      '0x8888888888888888888888888888888888888888',
      '0x9999999999999999999999999999999999999999',
      '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
    ];

    walletAddresses.forEach(address => {
      this.balances.set(address, this.initialBalance);
      this.nonces.set(address, 0);
      this.wallets.set(address, {
        address: address,
        balance: this.initialBalance,
        nonce: 0
      });
    });

    this.totalCoinsInNetwork = walletAddresses.length * this.initialBalance;
    this.totalCoinsMined = this.totalCoinsInNetwork;

    console.log(`[EnhancedBlockchain] 💰 Initialized ${walletAddresses.length} wallets with ${this.initialBalance} KIKI each`);
    console.log(`   Total coins in network: ${this.totalCoinsInNetwork} KIKI`);
  }

  /**
   * Create genesis block
   */
  _createGenesisBlock() {
    const genesisBlock = new EnhancedBlock({
      index: 0,
      previousHash: '0',
      transactions: [],
      timestamp: Date.now(),
      difficulty: this.difficulty,
      minerAddress: '0x0000000000000000000000000000000000000000'
    });

    // Mine genesis block
    genesisBlock.mine();
    this.chain.push(genesisBlock);

    console.log(`[EnhancedBlockchain] 🏗️  Genesis block created and mined`);
    console.log(`   Hash: ${genesisBlock.hash}`);
  }

  /**
   * Load initial transactions from JSON file
   */
  _loadInitialTransactions() {
    try {
      const transactionsPath = path.join(__dirname, '../data/initial-transactions.json');
      const data = JSON.parse(fs.readFileSync(transactionsPath, 'utf8'));
      
      console.log(`[EnhancedBlockchain] 📂 Loading ${data.transactions.length} initial transactions from JSON file`);
      
      data.transactions.forEach(txData => {
        // Create enhanced transaction without private key (for demo purposes)
        const transaction = new EnhancedTransaction({
          from: txData.from,
          to: txData.to,
          value: txData.value,
          baseFee: txData.baseFee,
          priorityFee: txData.priorityFee,
          nonce: txData.nonce,
          data: txData.data
        });

        // Generate a hash for the transaction (since it's not signed)
        if (!transaction.hash) {
          transaction.hash = crypto.createHash('sha256')
            .update(JSON.stringify(transaction.getWitnessTransaction()))
            .digest('hex');
        }

        // Add to mempool
        this.addTransaction(transaction);
      });

      console.log(`[EnhancedBlockchain] ✅ Loaded ${this.pendingTransactions.length} transactions into mempool`);
      
    } catch (error) {
      console.error(`[EnhancedBlockchain] ❌ Error loading initial transactions: ${error.message}`);
    }
  }

  /**
   * Get latest block
   * @returns {EnhancedBlock} - Latest block
   */
  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  /**
   * Add transaction to mempool
   * @param {EnhancedTransaction} transaction - Transaction to add
   * @returns {boolean} - True if transaction was added
   */
  addTransaction(transaction) {
    // Validate transaction
    const validation = transaction.validate(Object.fromEntries(this.balances));
    
    if (!validation.isValid) {
      console.log(`[EnhancedBlockchain] ❌ Transaction validation failed: ${validation.errors.join(', ')}`);
      return false;
    }

    if (validation.warnings.length > 0) {
      console.log(`[EnhancedBlockchain] ⚠️  Transaction warnings: ${validation.warnings.join(', ')}`);
    }

    // Check nonce
    const expectedNonce = this.nonces.get(transaction.from) || 0;
    if (transaction.nonce !== expectedNonce) {
      console.log(`[EnhancedBlockchain] ❌ Invalid nonce: expected ${expectedNonce}, got ${transaction.nonce}`);
      return false;
    }

    // Ensure transaction has a hash
    if (!transaction.hash) {
      transaction.hash = crypto.createHash('sha256')
        .update(JSON.stringify(transaction.getWitnessTransaction()))
        .digest('hex');
    }

    // Add to mempool
    this.pendingTransactions.push(transaction);
    this.mempool.set(transaction.hash, transaction);
    
    // Update bloom filter
    this.bloomFilter.add(transaction.hash);
    
    // Update nonce
    this.nonces.set(transaction.from, expectedNonce + 1);

    console.log(`[EnhancedBlockchain] ✅ Transaction added to mempool: ${transaction.hash.substring(0, 16)}...`);
    return true;
  }

  /**
   * Mine a new block
   * @param {string} minerAddress - Address of the miner
   * @returns {EnhancedBlock|null} - Mined block or null if failed
   */
  mineBlock(minerAddress) {
    if (this.pendingTransactions.length === 0) {
      console.log(`[EnhancedBlockchain] ⚠️  No transactions to mine, creating empty block`);
    }

    // Select transactions for the block (max 4)
    const selectedTransactions = this.pendingTransactions.slice(0, this.maxTransactionsPerBlock);
    
    // Create new block
    const newBlock = new EnhancedBlock({
      index: this.chain.length,
      previousHash: this.getLatestBlock().hash,
      transactions: selectedTransactions,
      timestamp: Date.now(),
      difficulty: this.difficulty,
      minerAddress: minerAddress
    });

    // Mine the block
    if (newBlock.mine()) {
      // Add block to chain
      this.chain.push(newBlock);
      
      // Update balances
      this._updateBalances(newBlock);
      
      // Remove mined transactions from mempool
      selectedTransactions.forEach(tx => {
        this.pendingTransactions = this.pendingTransactions.filter(t => t.hash !== tx.hash);
        this.mempool.delete(tx.hash);
      });

      // Update bloom filter and merkle tree
      this._updateEnhancedFeatures(newBlock);
      
      console.log(`[EnhancedBlockchain] ✅ Block ${newBlock.index} mined and added to chain`);
      return newBlock;
    }

    return null;
  }

  /**
   * Update balances after mining a block
   * @param {EnhancedBlock} block - Mined block
   */
  _updateBalances(block) {
    const fees = block.getFees();
    
    // Process transactions
    block.transactions.forEach(tx => {
      // Deduct from sender
      const senderBalance = this.balances.get(tx.from) || 0;
      this.balances.set(tx.from, senderBalance - tx.totalCost);
      
      // Add to recipient
      const recipientBalance = this.balances.get(tx.to) || 0;
      this.balances.set(tx.to, recipientBalance + tx.value);
      
      // Update wallet objects
      if (this.wallets.has(tx.from)) {
        this.wallets.get(tx.from).balance = this.balances.get(tx.from);
      }
      if (this.wallets.has(tx.to)) {
        this.wallets.get(tx.to).balance = this.balances.get(tx.to);
      }
    });

    // Add block reward and priority fees to miner
    const minerReward = fees.totalMinerReward;
    const minerBalance = this.balances.get(block.minerAddress) || 0;
    this.balances.set(block.minerAddress, minerBalance + minerReward);
    
    // Update total coins
    this.totalCoinsMined += fees.blockReward;
    this.totalCoinsBurned += fees.totalBurned;
    this.totalCoinsInNetwork = this.totalCoinsMined - this.totalCoinsBurned;

    console.log(`[EnhancedBlockchain] 💰 Balances updated:`);
    console.log(`   Miner reward: ${minerReward} KIKI`);
    console.log(`   Coins burned: ${fees.totalBurned} KIKI`);
    console.log(`   Total burned: ${this.totalCoinsBurned} KIKI`);
    console.log(`   Total mined: ${this.totalCoinsMined} KIKI`);
    console.log(`   Network supply: ${this.totalCoinsInNetwork} KIKI`);
  }

  /**
   * Update enhanced features (Bloom filter, Merkle tree)
   * @param {EnhancedBlock} block - Mined block
   */
  _updateEnhancedFeatures(block) {
    // Update bloom filter with transaction hashes
    const transactionHashes = block.transactions.map(tx => tx.hash);
    transactionHashes.forEach(hash => {
      this.bloomFilter.add(hash);
    });

    // Update merkle tree
    transactionHashes.forEach(hash => {
      this.merkleTree.addTransaction(hash);
    });

    // Update light wallets
    this.lightWallets.forEach(wallet => {
      wallet.updateBloomFilter(transactionHashes);
      wallet.updateMerkleTree(block.hash, transactionHashes, block.merkleRoot);
    });
  }

  /**
   * Get balance for an address
   * @param {string} address - Address to check
   * @returns {number} - Balance
   */
  getBalance(address) {
    return this.balances.get(address) || 0;
  }

  /**
   * Create a light wallet
   * @param {string} address - Wallet address
   * @param {string} name - Wallet name
   * @returns {LightWallet} - Created light wallet
   */
  createLightWallet(address, name) {
    const wallet = new LightWallet(address, name);
    this.lightWallets.set(address, wallet);
    
    // Initialize with current blockchain state
    const allTransactionHashes = Array.from(this.mempool.keys());
    wallet.updateBloomFilter(allTransactionHashes);
    
    console.log(`[EnhancedBlockchain] 💡 Light wallet created: ${name} (${address})`);
    return wallet;
  }

  /**
   * Check if transaction might be in bloom filter
   * @param {string} transactionHash - Transaction hash to check
   * @returns {boolean} - True if transaction might be present
   */
  mightContainTransaction(transactionHash) {
    return this.bloomFilter.mightContain(transactionHash);
  }

  /**
   * Verify transaction inclusion using Merkle proof
   * @param {string} transactionHash - Transaction hash to verify
   * @returns {Object} - Verification result
   */
  verifyTransactionInclusion(transactionHash) {
    return this.merkleTree.verifyTransactionInclusion(transactionHash);
  }

  /**
   * Validate the entire blockchain
   * @returns {boolean} - True if blockchain is valid
   */
  isChainValid() {
    for (let i = 1; i < this.chain.length; i++) {
      const currentBlock = this.chain[i];
      const previousBlock = this.chain[i - 1];

      // Check previous hash
      if (currentBlock.previousHash !== previousBlock.hash) {
        console.log(`[EnhancedBlockchain] ❌ Invalid previous hash at block ${i}`);
        return false;
      }

      // Check block hash
      if (!currentBlock.verifyHash()) {
        console.log(`[EnhancedBlockchain] ❌ Invalid block hash at block ${i}`);
        return false;
      }

      // Check proof of work
      if (!currentBlock.verifyProofOfWork()) {
        console.log(`[EnhancedBlockchain] ❌ Invalid proof of work at block ${i}`);
        return false;
      }

      // Check Merkle roots
      if (!currentBlock.verifyMerkleRoots()) {
        console.log(`[EnhancedBlockchain] ❌ Invalid Merkle roots at block ${i}`);
        return false;
      }
    }

    return true;
  }

  /**
   * Get blockchain statistics
   * @returns {Object} - Blockchain statistics
   */
  getStats() {
    return {
      chainLength: this.chain.length,
      pendingTransactions: this.pendingTransactions.length,
      mempoolSize: this.mempool.size,
      totalCoinsMined: this.totalCoinsMined,
      totalCoinsBurned: this.totalCoinsBurned,
      totalCoinsInNetwork: this.totalCoinsInNetwork,
      bloomFilterStats: this.bloomFilter.getStats(),
      merkleTreeStats: this.merkleTree.getStats(),
      lightWalletCount: this.lightWallets.size,
      walletCount: this.wallets.size
    };
  }

  /**
   * Print final summary
   */
  printFinalSummary() {
    console.log('\n🎉 ENHANCED BLOCKCHAIN FINAL SUMMARY');
    console.log('=====================================');
    
    // Wallet balances
    console.log('\n💰 Wallet Balances:');
    this.wallets.forEach((wallet, address) => {
      console.log(`   ${address}: ${wallet.balance} KIKI`);
    });

    // Network statistics
    const stats = this.getStats();
    console.log('\n📊 Network Statistics:');
    console.log(`   Total coins in network: ${stats.totalCoinsInNetwork} KIKI`);
    console.log(`   Total coins mined: ${stats.totalCoinsMined} KIKI`);
    console.log(`   Total coins burned: ${stats.totalCoinsBurned} KIKI`);
    console.log(`   Blockchain length: ${stats.chainLength} blocks`);
    console.log(`   Pending transactions: ${stats.pendingTransactions}`);
    console.log(`   Mempool size: ${stats.mempoolSize}`);
    console.log(`   Light wallets: ${stats.lightWalletCount}`);
    console.log(`   Regular wallets: ${stats.walletCount}`);

    // Enhanced features statistics
    console.log('\n🔧 Enhanced Features:');
    console.log(`   Bloom filter items: ${stats.bloomFilterStats.itemCount}`);
    console.log(`   Bloom filter false positive rate: ${(stats.bloomFilterStats.falsePositiveRate * 100).toFixed(4)}%`);
    console.log(`   Merkle tree leaves: ${stats.merkleTreeStats.leafCount}`);
    console.log(`   Merkle tree height: ${stats.merkleTreeStats.height}`);

    // Chain validation
    console.log('\n✅ Chain Validation:');
    console.log(`   Blockchain valid: ${this.isChainValid() ? 'YES' : 'NO'}`);

    console.log('\n🚀 Enhanced Blockchain implementation completed successfully!');
  }

  /**
   * Serialize blockchain to JSON
   * @returns {Object} - Serialized blockchain
   */
  toJSON() {
    return {
      chain: this.chain.map(block => block.toJSON()),
      pendingTransactions: this.pendingTransactions.map(tx => tx.toJSON()),
      balances: Object.fromEntries(this.balances),
      nonces: Object.fromEntries(this.nonces),
      totalCoinsMined: this.totalCoinsMined,
      totalCoinsBurned: this.totalCoinsBurned,
      totalCoinsInNetwork: this.totalCoinsInNetwork,
      bloomFilter: this.bloomFilter.toJSON(),
      merkleTree: this.merkleTree.toJSON(),
      stats: this.getStats()
    };
  }
}

module.exports = EnhancedBlockchain; 