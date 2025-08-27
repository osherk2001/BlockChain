const crypto = require('crypto');

class CryptoUtils {
  /**
   * Generate SHA256 hash of data
   * @param {string} data - Data to hash
   * @returns {string} - Hex hash
   */
  static sha256(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Generate double SHA256 hash (like Bitcoin)
   * @param {string} data - Data to hash
   * @returns {string} - Hex hash
   */
  static doubleSha256(data) {
    return this.sha256(this.sha256(data));
  }

  /**
   * Generate a random key pair
   * @returns {Object} - {publicKey, privateKey}
   */
  static generateKeyPair() {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
    });
    
    return { publicKey, privateKey };
  }

  /**
   * Sign data with private key
   * @param {string} data - Data to sign
   * @param {string} privateKey - Private key in PEM format
   * @returns {string} - Signature
   */
  static sign(data, privateKey) {
    const sign = crypto.createSign('SHA256');
    sign.update(data);
    return sign.sign(privateKey, 'hex');
  }

  /**
   * Verify signature with public key
   * @param {string} data - Original data
   * @param {string} signature - Signature to verify
   * @param {string} publicKey - Public key in PEM format
   * @returns {boolean} - True if valid
   */
  static verify(data, signature, publicKey) {
    const verify = crypto.createVerify('SHA256');
    verify.update(data);
    return verify.verify(publicKey, signature, 'hex');
  }

  /**
   * Generate a random nonce
   * @returns {number} - Random nonce
   */
  static generateNonce() {
    return Math.floor(Math.random() * 1000000);
  }

  /**
   * Convert address to bytes for bloom filter
   * @param {string} address - Address string
   * @returns {Buffer} - Address bytes
   */
  static addressToBytes(address) {
    return Buffer.from(address, 'hex');
  }
}

module.exports = CryptoUtils; 