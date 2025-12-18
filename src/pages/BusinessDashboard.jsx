
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { db } from '@/api/supabaseClient';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Store,
  Star,
  Eye,
  MessageSquare,
  Clock,
  CheckCircle,
  AlertCircle,
  Edit,
  MapPin,
  Phone,
  Mail,
  Globe,
  Image as ImageIcon,
  TrendingUp,
  Users,
  Calendar,
  Upload,
  X,
  Save,
  Loader2,
} from "lucide-react";
import GoogleMap from "../components/GoogleMap";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";

export default function BusinessDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showImagesDialog, setShowImagesDialog] = useState(false);
  const [editedData, setEditedData] = useState({});
  const [uploadingImages, setUploadingImages] = useState(false);

  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => db.auth.me(),
  });

  const { data: myBusinesses, isLoading } = useQuery({
    queryKey: ["myBusinesses", user?.email],
    queryFn: async () => {
      if (!user) return [];
      return await db.entities.ServiceProvider.filter({
        created_by: user.email,
      });
    },
    enabled: !!user,
    initialData: [],
  });

  const { data: reviews } = useQuery({
    queryKey: ["businessReviews", myBusinesses?.[0]?.id],
    queryFn: () =>
      db.entities.Review.filter({
        service_provider_id: myBusinesses[0].id,
      }),
    enabled: myBusinesses?.length > 0,
    initialData: [],
  });

  const updateBusinessMutation = useMutation({
    /** @param {Object} data */
    mutationFn: async (data) => {
      return await db.entities.ServiceProvider.update(myBusinesses[0].id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myBusinesses"] });
      setShowEditDialog(false);
      setShowImagesDialog(false);
    },
  });

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploadingImages(true);
    try {
      const uploadPromises = files.map(async (file) => {
        const { file_url } = await db.integrations.Core.UploadFile({ file });
        return file_url;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      const currentImages = myBusinesses[0].images || [];
      const newImages = [...currentImages, ...uploadedUrls];

      await updateBusinessMutation.mutateAsync({ images: newImages });
    } catch (error) {
      console.error("Error uploading images:", error);
    } finally {
      setUploadingImages(false);
    }
  };

  const handleDeleteImage = async (indexToDelete) => {
    const currentImages = myBusinesses[0].images || [];
    const newImages = currentImages.filter((_, idx) => idx !== indexToDelete);
    await updateBusinessMutation.mutateAsync({ images: newImages });
  };

  const handleEditClick = () => {
    setEditedData({
      description: myBusinesses[0].description || "",
      available_hours: myBusinesses[0].available_hours || "",
      emergency_service: myBusinesses[0].emergency_service || false,
    });
    setShowEditDialog(true);
  };

  const handleSaveEdit = () => {
    updateBusinessMutation.mutate(editedData);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">טוען...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-3">נדרשת התחברות</h2>
            <Button
              onClick={() => db.auth.redirectToLogin(window.location.pathname)}
              className="w-full"
            >
              התחבר
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (myBusinesses.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Store className="w-10 h-10 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              אין לך עסק רשום
            </h2>
            <p className="text-gray-600 mb-6">
              הצטרף למאגר ספקי השירות והתחל לקבל לקוחות חדשים
            </p>
            <Button
              onClick={() => navigate(createPageUrl("BusinessRegistration"))}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <Store className="w-5 h-5 ml-2" />
              רשום עסק חדש
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const business = myBusinesses[0];
  const recentReviews = reviews.slice(0, 5);

  // Activity data (placeholder for now, to be implemented with real analytics table)
  // For now, we can show flatline or random data if we want, but better to show empty state or realistic defaults
  const activityData = [
    { day: "א'", views: 0, calls: 0, whatsapp: 0 },
    { day: "ב'", views: 0, calls: 0, whatsapp: 0 },
    { day: "ג'", views: 0, calls: 0, whatsapp: 0 },
    { day: "ד'", views: 0, calls: 0, whatsapp: 0 },
    { day: "ה'", views: 0, calls: 0, whatsapp: 0 },
    { day: "ו'", views: 0, calls: 0, whatsapp: 0 },
    { day: "ש'", views: 0, calls: 0, whatsapp: 0 },
  ];

  const stats = [
    {
      icon: Eye,
      label: "צפיות (סה״כ)",
      value: business.views_count || "0", // Assuming views_count exists on business object
      change: "מאז ההקמה",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      icon: Star,
      label: "דירוג ממוצע",
      value: business.average_rating?.toFixed(1) || "0.0",
      change: (business.total_reviews || 0) + " ביקורות",
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
    },
    {
      icon: MessageSquare,
      label: "פניות (הודעות)",
      value: business.messages_count || "0", // Placeholder column
      change: "סה״כ הודעות",
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      icon: Users,
      label: "קליקים (טלפון)",
      value: business.phone_clicks || "0", // Placeholder column
      change: "חשיפות למספר",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center">
                <Store className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{business.business_name}</h1>
                <p className="text-blue-100">איש קשר: {business.contact_name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {business.status === "pending" && (
                <Badge className="bg-orange-500 text-white">
                  <Clock className="w-3 h-3 ml-1" />
                  ממתין לאישור
                </Badge>
              )}
              {business.status === "active" && business.verified && (
                <Badge className="bg-green-500 text-white">
                  <CheckCircle className="w-3 h-3 ml-1" />
                  מאומת ופעיל
                </Badge>
              )}
              {business.status === "active" && !business.verified && (
                <Badge className="bg-blue-500 text-white">פעיל</Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 -mt-4">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {stats.map((stat, idx) => (
            <Card key={idx} className="shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <div
                    className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center`}
                  >
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <TrendingUp className="w-4 h-4 text-green-500" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-600">{stat.label}</div>
                <div className="text-xs text-green-600 mt-1">{stat.change}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Activity Chart */}
        <Card className="shadow-lg mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              פעילות שבועית
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={activityData}>
                  <defs>
                    <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorCalls" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorWhatsapp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="day"
                    stroke="#6b7280"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis
                    stroke="#6b7280"
                    style={{ fontSize: '12px' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      padding: '8px 12px',
                    }}
                    labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="views"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorViews)"
                    name="צפיות"
                  />
                  <Area
                    type="monotone"
                    dataKey="calls"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorCalls)"
                    name="שיחות"
                  />
                  <Area
                    type="monotone"
                    dataKey="whatsapp"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorWhatsapp)"
                    name="WhatsApp"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-sm text-gray-600">צפיות</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-sm text-gray-600">שיחות</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                <span className="text-sm text-gray-600">WhatsApp</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Business Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Details Card */}
            <Card className="shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Store className="w-5 h-5" />
                  פרטי העסק
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEditClick}
                >
                  <Edit className="w-4 h-4 ml-1" />
                  ערוך
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">תיאור</h4>
                    <p className="text-gray-700 leading-relaxed">
                      {business.description || "אין תיאור"}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                        <Phone className="w-4 h-4" />
                        <span className="font-medium">טלפון</span>
                      </div>
                      <p className="text-gray-900" dir="ltr">
                        {business.phone}
                      </p>
                    </div>
                    {business.email && (
                      <div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                          <Mail className="w-4 h-4" />
                          <span className="font-medium">אימייל</span>
                        </div>
                        <p className="text-gray-900" dir="ltr">
                          {business.email}
                        </p>
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                      <MapPin className="w-4 h-4" />
                      <span className="font-medium">מיקום</span>
                    </div>
                    <p className="text-gray-900">{business.location}</p>
                  </div>

                  {business.service_areas && business.service_areas.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <Globe className="w-4 h-4" />
                        <span className="font-medium">אזורי שירות</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {business.service_areas.map((area, idx) => (
                          <Badge key={idx} variant="outline">
                            {area}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {business.languages && business.languages.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <Globe className="w-4 h-4" />
                        <span className="font-medium">שפות</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {business.languages.map((lang, idx) => (
                          <Badge key={idx} className="bg-blue-100 text-blue-800">
                            {lang}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {business.available_hours && (
                    <div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                        <Clock className="w-4 h-4" />
                        <span className="font-medium">שעות פעילות</span>
                      </div>
                      <p className="text-gray-900">{business.available_hours}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Images Card */}
            <Card className="shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="w-5 h-5" />
                  גלריית תמונות ({business.images?.length || 0})
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowImagesDialog(true)}
                >
                  <Upload className="w-4 h-4 ml-1" />
                  הוסף תמונות
                </Button>
              </CardHeader>
              <CardContent>
                {!business.images || business.images.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm">אין עדיין תמונות</p>
                    <Button
                      onClick={() => setShowImagesDialog(true)}
                      variant="outline"
                      className="mt-4"
                    >
                      העלה תמונות ראשונות
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-3">
                    {business.images.map((url, idx) => (
                      <div
                        key={idx}
                        className="aspect-square rounded-lg overflow-hidden relative group"
                      >
                        <img
                          src={url}
                          alt={`תמונה ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={() => handleDeleteImage(idx)}
                          className="absolute top-2 left-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Map Card */}
            {business.latitude && business.longitude ? (
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    מיקום על המפה
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <GoogleMap
                    center={{ lat: business.latitude, lng: business.longitude }}
                    zoom={15}
                    height="300px"
                    markers={[{
                      lat: business.latitude,
                      lng: business.longitude,
                      title: business.business_name,
                      infoWindow: `<div style="padding: 8px;"><strong>${business.business_name}</strong></div>`
                    }]}
                  />
                </CardContent>
              </Card>
            ) : (
              <Card className="shadow-lg bg-orange-50 border-orange-200">
                <CardContent className="p-6">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-orange-900">
                      <p className="font-semibold mb-1">לא הוגדר מיקום</p>
                      <p>
                        המיקום שלך על המפה לא הוגדר במהלך ההרשמה. זה עוזר ללקוחות למצוא אותך!
                      </p>
                      <p className="mt-2 text-xs">
                        צור קשר עם התמיכה כדי להוסיף מיקום.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Reviews Sidebar */}
          <div className="space-y-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-500" />
                  ביקורות אחרונות
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentReviews.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm">אין עדיין ביקורות</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentReviews.map((review) => (
                      <div
                        key={review.id}
                        className="border-b border-gray-200 pb-3 last:border-0"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-sm">
                            {review.reviewer_name}
                          </span>
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm font-semibold">
                              {review.rating}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-700 line-clamp-2">
                          {review.comment}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(review.created_date).toLocaleDateString("he-IL")}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions Card */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>פעולות מהירות</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() =>
                    navigate(
                      createPageUrl("ServiceProviderDetails") + `?id=${business.id}`
                    )
                  }
                >
                  <Eye className="w-4 h-4 ml-2" />
                  צפה בפרופיל הציבורי
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Calendar className="w-4 h-4 ml-2" />
                  ניהול בקשות שירות
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <TrendingUp className="w-4 h-4 ml-2" />
                  סטטיסטיקות מתקדמות
                </Button>
              </CardContent>
            </Card>

            {/* Status Alert */}
            {business.status === "pending" && (
              <Card className="bg-orange-50 border-orange-200 shadow-lg">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-orange-900">
                      <p className="font-semibold mb-1">העסק שלך ממתין לאישור</p>
                      <p>
                        הצוות שלנו בודק את הפרטים. זה בדרך כלל לוקח עד 24 שעות.
                        תקבל הודעה כשהעסק יאושר.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>ערוך פרטי עסק</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium mb-2">תיאור העסק</label>
              <Textarea
                value={editedData.description || ""}
                onChange={(e) =>
                  setEditedData({ ...editedData, description: e.target.value })
                }
                rows={5}
                placeholder="ספר על העסק שלך..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">שעות זמינות</label>
              <Input
                value={editedData.available_hours || ""}
                onChange={(e) =>
                  setEditedData({ ...editedData, available_hours: e.target.value })
                }
                placeholder="לדוגמה: 08:00-18:00"
              />
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="emergency"
                checked={editedData.emergency_service || false}
                onChange={(e) =>
                  setEditedData({
                    ...editedData,
                    emergency_service: e.target.checked,
                  })
                }
                className="w-5 h-5"
              />
              <label htmlFor="emergency" className="text-sm font-medium">
                שירות חירום 24/7
              </label>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => setShowEditDialog(false)}
              variant="outline"
              className="flex-1"
            >
              ביטול
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={updateBusinessMutation.isPending}
              className="flex-1"
            >
              {updateBusinessMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  שומר...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 ml-2" />
                  שמור שינויים
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Images Dialog */}
      <Dialog open={showImagesDialog} onOpenChange={setShowImagesDialog}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>העלה תמונות</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <input
                type="file"
                id="upload-images"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <label
                htmlFor="upload-images"
                className="cursor-pointer flex flex-col items-center gap-3"
              >
                {uploadingImages ? (
                  <>
                    <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
                    <span className="text-sm text-gray-600">מעלה תמונות...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-12 h-12 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      לחץ להעלאת תמונות
                    </span>
                    <span className="text-xs text-gray-500">
                      ניתן להעלות מספר תמונות בבת אחת
                    </span>
                  </>
                )}
              </label>
            </div>

            {business.images && business.images.length > 0 && (
              <div className="mt-6">
                <h4 className="font-medium mb-3">תמונות קיימות:</h4>
                <div className="grid grid-cols-4 gap-3">
                  {business.images.map((url, idx) => (
                    <div key={idx} className="relative aspect-square group">
                      <img
                        src={url}
                        alt={`תמונה ${idx + 1}`}
                        className="w-full h-full object-cover rounded-lg"
                      />
                      <button
                        onClick={() => handleDeleteImage(idx)}
                        className="absolute top-1 left-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-end">
            <Button onClick={() => setShowImagesDialog(false)}>סגור</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
