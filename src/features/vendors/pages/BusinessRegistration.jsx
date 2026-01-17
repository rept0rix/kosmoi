
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/shared/lib/utils';
import { db } from '@/api/supabaseClient';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowRight,
  Upload,
  MapPin,
  CheckCircle,
  AlertCircle,
  Loader2,
  Store,
  User,
  Phone,
  Search,
  Building2,
  Sparkles,
  Zap,
} from 'lucide-react';
import GoogleMap from '@/components/GoogleMap';
import { subCategoriesBySuperCategory } from '@/components/subCategories';
import { getTranslation } from '@/components/translations';

// --- Constants & Helpers ---

const getCategoryOptions = () => {
  const options = [];
  Object.keys(subCategoriesBySuperCategory).forEach((superCat) => {
    subCategoriesBySuperCategory[superCat].forEach((subCat) => {
      if (!subCat.startsWith('all_')) {
        options.push({
          value: subCat,
          label: getTranslation('hebrew', subCat) || subCat,
        });
      }
    });
  });
  options.push({ value: 'other', label: 'אחר / בקש קטגוריה' });
  return options.sort((a, b) => a.label.localeCompare(b.label));
};

const categories = getCategoryOptions();

const languages = [
  { value: 'thai', label: 'תאילנדית' },
  { value: 'english', label: 'אנגלית' },
  { value: 'hebrew', label: 'עברית' },
  { value: 'russian', label: 'רוסית' },
];

const areaOptions = [
  'בו-פוט',
  "לאמאי",
  "צ'אוונג",
  'מאנם',
  'בנג רק',
  'נאתון',
  'תלינג-נגאם',
  'מאה-נאם',
];

// --- Main Component ---

export default function BusinessRegistration() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoadingAuth } = useAuth();

  // View State: 'landing' | 'claim' | 'register'
  const [view, setView] = useState('landing');

  // Check if user already has a business
  const { data: existingBusiness, isLoading: isLoadingBusiness } = useQuery({
    queryKey: ['my-business', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await db.entities.ServiceProvider.get({ owner_id: user.id });
      // db.entities.get returns array or single obj depending on implementation, 
      // usually a list for 'get' with filters. Assuming list here or single.
      // Let's assume standard 'get' returns list. 
      return Array.isArray(data) ? data[0] : data;
    },
    enabled: !!user?.id,
  });

  // Effect: If business exists, we might want to prompt them to dashboard
  // But for now, we'll just show the "Manage" option in landing.

  if (isLoadingAuth || isLoadingBusiness) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-none shadow-xl bg-white/80 backdrop-blur-md">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold mb-3 text-slate-800">התחברות נדרשת</h2>
            <p className="text-slate-600 mb-6">
              כדי לנהל או לרשום עסק בקוסמוי, עליך להתחבר למערכת תחילה.
            </p>
            <Button
              onClick={() => db.auth.redirectToLogin(window.location.pathname)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              התחבר / הרשם לחשבון
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-12 px-4 font-sans text-slate-900" dir="rtl">
      <div className="max-w-4xl mx-auto">
        <AnimatePresence mode="wait">
          {view === 'landing' && (
            <LandingView
              key="landing"
              existingBusiness={existingBusiness}
              onSelectClaim={() => setView('claim')}
              onSelectRegister={() => setView('register')}
            />
          )}
          {view === 'claim' && (
            <ClaimBusinessView
              key="claim"
              onBack={() => setView('landing')}
              onClaimSuccess={() => navigate(createPageUrl('BusinessDashboard'))}
            />
          )}
          {view === 'register' && (
            <RegisterBusinessForm
              key="register"
              onBack={() => setView('landing')}
              onSuccess={() => navigate(createPageUrl('BusinessDashboard'))}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// --- Sub-Views ---

function LandingView({ existingBusiness, onSelectClaim, onSelectRegister }) {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8 text-center"
    >
      <div className="space-y-2">
        <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          מרכז העסקים של קוסמוי
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          נהל את הנוכחות הדיגיטלית שלך, קבל הזמנות והגדל את החשיפה ללקוחות חדשים.
        </p>
      </div>

      {existingBusiness && (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-md mx-auto"
        >
          <Card className="border-2 border-blue-100 shadow-xl bg-white backdrop-blur-sm overflow-hidden hover:shadow-2xl transition-all cursor-pointer"
            onClick={() => navigate(createPageUrl('BusinessDashboard'))}>
            <div className="h-2 bg-gradient-to-r from-blue-500 to-indigo-500" />
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-100">
                <Building2 className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">{existingBusiness.business_name}</h3>
              <p className="text-slate-500 mb-6 text-sm">העסק שלך כבר רשום במערכת</p>
              <Button className="w-full bg-slate-900 text-white hover:bg-slate-800">
                מעבר לניהול העסק
                <ArrowRight className="w-4 h-4 mr-2" />
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Options Grid */}
      <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto mt-8">

        {/* Claim Option */}
        <Card
          className="group relative overflow-hidden border-2 border-transparent hover:border-blue-100 hover:shadow-xl transition-all cursor-pointer bg-white"
          onClick={onSelectClaim}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="p-8 relative z-10 flex flex-col items-center h-full text-center">
            <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Search className="w-7 h-7 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-3">יש לי כבר עסק קיים</h3>
            <p className="text-slate-500 mb-6 flex-grow">
              העסק שלך מופיע ב-Google Maps? תבע אותו וקבל גישה מיידית לניהול הפרופיל.
            </p>
            <Button variant="outline" className="w-full border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800">
              חיפוש ואימות עסק
            </Button>
          </CardContent>
        </Card>

        {/* Register New Option */}
        <Card
          className="group relative overflow-hidden border-2 border-transparent hover:border-purple-100 hover:shadow-xl transition-all cursor-pointer bg-white"
          onClick={onSelectRegister}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-pink-50 opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="p-8 relative z-10 flex flex-col items-center h-full text-center">
            <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Sparkles className="w-7 h-7 text-purple-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-3">אני רוצה להקים עסק חדש</h3>
            <p className="text-slate-500 mb-6 flex-grow">
              הצטרף למאגר הספקים שלנו, פתח דף עסק חדש והתחל לקבל הזמנות.
            </p>
            <Button variant="outline" className="w-full border-purple-200 text-purple-700 hover:bg-purple-50 hover:text-purple-800">
              הרשמת עסק חדש
            </Button>
          </CardContent>
        </Card>

      </div>
    </motion.div>
  );
}

function ClaimBusinessView({ onBack, onClaimSuccess }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [predictions, setPredictions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState(null);

  const autocompleteService = useRef(null);
  const placesService = useRef(null);

  useEffect(() => {
    // Initialize Google Places Services
    const initServices = () => {
      if (window.google && window.google.maps && window.google.maps.places) {
        if (!autocompleteService.current) {
          autocompleteService.current = new window.google.maps.places.AutocompleteService();
        }
        if (!placesService.current) {
          // Requires a map node or just a dummy one, but PlacesService usually needs a node.
          // We can use a hidden div or document.createElement('div').
          placesService.current = new window.google.maps.places.PlacesService(document.createElement('div'));
        }
      }
    };

    // Retry checking for google maps script load
    const interval = setInterval(() => {
      if (window.google) {
        initServices();
        clearInterval(interval);
      }
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const handleSearch = (input) => {
    setSearchTerm(input);
    if (!input || !autocompleteService.current) {
      setPredictions([]);
      return;
    }

    setIsLoading(true);
    // Bias towards Koh Samui
    const samuiBounds = new window.google.maps.LatLngBounds(
      new window.google.maps.LatLng(9.4, 99.9),
      new window.google.maps.LatLng(9.6, 100.1)
    );

    autocompleteService.current.getPlacePredictions(
      { input, locationBias: samuiBounds, types: ['establishment'] },
      (results, status) => {
        setIsLoading(false);
        if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
          setPredictions(results);
        } else {
          setPredictions([]);
        }
      }
    );
  };

  const handleSelectPrediction = (placeId) => {
    if (!placesService.current) return;

    setIsLoading(true);
    placesService.current.getDetails(
      { placeId, fields: ['name', 'formatted_address', 'geometry', 'photos', 'international_phone_number', 'website', 'rating'] },
      (place, status) => {
        setIsLoading(false);
        if (status === window.google.maps.places.PlacesServiceStatus.OK) {
          setSelectedPlace({ ...place, placeId }); // Store full details
        }
      }
    );
  };

  const claimMutation = useMutation({
    mutationFn: async (placeData) => {
      // Create 'pending' service provider from Google Data
      const payload = {
        business_name: placeData.name,
        description: `Imported from Google Maps: ${placeData.formatted_address}`,
        location: placeData.formatted_address,
        latitude: placeData.geometry?.location?.lat(),
        longitude: placeData.geometry?.location?.lng(),
        status: 'pending_verification',
        verified: false,
        phone: placeData.international_phone_number || '',
        category: 'other', // Default, user can change later
        google_place_id: placeData.placeId,
        metadata: {
          google_rating: placeData.rating,
          google_photos: placeData.photos?.map(p => p.getUrl()) || []
        }
      };

      return await db.entities.ServiceProvider.create(payload);
    },
    onSuccess: () => {
      onClaimSuccess();
    }
  });

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="max-w-2xl mx-auto"
    >
      <Button variant="ghost" onClick={onBack} className="mb-6 pl-0 hover:pl-2 transition-all">
        <ArrowRight className="w-4 h-4 ml-2" />
        חזרה לבחירה
      </Button>

      <Card>
        <CardContent className="p-8">
          <h2 className="text-2xl font-bold mb-6 text-center">איתור עסק קיים</h2>

          <div className="relative mb-6">
            <Search className="absolute right-3 top-3 w-5 h-5 text-gray-400" />
            <Input
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="הקלד שם עסק (באנגלית או עברית)..."
              className="pr-10 py-6 text-lg"
              autoFocus
            />
          </div>

          {/* Predictions List */}
          {predictions.length > 0 && !selectedPlace && (
            <div className="space-y-2 border rounded-lg p-2 max-h-60 overflow-y-auto bg-slate-50">
              {predictions.map((p) => (
                <div
                  key={p.place_id}
                  className="p-3 hover:bg-white hover:shadow-sm cursor-pointer rounded-md transition-all flex items-start gap-3"
                  onClick={() => handleSelectPrediction(p.place_id)}
                >
                  <MapPin className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" />
                  <div className="text-right">
                    <p className="font-medium text-slate-800">{p.structured_formatting.main_text}</p>
                    <p className="text-sm text-slate-500">{p.structured_formatting.secondary_text}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Selected Place Confirmation */}
          {selectedPlace && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 bg-blue-50 p-6 rounded-xl border border-blue-100 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">{selectedPlace.name}</h3>
              <p className="text-slate-600 mb-4">{selectedPlace.formatted_address}</p>

              <Button
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => claimMutation.mutate(selectedPlace)}
                disabled={claimMutation.isPending}
              >
                {claimMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : null}
                זה העסק שלי - בקש בעלות
              </Button>
              <Button variant="ghost" className="mt-2 text-sm text-slate-500" onClick={() => setSelectedPlace(null)}>
                זה לא העסק שלי
              </Button>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function RegisterBusinessForm({ onBack, onSuccess }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    business_name: '',
    contact_name: '',
    phone: '',
    whatsapp: '',
    email: '',
    category: '',
    description: '',
    languages: [],
    location: '',
    service_areas: [],
    available_hours: '',
    emergency_service: false,
    price_range: 'moderate',
  });
  const [mapPosition, setMapPosition] = useState(null);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [images, setImages] = useState([]);

  // --- Reuse the original mutation logic ---
  const createBusinessMutation = useMutation({
    mutationFn: async (businessData) => {
      return await db.entities.ServiceProvider.create(businessData);
    },
    onSuccess: () => {
      onSuccess();
    },
  });

  const handleLanguageToggle = (lang) => {
    setFormData((prev) => ({
      ...prev,
      languages: prev.languages.includes(lang)
        ? prev.languages.filter((l) => l !== lang)
        : [...prev.languages, lang],
    }));
  };

  const handleAreaToggle = (area) => {
    setFormData((prev) => ({
      ...prev,
      service_areas: prev.service_areas.includes(area)
        ? prev.service_areas.filter((a) => a !== area)
        : [...prev.service_areas, area],
    }));
  };

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
      setImages((prev) => [...prev, ...uploadedUrls]);
    } catch (error) {
      console.error('Error uploading images:', error);
    } finally {
      setUploadingImages(false);
    }
  };

  const handleSubmit = () => {
    const businessData = {
      ...formData,
      latitude: mapPosition?.lat,
      longitude: mapPosition?.lng,
      images,
      status: 'active', // Should likely be 'pending' in prod but keeping original logic for now
      verified: true, // Should likely be false
      average_rating: 0,
      total_reviews: 0,
    };

    createBusinessMutation.mutate(businessData);
  };

  // Validation functions (Same as before)
  const isStep1Valid = () => formData.business_name && formData.contact_name && formData.phone && formData.category;
  const isStep2Valid = () => formData.description && formData.languages.length > 0 && formData.location && formData.service_areas.length > 0;
  const isStep3Valid = () => mapPosition !== null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={onBack} size="icon" className="rounded-full">
          <ArrowRight className="w-5 h-5" />
        </Button>
        <h2 className="text-2xl font-bold">טופס רישום עסק</h2>
      </div>

      <div className="grid grid-cols-4 gap-2 mb-8 h-1 bg-gray-200 rounded-full overflow-hidden">
        {[1, 2, 3, 4].map(s => (
          <div key={s} className={`h-full transition-all duration-500 ${step >= s ? 'bg-blue-600' : 'bg-transparent'}`} />
        ))}
      </div>

      <Card className="shadow-lg border-none bg-white/90 backdrop-blur-sm">
        <CardContent className="p-8">
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="flex items-center gap-2 text-blue-600 mb-4">
                <Store className="w-6 h-6" />
                <h3 className="text-lg font-semibold">מידע בסיסי</h3>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">שם העסק <span className="text-red-500">*</span></label>
                  <Input value={formData.business_name} onChange={(e) => setFormData({ ...formData, business_name: e.target.value })} placeholder="שם העסק באנגלית/עברית" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">איש קשר <span className="text-red-500">*</span></label>
                  <Input value={formData.contact_name} onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })} placeholder="שם מלא" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">טלפון <span className="text-red-500">*</span></label>
                  <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="+66..." dir="ltr" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">קטגוריה <span className="text-red-500">*</span></label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                    <SelectTrigger><SelectValue placeholder="בחר קטגוריה" /></SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end mt-8">
                <Button onClick={() => setStep(2)} disabled={!isStep1Valid()} className="bg-blue-600 hover:bg-blue-700">
                  המשך לשלב הבא
                  <ArrowRight className="w-4 h-4 mr-2" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 2: Details */}
          {step === 2 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="flex items-center gap-2 text-blue-600 mb-4">
                <Sparkles className="w-6 h-6" />
                <h3 className="text-lg font-semibold">פרטים נוספים</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">תיאור העסק <span className="text-red-500">*</span></label>
                  <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={4} className="resize-none" />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">שפות שירות</label>
                  <div className="flex flex-wrap gap-2">
                    {languages.map(lang => (
                      <Badge key={lang.value}
                        variant={formData.languages.includes(lang.value) ? 'default' : 'outline'}
                        className="cursor-pointer hover:bg-blue-50"
                        onClick={() => handleLanguageToggle(lang.value)}
                      >
                        {lang.label}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">אזורי שירות</label>
                  <div className="flex flex-wrap gap-2">
                    {areaOptions.map(area => (
                      <Badge key={area}
                        variant={formData.service_areas.includes(area) ? 'default' : 'outline'}
                        className="cursor-pointer hover:bg-green-50"
                        onClick={() => handleAreaToggle(area)}
                      >
                        {area}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Input value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} placeholder="כתובת ראשית (טקסט חופשי)" />
              </div>

              <div className="flex justify-between mt-8">
                <Button variant="outline" onClick={() => setStep(1)}>חזור</Button>
                <Button onClick={() => setStep(3)} disabled={!isStep2Valid()} className="bg-blue-600 hover:bg-blue-700">המשך לשלב הבא</Button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Map */}
          {step === 3 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="flex items-center gap-2 text-blue-600 mb-4">
                <MapPin className="w-6 h-6" />
                <h3 className="text-lg font-semibold">מיקום במפה</h3>
              </div>
              <p className="text-sm text-gray-500">לחץ על המפה כדי לסמן את המיקום המדויק. זהו המיקום שלקוחות יראו בניווט.</p>

              <div className="rounded-xl overflow-hidden border border-gray-200">
                <GoogleMap
                  center={mapPosition || { lat: 9.5, lng: 100.0 }}
                  zoom={13}
                  height="400px"
                  markers={mapPosition ? [{ lat: mapPosition.lat, lng: mapPosition.lng }] : []}
                  onMapClick={(pos) => setMapPosition(pos)}
                />
              </div>

              <div className="flex justify-between mt-8">
                <Button variant="outline" onClick={() => setStep(2)}>חזור</Button>
                <Button onClick={() => setStep(4)} disabled={!isStep3Valid()} className="bg-blue-600 hover:bg-blue-700">המשך לשלב הבא</Button>
              </div>
            </motion.div>
          )}

          {/* Step 4: Images */}
          {step === 4 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="flex items-center gap-2 text-blue-600 mb-4">
                <Upload className="w-6 h-6" />
                <h3 className="text-lg font-semibold">תמונות</h3>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center bg-gray-50 hover:bg-white transition-colors">
                <input type="file" id="images" multiple accept="image/*" onChange={handleImageUpload} className="hidden" />
                <label htmlFor="images" className="cursor-pointer flex flex-col items-center gap-3">
                  {uploadingImages ? <Loader2 className="w-10 h-10 animate-spin text-blue-500" /> : <Upload className="w-10 h-10 text-gray-400" />}
                  <span className="font-medium text-gray-700">{uploadingImages ? 'מעלה תמונות...' : 'לחץ כאן לבחירת תמונות'}</span>
                </label>
              </div>

              {images.length > 0 && (
                <div className="grid grid-cols-4 gap-4 mt-4">
                  {images.map((url, i) => (
                    <div key={i} className="relative aspect-square rounded-lg overflow-hidden group">
                      <img src={url} className="w-full h-full object-cover" alt="" />
                      <button onClick={() => setImages(prev => prev.filter((_, idx) => idx !== i))} className="absolute top-1 left-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Zap className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-between mt-8">
                <Button variant="outline" onClick={() => setStep(3)}>חזור</Button>
                <Button onClick={handleSubmit} disabled={createBusinessMutation.isPending} className="bg-green-600 hover:bg-green-700">
                  {createBusinessMutation.isPending ? 'יוצר עסק...' : 'סיום והרשמה'}
                </Button>
              </div>
            </motion.div>
          )}

        </CardContent>
      </Card>
    </motion.div>
  );
}
