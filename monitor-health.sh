#!/bin/bash

# Health monitoring script for Bahnar TTS Application

HEALTH_URL="http://localhost/health"
LOG_FILE="/var/log/bahnar-tts-health.log"
MAX_FAILURES=3
FAILURE_COUNT=0

log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
    echo "$1"
}

check_health() {
    if curl -f -s "$HEALTH_URL" > /dev/null; then
        return 0
    else
        return 1
    fi
}

restart_service() {
    log_message "🔄 Restarting Bahnar TTS service due to health check failures..."
    docker-compose -f docker-compose.yml -f docker-compose.prod.yml restart bahnar-tts-app
    sleep 30
}

# Main monitoring loop
while true; do
    if check_health; then
        if [ $FAILURE_COUNT -gt 0 ]; then
            log_message "✅ Service recovered after $FAILURE_COUNT failures"
        fi
        FAILURE_COUNT=0
    else
        FAILURE_COUNT=$((FAILURE_COUNT + 1))
        log_message "❌ Health check failed (attempt $FAILURE_COUNT/$MAX_FAILURES)"
        
        if [ $FAILURE_COUNT -ge $MAX_FAILURES ]; then
            restart_service
            FAILURE_COUNT=0
        fi
    fi
    
    sleep 60  # Check every minute
done
