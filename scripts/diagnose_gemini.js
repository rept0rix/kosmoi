import 'dotenv/config';
import https from 'https';

const apiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
console.log("API Key loaded:", apiKey ? "Yes (starts with " + apiKey.substring(0, 4) + ")" : "No");

if (!apiKey) {
    console.error("❌ No API key found in env");
    process.exit(1);
}

const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

https.get(url, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            if (json.models) {
                console.log("✅ Available models:");
                json.models.forEach(m => console.log(` - ${m.name}`));
            } else {
                console.log("❌ Error response:", JSON.stringify(json, null, 2));
            }
        } catch (e) {
            console.error("❌ Error parsing response:", data);
        }
    });
}).on('error', e => console.error("❌ Request error:", e));
