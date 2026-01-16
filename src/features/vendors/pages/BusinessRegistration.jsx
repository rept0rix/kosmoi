
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/shared/lib/utils";
import { db } from '@/api/supabaseClient';
import { useAuth } from '@/features/auth/context/AuthContext';
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import "leaflet/dist/leaflet.css"; // This import is no longer strictly needed if react-leaflet is removed, but harmless to keep if other parts of the app use it. For this file, it's irrelevant.
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
  Globe,
  Clock,
  Zap,
} from "lucide-react";
import GoogleMap from "@/components/GoogleMap";

import { subCategoriesBySuperCategory } from "@/components/subCategories";
import { getTranslation } from "@/components/translations";

// Helper to flatten categories for the select dropdown
const getCategoryOptions = () => {
  const options = [];
  Object.keys(subCategoriesBySuperCategory).forEach(superCat => {
    subCategoriesBySuperCategory[superCat].forEach(subCat => {
      // Skip 'all_' categories for registration
      if (!subCat.startsWith('all_')) {
        options.push({ value: subCat, label: getTranslation('hebrew', subCat) || subCat });
      }
    });
  });
  // Add "Other" manually
  options.push({ value: "other", label: "אחר / בקש קטגוריה" });
  return options.sort((a, b) => a.label.localeCompare(b.label));
};

const categories = getCategoryOptions();

const languages = [
  { value: "thai", label: "תאילנדית" },
  { value: "english", label: "אנגלית" },
  { value: "hebrew", label: "עברית" },
  { value: "russian", label: "רוסית" },
  { value: "chinese", label: "סינית" },
  { value: "german", label: "גרמנית" },
  { value: "french", label: "צרפתית" },
];

const areaOptions = [
  "בו-פוט",
  "לאמאי",
  "צ'אוונג",
  "מאנם",
  "בנג רק",
  "נאתון",
  "תלינג-נגאם",
  "מאה-נאם",
];

export default function BusinessRegistration() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    business_name: "",
    contact_name: "",
    phone: "",
    whatsapp: "",
    email: "",
    category: "",
    description: "",
    languages: [],
    location: "",
    service_areas: [],
    available_hours: "",
    emergency_service: false,
    price_range: "moderate",
  });
  const [mapPosition, setMapPosition] = useState(null);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [images, setImages] = useState([]);

  /* 
   * Duplicate state declarations removed. 
   * The original declarations were at lines 97-98.
   */

  const { user, isAuthenticated, isLoadingAuth } = useAuth();

  const createBusinessMutation = useMutation({
    mutationFn: async (/** @type {any} */ businessData) => {
      return await db.entities.ServiceProvider.create(businessData);
    },
    onSuccess: () => {
      navigate(createPageUrl("BusinessDashboard"));
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
      console.error("Error uploading images:", error);
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
      status: "active",
      verified: true,
      average_rating: 0,
      total_reviews: 0,
    };

    createBusinessMutation.mutate(businessData);
  };

  const isStep1Valid = () => {
    return (
      formData.business_name &&
      formData.contact_name &&
      formData.phone &&
      formData.category
    );
  };

  const isStep2Valid = () => {
    return (
      formData.description &&
      formData.languages.length > 0 &&
      formData.location &&
      formData.service_areas.length > 0
    );
  };

  const isStep3Valid = () => {
    return mapPosition !== null;
  };

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-3">נדרשת התחברות</h2>
            <p className="text-gray-600 mb-6">
              עליך להתחבר כדי לרשום עסק במערכת
            </p>
            <Button
              onClick={() => db.auth.redirectToLogin(window.location.pathname)}
              className="w-full"
            >
              התחבר / הרשם
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Store className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            הרשמת עסק חדש
          </h1>
          <p className="text-gray-600">הצטרף למאגר ספקי השירות של קוסמוי</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-4">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w - 10 h - 10 rounded - full flex items - center justify - center font - bold ${step >= s
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-500"
                    } `}
                >
                  {s}
                </div>
                {s < 4 && (
                  <div
                    className={`w - 12 h - 1 ${step > s ? "bg-blue-600" : "bg-gray-200"
                      } `}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-center gap-12 mt-3">
            <span className="text-xs text-gray-600">פרטים בסיסיים</span>
            <span className="text-xs text-gray-600">תיאור ושירותים</span>
            <span className="text-xs text-gray-600">מיקום</span>
            <span className="text-xs text-gray-600">תמונות</span>
          </div>
        </div>

        {/* Form */}
        <Card className="shadow-xl">
          <CardContent className="p-6">
            {/* Step 1: Basic Info */}
            {step === 1 && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Store className="w-5 h-5" />
                  פרטים בסיסיים
                </h3>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    שם העסק <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={formData.business_name}
                    onChange={(e) =>
                      setFormData({ ...formData, business_name: e.target.value })
                    }
                    placeholder="לדוגמה: יוסי פיקס - שירותי אנדימן"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    שם איש קשר <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={formData.contact_name}
                    onChange={(e) =>
                      setFormData({ ...formData, contact_name: e.target.value })
                    }
                    placeholder="שמך המלא"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      טלפון <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      placeholder="+66..."
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      WhatsApp
                    </label>
                    <Input
                      value={formData.whatsapp}
                      onChange={(e) =>
                        setFormData({ ...formData, whatsapp: e.target.value })
                      }
                      placeholder="+66..."
                      dir="ltr"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    אימייל
                  </label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="your@email.com"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    קטגוריה <span className="text-red-500">*</span>
                  </label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) =>
                      setFormData({ ...formData, category: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="בחר קטגוריה" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    טווח מחירים
                  </label>
                  <Select
                    value={formData.price_range}
                    onValueChange={(value) =>
                      setFormData({ ...formData, price_range: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="budget">תקציבי</SelectItem>
                      <SelectItem value="moderate">בינוני</SelectItem>
                      <SelectItem value="premium">פרימיום</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={() => setStep(2)}
                  disabled={!isStep1Valid()}
                  className="w-full"
                >
                  המשך
                  <ArrowRight className="w-4 h-4 mr-2" />
                </Button>
              </div>
            )}

            {/* Step 2: Description & Services */}
            {step === 2 && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  תיאור ושירותים
                </h3>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    תיאור העסק <span className="text-red-500">*</span>
                  </label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="ספר על העסק שלך, השירותים שאתה מציע, הניסיון שלך..."
                    rows={5}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    שפות <span className="text-red-500">*</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {languages.map((lang) => (
                      <Badge
                        key={lang.value}
                        onClick={() => handleLanguageToggle(lang.value)}
                        className={`cursor - pointer ${formData.languages.includes(lang.value)
                          ? "bg-blue-600 text-white"
                          : "bg-gray-200 text-gray-700"
                          } `}
                      >
                        {lang.label}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    מיקום ראשי <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                    placeholder="לדוגמה: בו-פוט, צ'אוונג..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    אזורי שירות <span className="text-red-500">*</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {areaOptions.map((area) => (
                      <Badge
                        key={area}
                        onClick={() => handleAreaToggle(area)}
                        className={`cursor - pointer ${formData.service_areas.includes(area)
                          ? "bg-green-600 text-white"
                          : "bg-gray-200 text-gray-700"
                          } `}
                      >
                        {area}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    שעות זמינות
                  </label>
                  <Input
                    value={formData.available_hours}
                    onChange={(e) =>
                      setFormData({ ...formData, available_hours: e.target.value })
                    }
                    placeholder="לדוגמה: 08:00-18:00 או 24/7"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="emergency"
                    checked={formData.emergency_service}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        emergency_service: e.target.checked,
                      })
                    }
                    className="w-5 h-5"
                  />
                  <label htmlFor="emergency" className="text-sm font-medium">
                    שירות חירום 24/7
                  </label>
                  <Zap className="w-4 h-4 text-orange-500" />
                </div>

                <div className="flex gap-3">
                  <Button onClick={() => setStep(1)} variant="outline" className="flex-1">
                    חזור
                  </Button>
                  <Button
                    onClick={() => setStep(3)}
                    disabled={!isStep2Valid()}
                    className="flex-1"
                  >
                    המשך
                    <ArrowRight className="w-4 h-4 mr-2" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Location */}
            {step === 3 && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  סמן את המיקום שלך על המפה
                </h3>

                <p className="text-sm text-gray-600 mb-4">
                  לחץ על המפה כדי לסמן את המיקום המדויק של העסק שלך
                </p>

                <GoogleMap
                  center={mapPosition || { lat: 9.5, lng: 100.0 }}
                  zoom={13}
                  height="400px"
                  markers={mapPosition ? [{
                    lat: mapPosition.lat,
                    lng: mapPosition.lng,
                    title: "המיקום שלך"
                  }] : []}
                  onMapClick={(position) => setMapPosition(position)}
                />

                {mapPosition && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-sm text-green-800">
                      מיקום נבחר: {mapPosition.lat.toFixed(4)}, {mapPosition.lng.toFixed(4)}
                    </span>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button onClick={() => setStep(2)} variant="outline" className="flex-1">
                    חזור
                  </Button>
                  <Button
                    onClick={() => setStep(4)}
                    disabled={!isStep3Valid()}
                    className="flex-1"
                  >
                    המשך
                    <ArrowRight className="w-4 h-4 mr-2" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 4: Images */}
            {step === 4 && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  תמונות העסק
                </h3>

                <p className="text-sm text-gray-600">
                  הוסף תמונות של העבודות שלך, הציוד, או הצוות (אופציונלי)
                </p>

                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    id="images"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <label
                    htmlFor="images"
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    {uploadingImages ? (
                      <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
                    ) : (
                      <Upload className="w-12 h-12 text-gray-400" />
                    )}
                    <span className="text-sm text-gray-600">
                      {uploadingImages ? "מעלה..." : "לחץ להעלאת תמונות"}
                    </span>
                  </label>
                </div>

                {images.length > 0 && (
                  <div className="grid grid-cols-3 gap-3">
                    {images.map((url, idx) => (
                      <div key={idx} className="relative aspect-square">
                        <img
                          src={url}
                          alt={`תמונה ${idx + 1} `}
                          className="w-full h-full object-cover rounded-lg"
                        />
                        <button
                          onClick={() =>
                            setImages((prev) => prev.filter((_, i) => i !== idx))
                          }
                          className="absolute top-1 left-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-3">
                  <Button onClick={() => setStep(3)} variant="outline" className="flex-1">
                    חזור
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={createBusinessMutation.isPending}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    {createBusinessMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                        שולח...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 ml-2" />
                        סיים הרשמה
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="mt-6 bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-semibold mb-1">שים לב:</p>
                <p>
                  העסק שלך יעבור בדיקה ואימות על ידי הצוות שלנו. תקבל הודעה כשהעסק
                  יאושר ויפורסם במערכת.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
