import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Settings, Save, Loader2, Image as ImageIcon } from 'lucide-react';
import { supabase } from '@/api/supabaseClient';
import { useToast } from "@/components/ui/use-toast";
import { Plus, X, Trash2, Package, Tag, Building2, ImageIcon as LucideImage } from 'lucide-react';
import ImageUploader from './ImageUploader';

export default function EditProfileDialog({ provider, onUpdate }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();
    const amenityInputRef = useRef(null);

    const [formData, setFormData] = useState({
        business_name: '',
        description: '',
        contact_phone: '',
        contact_email: '',
        whatsapp_number: '',
        website: '',
        logo_url: '',
        images: [],
        price_packages: [],
        amenities: []
    });

    useEffect(() => {
        if (provider) {
            setFormData({
                business_name: provider.business_name || '',
                description: provider.description || '',
                contact_phone: provider.contact_phone || '',
                contact_email: provider.contact_email || provider.email || '', // Fallback to auth email
                whatsapp_number: provider.whatsapp_number || '',
                website: provider.website || '',
                logo_url: provider.logo_url || '',
                images: provider.images || [],
                price_packages: Array.isArray(provider.price_packages) ? provider.price_packages : [],
                amenities: Array.isArray(provider.amenities) ? provider.amenities : []
            });
        }
    }, [provider]);

    const handleChange = (e) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { error } = await supabase
                .from('service_providers')
                .update({
                    business_name: formData.business_name,
                    description: formData.description,
                    contact_phone: formData.contact_phone,
                    contact_email: formData.contact_email,
                    whatsapp_number: formData.whatsapp_number,
                    website: formData.website,
                    logo_url: formData.logo_url,
                    images: formData.images,
                    price_packages: formData.price_packages,
                    amenities: formData.amenities,
                    updated_at: new Date().toISOString()
                })
                .eq('id', provider.id);

            if (error) throw error;

            toast({
                title: "Profile Updated",
                description: "Your business details have been saved.",
            });

            if (onUpdate) onUpdate();
            setOpen(false);

        } catch (error) {
            console.error('Update failed:', error);
            toast({
                title: "Error",
                description: "Failed to update profile. Please try again.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2 border-white/10 hover:bg-white/5 hover:text-white text-slate-400">
                    <Settings className="w-4 h-4" />
                    Edit Profile
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] bg-slate-900 text-white border-white/20 max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Edit Business Profile</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 mt-4">

                    {/* Basic Info */}
                    <div className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="business_name">Business Name</Label>
                            <Input
                                id="business_name"
                                name="business_name"
                                value={formData.business_name}
                                onChange={handleChange}
                                placeholder="e.g. Samui Island Tours"
                                className="bg-slate-800 border-slate-700"
                                required
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="description">About Your Business</Label>
                            <Textarea
                                id="description"
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                placeholder="Tell customers what makes you special..."
                                className="bg-slate-800 border-slate-700 min-h-[100px]"
                            />
                        </div>
                    </div>

                    {/* Branding & Visuals */}
                    <div className="space-y-4 pt-4 border-t border-white/10">
                        <h4 className="font-medium text-slate-300 flex items-center gap-2">
                            <LucideImage className="w-4 h-4 text-blue-400" />
                            Branding & Visuals
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label>Business Logo</Label>
                                <div className="flex gap-4 items-start">
                                    {formData.logo_url && (
                                        <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-slate-700 bg-black/40">
                                            <img src={formData.logo_url} alt="Logo" className="w-full h-full object-cover" />
                                            <button
                                                type="button"
                                                onClick={() => setFormData(p => ({ ...p, logo_url: '' }))}
                                                className="absolute top-1 right-1 bg-black/60 p-1 rounded-full hover:bg-black/80 transition-colors"
                                            >
                                                <X className="w-3 h-3 text-white" />
                                            </button>
                                        </div>
                                    )}
                                    <div className="flex-1">
                                        <ImageUploader
                                            onUploadComplete={(url) => setFormData(p => ({ ...p, logo_url: url }))}
                                            className="h-24 py-2"
                                            path="logos"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Gallery Images</Label>
                                <div className="grid grid-cols-4 gap-2 mb-2">
                                    {formData.images.map((img, idx) => (
                                        <div key={idx} className="relative aspect-square rounded overflow-hidden border border-slate-700 group">
                                            <img src={img} alt={`Gallery ${idx}`} className="w-full h-full object-cover" />
                                            <button
                                                type="button"
                                                onClick={() => setFormData(p => ({ ...p, images: p.images.filter((_, i) => i !== idx) }))}
                                                className="absolute top-1 right-1 bg-red-500/90 p-1.5 rounded-full text-white hover:bg-red-600 transition-colors shadow-sm"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                <ImageUploader
                                    onUploadComplete={(url) => setFormData(p => ({ ...p, images: [...p.images, url] }))}
                                    className="h-24 py-2"
                                    path="gallery"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Services & Pricing */}
                    <div className="space-y-4 pt-4 border-t border-white/10">
                        <div className="flex items-center justify-between">
                            <h4 className="font-medium text-slate-300 flex items-center gap-2">
                                <Package className="w-4 h-4 text-purple-400" />
                                Service Packages
                            </h4>
                            <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => setFormData(p => ({
                                    ...p,
                                    price_packages: [...p.price_packages, { title: '', price: '', description: '' }]
                                }))}
                                className="h-8 border-dashed"
                            >
                                <Plus className="w-3 h-3 mr-1" /> Add Package
                            </Button>
                        </div>

                        <div className="space-y-3">
                            {formData.price_packages.map((pkg, idx) => (
                                <div key={idx} className="grid md:grid-cols-12 gap-3 items-start bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                                    <div className="md:col-span-4">
                                        <Input
                                            placeholder="Package Title"
                                            value={pkg.title}
                                            onChange={(e) => {
                                                const newPackages = [...formData.price_packages];
                                                newPackages[idx].title = e.target.value;
                                                setFormData({ ...formData, price_packages: newPackages });
                                            }}
                                            className="bg-slate-900 border-slate-700 h-8 text-sm"
                                        />
                                    </div>
                                    <div className="md:col-span-3">
                                        <Input
                                            placeholder="Price"
                                            value={pkg.price}
                                            onChange={(e) => {
                                                const newPackages = [...formData.price_packages];
                                                newPackages[idx].price = e.target.value;
                                                setFormData({ ...formData, price_packages: newPackages });
                                            }}
                                            className="bg-slate-900 border-slate-700 h-8 text-sm"
                                        />
                                    </div>
                                    <div className="md:col-span-4">
                                        <Input
                                            placeholder="Description (optional)"
                                            value={pkg.description}
                                            onChange={(e) => {
                                                const newPackages = [...formData.price_packages];
                                                newPackages[idx].description = e.target.value;
                                                setFormData({ ...formData, price_packages: newPackages });
                                            }}
                                            className="bg-slate-900 border-slate-700 h-8 text-sm"
                                        />
                                    </div>
                                    <div className="md:col-span-1 flex justify-end">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="text-slate-400 hover:text-red-400 h-8 w-8 p-0"
                                            onClick={() => {
                                                const newPackages = formData.price_packages.filter((_, i) => i !== idx);
                                                setFormData({ ...formData, price_packages: newPackages });
                                            }}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                            {formData.price_packages.length === 0 && (
                                <p className="text-sm text-slate-500 italic text-center py-2">No packages added yet.</p>
                            )}
                        </div>
                    </div>

                    {/* Amenities */}
                    <div className="space-y-4 pt-4 border-t border-white/10">
                        <h4 className="font-medium text-slate-300 flex items-center gap-2">
                            <Tag className="w-4 h-4 text-emerald-400" />
                            Amenities & Features
                        </h4>

                        <div className="flex flex-wrap gap-2 mb-2">
                            {formData.amenities.map((amenity, idx) => (
                                <span key={idx} className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded text-sm border border-emerald-500/20">
                                    {amenity}
                                    <button
                                        type="button"
                                        onClick={() => setFormData(p => ({ ...p, amenities: p.amenities.filter((_, i) => i !== idx) }))}
                                        className="hover:text-emerald-300"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </span>
                            ))}
                        </div>

                        <div className="flex gap-2">
                            <Input
                                ref={amenityInputRef}
                                placeholder="Add amenity (e.g. WiFi, Parking) and press Enter"
                                className="bg-slate-800 border-slate-700"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        const val = e.currentTarget.value.trim();
                                        if (val && !formData.amenities.includes(val)) {
                                            setFormData(p => ({ ...p, amenities: [...p.amenities, val] }));
                                            e.currentTarget.value = '';
                                        }
                                    }
                                }}
                            />
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => {
                                    const input = amenityInputRef.current;
                                    if (!input) return;
                                    const val = input.value.trim();
                                    if (val && !formData.amenities.includes(val)) {
                                        setFormData(p => ({ ...p, amenities: [...p.amenities, val] }));
                                        input.value = '';
                                    }
                                }}
                            >
                                Add
                            </Button>
                        </div>
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-4 pt-4 border-t border-white/10">
                        <h4 className="font-medium text-slate-300">Contact Details</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="contact_email">Public Email</Label>
                                <Input
                                    id="contact_email"
                                    name="contact_email"
                                    value={formData.contact_email}
                                    onChange={handleChange}
                                    className="bg-slate-800 border-slate-700"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="contact_phone">Phone Number</Label>
                                <Input
                                    id="contact_phone"
                                    name="contact_phone"
                                    value={formData.contact_phone}
                                    onChange={handleChange}
                                    className="bg-slate-800 border-slate-700"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="whatsapp_number">WhatsApp (Optional)</Label>
                                <Input
                                    id="whatsapp_number"
                                    name="whatsapp_number"
                                    value={formData.whatsapp_number}
                                    onChange={handleChange}
                                    placeholder="+66..."
                                    className="bg-slate-800 border-slate-700"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="website">Website URL (Optional)</Label>
                                <Input
                                    id="website"
                                    name="website"
                                    value={formData.website}
                                    onChange={handleChange}
                                    placeholder="https://..."
                                    className="bg-slate-800 border-slate-700"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-6">
                        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" className="bg-blue-600 hover:bg-blue-500" disabled={loading}>
                            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                            Save Changes
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
