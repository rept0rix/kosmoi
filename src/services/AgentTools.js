import { realSupabase as supabase } from '../api/supabaseClient.js';
import { BookingService } from './BookingService.js';

/**
 * A collection of tools that AI Agents can use to interact with the system.
 * These tools wrap existing services or raw DB queries to provide
 * a clean interface for the Agent logic.
 */
export const AgentTools = {

    /**
     * Search for service providers by text query (name, category, description).
     * @param {string} query - The search term (e.g., "plumber", "cleaning", "John").
     * @returns {Promise<Array>} List of matching providers.
     */
    searchProviders: async (query) => {
        console.log(`[AgentTools] Searching for: ${query}`);
        try {
            const { data, error } = await supabase
                .from('service_providers')
                .select('id, business_name, category, sub_categories, description, rating, review_count, images')
                .or(`business_name.ilike.%${query}%,category.ilike.%${query}%,description.ilike.%${query}%`)
                .limit(5);

            if (error) throw error;
            return data || [];
        } catch (err) {
            console.error("[AgentTools] Search failed:", err);
            return [];
        }
    },

    /**
     * Check availability for a specific provider on a specific date.
     * @param {string} providerId 
     * @param {string} dateStr - YYYY-MM-DD
     * @returns {Promise<Array>} List of available time slots.
     */
    checkAvailability: async (providerId, dateStr) => {
        console.log(`[AgentTools] Checking availability for ${providerId} on ${dateStr}`);
        try {
            // BookingService.getAvailableSlots(date, providerId)
            const dateObj = new Date(dateStr);
            const slots = await BookingService.getAvailableSlots(dateObj, providerId);
            return slots; // Returns array of strings ['09:00', ...]
        } catch (err) {
            console.error("[AgentTools] Availability check failed:", err);
            return [];
        }
    },

    /**
     * Create a booking on behalf of the user.
     * @param {object} bookingDetails - { userId, providerId, date, startTime, endTime, serviceType }
     * @returns {Promise<object>} The created booking.
     */
    createBooking: async (bookingDetails) => {
        console.log(`[AgentTools] Creating booking:`, bookingDetails);
        try {
            const result = await BookingService.createBooking(bookingDetails);
            return result;
        } catch (err) {
            console.error("[AgentTools] Booking creation failed:", err);
            throw err;
        }
    }
};

export default AgentTools;
