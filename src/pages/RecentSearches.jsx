
import React from "react";
import { db } from '@/api/supabaseClient';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, Clock, X, Trash2 } from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";
import { getTranslation } from "@/components/translations";
import moment from "moment";

export default function RecentSearches() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { language } = useLanguage();
  const t = (key) => getTranslation(language, key);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => db.auth.me(),
  });

  const { data: searches = [], isLoading } = useQuery({
    queryKey: ['recentSearches'],
    queryFn: () => db.entities.SearchHistory.list('-created_date', 20),
    enabled: !!user,
  });

  const deleteSearchMutation = useMutation({
    mutationFn: (id) => db.entities.SearchHistory.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recentSearches'] });
    },
  });

  const clearAllMutation = useMutation({
    mutationFn: async () => {
      const allSearches = await db.entities.SearchHistory.list();
      await Promise.all(allSearches.map(s => db.entities.SearchHistory.delete(s.id)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recentSearches'] });
    },
  });

  const handleSearchClick = (search) => {
    let url = createPageUrl("ServiceProviders") + `? search = ${encodeURIComponent(search.search_query)} `;
    if (search.super_category && search.super_category !== 'all') {
      url += `& super_category=${search.super_category} `;
    }
    if (search.sub_category && search.sub_category !== 'all') {
      url += `& sub_category=${search.sub_category} `;
    }
    navigate(url);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <Clock className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h2 className="text-2xl font-bold mb-2">נדרשת התחברות</h2>
          <p className="text-gray-600 mb-6">התחבר כדי לראות את החיפושים האחרונים שלך</p>
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
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Clock className="w-8 h-8 text-blue-600" />
              החיפושים האחרונים שלי
            </h1>
            <p className="text-gray-600 mt-2">היסטוריית החיפושים שלך</p>
          </div>
          {searches.length > 0 && (
            <Button
              variant="outline"
              onClick={() => clearAllMutation.mutate()}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4 ml-2" />
              נקה הכל
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-gray-500">טוען...</div>
        ) : searches.length === 0 ? (
          <Card className="p-12 text-center">
            <Clock className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">אין עדיין חיפושים</h3>
            <p className="text-gray-500 mb-6">החיפושים שלך יישמרו כאן</p>
            <Button onClick={() => navigate(createPageUrl("ServiceProviders"))}>
              התחל לחפש
            </Button>
          </Card>
        ) : (
          <div className="space-y-2">
            {searches.map((search) => (
              <Card
                key={search.id}
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleSearchClick(search)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                        <Search className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900 truncate">
                          {search.search_query}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                          <Clock className="w-3 h-3" />
                          {moment(search.created_date).fromNow()}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteSearchMutation.mutate(search.id);
                      }}
                      className="text-gray-400 hover:text-red-600 hover:bg-red-50"
                    >
                      <X className="w-4 h-4" />
                    </Button>
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