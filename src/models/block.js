const CryptoUtils = require('../utils/crypto');
const MerkleTree = require('../utils/merkleTree');

class Block {
  /**
   * Create a new block
   * @param {Object} params - Block parameters
   * @param {number} params.index - Block index
   * @param {string} params.previousHash - Hash of previous block
   * @param {Array} params.transactions - Array of transactions
   * @param {number} params.timestamp - Block timestamp
   * @param {number} params.difficulty - Mining difficulty
   * @param {number} params.baseFeePerGas - Base fee per gas (EIP-1559)
   */
  constructor(params) {
    this.index = params.index;
    this.previousHash = params.previousHash;
    this.transactions = params.transactions || [];
    this.timestamp = params.timestamp || Date.now();
    this.difficulty = params.difficulty || 4;
    this.baseFeePerGas = params.baseFeePerGas || 0;
    
    // Mining fields
    this.nonce = 0;
    this.hash = null;
    this.merkleRoot = null;
    
    // Calculate Merkle root
    this._calculateMerkleRoot();
  }

  /**
   * Calculate Merkle root from transactions
   */
  _calculateMerkleRoot() {
    const transactionHashes = this.transactions.map(tx => 
      typeof tx === 'string' ? tx : tx.hash
    );
    
    const merkleTree = new MerkleTree(transactionHashes);
    this.merkleRoot = merkleTree.getRoot();
  }

  /**
   * Get block data for mining
   * @returns {string} - Block data string
   */
  getBlockData() {
    return JSON.stringify({
      index: this.index,
      previousHash: this.previousHash,
      merkleRoot: this.merkleRoot,
      timestamp: this.timestamp,
      difficulty: this.difficulty,
      baseFeePerGas: this.baseFeePerGas,
      nonce: this.nonce
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
    
    console.log(`Mining block ${this.index} with difficulty ${this.difficulty}...`);
    
    while (attempts < maxAttempts) {
      this.hash = CryptoUtils.doubleSha256(this.getBlockData());
      
      if (this.hash.startsWith(target)) {
        console.log(`Block ${this.index} mined successfully!`);
        console.log(`Hash: ${this.hash}`);
        console.log(`Nonce: ${this.nonce}`);
        console.log(`Attempts: ${attempts + 1}`);
        return true;
      }
      
      this.nonce++;
      attempts++;
      
      if (attempts % 10000 === 0) {
        console.log(`Mining attempt ${attempts}...`);
      }
    }
    
    console.log(`Failed to mine block ${this.index} after ${maxAttempts} attempts`);
    return false;
  }

  /**
   * Verify block hash
   * @returns {boolean} - True if hash is valid
   */
  verifyHash() {
    const calculatedHash = CryptoUtils.doubleSha256(this.getBlockData());
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
   * Verify Merkle root
   * @returns {boolean} - True if Merkle root is valid
   */
  verifyMerkleRoot() {
    const transactionHashes = this.transactions.map(tx => 
      typeof tx === 'string' ? tx : tx.hash
    );
    
    const merkleTree = new MerkleTree(transactionHashes);
    return merkleTree.getRoot() === this.merkleRoot;
  }

  /**
   * Add transaction to block
   * @param {Transaction} transaction - Transaction to add
   */
  addTransaction(transaction) {
    this.transactions.push(transaction);
    this._calculateMerkleRoot();
  }

  /**
   * Calculate total gas used by transactions
   * @returns {number} - Total gas used
   */
  getTotalGasUsed() {
    return this.transactions.reduce((total, tx) => {
      const gasUsed = typeof tx === 'object' ? tx.gasLimit : 21000;
      return total + gasUsed;
    }, 0);
  }

  /**
   * Calculate total fees collected
   * @returns {number} - Total fees
   */
  getTotalFees() {
    return this.transactions.reduce((total, tx) => {
      if (typeof tx === 'object') {
        const gasCost = tx.getGasCost(this.baseFeePerGas);
        return total + gasCost;
      }
      return total;
    }, 0);
  }

  /**
   * Calculate next block's base fee (EIP-1559)
   * @param {number} targetGasUsed - Target gas used per block
   * @returns {number} - Next block's base fee
   */
  calculateNextBaseFee(targetGasUsed = 15000000) {
    const gasUsed = this.getTotalGasUsed();
    const currentBaseFee = this.baseFeePerGas;
    
    if (gasUsed === targetGasUsed) {
      return currentBaseFee;
    } else if (gasUsed > targetGasUsed) {
      // Increase base fee
      const increase = Math.floor(currentBaseFee * (gasUsed - targetGasUsed) / targetGasUsed / 8);
      return currentBaseFee + increase;
    } else {
      // Decrease base fee
      const decrease = Math.floor(currentBaseFee * (targetGasUsed - gasUsed) / targetGasUsed / 8);
      return Math.max(0, currentBaseFee - decrease);
    }
  }

  /**
   * Get block size in bytes
   * @returns {number} - Block size
   */
  getSize() {
    return Buffer.byteLength(JSON.stringify(this.toJSON()));
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
      merkleRoot: this.merkleRoot,
      timestamp: this.timestamp,
      difficulty: this.difficulty,
      nonce: this.nonce,
      baseFeePerGas: this.baseFeePerGas,
      transactions: this.transactions.map(tx => 
        typeof tx === 'object' ? tx.toJSON() : tx
      ),
      totalGasUsed: this.getTotalGasUsed(),
      totalFees: this.getTotalFees(),
      size: this.getSize()
    };
  }

  /**
   * Create block from JSON
   * @param {Object} data - Serialized block data
   * @returns {Block} - Block instance
   */
  static fromJSON(data) {
    const Transaction = require('./transaction');
    
    const block = new Block({
      index: data.index,
      previousHash: data.previousHash,
      timestamp: data.timestamp,
      difficulty: data.difficulty,
      baseFeePerGas: data.baseFeePerGas
    });
    
    block.hash = data.hash;
    block.nonce = data.nonce;
    block.merkleRoot = data.merkleRoot;
    
    // Convert transaction JSON back to Transaction objects
    block.transactions = data.transactions.map(tx => 
      typeof tx === 'string' ? tx : Transaction.fromJSON(tx)
    );
    
    return block;
  }
}

module.exports = Block; 