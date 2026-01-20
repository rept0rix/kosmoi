
import dotenv from 'dotenv';
dotenv.config();
import { GoogleGenerativeAI } from '@google/generative-ai';

const geminiKey = process.env.VITE_GEMINI_API_KEY;

if (!geminiKey) {
    console.error("❌ Missing VITE_GEMINI_API_KEY");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(geminiKey);

async function listModels() {
    console.log("🔍 Fetching available Gemini models...");
    // The SDK doesn't expose listModels directly on the main class in some versions, 
    // but let's try via the model manager if available or just raw fetch.
    // Actually, simpler is to use fetch directly to be sure.

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${geminiKey}`);
        const data = await response.json();

        if (data.models) {
            console.log("✅ Available Models:");
            data.models.forEach(m => {
                if (m.supportedGenerationMethods.includes("generateContent")) {
                    console.log(`- ${m.name} (${m.displayName})`);
                }
            });
        } else {
            console.log("❌ No models found or error:", data);
        }
    } catch (err) {
        console.error("Fetch Error:", err);
    }
}

listModels();
