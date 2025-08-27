# 🚀 Enhanced Blockchain Implementation

A comprehensive JavaScript blockchain implementation featuring **Bloom Filters**, **Merkle Trees**, **Light Wallets**, **SegWit**, **EIP-1559**, and **Coin Burning** mechanisms.

## 🌟 Features Implemented

### ✅ Core Features
- **Bloom Filter** - Efficient probabilistic membership testing
- **Merkle Tree** - Cryptographic transaction verification and inclusion proofs
- **Light Wallet** - Transaction verification without storing full blockchain
- **SegWit** - Separated witness data for scalability
- **EIP-1559** - Simplified fee market with base and priority fees
- **Coin Burning** - Deflationary mechanism through base fee burning

### ✅ Blockchain Features
- **Proof of Work** - Secure mining with adjustable difficulty
- **Transaction System** - Complete transaction creation, validation, and processing
- **Mempool Management** - 30+ transactions loaded from JSON file
- **Block Mining** - Exactly 4 transactions per block
- **Balance Tracking** - Real-time balance updates and validation
- **Chain Validation** - Complete blockchain integrity verification

### ✅ Advanced Features
- **300 Pre-mined Coins** - Each wallet starts with 300 KIKI
- **Fixed Fee Structure** - Base fee: 2 KIKI (burned), Priority fee: 3 KIKI (to miner)
- **Block Reward** - 50 KIKI per block to miner
- **Nonce Management** - Prevents transaction replay attacks
- **UTXO-like Model** - Efficient balance tracking

## 🏗️ Architecture

```
src/
├── utils/
│   ├── enhancedBloomFilter.js    # Bloom filter implementation with demo
│   ├── enhancedMerkleTree.js     # Merkle tree implementation with demo
│   └── lightWallet.js           # Light wallet implementation with demo
├── models/
│   ├── enhancedTransaction.js   # Transaction model with SegWit & EIP-1559
│   └── enhancedBlock.js         # Block model with SegWit support
├── enhancedBlockchain.js        # Main blockchain implementation
└── index.js                     # Original blockchain (for comparison)

data/
└── initial-transactions.json    # 30 predefined transactions

enhanced-demo.js                 # Complete demonstration script
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd homeWork

# Install dependencies
npm install

# Run the enhanced demo
node enhanced-demo.js
```

## 📋 Component Demos

### 1. Bloom Filter Demo
```javascript
const { runBloomFilterDemo } = require('./src/utils/enhancedBloomFilter');
const bloomFilter = runBloomFilterDemo();
```

**Features:**
- Efficient probabilistic membership testing
- Configurable false positive rate
- Space-efficient storage
- Fast lookups O(k) time complexity

### 2. Merkle Tree Demo
```javascript
const { runMerkleTreeDemo } = require('./src/utils/enhancedMerkleTree');
const merkleTree = runMerkleTreeDemo();
```

**Features:**
- Cryptographic transaction verification
- Inclusion proofs for transactions
- Efficient updates O(log n) complexity
- Root validation for data integrity

### 3. Light Wallet Demo
```javascript
const { runLightWalletDemo } = require('./src/utils/lightWallet');
const lightWallet = runLightWalletDemo();
```

**Features:**
- Transaction verification without full blockchain
- Bloom filter integration for fast checks
- Merkle proof verification
- Balance tracking and updates

## 🔧 Enhanced Blockchain Usage

### Creating the Blockchain
```javascript
const EnhancedBlockchain = require('./src/enhancedBlockchain');

const blockchain = new EnhancedBlockchain({
  difficulty: 2,           // Mining difficulty
  blockReward: 50,        // KIKI coins per block
  initialBalance: 300     // Starting balance per wallet
});
```

### Creating Transactions
```javascript
const EnhancedTransaction = require('./src/models/enhancedTransaction');

const transaction = new EnhancedTransaction({
  from: '0x1111111111111111111111111111111111111111',
  to: '0x2222222222222222222222222222222222222222',
  value: 100,              // Amount to transfer
  baseFee: 2,             // Base fee (burned)
  priorityFee: 3,         // Priority fee (to miner)
  nonce: 0,               // Transaction nonce
  data: 'Transaction data' // Optional data
});
```

### Mining Blocks
```javascript
const minerAddress = '0xminer000000000000000000000000000000000000';
const minedBlock = blockchain.mineBlock(minerAddress);

if (minedBlock) {
  console.log(`Block ${minedBlock.index} mined successfully!`);
  console.log(`Hash: ${minedBlock.hash}`);
  console.log(`Transactions: ${minedBlock.transactions.length}/4`);
  console.log(`Base fees burned: ${minedBlock.totalBaseFees} KIKI`);
  console.log(`Priority fees to miner: ${minedBlock.totalPriorityFees} KIKI`);
}
```

### Creating Light Wallets
```javascript
const aliceWallet = blockchain.createLightWallet(
  '0x1111111111111111111111111111111111111111', 
  'Alice'
);

// Verify transaction existence
const result = aliceWallet.verifyTransactionExistence('tx_hash_123');
console.log(`Transaction exists: ${result.exists}`);

// Get transaction proof
const proof = aliceWallet.getTransactionProof('tx_hash_123');
console.log(`Proof available: ${!!proof.proof}`);
```

## 💰 Fee Structure (EIP-1559 Simplified)

### Transaction Costs
- **Transaction Value**: Amount being transferred
- **Base Fee**: 2 KIKI (burned from network supply)
- **Priority Fee**: 3 KIKI (paid to miner)
- **Total Cost**: Value + Base Fee + Priority Fee

### Example
If Alice sends Bob 50 KIKI:
- Alice pays: 50 + 2 + 3 = 55 KIKI total
- Bob receives: 50 KIKI
- Base fee (2 KIKI) is burned
- Priority fee (3 KIKI) goes to miner
- Network supply decreases by 2 KIKI

## 🔥 Coin Burning Mechanism

### How It Works
1. **Base Fees**: Every transaction has a base fee of 2 KIKI
2. **Burning**: Base fees are permanently removed from network supply
3. **Deflationary Pressure**: Creates scarcity over time
4. **Transparency**: All burned coins are tracked

### Statistics
- **Initial Supply**: 3,000 KIKI (10 wallets × 300 KIKI each)
- **Total Mined**: Increases with each block reward
- **Total Burned**: Accumulates from base fees
- **Current Supply**: Total Mined - Total Burned

## 🔐 SegWit Implementation

### Features
- **Witness Separation**: Signature data separated from transaction data
- **Witness Hash**: Hash of transaction without signature
- **Full Hash**: Hash of complete transaction with signature
- **Scalability**: Reduces block size and improves throughput

### Usage
```javascript
const transaction = new EnhancedTransaction({
  // ... transaction data
  privateKey: 'your-private-key' // Optional for signing
});

// Get witness transaction (without signature)
const witnessTx = transaction.getWitnessTransaction();

// Get full transaction (with signature)
const fullTx = transaction.getFullTransaction();

console.log(`Witness Hash: ${transaction.witnessHash}`);
console.log(`Full Hash: ${transaction.hash}`);
```

## 📊 Demo Results

### Final Statistics
```
💰 Wallet Balances:
   0x1111111111111111111111111111111111111111: 161 KIKI
   0x2222222222222222222222222222222222222222: 354 KIKI
   0x3333333333333333333333333333333333333333: 179 KIKI
   ... (all 10 wallets with updated balances)

📊 Network Statistics:
   Total coins in network: 3382 KIKI
   Total coins mined: 3450 KIKI
   Total coins burned: 68 KIKI
   Blockchain length: 10 blocks
   Burning rate: 1.97%

🔧 Enhanced Features:
   Bloom filter items: 68
   Bloom filter false positive rate: 0.0003%
   Merkle tree leaves: 34
   Merkle tree height: 7
```

## 🧪 Testing

### Run Individual Component Tests
```bash
# Bloom Filter Demo
node -e "require('./src/utils/enhancedBloomFilter').runBloomFilterDemo()"

# Merkle Tree Demo
node -e "require('./src/utils/enhancedMerkleTree').runMerkleTreeDemo()"

# Light Wallet Demo
node -e "require('./src/utils/lightWallet').runLightWalletDemo()"
```

### Run Complete Demo
```bash
node enhanced-demo.js
```

## 📈 Performance Features

### Bloom Filter
- **Space Efficiency**: Minimal memory usage
- **Fast Lookups**: O(k) time complexity
- **Configurable**: Adjustable false positive rate
- **Network Friendly**: Reduces bandwidth usage

### Merkle Tree
- **Transaction Verification**: O(log n) complexity
- **Inclusion Proofs**: Cryptographic proof of membership
- **Efficient Updates**: O(log n) update complexity
- **Root Validation**: Ensure data integrity

### Light Wallet
- **Minimal Storage**: Doesn't store full blockchain
- **Fast Verification**: Uses Bloom filter for initial check
- **Secure Proofs**: Merkle proofs for definitive answers
- **Balance Tracking**: Real-time balance updates

## 🔒 Security Features

### Cryptographic Security
- **SHA256 Hashing**: All data integrity checks
- **Digital Signatures**: Transaction authentication
- **Proof of Work**: Secure consensus mechanism
- **Chain Validation**: Complete blockchain integrity

### Transaction Security
- **Nonce Management**: Prevents replay attacks
- **Balance Validation**: Ensures sufficient funds
- **Fee Validation**: Proper fee structure enforcement
- **Signature Verification**: Authenticates transaction origin

## 🚀 Advanced Usage

### Custom Configuration
```javascript
const blockchain = new EnhancedBlockchain({
  difficulty: 4,           // Higher difficulty for more security
  blockReward: 100,       // Higher block rewards
  initialBalance: 500     // Higher starting balances
});
```

### Custom Bloom Filter
```javascript
const { EnhancedBloomFilter } = require('./src/utils/enhancedBloomFilter');

const bloomFilter = new EnhancedBloomFilter(
  8192,    // Size (bits)
  7,       // Hash functions
  'Custom' // Name
);
```

### Custom Merkle Tree
```javascript
const { EnhancedMerkleTree } = require('./src/utils/enhancedMerkleTree');

const merkleTree = new EnhancedMerkleTree(
  transactionHashes, // Array of transaction hashes
  'CustomTree'      // Name
);
```

## 📝 API Reference

### EnhancedBlockchain Methods
- `addTransaction(transaction)` - Add transaction to mempool
- `mineBlock(minerAddress)` - Mine a new block
- `getBalance(address)` - Get wallet balance
- `createLightWallet(address, name)` - Create light wallet
- `mightContainTransaction(hash)` - Bloom filter check
- `verifyTransactionInclusion(hash)` - Merkle proof verification
- `isChainValid()` - Validate entire blockchain
- `getStats()` - Get blockchain statistics
- `printFinalSummary()` - Print comprehensive summary

### EnhancedTransaction Methods
- `sign()` - Sign transaction with private key
- `verifySignature(publicKey)` - Verify transaction signature
- `getWitnessTransaction()` - Get transaction without signature
- `getFullTransaction()` - Get complete transaction
- `validate(balances)` - Validate transaction
- `printDetails()` - Print transaction details

### EnhancedBlock Methods
- `mine(maxAttempts)` - Mine block with proof of work
- `verifyHash()` - Verify block hash
- `verifyProofOfWork()` - Verify proof of work
- `verifyMerkleRoots()` - Verify Merkle roots
- `getFees()` - Get fee breakdown
- `printDetails()` - Print block details

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Inspired by Bitcoin and Ethereum implementations
- EIP-1559 specification for fee market
- Bloom filter research and applications
- Merkle tree cryptographic structures
- SegWit scalability improvements

---

**Enhanced Blockchain** - Building the future of decentralized finance with advanced cryptographic features! 🚀 