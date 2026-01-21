// @ts-nocheck
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/shared/lib/utils";
import { db } from '@/api/supabaseClient';
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Filter,
  Star,
  Phone,
  MessageCircle,
  Navigation,
  MapPin,
  X,
  Crosshair
} from "lucide-react";
import GoogleMap from "../components/GoogleMap";
import MapProviderCard from "@/components/MapProviderCard";
import { getCategoryIcon } from "@/shared/utils/mapIcons";
import { ScoutSearch } from "@/features/scout/components/ScoutSearch";
import { toast } from "sonner";

const categories = [
  { value: "all", label: "הכל" },
  { value: "handyman", label: "אנדימן" },
  { value: "carpenter", label: "נגר" },
  { value: "electrician", label: "חשמלאי" },
  { value: "plumber", label: "אינסטלטור" },
  { value: "ac_repair", label: "מזגנים" },
  { value: "cleaning", label: "ניקיון" },
  { value: "locksmith", label: "מנעולן" },
  { value: "painter", label: "צבע" },
  { value: "gardener", label: "גנן" },
  { value: "pest_control", label: "הדברה" },
  { value: "moving", label: "הובלות" },
  { value: "internet_tech", label: "אינטרנט" },
];

export default function MapView() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState(urlParams.get('category') || "all");
  const [superCategoryFilter, setSuperCategoryFilter] = useState(urlParams.get('super_category') || "all");
  const [subCategoryFilter, setSubCategoryFilter] = useState(urlParams.get('sub_category') || "all");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState({ lat: 9.5, lng: 100.0 });
  const [mapZoom, setMapZoom] = useState(13);
  const [sortBy, setSortBy] = useState("nearest");
  const [minRating, setMinRating] = useState(0);
  const [minReviews, setMinReviews] = useState(0);
  const [isAroundMe, setIsAroundMe] = useState(false);
  const [isOpenNow, setIsOpenNow] = useState(false);

  const { data: providers, isLoading } = useQuery({
    queryKey: ["serviceProviders"],
    queryFn: () => db.entities.ServiceProvider.filter({ status: "active" }),
    initialData: [],
  });

  useEffect(() => {
    // Get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(location);
          // Only center if not already set by user interaction or if it's the first load
          if (!mapCenter || (mapCenter.lat === 9.5 && mapCenter.lng === 100.0)) {
            setMapCenter(location);
          }
        },
        (error) => {
          // console.log("Location access denied");
        }
      );
    }
  }, []);

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const toggleAroundMe = () => {
    const newAroundMe = !isAroundMe;
    setIsAroundMe(newAroundMe);
    if (newAroundMe && userLocation) {
      setMapCenter(userLocation);
      setMapZoom(15); // Zoom in closer
    } else {
      setMapZoom(13); // Reset zoom
    }
  };

  const filteredProviders = providers
    .filter((provider) => {
      const matchesSearch =
        !searchQuery ||
        provider.business_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        provider.description?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory = categoryFilter === "all" || provider.category === categoryFilter;
      const matchesSuperCategory = superCategoryFilter === "all" || provider.super_category === superCategoryFilter;
      const matchesSubCategory = subCategoryFilter === "all" || provider.sub_category === subCategoryFilter;
      const matchesRating = provider.average_rating >= minRating;
      const matchesReviews = provider.total_reviews >= minReviews;
      const hasLocation = provider.latitude && provider.longitude;

      // Open Now Logic
      let matchesOpenNow = true;
      if (isOpenNow && provider.opening_hours) {
        try {
          const now = new Date();
          const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
          const dayName = days[now.getDay()];
          const todayHours = provider.opening_hours[dayName];

          if (!todayHours || !todayHours.open || !todayHours.close) {
            matchesOpenNow = false; // Closed if no hours listed for today
          } else {
            const currentTime = now.getHours() * 100 + now.getMinutes();
            const openTime = parseInt(todayHours.open.replace(':', ''), 10);
            const closeTime = parseInt(todayHours.close.replace(':', ''), 10);

            if (currentTime < openTime || currentTime >= closeTime) {
              matchesOpenNow = false;
            }
          }
        } catch (e) {
          console.warn("Error parsing opening hours", e);
          // matchesOpenNow = true; // Fail safe? Or strict? Let's be strict for filter.
          matchesOpenNow = false;
        }
      }

      return matchesSearch && matchesCategory && matchesSuperCategory && matchesSubCategory && matchesRating && matchesReviews && hasLocation && matchesOpenNow;
    })
    .map((provider) => {
      if (userLocation && provider.latitude && provider.longitude) {
        const distance = calculateDistance(
          userLocation.lat,
          userLocation.lng,
          provider.latitude,
          provider.longitude
        );
        return { ...provider, distance };
      }
      return { ...provider, distance: null };
    })
    .filter(provider => {
      if (isAroundMe && provider.distance !== null) {
        return provider.distance <= 2; // 2km radius
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "nearest") {
        if (a.distance === null) return 1;
        if (b.distance === null) return -1;
        return a.distance - b.distance;
      } else if (sortBy === "highestRated") {
        return (b.average_rating || 0) - (a.average_rating || 0);
      } else if (sortBy === "mostReviewed") {
        return (b.total_reviews || 0) - (a.total_reviews || 0);
      }
      return 0;
    });

  const getCategoryLabel = (categoryValue) => {
    return categories.find((c) => c.value === categoryValue)?.label || categoryValue;
  };

  const handleCall = async (phone, e) => {
    e.stopPropagation();
    try {
      const isAuth = await db.auth.isAuthenticated();
      if (!isAuth) {
        db.auth.redirectToLogin(window.location.pathname);
        return;
      }
      window.location.href = `tel:${phone}`;
    } catch (error) {
      db.auth.redirectToLogin(window.location.pathname);
    }
  };

  const handleWhatsApp = async (phone, e) => {
    e.stopPropagation();
    try {
      const isAuth = await db.auth.isAuthenticated();
      if (!isAuth) {
        db.auth.redirectToLogin(window.location.pathname);
        return;
      }
      window.open(`https://wa.me/${phone.replace(/[^0-9]/g, "")}`, "_blank");
    } catch (error) {
      db.auth.redirectToLogin(window.location.pathname);
    }
  };

  const handleNavigate = (provider, e) => {
    e.stopPropagation();
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${provider.latitude},${provider.longitude}`,
      "_blank"
    );
  };

  // Create markers for Google Maps
  const mapMarkers = filteredProviders.map(provider => ({
    lat: provider.latitude,
    lng: provider.longitude,
    title: provider.business_name,
    icon: getCategoryIcon(provider.category),
    onClick: () => setSelectedProvider(provider)
  }));

  const handleScoutAction = (action) => {
    if (action.name === 'move_map') {
        const { lat, lng, zoom } = action.data || action.payload || {};
        if (lat && lng) {
            setMapCenter({ lat, lng });
            if (zoom) setMapZoom(zoom);
        }
    } else if (action.name === 'filter_map') {
        const { category } = action.data || action.payload || {};
        if (category) {
            setCategoryFilter(category);
            toast.info(`Filtered map by ${category}`);
        }
    }
  };

  return (
    <div className="h-[calc(100vh-56px)] flex flex-col bg-gray-50 relative">
      <ScoutSearch onMapAction={handleScoutAction} />

      {/* Map */}
      <div className="flex-1 relative z-0">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-500">טוען מפה...</div>
          </div>
        ) : (
          <GoogleMap
            center={mapCenter}
            zoom={mapZoom}
            height="100%"
            markers={mapMarkers}
            userLocation={userLocation}
            onMapClick={(position) => {
               console.log('Map clicked:', position);
            }}
          />
        )}

        {/* Selected Provider Card */}
        {selectedProvider && (
          <MapProviderCard
            provider={selectedProvider}
            onClose={() => setSelectedProvider(null)}
          />
        )}
      </div>
    </div>
  );
}