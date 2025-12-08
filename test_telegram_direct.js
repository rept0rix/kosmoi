
import { SendTelegram } from './src/api/integrations.js';
import dotenv from 'dotenv';
dotenv.config();

async function test() {
    console.log("Testing SendTelegram directly...");
    const result = await SendTelegram({
        message: "🔔 This is a DIRECT test from the Node.js script. If you see this, the code works!",
        chatId: "7224939578"
    });
    console.log("Result:", result);
}

test();
