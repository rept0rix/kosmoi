
// @ts-nocheck
import React, { useState, useEffect } from "react";
import LandingHero from "@/components/LandingHero";
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

const predefinedLocations = [
  { name: "בו-פוט", latitude: 9.5297, longitude: 100.0626 },
  { name: "לאמאי", latitude: 9.5137, longitude: 100.0512 },
  { name: "צ'אוונג", latitude: 9.5381, longitude: 100.0564 },
  { name: "מאנם", latitude: 9.5485, longitude: 100.0311 },
  { name: "בנג רק", latitude: 9.4835, longitude: 99.9851 },
  { name: "נאתון", latitude: 9.5091, longitude: 99.9568 },
];

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
  const [locationSearchQuery, setLocationSearchQuery] = useState("");

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

  const handleSelectPredefinedLocation = async (location) => {
    const newLocation = {
      latitude: location.latitude,
      longitude: location.longitude
    };
    setUserLocation(newLocation);
    setSelectedLocationName(location.name);
    setLocationPermission('granted');
    setLocationError(null);
    setShowLocationDialog(false);

    setLoadingAddress(true);
    try {
      const addresses = await getAddressFromCoordinates(location.latitude, location.longitude);
      // console.log('Fetched addresses for predefined location:', addresses);

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

      {/* Marketing Hero */}
      <LandingHero />

      {/* Main Search Section */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40 py-4 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="w-full max-w-3xl mx-auto">
            <div className="relative flex gap-2">
              <div className="flex-1 relative">
                <Input
                  placeholder={t('searchService')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  onFocus={() => searchQuery && setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  className="text-base h-12 bg-gray-50 border-gray-300 focus:bg-white transition-colors text-lg pe-12 ps-12"
                />
                <Search className="absolute start-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-64 overflow-auto">
                    {suggestions.map((provider) => (
                      <div
                        key={provider.id}
                        onClick={() => handleSelectSuggestion(provider)}
                        className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0 flex items-center gap-3"
                      >
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          {provider.images?.[0] ? (
                            <img src={provider.images[0]} alt="" className="w-full h-full object-cover rounded-lg" />
                          ) : (
                            <span className="text-gray-500 font-bold">{provider.business_name?.charAt(0)}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 truncate">{provider.business_name}</p>
                          <p className="text-xs text-gray-500 truncate">
                            {provider.category}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <Button
                onClick={handleSearch}
                className="bg-blue-600 hover:bg-blue-700 h-12 px-6"
              >
                <Search className="w-5 h-5" />
              </Button>
            </div>

            {/* Location Bar */}
            {userLocation && (
              <div className="mt-3 flex items-center gap-2 justify-center text-sm text-gray-600">
                <MapPin className="w-4 h-4 text-blue-500" />
                <span className="font-medium">{selectedLocationName}</span>
                <span className="text-gray-300">|</span>
                <button
                  onClick={() => setShowLocationDialog(true)}
                  className="text-blue-600 hover:underline"
                >
                  {t('change')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Location Permission UI Blocks */}
      {locationPermission === 'loading' && (
        <div className="bg-blue-500 text-white px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-center gap-2">
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm font-medium">{t('locatingYou')}</span>
          </div>
        </div>
      )}

      {locationPermission === 'denied' && (
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
      )}

      {locationPermission === 'pending' && (
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
      )}

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
                <Input
                  placeholder={t('dashboard.search_location_placeholder')}
                  value={locationSearchQuery}
                  onChange={(e) => setLocationSearchQuery(e.target.value)}
                  className="text-base h-12 pe-10 ps-10"
                />
                <MapPin className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
              <Button
                onClick={handleUseCurrentLocation}
                className="bg-blue-600 hover:bg-blue-700 h-12 px-4"
              >
                <NavigationIcon className="w-5 h-5" />
              </Button>
            </div>

            <div className="border-t pt-3">
              <p className="text-sm font-medium text-gray-700 mb-2">{t('orSelectArea')}</p>
              <div className="space-y-2">
                {predefinedLocations.map((location) => (
                  <Button
                    key={location.name}
                    onClick={() => handleSelectPredefinedLocation(location)}
                    variant="outline"
                    className="w-full justify-start h-12"
                  >
                    <MapPin className="w-4 h-4 me-2 text-gray-500" />
                    {location.name}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Categories Section */}
      <div className="bg-blue-600 py-3">
        <div className="max-w-7xl mx-auto px-4">
          <h3 className="text-white text-center font-semibold text-lg">
            {t('categories')}
          </h3>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-8">


        <div className="mb-6">
          <div className="space-y-8 animate-in fade-in duration-500">
            <SuperCategories
              onSelect={handleSuperCategoryClick}
              selectedCategory={selectedSuperCategory}
            />

            {selectedSuperCategory && (
              <div className="mt-8 animate-in fade-in slide-in-from-top-4 duration-500">

                {/* Question Bubble */}
                <div className="flex justify-center mb-6">
                  <div className="bg-blue-50 text-blue-800 px-6 py-3 rounded-2xl rounded-bl-sm relative shadow-sm border border-blue-100 max-w-xs text-center">
                    <p className="font-medium text-lg">
                      {t(selectedSuperCategory + '_question') || `${t(selectedSuperCategory)}?`}
                    </p>
                    {/* Triangle tail */}
                    <div className="absolute -bottom-2 left-4 w-4 h-4 bg-blue-50 border-b border-l border-blue-100 transform -rotate-45"></div>
                  </div>
                </div>

                {/* Sub Categories Pills */}
                <div className="mb-6">
                  <SubCategorySelector
                    superCategory={selectedSuperCategory}
                    selectedSubCategory={selectedSubCategory}
                    onSelectSubCategory={handleSubCategoryClick}
                    language={language}
                  />
                </div>

                {/* Reveal with AI Button */}
                <div className="flex justify-center">
                  <Button
                    onClick={() => navigate('/aichat', { state: { category: selectedSuperCategory, label: t(selectedSuperCategory) } })}
                    className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white border-0 shadow-lg hover:shadow-xl transition-all rounded-full px-8 py-6 h-auto flex flex-col items-center gap-1 group"
                  >
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 animate-pulse" />
                      <span className="text-lg font-bold">{t('dashboard.ai_chat_button')}</span>
                    </div>
                    <span className="text-xs text-indigo-100 opacity-90 group-hover:opacity-100">
                      {t('dashboard.ai_chat_subtext')}
                    </span>
                  </Button>
                </div>

              </div>
            )}

            {!selectedSuperCategory && (
              <div className="mt-12 text-center opacity-70">
                <p className="text-sm text-gray-400">
                  {t('dashboard.select_category_prompt')}
                </p>
              </div>
            )}
          </div>

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
    </div>
  );
}
