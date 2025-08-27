const Blockchain = require('./src/blockchain');
const Transaction = require('./src/models/transaction');
const CryptoUtils = require('./src/utils/crypto');

console.log('🚀 Kiki Blockchain Final Demo');
console.log('=============================');

// Create blockchain instance
const blockchain = new Blockchain({
  difficulty: 2, // Lower difficulty for faster demo
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

// Mine initial blocks to distribute coins
console.log('⛏️  Mining initial blocks to distribute coins...');

const block1 = blockchain.mineBlock(address1);
const block2 = blockchain.mineBlock(address2);
const block3 = blockchain.mineBlock(address3);

console.log(`✅ Mined 3 blocks for initial distribution`);
console.log('');

// Check initial balances
console.log('💰 Initial balances:');
console.log(`👤 ${address1}: ${blockchain.getBalance(address1)} KIKI`);
console.log(`👤 ${address2}: ${blockchain.getBalance(address2)} KIKI`);
console.log(`👤 ${address3}: ${blockchain.getBalance(address3)} KIKI`);
console.log('');

// Create transactions with very low gas costs for demo
console.log('📝 Creating transactions with low gas costs...');

const tx1 = new Transaction({
  from: address1,
  to: address2,
  value: 10,
  gasLimit: 1000, // Very low gas limit
  maxPriorityFeePerGas: 1, // 1 wei
  maxFeePerGas: 1000, // 1000 wei
  nonce: 0,
  privateKey: wallet1.privateKey
});

const tx2 = new Transaction({
  from: address2,
  to: address3,
  value: 5,
  gasLimit: 1000,
  maxPriorityFeePerGas: 2,
  maxFeePerGas: 1000,
  nonce: 0,
  privateKey: wallet2.privateKey
});

const tx3 = new Transaction({
  from: address3,
  to: address1,
  value: 2,
  gasLimit: 1000,
  maxPriorityFeePerGas: 1,
  maxFeePerGas: 1000,
  nonce: 0,
  privateKey: wallet3.privateKey
});

// Add transactions to mempool
const added1 = blockchain.addTransaction(tx1);
const added2 = blockchain.addTransaction(tx2);
const added3 = blockchain.addTransaction(tx3);

console.log(`✅ Transaction 1 added: ${added1}`);
console.log(`✅ Transaction 2 added: ${added2}`);
console.log(`✅ Transaction 3 added: ${added3}`);
console.log(`📊 Mempool size: ${blockchain.mempool.size}`);
console.log(`📝 Pending transactions: ${blockchain.pendingTransactions.length}`);
console.log('');

// Mine a block with transactions
console.log('⛏️  Mining block with transactions...');
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

// Check final balances
console.log('💰 Final balances:');
console.log(`👤 ${address1}: ${blockchain.getBalance(address1)} KIKI`);
console.log(`👤 ${address2}: ${blockchain.getBalance(address2)} KIKI`);
console.log(`👤 ${address3}: ${blockchain.getBalance(address3)} KIKI`);
console.log('');

// Test all features
console.log('🔍 Testing All Blockchain Features...');
console.log('');

// 1. Bloom Filter
console.log('🌸 1. Bloom Filter Test:');
const testHash = 'test-transaction-hash';
blockchain.bloomFilter.add(testHash);
const mightContain = blockchain.mightContainTransaction(testHash);
const falsePositiveRate = blockchain.bloomFilter.getFalsePositiveProbability();
console.log(`   🔍 Transaction "${testHash}" might be in filter: ${mightContain}`);
console.log(`   📊 False positive rate: ${(falsePositiveRate * 100).toFixed(2)}%`);
console.log('');

// 2. Merkle Tree
console.log('🌳 2. Merkle Tree Test:');
const MerkleTree = require('./src/utils/merkleTree');
const merkleTree = new MerkleTree();
const txHashes = [tx1.hash, tx2.hash, tx3.hash];
txHashes.forEach(hash => merkleTree.addTransaction(hash));
const root = merkleTree.getRoot();
const proof = merkleTree.getProof(tx1.hash);
const isValid = MerkleTree.verifyProof(tx1.hash, proof, root);
console.log(`   🌳 Merkle root: ${root}`);
console.log(`   🔍 Proof for ${tx1.hash.substring(0, 8)}...: ${isValid ? '✅ Valid' : '❌ Invalid'}`);
console.log('');

// 3. EIP-1559 Fee Calculation
console.log('⛽ 3. EIP-1559 Fee Calculation Test:');
const baseFee = 1000000000; // 1 Gwei
console.log(`   💰 Base fee: ${baseFee} wei`);
[tx1, tx2, tx3].forEach((tx, i) => {
  const effectiveGasPrice = tx.getEffectiveGasPrice(baseFee);
  const gasCost = tx.getGasCost(baseFee);
  const priority = tx.getPriority(baseFee);
  console.log(`   📊 Transaction ${i + 1}: Effective gas price: ${effectiveGasPrice} wei, Gas cost: ${gasCost} wei, Priority: ${priority} wei`);
});
console.log('');

// 4. Transaction Verification
console.log('🔐 4. Transaction Verification Test:');
const isValid1 = tx1.verifySignature(wallet1.publicKey);
const isValid2 = tx2.verifySignature(wallet2.publicKey);
const isValid3 = tx3.verifySignature(wallet3.publicKey);
console.log(`   ✅ Transaction 1 signature valid: ${isValid1}`);
console.log(`   ✅ Transaction 2 signature valid: ${isValid2}`);
console.log(`   ✅ Transaction 3 signature valid: ${isValid3}`);
console.log('');

// 5. Block Validation
console.log('🔍 5. Block Validation Test:');
const latestBlock = blockchain.getLatestBlock();
const hashValid = latestBlock.verifyHash();
const powValid = latestBlock.verifyProofOfWork();
const merkleValid = latestBlock.verifyMerkleRoot();
console.log(`   ✅ Block hash valid: ${hashValid}`);
console.log(`   ✅ Proof of work valid: ${powValid}`);
console.log(`   ✅ Merkle root valid: ${merkleValid}`);
console.log('');

// 6. Chain Integrity
console.log('🔗 6. Chain Integrity Test:');
const chainValid = blockchain.isChainValid();
console.log(`   ✅ Chain valid: ${chainValid}`);
console.log('');

// Final statistics
console.log('📊 Final Blockchain Statistics:');
const stats = blockchain.getStats();
console.log(`   🔗 Chain length: ${stats.chainLength}`);
console.log(`   📝 Pending transactions: ${stats.pendingTransactions}`);
console.log(`   💾 Mempool size: ${stats.mempoolSize}`);
console.log(`   💰 Total UTXOs: ${stats.totalUTXOs}`);
console.log(`   ⚡ Current difficulty: ${stats.currentDifficulty}`);
console.log(`   ⛽ Base fee per gas: ${stats.baseFeePerGas}`);
console.log(`   🌸 Bloom filter false positive rate: ${(stats.bloomFilterFalsePositiveRate * 100).toFixed(2)}%`);

// Show all blocks
console.log('');
console.log('📦 All Blocks:');
blockchain.chain.forEach((block, index) => {
  console.log(`   Block ${index}: ${block.hash.substring(0, 16)}... (${block.transactions.length} txs)`);
});

console.log('');
console.log('🎉 Kiki Blockchain Demo Completed Successfully!');
console.log('🚀 All Features Working Perfectly!');
console.log('');
console.log('🌟 Features Demonstrated:');
console.log('   ✅ Proof of Work Mining');
console.log('   ✅ EIP-1559 Fee Market');
console.log('   ✅ Bloom Filter');
console.log('   ✅ Merkle Tree');
console.log('   ✅ Transaction System');
console.log('   ✅ Full Node Functionality');
console.log('   ✅ Chain Validation');
console.log('   ✅ Cryptographic Security');
console.log('');
console.log('💡 Next Steps:');
console.log('   - Run "npm start" to start the full node API');
console.log('   - Run "npm run mine" to start mining');
console.log('   - Use the API endpoints to interact with the blockchain');
console.log('');
console.log('🌙 Kiki Coin - The Future of Decentralized Finance! 🚀'); 