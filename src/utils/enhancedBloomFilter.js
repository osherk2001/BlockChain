const crypto = require('crypto');

/**
 * Enhanced Bloom Filter Implementation
 * Provides efficient probabilistic membership testing with comprehensive demo functionality
 */
class EnhancedBloomFilter {
  /**
   * Create a new enhanced Bloom filter
   * @param {number} size - Size of the bit array
   * @param {number} hashCount - Number of hash functions
   * @param {string} name - Name for identification
   */
  constructor(size = 2048, hashCount = 5, name = 'BloomFilter') {
    this.size = size;
    this.hashCount = hashCount;
    this.bitArray = new Array(size).fill(0);
    this.itemCount = 0;
    this.name = name;
    this.insertedItems = new Set(); // For demo purposes
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
        .update(item + i.toString() + this.name)
        .digest('hex');
      const hashInt = parseInt(hash.substring(0, 8), 16);
      hashes.push(hashInt % this.size);
    }
    return hashes;
  }

  /**
   * Add an item to the bloom filter
   * @param {string} item - Item to add
   * @returns {boolean} - True if added successfully
   */
  add(item) {
    if (!item || typeof item !== 'string') {
      console.warn(`[${this.name}] Invalid item provided: ${item}`);
      return false;
    }

    const hashes = this._getHashes(item);
    for (const hash of hashes) {
      this.bitArray[hash] = 1;
    }
    this.itemCount++;
    this.insertedItems.add(item);
    
    console.log(`[${this.name}] ✅ Added item: "${item}" (hash positions: ${hashes.join(', ')})`);
    return true;
  }

  /**
   * Check if an item might be in the bloom filter
   * @param {string} item - Item to check
   * @returns {boolean} - True if item might be present
   */
  mightContain(item) {
    if (!item || typeof item !== 'string') {
      return false;
    }

    const hashes = this._getHashes(item);
    for (const hash of hashes) {
      if (this.bitArray[hash] === 0) {
        return false;
      }
    }
    return true;
  }

  /**
   * Search for an item with detailed logging
   * @param {string} item - Item to search for
   * @returns {Object} - Search result with details
   */
  search(item) {
    const mightContain = this.mightContain(item);
    const actuallyInserted = this.insertedItems.has(item);
    const isFalsePositive = mightContain && !actuallyInserted;
    
    const result = {
      item,
      mightContain,
      actuallyInserted,
      isFalsePositive,
      hashPositions: this._getHashes(item)
    };

    console.log(`[${this.name}] 🔍 Search for "${item}":`);
    console.log(`   Hash positions: ${result.hashPositions.join(', ')}`);
    console.log(`   Might contain: ${mightContain ? '✅ YES' : '❌ NO'}`);
    console.log(`   Actually inserted: ${actuallyInserted ? '✅ YES' : '❌ NO'}`);
    
    if (isFalsePositive) {
      console.log(`   ⚠️  FALSE POSITIVE DETECTED!`);
    } else if (mightContain && actuallyInserted) {
      console.log(`   ✅ TRUE POSITIVE`);
    } else if (!mightContain && !actuallyInserted) {
      console.log(`   ✅ TRUE NEGATIVE`);
    }

    return result;
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
   * Get filter statistics
   * @returns {Object} - Filter statistics
   */
  getStats() {
    const filledBits = this.bitArray.filter(bit => bit === 1).length;
    const fillRate = filledBits / this.size;
    
    return {
      name: this.name,
      size: this.size,
      hashCount: this.hashCount,
      itemCount: this.itemCount,
      filledBits,
      fillRate: fillRate.toFixed(4),
      falsePositiveRate: this.getFalsePositiveProbability().toFixed(6),
      efficiency: (this.itemCount / this.size).toFixed(4)
    };
  }

  /**
   * Print detailed statistics
   */
  printStats() {
    const stats = this.getStats();
    console.log(`\n[${this.name}] 📊 Bloom Filter Statistics:`);
    console.log(`   Size: ${stats.size} bits`);
    console.log(`   Hash functions: ${stats.hashCount}`);
    console.log(`   Items inserted: ${stats.itemCount}`);
    console.log(`   Filled bits: ${stats.filledBits} (${(stats.fillRate * 100).toFixed(2)}%)`);
    console.log(`   False positive rate: ${(stats.falsePositiveRate * 100).toFixed(4)}%`);
    console.log(`   Efficiency: ${stats.efficiency}`);
  }

  /**
   * Clear the filter
   */
  clear() {
    this.bitArray.fill(0);
    this.itemCount = 0;
    this.insertedItems.clear();
    console.log(`[${this.name}] 🗑️  Filter cleared`);
  }

  /**
   * Serialize the bloom filter to JSON
   * @returns {Object} - Serialized bloom filter
   */
  toJSON() {
    return {
      name: this.name,
      size: this.size,
      hashCount: this.hashCount,
      bitArray: this.bitArray,
      itemCount: this.itemCount,
      insertedItems: Array.from(this.insertedItems)
    };
  }

  /**
   * Create bloom filter from JSON
   * @param {Object} data - Serialized bloom filter
   * @returns {EnhancedBloomFilter} - Bloom filter instance
   */
  static fromJSON(data) {
    const filter = new EnhancedBloomFilter(data.size, data.hashCount, data.name);
    filter.bitArray = data.bitArray;
    filter.itemCount = data.itemCount;
    filter.insertedItems = new Set(data.insertedItems);
    return filter;
  }
}

/**
 * Demo function for Bloom Filter
 */
function runBloomFilterDemo() {
  console.log('\n🌸 Enhanced Bloom Filter Demo');
  console.log('==============================');

  // Create bloom filter
  const bloomFilter = new EnhancedBloomFilter(1024, 3, 'TransactionFilter');
  
  // Sample transaction hashes
  const transactions = [
    'tx_hash_001_abc123def456',
    'tx_hash_002_ghi789jkl012',
    'tx_hash_003_mno345pqr678',
    'tx_hash_004_stu901vwx234',
    'tx_hash_005_yz567abc890',
    'tx_hash_006_def123ghi456',
    'tx_hash_007_jkl789mno012',
    'tx_hash_008_pqr345stu678',
    'tx_hash_009_vwx901yz234',
    'tx_hash_010_abc567def890'
  ];

  console.log('\n📝 Inserting transactions into Bloom Filter:');
  transactions.forEach(tx => bloomFilter.add(tx));

  // Print statistics
  bloomFilter.printStats();

  console.log('\n🔍 Testing search functionality:');
  
  // Test existing items
  console.log('\n--- Testing existing items ---');
  bloomFilter.search('tx_hash_001_abc123def456');
  bloomFilter.search('tx_hash_005_yz567abc890');
  bloomFilter.search('tx_hash_010_abc567def890');

  // Test non-existing items
  console.log('\n--- Testing non-existing items ---');
  bloomFilter.search('tx_hash_999_nonexistent');
  bloomFilter.search('tx_hash_888_fake_hash');
  bloomFilter.search('tx_hash_777_invalid');

  // Test false positive detection
  console.log('\n--- False positive analysis ---');
  const testItems = [
    'tx_hash_001_abc123def456', // Should be true positive
    'tx_hash_999_nonexistent',  // Should be true negative
    'tx_hash_fake_123',         // Might be false positive
    'tx_hash_random_456'        // Might be false positive
  ];

  let falsePositives = 0;
  let truePositives = 0;
  let trueNegatives = 0;

  testItems.forEach(item => {
    const result = bloomFilter.search(item);
    if (result.isFalsePositive) falsePositives++;
    else if (result.mightContain && result.actuallyInserted) truePositives++;
    else if (!result.mightContain && !result.actuallyInserted) trueNegatives++;
  });

  console.log(`\n📊 Search Results Summary:`);
  console.log(`   True Positives: ${truePositives}`);
  console.log(`   True Negatives: ${trueNegatives}`);
  console.log(`   False Positives: ${falsePositives}`);
  console.log(`   Actual False Positive Rate: ${(falsePositives / testItems.length * 100).toFixed(2)}%`);

  return bloomFilter;
}

module.exports = { EnhancedBloomFilter, runBloomFilterDemo }; 