import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env vars FIRST
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Load dependencies dynamically AFTER env is loaded
const { db } = await import('../api/supabaseClient.js');
const { sendTelegramNotification } = await import('../services/TelegramService.js');

const POLLING_INTERVAL = 10000; // 10 seconds

console.log("🚀 Monitor New Leads Service Started...");
console.log(`Checking for 'new_lead' every ${POLLING_INTERVAL / 1000} seconds.`);

async function checkNewLeads() {
    try {
        console.log("🔍 Checking new leads...");
        const { data, error } = await db.entities.ServiceProvider.filter({ status: 'new_lead' });

        if (error) {
            console.error("Error fetching leads:", error);
            return;
        }

        if (!data || data.length === 0) {
            // No new leads
            return;
        }

        console.log(`Found ${data.length} new lead(s)! Processing...`);

        for (const lead of data) {
            await processLead(lead);
        }

    } catch (err) {
        console.error("Monitor Loop Error:", err);
    }
}

async function processLead(lead) {
    const { id, business_name, category, description, owner_name } = lead;

    console.log(`Processing lead: ${business_name} (${id})`);

    // 1. Notify Admin (Telegram)
    const message = `
🌟 **New Vendor Signup!** 🌟

**Business:** ${business_name}
**Category:** ${category}
**Owner:** ${owner_name || 'N/A'}
**Description:** ${description?.substring(0, 100)}...

_Please review and verify._
`;

    await sendTelegramNotification(message);

    // 2. Create Task for Researcher Agent
    try {
        await db.entities.AgentTasks.create({
            title: `Verify New Vendor: ${business_name}`,
            description: `A new vendor has signed up. Please verify the details for "${business_name}" (${category}).\n\nID: ${id}\nDescription: ${description}`,
            assigned_to: 'researcher', // Assign to Researcher Agent
            priority: 'high',
            status: 'open',
            created_by: 'system_monitor'
        });
        console.log(`Task created for Researcher.`);
    } catch (taskErr) {
        console.error(`Failed to create task for ${business_name}:`, taskErr);
    }

    // 3. Update Status to 'processing'
    try {
        await db.entities.ServiceProvider.update(id, {
            status: 'processing'
        });
        console.log(`Status updated to 'processing'.`);
    } catch (updateErr) {
        console.error(`Failed to update status for ${business_name}:`, updateErr);
    }
}

// Start Loop
setInterval(checkNewLeads, POLLING_INTERVAL);
// Initial check
checkNewLeads();
