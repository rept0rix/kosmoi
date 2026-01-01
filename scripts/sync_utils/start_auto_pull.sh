#!/bin/bash

# start_auto_pull.sh
# Run this on the Receiving Computer (Computer B)
# It will check for updates every 5 minutes.

INTERVAL=300 # 5 Minutes

echo "🔄 Starting Auto-Sync Receiver..."
echo "📂 Watching: $(pwd)"
echo "⏱️  Interval: ${INTERVAL}s"

while true; do
    echo "[$(date '+%H:%M:%S')] Checking for updates..."
    
    # Fetch headers first to avoid unnecessary pulls
    git fetch origin main > /dev/null 2>&1
    
    LOCAL=$(git rev-parse @)
    REMOTE=$(git rev-parse @{u})

    if [ $LOCAL = $REMOTE ]; then
        echo "✅ Up to date."
    else
        echo "⬇️  New updates found! Pulling..."
        git pull --rebase
        if [ $? -eq 0 ]; then
            echo "✅ Successfully updated to latest version."
            # Optional: Play a sound or show notification
            # osascript -e 'display notification "Project Updated" with title "Kosmoi Sync"'
        else
            echo "❌ Error pulling updates. Check git status."
        fi
    fi

    sleep $INTERVAL
done
