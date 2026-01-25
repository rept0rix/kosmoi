import React, { useState } from "react";
import { AmadeusService } from "../services/integrations/AmadeusService";
import { Search, Calendar, Users, MapPin, Loader2, Star } from "lucide-react";
import { toast } from "react-hot-toast";

export const HotelSearchExternal = () => {
  const [cityCode, setCityCode] = useState("USM");
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchPerformed, setSearchPerformed] = useState(false);

  // Default dates (tomorrow to +2 days)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfter = new Date();
  dayAfter.setDate(dayAfter.getDate() + 3);

  const [dates, setDates] = useState({
    checkIn: tomorrow.toISOString().split("T")[0],
    checkOut: dayAfter.toISOString().split("T")[0],
  });
  const [adults, setAdults] = useState(1);

  const handleSearch = async () => {
    setLoading(true);
    setSearchPerformed(true);
    try {
      // 1. Get Hotel List
      const hotelList = await AmadeusService.searchHotels(cityCode);
      if (!hotelList || hotelList.length === 0) {
        setHotels([]);
        toast.error("No hotels found for this city.");
        return;
      }

      // 2. Get Offers for the first 10 hotels (to avoid massive API calls in test mode)
      const hotelIds = hotelList.slice(0, 5).map((h) => h.hotelId);
      const offers = await AmadeusService.getHotelOffers(hotelIds, {
        adults,
        checkInDate: dates.checkIn,
        checkOutDate: dates.checkOut,
      });

      setHotels(offers || []);
    } catch (error) {
      console.error("Hotel search error:", error);
      toast.error("Failed to fetch hotel offers. Ensure API keys are set.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-8 bg-white/50 backdrop-blur-xl rounded-3xl border border-gray-100 shadow-2xl overflow-hidden mt-10">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Global Hotel Search
        </h2>
        <p className="text-gray-500">
          Live inventory and pricing direct from Amadeus
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="relative">
          <MapPin className="absolute left-3 top-3 text-gray-400" size={20} />
          <input
            type="text"
            value={cityCode}
            onChange={(e) => setCityCode(e.target.value.toUpperCase())}
            placeholder="City Code (e.g. USM)"
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-100 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          />
        </div>
        <div className="relative">
          <Calendar className="absolute left-3 top-3 text-gray-400" size={20} />
          <input
            type="date"
            value={dates.checkIn}
            onChange={(e) => setDates({ ...dates, checkIn: e.target.value })}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-100 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          />
        </div>
        <div className="relative">
          <Users className="absolute left-3 top-3 text-gray-400" size={20} />
          <select
            value={adults}
            onChange={(e) => setAdults(Number(e.target.value))}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-100 focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none"
          >
            {[1, 2, 3, 4].map((n) => (
              <option key={n} value={n}>
                {n} {n === 1 ? "Adult" : "Adults"}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={handleSearch}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2 group shadow-lg shadow-blue-200"
        >
          {loading ? (
            <Loader2 className="animate-spin" />
          ) : (
            <Search
              size={20}
              className="group-hover:scale-110 transition-transform"
            />
          )}
          Search
        </button>
      </div>

      {searchPerformed && !loading && hotels.length === 0 && (
        <div className="text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
          <MapPin className="mx-auto text-gray-300 mb-4" size={48} />
          <p className="text-gray-500 font-medium">
            No hotel offers found for these parameters.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {hotels.map((item, idx) => (
          <div
            key={idx}
            className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
          >
            <div className="p-5 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold text-gray-800 line-clamp-1 group-hover:text-blue-600 transition-colors">
                    {item.hotel.name}
                  </h3>
                  <div className="flex items-center gap-1 text-amber-500 mt-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        size={14}
                        fill={
                          s <= (item.hotel.rating || 3)
                            ? "currentColor"
                            : "none"
                        }
                      />
                    ))}
                    <span className="text-xs text-gray-400 ml-1">
                      Amadeus Verified
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black text-blue-600">
                    {item.offers?.[0]?.price?.total}
                  </div>
                  <div className="text-xs text-gray-400 font-medium uppercase">
                    {item.offers?.[0]?.price?.currency} / night
                  </div>
                </div>
              </div>

              <div className="p-3 bg-gray-50 rounded-xl space-y-1">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Room Type
                </p>
                <p className="text-sm text-gray-700 font-medium">
                  {item.offers?.[0]?.room?.typeEstimated?.category ||
                    "Standard Room"}
                </p>
              </div>

              <button className="w-full py-3 bg-gray-50 hover:bg-blue-600 hover:text-white text-blue-600 font-bold rounded-xl transition-all border border-blue-50 hover:border-blue-600">
                View Full Availability
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HotelSearchExternal;
