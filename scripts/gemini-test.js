import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';

async function test() {
    console.log("🚀 Testing Gemini Connection with JSON Schema...");
    const apiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

    if (!apiKey) {
        console.error("❌ API Key Missing!");
        process.exit(1);
    }

    try {
        const client = new GoogleGenAI({ apiKey });

        const jsonSchema = {
            type: "object",
            properties: {
                test: { type: "string" }
            },
            required: ["test"]
        };

        const generateConfig = {
            model: 'gemini-1.5-flash', // Try a known stable model first
            contents: [
                {
                    role: 'user',
                    parts: [{ text: 'Output JSON: {"test": "hello"}' }]
                }
            ],
            // Note: In some versions of this SDK, these are top-level or inside 'config'
            config: {
                responseMimeType: 'application/json',
                responseSchema: jsonSchema
            }
        };

        console.log("📡 Calling generateContent...");
        const response = await client.models.generateContent(generateConfig);
        console.log("✅ Success! Response:", JSON.stringify(response, null, 2));

    } catch (err) {
        console.error("❌ Error Message:", err.message);
        console.error("❌ Error Status:", err.status);
        console.error("❌ Error Details:", JSON.stringify(err, null, 2));
    }
}

test();
