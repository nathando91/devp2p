// Debug version with detailed logging
import { RLPx, DPT } from "@ethereumjs/devp2p";
import * as crypto from "crypto";
import * as dgram from "dgram";

// Global variables
let rlpx: RLPx;
let dpt: DPT;

// Generate a random private key for this node
function generatePrivateKey(): Uint8Array {
    return crypto.randomBytes(32);
}

// Initialize RLPx and DPT with detailed logging
function initializeRLPx(): void {
    const privateKey = generatePrivateKey();
    console.log('🔑 Generated private key for this node');

    // Create DPT (Discovery Protocol Table)
    dpt = new DPT(privateKey, {
        refreshInterval: 10000, // Faster refresh
        createSocket: () => dgram.createSocket('udp4')
    });
    console.log('🔍 DPT created');

    // Create RLPx instance with basic configuration
    rlpx = new RLPx(privateKey, {
        dpt,
        maxPeers: 10, // Lower for testing
        capabilities: [
            { name: 'eth', version: 66, length: 17, constructor: null as any },
            { name: 'eth', version: 67, length: 17, constructor: null as any },
            { name: 'eth', version: 68, length: 17, constructor: null as any }
        ],
        listenPort: 30303,
        common: null as any
    });
    console.log('🔗 RLPx created');

    // Setup RLPx event handlers with detailed logging
    rlpx.events.on('peer:added', (peer: any) => {
        console.log(`✅ PEER CONNECTED!`);
        console.log(`   Peer object:`, Object.keys(peer));
        if (peer._socket) {
            console.log(`   Socket:`, peer._socket.remoteAddress, peer._socket.remotePort);
        }
        setupPeerHandlers(peer);
    });

    rlpx.events.on('peer:removed', (peer: any) => {
        console.log(`❌ PEER DISCONNECTED!`);
    });

    rlpx.events.on('error', (error: Error) => {
        console.error('❌ RLPx error:', error);
    });

    // Start listening
    try {
        rlpx.listen(30303, '0.0.0.0');
        console.log('🎧 RLPx listening on port 30303');
    } catch (error) {
        console.error('❌ Failed to start listening:', error);
    }
}

// Setup peer message handlers with detailed logging
function setupPeerHandlers(peer: any): void {
    console.log(`🔧 Setting up handlers for peer`);

    if (peer.on) {
        peer.on('message', (msg: any) => {
            console.log(`📨 MESSAGE RECEIVED!`);
            console.log(`   Protocol: ${msg.protocol}`);
            console.log(`   Code: ${msg.code}`);
            console.log(`   Payload length: ${msg.payload ? msg.payload.length : 0}`);
            console.log(`   Message keys:`, Object.keys(msg));
        });

        peer.on('error', (error: Error) => {
            console.error(`❌ Peer error:`, error);
        });

        peer.on('close', () => {
            console.log(`🔌 Peer connection closed`);
        });
    } else {
        console.log(`⚠️ Peer doesn't have 'on' method`);
    }
}

// Main debug function
async function runDebug(): Promise<void> {
    console.log('🐛 Starting debug mode...');

    try {
        // Initialize RLPx
        initializeRLPx();

        // Try to bootstrap with multiple peers
        const bootstrapPeers = [
            // More recent bootstrap nodes
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
            // Try some other known nodes
            {
                id: Buffer.from('78de8a0916848093c73790ead81d1928bec737d565119932b98c6b100d944b7a95e94f847a6897a91210331e05e7e03f8a9c24d551f1d46e7b5831f0abf7bf', 'hex'),
                address: '3.209.45.79',
                udpPort: 30303,
                tcpPort: 30303
            },
            {
                id: Buffer.from('158f8aab45f6d19c6cbf4a160c2df75ce6874d1b8e6321644aec1ddc93b744f95c3e1ac6d8a269253b979f2c10eff7461ea40c91782591d1893792c3f885390', 'hex'),
                address: '52.74.57.123',
                udpPort: 30303,
                tcpPort: 30303
            }
        ];

        console.log('🔍 Attempting bootstrap with multiple peers...');
        for (const peer of bootstrapPeers) {
            try {
                console.log(`   Trying: ${peer.address}:${peer.udpPort}`);
                await dpt.bootstrap(peer);
                console.log(`   ✅ Bootstrap successful: ${peer.address}:${peer.udpPort}`);
            } catch (error) {
                console.log(`   ❌ Bootstrap failed: ${peer.address}:${peer.udpPort} - ${(error as Error).message}`);
            }
        }

        console.log('✅ Debug setup complete!');
        console.log('📡 Waiting for peer connections...');
        console.log('💡 If no peers connect, it might be due to:');
        console.log('   - Firewall blocking port 30303');
        console.log('   - Network restrictions');
        console.log('   - Bootstrap peers being offline');

    } catch (error) {
        console.error('❌ Debug setup failed:', error);
    }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down...');
    if (rlpx) {
        rlpx.destroy();
    }
    if (dpt) {
        dpt.destroy();
    }
    process.exit(0);
});

runDebug();
