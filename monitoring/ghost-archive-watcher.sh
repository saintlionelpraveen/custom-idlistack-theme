#!/usr/bin/env bash
# ============================================================
# Ghost Active Log Watcher
# Polling approach: Check active directory for rotated logs
# Pipeline: Identify older logs → gzip → rclone → Google Drive → Delete original
# ============================================================

set -euo pipefail

# --- Configuration ---
ACTIVE_DIR="/home/praveen/ghost/log_rotating/active"
WATCHER_LOG="/home/praveen/ghost/log_rotating/watcher.log"
RCLONE_REMOTE="gdrive"
RCLONE_DEST="${RCLONE_REMOTE}:ghost-logs/archive"
KEEP_FILES=3

log() {
    local level="$1"
    shift
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [${level}] $*" >> "${WATCHER_LOG}"
}

mkdir -p "${ACTIVE_DIR}"
touch "${WATCHER_LOG}"

process_active_logs() {
    # Find all .log files, sorted by oldest first directly using bash loop
    declare -a log_files
    while IFS= read -r -d '' file; do
        if [[ -f "${file}" ]]; then
            log_files+=("${file}")
        fi
    done < <(find "${ACTIVE_DIR}" -maxdepth 1 -name 'ghost-*' -type f -printf '%T@ %p\0' | sort -z -n | sed -z 's/^[^ ]* //')

    local num_files=${#log_files[@]}

    if (( num_files > KEEP_FILES )); then
        local excess_count=$(( num_files - KEEP_FILES ))
        
        for (( i=0; i<excess_count; i++ )); do
            local file="${log_files[$i]}"
            local filename="$(basename "${file}")"
            log "INFO" "Processing rotated log: ${filename} (Total files: ${num_files}, Keeping: ${KEEP_FILES})"
            
            # Step 1: Compress to a temporary file
            local gz_file="/tmp/${filename}.gz"
            log "INFO" "Compressing ${filename} → ${gz_file}"
            if ! gzip -c "${file}" > "${gz_file}"; then
                log "ERROR" "Compression failed for ${filename}"
                continue
            fi
            
            # Step 2: Upload to Google Drive via rclone
            log "INFO" "Uploading ${filename}.gz → ${RCLONE_DEST}/"
            if rclone copy "${gz_file}" "${RCLONE_DEST}/" \
                --log-file="${WATCHER_LOG}" \
                --log-level=INFO \
                --retries 3 \
                --retries-sleep 5s \
                --timeout 60s; then
                
                # Step 3: Local Delete ON SUCCESS ONLY
                log "SUCCESS" "Upload complete: ${filename}.gz → Google Drive"
                rm -f "${file}"     # ONLY execute this after successful rclone
                rm -f "${gz_file}"
                log "INFO" "Cleaned up local active file: ${filename}"
            else
                log "ERROR" "Upload FAILED for ${filename}.gz — will retry next cycle"
                rm -f "${gz_file}"  # Clean up temp file, original file stays in ACTIVE_DIR
                # It will remain in active directory and trigger again next loop
            fi
        done
    fi
}

main() {
    log "INFO" "=========================================="
    log "INFO" "Ghost Active Log Watcher STARTED"
    log "INFO" "Watching: ${ACTIVE_DIR} (Keeping youngest ${KEEP_FILES} files)"
    log "INFO" "Destination: ${RCLONE_DEST}"
    log "INFO" "=========================================="

    # Continuous polling loop, every 10 seconds checking the active directory
    while true; do
        process_active_logs
        sleep 10
    done
}

main "$@"
