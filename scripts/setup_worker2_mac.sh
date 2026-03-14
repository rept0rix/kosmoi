#!/bin/bash
# ============================================================
# Worker2 Setup — מק שני
# מכניסים רק Supabase URL + service_role key, השאר מגיע אוטומטית
# Usage: curl -s https://raw.githubusercontent.com/rept0rix/kosmoi/main/scripts/setup_worker2_mac.sh | bash
# ============================================================
set -e

REPO_URL="https://github.com/rept0rix/kosmoi.git"
INSTALL_DIR="$HOME/kosmoi-worker2"
PLIST_NAME="com.kosmoi.worker2"
PLIST_PATH="$HOME/Library/LaunchAgents/$PLIST_NAME.plist"

echo "" && echo "🤖 Kosmoi Worker2 Setup" && echo "========================" && echo ""

# ── Clone or update ────────────────────────────────────────
if [ -d "$INSTALL_DIR/.git" ]; then
  echo "📁 Updating existing installation..."
  cd "$INSTALL_DIR" && git pull --quiet
else
  echo "📥 Cloning repo..."
  git clone --quiet "$REPO_URL" "$INSTALL_DIR"
fi
cd "$INSTALL_DIR"

# ── Install deps ────────────────────────────────────────────
echo "📦 Installing dependencies..."
npm install --omit=dev --silent 2>&1 | tail -2

# ── Only 2 inputs needed ────────────────────────────────────
echo "" && echo "🔑 Two inputs only — everything else loads automatically:" && echo ""
read -p "  SUPABASE_URL     (https://xxxxx.supabase.co): " SUPABASE_URL
read -s -p "  SERVICE_ROLE_KEY (eyJhbGci...): " SERVICE_KEY
echo ""
read -p "  WORKER_NAME      [default=Worker2-Mac]: " WORKER_NAME
WORKER_NAME="${WORKER_NAME:-Worker2-Mac}"

# ── Fetch full config from Supabase ────────────────────────
echo "" && echo "⬇️  Fetching config from Supabase..."
CONFIG_RAW=$(curl -sf "$SUPABASE_URL/rest/v1/company_knowledge?key=eq.WORKER_BOOTSTRAP_CONFIG&select=value" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" 2>/dev/null) || {
  echo "❌ Failed to connect to Supabase. Check URL and service_role key."
  exit 1
}

# Parse each key from the config JSON stored in the value field
parse_key() {
  echo "$CONFIG_RAW" | python3 -c "
import sys, json
rows = json.load(sys.stdin)
if not rows: exit(1)
cfg = json.loads(rows[0]['value'])
print(cfg.get('$1',''))
" 2>/dev/null || echo ""
}

GEMINI_KEY=$(parse_key GEMINI_API_KEY)
TG_TOKEN=$(parse_key TELEGRAM_BOT_TOKEN)
TG_CHAT=$(parse_key TELEGRAM_CHAT_ID)
ANON_KEY=$(parse_key VITE_SUPABASE_ANON_KEY)

if [ -z "$GEMINI_KEY" ]; then
  echo "❌ Could not parse config from Supabase. Contact admin."
  exit 1
fi
echo "✅ Config loaded (Gemini, Telegram, Anon key)"

# ── Write .env ──────────────────────────────────────────────
echo "📝 Writing .env..."
cat > "$INSTALL_DIR/.env" << ENVEOF
VITE_SUPABASE_URL=${SUPABASE_URL}
VITE_SUPABASE_SERVICE_ROLE_KEY=${SERVICE_KEY}
VITE_SUPABASE_ANON_KEY=${ANON_KEY}
SUPABASE_SERVICE_ROLE_KEY=${SERVICE_KEY}
GEMINI_API_KEY=${GEMINI_KEY}
VITE_GEMINI_API_KEY=${GEMINI_KEY}
TELEGRAM_BOT_TOKEN=${TG_TOKEN}
TELEGRAM_CHAT_ID=${TG_CHAT}
VITE_TELEGRAM_BOT_TOKEN=${TG_TOKEN}
VITE_TELEGRAM_CHAT_ID=${TG_CHAT}
WORKER_NAME=${WORKER_NAME}
NODE_ENV=production
ENVEOF

# ── Detect node ─────────────────────────────────────────────
NODE_PATH=$(which node 2>/dev/null || echo "/opt/homebrew/bin/node")
[ ! -f "$NODE_PATH" ] && NODE_PATH="/usr/local/bin/node"
echo "🔍 Node: $NODE_PATH"

# ── LaunchAgent ─────────────────────────────────────────────
echo "⚙️  Creating LaunchAgent (auto-start on login)..."
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

# ── Start ────────────────────────────────────────────────────
echo "🚀 Starting ${WORKER_NAME}..."
launchctl unload "$PLIST_PATH" 2>/dev/null || true
launchctl load "$PLIST_PATH"

echo "" && echo "✅ ${WORKER_NAME} רץ!" && echo ""
echo "  Logs:    tail -f ~/kosmoi-worker2.log"
echo "  Stop:    launchctl unload ~/Library/LaunchAgents/${PLIST_NAME}.plist"
echo "  Status:  launchctl list | grep kosmoi"
echo ""
