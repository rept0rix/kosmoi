import { db } from "../api/supabaseClient";

/**
 * Service to handle booking logic, mimicking a Calendar API.
 */
export const BookingService = {
    /**
     * Get available slots for a specific date and provider.
     * @param {Date} date 
     * @param {string} providerId 
     * @returns {Promise<string[]>} Array of available time slots (e.g., ["10:00", "11:00"])
     */
    getAvailableSlots: async (date, providerId) => {
        // Mock logic for MVP: Even hours are available
        const slots = [
            "09:00", "10:00", "11:00", "12:00", "14:00", "15:00", "16:00"
        ];

        // Simulating async API call
        return new Promise((resolve) => {
            setTimeout(() => {
                // In a real app, we would query the database for existing bookings
                // const { data } = await db.from('bookings').select('*')...
                resolve(slots);
            }, 500);
        });
    },

    /**
     * Create a new booking
     * @param {Object} bookingDetails 
     * @returns {Promise<Object>} The created booking object
     */
    createBooking: async (bookingDetails) => {
        // details: { date, time, providerId, userId, serviceName }
        console.log("Creating booking:", bookingDetails);

        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    id: `bk_${Date.now()}`,
                    status: 'confirmed',
                    ...bookingDetails
                });
            }, 800);
        });
    },

    /**
     * Cancel a booking
     * @param {string} bookingId 
     */
    cancelBooking: async (bookingId) => {
        console.log("Cancelling booking:", bookingId);
        return Promise.resolve(true);
    }
};
