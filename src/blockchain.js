const Block = require('./models/block');
const Transaction = require('./models/transaction');
const BloomFilter = require('./utils/bloomFilter');
const CryptoUtils = require('./utils/crypto');

class Blockchain {
  /**
   * Create a new blockchain
   * @param {Object} config - Blockchain configuration
   */
  constructor(config = {}) {
    this.chain = [];
    this.pendingTransactions = [];
    this.mempool = new Map(); // Transaction hash -> Transaction
    this.utxoSet = new Map(); // Address -> Balance
    this.difficulty = config.difficulty || 4;
    this.miningReward = config.miningReward || 50;
    this.blockTime = config.blockTime || 60000; // 1 minute
    this.maxBlockSize = config.maxBlockSize || 1000000; // 1MB
    this.maxTransactionsPerBlock = config.maxTransactionsPerBlock || 1000;
    
    // EIP-1559 parameters
    this.baseFeePerGas = config.baseFeePerGas || 0;
    this.targetGasUsed = config.targetGasUsed || 15000000;
    
    // Bloom filter for transaction filtering
    this.bloomFilter = new BloomFilter(1024, 3);
    
    // Network peers
    this.peers = new Set();
    
    // Initialize with genesis block
    this._createGenesisBlock();
  }

  /**
   * Create the genesis block
   */
  _createGenesisBlock() {
    const genesisBlock = new Block({
      index: 0,
      previousHash: '0'.repeat(64),
      transactions: [],
      timestamp: Date.now(),
      difficulty: this.difficulty,
      baseFeePerGas: this.baseFeePerGas
    });
    
    // Mine genesis block
    genesisBlock.mine();
    
    this.chain.push(genesisBlock);
    console.log('Genesis block created and mined!');
  }

  /**
   * Get the latest block
   * @returns {Block} - Latest block
   */
  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  /**
   * Add a new transaction to the mempool
   * @param {Transaction} transaction - Transaction to add
   * @returns {boolean} - True if transaction was added
   */
  addTransaction(transaction) {
    // Validate transaction
    if (!this._validateTransaction(transaction)) {
      console.log('Invalid transaction rejected');
      return false;
    }
    
    // Check if transaction already exists
    if (this.mempool.has(transaction.hash)) {
      console.log('Transaction already in mempool');
      return false;
    }
    
    // Add to mempool
    this.mempool.set(transaction.hash, transaction);
    this.pendingTransactions.push(transaction);
    
    // Add to bloom filter
    this.bloomFilter.add(transaction.hash);
    
    console.log(`Transaction ${transaction.hash.substring(0, 8)}... added to mempool`);
    return true;
  }

  /**
   * Validate a transaction
   * @param {Transaction} transaction - Transaction to validate
   * @returns {boolean} - True if valid
   */
  _validateTransaction(transaction) {
    // Check if transaction is signed
    if (!transaction.signature) {
      console.log('Transaction not signed');
      return false;
    }
    
    // Check if sender has sufficient balance
    const senderBalance = this.getBalance(transaction.from);
    const totalCost = transaction.value + transaction.getGasCost(this.baseFeePerGas);
    
    if (senderBalance < totalCost) {
      console.log(`Insufficient balance: ${senderBalance} < ${totalCost}`);
      return false;
    }
    
    // Check if transaction is valid for current base fee (allow zero gas for testing)
    if (this.baseFeePerGas > 0 && !transaction.isValidForBaseFee(this.baseFeePerGas)) {
      console.log('Transaction gas price too low for current base fee');
      return false;
    }
    
    return true;
  }

  /**
   * Get balance for an address
   * @param {string} address - Address to check
   * @returns {number} - Balance
   */
  getBalance(address) {
    return this.utxoSet.get(address) || 0;
  }

  /**
   * Mine a new block
   * @param {string} minerAddress - Address to receive mining reward
   * @returns {Block|null} - Mined block or null if failed
   */
  mineBlock(minerAddress) {
    // Allow mining empty blocks for initial coin distribution
    const hasTransactions = this.pendingTransactions.length > 0;
    
    if (!hasTransactions) {
      console.log('No transactions to mine, creating empty block for coin distribution');
    }
    
    const latestBlock = this.getLatestBlock();
    const nextBaseFee = latestBlock.calculateNextBaseFee(this.targetGasUsed);
    
    // Select transactions for the block (empty array if no transactions)
    const selectedTransactions = hasTransactions ? this._selectTransactionsForBlock() : [];
    
    // Create new block
    const newBlock = new Block({
      index: latestBlock.index + 1,
      previousHash: latestBlock.hash,
      transactions: selectedTransactions,
      timestamp: Date.now(),
      difficulty: this.difficulty,
      baseFeePerGas: nextBaseFee
    });
    
    // Mine the block
    if (newBlock.mine()) {
      // Add mining reward transaction
      const rewardTransaction = new Transaction({
        from: '0x0000000000000000000000000000000000000000', // System address
        to: minerAddress,
        value: this.miningReward,
        gasLimit: 0,
        maxPriorityFeePerGas: 0,
        maxFeePerGas: 0,
        nonce: 0
      });
      
      newBlock.addTransaction(rewardTransaction);
      
      // Add block to chain
      this.addBlock(newBlock);
      
      // Update UTXO set
      this._updateUTXOSet(newBlock);
      
      // Remove mined transactions from mempool (only if there were transactions)
      if (hasTransactions) {
        this._removeMinedTransactions(selectedTransactions);
      }
      
      console.log(`Block ${newBlock.index} added to chain`);
      return newBlock;
    }
    
    return null;
  }

  /**
   * Select transactions for mining based on priority and gas price
   * @returns {Array} - Selected transactions
   */
  _selectTransactionsForBlock() {
    const transactions = Array.from(this.mempool.values());
    
    // Sort by priority (EIP-1559)
    transactions.sort((a, b) => {
      const priorityA = a.getPriority(this.baseFeePerGas);
      const priorityB = b.getPriority(this.baseFeePerGas);
      return priorityB - priorityA;
    });
    
    // Select transactions up to block size limit
    const selected = [];
    let totalSize = 0;
    let totalGas = 0;
    
    for (const tx of transactions) {
      const txSize = Buffer.byteLength(JSON.stringify(tx.toJSON()));
      const gasUsed = tx.gasLimit;
      
      if (totalSize + txSize <= this.maxBlockSize && 
          totalGas + gasUsed <= this.targetGasUsed &&
          selected.length < this.maxTransactionsPerBlock) {
        selected.push(tx);
        totalSize += txSize;
        totalGas += gasUsed;
      }
    }
    
    return selected;
  }

  /**
   * Add a block to the chain
   * @param {Block} block - Block to add
   * @returns {boolean} - True if block was added
   */
  addBlock(block) {
    // Validate block
    if (!this._validateBlock(block)) {
      console.log('Invalid block rejected');
      return false;
    }
    
    this.chain.push(block);
    return true;
  }

  /**
   * Validate a block
   * @param {Block} block - Block to validate
   * @returns {boolean} - True if valid
   */
  _validateBlock(block) {
    const latestBlock = this.getLatestBlock();
    
    // Check if block is next in sequence
    if (block.index !== latestBlock.index + 1) {
      console.log('Invalid block index');
      return false;
    }
    
    // Check if previous hash matches
    if (block.previousHash !== latestBlock.hash) {
      console.log('Invalid previous hash');
      return false;
    }
    
    // Verify proof of work
    if (!block.verifyProofOfWork()) {
      console.log('Invalid proof of work');
      return false;
    }
    
    // Verify block hash
    if (!block.verifyHash()) {
      console.log('Invalid block hash');
      return false;
    }
    
    // Verify Merkle root
    if (!block.verifyMerkleRoot()) {
      console.log('Invalid Merkle root');
      return false;
    }
    
    return true;
  }

  /**
   * Update UTXO set after adding a block
   * @param {Block} block - Block that was added
   */
  _updateUTXOSet(block) {
    for (const tx of block.transactions) {
      if (tx.from !== '0x0000000000000000000000000000000000000000') {
        // Deduct from sender
        const senderBalance = this.getBalance(tx.from);
        const totalCost = tx.value + tx.getGasCost(block.baseFeePerGas);
        this.utxoSet.set(tx.from, senderBalance - totalCost);
      }
      
      // Add to recipient
      const recipientBalance = this.getBalance(tx.to);
      this.utxoSet.set(tx.to, recipientBalance + tx.value);
    }
  }

  /**
   * Remove mined transactions from mempool
   * @param {Array} minedTransactions - Transactions that were mined
   */
  _removeMinedTransactions(minedTransactions) {
    for (const tx of minedTransactions) {
      this.mempool.delete(tx.hash);
      const index = this.pendingTransactions.findIndex(t => t.hash === tx.hash);
      if (index !== -1) {
        this.pendingTransactions.splice(index, 1);
      }
    }
  }

  /**
   * Check if chain is valid
   * @returns {boolean} - True if valid
   */
  isChainValid() {
    for (let i = 1; i < this.chain.length; i++) {
      const currentBlock = this.chain[i];
      const previousBlock = this.chain[i - 1];
      
      if (currentBlock.previousHash !== previousBlock.hash) {
        return false;
      }
      
      if (!currentBlock.verifyHash()) {
        return false;
      }
      
      if (!currentBlock.verifyProofOfWork()) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Get transaction by hash
   * @param {string} hash - Transaction hash
   * @returns {Transaction|null} - Transaction or null if not found
   */
  getTransaction(hash) {
    // Check mempool first
    if (this.mempool.has(hash)) {
      return this.mempool.get(hash);
    }
    
    // Check blockchain
    for (const block of this.chain) {
      for (const tx of block.transactions) {
        if (tx.hash === hash) {
          return tx;
        }
      }
    }
    
    return null;
  }

  /**
   * Check if transaction might be in bloom filter
   * @param {string} hash - Transaction hash
   * @returns {boolean} - True if might be present
   */
  mightContainTransaction(hash) {
    return this.bloomFilter.mightContain(hash);
  }

  /**
   * Get blockchain statistics
   * @returns {Object} - Statistics
   */
  getStats() {
    return {
      chainLength: this.chain.length,
      pendingTransactions: this.pendingTransactions.length,
      mempoolSize: this.mempool.size,
      totalUTXOs: this.utxoSet.size,
      currentDifficulty: this.difficulty,
      baseFeePerGas: this.baseFeePerGas,
      bloomFilterFalsePositiveRate: this.bloomFilter.getFalsePositiveProbability()
    };
  }

  /**
   * Serialize blockchain to JSON
   * @returns {Object} - Serialized blockchain
   */
  toJSON() {
    return {
      chain: this.chain.map(block => block.toJSON()),
      pendingTransactions: this.pendingTransactions.map(tx => tx.toJSON()),
      utxoSet: Object.fromEntries(this.utxoSet),
      difficulty: this.difficulty,
      miningReward: this.miningReward,
      baseFeePerGas: this.baseFeePerGas,
      bloomFilter: this.bloomFilter.toJSON(),
      stats: this.getStats()
    };
  }

  /**
   * Create blockchain from JSON
   * @param {Object} data - Serialized blockchain data
   * @returns {Blockchain} - Blockchain instance
   */
  static fromJSON(data) {
    const blockchain = new Blockchain({
      difficulty: data.difficulty,
      miningReward: data.miningReward,
      baseFeePerGas: data.baseFeePerGas
    });
    
    // Restore chain
    blockchain.chain = data.chain.map(blockData => Block.fromJSON(blockData));
    
    // Restore pending transactions
    blockchain.pendingTransactions = data.pendingTransactions.map(txData => Transaction.fromJSON(txData));
    
    // Restore mempool
    blockchain.mempool = new Map();
    for (const tx of blockchain.pendingTransactions) {
      blockchain.mempool.set(tx.hash, tx);
    }
    
    // Restore UTXO set
    blockchain.utxoSet = new Map(Object.entries(data.utxoSet));
    
    // Restore bloom filter
    blockchain.bloomFilter = BloomFilter.fromJSON(data.bloomFilter);
    
    return blockchain;
  }
}

module.exports = Blockchain; 