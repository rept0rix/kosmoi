#!/bin/bash
# ============================================================
# Worker2 Setup Script — Mac
# מריץ את הKosmoi worker על מק שני כ-background service
# Usage: curl -s https://raw.githubusercontent.com/rept0rix/kosmoi/main/scripts/setup_worker2_mac.sh | bash
# ============================================================

set -e

REPO_URL="https://github.com/rept0rix/kosmoi.git"
INSTALL_DIR="$HOME/kosmoi-worker2"
PLIST_NAME="com.kosmoi.worker2"
PLIST_PATH="$HOME/Library/LaunchAgents/$PLIST_NAME.plist"

echo ""
echo "🤖 Kosmoi Worker2 Setup"
echo "========================"
echo ""

# ── 1. Clone or update repo ────────────────────────────────
if [ -d "$INSTALL_DIR/.git" ]; then
  echo "📁 Updating existing installation..."
  cd "$INSTALL_DIR" && git pull --quiet
else
  echo "📥 Cloning repo..."
  git clone --quiet "$REPO_URL" "$INSTALL_DIR"
  cd "$INSTALL_DIR"
fi

# ── 2. Install production dependencies ─────────────────────
echo "📦 Installing dependencies..."
cd "$INSTALL_DIR"
npm install --omit=dev --silent 2>&1 | tail -2

# ── 3. Collect credentials ─────────────────────────────────
echo ""
echo "🔑 Enter your credentials (press Enter to skip optional):"
echo ""

read -p "  VITE_SUPABASE_URL         [Required]: " SUPABASE_URL
read -p "  VITE_SUPABASE_SERVICE_KEY  [Required]: " SERVICE_KEY
read -p "  VITE_GEMINI_API_KEY        [Required]: " GEMINI_KEY
read -p "  TELEGRAM_BOT_TOKEN         [Required]: " TG_TOKEN
read -p "  TELEGRAM_CHAT_ID           [Required]: " TG_CHAT
read -p "  GITHUB_TOKEN               [Optional]: " GH_TOKEN
read -p "  WORKER_NAME                [Optional, default=Worker2-Mac]: " WORKER_NAME

WORKER_NAME="${WORKER_NAME:-Worker2-Mac}"

# ── 4. Write .env ───────────────────────────────────────────
echo ""
echo "📝 Writing .env..."
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

# ── 5. Detect node path ─────────────────────────────────────
NODE_PATH=$(which node)
if [ -z "$NODE_PATH" ]; then
  NODE_PATH="/opt/homebrew/bin/node"
  if [ ! -f "$NODE_PATH" ]; then
    NODE_PATH="/usr/local/bin/node"
  fi
fi
echo "🔍 Using node: $NODE_PATH"

# ── 6. Create LaunchAgent ───────────────────────────────────
echo "⚙️  Creating LaunchAgent (auto-start on login)..."
mkdir -p "$HOME/Library/LaunchAgents"
cat > "$PLIST_PATH" << PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>${PLIST_NAME}</string>
    <key>ProgramArguments</key>
    <array>
        <string>${NODE_PATH}</string>
        <string>${INSTALL_DIR}/scripts/agent_worker.js</string>
        <string>--name=${WORKER_NAME}</string>
    </array>
    <key>WorkingDirectory</key>
    <string>${INSTALL_DIR}</string>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>ThrottleInterval</key>
    <integer>10</integer>
    <key>StandardOutPath</key>
    <string>${HOME}/kosmoi-worker2.log</string>
    <key>StandardErrorPath</key>
    <string>${HOME}/kosmoi-worker2-error.log</string>
</dict>
</plist>
PLIST

# ── 7. Start the service ────────────────────────────────────
echo "🚀 Starting ${WORKER_NAME}..."
launchctl unload "$PLIST_PATH" 2>/dev/null || true
launchctl load "$PLIST_PATH"

echo ""
echo "✅ ${WORKER_NAME} is running!"
echo ""
echo "📋 Useful commands:"
echo "  Logs (live):  tail -f ~/kosmoi-worker2.log"
echo "  Stop:         launchctl unload ~/Library/LaunchAgents/${PLIST_NAME}.plist"
echo "  Start:        launchctl load ~/Library/LaunchAgents/${PLIST_NAME}.plist"
echo "  Status:       launchctl list | grep kosmoi"
echo "  Update:       cd ~/kosmoi-worker2 && git pull && npm install --omit=dev"
echo ""
