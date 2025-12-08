// @ts-nocheck
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from '@/api/supabaseClient';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Phone,
  MessageCircle,
  Star,
  MapPin,
  Clock,
  CheckCircle,
  ArrowRight,
  Mail,
  Navigation,
  ThumbsUp,
  Image as ImageIcon,
  Wrench,
  Hammer,
  Zap,
  Droplets,
  Wind,
  Sparkles,
  User,
  Heart,
  Globe,
  Share2,
  Calendar,
  Waves,
  Sun,
  Shirt,
  Home,
  Globe2,
  FileText,
  Car,
  Bike,
  Languages,
  Building2,
  Utensils,
  ShoppingBag
} from "lucide-react";
import GoogleMap from "../components/GoogleMap";
import { getCategoryIcon } from "@/utils/mapIcons";
import { getSubCategoryLabel } from "../components/subCategories";
import { useLanguage } from "@/components/LanguageContext";

export default function ServiceProviderDetails() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { language } = useLanguage();
  const urlParams = new URLSearchParams(window.location.search);
  const providerId = urlParams.get("id");

  const [selectedImage, setSelectedImage] = useState(0);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 5, comment: "", reviewer_name: "" });
  const [userLocation, setUserLocation] = useState(null);

  React.useEffect(() => {
    const savedLocation = localStorage.getItem('userLocation');
    if (savedLocation) {
      try {
        setUserLocation(JSON.parse(savedLocation));
      } catch (error) {
        console.error('Error parsing saved location:', error);
      }
    } else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(location);
          localStorage.setItem('userLocation', JSON.stringify(location));
        },
        (error) => console.log("Location access error:", error)
      );
    }
  }, []);

  const { data: provider, isLoading } = useQuery({
    queryKey: ["serviceProvider", providerId],
    queryFn: async () => {
      const providers = await db.entities.ServiceProvider.filter({ id: providerId });
      return providers[0];
    },
  });

  const { data: reviews, isLoading: reviewsLoading } = useQuery({
    queryKey: ["reviews", providerId],
    queryFn: () => db.entities.Review.filter({ service_provider_id: providerId }),
    initialData: [],
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => db.auth.me(),
  });

  const { data: favorites = [] } = useQuery({
    queryKey: ['favorites'],
    queryFn: () => db.entities.Favorite.list(),
    enabled: !!user,
  });

  const isFavorite = favorites.some(f => f.service_provider_id === providerId);

  const toggleFavoriteMutation = useMutation({
    mutationFn: async () => {
      if (isFavorite) {
        const fav = favorites.find(f => f.service_provider_id === providerId);
        await db.entities.Favorite.delete(fav.id);
      } else {
        await db.entities.Favorite.create({ service_provider_id: providerId });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
  });

  const createReviewMutation = useMutation({
    mutationFn: (reviewData) => db.entities.Review.create(reviewData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews", providerId] });
      setShowReviewForm(false);
      setNewReview({ rating: 5, comment: "", reviewer_name: "" });
    },
  });

  const handleCall = async (phone) => {
    try {
      const isAuth = await db.auth.isAuthenticated();
      if (!isAuth) {
        db.auth.redirectToLogin(window.location.pathname + window.location.search);
        return;
      }
      window.location.href = `tel:${phone}`;
    } catch (error) {
      db.auth.redirectToLogin(window.location.pathname + window.location.search);
    }
  };

  const handleWhatsApp = async (phone) => {
    try {
      const isAuth = await db.auth.isAuthenticated();
      if (!isAuth) {
        db.auth.redirectToLogin(window.location.pathname + window.location.search);
        return;
      }
      window.open(`https://wa.me/${phone.replace(/[^0-9]/g, "")}`, "_blank");
    } catch (error) {
      db.auth.redirectToLogin(window.location.pathname + window.location.search);
    }
  };

  const handleNavigate = () => {
    if (provider?.latitude && provider?.longitude) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${provider.latitude},${provider.longitude}`, "_blank");
    }
  };

  const handleSubmitReview = () => {
    if (newReview.comment && newReview.reviewer_name) {
      createReviewMutation.mutate({
        service_provider_id: providerId,
        ...newReview,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">טוען...</div>
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">ספק השירות לא נמצא</div>
      </div>
    );
  }

  const defaultLat = provider.latitude || 9.5;
  const defaultLng = provider.longitude || 100.0;

  const CategoryIconComponent = (() => {
    const icons = {
      // Fix
      handyman: Wrench,
      carpenter: Hammer,
      electrician: Zap,
      plumber: Droplets,
      ac_repair: Wind,
      cleaning: Sparkles,
      locksmith: Wrench,
      painter: ImageIcon,
      gardener: Leaf,
      pest_control: Bug,
      pool_cleaning: Waves,
      solar_energy: Sun,
      
      // Get Service
      laundry: Shirt,
      housekeeping: Home,
      internet_tech: Wifi,
      visa_services: FileText,
      
      // Transport
      moving: Truck,
      car_mechanic: Wrench,
      taxi_service: Car,
      car_rental: Car,
      bike_rental: Bike,
      
      // Other
      translator: Languages,
      real_estate_agent: Building2,
      restaurants: Utensils,
      fashion: ShoppingBag
    };
    return icons[provider.category] || Wrench;
  })();

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Hero Section */}
      <div className="relative h-72 md:h-96 bg-gray-900">
        {provider.images && provider.images.length > 0 ? (
          <img
            src={provider.images[0]}
            alt={provider.business_name}
            className="w-full h-full object-cover opacity-80"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-900 to-gray-900">
            <CategoryIconComponent className="w-24 h-24 text-white/20" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-blue-600 hover:bg-blue-700 border-none text-white">
                {getSubCategoryLabel(provider.category, language)}
              </Badge>
              {provider.verified && (
                <Badge className="bg-green-500 hover:bg-green-600 border-none text-white gap-1">
                  <CheckCircle className="w-3 h-3" />
                  מוסמך
                </Badge>
              )}
              {provider.emergency_service && (
                <Badge className="bg-red-500 hover:bg-red-600 border-none text-white gap-1">
                  <Clock className="w-3 h-3" />
                  24/7
                </Badge>
              )}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">{provider.business_name}</h1>
            <div className="flex items-center gap-4 text-sm md:text-base text-gray-200">
              <div className="flex items-center gap-1">
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                <span className="font-bold text-white">{provider.average_rating?.toFixed(1) || "0.0"}</span>
                <span>({provider.total_reviews || 0} ביקורות)</span>
              </div>
              {provider.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {provider.location}
                </div>
              )}
            </div>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 text-white hover:bg-white/20 rounded-full"
          onClick={() => navigate(-1)}
        >
          <ArrowRight className="w-6 h-6 rotate-180" />
        </Button>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Left Column: Main Content */}
          <div className="md:col-span-2 space-y-6">
            <Card className="shadow-lg overflow-hidden border-none">
              <Tabs defaultValue="overview" className="w-full">
                <div className="border-b px-4 bg-white">
                  <TabsList className="w-full justify-start h-14 bg-transparent p-0">
                    <TabsTrigger value="overview" className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:shadow-none bg-transparent">סקירה</TabsTrigger>
                    <TabsTrigger value="info" className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:shadow-none bg-transparent">מידע וזמינות</TabsTrigger>
                    <TabsTrigger value="reviews" className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:shadow-none bg-transparent">ביקורות</TabsTrigger>
                  </TabsList>
                </div>

                <div className="p-6 bg-white min-h-[300px]">
                  <TabsContent value="overview" className="mt-0 space-y-6">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-3">אודות העסק</h3>
                      <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                        {provider.description || "אין תיאור זמין לעסק זה."}
                      </p>
                    </div>

                    {provider.images && provider.images.length > 1 && (
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-3">גלריה</h3>
                        <div className="grid grid-cols-2 gap-2">
                          {provider.images.slice(1).map((img, idx) => (
                            <img
                              key={idx}
                              src={img}
                              alt={`Gallery ${idx}`}
                              className="w-full h-40 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() => window.open(img, '_blank')}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="info" className="mt-0 space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-4 bg-gray-50 rounded-xl">
                        <div className="flex items-center gap-3 mb-2">
                          <Clock className="w-5 h-5 text-blue-600" />
                          <h4 className="font-semibold">שעות פעילות</h4>
                        </div>
                        <p className="text-gray-600 text-sm">{provider.available_hours || "לא צויין"}</p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-xl">
                        <div className="flex items-center gap-3 mb-2">
                          <Globe className="w-5 h-5 text-blue-600" />
                          <h4 className="font-semibold">אתר אינטרנט</h4>
                        </div>
                        {provider.website ? (
                          <a href={provider.website} target="_blank" rel="noreferrer" className="text-blue-600 text-sm hover:underline truncate block">
                            {provider.website}
                          </a>
                        ) : (
                          <p className="text-gray-600 text-sm">לא צויין</p>
                        )}
                      </div>
                      <div className="p-4 bg-gray-50 rounded-xl">
                        <div className="flex items-center gap-3 mb-2">
                          <Mail className="w-5 h-5 text-blue-600" />
                          <h4 className="font-semibold">אימייל</h4>
                        </div>
                        <p className="text-gray-600 text-sm">{provider.email || "לא צויין"}</p>
                      </div>
                      {provider.line_id && (
                        <div className="p-4 bg-gray-50 rounded-xl">
                          <div className="flex items-center gap-3 mb-2">
                            <MessageCircle className="w-5 h-5 text-green-600" />
                            <h4 className="font-semibold">Line ID</h4>
                          </div>
                          <p className="text-gray-600 text-sm">{provider.line_id}</p>
                        </div>
                      )}
                      <div className="p-4 bg-gray-50 rounded-xl">
                        <div className="flex items-center gap-3 mb-2">
                          <MessageCircle className="w-5 h-5 text-blue-600" />
                          <h4 className="font-semibold">שפות שירות</h4>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {provider.languages && provider.languages.length > 0 ? (
                            provider.languages.map(lang => (
                              <Badge key={lang} variant="secondary" className="text-xs bg-white border border-gray-200">
                                {lang}
                              </Badge>
                            ))
                          ) : (
                            <p className="text-gray-600 text-sm">לא צויין</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="reviews" className="mt-0">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-3xl font-bold text-gray-900">{provider.average_rating?.toFixed(1) || "0.0"}</span>
                          <div className="flex flex-col">
                            <div className="flex text-yellow-400">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star key={star} className={`w-4 h-4 ${star <= (provider.average_rating || 0) ? "fill-current" : "text-gray-300"}`} />
                              ))}
                            </div>
                            <span className="text-xs text-gray-500">{provider.total_reviews || 0} ביקורות</span>
                          </div>
                        </div>
                      </div>
                      <Button onClick={() => setShowReviewForm(!showReviewForm)}>
                        כתוב ביקורת
                      </Button>
                    </div>

                    {/* Review Form (Same as before) */}
                    {showReviewForm && (
                      <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-100">
                        <div className="space-y-3">
                          <Input
                            value={newReview.reviewer_name}
                            onChange={(e) => setNewReview({ ...newReview, reviewer_name: e.target.value })}
                            placeholder="שמך המלא"
                            className="bg-white"
                          />
                          <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((rating) => (
                              <button key={rating} onClick={() => setNewReview({ ...newReview, rating })}>
                                <Star className={`w-8 h-8 ${rating <= newReview.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
                              </button>
                            ))}
                          </div>
                          <Textarea
                            value={newReview.comment}
                            onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                            placeholder="שתף את החוויה שלך..."
                            className="bg-white"
                            rows={3}
                          />
                          <div className="flex gap-2">
                            <Button onClick={handleSubmitReview} className="flex-1">פרסם</Button>
                            <Button onClick={() => setShowReviewForm(false)} variant="outline" className="flex-1">ביטול</Button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Reviews List */}
                    <div className="space-y-4">
                      {reviews.length === 0 ? (
                        <p className="text-center text-gray-500 py-8">אין עדיין ביקורות. היה הראשון לדרג!</p>
                      ) : (
                        reviews.map((review) => (
                          <div key={review.id} className="border-b border-gray-100 pb-4 last:border-0">
                            <div className="flex justify-between mb-2">
                              <h4 className="font-semibold">{review.reviewer_name}</h4>
                              <div className="flex text-yellow-400">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star key={star} className={`w-3 h-3 ${star <= review.rating ? "fill-current" : "text-gray-300"}`} />
                                ))}
                              </div>
                            </div>
                            <p className="text-gray-600 text-sm">{review.comment}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </TabsContent>
                </div>
              </Tabs>
            </Card>
          </div>

          {/* Right Column: Actions & Map */}
          <div className="space-y-6">
            {/* Action Card */}
            <Card className="shadow-lg border-none sticky top-24">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-lg">יצירת קשר</h3>
                  <Button variant="ghost" size="icon" className="rounded-full hover:bg-gray-100">
                    <Share2 className="w-5 h-5 text-gray-500" />
                  </Button>
                </div>

                <Button onClick={() => handleCall(provider.phone)} className="w-full h-12 text-lg bg-blue-600 hover:bg-blue-700 shadow-md">
                  <Phone className="w-5 h-5 ml-2" />
                  התקשר עכשיו
                </Button>

                {provider.whatsapp && (
                  <Button onClick={() => handleWhatsApp(provider.whatsapp)} className="w-full h-12 text-lg bg-green-600 hover:bg-green-700 shadow-md">
                    <MessageCircle className="w-5 h-5 ml-2" />
                    WhatsApp
                  </Button>
                )}

                <Button
                  onClick={async () => {
                    const isAuth = await db.auth.isAuthenticated();
                    if (!isAuth) return db.auth.redirectToLogin(window.location.href);
                    toggleFavoriteMutation.mutate();
                  }}
                  variant="outline"
                  className={`w-full ${isFavorite ? 'text-red-500 border-red-200 bg-red-50' : ''}`}
                >
                  <Heart className={`w-5 h-5 ml-2 ${isFavorite ? 'fill-current' : ''}`} />
                  {isFavorite ? 'הסר ממועדפים' : 'שמור במועדפים'}
                </Button>

                <div className="pt-4 border-t">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    מיקום
                  </h4>
                  <div className="rounded-xl overflow-hidden h-48 mb-3 border border-gray-200">
                    <GoogleMap
                      center={{ lat: defaultLat, lng: defaultLng }}
                      zoom={15}
                      height="100%"
                      markers={[{
                        lat: defaultLat,
                        lng: defaultLng,
                        title: provider.business_name,
                        icon: getCategoryIcon(provider.category)
                      }]}
                      options={{ disableDefaultUI: true }}
                      userLocation={userLocation}
                    />
                  </div>
                  <Button onClick={handleNavigate} variant="secondary" className="w-full">
                    <Navigation className="w-4 h-4 ml-2" />
                    נווט לעסק
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
