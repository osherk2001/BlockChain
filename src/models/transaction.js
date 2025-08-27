const CryptoUtils = require('../utils/crypto');

class Transaction {
  /**
   * Create a new transaction
   * @param {Object} params - Transaction parameters
   * @param {string} params.from - Sender address
   * @param {string} params.to - Recipient address
   * @param {number} params.value - Amount to transfer
   * @param {number} params.gasLimit - Gas limit for the transaction
   * @param {number} params.maxPriorityFeePerGas - Max priority fee per gas (EIP-1559)
   * @param {number} params.maxFeePerGas - Max fee per gas (EIP-1559)
   * @param {string} params.data - Transaction data
   * @param {number} params.nonce - Transaction nonce
   * @param {string} params.privateKey - Sender's private key
   */
  constructor(params) {
    this.from = params.from;
    this.to = params.to;
    this.value = params.value || 0;
    this.gasLimit = params.gasLimit || 21000;
    this.maxPriorityFeePerGas = params.maxPriorityFeePerGas || 0;
    this.maxFeePerGas = params.maxFeePerGas || 0;
    this.data = params.data || '';
    this.nonce = params.nonce || 0;
    this.privateKey = params.privateKey;
    
    // EIP-1559 fields
    this.type = 2; // EIP-1559 transaction type
    this.chainId = 1; // Kiki chain ID
    
    this.hash = null;
    this.signature = null;
    this.v = null;
    this.r = null;
    this.s = null;
    
    if (this.privateKey) {
      this.sign();
    }
  }

  /**
   * Sign the transaction
   */
  sign() {
    const message = this._getSignMessage();
    this.signature = CryptoUtils.sign(message, this.privateKey);
    
    // Split signature into v, r, s components
    const sigBuffer = Buffer.from(this.signature, 'hex');
    this.r = sigBuffer.slice(0, 32).toString('hex');
    this.s = sigBuffer.slice(32, 64).toString('hex');
    this.v = sigBuffer[64] + 27; // Add 27 to make it compatible with Ethereum
    
    this.hash = this._calculateHash();
  }

  /**
   * Get the message to sign
   * @returns {string} - Message to sign
   */
  _getSignMessage() {
    const txData = {
      type: this.type,
      chainId: this.chainId,
      nonce: this.nonce,
      maxPriorityFeePerGas: this.maxPriorityFeePerGas,
      maxFeePerGas: this.maxFeePerGas,
      gasLimit: this.gasLimit,
      to: this.to,
      value: this.value,
      data: this.data,
      accessList: [] // EIP-2930 access list (empty for now)
    };
    
    return JSON.stringify(txData);
  }

  /**
   * Calculate transaction hash
   * @returns {string} - Transaction hash
   */
  _calculateHash() {
    const txData = {
      type: this.type,
      chainId: this.chainId,
      nonce: this.nonce,
      maxPriorityFeePerGas: this.maxPriorityFeePerGas,
      maxFeePerGas: this.maxFeePerGas,
      gasLimit: this.gasLimit,
      to: this.to,
      value: this.value,
      data: this.data,
      accessList: [],
      v: this.v,
      r: this.r,
      s: this.s
    };
    
    return CryptoUtils.doubleSha256(JSON.stringify(txData));
  }

  /**
   * Verify transaction signature
   * @param {string} publicKey - Sender's public key
   * @returns {boolean} - True if signature is valid
   */
  verifySignature(publicKey) {
    if (!this.signature) return false;
    
    const message = this._getSignMessage();
    return CryptoUtils.verify(message, this.signature, publicKey);
  }

  /**
   * Calculate effective gas price based on base fee (EIP-1559)
   * @param {number} baseFeePerGas - Current base fee per gas
   * @returns {number} - Effective gas price
   */
  getEffectiveGasPrice(baseFeePerGas = 0) {
    const priorityFeePerGas = Math.min(this.maxPriorityFeePerGas, this.maxFeePerGas - baseFeePerGas);
    return baseFeePerGas + priorityFeePerGas;
  }

  /**
   * Calculate total gas cost
   * @param {number} baseFeePerGas - Current base fee per gas
   * @returns {number} - Total gas cost
   */
  getGasCost(baseFeePerGas = 0) {
    const effectiveGasPrice = this.getEffectiveGasPrice(baseFeePerGas);
    return this.gasLimit * effectiveGasPrice;
  }

  /**
   * Check if transaction is valid for current base fee
   * @param {number} baseFeePerGas - Current base fee per gas
   * @returns {boolean} - True if transaction is valid
   */
  isValidForBaseFee(baseFeePerGas = 0) {
    const effectiveGasPrice = this.getEffectiveGasPrice(baseFeePerGas);
    return effectiveGasPrice <= this.maxFeePerGas && effectiveGasPrice >= baseFeePerGas;
  }

  /**
   * Get transaction priority (for mempool ordering)
   * @param {number} baseFeePerGas - Current base fee per gas
   * @returns {number} - Priority value (higher = more priority)
   */
  getPriority(baseFeePerGas = 0) {
    const effectiveGasPrice = this.getEffectiveGasPrice(baseFeePerGas);
    return effectiveGasPrice - baseFeePerGas; // Priority fee
  }

  /**
   * Serialize transaction to JSON
   * @returns {Object} - Serialized transaction
   */
  toJSON() {
    return {
      hash: this.hash,
      from: this.from,
      to: this.to,
      value: this.value,
      gasLimit: this.gasLimit,
      maxPriorityFeePerGas: this.maxPriorityFeePerGas,
      maxFeePerGas: this.maxFeePerGas,
      data: this.data,
      nonce: this.nonce,
      type: this.type,
      chainId: this.chainId,
      v: this.v,
      r: this.r,
      s: this.s,
      signature: this.signature
    };
  }

  /**
   * Create transaction from JSON
   * @param {Object} data - Serialized transaction data
   * @returns {Transaction} - Transaction instance
   */
  static fromJSON(data) {
    const tx = new Transaction({
      from: data.from,
      to: data.to,
      value: data.value,
      gasLimit: data.gasLimit,
      maxPriorityFeePerGas: data.maxPriorityFeePerGas,
      maxFeePerGas: data.maxFeePerGas,
      data: data.data,
      nonce: data.nonce
    });
    
    tx.hash = data.hash;
    tx.signature = data.signature;
    tx.v = data.v;
    tx.r = data.r;
    tx.s = data.s;
    tx.type = data.type;
    tx.chainId = data.chainId;
    
    return tx;
  }
}

module.exports = Transaction; 