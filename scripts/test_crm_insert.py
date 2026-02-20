
import os
import json
import urllib.request
import urllib.parse

# Load .env manually
if os.path.exists('.env'):
    with open('.env', 'r') as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#') or '=' not in line:
                continue
            key, value = line.split('=', 1)
            value = value.strip('"').strip("'")
            os.environ[key] = value

SUPABASE_URL = os.getenv('VITE_SUPABASE_URL')
SUPABASE_KEY = os.getenv('VITE_SUPABASE_SERVICE_ROLE_KEY') or os.getenv('VITE_SUPABASE_ANON_KEY')

def get_headers():
    return {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal" # Don't return the whole object, just 201 Created
    }

def test_insert():
    print(f"🔧 Testing CRM Insert to: {SUPABASE_URL}")
    
    email = "test_lead_scout_777@kosmoi.com"
    
    # 1. Check existence
    safe_email = urllib.parse.quote(email)
    check_url = f"{SUPABASE_URL}/rest/v1/crm_leads?email=eq.{safe_email}&select=id"
    
    try:
        req = urllib.request.Request(check_url, headers=get_headers())
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode())
            if len(data) > 0:
                print("ℹ️ Test lead already exists. Deleting first (if I could)...")
                # For test, just proceed or maybe use a random email
    except Exception as e:
        print(f"❌ Check failed: {e}")

    # 2. Insert
    url = f"{SUPABASE_URL}/rest/v1/crm_leads"
    payload = {
        "first_name": "Test Scout Bot",
        "email": email,
        "business_type": "Test Lead",
        "status": "new",
        "notes": json.dumps({"source": "script_test", "text": "This is a test insertion."})
    }
    
    try:
        req = urllib.request.Request(url, data=json.dumps(payload).encode(), headers=get_headers())
        with urllib.request.urlopen(req) as response:
            print(f"✅ Insertion Successful! Status Code: {response.getcode()}")
    except Exception as e:
        print(f"❌ Insert Failed: {e}")
        try: print(e.read())
        except: pass

if __name__ == "__main__":
    test_insert()
