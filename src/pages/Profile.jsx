import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/shared/lib/utils";
import { db } from '@/api/supabaseClient';
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/features/auth/context/AuthContext"; // Use Global Auth
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Star,
  Settings,
  Globe,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Store,
  Crown,
  Shield,
  Heart,
  MessageSquare,
  Clock,
  Search as SearchIcon,
  Wallet
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { GlassCard } from "@/components/ui/GlassCard"; // Assuming generic GlassCard exists, or we style manually

export default function Profile() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const language = i18n.language;

  // Use Global Auth Context
  const { user, isAuthenticated, isLoadingAuth, logout } = useAuth();

  // Thai Street Atmosphere Background (Consistent with Login/Home)
  const BG_IMAGE = "https://images.unsplash.com/photo-1535189043414-47a3c49a0bed?q=80&w=2832&auto=format&fit=crop";

  const { data: myReviews } = useQuery({
    queryKey: ["myReviews", user?.email],
    queryFn: () => db.entities.Review.filter({ created_by: user.email }),
    initialData: [],
    enabled: !!user && isAuthenticated,
  });

  const { data: myBusiness } = useQuery({
    queryKey: ["myBusiness", user?.email],
    queryFn: () => db.entities.ServiceProvider.filter({ created_by: user.email }),
    initialData: [],
    enabled: !!user && isAuthenticated,
  });

  // Redirect if not logged in
  useEffect(() => {
    console.log("Profile Page User Object:", user);
    console.log("Profile Page User Metadata:", user?.user_metadata);

    if (!isLoadingAuth && !isAuthenticated) {
      navigate(`/login?returnUrl=${encodeURIComponent(window.location.pathname)}`);
    }
  }, [isLoadingAuth, isAuthenticated, navigate, user]);

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen relative flex items-center justify-center font-sans overflow-hidden bg-slate-900">
        <div className="text-white flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-lg font-light">Loading Profile...</p>
        </div>
      </div>
    );
  }

  // Double safe guard
  if (!user) return null;

  return (
    <div className="min-h-screen relative font-sans text-slate-100" dir={language === 'he' ? 'rtl' : 'ltr'}>
      {/* Background Image with Overlay */}
      <div className="fixed inset-0 z-0">
        <img
          src={BG_IMAGE}
          alt="Thai Street Atmosphere"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-[4px]"></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-8 space-y-6">

        {/* Header / User Info */}
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 shadow-2xl">
          <div className="absolute top-0 right-0 p-6 opacity-20 pointer-events-none">
            <img src="/logo-white.svg" className="w-32 h-auto" alt="" />
            {/* Fallback decoration if no logo */}
            <div className="w-32 h-32 bg-blue-500/30 rounded-full blur-3xl absolute -top-10 -right-10"></div>
          </div>

          <div className="flex flex-col md:flex-row items-center md:items-start gap-6 relative z-10">
            {user?.user_metadata?.avatar_url || user?.user_metadata?.picture ? (
              <img
                src={user.user_metadata.avatar_url || user.user_metadata.picture}
                alt={user.user_metadata.full_name || user.email}
                className="w-24 h-24 rounded-full object-cover border-4 border-white/10 shadow-xl"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white text-3xl font-bold border-4 border-white/10 shadow-xl">
                {(user?.user_metadata?.full_name?.[0] || user?.email?.[0] || 'U').toUpperCase()}
              </div>
            )}

            <div className="flex-1 text-center md:text-left rtl:md:text-right">
              <div className="flex items-center justify-center md:justify-start rtl:md:justify-start gap-3 mb-2">
                <h2 className="text-3xl font-bold text-white tracking-tight">
                  {user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || t('profile.default_user')}
                </h2>
                {user?.role === "admin" && (
                  <Badge className="bg-purple-500/20 text-purple-200 border-purple-500/30">
                    <Crown className="w-3 h-3 mr-1" />
                    Admin
                  </Badge>
                )}
              </div>
              <p className="text-slate-300 font-light mb-4">{user?.email}</p>
              <div className="flex items-center justify-center md:justify-start rtl:md:justify-start gap-3">
                <Button
                  size="sm"
                  variant="outline"
                  className="border-white/20 bg-white/5 hover:bg-white/10 text-white"
                  onClick={() => navigate(createPageUrl("EditProfile"))}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  {t('edit')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">


        {/* Wallet & Payments */}
        <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md p-6 hover:bg-white/10 transition-colors">
          <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400">
              <Wallet className="w-5 h-5" />
            </div>
            {t('wallet.title') || "Wallet & Payments"}
          </h3>

          <div className="bg-gradient-to-br from-blue-600/20 to-indigo-600/20 rounded-2xl p-5 border border-white/5 mb-4">
            <p className="text-slate-400 text-sm mb-1">{t('wallet.balance') || "Current Balance"}</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-white">฿0.00</span>
              <span className="text-sm text-slate-400">THB</span>
            </div>
          </div>

          <Button
            className="w-full bg-blue-600/80 hover:bg-blue-600 text-white"
            onClick={() => navigate('/wallet')}
          >
            {t('wallet.manage') || "Open Wallet"}
          </Button>
        </div>

        {/* My Activity */}
        <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md p-6 hover:bg-white/10 transition-colors">
          <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-400" />
            {t('profile.my_activity')}
          </h3>
          <div className="space-y-2">
            {[
              { label: t('myReviews'), icon: Star, count: myReviews?.length, color: 'text-yellow-400', path: "MyReviews" },
              { label: t('favorites.label'), icon: Heart, count: null, color: 'text-red-400', path: "Favorites" },
              { label: t('recentSearches'), icon: SearchIcon, count: null, color: 'text-slate-400', path: "RecentSearches" },
            ].map((item, i) => (
              <button
                key={i}
                onClick={() => navigate(createPageUrl(item.path))}
                className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors`}>
                    <item.icon className={`w-5 h-5 ${item.color}`} />
                  </div>
                  <span className="text-slate-200 group-hover:text-white font-medium">{item.label}</span>
                </div>
                <div className="flex items-center gap-3">
                  {item.count !== undefined && item.count !== null && (
                    <span className="text-xs bg-white/10 px-2 py-1 rounded-full text-slate-300">{item.count}</span>
                  )}
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors rtl:rotate-180" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Business Center */}
        <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md p-6 hover:bg-white/10 transition-colors">
          <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <Store className="w-5 h-5 text-green-400" />
            {t('profile.business_owners')}
          </h3>

          {myBusiness && myBusiness.length > 0 ? (
            <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
              <div className="flex items-start gap-4 mb-4">
                {myBusiness[0].images?.[0] ? (
                  <img src={myBusiness[0].images[0]} className="w-12 h-12 rounded-lg object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center text-green-400 font-bold">
                    {myBusiness[0].business_name[0]}
                  </div>
                )}
                <div>
                  <h4 className="text-white font-medium line-clamp-1">{myBusiness[0].business_name}</h4>
                  <p className="text-xs text-slate-400">{myBusiness[0].category}</p>
                </div>
              </div>
              <Button
                className="w-full bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-600/20"
                onClick={() => navigate(createPageUrl("BusinessDashboard"))}
              >
                {t('profile.manage_business')}
              </Button>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-slate-400 mb-6 leading-relaxed">
                {t('profile.guest_desc')}
              </p>
              <Button
                className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/10"
                onClick={() => navigate(createPageUrl("BusinessRegistration"))}
              >
                {t('registerNewBusiness')}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Global actions */}
      <div className="grid grid-cols-1 gap-4">
        <Button
          variant="destructive"
          className="w-full py-6 rounded-2xl bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20"
          onClick={() => logout()}
        >
          <LogOut className="w-5 h-5 mr-2" />
          {t('logout')}
        </Button>
      </div>

    </div>
  );
}