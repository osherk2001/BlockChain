const express = require('express');
const bodyParser = require('body-parser');
const Blockchain = require('./blockchain');
const Transaction = require('./models/transaction');
const CryptoUtils = require('./utils/crypto');

class KikiNode {
  /**
   * Create a new Kiki full node
   * @param {Object} config - Node configuration
   */
  constructor(config = {}) {
    this.blockchain = new Blockchain(config.blockchain);
    this.app = express();
    this.port = config.port || 3000;
    this.nodeId = CryptoUtils.sha256(Date.now().toString()).substring(0, 8);
    
    this._setupMiddleware();
    this._setupRoutes();
  }

  /**
   * Setup Express middleware
   */
  _setupMiddleware() {
    this.app.use(bodyParser.json());
    this.app.use((req, res, next) => {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
      next();
    });
  }

  /**
   * Setup API routes
   */
  _setupRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        nodeId: this.nodeId,
        timestamp: new Date().toISOString()
      });
    });

    // Get blockchain info
    this.app.get('/blockchain', (req, res) => {
      const stats = this.blockchain.getStats();
      res.json({
        nodeId: this.nodeId,
        chainLength: stats.chainLength,
        latestBlock: this.blockchain.getLatestBlock().toJSON(),
        pendingTransactions: stats.pendingTransactions,
        mempoolSize: stats.mempoolSize,
        difficulty: stats.currentDifficulty,
        baseFeePerGas: stats.baseFeePerGas,
        miningReward: this.blockchain.miningReward
      });
    });

    // Get specific block
    this.app.get('/block/:index', (req, res) => {
      const index = parseInt(req.params.index);
      const block = this.blockchain.chain[index];
      
      if (block) {
        res.json(block.toJSON());
      } else {
        res.status(404).json({ error: 'Block not found' });
      }
    });

    // Get all blocks
    this.app.get('/blocks', (req, res) => {
      const blocks = this.blockchain.chain.map(block => ({
        index: block.index,
        hash: block.hash,
        previousHash: block.previousHash,
        timestamp: block.timestamp,
        transactions: block.transactions.length,
        merkleRoot: block.merkleRoot,
        difficulty: block.difficulty,
        nonce: block.nonce,
        size: block.getSize()
      }));
      
      res.json(blocks);
    });

    // Create new transaction
    this.app.post('/transaction', (req, res) => {
      try {
        const {
          from,
          to,
          value,
          gasLimit = 21000,
          maxPriorityFeePerGas = 1000000000,
          maxFeePerGas = 20000000000,
          nonce = 0,
          privateKey
        } = req.body;

        if (!from || !to || !value || !privateKey) {
          return res.status(400).json({
            error: 'Missing required fields: from, to, value, privateKey'
          });
        }

        const transaction = new Transaction({
          from,
          to,
          value: parseInt(value),
          gasLimit: parseInt(gasLimit),
          maxPriorityFeePerGas: parseInt(maxPriorityFeePerGas),
          maxFeePerGas: parseInt(maxFeePerGas),
          nonce: parseInt(nonce),
          privateKey
        });

        const success = this.blockchain.addTransaction(transaction);

        if (success) {
          res.json({
            success: true,
            transaction: transaction.toJSON(),
            message: 'Transaction added to mempool'
          });
        } else {
          res.status(400).json({
            success: false,
            error: 'Transaction validation failed'
          });
        }
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });

    // Get transaction by hash
    this.app.get('/transaction/:hash', (req, res) => {
      const transaction = this.blockchain.getTransaction(req.params.hash);
      
      if (transaction) {
        res.json(transaction.toJSON());
      } else {
        res.status(404).json({ error: 'Transaction not found' });
      }
    });

    // Get pending transactions
    this.app.get('/transactions/pending', (req, res) => {
      const transactions = this.blockchain.pendingTransactions.map(tx => ({
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        value: tx.value,
        gasLimit: tx.gasLimit,
        maxPriorityFeePerGas: tx.maxPriorityFeePerGas,
        maxFeePerGas: tx.maxFeePerGas,
        nonce: tx.nonce,
        effectiveGasPrice: tx.getEffectiveGasPrice(this.blockchain.baseFeePerGas),
        priority: tx.getPriority(this.blockchain.baseFeePerGas)
      }));
      
      res.json(transactions);
    });

    // Get balance for address
    this.app.get('/balance/:address', (req, res) => {
      const balance = this.blockchain.getBalance(req.params.address);
      res.json({
        address: req.params.address,
        balance: balance,
        unit: 'KIKI'
      });
    });

    // Mine a block
    this.app.post('/mine', (req, res) => {
      const { minerAddress } = req.body;
      
      if (!minerAddress) {
        return res.status(400).json({
          error: 'Miner address is required'
        });
      }

      console.log(`Mining request received for address: ${minerAddress}`);
      
      const startTime = Date.now();
      const minedBlock = this.blockchain.mineBlock(minerAddress);
      const miningTime = Date.now() - startTime;

      if (minedBlock) {
        res.json({
          success: true,
          block: minedBlock.toJSON(),
          miningTime: miningTime,
          message: `Block ${minedBlock.index} mined successfully`
        });
      } else {
        res.status(400).json({
          success: false,
          error: 'No transactions to mine or mining failed'
        });
      }
    });

    // Get blockchain statistics
    this.app.get('/stats', (req, res) => {
      const stats = this.blockchain.getStats();
      res.json({
        nodeId: this.nodeId,
        ...stats,
        chainValid: this.blockchain.isChainValid(),
        totalSupply: this._calculateTotalSupply()
      });
    });

    // Get UTXO set
    this.app.get('/utxo', (req, res) => {
      const utxoSet = Object.fromEntries(this.blockchain.utxoSet);
      res.json({
        utxoCount: this.blockchain.utxoSet.size,
        utxoSet: utxoSet
      });
    });

    // Check if transaction might be in bloom filter
    this.app.post('/bloom/check', (req, res) => {
      const { hash } = req.body;
      
      if (!hash) {
        return res.status(400).json({
          error: 'Transaction hash is required'
        });
      }

      const mightContain = this.blockchain.mightContainTransaction(hash);
      const falsePositiveRate = this.blockchain.bloomFilter.getFalsePositiveProbability();

      res.json({
        hash: hash,
        mightContain: mightContain,
        falsePositiveRate: falsePositiveRate,
        bloomFilterStats: this.blockchain.bloomFilter.toJSON()
      });
    });

    // Generate new key pair
    this.app.post('/wallet/new', (req, res) => {
      const keyPair = CryptoUtils.generateKeyPair();
      const address = CryptoUtils.sha256(keyPair.publicKey).substring(0, 40);
      
      res.json({
        address: address,
        publicKey: keyPair.publicKey,
        privateKey: keyPair.privateKey
      });
    });

    // Error handling
    this.app.use((err, req, res, next) => {
      console.error(err.stack);
      res.status(500).json({
        error: 'Internal server error',
        message: err.message
      });
    });

    // 404 handler
    this.app.use((req, res) => {
      res.status(404).json({
        error: 'Endpoint not found',
        availableEndpoints: [
          'GET /health',
          'GET /blockchain',
          'GET /blocks',
          'GET /block/:index',
          'POST /transaction',
          'GET /transaction/:hash',
          'GET /transactions/pending',
          'GET /balance/:address',
          'POST /mine',
          'GET /stats',
          'GET /utxo',
          'POST /bloom/check',
          'POST /wallet/new'
        ]
      });
    });
  }

  /**
   * Calculate total supply
   * @returns {number} - Total supply
   */
  _calculateTotalSupply() {
    let totalSupply = 0;
    
    // Calculate from mining rewards
    totalSupply += this.blockchain.chain.length * this.blockchain.miningReward;
    
    // Subtract burned fees (simplified calculation)
    for (const block of this.blockchain.chain) {
      totalSupply -= block.getTotalFees();
    }
    
    return Math.max(0, totalSupply);
  }

  /**
   * Start the node
   */
  start() {
    this.app.listen(this.port, () => {
      console.log('🚀 Kiki Blockchain Full Node');
      console.log('============================');
      console.log(`Node ID: ${this.nodeId}`);
      console.log(`Port: ${this.port}`);
      console.log(`Chain Length: ${this.blockchain.chain.length}`);
      console.log(`Difficulty: ${this.blockchain.difficulty}`);
      console.log(`Mining Reward: ${this.blockchain.miningReward} KIKI`);
      console.log(`Base Fee Per Gas: ${this.blockchain.baseFeePerGas}`);
      console.log('');
      console.log('📡 API Endpoints:');
      console.log(`  Health Check: http://localhost:${this.port}/health`);
      console.log(`  Blockchain Info: http://localhost:${this.port}/blockchain`);
      console.log(`  All Blocks: http://localhost:${this.port}/blocks`);
      console.log(`  Pending Transactions: http://localhost:${this.port}/transactions/pending`);
      console.log(`  Statistics: http://localhost:${this.port}/stats`);
      console.log('');
      console.log('💡 Example Usage:');
      console.log('  Create wallet: POST /wallet/new');
      console.log('  Send transaction: POST /transaction');
      console.log('  Mine block: POST /mine');
      console.log('  Check balance: GET /balance/:address');
      console.log('');
    });
  }

  /**
   * Stop the node
   */
  stop() {
    console.log('Shutting down Kiki node...');
    process.exit(0);
  }
}

// Start the node if this file is run directly
if (require.main === module) {
  const node = new KikiNode({
    blockchain: {
      difficulty: 3,
      miningReward: 50,
      baseFeePerGas: 0
    },
    port: 3000
  });

  node.start();

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down...');
    node.stop();
  });
}

module.exports = KikiNode; 