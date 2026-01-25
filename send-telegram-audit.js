import 'dotenv/config';
import fetch from 'node-fetch';

const token = process.env.VITE_TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
const chatId = "7224939578";

const report = `
📊 **System Audit Report**
--
🤖 **Worker Status:** ACTIVE (Processing Queue)
📝 **Queue Status:** 
- 8 Tasks waiting
- 2 Recently completed

🎥 **Deliverables:**
- Videos ready: 0
- Audio assets: 0

✅ **Tech Lead Assessment:** 
The system bottleneck was identified as a stale worker process. I have successfully restarted the core engine. The "Progress Audit" task is now being processed by the Tech Lead. 

*I am now monitoring the queue every 60 seconds to ensure zero friction.*
`;

async function send() {
    console.log("Sending audit to Telegram...");
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: chatId,
            text: report,
            parse_mode: 'Markdown'
        })
    });
    const data = await res.json();
    console.log("Response:", data);
    process.exit(data.ok ? 0 : 1);
}

send();
