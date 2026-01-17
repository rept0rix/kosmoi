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

    // Google Places State
    const [addressInput, setAddressInput] = useState('');
    const [predictions, setPredictions] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showMap, setShowMap] = useState(false);

    const autocompleteService = React.useRef(null);
    const placesService = React.useRef(null);
    const geocoder = React.useRef(null);

    React.useEffect(() => {
        const initServices = () => {
            if (window.google && window.google.maps && window.google.maps.places) {
                if (!autocompleteService.current) autocompleteService.current = new window.google.maps.places.AutocompleteService();
                if (!placesService.current) placesService.current = new window.google.maps.places.PlacesService(document.createElement('div'));
                if (!geocoder.current) geocoder.current = new window.google.maps.Geocoder();
            }
        };
        const interval = setInterval(() => {
            if (window.google) {
                initServices();
                clearInterval(interval);
            }
        }, 500);
        return () => clearInterval(interval);
    }, []);

    const handleAddressSearch = (input) => {
        setAddressInput(input);
        setFormData(prev => ({ ...prev, location: input }));

        if (!input || !autocompleteService.current) {
            setPredictions([]);
            return;
        }

        setIsSearching(true);
        const samuiBounds = new window.google.maps.LatLngBounds(
            new window.google.maps.LatLng(9.4, 99.9),
            new window.google.maps.LatLng(9.6, 100.1)
        );

        autocompleteService.current.getPlacePredictions(
            { input, locationBias: samuiBounds, types: ['establishment', 'geocode'] },
            (results, status) => {
                setIsSearching(false);
                if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
                    setPredictions(results);
                } else {
                    setPredictions([]);
                }
            }
        );
    };

    const handleSelectAddress = (prediction) => {
        setAddressInput(prediction.description);
        setFormData(prev => ({ ...prev, location: prediction.description }));
        setPredictions([]);

        // Get details to set map
        if (placesService.current) {
            placesService.current.getDetails({ placeId: prediction.place_id, fields: ['geometry'] }, (place, status) => {
                if (status === window.google.maps.places.PlacesServiceStatus.OK && place.geometry && place.geometry.location) {
                    const lat = place.geometry.location.lat();
                    const lng = place.geometry.location.lng();
                    setMapPosition({ lat, lng });
                    setShowMap(true);
                }
            });
        }
    };

    const handleManualPinClick = () => {
        setShowMap(true);
        // Default to Samui center if no position
        if (!mapPosition) {
            setMapPosition({ lat: 9.512, lng: 100.058 });
        }
    };

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
        // Optional: Reverse geocode to update address if map clicked? 
        // For now, let's keep address as user typed/selected to avoid overwriting with generic geocodes.
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
    // Step 2 is now Details + Location. VALID when desc exists + location exists + mapPosition exists (to ensure pinned)
    const isStep2Valid = () => formData.description.length > 5 && formData.location.length > 2 && !!mapPosition && formData.service_areas.length > 0;

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

            <div className="grid grid-cols-3 gap-2 mb-8 h-1 bg-gray-200 rounded-full overflow-hidden">
                {[1, 2, 3].map(s => (
                    <div key={s} className={`h-full transition-all duration-500 ${step >= s ? 'bg-blue-600' : 'bg-transparent'}`} />
                ))}
            </div>

            <Card className="shadow-lg border-none bg-white/90 backdrop-blur-sm">
                <CardContent className="p-8">
                    {/* Step 1: Basic Info */}
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

                    {/* Step 2: Details & Location */}
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
                                    <div className="space-y-2 relative">
                                        <Label>Location Search <span className="text-red-500">*</span></Label>
                                        <div className="relative">
                                            <Input
                                                value={addressInput}
                                                onChange={(e) => handleAddressSearch(e.target.value)}
                                                placeholder="Search Google Maps..."
                                            />
                                            {isSearching && <Loader2 className="absolute right-3 top-2.5 h-5 w-5 animate-spin text-gray-400" />}

                                            {predictions.length > 0 && (
                                                <div className="absolute z-10 w-full bg-white mt-1 border rounded-md shadow-lg max-h-60 overflow-y-auto">
                                                    {predictions.map((p) => (
                                                        <div
                                                            key={p.place_id}
                                                            className="p-3 hover:bg-blue-50 cursor-pointer text-sm border-b last:border-0"
                                                            onClick={() => handleSelectAddress(p)}
                                                        >
                                                            <p className="font-medium">{p.structured_formatting.main_text}</p>
                                                            <p className="text-xs text-gray-500">{p.structured_formatting.secondary_text}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        <div className="mt-2 text-right">
                                            <Button variant="link" size="sm" onClick={handleManualPinClick} className="text-blue-600 p-0 h-auto">
                                                <MapPin className="w-4 h-4 mr-1" />
                                                {showMap ? "Adjust Pin on Map" : "Pin location manually"}
                                            </Button>
                                        </div>

                                        {showMap && (
                                            <div className="mt-2 h-[300px] w-full rounded-md overflow-hidden border">
                                                <GoogleMap
                                                    height="100%"
                                                    center={mapPosition || { lat: 9.512, lng: 100.058 }} // Samui Center
                                                    zoom={mapPosition ? 15 : 12}
                                                    onMapClick={handleMapLocationChange}
                                                    markers={mapPosition ? [{ lat: mapPosition.lat, lng: mapPosition.lng }] : []}
                                                />
                                            </div>
                                        )}

                                        {!mapPosition && showMap && (
                                            <p className="text-xs text-amber-600 mt-1">Please tap on the map to mark the exact location.</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Service Areas</Label>
                                        <div className="flex flex-wrap gap-2 p-3 border rounded-md max-h-[300px] overflow-y-auto">
                                            {areaOptions.map((area) => (
                                                <Badge key={area} variant={formData.service_areas.includes(area) ? 'default' : 'outline'} className="cursor-pointer" onClick={() => handleAreaToggle(area)}>
                                                    {area}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Languages Spoken</Label>
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
                                    Next: Images &nbsp; <ArrowRight className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Images & Submit */}
                    {step === 3 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <Label>Images (Max 5)</Label>
                            <div className="flex gap-4 flex-wrap">
                                {images.map((url, i) => <img key={i} src={url} className="w-24 h-24 object-cover rounded" />)}
                                {images.length < 5 && (
                                    <label className="w-24 h-24 border-2 border-dashed flex items-center justify-center cursor-pointer hover:bg-slate-50">
                                        <input type="file" onChange={handleImageUpload} className="hidden" />
                                        {uploadingImages ? <Loader2 className="animate-spin" /> : <Upload />}
                                    </label>
                                )}
                            </div>
                            <div className="flex justify-between mt-8">
                                <Button variant="ghost" onClick={() => setStep(2)}>Back</Button>
                                <Button onClick={handleSubmit} disabled={createBusinessMutation.isPending} className="bg-green-600 text-white">
                                    <span className="flex items-center justify-center">
                                        {createBusinessMutation.isPending ? (
                                            <Loader2 className="animate-spin mr-2" />
                                        ) : (
                                            <CheckCircle className="mr-2" />
                                        )}
                                        <span>Submit Registration</span>
                                    </span>
                                </Button>
                            </div>
                        </div>
                    )}

                </CardContent>
            </Card>
        </motion.div>
    );
}
