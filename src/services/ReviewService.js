import { supabase } from '@/api/supabaseClient';

export const ReviewService = {
    // Get reviews for a provider
    getReviews: async (providerId, limit = 10) => {
        const { data, error } = await supabase
            .from('reviews')
            .select('*, user:user_id(raw_user_meta_data)')
            .eq('provider_id', providerId)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return data;
    },

    // Add a new review
    addReview: async (providerId, rating, comment) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Must be logged in to review");

        const { data, error } = await supabase
            .from('reviews')
            .insert({
                provider_id: providerId,
                user_id: user.id,
                rating,
                comment
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Get a specific user's review for a provider (to check existing)
    getUserReview: async (providerId) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        const { data, error } = await supabase
            .from('reviews')
            .select('*')
            .eq('provider_id', providerId)
            .eq('user_id', user.id)
            .maybeSingle();

        if (error) throw error;
        return data;
    }
};
