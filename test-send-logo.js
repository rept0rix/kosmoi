import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import FormData from 'form-data';

const token = process.env.VITE_TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
const chatId = "7224939578"; // Using the known hardcoded ID from the app

async function sendLogo() {
    const logoPath = path.resolve('public/kosmoi-logo.png');

    if (!fs.existsSync(logoPath)) {
        console.error("Logo file not found at:", logoPath);
        process.exit(1);
    }

    console.log(`Sending logo from ${logoPath} to ${chatId}...`);

    try {
        const formData = new FormData();
        formData.append('chat_id', chatId);
        formData.append('caption', "הנה הלוגו שביקשת! 🎨");
        formData.append('photo', fs.createReadStream(logoPath));

        const response = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
            method: 'POST',
            body: formData,
            headers: formData.getHeaders()
        });

        const data = await response.json();
        console.log("Response:", data);
        process.exit(data.ok ? 0 : 1);
    } catch (e) {
        console.error("Failed to send logo:", e);
        process.exit(1);
    }
}

sendLogo();
