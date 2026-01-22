import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Send } from 'lucide-react';
import { supabase } from '@/api/supabaseClient';

const LuxuryVillaLeadForm = () => {
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();
    const [formData, setFormData] = useState({
        name: '',
        contact: '',
        dates: '',
        guests: '',
        budget: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSelectChange = (name, value) => {
        setFormData({ ...formData, [name]: value });
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        // 1. GTM Event Trigger
        if (window.dataLayer) {
            window.dataLayer.push({
                event: 'generate_lead',
                category: 'real_estate',
                value: 50000 // Estimated potential value
            });
        }

        try {
            // 2. Save to Supabase 'crm_leads'
            const { error } = await supabase.from('crm_leads').insert({
                first_name: formData.name,
                email: formData.contact,
                business_type: 'Villa Rental Inquiry',
                notes: JSON.stringify({
                    dates: formData.dates,
                    guests: formData.guests,
                    budget: formData.budget
                }),
                status: 'new'
            });

            if (error) throw error;

            toast({
                title: "Request Received",
                description: "Our concierge will contact you privately within 1 hour.",
                className: "bg-midnight-900 text-banana-400 border-banana-600 font-serif"
            });

            // Reset
            setFormData({ name: '', contact: '', dates: '', guests: '', budget: '' });

        } catch (error) {
            console.error(error);
            toast({
                variant: 'destructive',
                title: "Error",
                description: "Could not send request."
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
                <Label htmlFor="name" className="text-slate-300">Full Name</Label>
                <Input
                    id="name"
                    name="name"
                    placeholder="e.g. Alexander Hamilton"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:border-banana-500/50"
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="contact" className="text-slate-300">WhatsApp / Email</Label>
                <Input
                    id="contact"
                    name="contact"
                    placeholder="Private contact method"
                    required
                    value={formData.contact}
                    onChange={handleChange}
                    className="bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:border-banana-500/50"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="guests" className="text-slate-300">Guests</Label>
                    <Input
                        id="guests"
                        name="guests"
                        placeholder="4 Adults, 2 Kids"
                        required
                        value={formData.guests}
                        onChange={handleChange}
                        className="bg-white/5 border-white/10 text-white focus:border-banana-500/50"
                    />
                </div>
                <div className="space-y-2">
                    <Label className="text-slate-300">Target Budget</Label>
                    <Select onValueChange={(val) => handleSelectChange('budget', val)}>
                        <SelectTrigger className="bg-white/5 border-white/10 text-white focus:ring-banana-500/50">
                            <SelectValue placeholder="Per Night" />
                        </SelectTrigger>
                        <SelectContent className="bg-midnight-950 border-white/10 text-white">
                            <SelectItem value="$500 - $1000">$500 - $1,000</SelectItem>
                            <SelectItem value="$1000 - $3000">$1,000 - $3,000</SelectItem>
                            <SelectItem value="$3000+">$3,000+</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="dates" className="text-slate-300">Travel Dates</Label>
                <Input
                    id="dates"
                    name="dates"
                    placeholder="e.g. Jan 25 - Feb 10"
                    value={formData.dates}
                    onChange={handleChange}
                    className="bg-white/5 border-white/10 text-white focus:border-banana-500/50"
                />
            </div>

            <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-banana-600 to-banana-700 hover:from-banana-500 hover:to-banana-600 text-white font-serif tracking-wider py-6 text-lg shadow-lg shadow-banana-900/20 border border-white/5"
            >
                {loading ? <Loader2 className="animate-spin mr-2" /> : <Send className="mr-2 w-4 h-4" />}
                REQUEST ACCESS
            </Button>
            <p className="text-[10px] text-center text-slate-600 uppercase tracking-widest">
                Private • Off-Market • Encrypted
            </p>
        </form>
    );
};

export default LuxuryVillaLeadForm;
