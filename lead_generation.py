
import os
import asyncio
import json
import time
import urllib.request
import urllib.parse
from telethon import TelegramClient

# --- ENV LOADER ---
# Rudimentary .env parser because we can't guarantee python-dotenv is installed
if os.path.exists('.env'):
    with open('.env', 'r') as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#') or '=' not in line:
                continue
            key, value = line.split('=', 1)
            # Remove quotes if present
            value = value.strip('"').strip("'")
            os.environ[key] = value

# --- CONFIGURATION ---
SESSION_FILE = "session_name.session"
TARGET_GROUP = "Koh Samui Luxury Rentals" 
SEARCH_KEYWORDS = ["villa", "rent", "buy", "investment", "land"]

# Credentials
API_ID = os.getenv('TELEGRAM_API_ID')
API_HASH = os.getenv('TELEGRAM_API_HASH')

# Supabase Config (for Live Feed & CRM)
SUPABASE_URL = os.getenv('VITE_SUPABASE_URL')
SUPABASE_KEY = os.getenv('VITE_SUPABASE_SERVICE_ROLE_KEY') or os.getenv('VITE_SUPABASE_ANON_KEY')

# --- HELPERS ---
def get_headers():
    if not SUPABASE_KEY: return {}
    return {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
    }

def log_agent_activity(message, level="info", metadata=None):
    if not SUPABASE_URL: return

    url = f"{SUPABASE_URL}/rest/v1/agent_logs"
    payload = {
        "agent_id": "lead-scout",
        "level": level,
        "message": message,
        "metadata": metadata or {}
    }

    try:
        req = urllib.request.Request(url, data=json.dumps(payload).encode(), headers=get_headers())
        with urllib.request.urlopen(req) as response:
            pass 
    except Exception as e:
        print(f"⚠️ Failed to log to Supabase: {e}")

def check_lead_exists(email):
    if not SUPABASE_URL: return False
    
    # URL Encode
    safe_email = urllib.parse.quote(email)
    url = f"{SUPABASE_URL}/rest/v1/crm_leads?email=eq.{safe_email}&select=id"
    
    try:
        req = urllib.request.Request(url, headers=get_headers())
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode())
            return len(data) > 0
    except Exception as e:
        print(f"⚠️ Failed to check lead existence: {e}")
        return False

def save_lead_to_crm(lead_data):
    if not SUPABASE_URL: return

    url = f"{SUPABASE_URL}/rest/v1/crm_leads"
    
    # Construct CRM payload
    # Using a deterministic email based on Telegram ID to avoid duplicates
    email = f"telegram_{lead_data['sender_id']}@scout.kosmoi.com"
    
    if check_lead_exists(email):
        print(f"   -> Lead already exists in CRM ({email}). Skipping.")
        return

    payload = {
        "first_name": f"Check Telegram: {lead_data['sender_id']}",
        "email": email,
        "business_type": "Telegram Scout Lead",
        "status": "new",
        "notes": json.dumps({
            "source": lead_data['source'],
            "keyword": lead_data['keyword'],
            "original_text": lead_data['text'],
            "scouted_at": lead_data['date']
        })
    }

    try:
        req = urllib.request.Request(url, data=json.dumps(payload).encode(), headers=get_headers())
        with urllib.request.urlopen(req) as response:
            print("   -> ✅ Lead saved to CRM!")
            log_agent_activity(f"New Lead Captured: {email}", "success", payload)
    except Exception as e:
        print(f"⚠️ Failed to save lead to CRM: {e}")
        try: 
            print(e.read()) # Debug response body if possible
        except: pass

async def main():
    api_id = API_ID
    api_hash = API_HASH

    if not api_id or not api_hash:
        print("⚠️  Env vars TELEGRAM_API_ID / TELEGRAM_API_HASH not set.")
        try:
            api_id = input('Enter Telegram API ID: ')
            api_hash = input('Enter Telegram API Hash: ')
        except:
            exit(1)

    if not os.path.exists(SESSION_FILE):
        print(f"❌ Session file '{SESSION_FILE}' not found. Please run 'python3 scripts/login.py' first.")
        return

    try:
        try: api_id = int(api_id)
        except: pass
            
        async with TelegramClient(SESSION_FILE, api_id, api_hash) as client:
            username = (await client.get_me()).username
            print(f"✅ Connected as: {username}")
            log_agent_activity(f"Lead Scout online. Authenticated as {username}.", "system")
            
            print(f"🔍 [Active Mode] Scanning for leads...")
            
            leads_found = 0
            
            # Scan iter_dialogs
            async for dialog in client.iter_dialogs(limit=15):
                if dialog.name and ("Samui" in dialog.name or "Thailand" in dialog.name or "Real Estate" in dialog.name):
                    print(f"   -> Scanning Chat: {dialog.name}")
                    
                    async for msg in client.iter_messages(dialog, limit=30):
                        if msg.text:
                            for keyword in SEARCH_KEYWORDS:
                                if keyword in msg.text.lower():
                                    lead = {
                                        "source": dialog.name,
                                        "sender_id": msg.sender_id or 000,
                                        "text": msg.text[:200], 
                                        "date": str(msg.date),
                                        "keyword": keyword
                                    }
                                    print(f"      Found Lead: {keyword} in {dialog.name}")
                                    save_lead_to_crm(lead)
                                    leads_found += 1
                                    break 

            print(f"✅ Discovery Complete. Processed {leads_found} leads.")
            log_agent_activity(f"Scan complete. Processed {leads_found} leads.", "system")
            
    except Exception as e:
        print(f"❌ Fatal Error: {e}")

if __name__ == "__main__":
    asyncio.run(main())
