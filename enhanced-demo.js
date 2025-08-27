const crypto = require('crypto');
const EnhancedBlockchain = require('./src/enhancedBlockchain');
const EnhancedTransaction = require('./src/models/enhancedTransaction');
const { runBloomFilterDemo } = require('./src/utils/enhancedBloomFilter');
const { runMerkleTreeDemo } = require('./src/utils/enhancedMerkleTree');
const { runLightWalletDemo } = require('./src/utils/lightWallet');

/**
 * Enhanced Blockchain Demo
 * Demonstrates all features: Bloom Filter, Merkle Tree, Light Wallet, SegWit, EIP-1559, Coin Burning
 */
async function runEnhancedDemo() {
  console.log('🚀 ENHANCED BLOCKCHAIN DEMO');
  console.log('===========================');
  console.log('This demo showcases all advanced blockchain features:');
  console.log('✅ Bloom Filter - Efficient transaction filtering');
  console.log('✅ Merkle Tree - Transaction verification and inclusion proofs');
  console.log('✅ Light Wallet - Transaction verification without full blockchain');
  console.log('✅ SegWit - Separated witness data');
  console.log('✅ EIP-1559 - Simplified fee market (base fee + priority fee)');
  console.log('✅ Coin Burning - Base fees are burned from network supply');
  console.log('✅ Mempool Initialization - 30 transactions loaded from JSON');
  console.log('✅ 4 Transactions per Block - Fixed block size');
  console.log('✅ 300 Pre-mined Coins - Each wallet starts with 300 KIKI');
  console.log('');

  // Step 1: Run individual component demos
  console.log('📋 STEP 1: Component Demos');
  console.log('===========================');
  
  // Bloom Filter Demo
  console.log('\n🌸 Running Bloom Filter Demo...');
  const bloomFilter = runBloomFilterDemo();
  
  // Merkle Tree Demo
  console.log('\n🌳 Running Merkle Tree Demo...');
  const merkleTree = runMerkleTreeDemo();
  
  // Light Wallet Demo
  console.log('\n💡 Running Light Wallet Demo...');
  const lightWallet = runLightWalletDemo();

  // Step 2: Enhanced Blockchain Demo
  console.log('\n📋 STEP 2: Enhanced Blockchain Demo');
  console.log('====================================');
  
  // Create enhanced blockchain
  console.log('\n🏗️  Creating Enhanced Blockchain...');
  const blockchain = new EnhancedBlockchain({
    difficulty: 2,
    blockReward: 50,
    initialBalance: 300
  });

  // Step 3: Create some additional transactions
  console.log('\n📋 STEP 3: Creating Additional Transactions');
  console.log('============================================');
  
  const additionalTransactions = [
    {
      from: '0x1111111111111111111111111111111111111111',
      to: '0x2222222222222222222222222222222222222222',
      value: 50,
      data: 'Additional transaction 1'
    },
    {
      from: '0x3333333333333333333333333333333333333333',
      to: '0x4444444444444444444444444444444444444444',
      value: 75,
      data: 'Additional transaction 2'
    },
    {
      from: '0x5555555555555555555555555555555555555555',
      to: '0x6666666666666666666666666666666666666666',
      value: 25,
      data: 'Additional transaction 3'
    },
    {
      from: '0x7777777777777777777777777777777777777777',
      to: '0x8888888888888888888888888888888888888888',
      value: 100,
      data: 'Additional transaction 4'
    }
  ];

  console.log('\n📝 Creating additional transactions...');
  additionalTransactions.forEach((txData, index) => {
    const transaction = new EnhancedTransaction({
      from: txData.from,
      to: txData.to,
      value: txData.value,
      baseFee: 2,
      priorityFee: 3,
      nonce: blockchain.nonces.get(txData.from) || 0,
      data: txData.data
    });

    const success = blockchain.addTransaction(transaction);
    console.log(`   Transaction ${index + 1}: ${success ? '✅ Added' : '❌ Failed'}`);
  });

  // Step 4: Mine blocks
  console.log('\n📋 STEP 4: Mining Blocks');
  console.log('========================');
  
  const minerAddress = '0xminer000000000000000000000000000000000000';
  const blocksToMine = Math.ceil(blockchain.pendingTransactions.length / blockchain.maxTransactionsPerBlock);

  console.log(`\n⛏️  Mining ${blocksToMine} blocks to process all transactions...`);
  
  for (let i = 0; i < blocksToMine; i++) {
    console.log(`\n--- Mining Block ${i + 1} ---`);
    const minedBlock = blockchain.mineBlock(minerAddress);
    
    if (minedBlock) {
      console.log(`✅ Block ${minedBlock.index} mined successfully!`);
      console.log(`   Hash: ${minedBlock.hash}`);
      console.log(`   Transactions: ${minedBlock.transactions.length}/4`);
      console.log(`   Base fees burned: ${minedBlock.totalBaseFees} KIKI`);
      console.log(`   Priority fees to miner: ${minedBlock.totalPriorityFees} KIKI`);
      console.log(`   Block reward: ${minedBlock.blockReward} KIKI`);
      console.log(`   Total miner reward: ${minedBlock.totalPriorityFees + minedBlock.blockReward} KIKI`);
    } else {
      console.log(`❌ Failed to mine block ${i + 1}`);
    }
  }

  // Step 5: Create and test light wallets
  console.log('\n📋 STEP 5: Light Wallet Testing');
  console.log('===============================');
  
  console.log('\n💡 Creating light wallets for testing...');
  
  const aliceWallet = blockchain.createLightWallet('0x1111111111111111111111111111111111111111', 'Alice');
  const bobWallet = blockchain.createLightWallet('0x2222222222222222222222222222222222222222', 'Bob');
  
  // Test transaction verification
  console.log('\n🔍 Testing transaction verification with light wallets...');
  
  // Get some transaction hashes from the blockchain
  const transactionHashes = Array.from(blockchain.mempool.keys()).slice(0, 3);
  
  if (transactionHashes.length > 0) {
    console.log('\n--- Testing with Alice\'s Light Wallet ---');
    aliceWallet.verifyTransactionExistence(transactionHashes[0]);
    aliceWallet.verifyTransactionNonExistence('tx_nonexistent_hash_123');
    aliceWallet.getTransactionProof(transactionHashes[0]);
    
    console.log('\n--- Testing with Bob\'s Light Wallet ---');
    bobWallet.verifyTransactionExistence(transactionHashes[1]);
    bobWallet.verifyTransactionNonExistence('tx_another_fake_hash_456');
    bobWallet.getTransactionProof(transactionHashes[1]);
  }

  // Step 6: Test SegWit functionality
  console.log('\n📋 STEP 6: SegWit Testing');
  console.log('==========================');
  
  console.log('\n🔐 Testing SegWit functionality...');
  
  // Create a new transaction to test SegWit
  const segwitTransaction = new EnhancedTransaction({
    from: '0x1111111111111111111111111111111111111111',
    to: '0x3333333333333333333333333333333333333333',
    value: 10,
    baseFee: 2,
    priorityFee: 3,
    nonce: blockchain.nonces.get('0x1111111111111111111111111111111111111111') || 0,
    data: 'SegWit test transaction'
  });

  console.log('\n📋 SegWit Transaction Details:');
  segwitTransaction.printDetails();
  
  console.log('\n🔍 SegWit Features:');
  console.log(`   Witness Hash: ${segwitTransaction.witnessHash}`);
  console.log(`   Full Hash: ${segwitTransaction.hash}`);
  console.log(`   Has Witness: ${!!segwitTransaction.witness}`);
  console.log(`   Witness Transaction (without signature):`);
  console.log(`     ${JSON.stringify(segwitTransaction.getWitnessTransaction(), null, 2)}`);

  // Step 7: Test EIP-1559 fee calculation
  console.log('\n📋 STEP 7: EIP-1559 Fee Testing');
  console.log('================================');
  
  console.log('\n⛽ Testing EIP-1559 fee structure...');
  
  const feeTestTransaction = new EnhancedTransaction({
    from: '0x2222222222222222222222222222222222222222',
    to: '0x4444444444444444444444444444444444444444',
    value: 100,
    baseFee: 2,
    priorityFee: 3,
    nonce: 0,
    data: 'EIP-1559 fee test'
  });

  console.log('\n💰 EIP-1559 Fee Breakdown:');
  console.log(`   Transaction Value: ${feeTestTransaction.value} KIKI`);
  console.log(`   Base Fee: ${feeTestTransaction.baseFee} KIKI (burned)`);
  console.log(`   Priority Fee: ${feeTestTransaction.priorityFee} KIKI (to miner)`);
  console.log(`   Total Cost: ${feeTestTransaction.totalCost} KIKI`);
  console.log(`   Effective Gas Price: ${feeTestTransaction.baseFee + feeTestTransaction.priorityFee} KIKI`);

  // Step 8: Test Bloom Filter and Merkle Tree integration
  console.log('\n📋 STEP 8: Bloom Filter and Merkle Tree Integration');
  console.log('===================================================');
  
  console.log('\n🌸 Testing Bloom Filter integration...');
  
  // Test some transaction hashes
  const testHashes = [
    transactionHashes[0] || 'tx_test_hash_1',
    transactionHashes[1] || 'tx_test_hash_2',
    'tx_nonexistent_hash_test'
  ];

  testHashes.forEach(hash => {
    const mightContain = blockchain.mightContainTransaction(hash);
    console.log(`   Hash "${hash.substring(0, 16)}...": ${mightContain ? '✅ Might contain' : '❌ Definitely not'}`);
  });

  console.log('\n🌳 Testing Merkle Tree integration...');
  
  // Test transaction inclusion verification
  if (transactionHashes.length > 0) {
    const verification = blockchain.verifyTransactionInclusion(transactionHashes[0]);
    console.log(`   Transaction "${transactionHashes[0].substring(0, 16)}...": ${verification.found ? '✅ Found' : '❌ Not found'}`);
  }

  // Step 9: Final summary
  console.log('\n📋 STEP 9: Final Summary');
  console.log('========================');
  
  // Print final blockchain summary
  blockchain.printFinalSummary();

  // Step 10: Demonstrate coin burning
  console.log('\n📋 STEP 10: Coin Burning Demonstration');
  console.log('======================================');
  
  const stats = blockchain.getStats();
  console.log('\n🔥 Coin Burning Summary:');
  console.log(`   Initial Network Supply: ${10 * 300} KIKI (10 wallets × 300 KIKI each)`);
  console.log(`   Total Coins Mined: ${stats.totalCoinsMined} KIKI`);
  console.log(`   Total Coins Burned: ${stats.totalCoinsBurned} KIKI`);
  console.log(`   Current Network Supply: ${stats.totalCoinsInNetwork} KIKI`);
  console.log(`   Burning Rate: ${((stats.totalCoinsBurned / stats.totalCoinsMined) * 100).toFixed(2)}%`);
  
  console.log('\n💡 Coin Burning Explanation:');
  console.log('   - Each transaction has a base fee of 2 KIKI');
  console.log('   - Base fees are burned (removed from network supply)');
  console.log('   - Priority fees (3 KIKI) go to miners');
  console.log('   - This creates deflationary pressure on the network');

  console.log('\n🎉 ENHANCED BLOCKCHAIN DEMO COMPLETED SUCCESSFULLY!');
  console.log('===================================================');
  console.log('All features have been demonstrated:');
  console.log('✅ Bloom Filter - Efficient probabilistic membership testing');
  console.log('✅ Merkle Tree - Cryptographic transaction verification');
  console.log('✅ Light Wallet - Transaction verification without full blockchain');
  console.log('✅ SegWit - Separated witness data for scalability');
  console.log('✅ EIP-1559 - Simplified fee market with base and priority fees');
  console.log('✅ Coin Burning - Deflationary mechanism through base fee burning');
  console.log('✅ Mempool Management - 30+ transactions loaded and processed');
  console.log('✅ Block Mining - 4 transactions per block with proof of work');
  console.log('✅ Balance Tracking - Real-time balance updates and validation');
  console.log('✅ Chain Validation - Complete blockchain integrity verification');
  
  return {
    blockchain,
    bloomFilter,
    merkleTree,
    lightWallet,
    stats: blockchain.getStats()
  };
}

// Run the demo if this file is executed directly
if (require.main === module) {
  runEnhancedDemo().catch(error => {
    console.error('❌ Demo failed:', error);
    process.exit(1);
  });
}

module.exports = { runEnhancedDemo }; 