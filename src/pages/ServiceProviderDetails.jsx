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
// Tabs imports removed
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
  ShoppingBag,
  Leaf,
  Bug,
  Wifi,
  Truck
} from "lucide-react";
import GoogleMap from "../components/GoogleMap";
import { getCategoryIcon } from "@/shared/utils/mapIcons";
import { getSubCategoryLabel } from "../components/subCategories";
import { useLanguage } from "@/components/LanguageContext";
import BookingDialog from "@/components/BookingDialog";

export default function ServiceProviderDetails() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { language } = useLanguage();
  const urlParams = new URLSearchParams(window.location.search);
  const providerId = urlParams.get("id");

  const [selectedImage, setSelectedImage] = useState(0);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false); // New State
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
        (error) => { } // console.log("Location access error:", error)
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

  /* Analytics Helpers */
  const incrementStats = async (type) => {
    try {
      if (!providerId) return;
      await db.rpc('increment_provider_stats', { p_id: providerId, stat_type: type });
    } catch (err) {
      console.warn('Failed to track stat:', err);
    }
  };

  // Track View on Mount
  React.useEffect(() => {
    if (providerId) {
      // Debounce or just fire? For MVP just fire.
      // Ideally we check if it's the owner viewing their own profile, but typically views count everyone.
      incrementStats('view');
    }
  }, [providerId]);

  const handleCall = async (phone) => {
    incrementStats('click');
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
    incrementStats('click');
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
    incrementStats('click'); // Navigation is also a click/intent
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
              <div className="space-y-8">
                {/* About Section */}
                <div id="about" className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    אודות העסק
                  </h3>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line text-lg">
                    {provider.description || "אין תיאור זמין לעסק זה."}
                  </p>
                </div>

                {/* Gallery Section */}
                {provider.images && provider.images.length > 1 && (
                  <div id="gallery" className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <ImageIcon className="w-5 h-5 text-purple-600" />
                      גלריה
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {provider.images.slice(1).map((img, idx) => (
                        <img
                          key={idx}
                          src={img}
                          alt={`Gallery ${idx}`}
                          className="w-full h-48 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-all hover:scale-105 transform duration-300"
                          onClick={() => window.open(img, '_blank')}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Info Grid */}
                <div id="info" className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-yellow-500" />
                    מידע וזמינות
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                      <div className="flex items-center gap-3 mb-2">
                        <Clock className="w-5 h-5 text-blue-600" />
                        <h4 className="font-semibold text-gray-900">שעות פעילות</h4>
                      </div>
                      <p className="text-gray-600 text-sm">{provider.available_hours || "לא צויין"}</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                      <div className="flex items-center gap-3 mb-2">
                        <Globe className="w-5 h-5 text-blue-600" />
                        <h4 className="font-semibold text-gray-900">אתר אינטרנט</h4>
                      </div>
                      {provider.website ? (
                        <a href={provider.website} target="_blank" rel="noreferrer" className="text-blue-600 text-sm hover:underline truncate block">
                          {provider.website}
                        </a>
                      ) : (
                        <p className="text-gray-600 text-sm">לא צויין</p>
                      )}
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                      <div className="flex items-center gap-3 mb-2">
                        <Mail className="w-5 h-5 text-blue-600" />
                        <h4 className="font-semibold text-gray-900">אימייל</h4>
                      </div>
                      <p className="text-gray-600 text-sm">{provider.email || "לא צויין"}</p>
                    </div>
                    {provider.line_id && (
                      <div className="p-4 bg-green-50 rounded-xl hover:bg-green-100 transition-colors">
                        <div className="flex items-center gap-3 mb-2">
                          <MessageCircle className="w-5 h-5 text-green-600" />
                          <h4 className="font-semibold text-gray-900">Line ID</h4>
                        </div>
                        <p className="text-gray-600 text-sm font-medium">{provider.line_id}</p>
                      </div>
                    )}
                    <div className="p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors sm:col-span-2">
                      <div className="flex items-center gap-3 mb-2">
                        <Languages className="w-5 h-5 text-blue-600" />
                        <h4 className="font-semibold text-gray-900">שפות שירות</h4>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {provider.languages && provider.languages.length > 0 ? (
                          provider.languages.map(lang => (
                            <Badge key={lang} variant="outline" className="text-sm bg-white px-3 py-1">
                              {lang}
                            </Badge>
                          ))
                        ) : (
                          <p className="text-gray-600 text-sm">לא צויין</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Reviews Section */}
                <div id="reviews" className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-1 flex items-center gap-2">
                        <Star className="w-5 h-5 text-yellow-400" />
                        ביקורות לקוחות
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        מבוסס על {provider.total_reviews || 0} ביקורות מאומתות
                      </div>
                    </div>
                    <Button onClick={() => setShowReviewForm(!showReviewForm)} className="shadow-sm">
                      כתוב ביקורת
                    </Button>
                  </div>

                  <div className="flex items-center gap-6 mb-8 p-6 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex flex-col items-center justify-center p-4 border-l border-slate-200 pl-8">
                      <span className="text-5xl font-bold text-gray-900">{provider.average_rating?.toFixed(1) || "0.0"}</span>
                      <div className="flex text-yellow-400 my-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star key={star} className={`w-5 h-5 ${star <= (provider.average_rating || 0) ? "fill-current" : "text-gray-300"}`} />
                        ))}
                      </div>
                      <span className="text-sm text-gray-500">ציון ממוצע</span>
                    </div>
                    <div className="flex-1 space-y-2">
                      {/* Mock Bars just for visual */}
                      {[5, 4, 3, 2, 1].map(num => (
                        <div key={num} className="flex items-center gap-2 text-sm">
                          <span className="w-3">{num}</span>
                          <Star className="w-3 h-3 text-slate-300" />
                          <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div className="h-full bg-yellow-400" style={{ width: num === 5 ? '70%' : num === 4 ? '20%' : '5%' }}></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>


                  {/* Review Form */}
                  {showReviewForm && (
                    <div className="mb-8 p-6 bg-blue-50/50 rounded-xl border border-blue-100 animate-in fade-in slide-in-from-top-4">
                      <h4 className="font-semibold mb-4">כתוב את הביקורת שלך</h4>
                      <div className="space-y-4">
                        <Input
                          value={newReview.reviewer_name}
                          onChange={(e) => setNewReview({ ...newReview, reviewer_name: e.target.value })}
                          placeholder="שמך המלא"
                          className="bg-white"
                        />
                        <div className="flex flex-col gap-2">
                          <span className="text-sm text-gray-600">דרג את החוויה שלך:</span>
                          <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((rating) => (
                              <button key={rating} onClick={() => setNewReview({ ...newReview, rating })} className="transition-transform hover:scale-110 focus:outline-none">
                                <Star className={`w-8 h-8 ${rating <= newReview.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300 hover:text-yellow-200"}`} />
                              </button>
                            ))}
                          </div>
                        </div>
                        <Textarea
                          value={newReview.comment}
                          onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                          placeholder="שתף את החוויה שלך עם ספק זה..."
                          className="bg-white min-h-[100px]"
                        />
                        <div className="flex gap-3 pt-2">
                          <Button onClick={handleSubmitReview} className="flex-1 bg-blue-600 hover:bg-blue-700">פרסם ביקורת</Button>
                          <Button onClick={() => setShowReviewForm(false)} variant="outline" className="flex-1">ביטול</Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Reviews List */}
                  <div className="space-y-6">
                    {reviews.length === 0 ? (
                      <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        <MessageCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-gray-500 font-medium">אין עדיין ביקורות</p>
                        <p className="text-gray-400 text-sm">היה הראשון לשתף את דעתך על עסק זה</p>
                      </div>
                    ) : (
                      reviews.map((review) => (
                        <div key={review.id} className="border-b border-gray-100 pb-6 last:border-0 last:pb-0">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
                                {review.reviewer_name.charAt(0)}
                              </div>
                              <div>
                                <h4 className="font-bold text-gray-900">{review.reviewer_name}</h4>
                                <div className="flex text-yellow-400 text-xs">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star key={star} className={`w-3 h-3 ${star <= review.rating ? "fill-current" : "text-gray-300"}`} />
                                  ))}
                                  <span className="text-gray-400 ml-2">• לפני 2 ימים</span>
                                </div>
                              </div>
                            </div>
                            <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
                              App Review
                            </Badge>
                          </div>
                          <p className="text-gray-600 text-sm leading-relaxed mt-2 mr-14">{review.comment}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
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

                <Button onClick={() => setBookingOpen(true)} className="w-full h-12 text-lg bg-blue-600 hover:bg-blue-700 shadow-md">
                  <CalendarIcon className="w-5 h-5 ml-2" />
                  הזמן תור
                </Button>

                <Button onClick={() => handleCall(provider.phone)} className="w-full h-12 text-lg bg-white text-blue-600 border border-blue-200 hover:bg-blue-50 shadow-sm">
                  <Phone className="w-5 h-5 ml-2" />
                  התקשר עכשיו
                </Button>

                {provider.whatsapp && (
                  <Button onClick={() => handleWhatsApp(provider.whatsapp)} className="w-full h-12 text-lg bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 shadow-sm">
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
      <BookingDialog
        open={bookingOpen}
        onOpenChange={setBookingOpen}
        provider={provider}
        onBookingConfirmed={() => {
          // Optional: Refresh bookings if we showed them here, or just toast
          queryClient.invalidateQueries({ queryKey: ["bookings", providerId] }); // If we had this query
        }}
      />
    </div>
  );
}
