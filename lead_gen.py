#!/usr/bin/env python3

import telethon
from telethon import TelegramClient, events
import asyncio
import re

# These example values won't work. You must get your own api_id and
# api_hash from my.telegram.org, under API Development.
api_id = 12345  # Replace with your actual API ID
api_hash = 'YOUR_API_HASH'  # Replace with your actual API hash

# Your phone number and session name
phone_number = '+15555555555'  # Replace with your phone number
session_name = 'kosmoi_lead_gen'

# Telegram group to monitor
group_link = 'https://t.me/koh_samui'  # The target group

# Keywords to look for in messages
keywords = ['looking for villa', 'need a driver', 'recommend massage', 'best restaurant']

# Invitation message
invitation_message = "Hi there! We noticed you're looking for services on Koh Samui. Check out Kosmoi.com for seamless booking!"

# Create a Telegram client
client = TelegramClient(session_name, api_id, api_hash)

async def main():
    await client.start(phone=phone_number)
    print("Client started")

    # Get the entity (group) from the link
    try:
        group = await client.get_entity(group_link)
    except ValueError:
        print(f"Could not find group with link: {group_link}")
        return

    # Define the event handler
    @client.on(events.NewMessage(chats=group))
    async def handler(event):
        message = event.message.message.lower()
        sender = await event.get_sender()
        sender_id = sender.id

        for keyword in keywords:
            if keyword in message:
                print(f"Found keyword '{keyword}' in message from {sender.username or sender.first_name}")
                # Send invitation message (with rate limiting)
                try:
                    await client.send_message(sender_id, invitation_message)
                    print(f"Sent invitation to {sender.username or sender.first_name}")
                    await asyncio.sleep(60)  # Rate limit: wait 60 seconds before sending another message
                except Exception as e:
                    print(f"Failed to send message: {e}")

    # Run the client until disconnected
    await client.run_until_disconnected()

if __name__ == '__main__':
    asyncio.run(main())
