// @ts-nocheck
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from '@/api/supabaseClient';
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    SelectGroup,
    SelectLabel
} from "@/components/ui/select";
import {
    ArrowRight,
    Upload,
    MapPin,
    CheckCircle,
    AlertCircle,
    Loader2,
    Wrench,
    Clock,
    Phone,
    Camera
} from "lucide-react";
import GoogleMap from "../components/GoogleMap";
import { useLanguage } from "@/components/LanguageContext";
import { getSubCategoryLabel, subCategoriesBySuperCategory } from "../components/subCategories";
import { getTranslation } from "@/components/translations";

const urgencyLevels = [
    { value: "low", label: "לא דחוף (בשבוע הקרוב)", color: "bg-blue-100 text-blue-800" },
    { value: "medium", label: "רגיל (בימים הקרובים)", color: "bg-yellow-100 text-yellow-800" },
    { value: "high", label: "דחוף (היום/מחר)", color: "bg-orange-100 text-orange-800" },
    { value: "emergency", label: "חירום (מיידי!)", color: "bg-red-100 text-red-800" },
];

export default function RequestService() {
    const navigate = useNavigate();
    const { language } = useLanguage();
    const t = (key) => getTranslation(language, key);

    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        category: "",
        urgency: "medium",
        description: "",
        preferred_date: "",
        location: "",
        contact_name: "",
        contact_phone: "",
    });
    const [mapPosition, setMapPosition] = useState(null);
    const [uploadingImages, setUploadingImages] = useState(false);
    const [images, setImages] = useState([]);

    const { data: user } = useQuery({
        queryKey: ["currentUser"],
        queryFn: () => db.auth.me(),
    });

    // Pre-fill contact info if user is logged in
    React.useEffect(() => {
        if (user && !formData.contact_name) {
            setFormData(prev => ({
                ...prev,
                contact_name: user.user_metadata?.full_name || "",
                contact_phone: user.user_metadata?.phone || ""
            }));
        }
    }, [user]);

    const createRequestMutation = useMutation({
        mutationFn: async (/** @type {any} */ requestData) => {
            return await db.entities.ServiceRequest.create(requestData);
        },
        onSuccess: () => {
            // Redirect to My Requests page
            navigate('/MyRequests');
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
            setImages((prev) => [...prev, ...uploadedUrls]);
        } catch (error) {
            console.error("Error uploading images:", error);
        } finally {
            setUploadingImages(false);
        }
    };

    const getSuperCategoryFor = (subCat) => {
        for (const [superCat, subCats] of Object.entries(subCategoriesBySuperCategory)) {
            if (subCats.includes(subCat)) return superCat;
        }
        return 'other';
    };

    const handleSubmit = () => {
        const superCategory = getSuperCategoryFor(formData.category);

        const requestData = {
            ...formData,
            super_category: superCategory,
            user_id: user?.id, // Can be null for guest requests if we allow it, but schema might require it
            latitude: mapPosition ? mapPosition.lat : null,
            longitude: mapPosition ? mapPosition.lng : null,
            images,
            status: "pending",
            created_at: new Date().toISOString(),
        };

        createRequestMutation.mutate(requestData);
    };

    const isStep1Valid = () => formData.category && formData.urgency;
    const isStep2Valid = () => formData.description.length > 10;
    const isStep3Valid = () => formData.location && formData.contact_name && formData.contact_phone;

    // Success View
    if (step === 5) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
                <Card className="max-w-md w-full text-center p-8">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-10 h-10 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">הבקשה נשלחה בהצלחה!</h2>
                    <p className="text-gray-600 mb-8">
                        הבקשה שלך הועברה לבעלי מקצוע מתאימים באזור. הם יצרו איתך קשר בהקדם.
                    </p>
                    <Button onClick={() => navigate('/')} className="w-full">
                        חזרה לדף הבית
                    </Button>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8 px-4">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        בקש שירות
                    </h1>
                    <p className="text-gray-600">ספר לנו מה אתה צריך, ואנחנו נמצא לך את המקצוען המתאים</p>
                </div>

                {/* Progress Steps */}
                <div className="mb-8">
                    <div className="flex items-center justify-center gap-2">
                        {[1, 2, 3].map((s) => (
                            <div key={s} className={`h-2 flex-1 rounded-full ${step >= s ? 'bg-blue-600' : 'bg-gray-200'}`} />
                        ))}
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-gray-500 px-1">
                        <span>סוג השירות</span>
                        <span>פרטים</span>
                        <span>פרטי קשר</span>
                    </div>
                </div>

                <Card className="shadow-xl">
                    <CardContent className="p-6">
                        {/* Step 1: Category & Urgency */}
                        {step === 1 && (
                            <div className="space-y-6">
                                <h3 className="text-xl font-bold flex items-center gap-2">
                                    <Wrench className="w-5 h-5 text-blue-600" />
                                    איזה שירות אתה צריך?
                                </h3>

                                <div>
                                    <label className="block text-sm font-medium mb-2">קטגוריה</label>
                                    <Select
                                        value={formData.category}
                                        onValueChange={(value) => setFormData({ ...formData, category: value })}
                                    >
                                        <SelectTrigger className="h-12 text-lg">
                                            <SelectValue placeholder="בחר קטגוריה..." />
                                        </SelectTrigger>
                                        <SelectContent className="max-h-80">
                                            {Object.entries(subCategoriesBySuperCategory).map(([superCat, subCats]) => (
                                                <SelectGroup key={superCat}>
                                                    <SelectLabel>{t(superCat)}</SelectLabel>
                                                    {subCats.map((subCat) => (
                                                        <SelectItem key={subCat} value={subCat}>
                                                            {getSubCategoryLabel(subCat, language)}
                                                        </SelectItem>
                                                    ))}
                                                </SelectGroup>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-3">דחיפות</label>
                                    <div className="grid grid-cols-1 gap-3">
                                        {urgencyLevels.map((level) => (
                                            <div
                                                key={level.value}
                                                onClick={() => setFormData({ ...formData, urgency: level.value })}
                                                className={`p-4 rounded-lg border-2 cursor-pointer transition-all flex items-center justify-between ${formData.urgency === level.value
                                                    ? 'border-blue-600 bg-blue-50'
                                                    : 'border-gray-100 hover:border-gray-300'
                                                    }`}
                                            >
                                                <span className="font-medium">{level.label}</span>
                                                {formData.urgency === level.value && <CheckCircle className="w-5 h-5 text-blue-600" />}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <Button
                                    onClick={() => setStep(2)}
                                    disabled={!isStep1Valid()}
                                    className="w-full h-12 text-lg mt-4"
                                >
                                    המשך
                                    <ArrowRight className="w-5 h-5 mr-2" />
                                </Button>
                            </div>
                        )}

                        {/* Step 2: Details & Images */}
                        {step === 2 && (
                            <div className="space-y-6">
                                <h3 className="text-xl font-bold flex items-center gap-2">
                                    <Camera className="w-5 h-5 text-blue-600" />
                                    פרטים נוספים
                                </h3>

                                <div>
                                    <label className="block text-sm font-medium mb-2">תאר את הבעיה / הצורך</label>
                                    <Textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="לדוגמה: המזגן בחדר השינה מטפטף ולא מקרר..."
                                        rows={5}
                                        className="text-base"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">מינימום 10 תווים</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">תמונות (אופציונלי)</label>
                                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center bg-gray-50">
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
                                                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                                            ) : (
                                                <Upload className="w-8 h-8 text-gray-400" />
                                            )}
                                            <span className="text-sm text-gray-600">
                                                {uploadingImages ? "מעלה..." : "לחץ להוספת תמונות"}
                                            </span>
                                        </label>
                                    </div>

                                    {images.length > 0 && (
                                        <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                                            {images.map((url, idx) => (
                                                <div key={idx} className="relative w-20 h-20 flex-shrink-0">
                                                    <img src={url} alt="" className="w-full h-full object-cover rounded-md" />
                                                    <button
                                                        onClick={() => setImages(prev => prev.filter((_, i) => i !== idx))}
                                                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-3">
                                    <Button onClick={() => setStep(1)} variant="outline" className="flex-1 h-12">
                                        חזור
                                    </Button>
                                    <Button
                                        onClick={() => setStep(3)}
                                        disabled={!isStep2Valid()}
                                        className="flex-1 h-12"
                                    >
                                        המשך
                                        <ArrowRight className="w-5 h-5 mr-2" />
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Step 3: Location & Contact */}
                        {step === 3 && (
                            <div className="space-y-6">
                                <h3 className="text-xl font-bold flex items-center gap-2">
                                    <MapPin className="w-5 h-5 text-blue-600" />
                                    איפה ומתי?
                                </h3>

                                <div>
                                    <label className="block text-sm font-medium mb-2">מיקום השירות</label>
                                    <Input
                                        value={formData.location}
                                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                        placeholder="לדוגמה: צ'אוונג, רחוב ראשי..."
                                        className="mb-2"
                                    />
                                    <div className="h-48 rounded-lg overflow-hidden border border-gray-200">
                                        <GoogleMap
                                            center={mapPosition || { lat: 9.5, lng: 100.0 }}
                                            zoom={13}
                                            height="100%"
                                            markers={mapPosition ? [{ lat: mapPosition.lat, lng: mapPosition.lng }] : []}
                                            onMapClick={(pos) => setMapPosition(pos)}
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">לחץ על המפה למיקום מדויק (אופציונלי)</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">שם מלא</label>
                                        <Input
                                            value={formData.contact_name}
                                            onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                                            placeholder="שמך"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">טלפון</label>
                                        <Input
                                            value={formData.contact_phone}
                                            onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                                            placeholder="050..."
                                            dir="ltr"
                                        />
                                    </div>
                                </div>

                                {!user && (
                                    <div className="bg-yellow-50 p-3 rounded-md flex items-start gap-2 text-sm text-yellow-800">
                                        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                        <p>מומלץ להתחבר כדי לעקוב אחרי הבקשה שלך, אבל אפשר להמשיך גם כאורח.</p>
                                    </div>
                                )}

                                <div className="flex gap-3 mt-6">
                                    <Button onClick={() => setStep(2)} variant="outline" className="flex-1 h-12">
                                        חזור
                                    </Button>
                                    <Button
                                        onClick={handleSubmit}
                                        disabled={!isStep3Valid() || createRequestMutation.isPending}
                                        className="flex-1 h-12 bg-green-600 hover:bg-green-700"
                                    >
                                        {createRequestMutation.isPending ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <>
                                                שלח בקשה
                                                <CheckCircle className="w-5 h-5 mr-2" />
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
