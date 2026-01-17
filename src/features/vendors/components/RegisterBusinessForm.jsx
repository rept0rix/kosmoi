import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { db } from '@/api/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import {
    ArrowRight,
    Upload,
    MapPin,
    CheckCircle,
    Loader2,
    Store,
    Map as MapIcon,
    ImageIcon,
    Globe,
    ArrowLeft
} from 'lucide-react';
import GoogleMap from '@/components/GoogleMap';
import { CategorySelector } from './CategorySelector';
import { PhoneVerification } from './PhoneVerification';
import { cn } from '@/shared/lib/utils';

const languages = [
    { value: 'english', label: 'English' },
    { value: 'thai', label: 'Thai' },
    { value: 'hebrew', label: 'Hebrew' },
    { value: 'russian', label: 'Russian' },
    { value: 'french', label: 'French' },
    { value: 'german', label: 'German' },
    { value: 'chinese', label: 'Chinese' },
];

const areaOptions = [
    'Bo Phut', 'Lamai', 'Chaweng', 'Maenam', 'Bang Rak',
    'Nathon', 'Taling Ngam', 'Choeng Mon', 'Lipanoi', 'Butterfly Garden'
];

export function RegisterBusinessForm({ initialName = '', onBack, onSuccess }) {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        business_name: initialName,
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

    const createBusinessMutation = useMutation({
        mutationFn: async (/** @type {any} */ businessData) => {
            return await db.entities.ServiceProvider.create(businessData);
        },
        onSuccess: () => onSuccess(),
        onError: (err) => console.error("Create failed", err)
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

    const handleMapLocationChange = (loc) => {
        setMapPosition({ lat: loc.lat, lng: loc.lng });
        if (loc.address) {
            setFormData(prev => ({ ...prev, location: loc.address }));
        }
    };

    const handleSubmit = () => {
        createBusinessMutation.mutate({
            ...formData,
            latitude: mapPosition?.lat || 0,
            longitude: mapPosition?.lng || 0,
            images,
            status: 'pending_verification',
            verified: false,
            average_rating: 0,
            total_reviews: 0,
        });
    };

    const isStep1Valid = () => formData.business_name.length > 1 && formData.contact_name.length > 1 && formData.phone.length > 8 && formData.category;
    const isStep2Valid = () => formData.description.length > 5 && formData.location.length > 2 && formData.service_areas.length > 0;

    return (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            {onBack && (
                <Button variant="ghost" onClick={onBack} className="mb-4 pl-0">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </Button>
            )}

            <div className="flex items-center gap-4 mb-6">
                <h2 className="text-2xl font-bold">New Business Registration</h2>
            </div>

            <div className="grid grid-cols-4 gap-2 mb-8 h-1 bg-gray-200 rounded-full overflow-hidden">
                {[1, 2, 3, 4].map(s => (
                    <div key={s} className={`h-full transition-all duration-500 ${step >= s ? 'bg-blue-600' : 'bg-transparent'}`} />
                ))}
            </div>

            <Card className="shadow-lg border-none bg-white/90 backdrop-blur-sm">
                <CardContent className="p-8">
                    {/* Step 1 */}
                    {step === 1 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label>Business Name <span className="text-red-500">*</span></Label>
                                    <Input
                                        value={formData.business_name}
                                        onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Contact Name <span className="text-red-500">*</span></Label>
                                    <Input
                                        value={formData.contact_name}
                                        onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Phone <span className="text-red-500">*</span></Label>
                                    <PhoneVerification
                                        value={formData.phone}
                                        onChange={(val) => setFormData({ ...formData, phone: val })}
                                        error={null}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Category <span className="text-red-500">*</span></Label>
                                    <CategorySelector
                                        value={formData.category}
                                        onChange={(val) => setFormData({ ...formData, category: val })}
                                        error={null}
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end mt-8">
                                <Button onClick={() => setStep(2)} disabled={!isStep1Valid()} className="bg-blue-600 text-white">
                                    Continue &nbsp; <ArrowRight className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Step 2 */}
                    {step === 2 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Description <span className="text-red-500">*</span></Label>
                                    <Textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label>Location / Address</Label>
                                        <Input value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Service Areas</Label>
                                        <div className="flex flex-wrap gap-2 p-3 border rounded-md">
                                            {areaOptions.map((area) => (
                                                <Badge key={area} variant={formData.service_areas.includes(area) ? 'default' : 'outline'} className="cursor-pointer" onClick={() => handleAreaToggle(area)}>
                                                    {area}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Languages</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {languages.map((lang) => (
                                            <Badge key={lang.value} variant={formData.languages.includes(lang.value) ? 'secondary' : 'outline'} className={cn("cursor-pointer", formData.languages.includes(lang.value) ? "bg-green-100" : "")} onClick={() => handleLanguageToggle(lang.value)}>
                                                <Globe className="w-3 h-3 mr-1" /> {lang.label}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-between mt-8">
                                <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
                                <Button onClick={() => setStep(3)} disabled={!isStep2Valid()} className="bg-blue-600 text-white">
                                    Next: Map &nbsp; <ArrowRight className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Step 3 */}
                    {step === 3 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="h-[400px] w-full rounded-xl overflow-hidden border relative">
                                <div className="absolute inset-0">
                                    <GoogleMap
                                        height="100%"
                                        center={mapPosition || { lat: 9.512, lng: 100.058 }}
                                        zoom={13}
                                        onMapClick={handleMapLocationChange}
                                        markers={mapPosition ? [{ lat: mapPosition.lat, lng: mapPosition.lng }] : []}
                                    />
                                </div>
                                {!mapPosition && <div className="absolute top-4 left-4 bg-white p-2 rounded shadow">Click map to pin location</div>}
                            </div>
                            <div className="flex justify-between mt-8">
                                <Button variant="ghost" onClick={() => setStep(2)}>Back</Button>
                                <Button onClick={() => setStep(4)} className="bg-blue-600 text-white">Confirm Location <ArrowRight className="w-4 h-4 ml-2" /></Button>
                            </div>
                        </div>
                    )}

                    {/* Step 4 */}
                    {step === 4 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <Label>Images (Max 5)</Label>
                            <div className="flex gap-4 flex-wrap">
                                {images.map((url, i) => <img key={i} src={url} className="w-24 h-24 object-cover rounded" />)}
                                {images.length < 5 && (
                                    <label className="w-24 h-24 border-2 border-dashed flex items-center justify-center cursor-pointer">
                                        <input type="file" onChange={handleImageUpload} className="hidden" />
                                        {uploadingImages ? <Loader2 className="animate-spin" /> : <Upload />}
                                    </label>
                                )}
                            </div>
                            <div className="flex justify-between mt-8">
                                <Button variant="ghost" onClick={() => setStep(3)}>Back</Button>
                                <Button onClick={handleSubmit} disabled={createBusinessMutation.isPending} className="bg-green-600 text-white">
                                    {createBusinessMutation.isPending ? <Loader2 className="animate-spin mr-2" /> : <CheckCircle className="mr-2" />}
                                    Submit
                                </Button>
                            </div>
                        </div>
                    )}

                </CardContent>
            </Card>
        </motion.div>
    );
}
