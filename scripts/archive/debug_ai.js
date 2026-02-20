
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
    console.error("❌ No API Key found.");
    process.exit(1);
}

console.log("🔑 Testing Key:", GEMINI_API_KEY.substring(0, 10) + "...");

async function testGemini() {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

    console.log("📡 Sending request to:", url);

    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: "Hello, are you working?" }] }]
            })
        });

        const data = await res.json();
        console.log("📩 Response Status:", res.status);
        console.log("📦 Full Response:", JSON.stringify(data, null, 2));

    } catch (e) {
        console.error("❌ Network Error:", e);
    }
}

testGemini();
