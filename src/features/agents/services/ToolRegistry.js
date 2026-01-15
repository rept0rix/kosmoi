import { KnowledgeService } from "@/services/ai/KnowledgeService.js";
import { SalesService } from "@/services/SalesService.js";
import { MarketingService } from "@/services/integrations/MarketingService.js";
import { AnalyticsService } from "@/services/integrations/AnalyticsService.js";
import { BookingService } from "@/services/BookingService.js";
import { AdminService } from "@/services/AdminService.js";

/**
 * ToolRegistry
 * Maps string tool names (from Agent Config) to executable functions.
 */
export const ToolRegistry = {
    // --- AI TOOLS ---
    'search_services': async (input) => {
        const query = typeof input === 'string' ? input : input.query;
        const location = input.location || 'Koh Samui';
        console.log(`[ToolRegistry] Searching Services (Real DB): ${query} in ${location}`);

        try {
            // Use AdminService to fetch real data
            // We'll search by text filter.
            const { data } = await AdminService.getBusinessesPage(1, 10, { search: query });

            if (!data || data.length === 0) {
                return `No businesses found for "${query}". Try "restaurant", "hotel", or broader terms.`;
            }

            // Map to simplified format for Agent Observation
            return data.map(b => ({
                name: b.business_name,
                category: b.category,
                location: b.address || "Koh Samui",
                rating: b.rating || "New", // Fallback if rating missing
                price: b.price_level || "$$",
                description: b.description ? b.description.substring(0, 100) + "..." : "No description."
            }));

        } catch (e) {
            console.error("Search Tool Error:", e);
            return "Error searching for services. The database might be offline.";
        }
    },

    'suggest_itinerary': async (input) => {
        const { location, interests } = input;
        console.log(`[ToolRegistry] Generating Itinerary for ${location}`);
        // This is a logic tool. It might trigger an internal chain or just format known spots.
        // We return a structure for the Agent to "observe".
        return {
            morning: "Coffee at a local cafe in " + location,
            afternoon: "Activity related to " + (interests || "relaxation"),
            evening: "Sunset dinner at a beachfront venue"
        };
    },

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
