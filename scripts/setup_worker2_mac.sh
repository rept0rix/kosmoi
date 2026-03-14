#!/bin/bash
# ============================================================
# Worker2 Setup Script — Mac
# Usage: curl -s https://raw.githubusercontent.com/rept0rix/kosmoi/main/scripts/setup_worker2_mac.sh | bash
# ============================================================
set -e

REPO_URL="https://github.com/rept0rix/kosmoi.git"
INSTALL_DIR="$HOME/kosmoi-worker2"
PLIST_NAME="com.kosmoi.worker2"
PLIST_PATH="$HOME/Library/LaunchAgents/$PLIST_NAME.plist"

echo "" && echo "🤖 Kosmoi Worker2 Setup" && echo "========================" && echo ""

if [ -d "$INSTALL_DIR/.git" ]; then
  echo "📁 Updating existing installation..."
  cd "$INSTALL_DIR" && git pull --quiet
else
  echo "📥 Cloning repo..."
  git clone --quiet "$REPO_URL" "$INSTALL_DIR"
  cd "$INSTALL_DIR"
fi

echo "📦 Installing dependencies..."
cd "$INSTALL_DIR"
npm install --omit=dev --silent 2>&1 | tail -2

echo "" && echo "🔑 Enter your credentials:" && echo ""
read -p "  VITE_SUPABASE_URL         [Required]: " SUPABASE_URL
read -p "  VITE_SUPABASE_SERVICE_KEY  [Required]: " SERVICE_KEY
read -p "  VITE_GEMINI_API_KEY        [Required]: " GEMINI_KEY
read -p "  TELEGRAM_BOT_TOKEN         [Required]: " TG_TOKEN
read -p "  TELEGRAM_CHAT_ID           [Required]: " TG_CHAT
read -p "  GITHUB_TOKEN               [Optional]: " GH_TOKEN
read -p "  WORKER_NAME                [Optional, default=Worker2-Mac]: " WORKER_NAME
WORKER_NAME="${WORKER_NAME:-Worker2-Mac}"

echo "" && echo "📝 Writing .env..."
cat > "$INSTALL_DIR/.env" << ENVEOF
VITE_SUPABASE_URL=${SUPABASE_URL}
VITE_SUPABASE_SERVICE_ROLE_KEY=${SERVICE_KEY}
VITE_SUPABASE_ANON_KEY=${SERVICE_KEY}
VITE_GEMINI_API_KEY=${GEMINI_KEY}
GEMINI_API_KEY=${GEMINI_KEY}
TELEGRAM_BOT_TOKEN=${TG_TOKEN}
TELEGRAM_CHAT_ID=${TG_CHAT}
VITE_TELEGRAM_BOT_TOKEN=${TG_TOKEN}
VITE_TELEGRAM_CHAT_ID=${TG_CHAT}
GITHUB_TOKEN=${GH_TOKEN}
WORKER_NAME=${WORKER_NAME}
NODE_ENV=production
ENVEOF

NODE_PATH=$(which node 2>/dev/null || echo "/opt/homebrew/bin/node")
[ ! -f "$NODE_PATH" ] && NODE_PATH="/usr/local/bin/node"
echo "🔍 Using node: $NODE_PATH"

echo "⚙️  Creating LaunchAgent..."
mkdir -p "$HOME/Library/LaunchAgents"
cat > "$PLIST_PATH" << PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
    <key>Label</key><string>${PLIST_NAME}</string>
    <key>ProgramArguments</key><array>
        <string>${NODE_PATH}</string>
        <string>${INSTALL_DIR}/scripts/agent_worker.js</string>
        <string>--name=${WORKER_NAME}</string>
    </array>
    <key>WorkingDirectory</key><string>${INSTALL_DIR}</string>
    <key>RunAtLoad</key><true/>
    <key>KeepAlive</key><true/>
    <key>ThrottleInterval</key><integer>10</integer>
    <key>StandardOutPath</key><string>${HOME}/kosmoi-worker2.log</string>
    <key>StandardErrorPath</key><string>${HOME}/kosmoi-worker2-error.log</string>
</dict></plist>
PLIST

echo "🚀 Starting ${WORKER_NAME}..."
launchctl unload "$PLIST_PATH" 2>/dev/null || true
launchctl load "$PLIST_PATH"

echo "" && echo "✅ ${WORKER_NAME} is running!" && echo ""
echo "  Logs:    tail -f ~/kosmoi-worker2.log"
echo "  Stop:    launchctl unload ~/Library/LaunchAgents/${PLIST_NAME}.plist"
echo "  Status:  launchctl list | grep kosmoi"
echo ""
