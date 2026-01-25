import React, { useState } from "react";
import GoogleMap from "@/components/GoogleMap";
import { GlassCard } from "@/components/ui/GlassCard";
import { User } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const CYBERPUNK_MAP_STYLES = [
  { elementType: "geometry", stylers: [{ color: "#0f172a" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#1e293b" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#94a3b8" }] },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#38bdf8" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d946ef" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#059669" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#334155" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#1e293b" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#475569" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#1e293b" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#1e1b4b" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#818cf8" }],
  },
];

export default function LiveMap({ businesses = [] }) {
  const [selectedProvider, setSelectedProvider] = useState(null);

  // Map businesses to ensure we have lat/lng - support both field name formats
  const visibleProviders = businesses
    .filter(
      (p) => (p.current_lat || p.latitude) && (p.current_lng || p.longitude),
    )
    .map((p) => ({
      ...p,
      current_lat: p.current_lat || p.latitude,
      current_lng: p.current_lng || p.longitude,
    }));

  // Calculate center based on first user or default to Samui
  const mapCenter =
    visibleProviders.length > 0
      ? {
          lat: visibleProviders[0].current_lat,
          lng: visibleProviders[0].current_lng,
        }
      : { lat: 9.512017, lng: 100.013593 };

  return (
    <div className="h-[600px] w-full relative rounded-xl overflow-hidden border border-white/10 shadow-2xl">
      <GoogleMap
        center={mapCenter}
        zoom={12}
        height="100%"
        markers={visibleProviders.map((p) => ({
          lat: p.current_lat,
          lng: p.current_lng,
          title: p.business_name || "Provider",
          icon: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png", // Drivers/Providers are blue
          onClick: () => setSelectedProvider(p),
        }))}
        options={{
          disableDefaultUI: false,
          styles: CYBERPUNK_MAP_STYLES,
        }}
      />

      {/* Overlay Stats */}
      <div className="absolute top-4 left-4 flex flex-col gap-2">
        <GlassCard variant="default" className="p-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-neon-blue animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
            <span className="font-bold text-slate-100">
              {visibleProviders.length} Providers
            </span>
          </div>
        </GlassCard>
      </div>

      {/* Provider Detail Overlay */}
      {selectedProvider && (
        <div className="absolute bottom-4 left-4 right-4 md:right-auto md:w-80">
          <GlassCard
            variant="premium"
            className="p-4 animate-in slide-in-from-bottom-5"
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-bold text-lg text-white">
                  {selectedProvider.business_name}
                </h3>
                <p className="text-sm text-slate-400 flex items-center gap-1">
                  <User className="w-3 h-3 text-neon-cyan" />
                  {selectedProvider.contact_email || "No email"}
                </p>
              </div>
              <button
                onClick={() => setSelectedProvider(null)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                x
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-3">
              <div className="bg-slate-900/50 border border-white/5 p-2 rounded text-center">
                <p className="text-xs text-slate-500">Status</p>
                <Badge
                  variant="outline"
                  className="mt-1 border-green-500/50 text-green-400 bg-green-500/10"
                >
                  Online
                </Badge>
              </div>
              <div className="bg-slate-900/50 border border-white/5 p-2 rounded text-center">
                <p className="text-xs text-slate-500">Last Seen</p>
                <p className="text-xs font-mono mt-1 text-neon-blue">
                  {selectedProvider.last_seen
                    ? new Date(selectedProvider.last_seen).toLocaleTimeString()
                    : "N/A"}
                </p>
              </div>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}
