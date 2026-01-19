import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/api/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import {
    Loader2, Save, MapPin, Store, Phone, Globe, Image as ImageIcon,
    Clock, Share2, Facebook, Instagram, Sparkles, Plus, Trash2
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';

// Components
import { CategorySelector } from '@/features/vendors/components/CategorySelector';
import GoogleMap from '@/components/GoogleMap';
import { ImageUploader } from '@/components/ui/ImageUploader';
import { HoursEditor } from '@/features/vendors/components/HoursEditor';

export function BusinessProfileEditor({ business }) {
    const queryClient = useQueryClient();
    const [isSaving, setIsSaving] = useState(false);

    // Initial state from props
    const [formData, setFormData] = useState({
        business_name: business.business_name || '',
        category: business.category || '',
        description: business.description || '',
        phone: business.phone || '',
        email: business.email || '',
        location: business.location || '',
        latitude: business.latitude || 9.512, // Default Koh Samui
        longitude: business.longitude || 100.013,
        price_range: business.price_range || 'moderate',
        emergency_service: business.emergency_service || false,
        website: business.website || '',
        whatsapp: business.whatsapp || '',
        logo_url: business.logo_url || '',
        images: (business.images && business.images.length > 0) ? business.images : (business.metadata?.google_photos || []),
        opening_hours: business.opening_hours || {},
        social_links: business.social_links || { facebook: '', instagram: '', line: '' },
        price_packages: business.price_packages || []
    });

    // Map marker for current location
    const [mapMarker, setMapMarker] = useState(null);

    useEffect(() => {
        if (formData.latitude && formData.longitude) {
            setMapMarker([{
                lat: parseFloat(formData.latitude),
                lng: parseFloat(formData.longitude),
                title: 'Business Location'
            }]);
        }
    }, [formData.latitude, formData.longitude]);

    const handleMapClick = (coords) => {
        setFormData(prev => ({
            ...prev,
            latitude: coords.lat,
            longitude: coords.lng
        }));

        toast({ title: "Location Updated", description: "Pin moved to new location." });
    };

    // Update business mutation
    const updateMutation = useMutation({
        mutationFn: async (newData) => {
            const { error } = await db
                .from('service_providers')
                .update(newData)
                .eq('id', business.id);

            if (error) throw error;
            return newData;
        },
        onSuccess: () => {
            toast({
                title: "Profile Updated",
                description: "Your business details have been saved successfully.",
            });
            queryClient.invalidateQueries({ queryKey: ['my-businesses'] });
            queryClient.invalidateQueries({ queryKey: ['my-business'] });
        },
        onError: (err) => {
            console.error("Update failed:", err);
            toast({
                title: "Update Failed",
                description: "Could not save changes. Please try again.",
                variant: "destructive"
            });
        },
        onSettled: () => {
            setIsSaving(false);
        }
    });

    const handleSave = () => {
        setIsSaving(true);
        updateMutation.mutate(/** @type {any} */(formData));
    };

    const handleChange = (field, value) => {
        if (!formData) return;
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    return (
        <div className="space-y-6 pb-20">
            {/* Header Actions */}
            <div className="flex justify-between items-center mb-6 sticky top-0 bg-background/95 backdrop-blur z-20 py-4 border-b">
                <div className="flex items-center gap-4">
                    <div className="relative group">
                        <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-slate-200 bg-slate-100 shrink-0">
                            {formData?.logo_url ? (
                                <img src={formData.logo_url} alt="Logo" className="w-full h-full object-cover" />
                            ) : (
                                <Store className="w-8 h-8 m-4 text-slate-400" />
                            )}
                        </div>
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-full cursor-pointer">
                            <div className="transform scale-75">
                                <ImageUploader
                                    value={formData?.logo_url}
                                    onChange={(url) => handleChange('logo_url', url)}
                                    bucket="uploads"
                                    folder="logos"
                                    compact={true}
                                />
                            </div>
                        </div>
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold">Edit Profile</h2>
                        <p className="text-muted-foreground">Update your public business information.</p>
                    </div>
                </div>
                <Button onClick={handleSave} disabled={isSaving || updateMutation.isPending} size="lg">
                    {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Save Changes
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2">

                {/* 1. Identity & Branding (Gallery Only now) */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ImageIcon className="w-5 h-5 text-indigo-600" /> Photo Gallery
                        </CardTitle>
                        <CardDescription>Showcase your business with high-quality photos (Max 10).</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ImageUploader
                            value={formData.images}
                            onChange={(urls) => handleChange('images', urls)}
                            bucket="uploads"
                            folder="gallery"
                            multiple
                        />
                    </CardContent>
                </Card>

                {/* 2. Basic Info */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Store className="w-5 h-5 text-blue-600" /> Basic Info
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="business_name">Business Name</Label>
                            <Input
                                id="business_name"
                                value={formData.business_name}
                                onChange={(e) => handleChange('business_name', e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Category</Label>
                            <CategorySelector
                                value={formData.category}
                                onChange={(val) => handleChange('category', val)}
                                error={null}
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <Label htmlFor="description">Description</Label>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                    onClick={() => {
                                        // Improved Generation Logic
                                        const location = formData.location || 'Koh Samui';
                                        const cat = formData.category ? formData.category.replace('_', ' ') : 'Business';
                                        const name = formData.business_name || 'Our Place';

                                        const templates = [
                                            `Welcome to ${name}! We are a premier ${cat} destination in ${location}, dedicated to providing exceptional service and a warm atmosphere.`,
                                            `Discover ${name} in the heart of ${location}. We specialize in professional ${cat} services tailored to your needs.`,
                                            `Experience the best of ${location} at ${name}. Whether you're here for ${cat} or just to relax, we promise an unforgettable visit.`
                                        ];

                                        const randomTemplate = templates[Math.floor(Math.random() * templates.length)];

                                        // Only append if description is short, otherwise replace? User complained about appending.
                                        // Let's replace for now, or append if it's very different.
                                        handleChange('description', randomTemplate);
                                        toast({ title: "AI Description Generated", description: "Feel free to edit it further!" });
                                    }}
                                >
                                    <Sparkles className="w-3 h-3 mr-1" /> Generate with AI
                                </Button>
                            </div>
                            <Textarea
                                id="description"
                                className="min-h-[120px]"
                                value={formData.description}
                                onChange={(e) => handleChange('description', e.target.value)}
                                placeholder="Tell customers what makes your business special..."
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Price Range</Label>
                                <Select
                                    value={formData.price_range}
                                    onValueChange={(val) => handleChange('price_range', val)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="low">$ Low</SelectItem>
                                        <SelectItem value="moderate">$$ Moderate</SelectItem>
                                        <SelectItem value="high">$$$ High</SelectItem>
                                        <SelectItem value="luxury">$$$$ Luxury</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2 flex flex-col justify-end pb-2">
                                <div className="flex items-center gap-2">
                                    <Switch
                                        checked={formData.emergency_service}
                                        onCheckedChange={(val) => handleChange('emergency_service', val)}
                                    />
                                    <Label>Emergency Service?</Label>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* 3. Contact & Socials */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Phone className="w-5 h-5 text-green-600" /> Contact
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Phone Number</Label>
                            <Input
                                value={formData.phone}
                                onChange={(e) => handleChange('phone', e.target.value)}
                                placeholder="+66..."
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                                <span className="bg-green-100 text-green-700 p-0.5 rounded text-xs">WhatsApp</span>
                                Direct Number
                            </Label>
                            <Input
                                value={formData.whatsapp}
                                onChange={(e) => handleChange('whatsapp', e.target.value)}
                                placeholder="+66 (Numbers only)"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Website</Label>
                            <Input
                                value={formData.website}
                                onChange={(e) => handleChange('website', e.target.value)}
                                placeholder="https://"
                            />
                        </div>

                        <div className="pt-4 border-t space-y-3">
                            <Label className="flex items-center gap-2"><Share2 className="w-4 h-4" /> Social Media</Label>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="relative">
                                    <Facebook className="absolute left-2 top-2.5 h-4 w-4 text-blue-600" />
                                    <Input
                                        className="pl-8"
                                        placeholder="Facebook URL"
                                        value={formData.social_links?.facebook || ''}
                                        onChange={(e) => {
                                            const currentSocials = formData.social_links || { facebook: '', instagram: '', line: '' };
                                            handleChange('social_links', { ...currentSocials, facebook: e.target.value });
                                        }}
                                    />
                                </div>
                                <div className="relative">
                                    <Instagram className="absolute left-2 top-2.5 h-4 w-4 text-pink-600" />
                                    <Input
                                        className="pl-8"
                                        placeholder="Instagram"
                                        value={formData.social_links?.instagram || ''}
                                        onChange={(e) => {
                                            const currentSocials = formData.social_links || { facebook: '', instagram: '', line: '' };
                                            handleChange('social_links', { ...currentSocials, instagram: e.target.value });
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* 3.5 Products / Menu */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Store className="w-5 h-5 text-purple-600" /> Products / Services Menu
                        </CardTitle>
                        <CardDescription>List your key services or products. These appear on your profile.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {(formData.price_packages || []).map((pkg, idx) => (
                            <div key={idx} className="flex gap-3 items-start p-3 border rounded-lg bg-slate-50 relative group">
                                <div className="flex-1 space-y-2">
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="Item Name (e.g. 1 Hour Massage)"
                                            value={pkg.title}
                                            onChange={(e) => {
                                                const newPkgs = [...(formData.price_packages || [])];
                                                newPkgs[idx].title = e.target.value;
                                                handleChange('price_packages', newPkgs);
                                            }}
                                            className="font-medium"
                                        />
                                        <Input
                                            placeholder="Price (e.g. 500)"
                                            value={pkg.price}
                                            onChange={(e) => {
                                                const newPkgs = [...(formData.price_packages || [])];
                                                newPkgs[idx].price = e.target.value;
                                                handleChange('price_packages', newPkgs);
                                            }}
                                            className="w-24 text-right"
                                        />
                                    </div>
                                    <Textarea
                                        placeholder="Brief description..."
                                        value={pkg.description}
                                        onChange={(e) => {
                                            const newPkgs = [...(formData.price_packages || [])];
                                            newPkgs[idx].description = e.target.value;
                                            handleChange('price_packages', newPkgs);
                                        }}
                                        className="h-16 text-sm"
                                    />
                                </div>
                                {/* Service Image */}
                                <div className="w-20 h-20 shrink-0">
                                    <ImageUploader
                                        value={pkg.image_url}
                                        onChange={(url) => {
                                            const newPkgs = [...(formData.price_packages || [])];
                                            newPkgs[idx].image_url = url;
                                            handleChange('price_packages', newPkgs);
                                        }}
                                        bucket="uploads"
                                        folder="services"
                                        compact={true}
                                    />
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-red-400 hover:text-red-600 hover:bg-red-50"
                                    onClick={() => {
                                        const newPkgs = (formData.price_packages || []).filter((_, i) => i !== idx);
                                        handleChange('price_packages', newPkgs);
                                    }}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        ))}

                        <Button
                            type="button"
                            variant="outline"
                            className="w-full border-dashed"
                            onClick={() => {
                                const newPkgs = [...(formData.price_packages || []), { title: '', price: '', description: '' }];
                                handleChange('price_packages', newPkgs);
                            }}
                        >
                            <Plus className="w-4 h-4 mr-2" /> Add Item
                        </Button>
                    </CardContent>
                </Card>

                {/* 4. Location Map */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-red-600" /> Exact Location
                        </CardTitle>
                        <CardDescription>Click on the map to place your business pin precisely.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <Input
                                value={formData.location}
                                onChange={(e) => handleChange('location', e.target.value)}
                                placeholder="Type address manually (e.g. Chaweng Beach Road)..."
                            />
                            <div className="rounded-xl overflow-hidden border h-[400px] w-full relative">
                                <GoogleMap
                                    center={formData.latitude ? { lat: formData.latitude, lng: formData.longitude } : { lat: 9.512, lng: 100.013 }}
                                    zoom={14}
                                    markers={mapMarker || []}
                                    onMapClick={handleMapClick}
                                    height="100%"
                                />
                                <div className="absolute bottom-4 left-4 bg-white/90 p-2 rounded shadow text-xs">
                                    Lat: {formData.latitude?.toFixed(5)}, Lng: {formData.longitude?.toFixed(5)}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* 5. Opening Hours */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="w-5 h-5 text-orange-600" /> Opening Hours
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <HoursEditor
                            value={formData.opening_hours}
                            onChange={(val) => handleChange('opening_hours', val)}
                        />
                    </CardContent>
                </Card>

            </div>
        </div>
    );
}
