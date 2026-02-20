# telegram_scraper.py
import asyncio
from telethon import TelegramClient, events

# Replace with your own API ID and hash from my.telegram.org
api_id = 12345
api_hash = 'YOUR_API_HASH'

# Replace with your own phone number
phone_number = '+15555555555'

client = TelegramClient('session_name', api_id, api_hash)

async def main():
    await client.start(phone=phone_number)
    print("Client started")

    # Replace 'koh_samui' with the actual channel/group ID or username
    @client.on(events.NewMessage(chats='koh_samui'))
    async def handler(event):
        print(event.message.text)
        # Implement lead filtering logic here
        # Example: if 'looking for' in event.message.text.lower():
        #     print("Potential lead found!")

    await client.run_until_disconnected()

if __name__ == '__main__':
    asyncio.run(main())
