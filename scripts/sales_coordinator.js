
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
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" }); // Using Flash for speed

/**
 * Sales Coordinator Agent ("Sarah")
 * Responsibility: Scout unverified businesses and prepare invitations.
 */
class SalesCoordinator {
    constructor() {
        this.name = "Sarah";
        this.role = "Sales Coordinator";
    }

    /**
     * Skill: Scout Leads
     * Find unverified businesses in a specific area/category that haven't been contacted yet.
     */
    async scout_leads(limit = 5) {
        console.log(`🕵️‍♀️ ${this.name}: Scouting for new leads...`);

        // 1. Fetch unverified providers
        // Filter out non-commercial categories (Temples, generic 'Visit')
        const { data: leads, error } = await supabase
            .from('service_providers')
            .select('id, business_name, category, location, phone, description, metadata')
            .eq('verified', false)
            .eq('status', 'active')
            .neq('category', 'culture') // Don't sell to temples
            .neq('category', 'temple')
            .neq('category', 'other')   // Crawler dumps unknown/temples here
            .limit(limit);

        if (error) {
            console.error("❌ Error fetching leads:", error);
            return [];
        }

        console.log(`Found ${leads.length} potential leads.`);
        return leads;
    }

    /**
     * Skill: Generate Invitation
     * Drafts a personalized message using GenAI.
     */
    async generate_invitation(lead) {
        console.log(`💌 Drafting invite for: ${lead.business_name}...`);

        const prompt = `
        You are Sarah, a friendly partnership manager for "Samui Service Hub" (Kosmoi).
        Draft a SHORT, casual, high-converting invitation message for this business:
        
        Name: ${lead.business_name}
        Type: ${lead.category}
        Location: ${lead.location}
        
        Value Prop: "Get verified for $1/month to accept bookings and payments instantly."
        Call to Action: "Click here to claim: [LINK]"

        Format: Plain text, friendly tone, no jargon. max 2 sentences + CTA.
        `;

        try {
            const result = await model.generateContent(prompt);
            const message = result.response.text().trim();

            // In a real app, we'd generate a real link here:
            // const link = await createPaymentLink(...)
            const dummyLink = `https://kosmoi.com/claim/${lead.id}`;

            return {
                business_id: lead.id,
                message: message.replace('[LINK]', dummyLink),
                status: 'drafted'
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
