const CryptoUtils = require('./crypto');

class MerkleTree {
  /**
   * Create a new Merkle tree
   * @param {Array} transactions - Array of transaction hashes
   */
  constructor(transactions = []) {
    this.transactions = transactions;
    this.tree = this._buildTree(transactions);
    this.root = this.tree.length > 0 ? this.tree[this.tree.length - 1][0] : null;
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
      typeof tx === 'string' ? tx : CryptoUtils.doubleSha256(JSON.stringify(tx))
    );
    
    const tree = [leaves];
    let currentLevel = leaves;
    
    while (currentLevel.length > 1) {
      const nextLevel = [];
      
      for (let i = 0; i < currentLevel.length; i += 2) {
        const left = currentLevel[i];
        const right = i + 1 < currentLevel.length ? currentLevel[i + 1] : left;
        const combined = left + right;
        nextLevel.push(CryptoUtils.doubleSha256(combined));
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
      siblings: []
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
    let currentHash = transactionHash;
    
    for (let i = 0; i < proof.path.length; i++) {
      const isRight = proof.path[i];
      const sibling = proof.siblings[i];
      
      if (isRight) {
        currentHash = CryptoUtils.doubleSha256(sibling + currentHash);
      } else {
        currentHash = CryptoUtils.doubleSha256(currentHash + sibling);
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
    this.root = this.tree[this.tree.length - 1][0];
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
   * Serialize the Merkle tree to JSON
   * @returns {Object} - Serialized tree
   */
  toJSON() {
    return {
      transactions: this.transactions,
      root: this.root,
      tree: this.tree
    };
  }

  /**
   * Create Merkle tree from JSON
   * @param {Object} data - Serialized tree data
   * @returns {MerkleTree} - Merkle tree instance
   */
  static fromJSON(data) {
    const tree = new MerkleTree();
    tree.transactions = data.transactions;
    tree.tree = data.tree;
    tree.root = data.root;
    return tree;
  }
}

module.exports = MerkleTree; 