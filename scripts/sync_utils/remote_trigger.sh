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

echo "🚀 Connecting to $REMOTE_HOST..."
echo "💡 Note: You may be prompted for $REMOTE_USER's password if SSH keys are not set up."

ssh -o ConnectTimeout=10 "$REMOTE_USER@$REMOTE_HOST" "cd $PROJECT_DIR && echo '⬇️ Pulling on remote...' && git pull"

if [ $? -eq 0 ]; then
    echo "✅ Remote sync completed successfully!"
else
    echo "❌ Failed to trigger sync. Please check:"
    echo "  1. Is $REMOTE_HOST reachable? (try 'ping $REMOTE_HOST')"
    echo "  2. is 'Remote Login' enabled on the other Mac? (System Settings > General > Sharing)"
    echo "  3. Is the PROJECT_DIR correct? ($PROJECT_DIR)"
fi
