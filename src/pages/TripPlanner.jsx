// @ts-nocheck
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  MapPin,
  Trash2,
  Plus,
  ArrowRight,
  Save,
  Share2,
  Calendar,
  Loader2,
} from "lucide-react";
import GoogleMap from "../components/GoogleMap";
import { getCategoryIcon } from "@/shared/utils/mapIcons";
import SEO from "@/components/SEO";
import { toast } from "sonner";

export default function TripPlanner({
  activeTrip,
  onAddItem,
  onRemoveItem,
  onCreateTrip,
}) {
  const navigate = useNavigate();

  // Local state for trip creation mode if no active trip
  const [newTripName, setNewTripName] = useState("My Samui Adventure");
  const [newTripDate, setNewTripDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [creating, setCreating] = useState(false);

  // Map state
  const [mapCenter, setMapCenter] = useState({ lat: 9.512, lng: 100.0136 });
  const [mapZoom, setMapZoom] = useState(11);

  const handleCreateTrip = async () => {
    setCreating(true);
    try {
      await onCreateTrip({
        name: newTripName,
        start_date: newTripDate,
      });
      toast.success("New trip created!");
    } catch (e) {
      toast.error("Failed to create trip");
    } finally {
      setCreating(false);
    }
  };

  if (!activeTrip) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] p-8 text-center bg-white dark:bg-slate-900">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6">
          <MapPin className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Start Your Journey</h2>
        <p className="text-gray-500 mb-6 max-w-md">
          Create a trip to start adding places, bookings, and custom stops to
          your itinerary.
        </p>

        <div className="w-full max-w-sm space-y-4 text-left">
          <div>
            <label className="text-sm font-medium mb-1 block">Trip Name</label>
            <Input
              value={newTripName}
              onChange={(e) => setNewTripName(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Start Date</label>
            <Input
              type="date"
              value={newTripDate}
              onChange={(e) => setNewTripDate(e.target.value)}
            />
          </div>
          <Button
            className="w-full bg-blue-600 hover:bg-blue-700"
            onClick={handleCreateTrip}
            disabled={creating}
          >
            {creating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Create Trip Plan
          </Button>
        </div>
      </div>
    );
  }

  const { items = [], name, start_date } = activeTrip;

  // Handlers
  const removeItem = async (id) => {
    if (onRemoveItem) await onRemoveItem(id);
  };

  const mapMarkers = items
    .map((item, index) => ({
      lat: item.location_lat || 0,
      lng: item.location_lng || 0,
      title: item.title,
      label: `${index + 1}`,
      icon: getCategoryIcon(item.type || "place"), // Need to map types correctly
    }))
    .filter((m) => m.lat && m.lng);

  return (
    <div className="h-[calc(100vh-180px)] min-h-[600px] flex flex-col md:flex-row bg-white dark:bg-slate-900 relative">
      <SEO
        title="Trip Planner | Kosmoi"
        description="Build and manage your perfect Koh Samui itinerary."
        url="https://kosmoi.com/TripPlanner"
      />
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b dark:border-slate-800 px-4 py-3 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {name}
            </h2>
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-slate-400">
              <Calendar className="w-4 h-4" />
              <span>{start_date || "Date Not Set"}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Timeline Sidebar */}
        <div className="w-full md:w-1/3 min-w-[320px] bg-white dark:bg-slate-900 border-r dark:border-slate-800 flex flex-col z-0">
          <div className="p-4 border-b dark:border-slate-800 bg-gray-50 dark:bg-slate-950/50">
            <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Itinerary
            </h3>
            <p className="text-xs text-gray-500">
              Drag and drop reordering coming soon
            </p>
          </div>

          <ScrollArea className="flex-1 p-4">
            {items.length === 0 ? (
              <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                <MapPin className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-slate-700" />
                <p>Your itinerary is empty</p>
                <p className="text-sm mt-1">
                  Use the AI Chat to find places and add them
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => navigate("/AIChat")}
                >
                  Go to AI Chat
                </Button>
              </div>
            ) : (
              <div className="space-y-4 relative">
                {/* Connecting Line */}
                <div className="absolute top-4 bottom-4 left-[19px] w-0.5 bg-blue-100 dark:bg-blue-900/40 -z-10" />

                {items.map((item, index) => (
                  <div key={item.id} className="flex gap-4 relative group pl-2">
                    {/* Number Badge */}
                    <div className="flex flex-col items-center gap-1 min-w-[40px]">
                      <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold shadow-sm z-10 ring-4 ring-white dark:ring-slate-900">
                        {index + 1}
                      </div>
                    </div>

                    {/* Content Card */}
                    <Card className="flex-1 hover:shadow-md transition-shadow dark:bg-slate-800 dark:border-slate-700">
                      <CardContent className="p-3">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <Badge
                              variant="outline"
                              className="mb-1 text-xs capitalize"
                            >
                              {item.type}
                            </Badge>
                            <h4 className="font-bold text-gray-900 dark:text-white text-sm">
                              {item.title}
                            </h4>
                            {(item.address || item.location_lat) && (
                              <p className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1 mt-1">
                                <MapPin className="w-3 h-3" />
                                {item.address || "Location set"}
                              </p>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-gray-400 hover:text-red-500"
                            onClick={() => removeItem(item.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        {item.notes && (
                          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded text-xs text-yellow-800 dark:text-yellow-400 mt-2">
                            {item.notes}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          <div className="p-4 border-t dark:border-slate-800 bg-gray-50 dark:bg-slate-950/50">
            <Button
              className="w-full"
              variant="outline"
              onClick={() => navigate("/AIChat")}
            >
              <Plus className="w-4 h-4 ml-2" />
              Add New Place
            </Button>
          </div>
        </div>

        {/* Map View */}
        <div className="hidden md:block flex-1 relative">
          <GoogleMap
            center={mapCenter}
            zoom={mapZoom}
            height="100%"
            markers={mapMarkers}
            polylines={[
              {
                path: items
                  .filter((item) => item.location_lat && item.location_lng)
                  .map((item) => ({
                    lat: item.location_lat,
                    lng: item.location_lng,
                  })),
                strokeColor: "#2563eb", // blue-600
                strokeWeight: 4,
                strokeOpacity: 0.8,
              },
            ]}
          />
        </div>
      </div>
    </div>
  );
}
