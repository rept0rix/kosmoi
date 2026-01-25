// @ts-nocheck
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/shared/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { db } from "@/api/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useTranslation } from "react-i18next";
import { Search, MapPin, Sparkles, Users, Compass, Star } from "lucide-react";
import ProviderCard from "../components/ProviderCard";
import SuperCategories from "../components/SuperCategories";
import SubCategorySelector from "../components/SubCategorySelector";
import OfflineIndicator from "../components/OfflineIndicator";
import { autoSync } from "@/services/syncService";
import { offlineQuery } from "@/services/offlineQuery";

import SubtleLocationIndicator from "@/components/SubtleLocationIndicator";
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
    calculateDistance,
  } = useLocationContext();

  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [selectedSuperCategory, setSelectedSuperCategory] = useState(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState(null);
  const { hasSelectedProfile, userProfile, PROFILES } = useUserProfile();
  const [showProfileDialog, setShowProfileDialog] = useState(false);

  useEffect(() => {
    if (!hasSelectedProfile) {
      const timer = setTimeout(() => setShowProfileDialog(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [hasSelectedProfile]);

  useEffect(() => {
    autoSync().catch((err) => {
      console.error("Auto-sync failed:", err);
    });
  }, []);

  const { data: allProviders = [] } = useQuery({
    queryKey: ["allProviders"],
    queryFn: () => offlineQuery.ServiceProvider.filter({ status: "active" }),
    initialData: [],
  });

  const { data: providers, isLoading } = useQuery({
    queryKey: ["topProviders", userLocation],
    queryFn: async () => {
      const allProviders = await offlineQuery.ServiceProvider.filter({
        status: "active",
      });

      let filteredProviders = allProviders;

      if (userLocation) {
        filteredProviders = filteredProviders.map((provider) => {
          if (provider.latitude && provider.longitude) {
            const distance = calculateDistance(
              userLocation.latitude,
              userLocation.longitude,
              provider.latitude,
              provider.longitude,
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
      const filtered = allProviders
        .filter((provider) => {
          const searchLower = searchQuery.toLowerCase();
          return (
            provider.business_name?.toLowerCase().includes(searchLower) ||
            provider.description?.toLowerCase().includes(searchLower) ||
            provider.category?.includes(searchLower)
          );
        })
        .slice(0, 5);
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchQuery, allProviders]);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(
        createPageUrl("ServiceProviders") +
          `?search=${encodeURIComponent(searchQuery)}`,
      );
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
    if (subCategoryId.startsWith("all_")) {
      navigate(
        createPageUrl("ServiceProviders") +
          `?super_category=${selectedSuperCategory}`,
      );
    } else {
      navigate(
        createPageUrl("ServiceProviders") +
          `?super_category=${selectedSuperCategory}&sub_category=${subCategoryId}`,
      );
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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans transition-colors duration-500">
      <OfflineIndicator />

      {/* Hero Section */}
      <div className="relative isolate overflow-hidden bg-white pb-12 pt-16 sm:pb-32 lg:pb-32 lg:pt-32 mb-8 border-b border-slate-200 shadow-sm">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 text-center relative z-10">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-6xl mb-6">
            {t("dashboard.hero_title")}
            <span className="text-blue-600 block sm:inline sm:ml-3">
              Island Life
            </span>
          </h1>
          <p className="mt-4 text-xl leading-8 text-slate-600 max-w-2xl mx-auto mb-10">
            {t("dashboard.hero_subtitle")}
          </p>

          {/* Profile Switcher */}
          <div className="flex justify-center mb-6">
            <button
              onClick={() => setShowProfileDialog(true)}
              className="group flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-all text-slate-700 text-sm font-medium"
            >
              <Users className="w-4 h-4 text-slate-500 group-hover:text-blue-600 transition-colors" />
              <span className="tracking-wide">
                {userProfile === PROFILES.TOURIST &&
                  t("profiles.tourist.title", "Tourist")}
                {userProfile === PROFILES.NOMAD &&
                  t("profiles.nomad.title", "Digital Nomad")}
                {userProfile === PROFILES.RESIDENT &&
                  t("profiles.resident.title", "Resident")}
                {!userProfile && t("profiles.select_profile", "Select Profile")}
              </span>
            </button>
          </div>

          {/* Location Bar & Status */}
          <div className="max-w-7xl mx-auto px-4 mb-8 flex justify-center">
            <SubtleLocationIndicator className="py-2.5 px-6 shadow-sm bg-white border border-slate-200 rounded-full text-sm hover:border-blue-300 transition-colors" />
          </div>

          {/* Super Categories */}
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150 mb-8">
            <SuperCategories
              onSelect={handleSuperCategoryClick}
              selectedCategory={selectedSuperCategory}
            />
          </div>

          {/* Sub Categories */}
          <div className="mb-10">
            {selectedSuperCategory && (
              <div className="animate-in fade-in slide-in-from-top-4 duration-500 flex justify-center">
                <SubCategorySelector
                  superCategory={selectedSuperCategory}
                  selectedSubCategory={selectedSubCategory}
                  onSelectSubCategory={handleSubCategoryClick}
                  language={language}
                  limit={7}
                  onViewMore={() =>
                    navigate(
                      `/service-providers?super_category=${selectedSuperCategory}`,
                    )
                  }
                />
              </div>
            )}
          </div>

          {/* Integrated Search Bar */}
          <div className="max-w-3xl mx-auto mb-16 relative">
            <div className="relative flex items-center group">
              <Input
                className="h-14 sm:h-16 pl-8 pr-20 rounded-2xl bg-white border border-slate-200 text-lg shadow-lg text-slate-900 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-blue-500 transition-all"
                placeholder={t("dashboard.search_placeholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                onFocus={() => searchQuery && setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              />
              <div className="absolute right-3 flex items-center gap-2">
                <Button
                  size="icon"
                  variant="default"
                  className="h-11 w-11 rounded-xl bg-blue-600 hover:bg-blue-700"
                  onClick={handleSearch}
                >
                  <Search className="h-5 w-5 text-white" />
                </Button>
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-11 w-11 rounded-xl bg-slate-100 hover:bg-slate-200"
                  onClick={() => navigate("/ai-chat")}
                  title={t("search.ask_ai_tooltip")}
                >
                  <Sparkles className="h-5 w-5 text-blue-600" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-12">
        <div className="mb-6">
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <Compass className="w-6 h-6 text-blue-600" />
                {userLocation
                  ? t("nearbyProviders")
                  : t("recommendedProviders")}
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(createPageUrl("ServiceProviders"))}
                className="text-xs"
              >
                {t("seeAll")}
              </Button>
            </div>

            {isLoading ? (
              <div className="text-center py-12 text-slate-500 animate-pulse">
                {t("loading")}...
              </div>
            ) : providers.length === 0 ? (
              <Card className="p-8 text-center bg-slate-50 border-slate-200">
                <p className="text-slate-500 text-sm">{t("noProviders")}</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
      <ProfileSelectionDialog
        open={showProfileDialog}
        onOpenChange={setShowProfileDialog}
      />
    </div>
  );
}
