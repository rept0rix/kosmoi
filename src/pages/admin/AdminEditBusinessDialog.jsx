
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
import { StripeService } from '@/services/payments/StripeService';
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import PromptPayQR from '@/components/payments/PromptPayQR';

export default function AdminEditBusinessDialog({ open, onOpenChange, business, onSaved }) {
    const [formData, setFormData] = useState({
        business_name: '',
        category: '',
        location: '',
        status: 'pending',
        phone: '',
        website: '',
        description: '',
        super_category: '',
        promptpay_id: ''
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
                category: business.sub_category || business.category || '', // Prefer sub_category for the dropdown value
                location: business.location || '',
                status: business.status || 'pending',
                phone: business.phone || '',
                website: business.website || '',
                description: business.description || '',
                super_category: business.super_category || '',
                promptpay_id: business.metadata?.promptpay_id || ''
            });
        } else {
            // Reset for Create Mode
            setFormData({
                business_name: '',
                category: '',
                location: '',
                status: 'pending',
                phone: '',
                website: '',
                description: '',
                super_category: '',
                promptpay_id: ''
            });
        }
    }, [business]);

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const updates = {
                ...formData,
                metadata: {
                    ...(business?.metadata || {}),
                    promptpay_id: formData.promptpay_id
                }
            };
            delete updates.promptpay_id;

            if (updates.category && (!business || updates.category !== business.category)) {
                const found = allCategories.find(c => c.sub === updates.category);
                if (found) {
                    updates.super_category = found.superCat;
                    updates.sub_category = updates.category; // Set specific type

                    // Map SuperCategory to App Vertical (Legacy Support)
                    const verticalMap = {
                        enjoy: 'wellness',
                        travel: 'transport',
                        eat: 'eats'
                    };
                    updates.category = verticalMap[found.superCat] || found.superCat;
                }
            }

            let result;
            if (business?.id) {
                result = await AdminService.updateBusiness(business.id, updates);
            } else {
                result = await AdminService.createBusiness({
                    ...updates,
                    verified: updates.status === 'verified',
                    average_rating: 0,
                    total_reviews: 0
                });
            }

            if (result.error) throw result.error;

            toast.success(business?.id ? "Business updated successfully" : "Business created successfully");
            onSaved(result.data); // Pass back the new/updated business
            onOpenChange(false);
        } catch (error) {
            console.error("Save failed:", error);
            toast.error("Failed to save: " + error.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-slate-900 border-slate-700 text-slate-100 max-w-2xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>{business?.id ? 'Edit Business' : 'Add New Business'}</DialogTitle>
                    <DialogDescription className="text-slate-400">
                        {business?.id ? `Update details for ${business.business_name}.` : 'Create a new service provider listing.'}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto min-h-0 pr-2 -mr-2 pl-1">
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

                    {/* Financial */}
                    <div className="grid gap-2 border-t border-slate-700 pt-4 mt-2">
                        <Label className="text-lg font-semibold text-slate-200">Financial</Label>
                        <div className="flex items-center justify-between bg-slate-800 p-3 rounded-md border border-slate-700">
                            <div>
                                <div className="text-sm font-medium text-slate-300">Stripe Integration</div>
                                <div className="text-xs text-slate-500">
                                    {business?.stripe_account_id
                                        ? `Connected (${business.stripe_status || 'Pending'})`
                                        : "Not connected to Stripe"}
                                </div>
                            </div>
                            {(!business?.stripe_account_id || business.stripe_status === 'restricted') && (
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => StripeService.createConnectAccount(business.id)}
                                    className="bg-[#635BFF] hover:bg-[#5851df] text-white border-none"
                                >
                                    Connect Bank
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* PromptPay */}
                    <div className="grid gap-2 border-t border-slate-700 pt-4 mt-2">
                        <Label className="text-lg font-semibold text-slate-200">PromptPay (Thai QR)</Label>
                        <div className="flex flex-col md:flex-row gap-4 items-start">
                            <div className="flex-1 space-y-2 w-full">
                                <Label htmlFor="promptpay_id" className="text-xs text-slate-400">
                                    Phone (08x...) or Tax ID (13 digits)
                                </Label>
                                <Input
                                    id="promptpay_id"
                                    value={formData.promptpay_id || ''}
                                    onChange={e => handleChange('promptpay_id', e.target.value)}
                                    placeholder="0812345678"
                                    className="bg-slate-800 border-slate-700 font-mono"
                                />
                                <p className="text-[10px] text-slate-500">
                                    This ID will be used to generate QR codes for customers.
                                </p>
                            </div>
                            <div className="flex-shrink-0">
                                {formData.promptpay_id ? (
                                    <PromptPayQR
                                        promptPayId={formData.promptpay_id}
                                        amount={100} // Preview with 100 THB
                                        className="scale-75 origin-top-left"
                                    />
                                ) : (
                                    <div className="w-32 h-32 bg-slate-800 border border-slate-700 border-dashed rounded-lg flex items-center justify-center text-xs text-slate-500">
                                        QR Preview
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} className="border-slate-700 hover:bg-slate-800 mr-2">
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white">
                        {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> {business?.id ? "Saving..." : "Creating..."}</> : (business?.id ? "Save Changes" : "Create Business")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog >
    );
}
