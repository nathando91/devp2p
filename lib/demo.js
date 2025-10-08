"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Demo version with console output for testing
const index_1 = require("./index");
async function runDemo() {
    console.log('🚀 Starting Ethereum devp2p mempool monitoring demo...');
    console.log('📡 This will attempt to connect to Ethereum peers and listen for transactions');
    console.log('⏰ Running for 30 seconds, then stopping...');
    try {
        await (0, index_1.startMempoolMonitoring)();
        console.log('✅ Monitoring started successfully!');
        // Run for 30 seconds
        setTimeout(async () => {
            console.log('⏰ 30 seconds elapsed, stopping...');
            await (0, index_1.stopMempoolMonitoring)();
            console.log('✅ Demo completed!');
            process.exit(0);
        }, 30000);
    }
    catch (error) {
        console.error('❌ Failed to start monitoring:', error);
        process.exit(1);
    }
}
// Handle graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Received SIGINT, shutting down gracefully...');
    await (0, index_1.stopMempoolMonitoring)();
    process.exit(0);
});
runDemo();
