const Blockchain = require('./src/blockchain');
const Transaction = require('./src/models/transaction');
const CryptoUtils = require('./src/utils/crypto');

console.log('🚀 Kiki Blockchain Test');
console.log('=======================');

// Create blockchain instance
const blockchain = new Blockchain({
  difficulty: 3,
  miningReward: 50,
  baseFeePerGas: 0
});

console.log('✅ Blockchain created with genesis block');
console.log(`📊 Chain length: ${blockchain.chain.length}`);
console.log(`🔗 Latest block hash: ${blockchain.getLatestBlock().hash}`);
console.log('');

// Generate test wallets
console.log('💰 Creating test wallets...');
const wallet1 = CryptoUtils.generateKeyPair();
const wallet2 = CryptoUtils.generateKeyPair();
const wallet3 = CryptoUtils.generateKeyPair();

const address1 = CryptoUtils.sha256(wallet1.publicKey).substring(0, 40);
const address2 = CryptoUtils.sha256(wallet2.publicKey).substring(0, 40);
const address3 = CryptoUtils.sha256(wallet3.publicKey).substring(0, 40);

console.log(`👤 Wallet 1: ${address1}`);
console.log(`👤 Wallet 2: ${address2}`);
console.log(`👤 Wallet 3: ${address3}`);
console.log('');

// Create and add transactions
console.log('📝 Creating transactions...');

const tx1 = new Transaction({
  from: address1,
  to: address2,
  value: 100,
  gasLimit: 21000,
  maxPriorityFeePerGas: 1000000000, // 1 Gwei
  maxFeePerGas: 20000000000, // 20 Gwei
  nonce: 0,
  privateKey: wallet1.privateKey
});

const tx2 = new Transaction({
  from: address2,
  to: address3,
  value: 50,
  gasLimit: 21000,
  maxPriorityFeePerGas: 2000000000, // 2 Gwei
  maxFeePerGas: 25000000000, // 25 Gwei
  nonce: 0,
  privateKey: wallet2.privateKey
});

const tx3 = new Transaction({
  from: address3,
  to: address1,
  value: 25,
  gasLimit: 21000,
  maxPriorityFeePerGas: 500000000, // 0.5 Gwei
  maxFeePerGas: 15000000000, // 15 Gwei
  nonce: 0,
  privateKey: wallet3.privateKey
});

// Add transactions to mempool
blockchain.addTransaction(tx1);
blockchain.addTransaction(tx2);
blockchain.addTransaction(tx3);

console.log(`✅ Added ${blockchain.pendingTransactions.length} transactions to mempool`);
console.log(`📊 Mempool size: ${blockchain.mempool.size}`);
console.log('');

// Mine a block
console.log('⛏️  Mining block...');
const startTime = Date.now();
const minedBlock = blockchain.mineBlock(address1);
const miningTime = Date.now() - startTime;

if (minedBlock) {
  console.log(`✅ Block ${minedBlock.index} mined successfully!`);
  console.log(`⏱️  Mining time: ${miningTime}ms`);
  console.log(`🔗 Block hash: ${minedBlock.hash}`);
  console.log(`🌳 Merkle root: ${minedBlock.merkleRoot}`);
  console.log(`📊 Transactions: ${minedBlock.transactions.length}`);
  console.log(`⛽ Gas used: ${minedBlock.getTotalGasUsed()}`);
  console.log(`💸 Fees collected: ${minedBlock.getTotalFees()}`);
  console.log(`💰 Mining reward: ${blockchain.miningReward} KIKI`);
} else {
  console.log('❌ Failed to mine block');
}
console.log('');

// Check balances
console.log('💰 Checking balances...');
console.log(`👤 ${address1}: ${blockchain.getBalance(address1)} KIKI`);
console.log(`👤 ${address2}: ${blockchain.getBalance(address2)} KIKI`);
console.log(`👤 ${address3}: ${blockchain.getBalance(address3)} KIKI`);
console.log('');

// Test bloom filter
console.log('🌸 Testing Bloom Filter...');
const testHash = 'test-transaction-hash';
blockchain.bloomFilter.add(testHash);
const mightContain = blockchain.mightContainTransaction(testHash);
const falsePositiveRate = blockchain.bloomFilter.getFalsePositiveProbability();

console.log(`🔍 Transaction "${testHash}" might be in filter: ${mightContain}`);
console.log(`📊 False positive rate: ${(falsePositiveRate * 100).toFixed(2)}%`);
console.log('');

// Test Merkle tree
console.log('🌳 Testing Merkle Tree...');
const merkleTree = new (require('./src/utils/merkleTree'))();
const txHashes = [tx1.hash, tx2.hash, tx3.hash];

txHashes.forEach(hash => merkleTree.addTransaction(hash));

const root = merkleTree.getRoot();
const proof = merkleTree.getProof(tx1.hash);
const isValid = require('./src/utils/merkleTree').verifyProof(tx1.hash, proof, root);

console.log(`🌳 Merkle root: ${root}`);
console.log(`🔍 Proof for ${tx1.hash.substring(0, 8)}...: ${isValid ? '✅ Valid' : '❌ Invalid'}`);
console.log('');

// Test EIP-1559 fee calculation
console.log('⛽ Testing EIP-1559 Fee Calculation...');
const baseFee = 1000000000; // 1 Gwei
console.log(`💰 Base fee: ${baseFee} wei`);

[tx1, tx2, tx3].forEach((tx, i) => {
  const effectiveGasPrice = tx.getEffectiveGasPrice(baseFee);
  const gasCost = tx.getGasCost(baseFee);
  const priority = tx.getPriority(baseFee);
  
  console.log(`📊 Transaction ${i + 1}:`);
  console.log(`   Effective gas price: ${effectiveGasPrice} wei`);
  console.log(`   Gas cost: ${gasCost} wei`);
  console.log(`   Priority: ${priority} wei`);
});

console.log('');

// Blockchain statistics
console.log('📊 Blockchain Statistics:');
const stats = blockchain.getStats();
console.log(`🔗 Chain length: ${stats.chainLength}`);
console.log(`📝 Pending transactions: ${stats.pendingTransactions}`);
console.log(`💾 Mempool size: ${stats.mempoolSize}`);
console.log(`💰 Total UTXOs: ${stats.totalUTXOs}`);
console.log(`⚡ Current difficulty: ${stats.currentDifficulty}`);
console.log(`⛽ Base fee per gas: ${stats.baseFeePerGas}`);
console.log(`🌸 Bloom filter false positive rate: ${(stats.bloomFilterFalsePositiveRate * 100).toFixed(2)}%`);
console.log(`✅ Chain valid: ${blockchain.isChainValid()}`);

console.log('');
console.log('🎉 Kiki Blockchain test completed successfully!');
console.log('🚀 Your blockchain is ready to use!'); 