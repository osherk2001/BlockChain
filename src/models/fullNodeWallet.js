const crypto = require('crypto');
const EnhancedTransaction = require('./enhancedTransaction');

/**
 * FullNodeWallet - A full wallet that also acts as a full node with mining capability
 * Implements complete blockchain functionality including mining, transaction validation,
 * and full blockchain storage
 */
class FullNodeWallet {
  /**
   * Create a new full node wallet
   * @param {Object} config - Wallet configuration
   * @param {string} config.address - Wallet address
   * @param {string} config.name - Wallet name
   * @param {number} config.initialBalance - Initial balance
   * @param {Object} config.blockchain - Reference to shared blockchain
   * @param {Object} config.server - Reference to shared server
   */
  constructor(config) {
    this.address = config.address;
    this.name = config.name || 'FullNodeWallet';
    this.balance = config.initialBalance || 300;
    this.nonce = 0;
    this.transactions = []; // Transactions sent/received by this wallet
    this.blockchain = config.blockchain;
    this.server = config.server;
    
    // Mining configuration
    this.isMining = false;
    this.miningInterval = null;
    this.minedBlocks = 0;
    this.totalRewards = 0;
    
    // Full node capabilities
    this.isFullNode = true;
    this.peers = new Set();
    this.pendingTransactions = [];
    
    console.log(`[${this.name}] 🏗️  Full Node Wallet initialized`);
    console.log(`   Address: ${this.address}`);
    console.log(`   Balance: ${this.balance} KIKI`);
    console.log(`   Full Node: ${this.isFullNode}`);
  }

  /**
   * Generate a new transaction
   * @param {Object} params - Transaction parameters
   * @returns {EnhancedTransaction|null} - Created transaction or null if failed
   */
  createTransaction(params) {
    const { to, value, data = '' } = params;
    
    // Validate parameters
    if (!to || !value || value <= 0) {
      console.log(`[${this.name}] ❌ Invalid transaction parameters`);
      return null;
    }

    // Check balance
    const totalCost = value + 2 + 3; // value + baseFee + priorityFee
    if (this.balance < totalCost) {
      console.log(`[${this.name}] ❌ Insufficient balance: ${this.balance} < ${totalCost}`);
      return null;
    }

    // Create transaction
    const transaction = new EnhancedTransaction({
      from: this.address,
      to: to,
      value: value,
      baseFee: 2,
      priorityFee: 3,
      nonce: this.nonce,
      data: data,
      privateKey: this._generatePrivateKey() // For demo purposes
    });

    // Add to local transaction history
    this.transactions.push({
      hash: transaction.hash,
      type: 'SENT',
      to: to,
      value: value,
      timestamp: Date.now(),
      status: 'PENDING'
    });

    // Update nonce
    this.nonce++;

    console.log(`[${this.name}] ✅ Transaction created: ${transaction.hash.substring(0, 16)}...`);
    console.log(`   To: ${to}`);
    console.log(`   Value: ${value} KIKI`);
    console.log(`   Total Cost: ${totalCost} KIKI`);
    console.log(`   New Balance: ${this.balance - totalCost} KIKI`);

    return transaction;
  }

  /**
   * Send transaction to the network
   * @param {EnhancedTransaction} transaction - Transaction to send
   * @returns {boolean} - True if transaction was sent successfully
   */
  sendTransaction(transaction) {
    if (!transaction) {
      console.log(`[${this.name}] ❌ No transaction to send`);
      return false;
    }

    // Add to blockchain mempool
    const success = this.blockchain.addTransaction(transaction);
    
    if (success) {
      // Update local transaction status
      const localTx = this.transactions.find(tx => tx.hash === transaction.hash);
      if (localTx) {
        localTx.status = 'CONFIRMED';
      }
      
      console.log(`[${this.name}] ✅ Transaction sent to network`);
      return true;
    } else {
      console.log(`[${this.name}] ❌ Failed to send transaction to network`);
      return false;
    }
  }

  /**
   * Start mining
   * @param {number} interval - Mining interval in milliseconds
   */
  startMining(interval = 5000) {
    if (this.isMining) {
      console.log(`[${this.name}] ⚠️  Already mining`);
      return;
    }

    this.isMining = true;
    console.log(`[${this.name}] ⛏️  Starting mining (interval: ${interval}ms)`);

    this.miningInterval = setInterval(() => {
      this._mineBlock();
    }, interval);
  }

  /**
   * Stop mining
   */
  stopMining() {
    if (!this.isMining) {
      console.log(`[${this.name}] ⚠️  Not currently mining`);
      return;
    }

    this.isMining = false;
    if (this.miningInterval) {
      clearInterval(this.miningInterval);
      this.miningInterval = null;
    }

    console.log(`[${this.name}] ⛏️  Mining stopped`);
    console.log(`   Total blocks mined: ${this.minedBlocks}`);
    console.log(`   Total rewards: ${this.totalRewards} KIKI`);
  }

  /**
   * Mine a single block
   * @private
   */
  _mineBlock() {
    if (this.blockchain.pendingTransactions.length === 0) {
      console.log(`[${this.name}] ⚠️  No transactions to mine`);
      return;
    }

    console.log(`[${this.name}] ⛏️  Mining block ${this.blockchain.chain.length}...`);
    
    const minedBlock = this.blockchain.mineBlock(this.address);
    
    if (minedBlock) {
      this.minedBlocks++;
      this.totalRewards += 50; // Block reward
      
      // Add priority fees from transactions
      const fees = minedBlock.getFees();
      this.totalRewards += fees.totalPriorityFees;
      
      // Update balance
      this.balance = this.blockchain.getBalance(this.address);
      
      console.log(`[${this.name}] ✅ Block ${minedBlock.index} mined successfully!`);
      console.log(`   Hash: ${minedBlock.hash.substring(0, 16)}...`);
      console.log(`   Transactions: ${minedBlock.transactions.length}/4`);
      console.log(`   Block reward: 50 KIKI`);
      console.log(`   Priority fees: ${fees.totalPriorityFees} KIKI`);
      console.log(`   New balance: ${this.balance} KIKI`);
      console.log(`   Total mined: ${this.minedBlocks} blocks`);
      console.log(`   Total rewards: ${this.totalRewards} KIKI`);
    } else {
      console.log(`[${this.name}] ❌ Failed to mine block`);
    }
  }

  /**
   * Update balance from blockchain
   */
  updateBalance() {
    this.balance = this.blockchain.getBalance(this.address);
    console.log(`[${this.name}] 💰 Balance updated: ${this.balance} KIKI`);
  }

  /**
   * Process incoming transaction
   * @param {EnhancedTransaction} transaction - Incoming transaction
   */
  processIncomingTransaction(transaction) {
    if (transaction.to === this.address) {
      // Add to local transaction history
      this.transactions.push({
        hash: transaction.hash,
        type: 'RECEIVED',
        from: transaction.from,
        value: transaction.value,
        timestamp: Date.now(),
        status: 'CONFIRMED'
      });

      console.log(`[${this.name}] 💰 Received transaction: ${transaction.hash.substring(0, 16)}...`);
      console.log(`   From: ${transaction.from}`);
      console.log(`   Value: ${transaction.value} KIKI`);
    }
  }

  /**
   * Get wallet statistics
   * @returns {Object} - Wallet statistics
   */
  getStats() {
    const sentTransactions = this.transactions.filter(tx => tx.type === 'SENT');
    const receivedTransactions = this.transactions.filter(tx => tx.type === 'RECEIVED');
    
    return {
      address: this.address,
      name: this.name,
      balance: this.balance,
      nonce: this.nonce,
      isFullNode: this.isFullNode,
      isMining: this.isMining,
      minedBlocks: this.minedBlocks,
      totalRewards: this.totalRewards,
      transactionCount: this.transactions.length,
      sentTransactions: sentTransactions.length,
      receivedTransactions: receivedTransactions.length,
      pendingTransactions: this.transactions.filter(tx => tx.status === 'PENDING').length
    };
  }

  /**
   * Print wallet status
   */
  printStatus() {
    const stats = this.getStats();
    
    console.log(`\n[${this.name}] 📊 WALLET STATUS`);
    console.log('═══════════════════════════════════════════════════════════════════════════════');
    console.log(`   Address: ${stats.address}`);
    console.log(`   Balance: ${stats.balance} KIKI`);
    console.log(`   Nonce: ${stats.nonce}`);
    console.log(`   Full Node: ${stats.isFullNode ? 'YES' : 'NO'}`);
    console.log(`   Mining: ${stats.isMining ? 'ACTIVE' : 'INACTIVE'}`);
    console.log(`   Blocks Mined: ${stats.minedBlocks}`);
    console.log(`   Total Rewards: ${stats.totalRewards} KIKI`);
    console.log(`   Total Transactions: ${stats.transactionCount}`);
    console.log(`   Sent: ${stats.sentTransactions}`);
    console.log(`   Received: ${stats.receivedTransactions}`);
    console.log(`   Pending: ${stats.pendingTransactions}`);
  }

  /**
   * Print transaction history
   */
  printTransactionHistory() {
    if (this.transactions.length === 0) {
      console.log(`[${this.name}] 📋 No transactions yet`);
      return;
    }

    console.log(`\n[${this.name}] 📋 TRANSACTION HISTORY`);
    console.log('═══════════════════════════════════════════════════════════════════════════════');
    
    this.transactions.forEach((tx, index) => {
      const timestamp = new Date(tx.timestamp).toLocaleTimeString();
      const hash = tx.hash.substring(0, 16) + '...';
      
      console.log(`   ${index + 1}. ${tx.type} - ${hash}`);
      console.log(`      ${tx.type === 'SENT' ? 'To' : 'From'}: ${tx.type === 'SENT' ? tx.to : tx.from}`);
      console.log(`      Value: ${tx.value} KIKI`);
      console.log(`      Status: ${tx.status}`);
      console.log(`      Time: ${timestamp}`);
      console.log('');
    });
  }

  /**
   * Generate a private key for demo purposes
   * @private
   * @returns {string} - Private key
   */
  _generatePrivateKey() {
    // For demo purposes, generate a deterministic private key based on address
    return crypto.createHash('sha256').update(this.address).digest('hex');
  }

  /**
   * Shutdown the wallet
   */
  shutdown() {
    this.stopMining();
    console.log(`[${this.name}] 🔌 Full Node Wallet shutdown complete`);
  }
}

module.exports = FullNodeWallet; 