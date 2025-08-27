const crypto = require('crypto');
const { EnhancedBloomFilter } = require('./enhancedBloomFilter');
const { EnhancedMerkleTree } = require('./enhancedMerkleTree');

/**
 * Light Wallet Implementation
 * Provides transaction verification capabilities without storing the full blockchain
 */
class LightWallet {
  /**
   * Create a new light wallet
   * @param {string} address - Wallet address
   * @param {string} name - Wallet name
   */
  constructor(address, name = 'LightWallet') {
    this.address = address;
    this.name = name;
    this.bloomFilter = new EnhancedBloomFilter(2048, 5, `${name}_BloomFilter`);
    this.merkleTree = new EnhancedMerkleTree([], `${name}_MerkleTree`);
    this.knownTransactions = new Set();
    this.verifiedBlocks = new Map(); // blockHash -> { transactions, merkleRoot }
    this.balance = 0;
    this.nonce = 0;
  }

  /**
   * Generate hash for data
   * @param {string} data - Data to hash
   * @returns {string} - Hash value
   */
  _hash(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Update the wallet's Bloom filter with new transactions
   * @param {Array} transactions - Array of transaction hashes
   */
  updateBloomFilter(transactions) {
    console.log(`[${this.name}] 🔄 Updating Bloom filter with ${transactions.length} transactions`);
    
    transactions.forEach(txHash => {
      if (!this.knownTransactions.has(txHash)) {
        this.bloomFilter.add(txHash);
        this.knownTransactions.add(txHash);
      }
    });
  }

  /**
   * Update the wallet's Merkle tree with new block data
   * @param {string} blockHash - Block hash
   * @param {Array} transactions - Array of transaction hashes
   * @param {string} merkleRoot - Merkle root of the block
   */
  updateMerkleTree(blockHash, transactions, merkleRoot) {
    console.log(`[${this.name}] 🔄 Updating Merkle tree for block ${blockHash.substring(0, 16)}...`);
    
    // Store block information
    this.verifiedBlocks.set(blockHash, {
      transactions: [...transactions],
      merkleRoot: merkleRoot,
      timestamp: Date.now()
    });

    // Update Merkle tree with new transactions
    transactions.forEach(txHash => {
      if (!this.merkleTree.transactions.includes(txHash)) {
        this.merkleTree.addTransaction(txHash);
      }
    });
  }

  /**
   * Verify if a transaction exists using Bloom filter (fast check)
   * @param {string} transactionHash - Hash of the transaction to verify
   * @returns {Object} - Verification result
   */
  verifyTransactionExistence(transactionHash) {
    console.log(`\n[${this.name}] 🔍 Verifying transaction existence: "${transactionHash}"`);
    
    const bloomResult = this.bloomFilter.search(transactionHash);
    
    if (!bloomResult.mightContain) {
      console.log(`   ✅ Transaction definitely NOT in network (Bloom filter)`);
      return {
        exists: false,
        confidence: 'definite',
        method: 'bloom_filter',
        bloomResult: bloomResult
      };
    }

    if (bloomResult.isFalsePositive) {
      console.log(`   ⚠️  False positive detected in Bloom filter`);
      return {
        exists: false,
        confidence: 'false_positive',
        method: 'bloom_filter',
        bloomResult: bloomResult
      };
    }

    console.log(`   🔍 Transaction might exist, checking Merkle tree...`);
    
    // Check Merkle tree for definitive answer
    const merkleResult = this.merkleTree.verifyTransactionInclusion(transactionHash);
    
    if (merkleResult.found) {
      console.log(`   ✅ Transaction EXISTS (verified by Merkle proof)`);
      return {
        exists: true,
        confidence: 'verified',
        method: 'merkle_proof',
        bloomResult: bloomResult,
        merkleResult: merkleResult
      };
    } else {
      console.log(`   ❌ Transaction NOT FOUND (Merkle tree verification)`);
      return {
        exists: false,
        confidence: 'verified',
        method: 'merkle_proof',
        bloomResult: bloomResult,
        merkleResult: merkleResult
      };
    }
  }

  /**
   * Verify transaction non-existence (prove absence)
   * @param {string} transactionHash - Hash of the transaction to verify absence
   * @returns {Object} - Verification result
   */
  verifyTransactionNonExistence(transactionHash) {
    console.log(`\n[${this.name}] 🔍 Verifying transaction NON-existence: "${transactionHash}"`);
    
    const result = this.verifyTransactionExistence(transactionHash);
    
    if (!result.exists) {
      console.log(`   ✅ Transaction definitely does NOT exist`);
      return {
        nonExists: true,
        confidence: result.confidence,
        method: result.method,
        details: result
      };
    } else {
      console.log(`   ❌ Transaction EXISTS (cannot prove non-existence)`);
      return {
        nonExists: false,
        confidence: 'verified_exists',
        method: result.method,
        details: result
      };
    }
  }

  /**
   * Get transaction proof for inclusion
   * @param {string} transactionHash - Hash of the transaction
   * @returns {Object} - Proof object
   */
  getTransactionProof(transactionHash) {
    console.log(`\n[${this.name}] 📋 Getting transaction proof: "${transactionHash}"`);
    
    const proof = this.merkleTree.getProof(transactionHash);
    
    if (proof) {
      console.log(`   ✅ Proof generated successfully`);
      console.log(`   📊 Proof details:`);
      console.log(`      Leaf index: ${proof.leafIndex}`);
      console.log(`      Path length: ${proof.path.length}`);
      console.log(`      Siblings count: ${proof.siblings.length}`);
      
      return {
        exists: true,
        proof: proof,
        merkleRoot: this.merkleTree.getRoot(),
        blockInfo: this._findBlockContainingTransaction(transactionHash)
      };
    } else {
      console.log(`   ❌ No proof available (transaction not found)`);
      return {
        exists: false,
        proof: null,
        merkleRoot: this.merkleTree.getRoot()
      };
    }
  }

  /**
   * Find which block contains a specific transaction
   * @param {string} transactionHash - Hash of the transaction
   * @returns {Object|null} - Block information
   */
  _findBlockContainingTransaction(transactionHash) {
    for (const [blockHash, blockData] of this.verifiedBlocks) {
      if (blockData.transactions.includes(transactionHash)) {
        return {
          blockHash: blockHash,
          merkleRoot: blockData.merkleRoot,
          timestamp: blockData.timestamp
        };
      }
    }
    return null;
  }

  /**
   * Update wallet balance based on transaction
   * @param {Object} transaction - Transaction object
   */
  updateBalance(transaction) {
    if (transaction.from === this.address) {
      this.balance -= (transaction.value + transaction.baseFee + transaction.priorityFee);
      this.nonce++;
      console.log(`[${this.name}] 💸 Sent: -${transaction.value} KIKI (fees: -${transaction.baseFee + transaction.priorityFee})`);
    }
    
    if (transaction.to === this.address) {
      this.balance += transaction.value;
      console.log(`[${this.name}] 💰 Received: +${transaction.value} KIKI`);
    }
  }

  /**
   * Get wallet statistics
   * @returns {Object} - Wallet statistics
   */
  getStats() {
    return {
      address: this.address,
      name: this.name,
      balance: this.balance,
      nonce: this.nonce,
      knownTransactions: this.knownTransactions.size,
      verifiedBlocks: this.verifiedBlocks.size,
      bloomFilterStats: this.bloomFilter.getStats(),
      merkleTreeStats: this.merkleTree.getStats()
    };
  }

  /**
   * Print wallet statistics
   */
  printStats() {
    const stats = this.getStats();
    console.log(`\n[${this.name}] 📊 Light Wallet Statistics:`);
    console.log(`   Address: ${stats.address}`);
    console.log(`   Balance: ${stats.balance} KIKI`);
    console.log(`   Nonce: ${stats.nonce}`);
    console.log(`   Known transactions: ${stats.knownTransactions}`);
    console.log(`   Verified blocks: ${stats.verifiedBlocks}`);
    console.log(`   Bloom filter items: ${stats.bloomFilterStats.itemCount}`);
    console.log(`   Merkle tree leaves: ${stats.merkleTreeStats.leafCount}`);
  }

  /**
   * Serialize wallet to JSON
   * @returns {Object} - Serialized wallet
   */
  toJSON() {
    return {
      address: this.address,
      name: this.name,
      balance: this.balance,
      nonce: this.nonce,
      knownTransactions: Array.from(this.knownTransactions),
      verifiedBlocks: Object.fromEntries(this.verifiedBlocks),
      bloomFilter: this.bloomFilter.toJSON(),
      merkleTree: this.merkleTree.toJSON()
    };
  }

  /**
   * Create wallet from JSON
   * @param {Object} data - Serialized wallet data
   * @returns {LightWallet} - Wallet instance
   */
  static fromJSON(data) {
    const wallet = new LightWallet(data.address, data.name);
    wallet.balance = data.balance;
    wallet.nonce = data.nonce;
    wallet.knownTransactions = new Set(data.knownTransactions);
    wallet.verifiedBlocks = new Map(Object.entries(data.verifiedBlocks));
    wallet.bloomFilter = EnhancedBloomFilter.fromJSON(data.bloomFilter);
    wallet.merkleTree = EnhancedMerkleTree.fromJSON(data.merkleTree);
    return wallet;
  }
}

/**
 * Demo function for Light Wallet
 */
function runLightWalletDemo() {
  console.log('\n💡 Light Wallet Demo');
  console.log('===================');

  // Create light wallet
  const wallet = new LightWallet('0x1234567890123456789012345678901234567890', 'AliceWallet');
  
  // Sample transaction hashes
  const transactions = [
    'tx_hash_001_abc123def456',
    'tx_hash_002_ghi789jkl012',
    'tx_hash_003_mno345pqr678',
    'tx_hash_004_stu901vwx234',
    'tx_hash_005_yz567abc890',
    'tx_hash_006_def123ghi456',
    'tx_hash_007_jkl789mno012',
    'tx_hash_008_pqr345stu678'
  ];

  // Sample block data
  const blockHash = 'block_hash_001_abcdef123456';
  const merkleRoot = 'merkle_root_001_abcdef123456';

  console.log('\n📝 Initializing wallet with network data:');
  
  // Update wallet with network data
  wallet.updateBloomFilter(transactions);
  wallet.updateMerkleTree(blockHash, transactions, merkleRoot);
  
  // Print initial statistics
  wallet.printStats();

  console.log('\n🔍 Testing transaction verification:');
  
  // Test existing transactions
  console.log('\n--- Testing existing transactions ---');
  wallet.verifyTransactionExistence('tx_hash_001_abc123def456');
  wallet.verifyTransactionExistence('tx_hash_004_stu901vwx234');
  wallet.verifyTransactionExistence('tx_hash_008_pqr345stu678');

  // Test non-existing transactions
  console.log('\n--- Testing non-existing transactions ---');
  wallet.verifyTransactionExistence('tx_hash_999_nonexistent');
  wallet.verifyTransactionExistence('tx_hash_fake_123');

  console.log('\n🔍 Testing transaction non-existence verification:');
  
  // Test non-existence verification
  wallet.verifyTransactionNonExistence('tx_hash_999_nonexistent');
  wallet.verifyTransactionNonExistence('tx_hash_001_abc123def456'); // Should fail

  console.log('\n📋 Testing proof generation:');
  
  // Test proof generation
  wallet.getTransactionProof('tx_hash_001_abc123def456');
  wallet.getTransactionProof('tx_hash_999_nonexistent');

  console.log('\n💰 Testing balance updates:');
  
  // Simulate some transactions
  const tx1 = {
    from: wallet.address,
    to: '0x2345678901234567890123456789012345678901',
    value: 50,
    baseFee: 2,
    priorityFee: 3
  };
  
  const tx2 = {
    from: '0x3456789012345678901234567890123456789012',
    to: wallet.address,
    value: 100,
    baseFee: 2,
    priorityFee: 3
  };

  wallet.balance = 300; // Initial balance
  wallet.updateBalance(tx1);
  wallet.updateBalance(tx2);
  
  wallet.printStats();

  return wallet;
}

module.exports = { LightWallet, runLightWalletDemo }; 