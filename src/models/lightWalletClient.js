const crypto = require('crypto');
const EnhancedTransaction = require('./enhancedTransaction');

/**
 * LightWalletClient - A light wallet that only tracks and displays transactions
 * it sends or receives, without full blockchain storage
 */
class LightWalletClient {
  /**
   * Create a new light wallet client
   * @param {Object} config - Wallet configuration
   * @param {string} config.address - Wallet address
   * @param {string} config.name - Wallet name
   * @param {number} config.initialBalance - Initial balance
   * @param {Object} config.server - Reference to shared server
   */
  constructor(config) {
    this.address = config.address;
    this.name = config.name || 'LightWallet';
    this.balance = config.initialBalance || 300;
    this.nonce = 0;
    this.transactions = []; // Only transactions sent/received by this wallet
    this.server = config.server;
    
    // Light wallet capabilities
    this.isFullNode = false;
    this.isLightWallet = true;
    
    // Connection status
    this.isConnected = false;
    this.lastSyncTime = null;
    
    console.log(`[${this.name}] 💡 Light Wallet initialized`);
    console.log(`   Address: ${this.address}`);
    console.log(`   Balance: ${this.balance} KIKI`);
    console.log(`   Light Wallet: ${this.isLightWallet}`);
  }

  /**
   * Connect to the network
   */
  async connect() {
    try {
      // Simulate connection to server
      this.isConnected = true;
      this.lastSyncTime = Date.now();
      
      // Get initial balance from server
      await this.syncBalance();
      
      console.log(`[${this.name}] 🔗 Connected to network`);
      console.log(`   Server: ${this.server ? 'Available' : 'Local'}`);
      console.log(`   Balance: ${this.balance} KIKI`);
      
      return true;
    } catch (error) {
      console.log(`[${this.name}] ❌ Failed to connect: ${error.message}`);
      return false;
    }
  }

  /**
   * Disconnect from the network
   */
  disconnect() {
    this.isConnected = false;
    console.log(`[${this.name}] 🔌 Disconnected from network`);
  }

  /**
   * Sync balance from server/blockchain
   */
  async syncBalance() {
    if (!this.isConnected) {
      console.log(`[${this.name}] ⚠️  Not connected to network`);
      return false;
    }

    try {
      // Simulate API call to get balance
      // In a real implementation, this would call the server API
      const response = await this._callServerAPI('GET', `/balance/${this.address}`);
      
      if (response && response.balance !== undefined) {
        this.balance = response.balance;
        this.lastSyncTime = Date.now();
        console.log(`[${this.name}] 💰 Balance synced: ${this.balance} KIKI`);
        return true;
      }
      
      return false;
    } catch (error) {
      console.log(`[${this.name}] ❌ Failed to sync balance: ${error.message}`);
      return false;
    }
  }

  /**
   * Create a new transaction
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
  async sendTransaction(transaction) {
    if (!transaction) {
      console.log(`[${this.name}] ❌ No transaction to send`);
      return false;
    }

    if (!this.isConnected) {
      console.log(`[${this.name}] ❌ Not connected to network`);
      return false;
    }

    try {
      // Send transaction to server
      const response = await this._callServerAPI('POST', '/transaction', {
        from: transaction.from,
        to: transaction.to,
        value: transaction.value,
        baseFee: transaction.baseFee,
        priorityFee: transaction.priorityFee,
        nonce: transaction.nonce,
        data: transaction.data,
        hash: transaction.hash
      });

      if (response && response.success) {
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
    } catch (error) {
      console.log(`[${this.name}] ❌ Error sending transaction: ${error.message}`);
      return false;
    }
  }

  /**
   * Check for incoming transactions
   */
  async checkIncomingTransactions() {
    if (!this.isConnected) {
      return;
    }

    try {
      // Simulate checking for incoming transactions
      const response = await this._callServerAPI('GET', `/transactions/incoming/${this.address}`);
      
      if (response && response.transactions) {
        response.transactions.forEach(tx => {
          // Check if we already have this transaction
          const existingTx = this.transactions.find(t => t.hash === tx.hash);
          if (!existingTx) {
            // Add new incoming transaction
            this.transactions.push({
              hash: tx.hash,
              type: 'RECEIVED',
              from: tx.from,
              value: tx.value,
              timestamp: Date.now(),
              status: 'CONFIRMED'
            });

            console.log(`[${this.name}] 💰 New incoming transaction: ${tx.hash.substring(0, 16)}...`);
            console.log(`   From: ${tx.from}`);
            console.log(`   Value: ${tx.value} KIKI`);
          }
        });
      }
    } catch (error) {
      console.log(`[${this.name}] ⚠️  Error checking incoming transactions: ${error.message}`);
    }
  }

  /**
   * Update balance from server
   */
  async updateBalance() {
    await this.syncBalance();
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
      isLightWallet: this.isLightWallet,
      isConnected: this.isConnected,
      lastSyncTime: this.lastSyncTime,
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
    const lastSync = stats.lastSyncTime ? new Date(stats.lastSyncTime).toLocaleTimeString() : 'Never';
    
    console.log(`\n[${this.name}] 📊 WALLET STATUS`);
    console.log('═══════════════════════════════════════════════════════════════════════════════');
    console.log(`   Address: ${stats.address}`);
    console.log(`   Balance: ${stats.balance} KIKI`);
    console.log(`   Nonce: ${stats.nonce}`);
    console.log(`   Light Wallet: ${stats.isLightWallet ? 'YES' : 'NO'}`);
    console.log(`   Connected: ${stats.isConnected ? 'YES' : 'NO'}`);
    console.log(`   Last Sync: ${lastSync}`);
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
   * Simulate server API call
   * @private
   * @param {string} method - HTTP method
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request data
   * @returns {Promise<Object>} - Response data
   */
  async _callServerAPI(method, endpoint, data = null) {
    try {
      const fetch = require('node-fetch');
      const baseUrl = 'http://localhost:3000';
      const url = `${baseUrl}${endpoint}`;
      
      const options = {
        method: method,
        headers: {
          'Content-Type': 'application/json'
        }
      };
      
      if (data) {
        options.body = JSON.stringify(data);
      }
      
      const response = await fetch(url, options);
      const result = await response.json();
      
      return result;
    } catch (error) {
      // Fallback to simulation if server is not available
      console.log(`[${this.name}] ⚠️  Server not available, using simulation: ${error.message}`);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 100));
      
      if (endpoint.includes('/balance/')) {
        return { balance: this.balance };
      } else if (endpoint === '/transaction') {
        return { success: true, hash: data.hash };
      } else if (endpoint.includes('/transactions/incoming/')) {
        return { transactions: [] };
      }
      
      return null;
    }
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
    this.disconnect();
    console.log(`[${this.name}] 🔌 Light Wallet shutdown complete`);
  }
}

module.exports = LightWalletClient; 