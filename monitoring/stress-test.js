const logger = require('./custom-logger.js');

console.log('🚀 Starting log stress test...');
console.log('Generating approximately 100MB of logs to test rotation and archiving...');

// Approximately 150 bytes per log line in JSON format (including timestamp)
// 100MB = 104,857,600 bytes
// Estimated lines needed = 104,857,600 / 150 ≈ 699,050 lines
const TARGET_LINES = 700000;
const BATCH_SIZE = 5000;

let count = 0;

const interval = setInterval(() => {
    for (let i = 0; i < BATCH_SIZE; i++) {
        count++;
        // Mix log levels to generate realistic data for Promtail/Loki parsing
        if (count % 100 === 0) {
            logger.error(`Critical simulated breakdown at operation ${count} - database transaction failed`);
        } else if (count % 15 === 0) {
            logger.warn(`High memory usage detected during simulated load spike at event ${count}`);
        } else {
            logger.info(`Simulated API request handled successfully (${count}) in ${Math.floor(Math.random() * 50)}ms`);
        }
    }

    const percentage = Math.floor((count / TARGET_LINES) * 100);
    process.stdout.write(`\r[Logger] Wrote ${count.toLocaleString()} lines (${percentage}%)...`);

    if (count >= TARGET_LINES) {
        clearInterval(interval);
        console.log('\n✅ Stress test finished generating ~100MB of logs!');
        console.log('Files should now be actively rotating in active/ and archive/...');
        
        // Give Winston a moment to finish pending file writes before exiting
        setTimeout(() => {
            process.exit(0);
        }, 1000);
    }
}, 30); // Small delay to let file system and logger streams breathe
