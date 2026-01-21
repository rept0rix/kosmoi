import { supabase } from '@/api/supabaseClient';

export const AdService = {
  /**
   * Fetch relevant ads based on keywords/intent
   * @param {string} text - User's message or search query
   * @param {object} location - {lat, lng} (optional)
   * @returns {Promise<Array>}
   */
  getAdsForContext: async (text, location = null) => {
    if (!text) return [];

    try {
      // 1. Simple Keyword Matching (case-insensitive)
      // In a real AI system, we'd use embeddings. For MVP, we match common words.
      const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 3);
      if (words.length === 0) return [];

      // Construct a Postgres array overlap query
      // "keywords && ARRAY['word1', 'word2']"
      
      const { data: ads, error } = await supabase
        .from('ads')
        .select(`
            *,
            service_providers (
                business_name,
                logo_url
            )
        `)
        .eq('status', 'active')
        .overlaps('keywords', words)
        .limit(2);

      if (error) {
        console.error("AdService Error:", error);
        return [];
      }

      if (!ads || ads.length === 0) return [];

      // 2. Track Impressions (Async)
      ads.forEach(ad => AdService.trackImpression(ad.id));

      return ads;
    } catch (err) {
      console.error(err);
      return [];
    }
  },

  /**
   * Log an impression (view)
   */
  trackImpression: async (adId) => {
    try {
      await supabase.from('ad_impressions').insert({
        ad_id: adId,
        event_type: 'view'
      });
    } catch (e) {
      // Ignore errors for analytics to avoid blocking UI
      console.warn("Failed to track impression", e);
    }
  },

  /**
   * Log a click
   */
  trackClick: async (adId) => {
    try {
       await supabase.from('ad_impressions').insert({
        ad_id: adId,
        event_type: 'click'
      });
    } catch (e) {
      console.error(e);
    }
  }
};
