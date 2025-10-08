// Demo version with console output for testing
import { startMempoolMonitoring, stopMempoolMonitoring } from './index';

async function runDemo() {
    console.log('🚀 Starting Ethereum devp2p mempool monitoring demo...');
    console.log('📡 This will attempt to connect to Ethereum peers and listen for transactions');
    console.log('⏰ Running for 30 seconds, then stopping...');

    try {
        await startMempoolMonitoring();
        console.log('✅ Monitoring started successfully!');

        // Run for 30 seconds
        setTimeout(async () => {
            console.log('⏰ 30 seconds elapsed, stopping...');
            await stopMempoolMonitoring();
            console.log('✅ Demo completed!');
            process.exit(0);
        }, 30000);

    } catch (error) {
        console.error('❌ Failed to start monitoring:', error);
        process.exit(1);
    }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Received SIGINT, shutting down gracefully...');
    await stopMempoolMonitoring();
    process.exit(0);
});

runDemo();
