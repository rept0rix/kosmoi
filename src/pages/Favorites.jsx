
import React from "react";
import { db } from '@/api/supabaseClient';
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/shared/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin, Phone, MessageCircle, Heart, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useAuth } from "@/features/auth/context/AuthContext";

export default function Favorites() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const language = i18n.language;

  const { user } = useAuth();

  const { data: favorites = [], isLoading, refetch } = useQuery({
    queryKey: ['favorites'],
    queryFn: async () => {
      const favs = await db.entities.Favorite.list();
      const providerIds = favs.map(f => f.service_provider_id);
      if (providerIds.length === 0) return [];

      const providers = await db.entities.ServiceProvider.list();
      return providers.filter(p => providerIds.includes(p.id));
    },
    enabled: !!user,
  });

  const handleRemoveFavorite = async (providerId) => {
    const fav = await db.entities.Favorite.filter({ service_provider_id: providerId });
    if (fav.length > 0) {
      await db.entities.Favorite.delete(fav[0].id);
      refetch();
    }
  };

  const handleCall = async (phone) => {
    try {
      const isAuth = await db.auth.isAuthenticated();
      if (!isAuth) {
        db.auth.redirectToLogin(window.location.pathname);
        return;
      }
      window.location.href = `tel:${phone} `;
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

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <Heart className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h2 className="text-2xl font-bold mb-2">{t('favorites.loginRequired')}</h2>
          <p className="text-gray-600 mb-6">{t('favorites.login_desc')}</p>
          <Button onClick={() => db.auth.redirectToLogin()} className="w-full">
            {t('login')}
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Heart className="w-8 h-8 text-red-500 fill-red-500" />
            {t('favorites.title')}
          </h1>
          <p className="text-gray-600 mt-2">{t('favorites.subtitle')}</p>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-gray-500">{t('loading')}</div>
        ) : favorites.length === 0 ? (
          <Card className="p-12 text-center">
            <Heart className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">{t('favorites.empty_title')}</h3>
            <p className="text-gray-500 mb-6">{t('favorites.empty_desc')}</p>
            <Button onClick={() => navigate(createPageUrl("ServiceProviders"))}>
              {t('favorites.search_providers')}
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {favorites.map((provider) => (
              <Card key={provider.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    {provider.images && provider.images.length > 0 ? (
                      <div className="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-gray-200">
                        <img
                          src={provider.images[0]}
                          alt={provider.business_name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-24 h-24 flex-shrink-0 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
                        <span className="text-3xl text-blue-600">
                          {provider.business_name?.charAt(0)}
                        </span>
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-bold text-lg text-gray-900">
                          {provider.business_name}
                        </h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveFavorite(provider.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-semibold text-sm">
                            {provider.average_rating?.toFixed(1) || '0.0'}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          ({provider.total_reviews || 0} {t('reviews')})
                        </span>
                      </div>

                      {provider.location && (
                        <div className="flex items-center gap-1 text-sm text-gray-600 mb-3">
                          <MapPin className="w-4 h-4" />
                          <span>{provider.location}</span>
                        </div>
                      )}

                      <div className="grid grid-cols-3 gap-2">
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCall(provider.phone);
                          }}
                          className="bg-blue-600 hover:bg-blue-700 h-9"
                          size="sm"
                        >
                          <Phone className="w-4 h-4" />
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
                            <MessageCircle className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          onClick={() => navigate(createPageUrl("ServiceProviderDetails") + `?id=${provider.id}`)}
                          variant="outline"
                          className="h-9"
                          size="sm"
                        >
                          {t('action.details')}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}