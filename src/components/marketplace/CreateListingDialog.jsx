import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Upload, X } from 'lucide-react';
import { MarketplaceService } from '@/services/MarketplaceService';
import { toast } from 'sonner';
// Import the shared data structure
import { MARKETPLACE_CATEGORIES } from '@/data/marketplaceData';
import GooglePlacesAutocomplete from '@/components/GooglePlacesAutocomplete';

const CONDITIONS = ['New', 'Like New', 'Good', 'Fair', 'Poor'];

export function CreateListingDialog({ open, onOpenChange, onSuccess }) {
    // Note: We filter out external categories (like Real Estate) in the parent or here
    const availableCategories = MARKETPLACE_CATEGORIES.filter(c => !c.isExternal);

    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        price: '',
        category_id: '',
        subcategory: '',
        condition: '',
        description: '',
        location: 'Koh Samui',
        latitude: null,
        longitude: null,
        // Dynamic fields container
        extras: {}
    });
    const [selectedImages, setSelectedImages] = useState([]);
    const fileInputRef = useRef(null);

    const handleImageSelect = (e) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            if (files.length + selectedImages.length > 5) {
                toast.error("Maximum 5 images allowed");
                return;
            }
            setSelectedImages(prev => [...prev, ...files]);
        }
    };

    const removeImage = (index) => {
        setSelectedImages(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.title || !formData.price || !formData.category_id || !formData.condition) {
            toast.error("Please fill in all required fields");
            return;
        }

        setLoading(true);
        try {
            // Append Condition, Subcategory, and Extras to description
            let extrasText = '';
            Object.entries(formData.extras).forEach(([key, val]) => {
                if (val) extrasText += `**${key.charAt(0).toUpperCase() + key.slice(1)}:** ${val}\n`;
            });

            const activeCat = availableCategories.find(c => c.id === formData.category_id);
            const activeSub = activeCat?.subcategories?.find(s => s.id === formData.subcategory);

            const enhancedDescription = `
**Condition:** ${formData.condition}
**Category:** ${activeCat?.label || ''} > ${activeSub?.label || 'General'}
${extrasText}

${formData.description}
            `.trim();

            // Create clean payload with lat/lng mapping
            const { latitude, longitude, ...cleanData } = formData;

            await MarketplaceService.createItem({
                ...cleanData,
                description: enhancedDescription,
                price: parseFloat(formData.price),
                lat: latitude,
                lng: longitude
            }, selectedImages);

            toast.success("Listing created successfully!");
            onSuccess();
            onOpenChange(false);
            setFormData({ title: '', price: '', category_id: '', subcategory: '', condition: '', description: '', location: 'Koh Samui', latitude: null, longitude: null, extras: {} });
            setSelectedImages([]);
        } catch (error) {
            console.error(error);
            toast.error("Failed to create listing: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const selectedCategory = availableCategories.find(c => c.id === formData.category_id);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Sell an Item</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="title">Title *</Label>
                        <Input
                            id="title"
                            placeholder="What are you selling?"
                            value={formData.title}
                            onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="price">Price (THB) *</Label>
                            <Input
                                id="price"
                                type="number"
                                placeholder="0"
                                value={formData.price}
                                onChange={e => setFormData(prev => ({ ...prev, price: e.target.value }))}
                            />
                        </div>
                        <div className="grid gap-2">
                            <label htmlFor="location" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Location</label>
                            <GooglePlacesAutocomplete
                                placeholder="Search location..."
                                onPlaceSelected={(place) => setFormData(prev => ({
                                    ...prev,
                                    location: place.name,
                                    latitude: place.latitude,
                                    longitude: place.longitude
                                }))}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ps-10"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="category">Category *</Label>
                            <Select
                                value={formData.category_id}
                                onValueChange={val => setFormData(prev => ({ ...prev, category_id: val, subcategory: '', extras: {} }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableCategories.map(cat => (
                                        <SelectItem key={cat.id} value={cat.id}>{cat.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="subcategory">Sub-Category</Label>
                            <Select
                                value={formData.subcategory}
                                onValueChange={val => setFormData(prev => ({ ...prev, subcategory: val }))}
                                disabled={!selectedCategory || !selectedCategory.subcategories || selectedCategory.subcategories.length === 0}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {selectedCategory?.subcategories?.map(sub => (
                                        <SelectItem key={sub.id} value={sub.id}>{sub.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* DYNAMIC FIELDS based on Category */}
                    {selectedCategory?.fields && selectedCategory.fields.length > 0 && (
                        <div className="p-4 bg-slate-50 rounded-lg space-y-3">
                            <h4 className="text-sm font-semibold text-slate-700">Specific Details</h4>
                            <div className="grid grid-cols-2 gap-3">
                                {selectedCategory.fields.map(field => {
                                    if (field === 'condition') return null; // Handled separately
                                    return (
                                        <div key={field} className="grid gap-1">
                                            <Label className="capitalize text-xs">{field}</Label>
                                            <Input
                                                className="h-8 text-sm"
                                                placeholder={`Enter ${field}`}
                                                value={formData.extras[field] || ''}
                                                onChange={e => setFormData(prev => ({
                                                    ...prev,
                                                    extras: { ...prev.extras, [field]: e.target.value }
                                                }))}
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <div className="grid gap-2">
                        <Label htmlFor="condition">Condition *</Label>
                        <Select
                            value={formData.condition}
                            onValueChange={val => setFormData(prev => ({ ...prev, condition: val }))}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select Condition" />
                            </SelectTrigger>
                            <SelectContent>
                                {CONDITIONS.map(cond => (
                                    <SelectItem key={cond} value={cond}>{cond}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            rows={4}
                            placeholder="Describe your item... (Mention specific details)"
                            value={formData.description}
                            onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label>Photos (Max 5)</Label>
                        <div className="flex flex-wrap gap-2">
                            {selectedImages.map((file, i) => (
                                <div key={i} className="relative w-24 h-24 border rounded-md overflow-hidden group">
                                    <img
                                        src={URL.createObjectURL(file)}
                                        alt="Preview"
                                        className="w-full h-full object-cover"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeImage(i)}
                                        className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                            ))}
                            {selectedImages.length < 5 && (
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-md flex flex-col items-center justify-center text-gray-500 hover:border-indigo-500 hover:text-indigo-500 transition-colors"
                                >
                                    <Upload size={20} />
                                    <span className="text-xs mt-1">Add Photo</span>
                                </button>
                            )}
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            multiple
                            onChange={handleImageSelect}
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700">
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Post Listing
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
