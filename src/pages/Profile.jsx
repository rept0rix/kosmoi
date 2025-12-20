import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/shared/lib/utils";
import { db } from '@/api/supabaseClient';
import { useQuery } from "@tanstack/react-query";
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
  LogIn,
  Clock,
  Search as SearchIcon
} from "lucide-react";
import { useTranslation } from "react-i18next";

export default function Profile() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const language = i18n.language;
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => {
      try {
        const userData = await db.auth.me();
        setIsAuthenticated(true);
        return userData;
      } catch (error) {
        setIsAuthenticated(false);
        return null;
      }
    },
  });

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

  useEffect(() => {
    if (!userLoading) {
      setLoading(false);
    }
  }, [userLoading]);

  const handleLogin = () => {
    navigate(`/login?returnUrl=${encodeURIComponent(window.location.pathname)}`);
  };

  const handleLogout = () => {
    db.auth.logout();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-cyan-400 via-cyan-500 to-blue-500">
        <div className="text-white text-lg">{t('loading')}</div>
      </div>
    );
  }

  // Not logged in state
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-400 via-cyan-500 to-blue-500 flex items-center justify-center px-4">
        <Card className="max-w-md w-full bg-white/95 backdrop-blur-sm shadow-2xl">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <User className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              {t('profile.welcome')}
            </h2>
            <p className="text-gray-600 mb-6">
              {t('profile.guest_desc')}
            </p>
            <Button
              onClick={handleLogin}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white h-12 text-lg font-semibold"
            >
              <LogIn className="w-5 h-5 ml-2" />
              {t('profile.login_register')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Logged in state
  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-400 via-cyan-500 to-blue-500 pb-24">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* User Info Card */}
        <Card className="mb-6 bg-white/90 backdrop-blur-sm shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              {user?.profile_image ? (
                <img
                  src={user.profile_image}
                  alt={user.full_name}
                  className="w-20 h-20 rounded-full object-cover shadow-lg"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                  {user?.full_name?.charAt(0) || "?"}
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-2xl font-bold text-gray-900">{user?.full_name || t('profile.default_user')}</h2>
                  {user?.role === "admin" && (
                    <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">
                      <Crown className="w-3 h-3 ml-1" />
                      {t('profile.admin_badge')}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-600">{user?.email}</p>
                {user?.phone && (
                  <p className="text-sm text-gray-600">{user.phone}</p>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(createPageUrl("EditProfile"))}
              >
                <Settings className="w-4 h-4 ml-1" />
                {t('edit')}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* My Activity Section */}
        <Card className="mb-6 bg-white/90 backdrop-blur-sm shadow-xl">
          <CardContent className="p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              {t('profile.my_activity')}
            </h3>
            <div className="space-y-3">
              <button
                onClick={() => navigate(createPageUrl("MyReviews"))}
                className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Star className="w-5 h-5 text-yellow-500" />
                  <span className="text-gray-900 font-medium">{t('myReviews')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-blue-100 text-blue-800">
                    {myReviews?.length || 0}
                  </Badge>
                  {language === 'he' ? <ChevronLeft className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
                </div>
              </button>
              <button
                onClick={() => navigate(createPageUrl("Favorites"))}
                className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Heart className="w-5 h-5 text-red-500" />
                  <span className="text-gray-900 font-medium">{t('favorites.label')}</span>
                </div>
                {language === 'he' ? <ChevronLeft className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
              </button>
              <button
                onClick={() => navigate(createPageUrl("RecentSearches"))}
                className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <SearchIcon className="w-5 h-5 text-gray-600" />
                  <span className="text-gray-900 font-medium">{t('recentSearches')}</span>
                </div>
                {language === 'he' ? <ChevronLeft className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Business Owner Section */}
        <Card className="mb-6 bg-white/90 backdrop-blur-sm shadow-xl">
          <CardContent className="p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Store className="w-5 h-5" />
              {t('profile.business_owners')}
            </h3>
            {myBusiness && myBusiness.length > 0 ? (
              <div>
                <div className="mb-4">
                  <div className="flex items-center gap-4 mb-3">
                    {myBusiness[0].images && myBusiness[0].images.length > 0 ? (
                      <img
                        src={myBusiness[0].images[0]}
                        alt={myBusiness[0].business_name}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white text-2xl font-bold">
                        {myBusiness[0].business_name?.charAt(0) || "?"}
                      </div>
                    )}
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900">{myBusiness[0].business_name}</h4>
                      <p className="text-sm text-gray-600">{myBusiness[0].category}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        <span className="text-sm font-medium">{myBusiness[0].average_rating?.toFixed(1) || "0.0"}</span>
                        <span className="text-xs text-gray-500">({myBusiness[0].total_reviews || 0})</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Button
                      onClick={() => navigate(createPageUrl("BusinessDashboard"))}
                      className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
                    >
                      <Store className="w-5 h-5 ml-2" />
                      {t('profile.manage_business')}
                    </Button>
                    {myBusiness.length === 1 && (
                      <Button
                        onClick={() => navigate(createPageUrl("BusinessRegistration"))}
                        variant="outline"
                        className="w-full"
                      >
                        {t('profile.add_another_business')}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <h4 className="font-semibold text-blue-900 mb-2">{t('profile.why_register_title')}</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• {t('profile.why_register_1')}</li>
                    <li>• {t('profile.why_register_2')}</li>
                    <li>• {t('profile.why_register_3')}</li>
                    <li>• {t('profile.why_register_4')}</li>
                  </ul>
                </div>
                <Button
                  onClick={() => navigate(createPageUrl("BusinessRegistration"))}
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white h-12 text-lg font-semibold shadow-lg"
                >
                  <Store className="w-5 h-5 ml-2" />
                  {t('registerNewBusiness')}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Settings Section */}
        <Card className="mb-6 bg-white/90 backdrop-blur-sm shadow-xl">
          <CardContent className="p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5" />
              {t('profile.settings')}
            </h3>
            <div className="space-y-1">
              <button
                onClick={() => navigate(createPageUrl("EditProfile"))}
                className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-gray-600" />
                  <span className="text-gray-900">{t('profile.edit_profile')}</span>
                </div>
                {language === 'he' ? <ChevronLeft className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
              </button>
              <button className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                <div className="flex items-center gap-3">
                  <Globe className="w-5 h-5 text-gray-600" />
                  <span className="text-gray-900">{t('profile.language')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">{t('hebrew')}</span>
                  {language === 'he' ? <ChevronLeft className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                </div>
              </button>
              <button className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-gray-600" />
                  <span className="text-gray-900">{t('profile.accessibility')}</span>
                </div>
                {language === 'he' ? <ChevronLeft className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
              </button>
              <button className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-5 h-5 text-gray-600" />
                  <span className="text-gray-900">{t('footer.contact_us')}</span>
                </div>
                {language === 'he' ? <ChevronLeft className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Logout Button */}
        <Button
          onClick={handleLogout}
          className="w-full bg-white/90 backdrop-blur-sm hover:bg-white text-red-600 border-2 border-red-200 h-12 font-semibold shadow-lg"
        >
          <LogOut className="w-5 h-5 ml-2" />
          {t('logout')}
        </Button>
      </div>
    </div>
  );
}