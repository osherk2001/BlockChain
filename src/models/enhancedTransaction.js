const crypto = require('crypto');

/**
 * Enhanced Transaction Model with Simplified EIP-1559 and SegWit Support
 * Implements the specified fee structure and SegWit functionality
 */
class EnhancedTransaction {
  /**
   * Create a new enhanced transaction
   * @param {Object} params - Transaction parameters
   * @param {string} params.from - Sender address
   * @param {string} params.to - Recipient address
   * @param {number} params.value - Amount to transfer
   * @param {number} params.baseFee - Base fee (burned)
   * @param {number} params.priorityFee - Priority fee (paid to miner)
   * @param {number} params.nonce - Transaction nonce
   * @param {string} params.data - Transaction data
   * @param {string} params.privateKey - Sender's private key
   */
  constructor(params) {
    this.from = params.from;
    this.to = params.to;
    this.value = params.value || 0;
    this.baseFee = params.baseFee || 2; // Fixed base fee of 2 coins
    this.priorityFee = params.priorityFee || 3; // Fixed priority fee of 3 coins
    this.nonce = params.nonce || 0;
    this.data = params.data || '';
    this.privateKey = params.privateKey;
    
    // SegWit fields
    this.witness = null; // Signature data (separated from main transaction)
    this.hash = null;
    this.witnessHash = null; // Hash without signature data
    
    // Calculate total cost
    this.totalCost = this.value + this.baseFee + this.priorityFee;
    
    if (this.privateKey) {
      this.sign();
    } else {
      // For demo purposes, generate a hash without signing
      this.witnessHash = this._hash(this._getSignMessage());
      this.hash = this.witnessHash;
    }
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
   * Get the message to sign (without signature data for SegWit)
   * @returns {string} - Message to sign
   */
  _getSignMessage() {
    const txData = {
      from: this.from,
      to: this.to,
      value: this.value,
      baseFee: this.baseFee,
      priorityFee: this.priorityFee,
      nonce: this.nonce,
      data: this.data,
      totalCost: this.totalCost
    };
    
    return JSON.stringify(txData);
  }

  /**
   * Sign the transaction (SegWit style)
   */
  sign() {
    if (!this.privateKey) {
      throw new Error('Private key required for signing');
    }

    const message = this._getSignMessage();
    
    // Create signature
    const sign = crypto.createSign('SHA256');
    sign.update(message);
    this.witness = sign.sign(this.privateKey, 'hex');
    
    // Calculate witness hash (hash without signature)
    this.witnessHash = this._hash(message);
    
    // Calculate full transaction hash (including signature)
    const fullTxData = {
      ...JSON.parse(message),
      witness: this.witness
    };
    this.hash = this._hash(JSON.stringify(fullTxData));
    
    console.log(`[EnhancedTransaction] ✅ Transaction signed`);
    console.log(`   Witness hash: ${this.witnessHash}`);
    console.log(`   Full hash: ${this.hash}`);
  }

  /**
   * Verify transaction signature
   * @param {string} publicKey - Sender's public key
   * @returns {boolean} - True if signature is valid
   */
  verifySignature(publicKey) {
    if (!this.witness) return false;
    
    const message = this._getSignMessage();
    const verify = crypto.createVerify('SHA256');
    verify.update(message);
    return verify.verify(publicKey, this.witness, 'hex');
  }

  /**
   * Get transaction without witness data (SegWit)
   * @returns {Object} - Transaction without signature
   */
  getWitnessTransaction() {
    return {
      from: this.from,
      to: this.to,
      value: this.value,
      baseFee: this.baseFee,
      priorityFee: this.priorityFee,
      nonce: this.nonce,
      data: this.data,
      totalCost: this.totalCost,
      witnessHash: this.witnessHash
    };
  }

  /**
   * Get full transaction with witness data
   * @returns {Object} - Complete transaction
   */
  getFullTransaction() {
    return {
      ...this.getWitnessTransaction(),
      witness: this.witness,
      hash: this.hash
    };
  }

  /**
   * Validate transaction
   * @param {Object} balances - Current balances
   * @returns {Object} - Validation result
   */
  validate(balances = {}) {
    const senderBalance = balances[this.from] || 0;
    const errors = [];
    const warnings = [];

    // Check if sender has sufficient balance
    if (senderBalance < this.totalCost) {
      errors.push(`Insufficient balance: ${senderBalance} < ${this.totalCost}`);
    }

    // Check if value is positive
    if (this.value <= 0) {
      errors.push('Transaction value must be positive');
    }

    // Check if fees are correct
    if (this.baseFee !== 2) {
      warnings.push(`Base fee should be 2, got ${this.baseFee}`);
    }

    if (this.priorityFee !== 3) {
      warnings.push(`Priority fee should be 3, got ${this.priorityFee}`);
    }

    // Check if addresses are valid
    if (!this.from || !this.to) {
      errors.push('Invalid addresses');
    }

    if (this.from === this.to) {
      warnings.push('Sender and recipient are the same');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      senderBalance,
      requiredBalance: this.totalCost,
      hasSufficientFunds: senderBalance >= this.totalCost
    };
  }

  /**
   * Get transaction summary
   * @returns {Object} - Transaction summary
   */
  getSummary() {
    return {
      hash: this.hash,
      from: this.from,
      to: this.to,
      value: this.value,
      baseFee: this.baseFee,
      priorityFee: this.priorityFee,
      totalCost: this.totalCost,
      nonce: this.nonce,
      data: this.data,
      witnessHash: this.witnessHash,
      hasWitness: !!this.witness
    };
  }

  /**
   * Print transaction details
   */
  printDetails() {
    console.log(`\n[EnhancedTransaction] 📋 Transaction Details:`);
    console.log(`   Hash: ${this.hash}`);
    console.log(`   From: ${this.from}`);
    console.log(`   To: ${this.to}`);
    console.log(`   Value: ${this.value} KIKI`);
    console.log(`   Base Fee: ${this.baseFee} KIKI (burned)`);
    console.log(`   Priority Fee: ${this.priorityFee} KIKI (to miner)`);
    console.log(`   Total Cost: ${this.totalCost} KIKI`);
    console.log(`   Nonce: ${this.nonce}`);
    console.log(`   Data: ${this.data}`);
    console.log(`   Witness Hash: ${this.witnessHash}`);
    console.log(`   Has Witness: ${!!this.witness}`);
  }

  /**
   * Serialize transaction to JSON
   * @returns {Object} - Serialized transaction
   */
  toJSON() {
    return {
      hash: this.hash,
      witnessHash: this.witnessHash,
      from: this.from,
      to: this.to,
      value: this.value,
      baseFee: this.baseFee,
      priorityFee: this.priorityFee,
      nonce: this.nonce,
      data: this.data,
      totalCost: this.totalCost,
      witness: this.witness
    };
  }

  /**
   * Create transaction from JSON
   * @param {Object} data - Serialized transaction data
   * @returns {EnhancedTransaction} - Transaction instance
   */
  static fromJSON(data) {
    const tx = new EnhancedTransaction({
      from: data.from,
      to: data.to,
      value: data.value,
      baseFee: data.baseFee,
      priorityFee: data.priorityFee,
      nonce: data.nonce,
      data: data.data
    });
    
    tx.hash = data.hash;
    tx.witnessHash = data.witnessHash;
    tx.witness = data.witness;
    tx.totalCost = data.totalCost;
    
    return tx;
  }
}

module.exports = EnhancedTransaction; 