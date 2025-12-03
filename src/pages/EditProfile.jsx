import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { db } from '@/api/supabaseClient';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, Save, User } from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";
import { getTranslation } from "@/components/translations";

export default function EditProfile() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { language } = useLanguage();
  const t = (key) => getTranslation(language, key);

  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    profile_image: "",
  });
  const [uploading, setUploading] = useState(false);

  const { data: user, isLoading } = useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => {
      const userData = await db.auth.me();
      const metadata = userData?.user_metadata || {};
      setFormData({
        full_name: metadata.full_name || "",
        phone: metadata.phone || "",
        profile_image: metadata.profile_image || "",
      });
      return userData;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      await db.auth.updateMe(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      navigate(createPageUrl("Profile"));
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const { file_url } = await db.integrations.Core.UploadFile({ file });
    setFormData({ ...formData, profile_image: file_url });
    setUploading(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">{t('loading')}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <Button
          variant="ghost"
          onClick={() => navigate(createPageUrl("Profile"))}
          className="mb-4"
        >
          <ArrowRight className="w-4 h-4 ml-2" />
          {t('back')}
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              {t('edit')} {t('myProfile')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>תמונת פרופיל</Label>
                <div className="flex items-center gap-4 mt-2">
                  {formData.profile_image ? (
                    <img
                      src={formData.profile_image}
                      alt="Profile"
                      className="w-20 h-20 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 text-2xl font-bold">
                      {formData.full_name?.charAt(0) || "?"}
                    </div>
                  )}
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="profile-image-upload"
                      disabled={uploading}
                    />
                    <label
                      htmlFor="profile-image-upload"
                      className="inline-block px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer text-sm"
                    >
                      {uploading ? t('loading') : 'העלה תמונה'}
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="full_name">{t('contactName')}</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="email">{t('email')}</Label>
                <Input
                  id="email"
                  value={user?.email || ""}
                  disabled
                  className="bg-gray-100"
                />
              </div>

              <div>
                <Label htmlFor="phone">{t('phone')}</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder={t('phone')}
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={updateMutation.isPending}
              >
                <Save className="w-4 h-4 ml-2" />
                {updateMutation.isPending ? t('loading') : t('save')}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}