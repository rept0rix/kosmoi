// @ts-nocheck
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useQuery } from "@tanstack/react-query";
import { db } from "@/api/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/components/LanguageContext";
import { getTranslation } from "@/components/translations";
import {
  Search,
  CheckCircle,
  MapPin,
  Navigation as NavigationIcon,
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



export default function Home() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const t = (key) => getTranslation(language, key);
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
        // For local development, call Google Geocoding API directly
        // For local development, call Google Geocoding API directly
        const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

        // Fetch English address
        const urlEn = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}&language=en`;
        const responseEn = await fetch(urlEn);
        const dataEn = await responseEn.json();

        // Fetch Thai address
        const urlTh = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}&language=th`;
        const responseTh = await fetch(urlTh);
        const dataTh = await responseTh.json();

        return {
          en: dataEn.results?.[0]?.formatted_address || null,
          th: dataTh.results?.[0]?.formatted_address || null
        };
      }

      // For production, use Supabase backend function
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

  const categories = [
    { id: "handyman", name: t("handyman"), icon: Wrench },
    { id: "carpenter", name: t("carpenter"), icon: Hammer },
    { id: "electrician", name: t("electrician"), icon: Zap },
    { id: "plumber", name: t("plumber"), icon: Droplets },
    { id: "ac_repair", name: t("ac_repair"), icon: Wind },
    { id: "cleaning", name: t("cleaning"), icon: Sparkles },
    { id: "locksmith", name: t("locksmith"), icon: Lock },
    { id: "painter", name: t("painter"), icon: PaintBucket },
    { id: "gardener", name: t("gardener"), icon: Leaf },
    { id: "pest_control", name: t("pest_control"), icon: Bug },
    { id: "moving", name: t("moving"), icon: Truck },
    { id: "internet_tech", name: t("internet_tech"), icon: Wifi },
  ];

  useEffect(() => {
    const savedLocation = localStorage.getItem('userLocation');
    const savedLocationName = localStorage.getItem('locationName');
    const savedLocationAddressEn = localStorage.getItem('locationAddressEn');
    const savedLocationAddressTh = localStorage.getItem('locationAddressTh');

    if (savedLocation) {
      try {
        const location = JSON.parse(savedLocation);
        setUserLocation(location);
        setSelectedLocationName(savedLocationName || 'המיקום שלי');
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

  // Initialize sync on component mount
  useEffect(() => {
    autoSync().catch(err => {
      console.error('Auto-sync failed:', err);
    });
  }, []);

  const checkLocation = async () => {
    if (!navigator.geolocation) {
      setLocationPermission('denied');
      setLocationError('הדפדפן שלך לא תומך בשירותי מיקום');
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

        // Get address from coordinates
        setLoadingAddress(true);
        try {
          const addresses = await getAddressFromCoordinates(location.latitude, location.longitude);
          console.log('Fetched addresses:', addresses);

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
        console.log("Location access error:", error);
        setLocationPermission('denied');
        if (error.code === error.PERMISSION_DENIED) {
          setLocationError('נדרשת הרשאה למיקום');
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          setLocationError('לא ניתן לקבל את המיקום');
        } else {
          setLocationError('שגיאה בקבלת מיקום');
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

    // Get address for predefined location
    setLoadingAddress(true);
    try {
      const addresses = await getAddressFromCoordinates(location.latitude, location.longitude);
      console.log('Fetched addresses for predefined location:', addresses);

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
          categories.find(c => c.id === provider.category)?.name.includes(searchQuery)
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

  const handleCategoryClick = (categoryId) => {
    navigate(createPageUrl("ServiceProviders") + `?category=${categoryId}`);
  };

  const handleSuperCategoryClick = (superCategoryId) => {
    setSelectedSuperCategory(superCategoryId);
    setSelectedSubCategory(null);
  };

  const handleSubCategoryClick = (subCategoryId) => {
    if (subCategoryId.startsWith('all_')) {
      // אם בחרו "הכל", נווט לפי קטגוריה-על בלבד
      navigate(createPageUrl("ServiceProviders") + `?super_category=${selectedSuperCategory}`);
    } else {
      // אחרת, נווט לפי תת-הקטגוריה
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

  // Background images for slideshow
  const [currentImageIndex, setCurrentImageIndex] = React.useState(0);
  const backgroundImages = [
    "https://images.unsplash.com/photo-1552733407-5d5c46c3bb3b?auto=format&fit=crop&w=1920&q=80",
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1920&q=80",
    "https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=1920&q=80",
    "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?auto=format&fit=crop&w=1920&q=80"
  ];

  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % backgroundImages.length);
    }, 5000); // Change every 5 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Offline Indicator */}
      <OfflineIndicator />

      {/* Hero Section with Background Slideshow */}
      <div className="relative h-[500px] overflow-hidden">
        {/* Background Images */}
        {backgroundImages.map((image, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ${index === currentImageIndex ? 'opacity-100' : 'opacity-0'
              }`}
            style={{
              backgroundImage: `url(${image})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
        ))}

        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-black/40" />

        {/* Hero Content */}
        <div className="relative h-full flex flex-col items-center justify-center px-4">
          <h1 className="text-4xl md:text-5xl font-bold text-white text-center mb-8">
            {t('findLocalServices')}
          </h1>

          {/* Search Bar - Centered */}
          <div className="w-full max-w-2xl">
            <div className="relative flex gap-2">
              <div className="flex-1 relative">
                <Input
                  placeholder={t('searchService')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  onFocus={() => searchQuery && setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  className="text-base h-14 bg-white shadow-lg text-lg pr-12"
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
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
                            {categories.find(c => c.id === provider.category)?.name || provider.category}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <Button
                onClick={handleSearch}
                className="bg-blue-600 hover:bg-blue-700 h-14 px-6"
              >
                <Search className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Location Info */}
          {userLocation && (
            <div className="mt-4 bg-black/30 backdrop-blur-sm px-6 py-3 rounded-lg max-w-2xl w-full">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-white flex-shrink-0 mt-1" />
                <div className="flex-1 text-white">
                  <div className="font-semibold text-base mb-2">{selectedLocationName}</div>
                  {loadingAddress ? (
                    <div className="text-sm opacity-90 animate-pulse">טוען כתובת...</div>
                  ) : (
                    <div className="space-y-1">
                      {locationAddressEn && (
                        <div className="text-sm opacity-90 flex items-center gap-2">
                          <span className="font-medium">🇬🇧 EN:</span>
                          <span>{locationAddressEn}</span>
                        </div>
                      )}
                      {locationAddressTh && (
                        <div className="text-sm opacity-90 flex items-center gap-2">
                          <span className="font-medium">🇹🇭 TH:</span>
                          <span>{locationAddressTh}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <Button
                  onClick={() => setShowLocationDialog(true)}
                  size="sm"
                  variant="ghost"
                  className="text-white hover:bg-white/20 h-8 text-xs flex-shrink-0"
                >
                  {t('change')}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

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
              חפש מיקום או בחר מתוך האפשרויות
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            {/* Location Search Bar */}
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Input
                  placeholder="חפש מיקום..."
                  value={locationSearchQuery}
                  onChange={(e) => setLocationSearchQuery(e.target.value)}
                  className="text-base h-12 pr-10"
                />
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
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
                    <MapPin className={`w-4 h-4 ${language === 'he' ? 'ml-2' : 'mr-2'} text-gray-500`} />
                    {location.name}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>



      {/* Blue Separator */}
      <div className="bg-blue-600 py-3">
        <div className="max-w-7xl mx-auto px-4">
          <h3 className="text-white text-center font-semibold text-lg">
            {t('categories')}
          </h3>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-8">
        {/* Temporary Admin Link - Moved to top for visibility */}
        <div className="mb-4">
          <Button
            variant="outline"
            className="w-full border-dashed border-gray-400 text-gray-700 bg-yellow-50 hover:bg-yellow-100 h-12 text-lg"
            onClick={() => navigate(createPageUrl("AdminImporter"))}
          >
            🛠️ כלי ייבוא עסקים (לחץ כאן לייבוא מגוגל)
          </Button>
        </div>

        {/* Weather Widget */}
        <div className="mb-6">
          <WeatherWidget />
        </div>

        {/* Sync Status */}
        <SyncStatus />

        <div>
          <SuperCategories
            onSelect={handleSuperCategoryClick}
            selectedCategory={selectedSuperCategory}
          />
          {selectedSuperCategory && (
            <div className="mt-6">
              <SubCategorySelector
                superCategory={selectedSuperCategory}
                selectedSubCategory={selectedSubCategory}
                onSelectSubCategory={handleSubCategoryClick}
                language={language}
              />
            </div>
          )}
        </div>

        <div>
          <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
            {categories.map((category) => (
              <Card
                key={category.id}
                className="cursor-pointer hover:shadow-md transition-shadow border border-gray-200"
                onClick={() => handleCategoryClick(category.id)}
              >
                <CardContent className="p-2 text-center">
                  <div className="w-10 h-10 mx-auto mb-1 rounded-lg bg-gray-100 flex items-center justify-center">
                    <category.icon className="w-5 h-5 text-gray-700" />
                  </div>
                  <p className="text-xs font-medium text-gray-900 leading-tight">
                    {category.name}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
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
    </div >
  );
}