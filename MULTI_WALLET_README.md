# 🚀 Multi-Wallet Demo

A comprehensive demonstration of 3 different wallet types running on a single server/process, showcasing full node and light wallet interactions.

## 🌟 Features

### ✅ Wallet Types
- **FullNodeWallet** - Complete blockchain node with mining capability
- **LightWalletClient** ×2 - Lightweight wallets for transactions only

### ✅ Shared Infrastructure
- **SharedServer** - Single server managing blockchain and API endpoints
- **In-Memory State** - Minimal state persistence for demo purposes
- **Real-time Communication** - All wallets connect to same server endpoint

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  FullNodeWallet │    │  LightWallet1   │    │  LightWallet2   │
│                 │    │                 │    │                 │
│ • Mining        │    │ • Transactions  │    │ • Transactions  │
│ • Full Chain    │    │ • Light Sync    │    │ • Light Sync    │
│ • Block Creation│    │ • Balance Check │    │ • Balance Check │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌─────────────▼─────────────┐
                    │     SharedServer          │
                    │                           │
                    │ • Blockchain Management   │
                    │ • API Endpoints          │
                    │ • Transaction Pool       │
                    │ • Wallet Registration    │
                    └───────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation
```bash
# Install dependencies
npm install

# Run the complete multi-wallet demo
node run-multi-wallet-demo.js
```

### Individual Wallet Demos
```bash
# Run Full Node Wallet
node multi-wallet-demo.js --role=full

# Run Light Wallet 1
node multi-wallet-demo.js --role=light1

# Run Light Wallet 2
node multi-wallet-demo.js --role=light2
```

## 📋 Wallet Capabilities

### FullNodeWallet
- **Complete Blockchain Storage** - Stores full blockchain
- **Mining Capability** - Mines blocks and earns rewards
- **Transaction Validation** - Validates all transactions
- **Block Creation** - Creates and adds blocks to chain
- **Network Management** - Manages peer connections

### LightWalletClient
- **Transaction Only** - Sends and receives transactions
- **Light Sync** - Syncs only relevant transaction data
- **Balance Tracking** - Tracks own balance and transactions
- **Server Communication** - Communicates via API endpoints
- **Minimal Storage** - Doesn't store full blockchain

## 🔧 API Endpoints

### Server Endpoints
- `GET /health` - Health check
- `GET /blockchain` - Blockchain overview
- `GET /balance/:address` - Get wallet balance
- `POST /transaction` - Submit transaction
- `GET /transactions/pending` - Get pending transactions
- `POST /mine` - Mine a block
- `GET /stats` - Blockchain statistics
- `POST /wallet/register` - Register wallet
- `GET /wallets` - Get connected wallets

## 💰 Demo Transactions

### Transaction Flow
1. **Full Node Wallet** sends 50 KIKI to Light Wallet 1
2. **Full Node Wallet** sends 75 KIKI to Light Wallet 2
3. **Light Wallet 1** sends 25 KIKI to Light Wallet 2
4. **Light Wallet 1** sends 15 KIKI back to Full Node Wallet
5. **Light Wallet 2** sends 30 KIKI to Full Node Wallet
6. **Light Wallet 2** sends 20 KIKI to Light Wallet 1

### Fee Structure
- **Base Fee**: 2 KIKI (burned)
- **Priority Fee**: 3 KIKI (to miner)
- **Block Reward**: 50 KIKI (to miner)

## 📊 Demo Output

### Full Node Wallet
```
[FullNodeWallet] 📊 WALLET STATUS
   Address: 0x1111111111111111111111111111111111111111
   Balance: 285 KIKI
   Full Node: YES
   Mining: ACTIVE
   Blocks Mined: 3
   Total Rewards: 150 KIKI
   Total Transactions: 4
   Sent: 2
   Received: 2
```

### Light Wallet 1
```
[LightWallet1] 📊 WALLET STATUS
   Address: 0x2222222222222222222222222222222222222222
   Balance: 310 KIKI
   Light Wallet: YES
   Connected: YES
   Total Transactions: 4
   Sent: 2
   Received: 2
```

### Light Wallet 2
```
[LightWallet2] 📊 WALLET STATUS
   Address: 0x3333333333333333333333333333333333333333
   Balance: 320 KIKI
   Light Wallet: YES
   Connected: YES
   Total Transactions: 4
   Sent: 2
   Received: 2
```

## 🔄 Process Management

### Single Process Execution
```bash
# Each wallet runs in its own process
node multi-wallet-demo.js --role=full    # Process 1
node multi-wallet-demo.js --role=light1  # Process 2
node multi-wallet-demo.js --role=light2  # Process 3
```

### Multi-Process Launcher
```bash
# Launches all wallets simultaneously
node run-multi-wallet-demo.js
```

## 🧪 Testing

### Manual Testing
1. Start shared server: `node multi-wallet-demo.js --role=full`
2. In another terminal: `node multi-wallet-demo.js --role=light1`
3. In third terminal: `node multi-wallet-demo.js --role=light2`

### API Testing
```bash
# Check server health
curl http://localhost:3000/health

# Get blockchain info
curl http://localhost:3000/blockchain

# Get wallet balance
curl http://localhost:3000/balance/0x1111111111111111111111111111111111111111

# Get connected wallets
curl http://localhost:3000/wallets
```

## 📈 Performance Features

### Full Node Wallet
- **Complete Validation** - Validates entire blockchain
- **Mining Efficiency** - Optimized proof of work
- **Memory Management** - Efficient blockchain storage
- **Real-time Updates** - Immediate balance updates

### Light Wallet Client
- **Fast Sync** - Quick balance synchronization
- **Minimal Storage** - Only stores relevant data
- **API Communication** - Efficient server communication
- **Transaction Tracking** - Real-time transaction monitoring

## 🔒 Security Features

### Authentication
- **Wallet Registration** - Secure wallet registration
- **Transaction Signing** - Cryptographic transaction signing
- **Balance Validation** - Prevents double-spending
- **Nonce Management** - Prevents replay attacks

### Network Security
- **CORS Support** - Cross-origin resource sharing
- **Input Validation** - All inputs validated
- **Error Handling** - Comprehensive error handling
- **Process Isolation** - Separate processes for each wallet

## 🚀 Advanced Usage

### Custom Configuration
```javascript
// Custom server configuration
const server = new SharedServer({
  port: 3000,
  difficulty: 3,
  blockReward: 100,
  initialBalance: 500
});

// Custom wallet configuration
const wallet = new FullNodeWallet({
  address: '0x...',
  name: 'CustomWallet',
  initialBalance: 1000,
  blockchain: server.blockchain,
  server: server
});
```

### Extending Functionality
```javascript
// Add custom wallet types
class CustomWallet extends LightWalletClient {
  constructor(config) {
    super(config);
    // Add custom functionality
  }
  
  // Custom methods
  async customTransaction() {
    // Custom transaction logic
  }
}
```

## 📝 API Reference

### SharedServer Methods
- `start()` - Start the server
- `stop()` - Stop the server
- `getStatus()` - Get server status
- `printStatus()` - Print server status

### FullNodeWallet Methods
- `createTransaction(params)` - Create new transaction
- `sendTransaction(transaction)` - Send transaction
- `startMining(interval)` - Start mining
- `stopMining()` - Stop mining
- `printStatus()` - Print wallet status
- `shutdown()` - Shutdown wallet

### LightWalletClient Methods
- `connect()` - Connect to network
- `disconnect()` - Disconnect from network
- `createTransaction(params)` - Create new transaction
- `sendTransaction(transaction)` - Send transaction
- `syncBalance()` - Sync balance from server
- `checkIncomingTransactions()` - Check for new transactions
- `printStatus()` - Print wallet status
- `shutdown()` - Shutdown wallet

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

---

**Multi-Wallet Demo** - Demonstrating the power of different wallet types on a shared blockchain! 🚀 