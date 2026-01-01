// @ts-nocheck
import React, { useState, useEffect } from "react";
import { db } from '@/api/supabaseClient';
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { cn, createPageUrl } from "@/shared/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GlassCard } from "@/components/ui/GlassCard"; // Changed from Card
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  MapPin,
  Phone,
  Star,
  Navigation,
  Wrench,
  Calendar,
  History,
  Sparkles,
  Filter
} from "lucide-react";
import GoogleMap from "@/components/GoogleMap";
import MapProviderCard from "@/components/MapProviderCard";
import BookingDialog from "@/components/BookingDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import GooglePlacesAutocomplete from "@/components/GooglePlacesAutocomplete";
import { useTranslation } from 'react-i18next';
import { getCategoryIcon } from "@/shared/utils/mapIcons";
import { subCategoriesBySuperCategory, getSubCategoryLabel } from "@/components/subCategories";
import AIChatWidget from "@/components/AIChatWidget";
import { useLocationContext } from "@/contexts/LocationContext";

export default function ServiceProviders() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const language = i18n.language;
  const isRTL = language === 'he';

  const urlParams = new URLSearchParams(window.location.search);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState(urlParams.get('search') || '');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [sortBy, setSortBy] = useState('rating');
  const [filters, setFilters] = useState({
    minRating: parseFloat(urlParams.get('minRating')) || 0,
    minReviews: parseInt(urlParams.get('minReviews')) || 0,
    maxDistance: parseInt(urlParams.get('maxDistance')) || 20000,
    priceRanges: urlParams.get('priceRanges')?.split(',').filter(Boolean) || [],
    languages: urlParams.get('languages')?.split(',').filter(Boolean) || [],
    emergencyService: urlParams.get('emergencyService') === 'true',
    verifiedOnly: urlParams.get('verifiedOnly') === 'true',
    superCategory: urlParams.get('super_category') || 'all',
    subCategory: urlParams.get('sub_category') || 'all',
  });

  // Location Context
  const {
    userLocation,
    locationName: selectedLocationName,
    locationHistory,
    updateLocation,
    calculateDistance,
    DEFAULT_LOCATION
  } = useLocationContext();

  const [locationPermission, setLocationPermission] = useState('pending');
  const [locationError, setLocationError] = useState(null);
  const [showLocationDialog, setShowLocationDialog] = useState(false);
  const [tempLocation, setTempLocation] = useState(null);
  const [locationDialogView, setLocationDialogView] = useState('search');
  const [loadingAddress, setLoadingAddress] = useState(false);

  // Chat State
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Booking State
  const [bookingProvider, setBookingProvider] = useState(null);
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  // Map Selection
  const [selectedMapProvider, setSelectedMapProvider] = useState(null);

  const SUPER_CATEGORIES = [
    { id: "eat", name_key: "eat" },
    { id: "fix", name_key: "fix" },
    { id: "shop", name_key: "shop" },
    { id: "enjoy", name_key: "enjoy" },
    { id: "go_out", name_key: "go_out" },
    { id: "travel", name_key: "travel" },
    { id: "help", name_key: "help" },
    { id: "wallet", name_key: "wallet" },
  ];

  // --- Location Logic Start ---
  const getAddressFromCoordinates = async (latitude, longitude) => {
    try {
      const isDevelopment = import.meta.env.DEV;
      if (isDevelopment) {
        const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
        const urlEn = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}&language=en`;
        const responseEn = await fetch(urlEn);
        const dataEn = await responseEn.json();
        return { en: dataEn.results?.[0]?.formatted_address || null };
      }
      const response = await db.functions.invoke('geocode', { latitude, longitude });
      return { en: response.data.en };
    } catch (error) {
      console.error('Error getting address:', error);
      return { en: null };
    }
  };

  useEffect(() => {
    if (!userLocation && locationPermission === 'pending') {
      checkLocation();
    } else if (userLocation) {
      setLocationPermission('granted');
    }
  }, [userLocation]);

  const checkLocation = async () => {
    if (userLocation) {
      setLocationPermission('granted');
      return;
    }
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
          longitude: position.coords.longitude,
          name: t('currentLocation')
        };
        updateLocation(location);
        setLocationPermission('granted');
        setLocationError(null);
        setLoadingAddress(true);
        try {
          const addresses = await getAddressFromCoordinates(location.latitude, location.longitude);
          if (addresses.en) {
            updateLocation({ ...location, address: addresses.en });
          }
        } catch (e) {
          // ignore
        }
        setLoadingAddress(false);
      },
      (error) => {
        setLocationPermission('denied');
        if (error.code === error.PERMISSION_DENIED) {
          setLocationError(t('dashboard.location_error_denied'));
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          setLocationError(t('dashboard.location_error_unavailable'));
        } else {
          setLocationError(t('dashboard.location_error_generic'));
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleManualLocationSelect = (location) => {
    setTempLocation({
      latitude: location.latitude,
      longitude: location.longitude,
      name: location.name
    });
    setLocationDialogView('confirm');
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError(t('dashboard.location_error_api'));
      return;
    }
    setLocationPermission('loading');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          name: t('currentLocation')
        };
        setTempLocation(location);
        setLocationPermission('granted');
        setLocationDialogView('confirm');
      },
      (error) => {
        setLocationPermission('denied');
        setLocationError(t('dashboard.location_error_generic'));
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const confirmLocation = async () => {
    if (!tempLocation) return;
    const newLocation = {
      latitude: tempLocation.latitude,
      longitude: tempLocation.longitude,
      name: tempLocation.name || t('selectedLocation')
    };
    updateLocation(newLocation);
    setLocationPermission('granted');
    setShowLocationDialog(false);
    setLocationDialogView('search');
    try {
      const addresses = await getAddressFromCoordinates(newLocation.latitude, newLocation.longitude);
      if (addresses.en) {
        updateLocation({ ...newLocation, address: addresses.en });
      }
    } catch (e) {
      // ignore
    }
  };
  // --- Location Logic End ---

  // Sync state with URL params on change
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const searchParam = params.get('search');
    if (searchParam !== null && searchParam !== searchQuery) {
      setSearchQuery(searchParam);
    }
    const superCat = params.get('super_category');
    const subCat = params.get('sub_category');
    setFilters(prev => ({
      ...prev,
      superCategory: superCat || 'all',
      subCategory: subCat || 'all'
    }));
  }, [window.location.search]);

  // Update URL when filters change
  const updateUrlFilters = (newFilters) => {
    const params = new URLSearchParams(window.location.search);
    if (searchQuery) params.set('search', searchQuery);
    else params.delete('search');
    if (newFilters.superCategory !== 'all') params.set('super_category', newFilters.superCategory);
    else params.delete('super_category');
    if (newFilters.subCategory !== 'all') params.set('sub_category', newFilters.subCategory);
    else params.delete('sub_category');
    navigate(createPageUrl("ServiceProviders") + `?${params.toString()}`, { replace: true });
  }

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    if (key === 'superCategory') {
      newFilters.subCategory = 'all'; // Reset sub when super changes
    }
    setFilters(newFilters);
    updateUrlFilters(newFilters);
  };

  const { data: providers, isLoading } = useQuery({
    queryKey: ['serviceProviders'],
    queryFn: () => db.entities.ServiceProvider.filter({ status: 'active' }),
    initialData: [],
  });

  const filteredProviders = providers
    .map(provider => {
      if (userLocation && provider.latitude && provider.longitude) {
        const distance = calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          provider.latitude,
          provider.longitude
        );
        return { ...provider, distance };
      }
      return { ...provider, distance: null };
    })
    .filter(provider => {
      const searchLower = (searchQuery || '').toLowerCase();
      const matchesSearch = !searchLower ||
        provider.business_name?.toLowerCase().includes(searchLower) ||
        provider.description?.toLowerCase().includes(searchLower) ||
        provider.category?.toLowerCase().includes(searchLower) ||
        provider.super_category?.toLowerCase().includes(searchLower) ||
        provider.contact_name?.toLowerCase().includes(searchLower);

      const matchesSuperCategory = filters.superCategory === 'all' || provider.super_category === filters.superCategory;
      const matchesSubCategory = filters.subCategory === 'all' || provider.category === filters.subCategory;
      const matchesDistance = !userLocation || provider.distance === null || provider.distance <= filters.maxDistance;

      return matchesSearch && matchesSuperCategory && matchesSubCategory && matchesDistance;
    })
    .sort((a, b) => {
      if (sortBy === 'distance' && userLocation) {
        if (filters.subCategory === 'all_restaurants') {
          // No specific filter needed
        }
        if (a.distance === null && b.distance === null) return 0;
        if (a.distance === null) return 1;
        if (b.distance === null) return -1;
        return a.distance - b.distance;
      } else {
        // Optimization: No sort needed if no location
      }
      return (b.average_rating || 0) - (a.average_rating || 0);
    });

  const suggestions = searchQuery.trim()
    ? providers.filter(p => JSON.stringify(p).toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 5)
    : [];

  const handleCall = async (phone) => {
    window.location.href = `tel:${phone}`;
  };

  const handleBook = async (provider) => {
    setBookingProvider(provider);
    setIsBookingOpen(true);
  }

  // Derived subcategories
  const currentSubCategories = filters.superCategory !== 'all'
    ? (subCategoriesBySuperCategory[filters.superCategory] || [])
    : [];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20 transition-colors duration-500">

      {/* Search Header */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-14 z-20 border-b border-gray-200 dark:border-slate-800 transition-all duration-300 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 space-y-3">

          <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
            {/* Filters */}
            <div className="flex flex-wrap gap-2 w-full md:w-auto">
              <Select
                value={filters.superCategory}
                onValueChange={(val) => handleFilterChange('superCategory', val)}
              >
                <SelectTrigger className="w-[160px] h-9 text-sm bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
                  <SelectValue placeholder={t('Category')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('All Categories') || 'All Categories'}</SelectItem>
                  {SUPER_CATEGORIES.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.id === 'wallet' ? (language === 'he' ? 'ארנק' : 'Wallet') : t(cat.name_key)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {filters.superCategory !== 'all' && (
                <Select
                  value={filters.subCategory}
                  onValueChange={(val) => handleFilterChange('subCategory', val)}
                >
                  <SelectTrigger className="w-[160px] h-9 text-sm bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
                    <SelectValue placeholder={t('SubCategory')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('All') || 'All'}</SelectItem>
                    {currentSubCategories.map(subCatId => (
                      <SelectItem key={subCatId} value={subCatId}>
                        {getSubCategoryLabel(subCatId, language)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Location & Search */}
            <div className="flex gap-2 w-full md:w-auto items-center">
              {userLocation && (
                <div className="hidden md:flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-slate-800 py-1.5 px-3 rounded-full border border-gray-200 dark:border-slate-700 cursor-pointer hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors" onClick={() => setShowLocationDialog(true)}>
                  <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                  <span className="font-medium max-w-[150px] truncate">{selectedLocationName}</span>
                </div>
              )}

              <div className="relative flex-1 md:w-64">
                <Input
                  placeholder={t('search.placeholder')}
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSuggestions(true);
                  }}
                  className="pl-9 h-9 text-sm bg-gray-100 dark:bg-slate-800 border-transparent focus:bg-white dark:focus:bg-slate-900 transition-all rounded-full"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    {suggestions.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => {
                          navigate(createPageUrl("ServiceProviderDetails") + `?id=${p.id}`);
                          setShowSuggestions(false);
                        }}
                        className="p-3 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 cursor-pointer border-b border-gray-100 dark:border-slate-800 last:border-0 flex items-center gap-3 transition-colors"
                      >
                        <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg flex items-center justify-center font-bold text-indigo-700 dark:text-indigo-300 text-xs">
                          {p.business_name[0]}
                        </div>
                        <div>
                          <div className="font-medium text-sm text-gray-900 dark:text-gray-100">{p.business_name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{p.category}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex h-[calc(100vh-10rem)] gap-6">

          {/* Map Section (Desktop) */}
          <div className="hidden lg:block w-5/12 h-full sticky top-36">
            <div className="rounded-2xl overflow-hidden shadow-glass border border-white/20 h-full relative">
              <GoogleMap
                center={userLocation ? { lat: userLocation.latitude, lng: userLocation.longitude } : { lat: DEFAULT_LOCATION.latitude, lng: DEFAULT_LOCATION.longitude }}
                zoom={12}
                userLocation={userLocation}
                markers={filteredProviders.filter(p => p.latitude).map(p => ({
                  lat: p.latitude,
                  lng: p.longitude,
                  title: p.business_name,
                  icon: getCategoryIcon(p.category),
                  onClick: () => setSelectedMapProvider(p)
                }))}
                height="100%"
                className="h-full w-full"
              />
              <div className="absolute bottom-4 left-4 right-4 pointer-events-none">
                {selectedMapProvider && (
                  <div className="pointer-events-auto">
                    <MapProviderCard
                      provider={selectedMapProvider}
                      onClose={() => setSelectedMapProvider(null)}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* List Section */}
          <div className="w-full lg:w-7/12 overflow-y-auto pr-1 custom-scrollbar pb-24">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-500" />
                {t('search.results_found', { count: filteredProviders.length })}
              </h2>
              <div className="text-xs text-slate-500 flex gap-2">
                <span className={`cursor-pointer px-2 py-1 rounded-md ${sortBy === 'rating' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`} onClick={() => setSortBy('rating')}>Rating</span>
                <span className={`cursor-pointer px-2 py-1 rounded-md ${sortBy === 'distance' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`} onClick={() => setSortBy('distance')}>Distance</span>
              </div>
            </div>

            {filteredProviders.length === 0 ? (
              <GlassCard className="text-center py-16 flex flex-col items-center justify-center gap-4">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                  <Search className="w-8 h-8 text-slate-400" />
                </div>
                <div>
                  <p className="text-slate-900 dark:text-white font-medium text-lg">{t('search.no_results_desc')}</p>
                  <p className="text-slate-500 text-sm mt-1">Try adjusting your filters or search query.</p>
                </div>
                <Button variant="outline" onClick={() => setFilters({ superCategory: 'all', subCategory: 'all', minRating: 0, minReviews: 0, maxDistance: 20000, priceRanges: [], languages: [], emergencyService: false, verifiedOnly: false })} className="mt-2">
                  {t('search.clear_filters')}
                </Button>
              </GlassCard>
            ) : (
              <div className="space-y-4">
                {filteredProviders.slice(0, 20).map((provider, i) => (
                  <GlassCard
                    key={provider.id}
                    hoverEffect={true}
                    className="group cursor-pointer p-0 overflow-hidden"
                    onClick={() => navigate(createPageUrl("ServiceProviderDetails") + `?id=${provider.id}`)}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <div className="flex flex-col sm:flex-row h-full">
                      {/* Image */}
                      <div className="sm:w-32 h-32 sm:h-auto bg-slate-200 dark:bg-slate-800 relative">
                        {provider.images?.[0] ? (
                          <img src={provider.images[0]} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt={provider.business_name} />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400"><Wrench className="w-8 h-8" /></div>
                        )}
                        <div className="absolute top-2 left-2 sm:hidden">
                          <Badge variant="secondary" className="backdrop-blur-md bg-white/80 dark:bg-black/60 shadow-sm text-xs border-0">
                            {getSubCategoryLabel(provider.category, language)}
                          </Badge>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-4 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start gap-2">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-bold text-lg text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">{provider.business_name}</h3>
                                {provider.distance !== null && (
                                  <span className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                                    {(provider.distance / 1000).toFixed(1)} km
                                  </span>
                                )}
                              </div>
                              <div className="hidden sm:inline-block">
                                <Badge variant="outline" className="text-xs border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400">
                                  {getSubCategoryLabel(provider.category, language)}
                                </Badge>
                              </div>
                            </div>
                            <div className="flex flex-col items-end shrink-0">
                              <div className="flex items-center gap-1 font-bold text-amber-500 bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 rounded-md">
                                <Star className="w-3.5 h-3.5 fill-current" />
                                <span className="text-sm">{provider.average_rating?.toFixed(1) || 'N/A'}</span>
                              </div>
                              <span className="text-[10px] text-slate-400 mt-1">{provider.review_count || 0} reviews</span>
                            </div>
                          </div>

                          <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 line-clamp-2">{provider.description}</p>
                        </div>

                        <div className="mt-4 flex gap-2 justify-end">
                          <Button size="sm" variant="ghost" className="h-8 text-xs hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300" onClick={(e) => { e.stopPropagation(); handleCall(provider.phone); }}>
                            <Phone className="w-3.5 h-3.5 mr-1" /> Call
                          </Button>
                          <Button size="sm" className="h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20" onClick={(e) => { e.stopPropagation(); handleBook(provider); }}>
                            <Calendar className="w-3.5 h-3.5 mr-1" /> Book
                          </Button>
                        </div>
                      </div>
                    </div>
                  </GlassCard>
                ))}
              </div>
            )}

            {/* Mobile Fab for manual location trigger if not shown */}
            <div className="lg:hidden fixed bottom-24 left-1/2 -translate-x-1/2 z-30">
              <Button variant="secondary" className="rounded-full shadow-lg bg-white/90 backdrop-blur text-slate-800 border-slate-200" onClick={() => setShowLocationDialog(true)}>
                <MapPin className="w-4 h-4 mr-2 text-indigo-500" /> {selectedLocationName || 'Location'}
              </Button>
            </div>

          </div>
        </div>
      </div>

      {/* Location Dialog */}
      <Dialog open={showLocationDialog} onOpenChange={(open) => {
        setShowLocationDialog(open);
        if (!open) { setLocationDialogView('search'); setTempLocation(null); }
      }}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-slate-900 dark:text-white">{locationDialogView === 'confirm' ? t('confirmLocation') : t('selectLocation')}</DialogTitle>
            {locationDialogView === 'search' && (
              <DialogDescription className="text-slate-500 dark:text-slate-400">{t('dashboard.search_location_description')}</DialogDescription>
            )}
          </DialogHeader>

          {locationDialogView === 'search' ? (
            <div className="space-y-4 py-4">
              <Button onClick={handleUseCurrentLocation} className="w-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 border border-indigo-200 dark:border-indigo-800/50 h-10">
                <Navigation className="w-4 h-4 mr-2 fill-current" /> {t('useMyCurrentLocation')}
              </Button>

              <div className="relative">
                <GooglePlacesAutocomplete
                  placeholder={t('dashboard.search_location_placeholder')}
                  onPlaceSelected={handleManualLocationSelect}
                  className="h-10 w-full rounded-md border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              {locationHistory.length > 0 && (
                <div className="pt-2">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">{t('recentSearches') || "Recent Locations"}</p>
                  <div className="space-y-1">
                    {locationHistory.map((loc, idx) => (
                      <Button key={idx} variant="ghost" className="w-full justify-start h-auto py-2 px-2 text-start font-normal hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300" onClick={() => handleManualLocationSelect(loc)}>
                        <History className="w-3 h-3 mr-2 text-slate-400" />
                        <span className="truncate text-sm">{loc.name}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="h-64 w-full rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 relative shadow-inner">
                {tempLocation && (
                  <GoogleMap
                    center={{ lat: tempLocation.latitude, lng: tempLocation.longitude }}
                    zoom={15}
                    markers={[{ lat: tempLocation.latitude, lng: tempLocation.longitude }]}
                    options={{ disableDefaultUI: true }}
                  />
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setLocationDialogView('search')} className="flex-1 border-slate-200 dark:border-slate-700 dark:text-white dark:hover:bg-slate-800">{t('change')}</Button>
                <Button onClick={confirmLocation} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white">{t('confirm')}</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <BookingDialog
        open={isBookingOpen}
        onOpenChange={setIsBookingOpen}
        providerId={bookingProvider?.id}
        serviceName={bookingProvider?.business_name}
      />

      <AIChatWidget
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        context={`Browsing Service Providers. Category: "${filters.superCategory}". SubCategory: "${filters.subCategory}". Search: "${searchQuery}". Location: "${selectedLocationName || 'Unknown'}"`}
      />

      {!isChatOpen && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            onClick={() => setIsChatOpen(true)}
            className="h-14 w-14 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/30 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
          >
            <Sparkles className="w-6 h-6" />
          </Button>
        </div>
      )}

    </div>
  );
}
