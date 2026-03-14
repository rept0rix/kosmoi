#!/bin/bash
# ============================================================
# Worker2 Setup Script — Mac
# מריץ את הKosmoi worker על מק שני כ-background service
# ============================================================

set -e

REPO_URL="https://github.com/rept0rix/kosmoi.git"
INSTALL_DIR="$HOME/kosmoi-worker2"
WORKER_NAME="Worker2-Mac"
PLIST_NAME="com.kosmoi.worker2"
PLIST_PATH="$HOME/Library/LaunchAgents/$PLIST_NAME.plist"

echo "🤖 Kosmoi Worker2 Setup"
echo "========================"

# 1. Clone repo
if [ -d "$INSTALL_DIR" ]; then
  echo "📁 Directory exists — pulling latest..."
  cd "$INSTALL_DIR" && git pull
else
  echo "📥 Cloning repo..."
  git clone "$REPO_URL" "$INSTALL_DIR"
  cd "$INSTALL_DIR"
fi

# 2. Install Node deps
echo "📦 Installing dependencies..."
npm install --omit=dev 2>&1 | tail -3

# 3. Create .env
echo "📝 Writing .env..."
cat > "$INSTALL_DIR/.env" << 'ENVEOF'
VITE_SUPABASE_URL=https://gzjzeywhqbwppfxqkptf.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_dP_8q9Q25Dg5qQXxIhDS0A_IPKNOOvO
VITE_SUPABASE_SERVICE_ROLE_KEY=sb_secret_qSrW9aYZy5L0ySIlpnleHg_b_8OX1Cy
GEMINI_API_KEY=AIzaSyDS3lAT6NZlNHCvJi8GJ2PSoNcU7KU9rOQ
VITE_GEMINI_API_KEY=AIzaSyDS3lAT6NZlNHCvJi8GJ2PSoNcU7KU9rOQ
TELEGRAM_BOT_TOKEN=8680199102:AAHvICv9yP7CQfofaFJ87IeI7ElLob_54rA
TELEGRAM_CHAT_ID=264614073
NODE_ENV=production
WORKER_NAME=Worker2-Mac
ENVEOF

# 4. Create LaunchAgent plist (מריץ אוטומטית עם login + מנסה שוב אם קרסה)
echo "⚙️  Creating LaunchAgent (auto-start on login)..."
cat > "$PLIST_PATH" << PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>$PLIST_NAME</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/node</string>
        <string>$INSTALL_DIR/scripts/agent_worker.js</string>
        <string>--name=Worker2-Mac</string>
    </array>
    <key>WorkingDirectory</key>
    <string>$INSTALL_DIR</string>
    <key>EnvironmentVariables</key>
    <dict>
        <key>HOME</key>
        <string>$HOME</string>
        <key>PATH</key>
        <string>/usr/local/bin:/usr/bin:/bin</string>
    </dict>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>ThrottleInterval</key>
    <integer>10</integer>
    <key>StandardOutPath</key>
    <string>$HOME/kosmoi-worker2.log</string>
    <key>StandardErrorPath</key>
    <string>$HOME/kosmoi-worker2.error.log</string>
</dict>
</plist>
PLIST

# 5. Load the service
echo "🚀 Starting Worker2..."
launchctl unload "$PLIST_PATH" 2>/dev/null || true
launchctl load "$PLIST_PATH"

echo ""
echo "✅ Worker2 is running!"
echo ""
echo "📋 Commands:"
echo "  View logs:    tail -f ~/kosmoi-worker2.log"
echo "  Stop worker:  launchctl unload ~/Library/LaunchAgents/$PLIST_NAME.plist"
echo "  Start worker: launchctl load ~/Library/LaunchAgents/$PLIST_NAME.plist"
echo "  Status:       launchctl list | grep kosmoi"
