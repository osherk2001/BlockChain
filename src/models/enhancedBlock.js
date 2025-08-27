const crypto = require('crypto');
const { EnhancedMerkleTree } = require('../utils/enhancedMerkleTree');

/**
 * Enhanced Block Model with SegWit Support and Simplified EIP-1559
 * Implements SegWit by separating witness data and exactly 4 transactions per block
 */
class EnhancedBlock {
  /**
   * Create a new enhanced block
   * @param {Object} params - Block parameters
   * @param {number} params.index - Block index
   * @param {string} params.previousHash - Hash of previous block
   * @param {Array} params.transactions - Array of transactions (max 4)
   * @param {number} params.timestamp - Block timestamp
   * @param {number} params.difficulty - Mining difficulty
   * @param {string} params.minerAddress - Address of the miner
   */
  constructor(params) {
    this.index = params.index;
    this.previousHash = params.previousHash;
    this.transactions = params.transactions || [];
    this.timestamp = params.timestamp || Date.now();
    this.difficulty = params.difficulty || 2;
    this.minerAddress = params.minerAddress;
    
    // SegWit fields
    this.witnessData = []; // Separated witness data
    this.witnessMerkleRoot = null; // Merkle root of witness data
    
    // Mining fields
    this.nonce = 0;
    this.hash = null;
    this.merkleRoot = null;
    
    // Fee tracking
    this.totalBaseFees = 0;
    this.totalPriorityFees = 0;
    this.blockReward = 50; // Fixed block reward
    
    // Process transactions and build SegWit structure
    this._processTransactions();
    this._calculateMerkleRoots();
  }

  /**
   * Process transactions and separate witness data (SegWit)
   */
  _processTransactions() {
    if (this.transactions.length > 4) {
      console.warn(`[EnhancedBlock] Warning: Block can only contain 4 transactions, truncating to first 4`);
      this.transactions = this.transactions.slice(0, 4);
    }

    // Separate witness data from transactions
    this.witnessData = [];
    this.totalBaseFees = 0;
    this.totalPriorityFees = 0;

    this.transactions.forEach((tx, index) => {
      if (tx.witness) {
        this.witnessData.push({
          transactionIndex: index,
          witness: tx.witness
        });
      }
      
      this.totalBaseFees += tx.baseFee || 0;
      this.totalPriorityFees += tx.priorityFee || 0;
    });

    console.log(`[EnhancedBlock] 📦 Processed ${this.transactions.length} transactions`);
    console.log(`   Total base fees: ${this.totalBaseFees} KIKI (to be burned)`);
    console.log(`   Total priority fees: ${this.totalPriorityFees} KIKI (to miner)`);
    console.log(`   Witness data entries: ${this.witnessData.length}`);
  }

  /**
   * Calculate Merkle roots for transactions and witness data
   */
  _calculateMerkleRoots() {
    // Calculate Merkle root for witness transactions (without signature data)
    const witnessTransactions = this.transactions.map(tx => tx.witnessHash || tx.hash);
    const witnessMerkleTree = new EnhancedMerkleTree(witnessTransactions, `Block${this.index}_WitnessMerkle`);
    this.witnessMerkleRoot = witnessMerkleTree.getRoot();

    // Calculate Merkle root for full transactions
    const transactionHashes = this.transactions.map(tx => tx.hash);
    const transactionMerkleTree = new EnhancedMerkleTree(transactionHashes, `Block${this.index}_TransactionMerkle`);
    this.merkleRoot = transactionMerkleTree.getRoot();

    console.log(`[EnhancedBlock] 🌳 Merkle roots calculated:`);
    console.log(`   Witness Merkle Root: ${this.witnessMerkleRoot}`);
    console.log(`   Transaction Merkle Root: ${this.merkleRoot}`);
  }

  /**
   * Get block data for mining (without witness data for SegWit)
   * @returns {string} - Block data string
   */
  getBlockData() {
    return JSON.stringify({
      index: this.index,
      previousHash: this.previousHash,
      witnessMerkleRoot: this.witnessMerkleRoot,
      transactionMerkleRoot: this.merkleRoot,
      timestamp: this.timestamp,
      difficulty: this.difficulty,
      minerAddress: this.minerAddress,
      nonce: this.nonce,
      totalBaseFees: this.totalBaseFees,
      totalPriorityFees: this.totalPriorityFees,
      blockReward: this.blockReward
    });
  }

  /**
   * Mine the block (Proof of Work)
   * @param {number} maxAttempts - Maximum mining attempts
   * @returns {boolean} - True if block was successfully mined
   */
  mine(maxAttempts = 1000000) {
    const target = '0'.repeat(this.difficulty);
    let attempts = 0;
    
    console.log(`[EnhancedBlock] ⛏️  Mining block ${this.index} with difficulty ${this.difficulty}...`);
    
    while (attempts < maxAttempts) {
      this.hash = crypto.createHash('sha256').update(this.getBlockData()).digest('hex');
      
      if (this.hash.startsWith(target)) {
        console.log(`[EnhancedBlock] ✅ Block ${this.index} mined successfully!`);
        console.log(`   Hash: ${this.hash}`);
        console.log(`   Nonce: ${this.nonce}`);
        console.log(`   Attempts: ${attempts + 1}`);
        return true;
      }
      
      this.nonce++;
      attempts++;
      
      if (attempts % 10000 === 0) {
        console.log(`   Mining attempt ${attempts}...`);
      }
    }
    
    console.log(`[EnhancedBlock] ❌ Failed to mine block ${this.index} after ${maxAttempts} attempts`);
    return false;
  }

  /**
   * Verify block hash
   * @returns {boolean} - True if hash is valid
   */
  verifyHash() {
    const calculatedHash = crypto.createHash('sha256').update(this.getBlockData()).digest('hex');
    return calculatedHash === this.hash;
  }

  /**
   * Verify proof of work
   * @returns {boolean} - True if PoW is valid
   */
  verifyProofOfWork() {
    if (!this.hash) return false;
    
    const target = '0'.repeat(this.difficulty);
    return this.hash.startsWith(target);
  }

  /**
   * Verify Merkle roots
   * @returns {boolean} - True if Merkle roots are valid
   */
  verifyMerkleRoots() {
    // Recalculate Merkle roots
    const witnessTransactions = this.transactions.map(tx => tx.witnessHash || tx.hash);
    const witnessMerkleTree = new EnhancedMerkleTree(witnessTransactions);
    const calculatedWitnessRoot = witnessMerkleTree.getRoot();

    const transactionHashes = this.transactions.map(tx => tx.hash);
    const transactionMerkleTree = new EnhancedMerkleTree(transactionHashes);
    const calculatedTransactionRoot = transactionMerkleTree.getRoot();

    return calculatedWitnessRoot === this.witnessMerkleRoot && 
           calculatedTransactionRoot === this.merkleRoot;
  }

  /**
   * Add transaction to block
   * @param {EnhancedTransaction} transaction - Transaction to add
   * @returns {boolean} - True if transaction was added
   */
  addTransaction(transaction) {
    if (this.transactions.length >= 4) {
      console.warn(`[EnhancedBlock] Cannot add transaction: block already has 4 transactions`);
      return false;
    }

    this.transactions.push(transaction);
    this._processTransactions();
    this._calculateMerkleRoots();
    
    console.log(`[EnhancedBlock] ✅ Transaction added to block ${this.index}`);
    return true;
  }

  /**
   * Get total fees collected
   * @returns {Object} - Fee breakdown
   */
  getFees() {
    return {
      totalBaseFees: this.totalBaseFees,
      totalPriorityFees: this.totalPriorityFees,
      blockReward: this.blockReward,
      totalMinerReward: this.totalPriorityFees + this.blockReward,
      totalBurned: this.totalBaseFees
    };
  }

  /**
   * Get block statistics
   * @returns {Object} - Block statistics
   */
  getStats() {
    return {
      index: this.index,
      hash: this.hash,
      previousHash: this.previousHash,
      timestamp: this.timestamp,
      difficulty: this.difficulty,
      nonce: this.nonce,
      transactionCount: this.transactions.length,
      witnessDataCount: this.witnessData.length,
      merkleRoot: this.merkleRoot,
      witnessMerkleRoot: this.witnessMerkleRoot,
      minerAddress: this.minerAddress,
      fees: this.getFees(),
      size: this.getSize()
    };
  }

  /**
   * Get block size in bytes
   * @returns {number} - Block size
   */
  getSize() {
    return Buffer.byteLength(JSON.stringify(this.toJSON()));
  }

  /**
   * Print block details
   */
  printDetails() {
    console.log(`\n[EnhancedBlock] 📋 Block ${this.index} Details:`);
    console.log(`   Hash: ${this.hash}`);
    console.log(`   Previous Hash: ${this.previousHash}`);
    console.log(`   Timestamp: ${new Date(this.timestamp).toISOString()}`);
    console.log(`   Difficulty: ${this.difficulty}`);
    console.log(`   Nonce: ${this.nonce}`);
    console.log(`   Miner: ${this.minerAddress}`);
    console.log(`   Transactions: ${this.transactions.length}/4`);
    console.log(`   Witness Data: ${this.witnessData.length} entries`);
    console.log(`   Merkle Root: ${this.merkleRoot}`);
    console.log(`   Witness Merkle Root: ${this.witnessMerkleRoot}`);
    
    const fees = this.getFees();
    console.log(`   Base Fees: ${fees.totalBaseFees} KIKI (burned)`);
    console.log(`   Priority Fees: ${fees.totalPriorityFees} KIKI (to miner)`);
    console.log(`   Block Reward: ${fees.blockReward} KIKI`);
    console.log(`   Total Miner Reward: ${fees.totalMinerReward} KIKI`);
    console.log(`   Total Burned: ${fees.totalBurned} KIKI`);
    console.log(`   Block Size: ${this.getSize()} bytes`);
  }

  /**
   * Serialize block to JSON
   * @returns {Object} - Serialized block
   */
  toJSON() {
    return {
      index: this.index,
      previousHash: this.previousHash,
      hash: this.hash,
      timestamp: this.timestamp,
      difficulty: this.difficulty,
      nonce: this.nonce,
      minerAddress: this.minerAddress,
      merkleRoot: this.merkleRoot,
      witnessMerkleRoot: this.witnessMerkleRoot,
      transactions: this.transactions.map(tx => tx.toJSON()),
      witnessData: this.witnessData,
      totalBaseFees: this.totalBaseFees,
      totalPriorityFees: this.totalPriorityFees,
      blockReward: this.blockReward,
      size: this.getSize()
    };
  }

  /**
   * Create block from JSON
   * @param {Object} data - Serialized block data
   * @returns {EnhancedBlock} - Block instance
   */
  static fromJSON(data) {
    const EnhancedTransaction = require('./enhancedTransaction');
    
    const block = new EnhancedBlock({
      index: data.index,
      previousHash: data.previousHash,
      timestamp: data.timestamp,
      difficulty: data.difficulty,
      minerAddress: data.minerAddress
    });
    
    block.hash = data.hash;
    block.nonce = data.nonce;
    block.merkleRoot = data.merkleRoot;
    block.witnessMerkleRoot = data.witnessMerkleRoot;
    block.totalBaseFees = data.totalBaseFees;
    block.totalPriorityFees = data.totalPriorityFees;
    block.blockReward = data.blockReward;
    
    // Convert transaction JSON back to EnhancedTransaction objects
    block.transactions = data.transactions.map(tx => EnhancedTransaction.fromJSON(tx));
    block.witnessData = data.witnessData;
    
    return block;
  }
}

module.exports = EnhancedBlock; 