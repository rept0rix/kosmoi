import { TelegramClient } from 'telethon';
import { StringSession } from 'telethon/sessions';
import input from 'input'; // npm install input? No this is python.

# Python script
import os
import sys
from telethon.sync import TelegramClient
from telethon.sessions import StringSession

# --- CONFIG ---
# PLEASE ENTER YOUR API CREDENTIALS FROM https://my.telegram.org/apps
API_ID = os.getenv('TELEGRAM_API_ID') or input('Enter Telegram API ID: ')
API_HASH = os.getenv('TELEGRAM_API_HASH') or input('Enter Telegram API Hash: ')
PHONE = os.getenv('TELEGRAM_PHONE') or input('Enter Phone Number (e.g. +11234567890): ')

SESSION_FILE = 'session_name.session'

def main():
    print(f"🚀 Initializing Telegram Client...")
    
    with TelegramClient(SESSION_FILE, API_ID, API_HASH) as client:
        print("✅ Client Created")
        
        if not client.is_user_authorized():
            print("🔑 Authorizing...")
            client.send_code_request(PHONE)
            code = input('Enter the code you received: ')
            try:
                client.sign_in(PHONE, code)
            except Exception as e:
                print(f"❌ Login Failed: {e}")
                if '2FA' in str(e) or 'password' in str(e).lower():
                     pw = input('Enter 2FA Password: ')
                     client.sign_in(password=pw)
        
        me = client.get_me()
        print(f"✅ Logged in as: {me.username or me.first_name} (ID: {me.id})")
        print(f"💾 Session saved to: {SESSION_FILE}")

if __name__ == '__main__':
    try:
        main()
    except Exception as e:
        print(f"\n❌ Error: {e}")
        print("\nTo fix: Check API credentials or internet connection.")
