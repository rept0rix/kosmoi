import { KnowledgeService } from "@/services/ai/KnowledgeService.js";
import { SalesService } from "@/services/SalesService.js";
import { MarketingService } from "@/services/integrations/MarketingService.js";
import { AnalyticsService } from "@/services/integrations/AnalyticsService.js";
import { BookingService } from "@/services/BookingService.js";

/**
 * ToolRegistry
 * Maps string tool names (from Agent Config) to executable functions.
 */
export const ToolRegistry = {
    // --- AI TOOLS ---
    'search_knowledge_base': async (input) => {
        // Input can be a string or an object { query: "..." }
        const query = typeof input === 'string' ? input : input.query;
        console.log(`[ToolRegistry] Searching Knowledge Base for: ${query}`);
        const result = await KnowledgeService.retrieveContext(query);
        return result || "No relevant information found.";
    },

    'generate_email': async (input, context) => {
        // This tool delegates back to the LLM usually, but here we can keep it simple 
        // or actually USE the input to formatting.
        // If the Agent thinks it's calling a tool to generate email, it expects the tool to do it.
        // For now, let's keep the template logic but make it dynamic.
        const leadName = context.lead?.name || 'Customer';
        const businessType = context.lead?.business_type || 'Business';

        return `Subject: Re: Partnership with Kosmoi for ${businessType}\n\nHi ${leadName},\n\nI noticed your ${businessType} business and thought... (AI Generated Content based on: ${input.topic || 'General'})`;
    },

    // --- CRM TOOLS ---
    'insert_interaction': async (input) => {
        console.log(`[ToolRegistry] Logging interaction:`, input);

        if (!input.lead_id) throw new Error("Missing lead_id for interaction");

        // Call Real Service
        const result = await SalesService.createInteraction(input.lead_id, input.type || 'note', input.content);
        return result;
    },

    'update_lead': async (input) => {
        console.log(`[ToolRegistry] Updating lead:`, input);

        if (!input.lead_id) throw new Error("Missing lead_id for update");

        // Call Real Service
        const updates = { ...input };
        delete updates.lead_id; // Clean up

        const result = await SalesService.updateLead(input.lead_id, updates);
        return result;
    },

    'get_lead': async (input) => {
        console.log(`[ToolRegistry] Fetching lead:`, input);
        // Call Real Service (We'll use getLeads filter)
        // Optimally SalesService should have getLeadById
        const leads = await SalesService.getLeads({ id: input.lead_id });
        return leads[0] || null;
    },

    // --- MARKETING TOOLS (Dave) ---
    'get_trends': async (input) => {
        // input might be { niche: 'Travel' }
        const niche = input.niche || 'General';
        return await MarketingService.getTrendingTopics(niche);
    },

    'publish_post': async (input) => {
        // input: { platform, caption, image_prompt }
        // 1. Generate Image Asset if needed
        let imageUrl = input.imageUrl;
        if (!imageUrl && input.image_prompt) {
            imageUrl = await MarketingService.generateImageAsset(input.image_prompt);
        }

        // 2. Publish
        const result = await MarketingService.publishPost(input.platform || 'instagram', {
            caption: input.caption,
            imageUrl: imageUrl
        });
        return result;
    },

    // --- ANALYTICS TOOLS (Lara) ---
    'get_analytics_summary': async (input) => {
        const period = input.period || 'weekly';
        return await AnalyticsService.getSummary(period);
    },

    // --- BOOKING TOOLS (Claude) ---
    'get_available_slots': async (input) => {
        // input: { date, provider_id }
        console.log(`[ToolRegistry] Checking slots for ${input.provider_id} on ${input.date}`);
        return await BookingService.getAvailableSlots(input.date, input.provider_id);
    },

    'create_booking': async (input) => {
        // input: { date, time, providerId, userId, serviceName }
        console.log(`[ToolRegistry] Creating booking...`, input);
        const result = await BookingService.createBooking(input);
        return result;
    },

    'cancel_booking': async (input) => {
        return await BookingService.cancelBooking(input.booking_id);
    }
};
