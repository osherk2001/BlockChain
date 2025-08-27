#!/usr/bin/env node

/**
 * Test Multi-Wallet Demo - Simple demonstration of multi-wallet functionality
 * 
 * This script creates all three wallet types in a single process to demonstrate
 * the functionality without requiring multiple terminal windows.
 */

const SharedServer = require('./src/server/sharedServer');
const FullNodeWallet = require('./src/models/fullNodeWallet');
const LightWalletClient = require('./src/models/lightWalletClient');

console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║                    🚀 MULTI-WALLET TEST DEMO                                 ║
║                                                                              ║
║  This demo creates all three wallet types in a single process:              ║
║    1. Full Node Wallet - Mining and full blockchain                         ║
║    2. Light Wallet 1 - Transaction only                                     ║
║    3. Light Wallet 2 - Transaction only                                     ║
║                                                                              ║
║  All wallets will interact through the shared server.                       ║
╚══════════════════════════════════════════════════════════════════════════════╝
`);

// Global variables
let sharedServer = null;
let fullNodeWallet = null;
let lightWallet1 = null;
let lightWallet2 = null;

/**
 * Initialize the demo
 */
async function initializeDemo() {
  console.log(`\n🏗️  Initializing Multi-Wallet Demo...`);
  
  // Create shared server
  sharedServer = new SharedServer({
    port: 3000,
    difficulty: 2,
    blockReward: 50,
    initialBalance: 300
  });
  
  // Start server
  sharedServer.start();
  
  // Wait for server to start
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  console.log(`✅ Shared server started on port 3000`);
  
  // Create wallets
  await createWallets();
  
  // Start demo sequence
  startDemoSequence();
}

/**
 * Create all wallets
 */
async function createWallets() {
  console.log(`\n💡 Creating wallets...`);
  
  // Create Full Node Wallet
  fullNodeWallet = new FullNodeWallet({
    address: '0x1111111111111111111111111111111111111111',
    name: 'FullNodeWallet',
    initialBalance: 300,
    blockchain: sharedServer.blockchain,
    server: sharedServer
  });
  
  // Create Light Wallet 1
  lightWallet1 = new LightWalletClient({
    address: '0x2222222222222222222222222222222222222222',
    name: 'LightWallet1',
    initialBalance: 300,
    server: sharedServer
  });
  
  // Create Light Wallet 2
  lightWallet2 = new LightWalletClient({
    address: '0x3333333333333333333333333333333333333333',
    name: 'LightWallet2',
    initialBalance: 300,
    server: sharedServer
  });
  
  // Connect light wallets
  await lightWallet1.connect();
  await lightWallet2.connect();
  
  console.log(`✅ All wallets created and connected`);
}

/**
 * Start the demo sequence
 */
function startDemoSequence() {
  console.log(`\n🚀 Starting demo sequence...`);
  
  // Start mining with full node wallet
  fullNodeWallet.startMining(10000); // Mine every 10 seconds
  
  // Demo transactions sequence
  setTimeout(() => demoTransaction1(), 3000);
  setTimeout(() => demoTransaction2(), 6000);
  setTimeout(() => demoTransaction3(), 9000);
  setTimeout(() => demoTransaction4(), 12000);
  setTimeout(() => demoTransaction5(), 15000);
  setTimeout(() => demoTransaction6(), 18000);
  
  // Print status periodically
  const statusInterval = setInterval(() => {
    printAllStatus();
  }, 25000);
  
  // Demo cleanup
  setTimeout(() => {
    clearInterval(statusInterval);
    cleanupDemo();
  }, 60000);
}

/**
 * Demo transaction 1: Full Node Wallet -> Light Wallet 1
 */
function demoTransaction1() {
  console.log(`\n💸 Demo Transaction 1: Full Node Wallet -> Light Wallet 1`);
  
  const tx = fullNodeWallet.createTransaction({
    to: '0x2222222222222222222222222222222222222222',
    value: 50,
    data: 'Payment to Light Wallet 1'
  });
  
  if (tx) {
    fullNodeWallet.sendTransaction(tx);
  }
}

/**
 * Demo transaction 2: Full Node Wallet -> Light Wallet 2
 */
function demoTransaction2() {
  console.log(`\n💸 Demo Transaction 2: Full Node Wallet -> Light Wallet 2`);
  
  const tx = fullNodeWallet.createTransaction({
    to: '0x3333333333333333333333333333333333333333',
    value: 75,
    data: 'Payment to Light Wallet 2'
  });
  
  if (tx) {
    fullNodeWallet.sendTransaction(tx);
  }
}

/**
 * Demo transaction 3: Light Wallet 1 -> Light Wallet 2
 */
async function demoTransaction3() {
  console.log(`\n💸 Demo Transaction 3: Light Wallet 1 -> Light Wallet 2`);
  
  const tx = lightWallet1.createTransaction({
    to: '0x3333333333333333333333333333333333333333',
    value: 25,
    data: 'Payment from Light Wallet 1 to Light Wallet 2'
  });
  
  if (tx) {
    await lightWallet1.sendTransaction(tx);
  }
}

/**
 * Demo transaction 4: Light Wallet 1 -> Full Node Wallet
 */
async function demoTransaction4() {
  console.log(`\n💸 Demo Transaction 4: Light Wallet 1 -> Full Node Wallet`);
  
  const tx = lightWallet1.createTransaction({
    to: '0x1111111111111111111111111111111111111111',
    value: 15,
    data: 'Return payment to Full Node Wallet'
  });
  
  if (tx) {
    await lightWallet1.sendTransaction(tx);
  }
}

/**
 * Demo transaction 5: Light Wallet 2 -> Full Node Wallet
 */
async function demoTransaction5() {
  console.log(`\n💸 Demo Transaction 5: Light Wallet 2 -> Full Node Wallet`);
  
  const tx = lightWallet2.createTransaction({
    to: '0x1111111111111111111111111111111111111111',
    value: 30,
    data: 'Payment from Light Wallet 2 to Full Node Wallet'
  });
  
  if (tx) {
    await lightWallet2.sendTransaction(tx);
  }
}

/**
 * Demo transaction 6: Light Wallet 2 -> Light Wallet 1
 */
async function demoTransaction6() {
  console.log(`\n💸 Demo Transaction 6: Light Wallet 2 -> Light Wallet 1`);
  
  const tx = lightWallet2.createTransaction({
    to: '0x2222222222222222222222222222222222222222',
    value: 20,
    data: 'Payment from Light Wallet 2 to Light Wallet 1'
  });
  
  if (tx) {
    await lightWallet2.sendTransaction(tx);
  }
}

/**
 * Print status of all wallets
 */
function printAllStatus() {
  console.log(`\n📊 ALL WALLETS STATUS`);
  console.log('═══════════════════════════════════════════════════════════════════════════════');
  
  // Full Node Wallet status
  const fullNodeStats = fullNodeWallet.getStats();
  console.log(`\n🏗️  Full Node Wallet:`);
  console.log(`   Address: ${fullNodeStats.address}`);
  console.log(`   Balance: ${fullNodeStats.balance} KIKI`);
  console.log(`   Mining: ${fullNodeStats.isMining ? 'ACTIVE' : 'INACTIVE'}`);
  console.log(`   Blocks Mined: ${fullNodeStats.minedBlocks}`);
  console.log(`   Total Rewards: ${fullNodeStats.totalRewards} KIKI`);
  console.log(`   Transactions: ${fullNodeStats.transactionCount}`);
  
  // Light Wallet 1 status
  const light1Stats = lightWallet1.getStats();
  console.log(`\n💡 Light Wallet 1:`);
  console.log(`   Address: ${light1Stats.address}`);
  console.log(`   Balance: ${light1Stats.balance} KIKI`);
  console.log(`   Connected: ${light1Stats.isConnected ? 'YES' : 'NO'}`);
  console.log(`   Transactions: ${light1Stats.transactionCount}`);
  
  // Light Wallet 2 status
  const light2Stats = lightWallet2.getStats();
  console.log(`\n💡 Light Wallet 2:`);
  console.log(`   Address: ${light2Stats.address}`);
  console.log(`   Balance: ${light2Stats.balance} KIKI`);
  console.log(`   Connected: ${light2Stats.isConnected ? 'YES' : 'NO'}`);
  console.log(`   Transactions: ${light2Stats.transactionCount}`);
  
  // Server status
  const serverStatus = sharedServer.getStatus();
  console.log(`\n🌐 Server Status:`);
  console.log(`   Running: ${serverStatus.isRunning ? 'YES' : 'NO'}`);
  console.log(`   Connected Wallets: ${serverStatus.connectedWallets}`);
  console.log(`   Blockchain Length: ${serverStatus.blockchainLength}`);
  console.log(`   Pending Transactions: ${serverStatus.pendingTransactions}`);
}

/**
 * Cleanup demo
 */
function cleanupDemo() {
  console.log(`\n🛑 Cleaning up demo...`);
  
  // Stop mining
  if (fullNodeWallet) {
    fullNodeWallet.stopMining();
    fullNodeWallet.shutdown();
  }
  
  // Shutdown light wallets
  if (lightWallet1) {
    lightWallet1.shutdown();
  }
  
  if (lightWallet2) {
    lightWallet2.shutdown();
  }
  
  // Stop server
  if (sharedServer) {
    sharedServer.stop();
  }
  
  console.log(`✅ Demo cleanup completed`);
  console.log(`\n🎉 Multi-Wallet Demo completed successfully!`);
  
  process.exit(0);
}

/**
 * Handle process shutdown
 */
process.on('SIGINT', () => {
  console.log(`\n🛑 Received SIGINT, shutting down...`);
  cleanupDemo();
});

process.on('SIGTERM', () => {
  console.log(`\n🛑 Received SIGTERM, shutting down...`);
  cleanupDemo();
});

/**
 * Main execution
 */
async function main() {
  try {
    await initializeDemo();
  } catch (error) {
    console.error(`❌ Demo error: ${error.message}`);
    cleanupDemo();
  }
}

// Start the demo
main().catch(error => {
  console.error(`❌ Fatal error: ${error.message}`);
  process.exit(1);
});

module.exports = {
  initializeDemo,
  createWallets,
  startDemoSequence,
  printAllStatus,
  cleanupDemo
}; 