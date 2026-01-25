// @ts-nocheck
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "@/api/supabaseClient";
import { useQuery } from "@tanstack/react-query";
import { NeonButton } from "@/components/ui/NeonButton";
import { GlassCard } from "@/components/ui/GlassCard";
import { getCategoryIcon } from "@/shared/utils/mapIcons";
import { ScoutSearch } from "@/features/scout/components/ScoutSearch";
import { toast } from "sonner";
import GoogleMap from "../components/GoogleMap";
import MapProviderCard from "@/components/MapProviderCard";
import { cn } from "@/lib/utils";

const CYBERPUNK_MAP_STYLES = [
  { elementType: "geometry", stylers: [{ color: "#0f172a" }] }, // Slate 900
  { elementType: "labels.text.stroke", stylers: [{ color: "#1e293b" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#94a3b8" }] }, // Slate 400
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#38bdf8" }],
  }, // Cyan
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d946ef" }],
  }, // Pink
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#059669" }],
  }, // Green
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#334155" }],
  }, // Slate 700
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#1e293b" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#475569" }],
  }, // Slate 600
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#1e293b" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#1e1b4b" }],
  }, // Indigo 950
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#818cf8" }],
  },
];

export default function MapView() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState(
    urlParams.get("category") || "all",
  );
  const [mapCenter, setMapCenter] = useState({ lat: 9.5, lng: 100.0 });
  const [mapZoom, setMapZoom] = useState(13);
  const [userLocation, setUserLocation] = useState(null);
  const [selectedProvider, setSelectedProvider] = useState(null);

  const { data: providers, isLoading } = useQuery({
    queryKey: ["serviceProviders"],
    queryFn: () => db.entities.ServiceProvider.filter({ status: "active" }),
    initialData: [],
  });

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(location);
          if (
            !mapCenter ||
            (mapCenter.lat === 9.5 && mapCenter.lng === 100.0)
          ) {
            setMapCenter(location);
          }
        },
        (error) => console.log("Location access denied"),
      );
    }
  }, []);

  const mapMarkers = (providers || []).map((provider) => ({
    lat: provider.latitude,
    lng: provider.longitude,
    title: provider.business_name,
    icon: getCategoryIcon(provider.category),
    onClick: () => setSelectedProvider(provider),
  }));

  const handleScoutAction = (action) => {
    if (action.name === "move_map") {
      const { lat, lng, zoom } = action.data || action.payload || {};
      if (lat && lng) {
        setMapCenter({ lat, lng });
        if (zoom) setMapZoom(zoom);
      }
    } else if (action.name === "filter_map") {
      const { category } = action.data || action.payload || {};
      if (category) {
        setCategoryFilter(category);
        toast.info(`Filtered map by ${category}`);
      }
    } else if (action.name === "search_places") {
      const { query } = action.data || action.payload || {};
      if (query) {
        toast.info(`🛰️ Hybrid Search Initiated: "${query}"`);

        // Invoke Edge Function
        db.functions
          .invoke("sales-scout", {
            action: "search_places",
            query: query,
          })
          .then(({ data, error }) => {
            if (error) {
              console.error("Hybrid Search Error:", error);
              toast.error("Search Uplink Failed.");
              return;
            }
            if (data && data.success && data.results.length > 0) {
              const bestMatch = data.results[0];
              toast.success(`🎯 Found & Ingested: ${bestMatch.business_name}`);

              // Center Map & Select
              setMapCenter({
                lat: bestMatch.latitude,
                lng: bestMatch.longitude,
              });
              setMapZoom(16);
              setSelectedProvider(bestMatch);

              // Invalidate query to refresh markers (using a hack if we don't have access to queryClient here)
              // Ideally: queryClient.invalidateQueries(['serviceProviders'])
              // For now, simple selection is enough to show immediate feedback
            } else {
              toast.warning(`No new signals found for "${query}"`);
            }
          });
      }
    }
  };

  const handleMapClick = async (e) => {
    if (e.placeId) {
      // It's a Google POI! Auto-Scout it.
      toast.info("🛰️ Ghost Signal Detected... Analyzing...");
      console.log("Scouting Place ID:", e.placeId);

      try {
        const { data, error } = await db.functions.invoke("sales-scout", {
          action: "scout_details",
          place_id: e.placeId,
        });

        if (error) throw error;

        if (data && data.success) {
          toast.success(`✨ Entity Materialized: ${data.place.business_name}`);
          // Select it immediately
          setSelectedProvider(data.place);
          // Refresh map data (in a real app, invalidate query)
          // For now, we manually push to list or let SWR revalidate if possible
          // But since 'providers' is from useQuery, we should invalidate
        } else {
          toast.error("Scout Report Failed: Signal lost.");
        }
      } catch (err) {
        console.error("Auto-Scout Error:", err);
        toast.error("Satellite Uplink Failed.");
      }
    } else {
      console.log("Map clicked:", e);
    }
  };

  return (
    <div className="h-[calc(100vh-56px)] flex flex-col bg-[#030712] relative overflow-hidden">
      {/* Search Bar - Floating Style */}
      <div className="absolute top-4 left-4 right-4 z-10 pointer-events-none flex justify-center">
        <div className="w-full max-w-2xl pointer-events-auto">
          <ScoutSearch onMapAction={handleScoutAction} />
        </div>
      </div>

      {/* Map Container */}
      <div className="flex-1 relative z-0">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full text-neon-cyan">
            <div className="w-8 h-8 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin mb-4" />
            <div className="font-mono text-xs tracking-widest uppercase">
              Initializing Sat-Link...
            </div>
          </div>
        ) : (
          <GoogleMap
            center={mapCenter}
            zoom={mapZoom}
            height="100%"
            markers={mapMarkers}
            userLocation={userLocation}
            options={{
              styles: CYBERPUNK_MAP_STYLES,
              disableDefaultUI: true,
              zoomControl: false,
              mapTypeControl: false,
              fullscreenControl: false,
              streetViewControl: false,
            }}
            onMapClick={handleMapClick}
          />
        )}

        {/* Selected Provider Card - Floating Bottom */}
        {selectedProvider && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-full max-w-md px-4 z-20">
            <GlassCard
              variant="premium"
              className="relative p-0 overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]"
            >
              <button
                onClick={() => setSelectedProvider(null)}
                className="absolute top-2 right-2 text-white/50 hover:text-white z-20 bg-black/20 rounded-full p-1"
              >
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
              <MapProviderCard
                provider={selectedProvider}
                onClose={() => setSelectedProvider(null)}
                className="bg-transparent border-0 shadow-none text-slate-100"
              />
              {/* Decorative Glow */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-pink" />
            </GlassCard>
          </div>
        )}
      </div>

      {/* Decorative Grid Overlay (Pointer events none) */}
      <div className="absolute inset-0 pointer-events-none z-[5] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 mix-blend-overlay" />
    </div>
  );
}
