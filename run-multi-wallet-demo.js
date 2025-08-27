#!/usr/bin/env node

/**
 * Run Multi-Wallet Demo - Launches all three wallet types simultaneously
 * 
 * This script starts the shared server and then launches three separate
 * processes for each wallet type to demonstrate the multi-wallet functionality.
 */

const { spawn } = require('child_process');
const SharedServer = require('./src/server/sharedServer');

console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║                    🚀 MULTI-WALLET DEMO LAUNCHER                              ║
║                                                                              ║
║  This script will launch:                                                    ║
║    1. Shared Server (blockchain + API)                                      ║
║    2. Full Node Wallet (mining + transactions)                              ║
║    3. Light Wallet 1 (transactions only)                                    ║
║    4. Light Wallet 2 (transactions only)                                    ║
║                                                                              ║
║  All wallets will connect to the same shared server and interact            ║
║  with each other through the blockchain network.                            ║
╚══════════════════════════════════════════════════════════════════════════════╝
`);

// Global variables
let sharedServer = null;
let walletProcesses = [];

/**
 * Start the shared server
 */
function startSharedServer() {
  console.log(`\n🏗️  Starting Shared Server...`);
  
  sharedServer = new SharedServer({
    port: 3000,
    difficulty: 2,
    blockReward: 50,
    initialBalance: 300
  });
  
  sharedServer.start();
  
  // Wait for server to be ready
  setTimeout(() => {
    console.log(`✅ Shared Server ready on port 3000`);
    console.log(`   Health: http://localhost:3000/health`);
    console.log(`   Blockchain: http://localhost:3000/blockchain`);
    console.log(`   Stats: http://localhost:3000/stats`);
    
    // Start wallet processes
    setTimeout(startWalletProcesses, 2000);
  }, 3000);
}

/**
 * Start all wallet processes
 */
function startWalletProcesses() {
  console.log(`\n🚀 Starting Wallet Processes...`);
  
  const roles = ['full', 'light1', 'light2'];
  const delays = [0, 3000, 6000]; // Stagger the starts
  
  roles.forEach((role, index) => {
    setTimeout(() => {
      startWalletProcess(role, index + 1);
    }, delays[index]);
  });
}

/**
 * Start a single wallet process
 * @param {string} role - Wallet role
 * @param {number} processNumber - Process number
 */
function startWalletProcess(role, processNumber) {
  const walletNames = {
    'full': 'Full Node Wallet',
    'light1': 'Light Wallet 1',
    'light2': 'Light Wallet 2'
  };
  
  console.log(`\n💡 Starting ${walletNames[role]} (Process ${processNumber})...`);
  
  const process = spawn('node', ['multi-wallet-demo.js', `--role=${role}`], {
    stdio: 'pipe',
    detached: false
  });
  
  // Store process reference
  walletProcesses.push({
    role: role,
    process: process,
    name: walletNames[role]
  });
  
  // Handle process output
  process.stdout.on('data', (data) => {
    const output = data.toString().trim();
    if (output) {
      console.log(`[${walletNames[role]}] ${output}`);
    }
  });
  
  process.stderr.on('data', (data) => {
    const error = data.toString().trim();
    if (error) {
      console.error(`[${walletNames[role]}] ERROR: ${error}`);
    }
  });
  
  // Handle process exit
  process.on('close', (code) => {
    console.log(`\n🔌 ${walletNames[role]} process exited with code ${code}`);
    
    // Remove from active processes
    walletProcesses = walletProcesses.filter(wp => wp.role !== role);
    
    // If all wallets are done, stop the server
    if (walletProcesses.length === 0) {
      console.log(`\n🎉 All wallet processes completed`);
      stopDemo();
    }
  });
  
  console.log(`✅ ${walletNames[role]} started (PID: ${process.pid})`);
}

/**
 * Stop the demo and cleanup
 */
function stopDemo() {
  console.log(`\n🛑 Stopping Multi-Wallet Demo...`);
  
  // Stop all wallet processes
  walletProcesses.forEach(wp => {
    console.log(`   Stopping ${wp.name}...`);
    wp.process.kill('SIGTERM');
  });
  
  // Stop shared server
  if (sharedServer) {
    console.log(`   Stopping Shared Server...`);
    sharedServer.stop();
  }
  
  console.log(`✅ Demo stopped successfully`);
  process.exit(0);
}

/**
 * Handle process shutdown
 */
process.on('SIGINT', () => {
  console.log(`\n🛑 Received SIGINT, shutting down...`);
  stopDemo();
});

process.on('SIGTERM', () => {
  console.log(`\n🛑 Received SIGTERM, shutting down...`);
  stopDemo();
});

/**
 * Print demo status
 */
function printStatus() {
  console.log(`\n📊 DEMO STATUS`);
  console.log('═══════════════════════════════════════════════════════════════════════════════');
  
  if (sharedServer) {
    const status = sharedServer.getStatus();
    console.log(`   Server: ${status.isRunning ? 'RUNNING' : 'STOPPED'} (Port: ${status.port})`);
    console.log(`   Connected Wallets: ${status.connectedWallets}`);
    console.log(`   Blockchain Length: ${status.blockchainLength}`);
    console.log(`   Pending Transactions: ${status.pendingTransactions}`);
  } else {
    console.log(`   Server: NOT STARTED`);
  }
  
  console.log(`   Active Wallet Processes: ${walletProcesses.length}`);
  walletProcesses.forEach(wp => {
    console.log(`     - ${wp.name} (PID: ${wp.process.pid})`);
  });
}

// Print status every 30 seconds
const statusInterval = setInterval(printStatus, 30000);

/**
 * Main execution
 */
async function main() {
  try {
    console.log(`🎯 Starting Multi-Wallet Demo...`);
    console.log(`⏰ Demo will run for approximately 2 minutes`);
    console.log(`📊 Status updates every 30 seconds`);
    
    // Start the shared server
    startSharedServer();
    
    // Print initial status after a delay
    setTimeout(printStatus, 10000);
    
  } catch (error) {
    console.error(`❌ Demo error: ${error.message}`);
    stopDemo();
  }
}

// Start the demo
main().catch(error => {
  console.error(`❌ Fatal error: ${error.message}`);
  process.exit(1);
});

module.exports = {
  startSharedServer,
  startWalletProcesses,
  stopDemo,
  printStatus
}; 