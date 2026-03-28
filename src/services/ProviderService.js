import { realSupabase as supabase } from "../api/supabaseClient.js";

/**
 * ProviderService
 * Centralised data access for service provider operations.
 * Use this instead of direct Supabase queries in provider pages.
 */
export const ProviderService = {
  /**
   * Get provider profile for the currently authenticated user.
   * Matches on either id or owner_id.
   * @returns {Promise<{data: object|null, error: any}>}
   */
  getMyProfile: async () => {
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) return { data: null, error: authError };

      const { data, error } = await supabase
        .from("service_providers")
        .select("*")
        .or(`id.eq.${user.id},owner_id.eq.${user.id}`)
        .maybeSingle();

      return { data, error };
    } catch (e) {
      console.error("ProviderService.getMyProfile:", e);
      return { data: null, error: e };
    }
  },

  /**
   * Get provider profile by provider ID.
   * @param {string} providerId
   * @returns {Promise<{data: object|null, error: any}>}
   */
  getProfileById: async (providerId) => {
    try {
      const { data, error } = await supabase
        .from("service_providers")
        .select("*")
        .eq("id", providerId)
        .single();

      return { data, error };
    } catch (e) {
      console.error("ProviderService.getProfileById:", e);
      return { data: null, error: e };
    }
  },

  /**
   * Update the provider's online status and optional location.
   * @param {string} ownerId - The auth user ID (owner_id)
   * @param {boolean} isOnline
   * @param {{ lat: number, lng: number } | null} location
   * @returns {Promise<{error: any}>}
   */
  setOnlineStatus: async (ownerId, isOnline, location = null) => {
    try {
      const updates = {
        is_online: isOnline,
        last_seen: new Date().toISOString(),
        ...(location
          ? { current_lat: location.lat, current_lng: location.lng }
          : {}),
      };

      const { error } = await supabase
        .from("service_providers")
        .update(updates)
        .eq("owner_id", ownerId);

      return { error };
    } catch (e) {
      console.error("ProviderService.setOnlineStatus:", e);
      return { error: e };
    }
  },

  /**
   * Update provider profile fields.
   * @param {string} providerId
   * @param {object} updates
   * @returns {Promise<{data: object|null, error: any}>}
   */
  updateProfile: async (providerId, updates) => {
    try {
      const { data, error } = await supabase
        .from("service_providers")
        .update(updates)
        .eq("id", providerId)
        .select()
        .single();

      return { data, error };
    } catch (e) {
      console.error("ProviderService.updateProfile:", e);
      return { data: null, error: e };
    }
  },

  /**
   * Get today's earnings for a provider.
   * @param {string} ownerId - The auth user ID
   * @returns {Promise<{total: number, error: any}>}
   */
  getDailyEarnings: async (ownerId) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data: wallet, error: walletError } = await supabase
        .from("wallets")
        .select("id")
        .eq("user_id", ownerId)
        .single();

      if (walletError || !wallet) return { total: 0, error: walletError };

      const { data, error } = await supabase
        .from("transactions")
        .select("amount")
        .eq("wallet_id", wallet.id)
        .eq("type", "earning")
        .eq("status", "completed")
        .gte("created_at", today.toISOString());

      if (error) return { total: 0, error };

      const total = (data || []).reduce(
        (sum, txn) => sum + (Number(txn.amount) || 0),
        0,
      );

      return { total, error: null };
    } catch (e) {
      console.error("ProviderService.getDailyEarnings:", e);
      return { total: 0, error: e };
    }
  },

  /**
   * Accept an incoming service request job.
   * @param {string} jobId
   * @param {string} providerId
   * @returns {Promise<{error: any}>}
   */
  acceptJob: async (jobId, providerId) => {
    try {
      const { error } = await supabase
        .from("service_requests")
        .update({
          status: "accepted",
          provider_id: providerId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", jobId);

      return { error };
    } catch (e) {
      console.error("ProviderService.acceptJob:", e);
      return { error: e };
    }
  },

  /**
   * Subscribe to real-time updates for a provider's incoming jobs.
   * @param {string} providerId
   * @param {function} onJob - Called with new job data
   * @returns {object} Supabase channel (call .unsubscribe() to clean up)
   */
  subscribeToJobs: (providerId, onJob) => {
    return supabase
      .channel(`provider-jobs-${providerId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "service_requests",
          filter: `provider_id=eq.${providerId}`,
        },
        (payload) => onJob(payload.new),
      )
      .subscribe();
  },
};
