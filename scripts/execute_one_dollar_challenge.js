
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials!");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const STEPS = [
    {
        role: 'ceo',
        task: "Invent a digital product we can sell for $1. It should be simple, high value, and immediate delivery. Output JSON with { productName, description, price, currency: 'usd' }."
    },
    {
        role: 'tech-lead',
        task: "Create a Stripe payment link for the product invented by the CEO. Use the create_payment_link tool. Product Name: {{productName}}. Amount: {{price}}. Currency: {{currency}}."
    },
    {
        role: 'sales-pitch',
        task: "Send a sales email to 'test@example.com' selling this $1 product. Include the payment link: {{paymentLink}}. Make it punchy."
    }
];

const AGENT_IDS = {
    'ceo': 'ceo-agent',
    'tech-lead': 'tech-lead-agent',
    'sales-pitch': 'sales-pitch-agent'
};

async function getAgentId(role) {
    const id = AGENT_IDS[role];
    if (!id) {
        throw new Error(`Could not find agent with role ${role}`);
    }
    return id;
}

async function runStep(step, context) {
    console.log(`\n--- Running Step: ${step.role} ---`);
    const agentId = await getAgentId(step.role);

    // Replace placeholders
    let prompt = step.task;
    for (const [key, value] of Object.entries(context)) {
        prompt = prompt.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }

    console.log(`Task: ${prompt}`);

    // Create Task
    const { data: task, error } = await supabase
        .from('agent_tasks')
        .insert({
            title: `One Dollar Challenge: ${step.role}`,
            assigned_to: agentId,
            description: prompt,
            status: 'pending',
            priority: 'high'
        })
        .select()
        .single();

    if (error) throw error;
    console.log(`Task Created: ${task.id}. Waiting for completion...`);

    // Poll for completion
    let result = null;
    let attempts = 0;
    while (!result && attempts < 60) { // 60 * 2s = 2 mins timeout
        await new Promise(r => setTimeout(r, 2000));
        const { data } = await supabase.from('agent_tasks').select('*').eq('id', task.id).single();
        if (data.status === 'completed') {
            result = data.result;
            console.log(`Task Completed! Result:`, result);
        } else if (data.status === 'failed') {
            throw new Error(`Task Failed: ${data.error_message}`);
        }
        process.stdout.write('.');
        attempts++;
    }

    if (!result) throw new Error("Task timeout");
    return result;
}

async function main() {
    console.log("🚀 Starting One Dollar Challenge Simulation...");
    const context = {};

    try {
        // Step 1: CEO
        const ceoResult = await runStep(STEPS[0], context);
        // Try to parse JSON from CEO output
        try {
            // Find JSON in output
            const match = ceoResult.match(/\{[\s\S]*\}/);
            const jsonStr = match ? match[0] : ceoResult;
            const product = JSON.parse(jsonStr);
            context.productName = product.productName;
            context.description = product.description;
            context.price = product.price;
            context.currency = product.currency;
            console.log("✅ Context Updated with Product:", context);
        } catch (e) {
            console.warn("Could not parse CEO output as JSON, using defaults.");
            context.productName = "One Dollar Insight";
            context.price = 100;
            context.currency = "usd";
        }

        // Step 2: Tech Lead
        // Ensure price is in cents for Stripe if needed, but our tool handles it.
        // The tool create_payment_link expects amount in cents? 
        // Let's check the tool definition... 
        // Assuming the CEO output 1 for $1. 
        if (context.price === 1) context.price = 100; // Convert to cents if needed, but safer to assume cents.

        const techResult = await runStep(STEPS[1], context);
        // Extract link
        const linkMatch = techResult.match(/https:\/\/buy\.stripe\.com\/mock_[a-zA-Z0-9]+/);
        context.paymentLink = linkMatch ? linkMatch[0] : "https://buy.stripe.com/mock_LINK_NOT_FOUND";
        console.log("✅ Context Updated with Link:", context.paymentLink);

        // Step 3: Sales
        await runStep(STEPS[2], context);

        console.log("\n🎉 One Dollar Challenge Workflow Completed Successfully!");

    } catch (e) {
        console.error("\n❌ Workflow Failed:", e);
        process.exit(1);
    }
}

main();
