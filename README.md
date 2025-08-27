# 🚀 Kiki Blockchain

A complete JavaScript blockchain implementation featuring **Proof of Work**, **EIP-1559 fee market**, **Bloom filters**, **Merkle trees**, and **full node functionality**.

## 🌟 Features

### Core Blockchain Features
- **Proof of Work (PoW)** - Secure mining mechanism with adjustable difficulty
- **Transaction System** - Complete transaction creation, signing, and validation
- **Merkle Trees** - Efficient transaction verification and inclusion proofs
- **UTXO Model** - Unspent Transaction Output tracking
- **Full Node** - Complete blockchain validation and storage

### Advanced Features
- **EIP-1559 Fee Market** - Dynamic base fee calculation and priority fee system
- **Bloom Filters** - Efficient transaction filtering and membership testing
- **RESTful API** - Complete web API for blockchain interaction
- **Mining Interface** - Standalone miner with statistics and monitoring
- **Wallet Generation** - Cryptographic key pair generation

### Network Features
- **Mempool Management** - Transaction pool with priority-based selection
- **Block Validation** - Comprehensive block and transaction validation
- **Chain Integrity** - Full blockchain validation and integrity checking
- **Statistics & Monitoring** - Real-time blockchain statistics

## 🏗️ Architecture

```
src/
├── utils/
│   ├── crypto.js          # Cryptographic utilities
│   ├── bloomFilter.js     # Bloom filter implementation
│   └── merkleTree.js      # Merkle tree implementation
├── models/
│   ├── transaction.js     # Transaction model with EIP-1559
│   └── block.js          # Block model with PoW mining
├── blockchain.js         # Main blockchain class
├── miner.js             # Standalone miner
└── index.js             # Full node with REST API
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd kiki-blockchain
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the full node**
   ```bash
   npm start
   ```

4. **Start mining (in another terminal)**
   ```bash
   npm run mine
   ```

## 📡 API Endpoints

### Blockchain Information
- `GET /health` - Health check
- `GET /blockchain` - Blockchain overview
- `GET /blocks` - All blocks
- `GET /block/:index` - Specific block
- `GET /stats` - Blockchain statistics

### Transactions
- `POST /transaction` - Create new transaction
- `GET /transaction/:hash` - Get transaction by hash
- `GET /transactions/pending` - Pending transactions

### Mining & Wallets
- `POST /mine` - Mine a new block
- `POST /wallet/new` - Generate new wallet
- `GET /balance/:address` - Check address balance

### Advanced Features
- `GET /utxo` - UTXO set
- `POST /bloom/check` - Bloom filter membership test

## 💰 Using the Kiki Blockchain

### 1. Create a Wallet
```bash
curl -X POST http://localhost:3000/wallet/new
```

### 2. Send a Transaction
```bash
curl -X POST http://localhost:3000/transaction \
  -H "Content-Type: application/json" \
  -d '{
    "from": "0x1234567890123456789012345678901234567890",
    "to": "0x2345678901234567890123456789012345678901",
    "value": 100,
    "privateKey": "your-private-key-here"
  }'
```

### 3. Mine a Block
```bash
curl -X POST http://localhost:3000/mine \
  -H "Content-Type: application/json" \
  -d '{
    "minerAddress": "0x1234567890123456789012345678901234567890"
  }'
```

### 4. Check Balance
```bash
curl http://localhost:3000/balance/0x1234567890123456789012345678901234567890
```

## 🔧 Configuration

### Blockchain Configuration
```javascript
const blockchain = new Blockchain({
  difficulty: 4,                    // Mining difficulty
  miningReward: 50,                // KIKI coins per block
  blockTime: 60000,                // Target block time (ms)
  maxBlockSize: 1000000,           // Max block size (bytes)
  maxTransactionsPerBlock: 1000,   // Max transactions per block
  baseFeePerGas: 0,               // Initial base fee (EIP-1559)
  targetGasUsed: 15000000         // Target gas per block
});
```

### Node Configuration
```javascript
const node = new KikiNode({
  blockchain: {
    difficulty: 3,
    miningReward: 50,
    baseFeePerGas: 0
  },
  port: 3000
});
```

## 🔍 EIP-1559 Fee Market

The Kiki blockchain implements Ethereum's EIP-1559 fee market mechanism:

### Fee Components
- **Base Fee**: Dynamically adjusted based on network congestion
- **Priority Fee**: User-specified tip to miners
- **Max Fee**: Maximum total fee user is willing to pay

### Fee Calculation
```javascript
// Effective gas price = baseFee + min(priorityFee, maxFee - baseFee)
const effectiveGasPrice = baseFee + Math.min(priorityFee, maxFee - baseFee);
```

### Base Fee Adjustment
- **High congestion**: Base fee increases
- **Low congestion**: Base fee decreases
- **Target**: Maintains target gas usage per block

## 🌸 Bloom Filter

Efficient probabilistic data structure for transaction filtering:

### Features
- **Space Efficient**: Minimal memory usage
- **Fast Lookups**: O(k) time complexity
- **Configurable**: Adjustable false positive rate
- **Network Friendly**: Reduces bandwidth usage

### Usage
```javascript
// Check if transaction might be in filter
const mightContain = blockchain.mightContainTransaction(txHash);

// Get false positive probability
const falsePositiveRate = bloomFilter.getFalsePositiveProbability();
```

## 🌳 Merkle Tree

Efficient transaction verification and inclusion proofs:

### Features
- **Transaction Verification**: Verify transaction inclusion
- **Inclusion Proofs**: Cryptographic proof of membership
- **Efficient Updates**: O(log n) update complexity
- **Root Validation**: Ensure data integrity

### Usage
```javascript
// Get proof for transaction
const proof = merkleTree.getProof(transactionHash);

// Verify proof
const isValid = MerkleTree.verifyProof(transactionHash, proof, root);
```

## 🧪 Testing

### Run Tests
```bash
npm test
```

### Manual Testing
1. Start the full node: `npm start`
2. Start the miner: `npm run mine`
3. Use the API endpoints to interact with the blockchain
4. Monitor the console output for mining progress

## 📊 Monitoring

### Real-time Statistics
- Block count and chain length
- Pending transactions
- Mining difficulty and rewards
- Network congestion (base fee)
- Bloom filter efficiency

### Mining Statistics
- Blocks mined
- Total rewards earned
- Average block time
- Mining efficiency

## 🔒 Security Features

- **Cryptographic Signing**: All transactions are cryptographically signed
- **Hash Verification**: Double SHA256 hashing for blocks
- **Chain Validation**: Complete blockchain integrity checking
- **UTXO Validation**: Prevents double-spending
- **Proof of Work**: Secure consensus mechanism

## 🚀 Performance Features

- **Efficient Mining**: Optimized proof of work algorithm
- **Memory Management**: Efficient data structures
- **API Optimization**: Fast REST API responses
- **Transaction Pooling**: Smart mempool management
- **Bloom Filtering**: Reduced network overhead

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Inspired by Bitcoin and Ethereum
- EIP-1559 specification
- Bloom filter research
- Merkle tree implementations

---

**Kiki Blockchain** - Building the future of decentralized finance, one block at a time! 🚀 