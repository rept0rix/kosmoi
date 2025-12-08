
import { AgentService } from './src/services/agents/AgentService.js';
import { agents } from './src/services/agents/AgentRegistry.js';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

// Setup DB for AgentService
// We need to mock the 'db' import in AgentService if we run this in Node.
// But AgentService imports 'db' from '../../api/supabaseClient.js'.
// That file now exports 'realSupabase' and 'db' (helpers).
// It relies on fetch.

// Let's just run it. The AgentService should work if env vars are set.

console.log("DEBUG: Checking Env Vars...");
console.log("VITE_GEMINI_API_KEY:", process.env.VITE_GEMINI_API_KEY ? "Present" : "Missing");
console.log("GEMINI_API_KEY:", process.env.GEMINI_API_KEY ? "Present" : "Missing");

async function startChallenge() {
    console.log("🚀 Starting One Dollar Challenge...");

    const ceoConfig = agents.find(a => a.role === 'ceo');
    if (!ceoConfig) {
        console.error("CEO Agent not found!");
        return;
    }
    // Force stable model
    ceoConfig.model = 'gemini-1.5-pro';

    const service = new AgentService(ceoConfig, { userId: userId });
    await service.init();

    const prompt = `
    We are starting the "One Dollar Challenge".
    Your goal is to generate $1 in revenue autonomously.
    
    1. Invent a simple digital product (e.g., "Top 10 AI Prompts" or "CEO Checklist").
    2. Create a Stripe Payment Link for it ($1).
    3. Write a short, punchy sales email to me (naor@example.com) with the link.
    4. Send the email.

    Execute this plan now. Remember to use the PLAN: format.
    `;

    console.log("Sending prompt to CEO...");
    const response = await service.sendMessage(prompt);

    console.log("\n--- CEO Response ---");
    console.log(response);
}

startChallenge();
