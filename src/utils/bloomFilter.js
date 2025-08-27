const crypto = require('crypto');

class BloomFilter {
  /**
   * Create a new Bloom filter
   * @param {number} size - Size of the bit array
   * @param {number} hashCount - Number of hash functions
   */
  constructor(size = 1024, hashCount = 3) {
    this.size = size;
    this.hashCount = hashCount;
    this.bitArray = new Array(size).fill(0);
    this.itemCount = 0;
  }

  /**
   * Generate hash functions for the bloom filter
   * @param {string} item - Item to hash
   * @returns {Array} - Array of hash values
   */
  _getHashes(item) {
    const hashes = [];
    for (let i = 0; i < this.hashCount; i++) {
      const hash = crypto.createHash('sha256')
        .update(item + i.toString())
        .digest('hex');
      const hashInt = parseInt(hash.substring(0, 8), 16);
      hashes.push(hashInt % this.size);
    }
    return hashes;
  }

  /**
   * Add an item to the bloom filter
   * @param {string} item - Item to add
   */
  add(item) {
    const hashes = this._getHashes(item);
    for (const hash of hashes) {
      this.bitArray[hash] = 1;
    }
    this.itemCount++;
  }

  /**
   * Check if an item might be in the bloom filter
   * @param {string} item - Item to check
   * @returns {boolean} - True if item might be present
   */
  mightContain(item) {
    const hashes = this._getHashes(item);
    for (const hash of hashes) {
      if (this.bitArray[hash] === 0) {
        return false;
      }
    }
    return true;
  }

  /**
   * Get the false positive probability
   * @returns {number} - Probability of false positive
   */
  getFalsePositiveProbability() {
    const k = this.hashCount;
    const m = this.size;
    const n = this.itemCount;
    
    if (n === 0) return 0;
    
    return Math.pow(1 - Math.exp(-k * n / m), k);
  }

  /**
   * Get the optimal number of hash functions for given size and item count
   * @param {number} size - Size of bit array
   * @param {number} itemCount - Expected number of items
   * @returns {number} - Optimal number of hash functions
   */
  static getOptimalHashCount(size, itemCount) {
    return Math.round((size / itemCount) * Math.log(2));
  }

  /**
   * Get the optimal size for given item count and false positive rate
   * @param {number} itemCount - Expected number of items
   * @param {number} falsePositiveRate - Desired false positive rate
   * @returns {number} - Optimal size
   */
  static getOptimalSize(itemCount, falsePositiveRate) {
    return Math.ceil(-itemCount * Math.log(falsePositiveRate) / Math.pow(Math.log(2), 2));
  }

  /**
   * Serialize the bloom filter to JSON
   * @returns {Object} - Serialized bloom filter
   */
  toJSON() {
    return {
      size: this.size,
      hashCount: this.hashCount,
      bitArray: this.bitArray,
      itemCount: this.itemCount
    };
  }

  /**
   * Create bloom filter from JSON
   * @param {Object} data - Serialized bloom filter
   * @returns {BloomFilter} - Bloom filter instance
   */
  static fromJSON(data) {
    const filter = new BloomFilter(data.size, data.hashCount);
    filter.bitArray = data.bitArray;
    filter.itemCount = data.itemCount;
    return filter;
  }
}

module.exports = BloomFilter; 