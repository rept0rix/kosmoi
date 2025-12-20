
import dotenv from 'dotenv';
import { callGroqInteraction } from '../src/api/groqInteractions.js';

dotenv.config();

async function testGroq() {
    console.log("Testing Groq Integration...");
    console.log("Key available:", !!process.env.VITE_GROQ_API_KEY);

    try {
        const response = await callGroqInteraction({
            model: 'llama-3.3-70b-versatile',
            prompt: 'Say "Hello from Groq!" and tell me a quick joke about databases.',
            system_instruction: 'You are a stand-up comedian.'
        });

        console.log("\nSuccess! Response:");
        console.log(JSON.stringify(response, null, 2));

    } catch (error) {
        console.error("Test Failed:", error);
    }
}

testGroq();
