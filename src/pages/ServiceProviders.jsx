// @ts-nocheck
import React, { useState, useEffect } from "react";
import { db } from '@/api/supabaseClient';
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  MapPin,
  Phone,
  Star,
  MessageCircle,
  CheckCircle,
  X,
  Navigation,
  Wrench,
  Hammer,
  Zap,
  Droplets,
  Wind,
  Sparkles,
  Lock,
  PaintBucket,
  Leaf,
  Bug,
  Truck,
  Wifi,
  User,
  Calendar, // Imported Calendar icon
} from "lucide-react";
import GoogleMap from "../components/GoogleMap";
import MapProviderCard from "@/components/MapProviderCard";
import BookingDialog from "@/components/BookingDialog"; // Imported BookingDialog
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import SearchFiltersPanel from "../components/SearchFiltersPanel";
import SuperCategories from "../components/SuperCategories";
import SubCategorySelector from "../components/SubCategorySelector";
import { useLanguage } from "@/components/LanguageContext";
import { getTranslation } from "@/components/translations";
import { getCategoryIcon } from "@/utils/mapIcons";
import { getSubCategoryLabel } from "../components/subCategories";

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

/**
 * ServiceProviders Page
 *
 * Displays a list of service providers with filtering, searching, and map view capabilities.
 * Allows users to find and contact local businesses in Koh Samui.
 *
 * Filter Params (URL):
 * - search: Search query string
 * - super_category: Main category filter
 * - sub_category: Specific sub-category filter
 */
export default function ServiceProviders() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const t = (key) => getTranslation(language, key);
  const urlParams = new URLSearchParams(window.location.search);

  const [searchQuery, setSearchQuery] = useState(urlParams.get('search') || '');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [sortBy, setSortBy] = useState('rating');
  const [userLocation, setUserLocation] = useState(null);
  const [selectedMapProvider, setSelectedMapProvider] = useState(null);

  // Booking State
  const [bookingProvider, setBookingProvider] = useState(null);
  const [isBookingOpen, setIsBookingOpen] = useState(false);

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
  const [isOpenNow, setIsOpenNow] = useState(false);

  const activeFiltersCount = [
    filters.minRating > 0,
    filters.minReviews > 0,
    filters.maxDistance < 50,
    (filters.priceRanges || []).length > 0,
    filters.emergencyService,
    filters.verifiedOnly,
    isOpenNow,
    filters.superCategory !== 'all',
    filters.subCategory !== 'all'
  ].filter(Boolean).length;

  useEffect(() => {
    const savedLocation = localStorage.getItem('userLocation');
    if (savedLocation) {
      try {
        setUserLocation(JSON.parse(savedLocation));
      } catch (error) {
        console.error('Error parsing saved location:', error);
      }
    } else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
          setUserLocation(location);
          localStorage.setItem('userLocation', JSON.stringify(location));
        },
        (error) => { } // console.log("Location access error:", error)
      );
    }
  }, []);

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
      const matchesSearch = !searchQuery ||
        provider.business_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        provider.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        provider.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        provider.super_category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        provider.contact_name?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesSuperCategory = filters.superCategory === 'all' || provider.super_category === filters.superCategory;
      // FIX: Use provider.category to match subCategory filter
      const matchesSubCategory = filters.subCategory === 'all' || provider.category === filters.subCategory;

      const matchesRating = (provider.average_rating || 0) >= filters.minRating;
      const matchesReviews = (provider.total_reviews || 0) >= filters.minReviews;
      const matchesDistance = !userLocation || provider.distance === null || provider.distance <= filters.maxDistance;

      const matchesPriceRange = filters.priceRanges.length === 0 ||
        filters.priceRanges.includes(provider.price_range);

      const matchesLanguages = filters.languages.length === 0 ||
        (provider.languages && filters.languages.some(lang => provider.languages.includes(lang)));

      const matchesEmergency = !filters.emergencyService || provider.emergency_service;
      const matchesVerified = !filters.verifiedOnly || provider.verified;

      const matchesOpenNow = !isOpenNow || true;

      return matchesSearch && matchesSuperCategory && matchesSubCategory &&
        matchesRating && matchesReviews && matchesDistance &&
        matchesPriceRange && matchesLanguages && matchesEmergency && matchesVerified && matchesOpenNow;
    })
    .sort((a, b) => {
      if (sortBy === 'distance' && userLocation) {
        if (a.distance === null) return 1;
        if (b.distance === null) return -1;
        return a.distance - b.distance;
      }
      if (sortBy === 'reviews') {
        return (b.total_reviews || 0) - (a.total_reviews || 0);
      }
      return (b.average_rating || 0) - (a.average_rating || 0);
    });

  const suggestions = searchQuery.trim()
    ? providers
      .filter(p =>
        p.business_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .slice(0, 5)
    : [];

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

  const handleWhatsApp = async (phone) => {
    try {
      const isAuth = await db.auth.isAuthenticated();
      if (!isAuth) {
        db.auth.redirectToLogin(window.location.pathname);
        return;
      }
      window.open(`https://wa.me/${phone.replace(/[^0-9]/g, '')}`, '_blank');
    } catch (error) {
      db.auth.redirectToLogin(window.location.pathname);
    }
  };

  const handleBook = async (provider) => {
    const isAuth = await db.auth.isAuthenticated();
    if (!isAuth) {
      db.auth.redirectToLogin(window.location.pathname);
      return;
    }
    setBookingProvider(provider);
    setIsBookingOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Search Bar */}
      <div className="bg-white px-4 py-3 shadow-sm sticky top-14 z-30">
        <div className="max-w-7xl mx-auto space-y-3">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Input
                placeholder="חפש שירות, עסק, קטגוריה..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => searchQuery && setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                className="text-base pr-10"
              />
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />

              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-auto">
                  {suggestions.map((provider) => (
                    <div
                      key={provider.id}
                      onClick={() => {
                        navigate(createPageUrl("ServiceProviderDetails") + `?id=${provider.id}`);
                        setShowSuggestions(false);
                        setSearchQuery("");
                      }}
                      className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0 flex items-center gap-3"
                    >
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        {provider.images?.[0] ? (
                          <img src={provider.images[0]} alt={provider.business_name} className="w-full h-full object-cover rounded-lg" />
                        ) : (
                          <span className="text-gray-500 font-bold text-lg">{provider.business_name?.charAt(0)}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{provider.business_name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            <span className="text-xs font-medium">{provider.average_rating?.toFixed(1) || '0.0'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Super Categories */}
          <SuperCategories
            selectedCategory={filters.superCategory}
            onSelectCategory={(value) => setFilters(prev => ({ ...prev, superCategory: value, subCategory: 'all' }))}
          />

          {/* Sub Category Selector */}
          <SubCategorySelector
            superCategory={filters.superCategory}
            selectedSubCategory={filters.subCategory}
            onSelectSubCategory={(value) => setFilters(prev => ({ ...prev, subCategory: value === prev.subCategory ? 'all' : value }))}
            language={language}
          />

          {/* Filters Panel */}
          <SearchFiltersPanel
            filters={filters}
            onFiltersChange={setFilters}
            language={language}
          />

          <div className="flex items-center gap-2 pt-1">
            <Button
              variant={isOpenNow ? "default" : "outline"}
              size="sm"
              onClick={() => setIsOpenNow(!isOpenNow)}
              className="text-xs"
            >
              פתוח עכשיו
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Area - Split View */}
      <div className="flex h-[calc(100vh-12rem)]">
        {/* Map - Desktop Only */}
        <div className="hidden lg:block lg:w-1/2 sticky top-28 h-full relative">
          <GoogleMap
            center={{ lat: 9.5297, lng: 100.0626 }}
            zoom={12}
            userLocation={userLocation}
            markers={filteredProviders
              .filter(p => p.latitude && p.longitude)
              .map(provider => ({
                lat: provider.latitude,
                lng: provider.longitude,
                title: provider.business_name,
                icon: getCategoryIcon(provider.category),
                onClick: () => setSelectedMapProvider(provider)
              }))}
            height="100%"
          />

          {/* Map Popup Card */}
          {selectedMapProvider && (
            <MapProviderCard
              provider={selectedMapProvider}
              onClose={() => setSelectedMapProvider(null)}
            />
          )}
        </div>

        {/* Results List */}
        <div className="w-full lg:w-1/2 overflow-y-auto">
          <div className="max-w-full mx-auto px-4 py-3">
            {/* Results Header */}
            <div className="mb-4 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                נמצאו <span className="font-semibold text-gray-900">{filteredProviders.length}</span> ספקי שירות
              </div>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rating">
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4" />
                      דירוג
                    </div>
                  </SelectItem>
                  <SelectItem value="reviews">
                    <div className="flex items-center gap-2">
                      <MessageCircle className="w-4 h-4" />
                      ביקורות
                    </div>
                  </SelectItem>
                  {userLocation && (
                    <SelectItem value="distance">
                      <div className="flex items-center gap-2">
                        <Navigation className="w-4 h-4" />
                        מרחק
                      </div>
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Results */}
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden h-full flex flex-col">
                    {/* Image Skeleton */}
                    <Skeleton className="h-48 w-full rounded-none" />
                    <div className="p-5 flex flex-col flex-1 gap-3">
                      {/* Badge & Rating Skeleton */}
                      <div className="flex justify-between">
                        <Skeleton className="h-6 w-20 rounded-full" />
                        <Skeleton className="h-6 w-12 rounded-full" />
                      </div>
                      {/* Title Skeleton */}
                      <Skeleton className="h-7 w-3/4 rounded-md" />
                      {/* Description Skeleton */}
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-full rounded-md" />
                        <Skeleton className="h-4 w-5/6 rounded-md" />
                      </div>
                      {/* Footer Skeleton */}
                      <div className="mt-auto pt-4 flex gap-2">
                        <Skeleton className="h-10 flex-1 rounded-lg" />
                        <Skeleton className="h-10 flex-1 rounded-lg" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredProviders.length === 0 ? (
              <Card className="p-12 text-center bg-white">
                <div className="max-w-md mx-auto">
                  <div className="w-24 h-24 mx-auto mb-4 bg-blue-50 rounded-full flex items-center justify-center">
                    <Search className="w-12 h-12 text-blue-300" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">לא נמצאו תוצאות עבור החיפוש</h3>
                  <p className="text-gray-500 mb-6">
                    נסה לשנות את הפילטרים, להרחיב את טווח החיפוש או לחפש מונחים אחרים
                  </p>
                  {activeFiltersCount > 0 && (
                    <Button
                      onClick={() => {
                        setFilters({
                          minRating: 0,
                          minReviews: 0,
                          maxDistance: 50,
                          priceRanges: [],
                          languages: [],
                          emergencyService: false,
                          verifiedOnly: false,
                          superCategory: 'all',
                          subCategory: 'all',
                        });
                        setIsOpenNow(false);
                      }}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <X className="w-4 h-4 ml-2" />
                      נקה את כל הפילטרים
                    </Button>
                  )}
                </div>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredProviders.map((provider) => {
                  const CategoryIcon = {
                    handyman: Wrench,
                    carpenter: Hammer,
                    electrician: Zap,
                    plumber: Droplets,
                    ac_repair: Wind,
                    cleaning: Sparkles,
                    locksmith: Lock,
                    painter: PaintBucket,
                    gardener: Leaf,
                    pest_control: Bug,
                    moving: Truck,
                    internet_tech: Wifi,
                    car_mechanic: Wrench,
                    translator: User,
                    visa_services: User,
                    real_estate_agent: MapPin,
                  }[provider.category] || Wrench;

                  return (
                    <Card
                      key={provider.id}
                      className="hover:shadow-md transition-shadow border border-gray-200 cursor-pointer"
                      onClick={() => navigate(createPageUrl("ServiceProviderDetails") + `?id=${provider.id}`)}
                    >
                      <CardContent className="p-4">
                        <div className="flex gap-4">
                          {/* Image or Placeholder */}
                          <div className="w-24 h-24 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
                            {provider.images?.[0] ? (
                              <img src={provider.images[0]} alt={provider.business_name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-300">
                                <CategoryIcon className="w-8 h-8" />
                              </div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-1">
                              <div>
                                <Badge className="bg-blue-600 text-white hover:bg-blue-600 mb-1 text-xs">
                                  {getSubCategoryLabel(provider.category, language)}
                                </Badge>
                                <h3 className="font-bold text-gray-900 text-lg">
                                  {provider.business_name}
                                </h3>
                              </div>
                              {provider.verified && (
                                <CheckCircle className="w-5 h-5 text-green-500" />
                              )}
                            </div>

                            <div className="flex items-center gap-3 mb-2">
                              <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                <span className="font-semibold text-sm">
                                  {provider.average_rating?.toFixed(1) || '0.0'}
                                </span>
                              </div>
                              <span className="text-xs text-gray-500">
                                ({provider.total_reviews || 0} ביקורות)
                              </span>
                            </div>

                            <div className="flex items-center gap-2 text-xs text-gray-600 mb-3 flex-wrap">
                              {provider.location && (
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  <span className="truncate">{provider.location}</span>
                                </div>
                              )}
                              {provider.distance !== null && provider.distance !== undefined && (
                                <>
                                  {provider.location && <span className="text-gray-300">•</span>}
                                  <div className="flex items-center gap-1">
                                    <Navigation className="w-3 h-3 text-blue-500" />
                                    <span className="font-medium text-blue-600">{provider.distance.toFixed(1)} ק"מ</span>
                                  </div>
                                </>
                              )}
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                              <Button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleBook(provider);
                                }}
                                className="bg-blue-600 hover:bg-blue-700 h-9"
                                size="sm"
                              >
                                <Calendar className="w-4 h-4 mr-2" />
                                הזמן
                              </Button>
                              <Button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCall(provider.phone);
                                }}
                                className="bg-blue-600 hover:bg-blue-700 h-9"
                                size="sm"
                              >
                                <Phone className="w-4 h-4 mr-2" />
                                חייג
                              </Button>
                              {provider.whatsapp && (
                                <Button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleWhatsApp(provider.whatsapp);
                                  }}
                                  className="bg-green-600 hover:bg-green-700 h-9"
                                  size="sm"
                                >
                                  <MessageCircle className="w-4 h-4 mr-2" />
                                  וואטסאפ
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
      <BookingDialog
        open={isBookingOpen}
        onOpenChange={setIsBookingOpen}
        providerId={bookingProvider?.id}
        serviceName={bookingProvider?.business_name || "General Service"}
      />
    </div >
  );
}
