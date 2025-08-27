const express = require('express');
const cors = require('cors');
const EnhancedBlockchain = require('../enhancedBlockchain');

/**
 * Shared Server - Manages blockchain and provides API endpoints for all wallets
 * This server runs in a single process and handles requests from multiple wallet instances
 */
class SharedServer {
  /**
   * Create a new shared server
   * @param {Object} config - Server configuration
   */
  constructor(config = {}) {
    this.port = config.port || 3000;
    this.app = express();
    this.server = null;
    this.isRunning = false;
    
    // Initialize blockchain
    this.blockchain = new EnhancedBlockchain({
      difficulty: config.difficulty || 2,
      blockReward: config.blockReward || 50,
      initialBalance: config.initialBalance || 300
    });
    
    // Connected wallets
    this.connectedWallets = new Map();
    this.walletBalances = new Map();
    
    // Transaction history for light wallets
    this.transactionHistory = new Map();
    
    // Setup middleware and routes
    this._setupMiddleware();
    this._setupRoutes();
    
    console.log(`[SharedServer] 🏗️  Shared server initialized`);
    console.log(`   Port: ${this.port}`);
    console.log(`   Blockchain: ${this.blockchain.chain.length} blocks`);
    console.log(`   Mempool: ${this.blockchain.pendingTransactions.length} transactions`);
  }

  /**
   * Setup middleware
   * @private
   */
  _setupMiddleware() {
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    
    // Logging middleware
    this.app.use((req, res, next) => {
      console.log(`[SharedServer] ${req.method} ${req.path} - ${new Date().toLocaleTimeString()}`);
      next();
    });
  }

  /**
   * Setup API routes
   * @private
   */
  _setupRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        server: 'SharedServer',
        timestamp: new Date().toISOString(),
        blockchain: {
          length: this.blockchain.chain.length,
          pendingTransactions: this.blockchain.pendingTransactions.length,
          totalCoinsInNetwork: this.blockchain.totalCoinsInNetwork
        }
      });
    });

    // Blockchain info
    this.app.get('/blockchain', (req, res) => {
      const stats = this.blockchain.getStats();
      res.json({
        chainLength: stats.chainLength,
        pendingTransactions: stats.pendingTransactions,
        totalCoinsInNetwork: stats.totalCoinsInNetwork,
        totalCoinsMined: stats.totalCoinsMined,
        totalCoinsBurned: stats.totalCoinsBurned,
        connectedWallets: this.connectedWallets.size
      });
    });

    // Get balance
    this.app.get('/balance/:address', (req, res) => {
      const { address } = req.params;
      const balance = this.blockchain.getBalance(address);
      
      res.json({
        address: address,
        balance: balance,
        timestamp: new Date().toISOString()
      });
    });

    // Submit transaction
    this.app.post('/transaction', (req, res) => {
      try {
        const { from, to, value, baseFee, priorityFee, nonce, data, hash } = req.body;
        
        // Create transaction object
        const EnhancedTransaction = require('../models/enhancedTransaction');
        const transaction = new EnhancedTransaction({
          from: from,
          to: to,
          value: value,
          baseFee: baseFee || 2,
          priorityFee: priorityFee || 3,
          nonce: nonce,
          data: data || ''
        });

        // Add to blockchain
        const success = this.blockchain.addTransaction(transaction);
        
        if (success) {
          // Update transaction history for light wallets
          this._addToTransactionHistory(transaction);
          
          res.json({
            success: true,
            hash: transaction.hash,
            message: 'Transaction added to mempool'
          });
        } else {
          res.status(400).json({
            success: false,
            message: 'Transaction validation failed'
          });
        }
      } catch (error) {
        res.status(500).json({
          success: false,
          message: error.message
        });
      }
    });

    // Get pending transactions
    this.app.get('/transactions/pending', (req, res) => {
      const pending = this.blockchain.pendingTransactions.map(tx => ({
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        value: tx.value,
        baseFee: tx.baseFee,
        priorityFee: tx.priorityFee,
        nonce: tx.nonce,
        data: tx.data
      }));
      
      res.json({
        pendingTransactions: pending,
        count: pending.length
      });
    });

    // Get incoming transactions for a specific address
    this.app.get('/transactions/incoming/:address', (req, res) => {
      const { address } = req.params;
      const incoming = this._getIncomingTransactions(address);
      
      res.json({
        address: address,
        transactions: incoming,
        count: incoming.length
      });
    });

    // Mine block
    this.app.post('/mine', (req, res) => {
      try {
        const { minerAddress } = req.body;
        
        if (!minerAddress) {
          return res.status(400).json({
            success: false,
            message: 'Miner address required'
          });
        }

        const minedBlock = this.blockchain.mineBlock(minerAddress);
        
        if (minedBlock) {
          // Update transaction history for mined transactions
          minedBlock.transactions.forEach(tx => {
            this._addToTransactionHistory(tx);
          });
          
          res.json({
            success: true,
            block: {
              index: minedBlock.index,
              hash: minedBlock.hash,
              transactions: minedBlock.transactions.length,
              minerAddress: minedBlock.minerAddress,
              timestamp: minedBlock.timestamp
            },
            message: `Block ${minedBlock.index} mined successfully`
          });
        } else {
          res.status(400).json({
            success: false,
            message: 'Failed to mine block'
          });
        }
      } catch (error) {
        res.status(500).json({
          success: false,
          message: error.message
        });
      }
    });

    // Get blockchain stats
    this.app.get('/stats', (req, res) => {
      const stats = this.blockchain.getStats();
      res.json({
        blockchain: stats,
        server: {
          connectedWallets: this.connectedWallets.size,
          isRunning: this.isRunning,
          uptime: process.uptime()
        }
      });
    });

    // Register wallet
    this.app.post('/wallet/register', (req, res) => {
      const { address, name, type } = req.body;
      
      if (!address || !name || !type) {
        return res.status(400).json({
          success: false,
          message: 'Address, name, and type required'
        });
      }

      this.connectedWallets.set(address, {
        address: address,
        name: name,
        type: type,
        connectedAt: new Date().toISOString(),
        lastSeen: new Date().toISOString()
      });

      res.json({
        success: true,
        message: `Wallet ${name} registered successfully`
      });
    });

    // Unregister wallet
    this.app.post('/wallet/unregister', (req, res) => {
      const { address } = req.body;
      
      if (this.connectedWallets.has(address)) {
        this.connectedWallets.delete(address);
        res.json({
          success: true,
          message: 'Wallet unregistered successfully'
        });
      } else {
        res.status(404).json({
          success: false,
          message: 'Wallet not found'
        });
      }
    });

    // Get connected wallets
    this.app.get('/wallets', (req, res) => {
      const wallets = Array.from(this.connectedWallets.values());
      res.json({
        wallets: wallets,
        count: wallets.length
      });
    });
  }

  /**
   * Add transaction to history for light wallets
   * @private
   * @param {EnhancedTransaction} transaction - Transaction to add
   */
  _addToTransactionHistory(transaction) {
    const key = `${transaction.from}_${transaction.to}_${transaction.hash}`;
    this.transactionHistory.set(key, {
      hash: transaction.hash,
      from: transaction.from,
      to: transaction.to,
      value: transaction.value,
      baseFee: transaction.baseFee,
      priorityFee: transaction.priorityFee,
      nonce: transaction.nonce,
      data: transaction.data,
      timestamp: Date.now()
    });
  }

  /**
   * Get incoming transactions for an address
   * @private
   * @param {string} address - Address to check
   * @returns {Array} - Incoming transactions
   */
  _getIncomingTransactions(address) {
    const incoming = [];
    
    for (const [key, tx] of this.transactionHistory) {
      if (tx.to === address) {
        incoming.push(tx);
      }
    }
    
    return incoming;
  }

  /**
   * Start the server
   */
  start() {
    if (this.isRunning) {
      console.log(`[SharedServer] ⚠️  Server already running`);
      return;
    }

    this.server = this.app.listen(this.port, () => {
      this.isRunning = true;
      console.log(`[SharedServer] 🚀 Server started on port ${this.port}`);
      console.log(`   Health check: http://localhost:${this.port}/health`);
      console.log(`   Blockchain info: http://localhost:${this.port}/blockchain`);
      console.log(`   API docs: http://localhost:${this.port}/stats`);
    });

    // Handle server shutdown
    this.server.on('close', () => {
      this.isRunning = false;
      console.log(`[SharedServer] 🔌 Server stopped`);
    });
  }

  /**
   * Stop the server
   */
  stop() {
    if (!this.isRunning) {
      console.log(`[SharedServer] ⚠️  Server not running`);
      return;
    }

    this.server.close(() => {
      console.log(`[SharedServer] 🔌 Server stopped gracefully`);
    });
  }

  /**
   * Get server status
   * @returns {Object} - Server status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      port: this.port,
      connectedWallets: this.connectedWallets.size,
      blockchainLength: this.blockchain.chain.length,
      pendingTransactions: this.blockchain.pendingTransactions.length,
      uptime: process.uptime()
    };
  }

  /**
   * Print server status
   */
  printStatus() {
    const status = this.getStatus();
    
    console.log(`\n[SharedServer] 📊 SERVER STATUS`);
    console.log('═══════════════════════════════════════════════════════════════════════════════');
    console.log(`   Running: ${status.isRunning ? 'YES' : 'NO'}`);
    console.log(`   Port: ${status.port}`);
    console.log(`   Connected Wallets: ${status.connectedWallets}`);
    console.log(`   Blockchain Length: ${status.blockchainLength}`);
    console.log(`   Pending Transactions: ${status.pendingTransactions}`);
    console.log(`   Uptime: ${Math.floor(status.uptime)}s`);
  }
}

module.exports = SharedServer; 