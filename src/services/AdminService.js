import { createClient } from "@supabase/supabase-js";
import { realSupabase as supabase } from "../api/supabaseClient.js";

import { SendEmail } from "@/api/integrations";
import { EmailTemplates } from "./EmailTemplates.js";
import { ActivityLogService } from "./ActivityLogService";

/**
 * AdminService
 * centralised service for fetching platform-wide data.
 */
export const AdminService = {
  /**
   * Get all users (Signups)
   * Note: This fetches from 'users' public table which mirrors auth.users
   * @returns {Promise<{data: any[], error: any}>}
   */
  getUsers: async () => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.warn("AdminService: Users fetch failed", error);
        return { data: [], error };
      }
      return { data, error: null };
    } catch (e) {
      console.error("AdminService Error:", e);
      return { data: [], error: e };
    }
  },

  /**
   * Get all businesses (Service Providers)
   */

  getBusinesses: async () => {
    try {
      const { data, error } = await supabase
        .from("service_providers")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.warn("AdminService: Businesses fetch failed", error);
        return [];
      }
      return data;
    } catch (e) {
      console.error("AdminService Error:", e);
      return [];
    }
  },

  /**
   * Get ALL business locations (Lightweight for Map)
   */
  getMapLocations: async () => {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      // Fetch ONLY what is needed for the map
      // Fixed column names to match DB schema: current_lat, current_lng
      const response = await fetch(
        `${supabaseUrl}/rest/v1/service_providers?select=id,business_name,current_lat,current_lng,email,category&order=created_at.desc`,
        {
          headers: {
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) throw new Error(`Map fetch failed: ${response.status}`);

      const data = await response.json();

      // Map to expected format for LiveMap
      return data.map((item) => ({
        ...item,
        current_lat: item.latitude,
        current_lng: item.longitude,
        contact_email: item.email,
        is_online: false, // Default to false since column doesn't exist
      }));
    } catch (e) {
      console.error("AdminService map error:", e);
      throw e;
    }
  },

  /**
   * Get businesses with pagination and filtering
   */
  getBusinessesPage: async (page = 1, limit = 50, filters = {}) => {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      const offset = (page - 1) * limit;

      let query = `${supabaseUrl}/rest/v1/service_providers?select=*&order=created_at.desc&limit=${limit}&offset=${offset}`;

      // Apply Filters
      if (filters.search) {
        query += `&business_name=ilike.*${encodeURIComponent(filters.search)}*`;
      }
      if (filters.category && filters.category !== "all") {
        query += `&category=eq.${encodeURIComponent(filters.category)}`;
      }
      if (filters.status && filters.status !== "all") {
        query += `&status=eq.${encodeURIComponent(filters.status)}`;
      }

      // Fetch full data but paginated
      const response = await fetch(query, {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
          Prefer: "count=exact",
        },
      });

      if (!response.ok)
        throw new Error(`List fetch failed: ${response.status}`);

      const data = await response.json();

      // Extract total count from Content-Range header (format: 0-49/5800)
      const contentRange = response.headers.get("content-range");
      const total = contentRange ? parseInt(contentRange.split("/")[1]) : 0;

      return { data, total };
    } catch (e) {
      console.error("AdminService page error:", e);
      throw e;
    }
  },

  /**
   * Get all bookings (Admin)
   */
  getBookings: async () => {
    try {
      const { data, error } = await supabase
        .from("bookings")
        .select(
          `
                    *,
                    profiles:user_id (
                        full_name,
                        email
                    ),
                    service_providers (
                        business_name,
                        category
                    )
                `,
        )
        .order("service_date", { ascending: false });

      if (error) {
        console.warn("AdminService: Bookings fetch failed", error);
        return { data: [], error };
      }
      return { data, error: null };
    } catch (e) {
      console.error("AdminService Error:", e);
      return { data: [], error: e };
    }
  },

  /**
   * Get ALL Transactions (Admin Finance)
   */
  getAllTransactions: async () => {
    try {
      // Admin should see all transactions.
      // Ensure RLS policy exists for 'admins' role to select * from transactions.
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (e) {
      console.error("AdminService Transactions Error:", e);
      return { data: [], error: e };
    }
  },

  /**
   * Get Platform Stats (Revenue, MRR, Counts)
   */
  getStats: async () => {
    try {
      // Try calling the RPC function first for speed
      const { data, error } = await supabase.rpc("get_admin_stats");

      if (!error && data) {
        return data;
      }

      // Fallback: Client-side calculation if RPC not created yet
      console.warn("RPC get_admin_stats missing, calculating client-side...");
      const { data: users } = await AdminService.getUsers();
      const businesses = await AdminService.getBusinesses();

      let mrr = 0;
      const activeSubs = businesses.filter(
        (b) => b.badge === "verified",
      ).length;
      mrr = activeSubs * 29;

      return {
        totalUsers: users.length,
        totalBusinesses: businesses.length,
        mrr: mrr,
        activeSubscriptions: activeSubs,
      };
    } catch (e) {
      console.error("Stats Error:", e);
      return {
        totalUsers: 0,
        totalBusinesses: 0,
        mrr: 0,
        activeSubscriptions: 0,
      };
    }
  },

  /**
   * Ban/Unban User
   */
  toggleUserBan: async (userId) => {
    try {
      const { error } = await supabase.rpc("admin_ban_user", {
        target_user_id: userId,
      });
      if (error) throw error;
      return true;
    } catch (e) {
      console.error("Ban Failed:", e);
      return false;
    }
  },

  /**
   * Verify/Unverify Business
   */
  toggleBusinessVerification: async (businessId) => {
    try {
      const { error } = await supabase.rpc("admin_verify_business", {
        target_business_id: businessId,
      });
      if (error) throw error;
      return true;
    } catch (e) {
      console.error("Verification Failed:", e);
      return false;
    }
  },

  /**
   * Send Invitation Email
   */
  sendInvitationEmail: async (email, businessName, link) => {
    const html = EmailTemplates.getInvitationEmail(businessName, link);
    return await SendEmail({
      to: email,
      subject: "Claim your Samui Service Hub Profile",
      html: html,
    });
  },

  /**
   * Send Role Update Notification
   */
  sendRoleUpdateEmail: async (email, userName, newRole) => {
    const html = EmailTemplates.getRoleUpdateEmail(userName, newRole);
    return await SendEmail({
      to: email,
      subject: "Your Account Role Has Changed",
      html: html,
    });
  },

  /**
   * Create New Business (Admin)
   */
  createBusiness: async (data) => {
    try {
      const { data: newBiz, error } = await supabase
        .from("service_providers")
        .insert([data])
        .select()
        .single();

      if (error) throw error;
      return { data: newBiz, error: null };
    } catch (e) {
      console.error("AdminService Create Failed:", e);
      return { data: null, error: e };
    }
  },

  /**
   * Update Business Details (Admin)
   */
  updateBusiness: async (id, updates) => {
    try {
      console.log("AdminService: updateBusiness", id, updates);
      const { data, error } = await supabase
        .from("service_providers")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (e) {
      console.error("AdminService Update Failed:", e);
      return { data: null, error: e };
    }
  },

  /**
   * Get All Leads (CRM)
   */
  getLeads: async () => {
    try {
      const { data, error } = await supabase.from("leads").select(`
                    *,
                    user_id (
                        email
                    )
                `); // Assuming user_id links to auth.users, but we can't select email directly usually unless it's a view?
      // Wait, if I can't query auth.users directly via join without a wrapper, this might fail unless I strictly link to public.users?
      // But "user_id" is FK to auth.users.
      // Standard Supabase pattern: usually you have public.profiles.
      // Since public.profiles is missing, I might just fetch leads and separate user fetch or trust the ID.
      // Let's try select * first.

      // Re-attempt safe query
      const { data: simpleData, error: simpleError } = await supabase
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false });

      if (simpleError) throw simpleError;
      return { data: simpleData, error: null };
    } catch (e) {
      console.error("AdminService Leads Error:", e);
      return { data: [], error: e };
    }
  },

  /**
   * Update Lead Status
   */
  updateLeadStatus: async (id, status) => {
    try {
      const { data, error } = await supabase
        .from("leads")
        .update({ status })
        .eq("id", id)
        .select();
      if (error) throw error;
      return { data, error: null };
    } catch (e) {
      console.error("Update Lead Failed:", e);
      return { data: null, error: e };
    }
  },

  /**
   * Update User Role (Admin -> User or User -> Admin)
   */
  updateUserRole: async (userId, newRole) => {
    try {
      console.log(`AdminService: updating role for ${userId} to ${newRole}`);

      // 1. Update public.users table
      const { data, error } = await supabase
        .from("users")
        .update({ role: newRole })
        .eq("id", userId)
        .select();

      if (error) throw error;

      // Note: We cannot update auth.users metadata directly from client-side SDK usually,
      // unless we have a specific RPC or Edge Function.
      // However, our AuthContext reads from public.users, so this is sufficient for App-level RBAC.
      // Attempts to update app_metadata usually require Service Role key in backend.

      return { data, error: null };
    } catch (e) {
      console.error("Update Role Failed:", e);
      return { data: null, error: e };
    }
  },

  /**
   * Delete User (Admin Only)
   * Calls RPC 'admin_delete_user'
   */
  deleteUser: async (userId) => {
    try {
      console.log(`AdminService: Deleting user ${userId} via RPC`);
      const { error } = await supabase.rpc("admin_delete_user", {
        target_user_id: userId,
      });

      if (error) throw error;
      return { error: null };
    } catch (e) {
      console.error("Delete User Failed:", e);
      return { error: e };
    }
  },

  /**
   * Get User Details (360 View)
   * Fetches Profile, Business, and Wallet data
   */
  getUserDetails: async (userId) => {
    try {
      const [userRes, businessRes, walletRes] = await Promise.all([
        supabase.from("users").select("*").eq("id", userId).single(),
        supabase
          .from("service_providers")
          .select("*")
          .eq("owner_id", userId)
          .maybeSingle(),
        supabase
          .from("wallets")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle(),
      ]);

      return {
        user: userRes.data,
        business: businessRes.data,
        wallet: walletRes.data,
        error: userRes.error || null,
      };
    } catch (e) {
      console.error("Get User Details Failed:", e);
      return { error: e };
    }
  },

  /**
   * Impersonate User (God Mode)
   * Calls secure Edge Function 'admin-actions' to generate a Magic Link.
   * Requires the caller to be an authenticated ADMIN.
   */
  impersonateUser: async (email) => {
    try {
      console.log("AdminService: Requesting impersonation link for", email);

      const { data, error } = await supabase.functions.invoke("admin-actions", {
        body: {
          action: "impersonate_user",
          payload: { email },
        },
      });

      if (error) {
        console.error("Function Error:", error);
        throw new Error(error.message || "Failed to invoke admin function");
      }

      if (!data?.success || !data?.action_link) {
        throw new Error(data?.error || "Failed to generate action link");
      }

      return { data, error: null };
    } catch (e) {
      console.error("Impersonation Failed:", e);
      return { data: null, error: e };
    }
  },

  /**
   * Subscribe to Dashboard Events (Synergy)
   * Listens to changes in users, bookings, and providers
   */
  subscribeToDashboardEvents: (callback) => {
    const channel = supabase
      .channel("admin-dashboard-synergy")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "users" },
        callback,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bookings" },
        callback,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "service_providers" },
        callback,
      )
      .subscribe();

    return channel;
  },

  unsubscribe: async (channel) => {
    if (channel) await supabase.removeChannel(channel);
  },
};
