const crypto = require('crypto');

/**
 * Enhanced Merkle Tree Implementation
 * Provides efficient transaction verification and inclusion proofs with comprehensive demo functionality
 */
class EnhancedMerkleTree {
  /**
   * Create a new enhanced Merkle tree
   * @param {Array} transactions - Array of transaction hashes
   * @param {string} name - Name for identification
   */
  constructor(transactions = [], name = 'MerkleTree') {
    this.transactions = transactions;
    this.name = name;
    this.tree = this._buildTree(transactions);
    this.root = this.tree.length > 0 ? this.tree[this.tree.length - 1][0] : null;
    this.leafCount = transactions.length;
    this.height = this.tree.length;
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
   * Build the Merkle tree from transaction hashes
   * @param {Array} transactions - Array of transaction hashes
   * @returns {Array} - Tree structure
   */
  _buildTree(transactions) {
    if (transactions.length === 0) return [];
    
    // Convert transactions to hashes if they aren't already
    const leaves = transactions.map(tx => 
      typeof tx === 'string' ? tx : this._hash(JSON.stringify(tx))
    );
    
    const tree = [leaves];
    let currentLevel = leaves;
    
    while (currentLevel.length > 1) {
      const nextLevel = [];
      
      for (let i = 0; i < currentLevel.length; i += 2) {
        const left = currentLevel[i];
        const right = i + 1 < currentLevel.length ? currentLevel[i + 1] : left;
        const combined = left + right;
        nextLevel.push(this._hash(combined));
      }
      
      tree.push(nextLevel);
      currentLevel = nextLevel;
    }
    
    return tree;
  }

  /**
   * Get the Merkle root
   * @returns {string} - Merkle root hash
   */
  getRoot() {
    return this.root;
  }

  /**
   * Get proof for a specific transaction
   * @param {string} transactionHash - Hash of the transaction
   * @returns {Object} - Proof object with path and siblings
   */
  getProof(transactionHash) {
    if (this.tree.length === 0) return null;
    
    let index = this.tree[0].findIndex(hash => hash === transactionHash);
    if (index === -1) return null;
    
    const proof = {
      path: [],
      siblings: [],
      leafIndex: index
    };
    
    for (let level = 0; level < this.tree.length - 1; level++) {
      const isRight = index % 2 === 1;
      const siblingIndex = isRight ? index - 1 : index + 1;
      
      proof.path.push(isRight);
      proof.siblings.push(this.tree[level][siblingIndex]);
      
      index = Math.floor(index / 2);
    }
    
    return proof;
  }

  /**
   * Verify a Merkle proof
   * @param {string} transactionHash - Hash of the transaction
   * @param {Object} proof - Proof object
   * @param {string} root - Expected root hash
   * @returns {boolean} - True if proof is valid
   */
  static verifyProof(transactionHash, proof, root) {
    if (!proof || !proof.path || !proof.siblings) {
      return false;
    }

    let currentHash = transactionHash;
    
    for (let i = 0; i < proof.path.length; i++) {
      const isRight = proof.path[i];
      const sibling = proof.siblings[i];
      
      if (isRight) {
        currentHash = crypto.createHash('sha256').update(sibling + currentHash).digest('hex');
      } else {
        currentHash = crypto.createHash('sha256').update(currentHash + sibling).digest('hex');
      }
    }
    
    return currentHash === root;
  }

  /**
   * Add a new transaction to the tree
   * @param {string} transactionHash - Hash of the new transaction
   */
  addTransaction(transactionHash) {
    this.transactions.push(transactionHash);
    this.tree = this._buildTree(this.transactions);
    this.root = this.tree.length > 0 ? this.tree[this.tree.length - 1][0] : null;
    this.leafCount = this.transactions.length;
    this.height = this.tree.length;
    
    console.log(`[${this.name}] ✅ Added transaction: "${transactionHash}"`);
    console.log(`[${this.name}] 📊 New root: ${this.root}`);
  }

  /**
   * Get the number of transactions in the tree
   * @returns {number} - Transaction count
   */
  getTransactionCount() {
    return this.transactions.length;
  }

  /**
   * Get all transaction hashes
   * @returns {Array} - Array of transaction hashes
   */
  getTransactions() {
    return [...this.transactions];
  }

  /**
   * Get tree statistics
   * @returns {Object} - Tree statistics
   */
  getStats() {
    return {
      name: this.name,
      leafCount: this.leafCount,
      height: this.height,
      root: this.root,
      totalNodes: this.tree.reduce((sum, level) => sum + level.length, 0)
    };
  }

  /**
   * Print detailed statistics
   */
  printStats() {
    const stats = this.getStats();
    console.log(`\n[${this.name}] 📊 Merkle Tree Statistics:`);
    console.log(`   Leaf count: ${stats.leafCount}`);
    console.log(`   Tree height: ${stats.height}`);
    console.log(`   Total nodes: ${stats.totalNodes}`);
    console.log(`   Root hash: ${stats.root}`);
  }

  /**
   * Print the tree structure (for debugging)
   */
  printTree() {
    console.log(`\n[${this.name}] 🌳 Merkle Tree Structure:`);
    this.tree.forEach((level, index) => {
      console.log(`   Level ${index}: ${level.length} nodes`);
      level.forEach((hash, hashIndex) => {
        console.log(`     [${hashIndex}]: ${hash.substring(0, 16)}...`);
      });
    });
  }

  /**
   * Verify transaction inclusion with detailed logging
   * @param {string} transactionHash - Hash of the transaction to verify
   * @returns {Object} - Verification result
   */
  verifyTransactionInclusion(transactionHash) {
    console.log(`\n[${this.name}] 🔍 Verifying transaction inclusion: "${transactionHash}"`);
    
    const proof = this.getProof(transactionHash);
    if (!proof) {
      console.log(`   ❌ Transaction not found in tree`);
      return { found: false, valid: false, proof: null };
    }

    const isValid = EnhancedMerkleTree.verifyProof(transactionHash, proof, this.root);
    
    console.log(`   ✅ Transaction found at leaf index: ${proof.leafIndex}`);
    console.log(`   📊 Proof path length: ${proof.path.length}`);
    console.log(`   🔗 Proof verification: ${isValid ? '✅ VALID' : '❌ INVALID'}`);
    console.log(`   🌳 Root verification: ${isValid ? '✅ MATCHES' : '❌ MISMATCH'}`);
    
    return {
      found: true,
      valid: isValid,
      proof: proof,
      leafIndex: proof.leafIndex,
      pathLength: proof.path.length
    };
  }

  /**
   * Serialize the Merkle tree to JSON
   * @returns {Object} - Serialized tree
   */
  toJSON() {
    return {
      name: this.name,
      transactions: this.transactions,
      root: this.root,
      tree: this.tree,
      leafCount: this.leafCount,
      height: this.height
    };
  }

  /**
   * Create Merkle tree from JSON
   * @param {Object} data - Serialized tree data
   * @returns {EnhancedMerkleTree} - Merkle tree instance
   */
  static fromJSON(data) {
    const tree = new EnhancedMerkleTree([], data.name);
    tree.transactions = data.transactions;
    tree.tree = data.tree;
    tree.root = data.root;
    tree.leafCount = data.leafCount;
    tree.height = data.height;
    return tree;
  }
}

/**
 * Demo function for Merkle Tree
 */
function runMerkleTreeDemo() {
  console.log('\n🌳 Enhanced Merkle Tree Demo');
  console.log('============================');

  // Create sample transaction hashes
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

  console.log('\n📝 Creating Merkle Tree with transactions:');
  transactions.forEach((tx, index) => {
    console.log(`   [${index}] ${tx}`);
  });

  // Create Merkle tree
  const merkleTree = new EnhancedMerkleTree(transactions, 'DemoTree');
  
  // Print statistics
  merkleTree.printStats();
  merkleTree.printTree();

  console.log('\n🔍 Testing transaction inclusion verification:');
  
  // Test existing transactions
  console.log('\n--- Testing existing transactions ---');
  merkleTree.verifyTransactionInclusion('tx_hash_001_abc123def456');
  merkleTree.verifyTransactionInclusion('tx_hash_004_stu901vwx234');
  merkleTree.verifyTransactionInclusion('tx_hash_008_pqr345stu678');

  // Test non-existing transactions
  console.log('\n--- Testing non-existing transactions ---');
  merkleTree.verifyTransactionInclusion('tx_hash_999_nonexistent');
  merkleTree.verifyTransactionInclusion('tx_hash_fake_123');

  console.log('\n📊 Testing proof generation and verification:');
  
  // Generate and verify proofs
  const testTransactions = [
    'tx_hash_001_abc123def456',
    'tx_hash_005_yz567abc890',
    'tx_hash_008_pqr345stu678'
  ];

  testTransactions.forEach(txHash => {
    console.log(`\n--- Proof for "${txHash}" ---`);
    const proof = merkleTree.getProof(txHash);
    
    if (proof) {
      console.log(`   Leaf index: ${proof.leafIndex}`);
      console.log(`   Path: ${proof.path.map(p => p ? 'RIGHT' : 'LEFT').join(' → ')}`);
      console.log(`   Siblings: ${proof.siblings.length} nodes`);
      
      // Verify the proof
      const isValid = EnhancedMerkleTree.verifyProof(txHash, proof, merkleTree.getRoot());
      console.log(`   Proof verification: ${isValid ? '✅ VALID' : '❌ INVALID'}`);
    } else {
      console.log(`   ❌ No proof found (transaction not in tree)`);
    }
  });

  console.log('\n➕ Testing dynamic transaction addition:');
  
  // Add new transaction
  const newTx = 'tx_hash_009_new_transaction';
  merkleTree.addTransaction(newTx);
  
  // Verify the new transaction
  merkleTree.verifyTransactionInclusion(newTx);
  
  // Print updated statistics
  merkleTree.printStats();

  return merkleTree;
}

module.exports = { EnhancedMerkleTree, runMerkleTreeDemo }; 