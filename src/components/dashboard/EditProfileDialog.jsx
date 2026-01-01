import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Settings, Save, Loader2, Image as ImageIcon } from 'lucide-react';
import { supabase } from '@/api/supabaseClient';
import { useToast } from "@/components/ui/use-toast";

export default function EditProfileDialog({ provider, onUpdate }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const [formData, setFormData] = useState({
        business_name: '',
        description: '',
        contact_phone: '',
        contact_email: '',
        whatsapp_number: '',
        website: ''
    });

    useEffect(() => {
        if (provider) {
            setFormData({
                business_name: provider.business_name || '',
                description: provider.description || '',
                contact_phone: provider.contact_phone || '',
                contact_email: provider.contact_email || provider.email || '', // Fallback to auth email
                whatsapp_number: provider.whatsapp_number || '',
                website: provider.website || ''
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
