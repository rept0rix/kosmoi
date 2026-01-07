#!/bin/bash

# Configuration
REMOTE_USER="rept0rix"
REMOTE_HOST="Kar1s-MacBook-Pro.local"
# Fallback IP if mDNS fails (User provided)
REMOTE_IP="192.168.1.15"
REMOTE_PORT="7681"

echo "🔌 Connecting to Remote Machine ($REMOTE_USER@$REMOTE_HOST)..."

# 1. Check if the host is reachable
TARGET=$REMOTE_HOST
if ! ping -c 1 -W 2 $REMOTE_HOST &> /dev/null; then
    echo "⚠️  Cannot reach $REMOTE_HOST. Trying IP $REMOTE_IP..."
    if ! ping -c 1 -W 2 $REMOTE_IP &> /dev/null; then
        echo "❌ Error: Cannot reach $REMOTE_HOST or $REMOTE_IP. Check network."
        exit 1
    fi
    TARGET=$REMOTE_IP
fi

# 2. Start ttyd remotely
echo "🚀 Starting Web Terminal on $TARGET:$REMOTE_PORT..."

ssh $REMOTE_USER@$TARGET << EOF
    if pgrep ttyd > /dev/null; then
        echo "✅ Web Terminal is ALREADY running."
    else
        # Start ttyd in background mode
        # Check if ttyd is installed first
        if ! command -v ttyd &> /dev/null; then
             echo "⚠️ ttyd not found! Installing via Homebrew..."
             if command -v brew &> /dev/null; then
                 brew install ttyd
             else
                 echo "❌ Error: Homebrew not found. Cannot install ttyd."
                 exit 1
             fi
        fi

        nohup ttyd -p $REMOTE_PORT bash > ttyd.log 2>&1 &
        echo "✅ Web Terminal started successfully."
    fi
EOF

echo ""
echo "🎉 Success! You can view the remote terminal here:"
echo "👉 http://$TARGET:$REMOTE_PORT"
