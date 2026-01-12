
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import AgentProtocol from './lib/agent_protocol.js';

// Initialize Services
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const apiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

if (!supabaseUrl || !supabaseServiceKey || !apiKey) {
    console.error("❌ Missing .env credentials");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

/**
 * Sales Coordinator Agent ("Sarah")
 * Responsibility: Scout unverified businesses and prepare invitations.
 */
class SalesCoordinator {
    constructor() {
        this.name = "Sarah";
        this.role = "Sales Coordinator";
        this.protocol = new AgentProtocol('sales_coordinator');
    }

    async __scout_leads(limit = 5) {
        // Internal helper to get raw leads
        const { data: leads } = await supabase
            .from('service_providers')
            .select('id, business_name, category, location, phone, description, metadata')
            .eq('verified', false)
            .eq('status', 'active')
            .neq('category', 'culture')
            .neq('category', 'temple')
            .neq('category', 'other')
            .limit(limit * 3); // Fetch more to account for filter
        return leads || [];
    }

    /**
     * Skill: Scout Leads
     * Find unverified businesses that HAVE NOT been invited yet.
     */
    async scout_leads(limit = 5) {
        console.log(`🕵️‍♀️ ${this.name}: Scouting for new leads...`);

        const rawLeads = await this.__scout_leads(limit);
        const freshLeads = [];

        for (const lead of rawLeads) {
            if (freshLeads.length >= limit) break;

            // Check if already invited
            const { data: existing } = await supabase
                .from('invitations')
                .select('id')
                .eq('service_provider_id', lead.id)
                .maybeSingle();

            if (!existing) {
                freshLeads.push(lead);
            }
        }

        console.log(`Found ${freshLeads.length} fresh leads (not yet invited).`);
        return freshLeads;
    }

    /**
     * Skill: Generate Invitation
     * Drafts message and SAVES invitation to DB.
     */
    async generate_invitation(lead) {
        console.log(`💌 Drafting invite for: ${lead.business_name}...`);

        // 1. Generate Token
        const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        const claimLink = `https://kosmoi.com/claim-profile?token=${token}`;

        // 2. Draft Message with Gemini
        const prompt = `
        You are Sarah, a partnership manager for "Samui Service Hub".
        Draft a 1-sentence invite for "${lead.business_name}" (${lead.category}) in ${lead.location}.
        Value: "Get verified for $1/month". 
        Link placeholder: [LINK]
        Tone: Casual, local.
        `;

        try {
            const result = await model.generateContent(prompt);
            const messageRaw = result.response.text().trim();
            const message = messageRaw.replace('[LINK]', claimLink);

            // 3. Persist to DB
            const { error } = await supabase
                .from('invitations')
                .insert({
                    service_provider_id: lead.id,
                    token: token,
                    status: 'pending',
                    metadata: {
                        channel: 'simulated_agent',
                        target_message: message
                    }
                });

            if (error) {
                console.error(`❌ DB Save Failed for ${lead.business_name}:`, error.message);
                return null;
            }

            return {
                business_id: lead.id,
                message: message,
                status: 'saved_to_db'
            };

        } catch (e) {
            console.error("❌ GenAI Error:", e.message);
            return null;
        }
    }

    /**
     * Process a single lead from the mesh network
     */
    async process_lead_signal(signal) {
        // Parse the markdown content to extract potential DB ID or just use the text
        const match = signal.content.match(/DB_ID:\s*([a-f0-9\-]+)/i);
        if (match) {
            const leadId = match[1];
            console.log(`📨 Received Signal for Lead ID: ${leadId}`);

            const { data: lead } = await supabase
                .from('service_providers')
                .select('*')
                .eq('id', leadId)
                .single();

            if (lead) {
                await this.generate_invitation(lead);
                this.protocol.updateStatus('WORKING', `Thinking: ${lead.business_name}`);
            }
        }
    }

    /**
     * Workflow: Run the infinite mesh loop
     */
    async run_mesh_cycle() {
        console.log(`🚀 Sales Coordinator Joined Protocol 626 Mesh.`);
        this.protocol.updateStatus('IDLE', 'Waiting for leads...');

        while (true) {
            // 1. Check Inbox
            const inbox = this.protocol.readInbox();

            if (inbox.length > 0) {
                console.log(`📬 Inbox has ${inbox.length} messages.`);
                this.protocol.updateStatus('WORKING', 'Processing Inbox');

                for (const msg of inbox) {
                    if (msg.type === 'lead_found') {
                        await this.process_lead_signal(msg);
                    }
                    // Archive after processing
                    this.protocol.archiveMessage(msg.filePath);
                }
            } else {
                // Should we scout if bored? Maybe not, strictly reactive for now.
                // await this.scout_leads(1);
            }

            // Sleep 5s
            await new Promise(r => setTimeout(r, 5000));
        }
    }
}

// Run if called directly
const agent = new SalesCoordinator();
agent.run_mesh_cycle();
