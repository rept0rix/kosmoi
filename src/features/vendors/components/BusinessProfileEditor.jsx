import React, { useState } from 'react';
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
import { Loader2, Save, MapPin, Store, Phone, Globe, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
// Re-using existing components
import { CategorySelector } from '@/features/vendors/components/CategorySelector';
import GoogleMap from '@/components/GoogleMap';

export function BusinessProfileEditor({ business }) {
    const queryClient = useQueryClient();
    const [isSaving, setIsSaving] = useState(false);

    // Controlled Form State (initialized from props)
    const [formData, setFormData] = useState({
        business_name: business.business_name || '',
        category: business.category || '',
        description: business.description || '',
        phone: business.phone || '',
        email: business.email || '',
        location: business.location || '',
        price_range: business.price_range || 'moderate',
        emergency_service: business.emergency_service || false,
        website: business.website || '',
        whatsapp: business.whatsapp || '',
    });

    // Update business mutation
    const updateMutation = useMutation({
        mutationFn: async (/** @type {any} */ newData) => {
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
        updateMutation.mutate(formData);
    };

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    return (
        <div className="space-y-6 pb-20">
            {/* Header Actions */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold">Edit Profile</h2>
                    <p className="text-muted-foreground">Update your public business information.</p>
                </div>
                <Button onClick={handleSave} disabled={isSaving || updateMutation.isPending}>
                    {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Save Changes
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Basic Info */}
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
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                className="min-h-[120px]"
                                value={formData.description}
                                onChange={(e) => handleChange('description', e.target.value)}
                                placeholder="Tell customers what makes your business special..."
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Contact & Location */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-green-600" /> Contact & Location
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone Number</Label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="phone"
                                        className="pl-9"
                                        value={formData.phone}
                                        onChange={(e) => handleChange('phone', e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="whatsapp">WhatsApp</Label>
                                <Input
                                    id="whatsapp"
                                    value={formData.whatsapp}
                                    onChange={(e) => handleChange('whatsapp', e.target.value)}
                                    placeholder="+66..."
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="website">Website</Label>
                            <div className="relative">
                                <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="website"
                                    className="pl-9"
                                    value={formData.website}
                                    onChange={(e) => handleChange('website', e.target.value)}
                                    placeholder="https://..."
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="location">Address / Area</Label>
                            <Input
                                id="location"
                                value={formData.location}
                                onChange={(e) => handleChange('location', e.target.value)}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Details & Attributes */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Details & Services</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Price Range</Label>
                                <Select
                                    value={formData.price_range}
                                    onValueChange={(val) => handleChange('price_range', val)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select price range" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="low">$ Low (Budget)</SelectItem>
                                        <SelectItem value="moderate">$$ Moderate</SelectItem>
                                        <SelectItem value="high">$$$ High End</SelectItem>
                                        <SelectItem value="luxury">$$$$ Luxury</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Emergency Services</Label>
                                    <span className="block text-sm text-muted-foreground">
                                        Do you offer 24/7 urgent help?
                                    </span>
                                </div>
                                <Switch
                                    checked={formData.emergency_service}
                                    onCheckedChange={(val) => handleChange('emergency_service', val)}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
