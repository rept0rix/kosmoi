
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// --- CONFIG ---
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY; // Must use Service Role for Admin tasks

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("❌ Missing Supabase credentials in .env");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// --- AGENT ROLES ---
const SALES_AGENT_ID = 'sales-agent'; // Or whatever ID you use for SalesPitchAgent

// --- STEPS ---
// We feed these recursively to the agents
const STEPS = [
    {
        role: 'sales-pitch',
        step_name: 'Prospecting',
        task: "Generate 3 potential B2B leads for Kosmoi (a platform for service providers on Koh Samui). " +
            "Output JSON with an array of objects: [{ company, first_name, last_name, email, value, source: 'ai_prospecting' }]. " +
            "Make them realistic but fictional if needed. " +
            "IMPORTANT: Reply ONLY with the JSON code block. Do NOT include any intro or outro text. " +
            "The response must be in ENGLISH.",
        fallback: JSON.stringify([
            { company: "Samui Villas Ltd", first_name: "John", last_name: "Doe", email: "john@samuivillas.com", value: 50000, source: 'fallback' },
            { company: "Coco Beach Bar", first_name: "Sarah", last_name: "Smith", email: "sarah@cocobeach.com", value: 15000, source: 'fallback' }
        ])
    },
    {
        role: 'sales-pitch',
        step_name: 'Data Entry',
        task: "Take the leads generated in the previous step and insert them into the CRM using the 'create_lead' tool (or 'update_lead' if you prefer, but create is better). " +
            "Context Data: {{previous_step_result}}. " +
            "Loop through the array and create each lead. " +
            "Reply with 'TASK_COMPLETED' when all are added.",
        fallback: "Leads manually queued for entry."
    },
    {
        role: 'sales-pitch',
        step_name: 'Outreach',
        task: "For the leads you just created, draft a short welcome email for each. " +
            "Use 'insert_interaction' tool to log this email draft as an interaction for each lead. " +
            "Do NOT send the email yet, just log it. " +
            "Reply with 'TASK_COMPLETED' when done.",
        fallback: "Outreach drafts prepared offline."
    }
];

// --- ORCHESTRATION ENGINE (Reused from One Dollar Challenge) ---

async function createAgentTask(step, context) {
    // 1. Inject Context
    let description = step.task;
    if (context.result) {
        description = description.replace('{{previous_step_result}}', typeof context.result === 'object' ? JSON.stringify(context.result) : context.result);
    }

    const payload = {
        title: `CRM Protocol: ${step.step_name}`,
        description: description,
        assigned_to: step.role, // 'sales-pitch'
        priority: 'high',
        status: 'pending',
        input_context: context // Store full context in DB for debugging
    };

    const { data, error } = await supabase.from('agent_tasks').insert([payload]).select().single();
    if (error) throw error;
    return data;
}

async function waitForTaskCompletion(taskId) {
    console.log(`Task Created: ${taskId}. Waiting for completion...`);
    let turns = 0;
    while (turns < 60) { // 5 minutes max
        const { data } = await supabase.from('agent_tasks').select('*').eq('id', taskId).single();
        if (data.status === 'done') {
            return data;
        }
        process.stdout.write('.');
        await new Promise(r => setTimeout(r, 5000));
        turns++;
    }
    throw new Error("Task Timeout");
}

async function safeRunStep(step, context) {
    console.log(`\n--- Running Step: ${step.step_name} ---`);
    try {
        const task = await createAgentTask(step, context);
        const completedTask = await waitForTaskCompletion(task.id);

        console.log(`✅ Task Completed! Result: ${completedTask.result.substring(0, 100)}...`);

        // Parse Result for Context
        let resultData = completedTask.result;
        try {
            // Try to extract JSON from the text response
            const jsonMatch = completedTask.result.match(/```json\n([\s\S]*?)\n```/) || completedTask.result.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                resultData = JSON.parse(jsonMatch[1] || jsonMatch[0]);
                console.log("📦 Parsed JSON output from agent.");
            }
        } catch (e) {
            console.warn("⚠️ Could not parse JSON from agent output. Passing raw text.");
        }

        return { success: true, result: resultData };

    } catch (e) {
        console.warn(`\n⚠️ Step '${step.step_name}' failed: ${e.message}`);
        console.log(`🔄 Activating Fallback...`);
        return { success: false, result: step.fallback, error: e.message };
    }
}

async function runSimulation() {
    console.log("🚀 Starting CRM Population Protocol...");
    let context = {};

    for (const step of STEPS) {
        const outcome = await safeRunStep(step, context);

        // SMART CONTEXT HANDOFF: Check for 'leads.json' if result seems empty
        let stepResult = outcome.result;
        if (step.step_name === 'Prospecting' && fs.existsSync('./leads.json')) {
            console.log("📂 Found 'leads.json'. Injecting into context...");
            try {
                const fileData = fs.readFileSync('./leads.json', 'utf-8');
                stepResult = JSON.parse(fileData);
                console.log("✅ Loaded leads from file:", stepResult.length);
            } catch (e) {
                console.warn("⚠️ Failed to read leads.json:", e.message);
            }
        }

        // Update context for next step
        context = { ...context, prev_result: stepResult, ...stepResult };
        context.result = stepResult;
    }

    console.log("\n🎉 CRM Population Protocol Completed!");
}

runSimulation();
