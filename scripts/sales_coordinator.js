
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import AgentProtocol from './lib/agent_protocol.js';
import { INVITATION_TEMPLATE } from './lib/email_templates.js';

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
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

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
    // Fixed import placement

    /**
     * Skill: Generate Invitation
     */
    async generate_invitation(lead) {
        console.log(`💌 Drafting invite for: ${lead.business_name}...`);

        // 1. Generate Content (using Gemini or Template)
        const claimLink = `https://kosmoi.site/claim?id=${lead.id}`;
        const emailHtml = INVITATION_TEMPLATE(lead.business_name, claimLink);


        // 2. Determine Recipient (SAFETY MODE)
        const recipientEmail = process.env.TEST_EMAIL || 'admin@kosmoi.com';
        const n8nWebhookUrl = process.env.VITE_N8N_EMAIL_WEBHOOK;

        if (n8nWebhookUrl && !n8nWebhookUrl.includes('YOUR_N8N')) {
            console.log(`🔌 Dispatching to n8n: ${n8nWebhookUrl}`);
            try {
                const response = await fetch(n8nWebhookUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        to: recipientEmail, // In production, this would be lead.email
                        subject: `Invitation for ${lead.business_name} - Kosmoi`,
                        html: emailHtml,
                        business_name: lead.business_name,
                        claim_link: claimLink,
                        lead_id: lead.id,
                        from: 'Sarah <onboarding@resend.dev>'
                    })
                });

                if (response.ok) {
                    console.log(`🚀 Email Dispatched via n8n to ${recipientEmail}!`);
                } else {
                    console.error(`❌ n8n Error: ${response.status} ${response.statusText}`);
                }
            } catch (err) {
                console.error(`❌ n8n Network Error:`, err);
            }
        } else {
            console.log(`⚠️ No n8n Webhook configured. Falling back to Supabase Function.`);
            // 3. Fallback: Send Email via Edge Function
            const { data, error } = await supabase.functions.invoke('send-email', {
                body: {
                    to: recipientEmail,
                    subject: `Invitation for ${lead.business_name} - Kosmoi`,
                    html: emailHtml,
                    from: 'Sarah <onboarding@resend.dev>'
                }
            });

            if (error) {
                console.error(`❌ Email Failed:`, error);
                // Fallback to DB save even if email fails
            } else {
                console.log(`🚀 Email Sent to ${recipientEmail}! ID: ${data?.id || 'OK'}`);
            }
        }


        // 4. Save to DB
        console.log("💾 Saving invitation to DB...");
        const result = await supabase
            .from('invitations')
            .insert({
                service_provider_id: lead.id,
                token: 'mock-token', // TODO: Generate real token
                channel: 'email',
                status: 'sent',
                metadata: {
                    target_email: recipientEmail,
                    real_business_email: lead.email || 'unknown',
                    subject: `Invitation for ${lead.business_name}`
                }
            })
            .select()
            .single();

        if (result.error) console.error("❌ DB Insert Error:", result.error);
        else console.log("✅ Invite Saved to DB:", result.data.id);

        return result;
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
                // Active Mode: Scout for existing DB leads if inbox is empty
                this.protocol.updateStatus('WORKING', 'Active Scouting');
                const freshLeads = await this.scout_leads(1);
                for (const lead of freshLeads) {
                    await this.generate_invitation(lead);
                }
                if (freshLeads.length === 0) {
                    this.protocol.updateStatus('IDLE', 'No fresh leads found');
                }
            }

            // Sleep 30s to avoid spamming
            await new Promise(r => setTimeout(r, 30000));
        }
    }
}

// Run if called directly
const agent = new SalesCoordinator();
agent.run_mesh_cycle();
