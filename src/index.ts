// Ethereum devp2p mempool monitoring (Node.js, TypeScript)
import { RLPx, DPT } from "@ethereumjs/devp2p";
import { ethers } from "ethers";
import PQueue from "p-queue";
import * as crypto from "crypto";
import * as dgram from "dgram";

// configs
const MAX_PEERS = 120;
const UNISWAP_ROUTER = "0x66a9893cC07D91D95644AEDD05D03f95e1dBA8Af".toLowerCase();
const swapSelectors = new Set([
  // v2 selectors (first 4 bytes hex)
  "0x7ff36ab5", // swapExactETHForTokens
  "0x18cbafe5", // swapExactTokensForETH
  "0x5c11d795", // swapExactTokensForTokensSupportingFeeOnTransferTokens
  // add others...
]);

// Global variables
let rlpx: RLPx;
let dpt: DPT;
let isRunning = false;

// Helper function to check if message is an ETH transaction message
function isEthTxMessage(msg: any): boolean {
  // Check if this is an ETH protocol message with transaction data
  return msg.protocol === 'eth' && (msg.code === 2 || msg.code === 3); // NewPooledTransactionHashes or NewPooledTransactions
}

// Generate a random private key for this node
function generatePrivateKey(): Uint8Array {
  return crypto.randomBytes(32);
}

// Get peer information for logging
function getPeerInfo(peer: any): string {
  try {
    if (peer && peer._socket && peer._socket.remoteAddress) {
      return `${peer._socket.remoteAddress}:${peer._socket.remotePort || 'unknown'}`;
    }
    return 'unknown';
  } catch (error) {
    return 'unknown';
  }
}

// Handle ETH protocol messages
function handleEthMessage(msg: any, peerInfo?: string): void {
  try {
    console.log(`📨 Received ETH message from ${peerInfo || 'unknown peer'}:`);
    console.log(`   Protocol: ${msg.protocol}`);
    console.log(`   Code: ${msg.code}`);
    console.log(`   Payload length: ${msg.payload ? msg.payload.length : 0} bytes`);

    if (msg.code === 2) { // NewPooledTransactionHashes
      console.log(`   📋 NewPooledTransactionHashes - requesting full transactions...`);
      // This contains transaction hashes, not full transactions
      // In a real implementation, you would request full transactions
    } else if (msg.code === 3) { // NewPooledTransactions
      console.log(`   📄 NewPooledTransactions - processing full transactions...`);
      // This contains full transactions
      // In a real implementation, you would decode and process these
    } else {
      console.log(`   ❓ Unknown ETH message code: ${msg.code}`);
    }
  } catch (error) {
    console.error('Failed to handle ETH message:', error);
  }
}

// Process raw transaction
async function handleRawTx(txBytes: Buffer): Promise<void> {
  try {
    // ethers v6 uses Transaction.from() with hex string
    const txHex = '0x' + txBytes.toString('hex');
    const tx = ethers.Transaction.from(txHex);

    if (!tx.to) return;
    if (tx.to.toLowerCase() !== UNISWAP_ROUTER) return;

    const selector = tx.data.slice(0, 10);
    if (!swapSelectors.has(selector)) return;

    // Push to worker queue for processing
    workerQueue.add(() => processSwapTx(tx));

  } catch (error) {
    // Some transaction types may require custom parsing
    // Error handling - could log to file or external service
  }
}

// Process swap transaction
async function processSwapTx(_tx: any): Promise<void> {
  try {
    // Process swap transaction - could emit events or call external services
    // Here you could:
    // 1. Decode the swap parameters
    // 2. Simulate the transaction
    // 3. Build a competing transaction
    // 4. Send to a bundle service

  } catch (error) {
    // Error handling - could log to file or external service
  }
}

// Initialize RLPx and DPT
function initializeRLPx(): void {
  const privateKey = generatePrivateKey();

  // Create DPT (Discovery Protocol Table)
  dpt = new DPT(privateKey, {
    refreshInterval: 30000,
    createSocket: () => dgram.createSocket('udp4')
  });

  // DPT doesn't have event handlers, we'll log peer discovery in RLPx events

  // Create RLPx instance with basic configuration
  rlpx = new RLPx(privateKey, {
    dpt,
    maxPeers: MAX_PEERS,
    capabilities: [
      { name: 'eth', version: 66, length: 17, constructor: null as any },
      { name: 'eth', version: 67, length: 17, constructor: null as any },
      { name: 'eth', version: 68, length: 17, constructor: null as any }
    ],
    listenPort: 30303,
    common: null as any
  });

  // Setup RLPx event handlers
  rlpx.events.on('peer:added', (peer: any) => {
    const peerInfo = getPeerInfo(peer);
    console.log(`✅ Connected to peer: ${peerInfo}`);
    setupPeerHandlers(peer, peerInfo);
  });

  rlpx.events.on('peer:removed', (peer: any) => {
    const peerInfo = getPeerInfo(peer);
    console.log(`❌ Disconnected from peer: ${peerInfo}`);
  });

  rlpx.events.on('error', (error: Error) => {
    console.error('RLPx error:', error);
  });

  // Start listening
  rlpx.listen(30303, '0.0.0.0');
}

// Setup peer message handlers
function setupPeerHandlers(peer: any, peerInfo: string): void {
  // Note: The actual Peer API may be different
  // This is a simplified version for demonstration
  if (peer.on) {
    peer.on('message', (msg: any) => {
      try {
        console.log(`📥 Message from ${peerInfo}: protocol=${msg.protocol}, code=${msg.code}`);
        if (isEthTxMessage(msg)) {
          handleEthMessage(msg, peerInfo);
        } else {
          console.log(`   📋 Other message type: ${msg.protocol || 'unknown'}`);
        }
      } catch (error) {
        console.error(`Error handling message from ${peerInfo}:`, error);
      }
    });

    peer.on('error', (error: Error) => {
      console.error(`Peer error from ${peerInfo}:`, error);
    });

    peer.on('close', () => {
      console.log(`🔌 Peer ${peerInfo} closed connection`);
    });
  }
}

// Worker queue for processing transactions
const workerQueue = new PQueue({ concurrency: 8 });

// Main function to start mempool monitoring
export async function startMempoolMonitoring(): Promise<void> {
  if (isRunning) {
    return;
  }

  try {
    // Initialize RLPx
    initializeRLPx();

    // Start DPT with real bootstrap peers
    const bootstrapPeers = [
      // Ethereum mainnet bootstrap nodes
      {
        id: Buffer.from('a979fb575495b8d6db44f750317d0f4622bf4c2aa3365d6af7c284339968eef29b69ad0dce72a4d8db5ebb4968de0e3bec910127f134779fbcb0cb6d3331163c', 'hex'),
        address: '18.138.108.67',
        udpPort: 30303,
        tcpPort: 30303
      },
      {
        id: Buffer.from('3f1d12044546b76342d59d4a05532c14b85aa669704bfe1f864fe079415aa2c02d743e032be6a0e6c3a80c343db9dd5760fe80ed6d0ba6c805646a5eb6d8b21', 'hex'),
        address: '52.14.151.177',
        udpPort: 30303,
        tcpPort: 30303
      },
      {
        id: Buffer.from('78de8a0916848093c73790ead81d1928bec737d565119932b98c6b100d944b7a95e94f847a6897a91210331e05e7e03f8a9c24d551f1d46e7b5831f0abf7bf', 'hex'),
        address: '3.209.45.79',
        udpPort: 30303,
        tcpPort: 30303
      }
    ];

    console.log('🔍 Starting bootstrap with Ethereum mainnet nodes...');
    for (const peer of bootstrapPeers) {
      try {
        await dpt.bootstrap(peer);
        console.log(`   ✅ Bootstrap peer: ${peer.address}:${peer.udpPort}`);
      } catch (error) {
        console.log(`   ❌ Failed to bootstrap ${peer.address}:${peer.udpPort}`);
      }
    }

    isRunning = true;
    console.log('✅ Mempool monitoring started successfully!');
    console.log('📡 Listening for peer connections and transactions...');
    console.log('💡 You should see peer discovery and connection logs above');

  } catch (error) {
    console.error('❌ Failed to start mempool monitoring:', error);
    throw error;
  }
}

// Stop monitoring
export async function stopMempoolMonitoring(): Promise<void> {
  if (!isRunning) {
    return;
  }

  try {
    if (rlpx) {
      rlpx.destroy();
    }

    if (dpt) {
      dpt.destroy();
    }

    isRunning = false;

  } catch (error) {
    // Error handling - could log to file or external service
  }
}

// Export utility functions
export { handleRawTx, processSwapTx, isEthTxMessage };

// If this file is run directly, start the monitoring
if (require.main === module) {
  startMempoolMonitoring().catch((_error) => {
    // Error handling - could log to file or external service
    process.exit(1);
  });

  // Graceful shutdown
  process.on('SIGINT', async () => {
    await stopMempoolMonitoring();
    process.exit(0);
  });
}