import { InvokeAmadeus } from "../../api/integrations.js";

/**
 * Service to handle Hotel-related data from Amadeus API.
 * This is primarily for external (non-proprietary) accommodation listings.
 */
export const AmadeusService = {
  /**
   * Search for hotels in a specific city (defaults to USM for Koh Samui)
   */
  searchHotels: async (cityCode = "USM") => {
    try {
      const response = await InvokeAmadeus({
        action: "search-hotels",
        params: { cityCode },
      });

      if (response.error) throw new Error(response.error);

      // Transform Amadeus results to a flatter format if needed
      return response.data || [];
    } catch (error) {
      console.error("Amadeus searchHotels error:", error);
      return [];
    }
  },

  /**
   * Get live pricing/offers for specific hotels.
   * @param {string|string[]} hotelIds
   * @param {Object} options { adults, checkInDate, checkOutDate }
   */
  getHotelOffers: async (
    hotelIds,
    { adults = 1, checkInDate, checkOutDate } = {},
  ) => {
    try {
      const ids = Array.isArray(hotelIds) ? hotelIds.join(",") : hotelIds;
      const response = await InvokeAmadeus({
        action: "hotel-offers",
        params: {
          hotelIds: ids,
          adults,
          checkInDate,
          checkOutDate,
        },
      });

      if (response.error) throw new Error(response.error);

      return response.data || [];
    } catch (error) {
      console.error("Amadeus getHotelOffers error:", error);
      return [];
    }
  },

  /**
   * Get details for a specific hotel ID
   */
  getHotelDetails: async (hotelId) => {
    try {
      const response = await InvokeAmadeus({
        action: "hotel-details",
        params: { hotelId },
      });

      if (response.error) throw new Error(response.error);

      return response.data?.[0] || null;
    } catch (error) {
      console.error("Amadeus getHotelDetails error:", error);
      return null;
    }
  },
};
