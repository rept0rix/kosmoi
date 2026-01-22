
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
    console.error("❌ No API Key found.");
    process.exit(1);
}

console.log("🔑 Key loaded:", GEMINI_API_KEY.replace(/.(?=.{4})/g, '*'));

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

async function testModel(modelName) {
    console.log(`\n🧪 Testing model: ${modelName}...`);
    try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent("Hello?");
        const response = await result.response;
        console.log(`✅ Success (${modelName}):`, response.text());
    } catch (e) {
        console.error(`❌ Failed (${modelName}):`, e.message);
    }
}

async function run() {
    await testModel('gemini-2.0-flash');
    await testModel('gemini-1.5-flash');
    await testModel('gemini-pro');
}

run();
