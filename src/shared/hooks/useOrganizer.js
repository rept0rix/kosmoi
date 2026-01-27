import { useState, useEffect, useCallback } from "react";
import { OrganizerService } from "@/features/organizer/services/OrganizerService";
import { useAuth } from "@/features/auth/context/AuthContext";
import { toast } from "sonner"; // Assuming sonner is used

export function useOrganizer() {
  const { user } = useAuth();
  const [trips, setTrips] = useState([]);
  const [activeTrip, setActiveTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all trips on mount
  const fetchTrips = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await OrganizerService.getTrips();
      setTrips(data || []);

      // Auto-select the first active or upcoming trip
      if (data && data.length > 0) {
        // Simple logic: select first one. Improve later to find 'active'
        // Currently just verify if we already have an activeTrip selected from local state or URL?
        // For now, default to the first one if none selected.
        const active = data.find((t) => t.status === "active") || data[0];
        fetchTripDetails(active.id);
      } else {
        setLoading(false);
      }
    } catch (err) {
      console.error("Failed to fetch trips", err);
      setError(err);
      setLoading(false);
    }
  }, [user]);

  // Fetch details for a specific trip
  const fetchTripDetails = async (tripId) => {
    setLoading(true);
    try {
      const tripDetails = await OrganizerService.getTripDetails(tripId);
      setActiveTrip(tripDetails);
    } catch (err) {
      console.error("Failed to fetch trip details", err);
      toast.error("Failed to load trip details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  // Actions
  const createTrip = async (tripData) => {
    try {
      const newTrip = await OrganizerService.createTrip({
        ...tripData,
        user_id: user.id,
      });
      await fetchTrips(); // Refresh list
      return newTrip;
    } catch (err) {
      console.error("Create Trip Failed", err);
      throw err;
    }
  };

  const addItemToTrip = async (itemData) => {
    if (!activeTrip) return;
    try {
      const newItem = await OrganizerService.addTripItem({
        ...itemData,
        trip_id: activeTrip.id,
      });
      // Optimistic update or refresh
      const updatedItems = [...(activeTrip.items || []), newItem[0]]; // supabase returns array
      setActiveTrip({ ...activeTrip, items: updatedItems });
      toast.success("Added to trip!");
      return newItem;
    } catch (err) {
      console.error("Add Item Failed", err);
      toast.error("Failed to add item");
      throw err;
    }
  };

  const removeItemFromTrip = async (itemId) => {
    try {
      await OrganizerService.removeTripItem(itemId);
      const updatedItems = activeTrip.items.filter((i) => i.id !== itemId);
      setActiveTrip({ ...activeTrip, items: updatedItems });
      toast.success("Item removed");
    } catch (err) {
      console.error("Remove Item Failed", err);
      toast.error("Failed to remove item");
    }
  };

  return {
    trips,
    activeTrip,
    loading,
    error,
    actions: {
      createTrip,
      fetchTripDetails,
      addItemToTrip,
      removeItemFromTrip,
      refresh: fetchTrips,
    },
  };
}
