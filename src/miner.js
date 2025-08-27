const Blockchain = require('./blockchain');
const Transaction = require('./models/transaction');
const CryptoUtils = require('./utils/crypto');

class Miner {
  /**
   * Create a new miner
   * @param {Object} config - Miner configuration
   */
  constructor(config = {}) {
    this.blockchain = new Blockchain(config.blockchain);
    this.minerAddress = config.minerAddress || this._generateMinerAddress();
    this.miningInterval = config.miningInterval || 10000; // 10 seconds
    this.isMining = false;
    this.miningStats = {
      blocksMined: 0,
      totalRewards: 0,
      startTime: null,
      lastBlockTime: null
    };
  }

  /**
   * Generate a miner address
   * @returns {string} - Miner address
   */
  _generateMinerAddress() {
    const keyPair = CryptoUtils.generateKeyPair();
    return CryptoUtils.sha256(keyPair.publicKey).substring(0, 40);
  }

  /**
   * Start mining
   */
  startMining() {
    if (this.isMining) {
      console.log('Mining already in progress');
      return;
    }

    this.isMining = true;
    this.miningStats.startTime = Date.now();
    console.log(`Starting mining with address: ${this.minerAddress}`);
    console.log(`Mining interval: ${this.miningInterval}ms`);

    this._mineLoop();
  }

  /**
   * Stop mining
   */
  stopMining() {
    this.isMining = false;
    console.log('Mining stopped');
  }

  /**
   * Main mining loop
   */
  _mineLoop() {
    if (!this.isMining) return;

    // Check if there are transactions to mine
    if (this.blockchain.pendingTransactions.length === 0) {
      console.log('No transactions to mine, waiting...');
      setTimeout(() => this._mineLoop(), this.miningInterval);
      return;
    }

    console.log(`\n--- Mining Block ${this.blockchain.getLatestBlock().index + 1} ---`);
    console.log(`Pending transactions: ${this.blockchain.pendingTransactions.length}`);
    console.log(`Current base fee: ${this.blockchain.baseFeePerGas}`);
    console.log(`Current difficulty: ${this.blockchain.difficulty}`);

    const startTime = Date.now();
    const minedBlock = this.blockchain.mineBlock(this.minerAddress);

    if (minedBlock) {
      const miningTime = Date.now() - startTime;
      this.miningStats.blocksMined++;
      this.miningStats.totalRewards += this.blockchain.miningReward;
      this.miningStats.lastBlockTime = Date.now();

      console.log(`\n✅ Block ${minedBlock.index} mined successfully!`);
      console.log(`⏱️  Mining time: ${miningTime}ms`);
      console.log(`💰 Mining reward: ${this.blockchain.miningReward} KIKI`);
      console.log(`📊 Total blocks mined: ${this.miningStats.blocksMined}`);
      console.log(`💎 Total rewards: ${this.miningStats.totalRewards} KIKI`);
      console.log(`🔗 Block hash: ${minedBlock.hash}`);
      console.log(`🌳 Merkle root: ${minedBlock.merkleRoot}`);
      console.log(`⛽ Gas used: ${minedBlock.getTotalGasUsed()}`);
      console.log(`💸 Fees collected: ${minedBlock.getTotalFees()}`);
    } else {
      console.log('❌ Failed to mine block');
    }

    // Continue mining
    setTimeout(() => this._mineLoop(), this.miningInterval);
  }

  /**
   * Add a transaction to the mempool
   * @param {Object} txParams - Transaction parameters
   * @returns {boolean} - True if transaction was added
   */
  addTransaction(txParams) {
    const transaction = new Transaction(txParams);
    return this.blockchain.addTransaction(transaction);
  }

  /**
   * Get mining statistics
   * @returns {Object} - Mining statistics
   */
  getMiningStats() {
    const uptime = this.miningStats.startTime ? Date.now() - this.miningStats.startTime : 0;
    const avgBlockTime = this.miningStats.blocksMined > 0 ? 
      uptime / this.miningStats.blocksMined : 0;

    return {
      ...this.miningStats,
      uptime,
      avgBlockTime,
      isMining: this.isMining,
      blockchainStats: this.blockchain.getStats()
    };
  }

  /**
   * Get blockchain state
   * @returns {Object} - Blockchain state
   */
  getBlockchainState() {
    return {
      chainLength: this.blockchain.chain.length,
      latestBlock: this.blockchain.getLatestBlock().toJSON(),
      pendingTransactions: this.blockchain.pendingTransactions.length,
      mempoolSize: this.blockchain.mempool.size,
      baseFeePerGas: this.blockchain.baseFeePerGas,
      difficulty: this.blockchain.difficulty
    };
  }

  /**
   * Get balance for an address
   * @param {string} address - Address to check
   * @returns {number} - Balance
   */
  getBalance(address) {
    return this.blockchain.getBalance(address);
  }

  /**
   * Create a sample transaction
   * @param {string} from - Sender address
   * @param {string} to - Recipient address
   * @param {number} value - Amount to send
   * @param {string} privateKey - Sender's private key
   * @returns {Transaction} - Created transaction
   */
  createTransaction(from, to, value, privateKey) {
    const nonce = 0; // In a real implementation, you'd track nonces per address
    
    return new Transaction({
      from,
      to,
      value,
      gasLimit: 21000,
      maxPriorityFeePerGas: 1000000000, // 1 Gwei
      maxFeePerGas: 20000000000, // 20 Gwei
      nonce,
      privateKey
    });
  }

  /**
   * Simulate network activity by creating random transactions
   */
  simulateNetworkActivity() {
    console.log('Simulating network activity...');
    
    // Create some test addresses
    const addresses = [
      '0x1234567890123456789012345678901234567890',
      '0x2345678901234567890123456789012345678901',
      '0x3456789012345678901234567890123456789012',
      '0x4567890123456789012345678901234567890123'
    ];

    // Create random transactions
    for (let i = 0; i < 5; i++) {
      const from = addresses[Math.floor(Math.random() * addresses.length)];
      const to = addresses[Math.floor(Math.random() * addresses.length)];
      const value = Math.floor(Math.random() * 100) + 1;
      
      // Generate a random private key for testing
      const keyPair = CryptoUtils.generateKeyPair();
      
      const transaction = this.createTransaction(from, to, value, keyPair.privateKey);
      this.addTransaction(transaction);
    }
  }
}

// CLI interface
if (require.main === module) {
  const miner = new Miner({
    blockchain: {
      difficulty: 3, // Start with lower difficulty for faster mining
      miningReward: 50,
      baseFeePerGas: 0
    },
    miningInterval: 5000 // 5 seconds
  });

  console.log('🚀 Kiki Blockchain Miner');
  console.log('========================');
  console.log(`Miner Address: ${miner.minerAddress}`);
  console.log('');

  // Add some initial balance to test addresses
  const testAddresses = [
    '0x1234567890123456789012345678901234567890',
    '0x2345678901234567890123456789012345678901'
  ];

  // Simulate some initial transactions
  miner.simulateNetworkActivity();

  // Start mining
  miner.startMining();

  // Display stats every 30 seconds
  setInterval(() => {
    const stats = miner.getMiningStats();
    console.log('\n📊 Mining Statistics:');
    console.log(`Blocks Mined: ${stats.blocksMined}`);
    console.log(`Total Rewards: ${stats.totalRewards} KIKI`);
    console.log(`Uptime: ${Math.floor(stats.uptime / 1000)}s`);
    console.log(`Average Block Time: ${Math.floor(stats.avgBlockTime / 1000)}s`);
    console.log(`Pending Transactions: ${stats.blockchainStats.pendingTransactions}`);
    console.log(`Current Base Fee: ${stats.blockchainStats.baseFeePerGas}`);
    console.log('---');
  }, 30000);

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down miner...');
    miner.stopMining();
    process.exit(0);
  });
}

module.exports = Miner; 