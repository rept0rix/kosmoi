
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

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
     * Workflow: Run the daily sales cycle
     */
    async run_daily_cycle() {
        console.log(`🚀 Starting Daily Sales Cycle...`);

        const leads = await this.scout_leads(3); // Start small

        for (const lead of leads) {
            const invite = await this.generate_invitation(lead);
            if (invite) {
                console.log(`\n--------------------------------`);
                console.log(`🎯 Target: ${lead.business_name}`);
                console.log(`📝 Message:\n${invite.message}`);
                console.log(`✅ Saved to 'invitations' table`);
                console.log(`--------------------------------\n`);

                // Future: Send Email/SMS logic here
            }
        }
        console.log(`✅ Daily Cycle Complete.`);
    }
}

// Run if called directly
const agent = new SalesCoordinator();
agent.run_daily_cycle();
