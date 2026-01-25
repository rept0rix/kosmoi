import { db } from "../api/supabaseClient.js";
import { WalletService } from "./WalletService.js";

/**
 * Service to handle booking logic backed by Supabase.
 */
export const BookingService = {
    /**
     * Get available slots for a specific date and provider.
     * Checks database for conflicting bookings.
     * @param {Date} date 
     * @param {string} providerId 
     * @returns {Promise<string[]>} Array of available time slots
     */
    getAvailableSlots: async (date, providerId) => {
        // 1. Define all possible slots (9am to 6pm)
        const allSlots = [
            "09:00", "10:00", "11:00", "12:00",
            "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"
        ];

        // 2. Fetch existing bookings for this provider on this date
        // Format date to YYYY-MM-DD
        const dateStr = date instanceof Date ? date.toISOString().split('T')[0] : date;

        const { data: bookings, error } = await db.from('bookings')
            .select('start_time')
            .eq('provider_id', providerId)
            .eq('service_date', dateStr)
            .in('status', ['pending', 'confirmed']); // Only active bookings block slots

        if (error) {
            console.error("Error fetching bookings:", error);
            return allSlots; // Fail safe? Or return empty? Let's return all for now to not block UI, or maybe empty?
        }

        // 3. Filter out booked slots
        // Booking start_time comes as "09:00:00" from DB usually
        const bookedTimes = new Set(bookings.map(b => b.start_time.substring(0, 5)));

        const availableSlots = allSlots.filter(slot => !bookedTimes.has(slot));

        return availableSlots;
    },

    /**
     * Helper to get provider's wallet ID from provider ID
     */
    getProviderWalletId: async (providerId) => {
        // 1. Get Owner ID from Service Provider
        const { data: provider, error: pError } = await db
            .from('service_providers')
            .select('owner_id')
            .eq('id', providerId)
            .single();

        if (pError || !provider?.owner_id) throw new Error("Provider owner not found");

        // 2. Get Wallet ID from Owner ID
        const { data: wallet, error: wError } = await db
            .from('wallets')
            .select('id')
            .eq('user_id', provider.owner_id)
            .single();

        if (wError || !wallet) throw new Error("Provider wallet not found");

        return wallet.id;
    },

    /**
     * Create a new booking
     * @param {Object} bookingDetails 
     * @returns {Promise<Object>} The created booking object
     */
    createBooking: async (bookingDetails) => {
        // details: { date, time, providerId, userId, serviceName, price }
        console.log("Creating real booking:", bookingDetails);

        // Required: user_id. If missing (guest), we can't book in this strict schema.
        if (!bookingDetails.userId) {
            throw new Error("User must be logged in to book.");
        }

        // 0. RACE CONDITION CHECK: Check if slot is still free
        //Ideally this should be a DB constraint or stored proc, but for MVP client-side check is better than nothing.
        const activeBookings = await BookingService.getAvailableSlots(new Date(bookingDetails.date), bookingDetails.providerId);
        // getAvailableSlots logic: returns available slots.

        // Re-implementing specific check for speed and clarity
        const { data: existing } = await db.from('bookings')
            .select('id')
            .eq('provider_id', bookingDetails.providerId)
            .eq('service_date', bookingDetails.date) // ensure date string format matches
            .eq('start_time', bookingDetails.time) // "09:00" or "09:00:00"
            .in('status', ['pending', 'confirmed'])
            .maybeSingle();

        if (existing) {
            throw new Error("This slot is already booked. Please choose another time.");
        }

        // --- PAYMENT LOGIC ---
        if (bookingDetails.price && bookingDetails.price > 0) {
            console.log(`Processing payment of ${bookingDetails.price} THB...`);
            try {
                const providerWalletId = await BookingService.getProviderWalletId(bookingDetails.providerId);
                const note = `Booking for ${bookingDetails.serviceName} on ${bookingDetails.date}`;

                await WalletService.transferFunds(providerWalletId, bookingDetails.price, note);

                // --- VIBE REWARD ---
                // Rule: 10 Vibes per 100 THB
                const vibesToAward = Math.floor(bookingDetails.price / 100) * 10;
                if (vibesToAward > 0) {
                    try {
                        await db.rpc('award_vibes', {
                            target_user_id: bookingDetails.userId,
                            amount: vibesToAward,
                            reason: `Booking Reward: ${bookingDetails.serviceName}`,
                            source: 'system_booking'
                        });
                        console.log(`💎 Awarded ${vibesToAward} Vibes for booking!`);
                    } catch (vibeError) {
                        console.warn("Failed to award vibes:", vibeError);
                        // Don't fail the booking for this
                    }
                }

                console.log("Payment successful");
            } catch (paymentError) {
                console.error("Payment failed:", paymentError);
                throw new Error(`Payment failed: ${paymentError.message}`);
            }
        }

        const payload = {
            user_id: bookingDetails.userId,
            provider_id: bookingDetails.providerId,
            service_date: bookingDetails.date,
            start_time: bookingDetails.time,
            end_time: calculateEndTime(bookingDetails.time), // Helper needed or hardcode +1h
            status: 'confirmed', // Auto-confirm for MVP
            service_type: bookingDetails.serviceName
        };

        const { data, error } = await db.from('bookings').insert([payload]).select().single();

        if (error) {
            console.error("Booking insert failed:", error);

            if (bookingDetails.price > 0) {
                console.error("CRITICAL: Payment processed but Booking failed. Initiating refund flow...");
                await WalletService.refundTransaction(
                    await BookingService.getProviderWalletId(bookingDetails.providerId),
                    bookingDetails.price,
                    "System Refund: Booking Insert Failed"
                );
                // Since we can't auto-refund securely yet, we change the error message
                throw new Error("Booking failed, but payment was processed. Please contact support immediately with your transaction details.");
            }

            throw error;
        }

        // NOTIFICATION STUB: Send email to provider
        console.log(`[STUB] Email sent to provider ${bookingDetails.providerId}: New Booking for ${bookingDetails.date} at ${bookingDetails.time}`);

        return data;
    },

    /**
     * Cancel a booking
     * @param {string} bookingId 
     */
    cancelBooking: async (bookingId) => {
        console.log("Cancelling booking:", bookingId);
        const { error } = await db.from('bookings').update({ status: 'cancelled' }).eq('id', bookingId);
        if (error) throw error;
        return true;
    },

    /**
     * Get bookings for a specific user
     * @param {string} userId 
     * @returns {Promise<Object[]>}
     */
    getUserBookings: async (userId) => {
        const { data, error } = await db.from('bookings')
            .select(`
                *,
                service_providers (
                    business_name,
                    category
                )
            `)
            .eq('user_id', userId)
            .order('service_date', { ascending: true }); // Upcoming first?

        if (error) {
            console.error("Error fetching user bookings:", error);
            return [];
        }
        return data;
    },

    /**
     * Get bookings for a specific provider
     * @param {string} providerId 
     * @returns {Promise<Object[]>}
     */
    getProviderBookings: async (providerId) => {
        const { data, error } = await db.from('bookings')
            .select(`
                *,
                profiles:user_id (
                    full_name,
                    email
                )
            `)
            .eq('provider_id', providerId)
            .order('service_date', { ascending: true });

        if (error) {
            console.error("Error fetching provider bookings:", error);
            return [];
        }
        return data;
    },

    /**
     * Update booking status
     * @param {string} bookingId 
     * @param {string} status 'confirmed' | 'cancelled' | 'completed'
     */
    updateBookingStatus: async (bookingId, status) => {
        const { error } = await db.from('bookings').update({ status }).eq('id', bookingId);
        if (error) throw error;
        return true;
    }
};

// Simple helper to add 1 hour
function calculateEndTime(startTime) {
    const [hours, minutes] = startTime.split(':').map(Number);
    const endHours = hours + 1;
    return `${endHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}
