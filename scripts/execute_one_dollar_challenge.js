
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
        task: "Invent a digital product we can sell for $1. Output JSON with { productName, description, price, currency: 'usd' }. IMPORTANT: You MUST include this JSON in your FINAL reply along with 'TASK_COMPLETED'.",
        fallback: JSON.stringify({ productName: "Fallback Product", description: "A robust fallback product", price: 100, currency: "usd" })
    },
    {
        role: 'tech-lead',
        task: "Create a Stripe payment link for the product invented by the CEO. Use the create_payment_link tool. Product Name: {{productName}}. Amount: {{price}}. Currency: {{currency}}. IMPORTANT: You MUST include the generated Link in your FINAL reply along with 'TASK_COMPLETED'.",
        fallback: JSON.stringify({ url: "https://buy.stripe.com/mock_FALLBACK_LINK", status: "active" })
    },
    {
        role: 'sales-pitch',
        task: "Send a sales email to 'test@example.com' selling this $1 product. Include the payment link: {{paymentLink}}. Make it punchy. Use the send_email tool. IMPORTANT: Include the full email body in your FINAL reply along with 'TASK_COMPLETED'.",
        fallback: "Email service unavailable, but campaign prepared."
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

/**
 * Runs a step with "Continue on Fail" logic (n8n 2.0 style)
 */
async function safeRunStep(step, context) {
    console.log(`\n--- Running Step: ${step.role} ---`);

    try {
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
        const MAX_RETRIES = 60; // 2 minutes

        while (!result && attempts < MAX_RETRIES) {
            await new Promise(r => setTimeout(r, 2000));
            const { data } = await supabase.from('agent_tasks').select('*').eq('id', task.id).single();

            if (data.status === 'completed' || data.status === 'done') {
                result = data.result;
                console.log(`✅ Task Completed! Result:`, result);
            } else if (data.status === 'failed') {
                throw new Error(`Task Failed: ${data.result || data.error_message || 'Unknown error'}`);
            }
            process.stdout.write('.');
            attempts++;
        }

        if (!result) throw new Error("Task timeout");
        return { success: true, result };

    } catch (e) {
        console.warn(`\n⚠️ Step '${step.role}' failed: ${e.message}`);
        console.log(`🔄 Activating Fallback for '${step.role}'...`);
        return { success: false, result: step.fallback, error: e.message };
    }
}

async function main() {
    console.log("🚀 Starting One Dollar Challenge Simulation (Robust Mode)...");
    const context = {};

    // Step 1: CEO
    const ceoOut = await safeRunStep(STEPS[0], context);

    // Parse JSON
    try {
        let jsonStr = ceoOut.result;
        // Try to find JSON block in markdown
        const markdownMatch = ceoOut.result.match(/```json\s*([\s\S]*?)\s*```/);
        if (markdownMatch) {
            jsonStr = markdownMatch[1];
        } else {
            // Try to find raw JSON object
            const jsonMatch = ceoOut.result.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                jsonStr = jsonMatch[0];
            }
        }

        const product = JSON.parse(jsonStr);
        context.productName = product.productName || "Generic Product";
        context.description = product.description;
        context.price = product.price || 100;
        context.currency = product.currency || "usd";
    } catch (e) {
        console.warn("Could not parse CEO output, using constants. Output was:", ceoOut.result);
        context.productName = "One Dollar Insight";
        context.price = 100;
        context.currency = "usd";
    }
    console.log("📦 Context Updated (Product):", context.productName);

    // Step 2: Tech Lead
    // Ensure price is safe
    if (context.price === 1) context.price = 100;

    const techOut = await safeRunStep(STEPS[1], context);

    // Extract link
    const linkMatch = techOut.result.match(/(https:\/\/buy\.stripe\.com\/[a-zA-Z0-9_]+|https:\/\/checkout\.stripe\.com\/[^\s]+)/);
    // If we have a robust fallback in safeRunStep result, it might be a JSON object string, or just a string.
    // The fallback in STEPS[1] is a JSON string with url.
    let paymentLink = "https://buy.stripe.com/mock_LINK_MISSING";

    if (linkMatch) {
        paymentLink = linkMatch[0];
    } else {
        // Try to parse as JSON if it was a JSON response
        try {
            let jsonStr = techOut.result;
            const markdownMatch = techOut.result.match(/```json\s*([\s\S]*?)\s*```/);
            if (markdownMatch) jsonStr = markdownMatch[1];

            const json = JSON.parse(jsonStr);
            if (json.url) paymentLink = json.url;
        } catch (e) { /* ignore */ }
    }

    context.paymentLink = paymentLink;
    console.log("🔗 Context Updated (Link):", context.paymentLink);

    // Step 3: Sales
    const salesOut = await safeRunStep(STEPS[2], context);

    console.log("\n🎉 One Dollar Challenge Workflow Completed!");
    console.log("Summary:");
    console.log(`- Product: ${context.productName}`);
    console.log(`- Link: ${context.paymentLink}`);
    console.log(`- Sales Email Status: ${salesOut.success ? 'Sent' : 'Fallback/Failed'}`);

    if (!ceoOut.success || !techOut.success || !salesOut.success) {
        console.log("\n⚠️ Note: Some steps failed and used fallback values (n8n 2.0 style). Check logs for details.");
    }

    process.exit(0);
}

main();
