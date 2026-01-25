
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("❌ Missing Supabase Config");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

console.log("🚀 Seeding Agents to Database...");

// We need to import the agents array. 
// Since AgentRegistry.js uses ES modules and imports from other files that might not run in Node easily without package.json "type": "module"
// We will do a clever trick: we will just read the agent definitions directly or rely on a hardcoded list for the seed if the import fails.
// Best approach: Parse the Registry file or use the hardcoded definition from the known set.

// Hardcoded extract of the core agents to ensure meaningful seed
const CORE_AGENTS = [
    { id: 'agent_sales_crm', name: 'CRM Sales Agent', role: 'Sales Specialist', color: 'green', type: 'assistant', systemPrompt: 'You are a CRM Sales Specialist.' },
    { id: 'agent_ceo', name: 'CEO', role: 'Chief Executive Officer', color: 'purple', type: 'executive', systemPrompt: 'You are the CEO.' },
    { id: 'agent_cfo', name: 'CFO', role: 'Chief Financial Officer', color: 'green', type: 'executive', systemPrompt: 'You are the CFO.' },
    { id: 'agent_blog_writer', name: 'Samui Storyteller', role: 'Content Creator', color: 'purple', type: 'creative', systemPrompt: 'You are an expert travel writer.' },
    { id: 'agent_concierge', name: 'Concierge', role: 'Guest Services', color: 'amber', type: 'support', systemPrompt: 'You are a luxury concierge.' },
    { id: 'agent_booking', name: 'Booking Manager', role: 'Operations', color: 'blue', type: 'support', systemPrompt: 'You manage bookings.' }
];

async function seed() {
    let successCount = 0;

    for (const agent of CORE_AGENTS) {
        const payload = {
            agent_id: agent.id,
            name: agent.name,
            role: agent.role,
            description: agent.role, // Default
            color: agent.color,
            system_prompt: agent.systemPrompt,
            active: true
        };

        const { error } = await supabase.from('agent_configs').upsert(payload, { onConflict: 'agent_id' });

        if (error) {
            console.error(`❌ Failed to seed ${agent.name}:`, error.message);
        } else {
            console.log(`✅ Seeded: ${agent.name}`);
            successCount++;
        }
    }
    console.log(`\n✨ Seeding Complete. ${successCount} agents ready in DB.`);
}

seed();
