
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { subCategoriesBySuperCategory } from '@/components/subCategories';
import { AdminService } from '@/services/AdminService';
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function AdminEditBusinessDialog({ open, onOpenChange, business, onSaved }) {
    const [formData, setFormData] = useState({
        business_name: '',
        category: '',
        location: '',
        status: 'pending',
        phone: '',
        website: '',
        description: '',
        super_category: ''
    });
    const [saving, setSaving] = useState(false);

    // Flatten all categories for the dropdown
    const allCategories = Object.entries(subCategoriesBySuperCategory).flatMap(([superCat, subs]) =>
        subs.map(sub => ({ sub, superCat }))
    );

    useEffect(() => {
        if (business) {
            setFormData({
                business_name: business.business_name || '',
                category: business.category || '',
                location: business.location || '',
                status: business.status || 'pending',
                phone: business.phone || '',
                website: business.website || '',
                description: business.description || '',
                super_category: business.super_category || ''
            });
        }
    }, [business]);

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        if (!business?.id) return;
        setSaving(true);
        try {
            // If category changed, update super_category automatically
            let updates = { ...formData };
            if (updates.category !== business.category) {
                const found = allCategories.find(c => c.sub === updates.category);
                if (found) updates.super_category = found.superCat;
            }

            const { error } = await AdminService.updateBusiness(business.id, updates);
            if (error) throw error;

            toast.success("Business updated successfully");
            onSaved(); // Refresh list
            onOpenChange(false);
        } catch (error) {
            console.error("Update failed:", error);
            toast.error("Failed to update business: " + error.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-slate-900 border-slate-700 text-slate-100 max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Edit Business</DialogTitle>
                    <DialogDescription className="text-slate-400">
                        Update details for {business?.business_name}.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">

                    {/* Name */}
                    <div className="grid gap-2">
                        <Label htmlFor="business_name">Business Name</Label>
                        <Input
                            id="business_name"
                            value={formData.business_name || ''}
                            onChange={e => handleChange('business_name', e.target.value)}
                            className="bg-slate-800 border-slate-700"
                        />
                    </div>

                    {/* Category */}
                    <div className="grid gap-2">
                        <Label>Category</Label>
                        <Select
                            value={formData.category || ''}
                            onValueChange={val => handleChange('category', val)}
                        >
                            <SelectTrigger className="bg-slate-800 border-slate-700">
                                <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent className="max-h-[300px]">
                                {allCategories.map(({ sub, superCat }) => (
                                    <SelectItem key={sub} value={sub}>
                                        {sub.replace(/_/g, ' ')} ({superCat})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Status */}
                    <div className="grid gap-2">
                        <Label>Status</Label>
                        <Select
                            value={formData.status || 'pending'}
                            onValueChange={val => handleChange('status', val)}
                        >
                            <SelectTrigger className="bg-slate-800 border-slate-700">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="active">Active (Visible)</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="inactive">Inactive</SelectItem>
                                <SelectItem value="verified">Verified</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Location */}
                    <div className="grid gap-2">
                        <Label htmlFor="location">Location (Address)</Label>
                        <Input
                            id="location"
                            value={formData.location || ''}
                            onChange={e => handleChange('location', e.target.value)}
                            className="bg-slate-800 border-slate-700"
                        />
                    </div>

                    {/* Phone */}
                    <div className="grid gap-2">
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                            id="phone"
                            value={formData.phone || ''}
                            onChange={e => handleChange('phone', e.target.value)}
                            className="bg-slate-800 border-slate-700"
                        />
                    </div>

                    {/* Website */}
                    <div className="grid gap-2">
                        <Label htmlFor="website">Website</Label>
                        <Input
                            id="website"
                            value={formData.website || ''}
                            onChange={e => handleChange('website', e.target.value)}
                            className="bg-slate-800 border-slate-700"
                        />
                    </div>

                    {/* Description */}
                    <div className="grid gap-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            value={formData.description || ''}
                            onChange={e => handleChange('description', e.target.value)}
                            className="bg-slate-800 border-slate-700 min-h-[100px]"
                        />
                    </div>

                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} className="border-slate-700 hover:bg-slate-800 mr-2">
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white">
                        {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : "Save Changes"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
