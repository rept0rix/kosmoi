#!/bin/bash

# trigger_remote_sync.sh
# Run this on the Sending Computer (Computer A)
# It connects to Computer B via SSH and tells it to pull.

# --- CONFIGURATION ---
# Replace with your Computer B's details
# Find this on Computer B by running: whoami && ifconfig
REMOTE_USER="${REMOTE_USER:-naoryanko}" 
REMOTE_HOST="${REMOTE_HOST:-naors-MacBook-Pro.local}"
PROJECT_DIR="${PROJECT_DIR:-Documents/GitHub/kosmoi}"
# ---------------------

if [ "$1" == "setup" ]; then
    echo "🔧 Helping you find your IP..."
    echo "Run this command on Computer B to find its IP:"
    echo "ipconfig getifaddr en0"
    exit 0
fi

if [[ "$REMOTE_HOST" == *"X"* ]]; then
    echo "⚠️  Configuration Needed!"
    echo "Please edit this file (scripts/sync_utils/remote_trigger.sh) and set the REMOTE_HOST IP address."
    echo "Use 'ipconfig getifaddr en0' on the other computer to find it."
    exit 1
fi

echo "🚀 Triggering remote sync on $REMOTE_HOST..."

ssh "$REMOTE_USER@$REMOTE_HOST" "cd $PROJECT_DIR && echo '⬇️ Pulling on remote...' && git pull"

if [ $? -eq 0 ]; then
    echo "✅ Remote sync triggered successfully!"
else
    echo "❌ Failed to trigger sync. Check SSH connection."
fi
