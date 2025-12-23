import 'dotenv/config'; // Load .env file
import { mimoService } from '../src/services/ai/MimoService.js';

async function testMimo() {
    console.log("🍌 Testing Mimo Service...");
    try {
        const response = await mimoService.generateText(
            "What is the capital of Thailand?",
            "You are a helpful travel assistant."
        );
        console.log("✅ Response received:");
        console.log(response);
    } catch (error) {
        console.error("❌ Test Failed:", error.message);
    }
}

testMimo();
