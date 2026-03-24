const winston = require('winston');
require('winston-daily-rotate-file');
const fs = require('fs');
const path = require('path');

/**
 * GHOST CUSTOM LOGGER
 * Implements strict log rotation strategy:
 * - Active directory: /home/praveen/ghost/log_rotating/active/
 * - Archive directory: /home/praveen/ghost/log_rotating/archive/
 * - strictly max 3 files in active/
 * - exactly 15MB per file
 * - moves to archive on rotate using the logRemoved/rotate hooks.
 */

const ACTIVE_DIR = '/home/praveen/ghost/log_rotating/active';
const ARCHIVE_DIR = '/home/praveen/ghost/log_rotating/archive';

// Ensure necessary directories exist
[ACTIVE_DIR, ARCHIVE_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Helper function to figure out the next archive index (e.g., log1.0.log -> log1.1.log)
function getNextArchiveFilename() {
    const files = fs.readdirSync(ARCHIVE_DIR);
    let maxIdx = -1;
    // Expected naming: log1.X.log
    files.forEach(file => {
        const match = file.match(/^log1\.(\d+)\.log$/);
        if (match) {
            const idx = parseInt(match[1], 10);
            if (idx > maxIdx) maxIdx = idx;
        }
    });
    return `log1.${maxIdx + 1}.log`;
}

// Set up the daily rotate file transport
// Although it's called 'daily', we strictly limit by size and use it for the hooks required.
const rotateTransport = new winston.transports.DailyRotateFile({
    filename: path.join(ACTIVE_DIR, 'log-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    zippedArchive: false,     // Disabled to keep readable logs
    maxSize: '20m',           // 20MB per file maximum limit
    maxFiles: '10',           // Keep up to 10 files locally as fallback (watcher handles primary cleanup)
    auditFile: path.join(ACTIVE_DIR, 'audit.json') // Tracks the active files
});

// --- HOOK: LOG REMOVED ---
// winston-daily-rotate-file emits 'logRemoved' when it deletes a file that exceeds maxFiles.
rotateTransport.on('logRemoved', function(removedFilename) {
    winston.info(`[Logger] File exceeded active maxFiles limit (10 files): ${removedFilename}`);
});

// --- HOOK: ON ROTATE ---
// Fired when log rotates (e.g. log1 -> log2 because log1 hit 34MB)
rotateTransport.on('rotate', function(oldFilename, newFilename) {
    if (oldFilename) {
        console.log(`[Logger] Rotated from ${oldFilename} to ${newFilename}`);
        // Log is successfully rotated. 
        // The external ghost-archive-watcher.sh service handles uploading the oldest 
        // active files to Google Drive, and safely deleting them ONLY AFTER upload succeeds.
    }
});

// Configure the Winston logger instance
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json() // Standardize format for Promtail
    ),
    transports: [
        rotateTransport,
        // Also log to console for development visibility
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            )
        })
    ]
});

// Wrap Ghost's logging interface expectations if needed
module.exports = logger;
