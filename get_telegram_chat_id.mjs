
import https from 'https';

const token = '7144778392:AAH4Mjp8BiwOLZZzZI3ZJfxkgunAh-KbqLw';

function getUpdates() {
    const url = `https://api.telegram.org/bot${token}/getUpdates`;

    https.get(url, (res) => {
        let data = '';

        res.on('data', (chunk) => {
            data += chunk;
        });

        res.on('end', () => {
            try {
                const response = JSON.parse(data);
                if (response.ok) {
                    if (response.result.length === 0) {
                        console.log("📭 No messages found yet. Please send 'Hello' to @Barakacontrollerbot in Telegram.");
                    } else {
                        const lastMessage = response.result[response.result.length - 1];
                        const chatId = lastMessage.message.chat.id;
                        const user = lastMessage.message.from.first_name;
                        console.log(`\n✅ Success! Found message from ${user}.`);
                        console.log(`🆔 Your Chat ID is: ${chatId}`);
                        console.log(`\nCopy this Chat ID, I will need it for the next step.`);
                    }
                } else {
                    console.error("❌ Error from Telegram API:", response.description);
                }
            } catch (e) {
                console.error("❌ Failed to parse response:", e.message);
            }
        });

    }).on('error', (err) => {
        console.error("❌ Network Error:", err.message);
    });
}

console.log("🤖 Checking for Telegram messages...");
getUpdates();
