import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Send } from 'lucide-react';
import { supabase } from '@/api/supabaseClient';

const BoatRentalLeadForm = () => {
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();
    const [formData, setFormData] = useState({
        name: '',
        contact: '', // Email or WhatsApp
        date: '',
        guests: 2
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        // 1. GTM Event Trigger
        if (window.dataLayer) {
            window.dataLayer.push({
                event: 'generate_lead',
                category: 'boat_rental',
                value: 3500 // Estimated average value per lead (THB)
            });
        } else {
            console.warn("GTM: dataLayer not found");
        }

        try {
            // 2. Save to Supabase 'crm_leads'
            const { error } = await supabase.from('crm_leads').insert({
                first_name: formData.name, // Mapping name to first_name
                email: formData.contact,   // Assuming contact is email/phone
                business_type: 'Boat Rental Request', // Use as category
                notes: JSON.stringify({ date: formData.date, guests: formData.guests }), // Store extra details in notes
                status: 'new'
            });

            if (error) throw error;

            toast({
                title: "Request Sent! 🚤",
                description: "A captain will contact you shortly with availability.",
                className: "bg-banana-500 text-midnight-950 border-banana-600 font-bold"
            });

            // Reset
            setFormData({ name: '', contact: '', date: '', guests: 2 });

        } catch (error) {
            console.error(error);
            toast({
                variant: 'destructive',
                title: "Error",
                description: "Could not send request. Please try again."
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="name" className="text-white">Your Name</Label>
                <Input
                    id="name"
                    name="name"
                    placeholder="Captain Jack"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="contact" className="text-white">WhatsApp / Email</Label>
                <Input
                    id="contact"
                    name="contact"
                    placeholder="+66..."
                    required
                    value={formData.contact}
                    onChange={handleChange}
                    className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="date" className="text-white">When?</Label>
                    <Input
                        id="date"
                        name="date"
                        type="date"
                        required
                        value={formData.date}
                        onChange={handleChange}
                        className="bg-white/10 border-white/20 text-white"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="guests" className="text-white">Guests</Label>
                    <Input
                        id="guests"
                        name="guests"
                        type="number"
                        min="1"
                        max="20"
                        required
                        value={formData.guests}
                        onChange={handleChange}
                        className="bg-white/10 border-white/20 text-white"
                    />
                </div>
            </div>

            <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-banana-500 to-banana-600 hover:from-banana-400 hover:to-banana-500 text-midnight-950 font-bold py-6 text-lg shadow-lg shadow-banana-500/20"
            >
                {loading ? <Loader2 className="animate-spin mr-2" /> : <Send className="mr-2 w-5 h-5" />}
                Check Availability
            </Button>
            <p className="text-xs text-center text-slate-500">
                Direct booking. No hidden fees.
            </p>
        </form>
    );
};

export default BoatRentalLeadForm;
