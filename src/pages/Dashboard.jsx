
// @ts-nocheck
import React, { useState, useEffect } from "react";
// LandingHero removed
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/shared/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { db } from "@/api/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useTranslation } from "react-i18next";
import {
  Search,
  MapPin,
  Navigation as NavigationIcon,
  Sparkles,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import ProviderCard from "../components/ProviderCard";
import SuperCategories from "../components/SuperCategories";
import SubCategorySelector from "../components/SubCategorySelector";
import SyncStatus from "../components/SyncStatus";
import OfflineIndicator from "../components/OfflineIndicator";
import { autoSync } from "@/services/syncService";
import { offlineQuery } from "@/services/offlineQuery";
import WeatherWidget from "@/components/WeatherWidget";

import GooglePlacesAutocomplete from "@/components/GooglePlacesAutocomplete";
import {
  History,
} from "lucide-react";

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance;
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const language = i18n.language;
  const [searchQuery, setSearchQuery] = useState("");
  const [userLocation, setUserLocation] = useState(null);
  const [locationPermission, setLocationPermission] = useState('pending');
  const [locationError, setLocationError] = useState(null);
  const [showLocationDialog, setShowLocationDialog] = useState(false);
  const [selectedLocationName, setSelectedLocationName] = useState(null);
  const [locationAddressEn, setLocationAddressEn] = useState(null);
  const [locationAddressTh, setLocationAddressTh] = useState(null);
  const [loadingAddress, setLoadingAddress] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [selectedSuperCategory, setSelectedSuperCategory] = useState(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState(null);

  const [locationHistory, setLocationHistory] = useState([]);

  // Reverse Geocoding - convert coordinates to address in both English and Thai using Google API
  const getAddressFromCoordinates = async (latitude, longitude) => {
    try {
      const isDevelopment = import.meta.env.DEV;

      if (isDevelopment) {
        const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

        const urlEn = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}&language=en`;
        const responseEn = await fetch(urlEn);
        const dataEn = await responseEn.json();

        const urlTh = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}&language=th`;
        const responseTh = await fetch(urlTh);
        const dataTh = await responseTh.json();

        return {
          en: dataEn.results?.[0]?.formatted_address || null,
          th: dataTh.results?.[0]?.formatted_address || null
        };
      }

      const response = await db.functions.invoke('geocode', {
        latitude,
        longitude
      });

      return {
        en: response.data.en,
        th: response.data.th
      };
    } catch (error) {
      console.error('Error getting address:', error);
      return { en: null, th: null };
    }
  };

  useEffect(() => {
    const savedLocation = localStorage.getItem('userLocation');
    const savedLocationName = localStorage.getItem('locationName');
    const savedLocationAddressEn = localStorage.getItem('locationAddressEn');
    const savedLocationAddressTh = localStorage.getItem('locationAddressTh');

    const savedHistory = localStorage.getItem('locationHistory');
    if (savedHistory) {
      try {
        setLocationHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to parse location history", e);
      }
    }

    if (savedLocation) {
      try {
        const location = JSON.parse(savedLocation);
        setUserLocation(location);
        setSelectedLocationName(savedLocationName || t('dashboard.my_location'));
        setLocationAddressEn(savedLocationAddressEn);
        setLocationAddressTh(savedLocationAddressTh);
        setLocationPermission('granted');
      } catch (error) {
        console.error('Error parsing saved location:', error);
        checkLocation();
      }
    } else {
      checkLocation();
    }
  }, []);

  useEffect(() => {
    autoSync().catch(err => {
      console.error('Auto-sync failed:', err);
    });
  }, []);

  const checkLocation = async () => {
    if (!navigator.geolocation) {
      setLocationPermission('denied');
      setLocationError(t('dashboard.location_error_api'));
      return;
    }

    setLocationPermission('loading');
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        };
        setUserLocation(location);
        setSelectedLocationName(t('currentLocation'));
        setLocationPermission('granted');
        setLocationError(null);

        setLoadingAddress(true);
        try {
          const addresses = await getAddressFromCoordinates(location.latitude, location.longitude);
          // console.log('Fetched addresses:', addresses);

          if (addresses.en) {
            setLocationAddressEn(addresses.en);
            localStorage.setItem('locationAddressEn', addresses.en);
          }
          if (addresses.th) {
            setLocationAddressTh(addresses.th);
            localStorage.setItem('locationAddressTh', addresses.th);
          }
        } catch (error) {
          console.error('Error fetching addresses:', error);
        }
        setLoadingAddress(false);

        localStorage.setItem('userLocation', JSON.stringify(location));
        localStorage.setItem('locationName', t('currentLocation'));
      },
      (error) => {
        // console.log("Location access error:", error);
        setLocationPermission('denied');
        if (error.code === error.PERMISSION_DENIED) {
          setLocationError(t('dashboard.location_error_denied'));
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          setLocationError(t('dashboard.location_error_unavailable'));
        } else {
          setLocationError(t('dashboard.location_error_generic'));
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const requestLocation = () => {
    checkLocation();
  };

  const addToHistory = (location) => {
    const newHistoryItem = {
      name: location.name,
      latitude: location.latitude,
      longitude: location.longitude,
      timestamp: new Date().getTime()
    };

    // Filter out duplicates (by name or very close coordinates)
    const filteredHistory = locationHistory.filter(item => item.name !== location.name);

    const newHistory = [newHistoryItem, ...filteredHistory].slice(0, 5); // Keep last 5
    setLocationHistory(newHistory);
    localStorage.setItem('locationHistory', JSON.stringify(newHistory));
  };

  const handleSelectLocation = async (location) => {
    const newLocation = {
      latitude: location.latitude,
      longitude: location.longitude
    };
    setUserLocation(newLocation);
    setSelectedLocationName(location.name);
    setLocationPermission('granted');
    setLocationError(null);
    setShowLocationDialog(false);

    addToHistory(location);

    setLoadingAddress(true);
    try {
      // If we already have the address from autocomplete, use it (though specific formatted might vary)
      // Standardize by fetching again or use what we have? 
      // Existing logic fetches EN/TH. Let's keep fetching for consistency of data structure.
      const addresses = await getAddressFromCoordinates(location.latitude, location.longitude);

      if (addresses.en) {
        setLocationAddressEn(addresses.en);
        localStorage.setItem('locationAddressEn', addresses.en);
      }
      if (addresses.th) {
        setLocationAddressTh(addresses.th);
        localStorage.setItem('locationAddressTh', addresses.th);
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
    }
    setLoadingAddress(false);

    localStorage.setItem('userLocation', JSON.stringify(newLocation));
    localStorage.setItem('locationName', location.name);
  };

  const handleUseCurrentLocation = () => {
    setShowLocationDialog(false);
    checkLocation();
  };

  const { data: allProviders = [] } = useQuery({
    queryKey: ['allProviders'],
    queryFn: () => offlineQuery.ServiceProvider.filter({ status: 'active' }),
    initialData: [],
  });

  const { data: providers, isLoading } = useQuery({
    queryKey: ['topProviders', userLocation],
    queryFn: async () => {
      const allProviders = await offlineQuery.ServiceProvider.filter({
        status: 'active',
        verified: true
      });

      let filteredProviders = allProviders.filter(p => p.total_reviews >= 3 && p.average_rating >= 4);

      if (userLocation) {
        filteredProviders = filteredProviders.map(provider => {
          if (provider.latitude && provider.longitude) {
            const distance = calculateDistance(
              userLocation.latitude,
              userLocation.longitude,
              provider.latitude,
              provider.longitude
            );
            return { ...provider, distance };
          }
          return { ...provider, distance: null };
        });

        filteredProviders.sort((a, b) => {
          if (a.distance === null) return 1;
          if (b.distance === null) return -1;
          return a.distance - b.distance;
        });
      } else {
        filteredProviders.sort((a, b) => b.average_rating - a.average_rating);
      }

      return filteredProviders.slice(0, 6);
    },
    initialData: [],
    enabled: true,
  });

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = allProviders.filter(provider => {
        const searchLower = searchQuery.toLowerCase();
        return (
          provider.business_name?.toLowerCase().includes(searchLower) ||
          provider.description?.toLowerCase().includes(searchLower) ||
          provider.category?.includes(searchLower)
        );
      }).slice(0, 5);
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchQuery, allProviders]);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(createPageUrl("ServiceProviders") + `?search=${encodeURIComponent(searchQuery)}`);
      setShowSuggestions(false);
    }
  };

  const handleSelectSuggestion = (provider) => {
    navigate(createPageUrl("ServiceProviderDetails") + `?id=${provider.id}`);
    setShowSuggestions(false);
    setSearchQuery("");
  };

  const handleSuperCategoryClick = (superCategoryId) => {
    if (selectedSuperCategory === superCategoryId) {
      setSelectedSuperCategory(null); // Deselect if already selected
      setSelectedSubCategory(null);
    } else {
      setSelectedSuperCategory(superCategoryId);
      setSelectedSubCategory(null);
    }
  };

  const handleSubCategoryClick = (subCategoryId) => {
    if (subCategoryId.startsWith('all_')) {
      navigate(createPageUrl("ServiceProviders") + `?super_category=${selectedSuperCategory}`);
    } else {
      navigate(createPageUrl("ServiceProviders") + `?super_category=${selectedSuperCategory}&sub_category=${subCategoryId}`);
    }
  };

  const handleCall = async (phone) => {
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

  // Background images logic removed in favor of LandingHero

  return (
    <div className="min-h-screen bg-gray-50">
      <OfflineIndicator />
      {/* Hero Section with Search & Categories */}
      <div className="relative isolate overflow-hidden bg-slate-900 pb-12 pt-24 sm:pb-32 lg:pb-32 lg:pt-32 mb-8">
        <img
          src="https://images.unsplash.com/photo-1540206395-688085723adb?w=1600&auto=format&fit=crop&q=80"
          alt="Dashboard Background"
          className="absolute inset-0 -z-10 h-full w-full object-cover opacity-20 blur-sm"
        />
        <div className="mx-auto max-w-7xl px-6 lg:px-8 text-center relative z-10">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl font-display mb-6 drop-shadow-lg">
            {t('dashboard.hero_title')}
          </h1>
          <p className="mt-4 text-xl leading-8 text-gray-200 max-w-2xl mx-auto mb-10 drop-shadow-md">
            {t('dashboard.hero_subtitle')}
          </p>

          {/* Integrated Search Bar */}
          <div className="max-w-3xl mx-auto mb-16 relative">
            <div className="relative flex items-center">
              <Input
                className="h-14 pl-6 pr-16 rounded-full bg-white/95 backdrop-blur-sm border-0 text-lg shadow-xl focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 text-slate-800 placeholder:text-slate-500"
                placeholder={t('dashboard.search_placeholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                onFocus={() => searchQuery && setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              />
              <div className="absolute right-2 flex items-center gap-1">
                <Button
                  size="icon"
                  className="h-10 w-10 rounded-full bg-blue-600 hover:bg-blue-500 text-white shadow-lg transition-all hover:scale-105"
                  onClick={handleSearch}
                >
                  <Search className="h-5 w-5" />
                </Button>
                <Button
                  size="icon"
                  className="h-10 w-10 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg transition-all hover:scale-105 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 animate-gradient-x"
                  onClick={() => navigate('/ai-chat')}
                  title={t('search.ask_ai_tooltip')}
                >
                  <Sparkles className="h-5 w-5" />
                </Button>
              </div>
            </div>
            {/* Suggestions Dropdown can be absolutely positioned here if needed */}
          </div>

          {/* Super Categories */}
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
            {/* <h3 className="text-white/80 font-medium text-sm uppercase tracking-wider mb-6">
                {t('dashboard.categories')}
             </h3> */}
            <SuperCategories
              onSelect={handleSuperCategoryClick}
              selectedCategory={selectedSuperCategory}
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-4 space-y-4">
        <div className="mb-4">
          <div className="space-y-4">

            {selectedSuperCategory && (
              <div className="mt-4 animate-in fade-in slide-in-from-top-4 duration-500">
                {/* Sub Categories Pills */}
                <div className="mb-2 flex justify-center">
                  <SubCategorySelector
                    superCategory={selectedSuperCategory}
                    selectedSubCategory={selectedSubCategory}
                    onSelectSubCategory={handleSubCategoryClick}
                    language={language}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Location Bar & Status */}
      <div className="max-w-7xl mx-auto px-4 mb-6">
        {userLocation && (
          <div className="flex items-center gap-2 justify-center text-sm text-gray-600 bg-white/50 py-2 rounded-full backdrop-blur-sm max-w-md mx-auto border border-gray-100 shadow-sm">
            <MapPin className="w-4 h-4 text-blue-500" />
            <span className="font-medium">{selectedLocationName}</span>
            <span className="text-gray-300">|</span>
            <button
              onClick={() => setShowLocationDialog(true)}
              className="text-blue-600 hover:text-blue-700 font-medium hover:underline transition-colors"
            >
              {t('change')}
            </button>
          </div>
        )}
      </div>

      {/* Location Permission UI Blocks */}
      {
        locationPermission === 'loading' && (
          <div className="bg-blue-500 text-white px-4 py-3">
            <div className="max-w-7xl mx-auto flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm font-medium">{t('locatingYou')}</span>
            </div>
          </div>
        )
      }

      {
        locationPermission === 'denied' && (
          <div className="bg-orange-500 text-white px-4 py-3">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-2">
                <NavigationIcon className="w-5 h-5" />
                <div>
                  <span className="text-sm font-medium block">{t('cannotAccessLocation')}</span>
                  <span className="text-xs opacity-90">{locationError || t('allowLocationAccess')}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => setShowLocationDialog(true)}
                  size="sm"
                  className="bg-white text-orange-600 hover:bg-gray-100 font-semibold"
                >
                  {t('selectLocation')}
                </Button>
                <Button
                  onClick={requestLocation}
                  size="sm"
                  variant="outline"
                  className="bg-transparent border-white text-white hover:bg-white/20"
                >
                  {t('tryAgain')}
                </Button>
              </div>
            </div>
          </div>
        )
      }

      {
        locationPermission === 'pending' && (
          <div className="bg-blue-600 text-white px-4 py-3">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-2">
                <NavigationIcon className="w-5 h-5" />
                <div>
                  <span className="text-sm font-medium block">{t('confirmLocationAccess')}</span>
                  <span className="text-xs opacity-90">{t('toFindNearbyProviders')}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => setShowLocationDialog(true)}
                  size="sm"
                  className="bg-white text-blue-600 hover:bg-gray-100 font-semibold"
                >
                  {t('selectLocation')}
                </Button>
                <Button
                  onClick={requestLocation}
                  size="sm"
                  variant="outline"
                  className="bg-transparent border-white text-white hover:bg-white/20"
                >
                  {t('allowLocation')}
                </Button>
              </div>
            </div>
          </div>
        )
      }

      <Dialog open={showLocationDialog} onOpenChange={setShowLocationDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('selectLocation')}</DialogTitle>
            <DialogDescription>
              {t('dashboard.search_location_description')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <GooglePlacesAutocomplete
                  placeholder={t('dashboard.search_location_placeholder')}
                  onPlaceSelected={handleSelectLocation}
                  className="text-base h-12 pe-10 ps-10"
                />
              </div>
              <Button
                onClick={handleUseCurrentLocation}
                className="bg-blue-600 hover:bg-blue-700 h-12 px-4"
              >
                <NavigationIcon className="w-5 h-5" />
              </Button>
            </div>

            {locationHistory.length > 0 && (
              <div className="border-t pt-3">
                <p className="text-sm font-medium text-gray-700 mb-2">{t('recentSearches') || "Recent Locations"}</p>
                <div className="space-y-2">
                  {locationHistory.map((location, index) => (
                    <Button
                      key={`${location.name}-${index}`}
                      onClick={() => handleSelectLocation(location)}
                      variant="outline"
                      className="w-full justify-start h-12"
                    >
                      <History className="w-4 h-4 me-2 text-gray-500" />
                      {location.name}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>



      <div className="max-w-7xl mx-auto px-4 py-6 space-y-8">


        <div className="mb-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                {userLocation ? t('nearbyProviders') : t('recommendedProviders')}
              </h3>
              <Button
                variant="ghost"
                onClick={() => navigate(createPageUrl("ServiceProviders"))}
                className="text-blue-600"
              >
                {t('seeAll')}
              </Button>
            </div>

            {isLoading ? (
              <div className="text-center py-8 text-gray-500">{t('loading')}</div>
            ) : providers.length === 0 ? (
              <Card className="p-6 text-center">
                <p className="text-gray-500">{t('noProviders')}</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {providers.map((provider) => (
                  <ProviderCard
                    key={provider.id}
                    provider={provider}
                    onCall={handleCall}
                    showDistance={true}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div >
  );
}
