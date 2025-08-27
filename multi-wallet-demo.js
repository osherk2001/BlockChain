#!/usr/bin/env node

/**
 * Multi-Wallet Demo - Demonstrates 3 wallets on a single server/process
 * 
 * Usage:
 *   node multi-wallet-demo.js --role=full    # Full Node Wallet with mining
 *   node multi-wallet-demo.js --role=light1  # Light Wallet 1
 *   node multi-wallet-demo.js --role=light2  # Light Wallet 2
 * 
 * Each instance connects to the same shared server and demonstrates
 * different wallet capabilities and interactions.
 */

const SharedServer = require('./src/server/sharedServer');
const FullNodeWallet = require('./src/models/fullNodeWallet');
const LightWalletClient = require('./src/models/lightWalletClient');

// Global shared server instance
let sharedServer = null;

/**
 * Parse command line arguments
 * @returns {Object} - Parsed arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const parsed = {};
  
  args.forEach(arg => {
    if (arg.startsWith('--')) {
      const [key, value] = arg.substring(2).split('=');
      parsed[key] = value;
    }
  });
  
  return parsed;
}

/**
 * Initialize shared server
 */
function initializeServer() {
  if (!sharedServer) {
    sharedServer = new SharedServer({
      port: 3000,
      difficulty: 2,
      blockReward: 50,
      initialBalance: 300
    });
    
    sharedServer.start();
    
    // Wait for server to start
    setTimeout(() => {
      console.log(`[MultiWalletDemo] ✅ Shared server ready`);
    }, 1000);
  }
  
  return sharedServer;
}

/**
 * Run Full Node Wallet demo
 */
async function runFullNodeWallet() {
  console.log(`\n🚀 FULL NODE WALLET DEMO`);
  console.log('═══════════════════════════════════════════════════════════════════════════════');
  
  const server = initializeServer();
  
  // Create full node wallet
  const fullNodeWallet = new FullNodeWallet({
    address: '0x1111111111111111111111111111111111111111',
    name: 'FullNodeWallet',
    initialBalance: 300,
    blockchain: server.blockchain,
    server: server
  });
  
  // Register with server
  await registerWallet(fullNodeWallet, 'full');
  
  // Start mining
  fullNodeWallet.startMining(8000); // Mine every 8 seconds
  
  // Demo transactions
  setTimeout(async () => {
    console.log(`\n[FullNodeWallet] 💸 Creating demo transactions...`);
    
    // Send to Light Wallet 1
    const tx1 = fullNodeWallet.createTransaction({
      to: '0x2222222222222222222222222222222222222222',
      value: 50,
      data: 'Payment to Light Wallet 1'
    });
    
    if (tx1) {
      fullNodeWallet.sendTransaction(tx1);
    }
    
    // Send to Light Wallet 2
    setTimeout(() => {
      const tx2 = fullNodeWallet.createTransaction({
        to: '0x3333333333333333333333333333333333333333',
        value: 75,
        data: 'Payment to Light Wallet 2'
      });
      
      if (tx2) {
        fullNodeWallet.sendTransaction(tx2);
      }
    }, 3000);
    
  }, 2000);
  
  // Print status periodically
  const statusInterval = setInterval(() => {
    fullNodeWallet.printStatus();
    fullNodeWallet.printTransactionHistory();
  }, 15000);
  
  // Demo cleanup
  setTimeout(() => {
    clearInterval(statusInterval);
    fullNodeWallet.stopMining();
    fullNodeWallet.shutdown();
    console.log(`\n[FullNodeWallet] ✅ Demo completed`);
  }, 60000);
}

/**
 * Run Light Wallet 1 demo
 */
async function runLightWallet1() {
  console.log(`\n💡 LIGHT WALLET 1 DEMO`);
  console.log('═══════════════════════════════════════════════════════════════════════════════');
  
  const server = initializeServer();
  
  // Create light wallet
  const lightWallet1 = new LightWalletClient({
    address: '0x2222222222222222222222222222222222222222',
    name: 'LightWallet1',
    initialBalance: 300,
    server: server
  });
  
  // Register with server
  await registerWallet(lightWallet1, 'light');
  
  // Connect to network
  await lightWallet1.connect();
  
  // Demo transactions
  setTimeout(async () => {
    console.log(`\n[LightWallet1] 💸 Creating demo transactions...`);
    
    // Send to Light Wallet 2
    const tx1 = lightWallet1.createTransaction({
      to: '0x3333333333333333333333333333333333333333',
      value: 25,
      data: 'Payment from Light Wallet 1 to Light Wallet 2'
    });
    
    if (tx1) {
      await lightWallet1.sendTransaction(tx1);
    }
    
    // Send back to Full Node Wallet
    setTimeout(async () => {
      const tx2 = lightWallet1.createTransaction({
        to: '0x1111111111111111111111111111111111111111',
        value: 15,
        data: 'Return payment to Full Node Wallet'
      });
      
      if (tx2) {
        await lightWallet1.sendTransaction(tx2);
      }
    }, 4000);
    
  }, 5000);
  
  // Check for incoming transactions periodically
  const checkInterval = setInterval(async () => {
    await lightWallet1.checkIncomingTransactions();
    await lightWallet1.updateBalance();
  }, 5000);
  
  // Print status periodically
  const statusInterval = setInterval(() => {
    lightWallet1.printStatus();
    lightWallet1.printTransactionHistory();
  }, 15000);
  
  // Demo cleanup
  setTimeout(() => {
    clearInterval(checkInterval);
    clearInterval(statusInterval);
    lightWallet1.shutdown();
    console.log(`\n[LightWallet1] ✅ Demo completed`);
  }, 60000);
}

/**
 * Run Light Wallet 2 demo
 */
async function runLightWallet2() {
  console.log(`\n💡 LIGHT WALLET 2 DEMO`);
  console.log('═══════════════════════════════════════════════════════════════════════════════');
  
  const server = initializeServer();
  
  // Create light wallet
  const lightWallet2 = new LightWalletClient({
    address: '0x3333333333333333333333333333333333333333',
    name: 'LightWallet2',
    initialBalance: 300,
    server: server
  });
  
  // Register with server
  await registerWallet(lightWallet2, 'light');
  
  // Connect to network
  await lightWallet2.connect();
  
  // Demo transactions
  setTimeout(async () => {
    console.log(`\n[LightWallet2] 💸 Creating demo transactions...`);
    
    // Send to Full Node Wallet
    const tx1 = lightWallet2.createTransaction({
      to: '0x1111111111111111111111111111111111111111',
      value: 30,
      data: 'Payment from Light Wallet 2 to Full Node Wallet'
    });
    
    if (tx1) {
      await lightWallet2.sendTransaction(tx1);
    }
    
    // Send to Light Wallet 1
    setTimeout(async () => {
      const tx2 = lightWallet2.createTransaction({
        to: '0x2222222222222222222222222222222222222222',
        value: 20,
        data: 'Payment from Light Wallet 2 to Light Wallet 1'
      });
      
      if (tx2) {
        await lightWallet2.sendTransaction(tx2);
      }
    }, 6000);
    
  }, 7000);
  
  // Check for incoming transactions periodically
  const checkInterval = setInterval(async () => {
    await lightWallet2.checkIncomingTransactions();
    await lightWallet2.updateBalance();
  }, 5000);
  
  // Print status periodically
  const statusInterval = setInterval(() => {
    lightWallet2.printStatus();
    lightWallet2.printTransactionHistory();
  }, 15000);
  
  // Demo cleanup
  setTimeout(() => {
    clearInterval(checkInterval);
    clearInterval(statusInterval);
    lightWallet2.shutdown();
    console.log(`\n[LightWallet2] ✅ Demo completed`);
  }, 60000);
}

/**
 * Register wallet with server
 * @param {Object} wallet - Wallet instance
 * @param {string} type - Wallet type
 */
async function registerWallet(wallet, type) {
  try {
    const fetch = require('node-fetch');
    const response = await fetch(`http://localhost:3000/wallet/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        address: wallet.address,
        name: wallet.name,
        type: type
      })
    });
    
    const result = await response.json();
    if (result.success) {
      console.log(`[${wallet.name}] ✅ Registered with server`);
    } else {
      console.log(`[${wallet.name}] ❌ Failed to register: ${result.message}`);
    }
  } catch (error) {
    console.log(`[${wallet.name}] ❌ Registration error: ${error.message}`);
  }
}

/**
 * Print demo instructions
 */
function printInstructions() {
  console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║                    🚀 MULTI-WALLET DEMO INSTRUCTIONS                         ║
║                                                                              ║
║  This demo runs 3 different wallet types on a single server:                ║
║                                                                              ║
║  1. Full Node Wallet - Complete blockchain node with mining capability      ║
║  2. Light Wallet 1 - Lightweight wallet for transactions only              ║
║  3. Light Wallet 2 - Another light wallet for transactions only            ║
║                                                                              ║
║  Usage:                                                                      ║
║    node multi-wallet-demo.js --role=full    # Run Full Node Wallet          ║
║    node multi-wallet-demo.js --role=light1  # Run Light Wallet 1            ║
║    node multi-wallet-demo.js --role=light2  # Run Light Wallet 2            ║
║                                                                              ║
║  Features:                                                                   ║
║    • Shared blockchain server                                               ║
║    • Real-time transaction processing                                       ║
║    • Balance synchronization                                                ║
║    • Mining and block creation                                              ║
║    • Transaction history tracking                                           ║
║                                                                              ║
║  Demo Duration: 60 seconds per wallet                                       ║
╚══════════════════════════════════════════════════════════════════════════════╝
`);
}

/**
 * Main function
 */
async function main() {
  const args = parseArgs();
  const role = args.role;
  
  printInstructions();
  
  if (!role) {
    console.log(`❌ Please specify a role: --role=full, --role=light1, or --role=light2`);
    process.exit(1);
  }
  
  console.log(`🎯 Starting demo with role: ${role}`);
  console.log(`⏰ Demo will run for 60 seconds`);
  
  try {
    switch (role) {
      case 'full':
        await runFullNodeWallet();
        break;
      case 'light1':
        await runLightWallet1();
        break;
      case 'light2':
        await runLightWallet2();
        break;
      default:
        console.log(`❌ Invalid role: ${role}. Use: full, light1, or light2`);
        process.exit(1);
    }
  } catch (error) {
    console.error(`❌ Demo error: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Handle process shutdown
 */
process.on('SIGINT', () => {
  console.log(`\n🛑 Shutting down demo...`);
  
  if (sharedServer) {
    sharedServer.stop();
  }
  
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log(`\n🛑 Shutting down demo...`);
  
  if (sharedServer) {
    sharedServer.stop();
  }
  
  process.exit(0);
});

// Start the demo if this file is run directly
if (require.main === module) {
  main().catch(error => {
    console.error(`❌ Fatal error: ${error.message}`);
    process.exit(1);
  });
}

module.exports = {
  main,
  runFullNodeWallet,
  runLightWallet1,
  runLightWallet2,
  initializeServer
}; 