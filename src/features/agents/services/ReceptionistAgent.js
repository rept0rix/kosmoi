
import { supabase } from '@/api/supabaseClient';
import { AgentRunner } from './AgentRunner';

/**
 * ReceptionistAgent Service
 * Handles automated responses for service providers based on their configuration.
 */
export const ReceptionistAgent = {

    /**
     * Process an incoming message and generate a response if the receptionist is active.
     * @param {object} message - The incoming message object (content, sender_id, etc.).
     * @param {string} providerId - The ID of the service provider receiving the message.
     * @returns {Promise<string|null>} - The generated response or null if no reply needed.
     */
    handleIncomingMessage: async (message, providerId, supabaseClient = supabase) => {
        console.log(`[ReceptionistAgent] Processing message for provider ${providerId}`);

        try {
            // 1. Fetch Agent Configuration
            const { data: config, error } = await supabaseClient
                .from('agent_configurations')
                .select('*')
                .eq('provider_id', providerId)
                .eq('agent_type', 'receptionist')
                .single();

            if (error || !config) {
                console.log("[ReceptionistAgent] No active config found.");
                return null;
            }

            // 2. Check Activation Status
            if (!config.is_active || !config.auto_reply_enabled) {
                console.log("[ReceptionistAgent] Agent is disabled or auto-reply off.");
                return null;
            }

            // 3. Fetch Provider Details (Business Name, Content) for Context
            const { data: provider } = await supabaseClient
                .from('service_providers')
                .select('business_name, category, description, opening_hours')
                .eq('id', providerId)
                .single();

            // 4. Construct Dynamic Agent Definition
            const toneInstruction = getToneInstruction(config.tone);

            const receptionistAgentDef = {
                id: `receptionist-${providerId}`,
                name: `${provider?.business_name || 'Business'} Receptionist`,
                role: 'receptionist',
                allowedTools: [], // Pending: Add booking tools if needed in future
                systemPrompt: `
You are the AI Receptionist for "${provider?.business_name || 'our business'}", a ${provider?.category || 'service'} provider.
Your goal is to assist customers, answer questions based on business details, and be helpful.

**Business Context:**
Description: ${provider?.description || 'N/A'}
Opening Hours: ${JSON.stringify(provider?.opening_hours || 'N/A')}

**Configuration:**
Tone: ${config.tone} (${toneInstruction})
Custom Instructions: ${config.custom_instructions || "Be polite and concise."}

**Instructions:**
- Reply to the user's message as the receptionist.
- Do not make up facts if you don't know them.
- If you can't help, offer to have a human staff member follow up.
- Keep responses relatively brief (SMS/Chat style) unless detailed info is requested.
`
            };

            // 5. Run Agent Logic
            const context = {
                lead: { name: 'Customer' }, // Could fetch real user name if available
                business: provider
            };

            const result = await AgentRunner.run(receptionistAgentDef, message.content, context);

            // 6. Return (and optionally log or send) response
            if (result && result.output) {
                console.log(`[ReceptionistAgent] Generated reply: ${result.output}`);
                return result.output;
            }

            return null;

        } catch (err) {
            console.error("[ReceptionistAgent] Error:", err);
            return null;
        }
    }
};

/**
 * Helper to get specific instructions based on tone setting.
 */
function getToneInstruction(tone) {
    switch (tone) {
        case 'formal': return "Use professional, polite, and grammatically perfect language. Address the user respectfully.";
        case 'friendly': return "Be warm, casual, and welcoming. Emojis are okay if appropriate.";
        case 'fun': return "Be energetic, playful, and enthusiastic. Use emojis freely!";
        case 'pirate': return "Speak like a pirate! Arrr! Use nautical terms and be adventurous.";
        default: return "Be professional and helpful.";
    }
}
