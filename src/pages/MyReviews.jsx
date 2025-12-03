
import React from "react";
import { db } from '@/api/supabaseClient';
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, MessageSquare, Calendar } from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";
import { getTranslation } from "@/components/translations";
import moment from "moment";

export default function MyReviews() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const t = (key) => getTranslation(language, key);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => db.auth.me(),
  });

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ['myReviews'],
    queryFn: async () => {
      const userReviews = await db.entities.Review.list();
      const providerIds = [...new Set(userReviews.map(r => r.service_provider_id))];

      if (providerIds.length === 0) return [];

      const providers = await db.entities.ServiceProvider.list();
      const providersMap = {};
      providers.forEach(p => {
        providersMap[p.id] = p;
      });

      return userReviews.map(review => ({
        ...review,
        provider: providersMap[review.service_provider_id]
      })).filter(r => r.provider);
    },
    enabled: !!user,
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h2 className="text-2xl font-bold mb-2">נדרשת התחברות</h2>
          <p className="text-gray-600 mb-6">התחבר כדי לראות את הביקורות שלך</p>
          <Button onClick={() => db.auth.redirectToLogin()} className="w-full">
            התחבר
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
            <MessageSquare className="w-8 h-8 text-blue-600" />
            הביקורות שלי
          </h1>
          <p className="text-gray-600 mt-2">כל הביקורות שכתבת על ספקי שירות</p>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-gray-500">טוען...</div>
        ) : reviews.length === 0 ? (
          <Card className="p-12 text-center">
            <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">אין עדיין ביקורות</h3>
            <p className="text-gray-500 mb-6">התחל לכתוב ביקורות על ספקי שירות</p>
            <Button onClick={() => navigate(createPageUrl("ServiceProviders"))}>
              חפש ספקים
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <Card key={review.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    {review.provider.images && review.provider.images.length > 0 ? (
                      <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-200">
                        <img
                          src={review.provider.images[0]}
                          alt={review.provider.business_name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-20 h-20 flex-shrink-0 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
                        <span className="text-2xl text-blue-600">
                          {review.provider.business_name?.charAt(0)}
                        </span>
                      </div>
                    )}

                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3
                            className="font-bold text-lg text-gray-900 cursor-pointer hover:text-blue-600"
                            onClick={() => navigate(createPageUrl("ServiceProviderDetails") + `? id = ${review.provider.id} `)}
                          >
                            {review.provider.business_name}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`w - 4 h - 4 ${star <= review.rating
                                      ? 'fill-yellow-400 text-yellow-400'
                                      : 'text-gray-300'
                                    } `}
                                />
                              ))}
                            </div>
                            <span className="text-sm font-semibold text-gray-900">
                              {review.rating}.0
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Calendar className="w-3 h-3" />
                          {moment(review.created_date).format('DD/MM/YYYY')}
                        </div>
                      </div>

                      {review.service_type && (
                        <div className="text-sm text-gray-600 mb-2">
                          סוג שירות: <span className="font-medium">{review.service_type}</span>
                        </div>
                      )}

                      <p className="text-gray-700 text-sm leading-relaxed mb-3">
                        {review.comment}
                      </p>

                      {review.images && review.images.length > 0 && (
                        <div className="flex gap-2 mb-3 overflow-x-auto">
                          {review.images.map((img, idx) => (
                            <img
                              key={idx}
                              src={img}
                              alt=""
                              className="w-20 h-20 object-cover rounded-lg"
                            />
                          ))}
                        </div>
                      )}

                      {review.would_recommend && (
                        <div className="text-xs text-green-600 font-medium">
                          ✓ ממליץ על ספק זה
                        </div>
                      )}

                      {review.response && (
                        <div className="mt-3 bg-blue-50 rounded-lg p-3 border-r-4 border-blue-500">
                          <div className="text-xs font-semibold text-blue-900 mb-1">
                            תגובת ספק השירות:
                          </div>
                          <p className="text-sm text-blue-800">{review.response}</p>
                        </div>
                      )}
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