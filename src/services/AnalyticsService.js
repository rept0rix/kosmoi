import { supabase } from '../api/supabaseClient';

export const AnalyticsService = {
    /**
     * Log an event to the analytics_events table
     * @param {string} eventName - The name of the event (e.g., 'page_view', 'button_click')
     * @param {object} properties - Additional properties for the event
     * @param {string} userId - Optional user ID if authenticates
     */
    logEvent: async (eventName, properties = {}, userId = null) => {
        try {
            // Get session if userId is not provided
            if (!userId) {
                const { data: { session } } = await supabase.auth.getSession();
                userId = session?.user?.id || null;
            }

            const payload = {
                event_name: eventName,
                properties: properties, // Mapped to 'properties' column in DB
                user_id: userId,
                // page_url is not in the schema shown in create_analytics_schema.sql, checking...
                // The schema has: id, event_name, user_id, properties, created_at
                // So page_url should probably go INSIDE properties
            };

            // Moving page_url and timestamp to properties if they aren't columns
            // But wait, created_at is auto generated if not sent, or I can send it.
            // Let's check schema again. Schema has created_at default NOW().
            // I will put page_url inside properties to be safe.

            const finalPayload = {
                event_name: eventName,
                user_id: userId,
                properties: { ...properties, page_url: window.location.pathname },
                // created_at: new Date().toISOString() // Let DB handle it or send it
            };

            // Fire and forget (don't await to avoid blocking UI)
            supabase.from('analytics_events').insert([finalPayload]).then(({ error }) => {
                if (error) console.warn('Analytics logging failed:', error);
            });

        } catch (err) {
            console.warn('Analytics error:', err);
        }
    },

    /**
     * Track a page view
     * @param {string} pageName 
     */
    trackPageView: (pageName) => {
        AnalyticsService.logEvent('page_view', { page_name: pageName });
    }
};
