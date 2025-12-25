
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
  Sparkles,
} from "lucide-react";
import ProviderCard from "../components/ProviderCard";
import SuperCategories from "../components/SuperCategories";
import SubCategorySelector from "../components/SubCategorySelector";
import OfflineIndicator from "../components/OfflineIndicator";
import { autoSync } from "@/services/syncService";
import { offlineQuery } from "@/services/offlineQuery";

import SubtleLocationIndicator from "@/components/SubtleLocationIndicator";

import {
  Users,
} from "lucide-react";
import { useUserProfile } from "@/contexts/UserProfileContext";
import ProfileSelectionDialog from "@/components/ProfileSelectionDialog";

import { useLocationContext } from "@/contexts/LocationContext";

export default function Dashboard() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const language = i18n.language;
  const {
    userLocation,
    locationName: selectedLocationName,
    locationHistory,
    updateLocation,
    calculateDistance
  } = useLocationContext(); // Renaming to match existing variable usage for minimal diff

  // selectedLocationName managed by context

  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [selectedSuperCategory, setSelectedSuperCategory] = useState(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState(null);
  // locationHistory managed by context
  const { hasSelectedProfile, userProfile, PROFILES } = useUserProfile();
  const [showProfileDialog, setShowProfileDialog] = useState(false);

  useEffect(() => {
    if (!hasSelectedProfile) {
      const timer = setTimeout(() => setShowProfileDialog(true), 1500); // Small delay for better UX
      return () => clearTimeout(timer);
    }
  }, [hasSelectedProfile]);

  // Removed legacy location logic in favor of LocationSelectorDialog

  useEffect(() => {
    autoSync().catch(err => {
      console.error('Auto-sync failed:', err);
    });
  }, []);

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
            // Use calculateDistance from Context
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

          {/* Profile Switcher */}
          <div className="flex justify-center mb-4">
            <button
              onClick={() => setShowProfileDialog(true)}
              className="group flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md transition-all text-white text-sm font-medium"
            >
              <Users className="w-4 h-4 text-purple-300 group-hover:text-purple-200" />
              <span>
                {userProfile === PROFILES.TOURIST && t('profiles.tourist.title', 'Tourist')}
                {userProfile === PROFILES.NOMAD && t('profiles.nomad.title', 'Digital Nomad')}
                {userProfile === PROFILES.RESIDENT && t('profiles.resident.title', 'Resident')}
                {!userProfile && t('profiles.select_profile', 'Select Profile')}
              </span>
            </button>
          </div>

          {/* Location Bar & Status */}
          <div className="max-w-7xl mx-auto px-4 mb-6 flex justify-center">
            <SubtleLocationIndicator className="py-2 px-4 shadow-lg backdrop-blur-md bg-white/10" />
          </div>

          {/* Super Categories */}
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150 mb-6">
            <SuperCategories
              onSelect={handleSuperCategoryClick}
              selectedCategory={selectedSuperCategory}
            />
          </div>

          {/* Sub Categories */}
          <div className="mb-8">
            {selectedSuperCategory && (
              <div className="animate-in fade-in slide-in-from-top-4 duration-500 flex justify-center">
                <SubCategorySelector
                  superCategory={selectedSuperCategory}
                  selectedSubCategory={selectedSubCategory}
                  onSelectSubCategory={handleSubCategoryClick}
                  language={language}
                  limit={7}
                  onViewMore={() => navigate(`/service-providers?super_category=${selectedSuperCategory}`)}
                />
              </div>
            )}
          </div>

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
            {/* Suggestions can go here */}
          </div>
        </div>
      </div>

      {/* Location Permission UI Blocks (Moved here or kept below?) Keeping below Hero/inside main content usually fine, but let's check structure. 
          The previous structure had Permission blocks after Hero. I will keep them there.
      */}

      {/* Location Permission UI Blocks Removed */}

      {/* Integrated Location Dialog via SubtleLocationIndicator (Self-contained) */}

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
      <ProfileSelectionDialog open={showProfileDialog} onOpenChange={setShowProfileDialog} />
    </div >
  );
}
