import { api } from "@/core/api/client";
import { realSupabase as supabase } from "@/api/supabaseClient";

export const OrganizerService = {
  /**
   * Get all trips for the current user
   */
  getTrips: async () => {
    return await api.request({
      table: "trips",
      method: "GET",
      options: {
        order: { column: "start_date", ascending: true },
      },
    });
  },

  /**
   * Get a specific trip and its items
   */
  getTripDetails: async (tripId) => {
    // Parallel fetch for trip and items
    // We don't use api.request for join queries easily, so separate calls or standard supabase join

    // Using standard supabase for joined/complex query or 2 api requests
    try {
      const { data: trip, error: tripError } = await supabase
        .from("trips")
        .select("*")
        .eq("id", tripId)
        .single();

      if (tripError) throw tripError;

      const { data: items, error: itemsError } = await supabase
        .from("trip_items")
        .select("*")
        .eq("trip_id", tripId)
        .order("start_time", { ascending: true });

      if (itemsError) throw itemsError;

      return { ...trip, items };
    } catch (e) {
      console.error("OrganizerService: getTripDetails failed", e);
      throw e;
    }
  },

  /**
   * Create a new trip
   */
  createTrip: async (tripData) => {
    // tripData: { name, start_date, end_date, user_id }
    return await api.request({
      table: "trips",
      method: "POST",
      data: tripData,
    });
  },

  /**
   * Add an item to a trip
   */
  addTripItem: async (itemData) => {
    return await api.request({
      table: "trip_items",
      method: "POST",
      data: itemData,
    });
  },

  /**
   * Update a trip item (move, resize, edit)
   */
  updateTripItem: async (itemId, updates) => {
    return await api.request({
      table: "trip_items",
      method: "PATCH",
      filters: { id: itemId },
      data: updates,
    });
  },

  /**
   * Remove an item
   */
  removeTripItem: async (itemId) => {
    return await api.request({
      table: "trip_items",
      method: "DELETE",
      filters: { id: itemId },
    });
  },

  /**
   * Goals Management
   */
  getGoals: async () => {
    return await api.request({
      table: "goals",
      method: "GET",
      options: {
        order: { column: "created_at", ascending: false },
      },
    });
  },

  createGoal: async (goalData) => {
    return await api.request({
      table: "goals",
      method: "POST",
      data: goalData,
    });
  },

  updateGoal: async (goalId, updates) => {
    return await api.request({
      table: "goals",
      method: "PATCH",
      filters: { id: goalId },
      data: updates,
    });
  },

  deleteGoal: async (goalId) => {
    return await api.request({
      table: "goals",
      method: "DELETE",
      filters: { id: goalId },
    });
  },
};
