
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '@/api/supabaseClient';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { GlassCard, GlassPanel, GlassButton } from '@/components/ui/glass-kit';
import { MapPin, Star, Phone, Mail, Calendar, ArrowLeft, Share2, Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import BookingDialog from '@/components/BookingDialog';

export default function ProviderProfile() {
    const { providerId } = useParams();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [provider, setProvider] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isBookingOpen, setIsBookingOpen] = useState(false);

    useEffect(() => {
        loadProvider();
    }, [providerId]);

    const loadProvider = async () => {
        setLoading(true);
        // Supabase filter usually returns array
        const { data, error } = await db.entities.ServiceProvider.filter({ id: providerId });
        if (data && data.length > 0) {
            setProvider(data[0]);
        } else {
            console.error("Provider not found", error);
        }
        setLoading(false);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
                <div className="animate-pulse flex flex-col items-center">
                    <div className="h-12 w-12 bg-slate-200 rounded-full mb-4"></div>
                    <div className="h-4 w-32 bg-slate-200 rounded"></div>
                </div>
            </div>
        );
    }

    if (!provider) {
        return (
            <div className="min-h-screen flex items-center justify-center flex-col gap-4">
                <h2 className="text-2xl font-bold text-slate-400">Provider Not Found</h2>
                <Button onClick={() => navigate(-1)} variant="outline">Go Back</Button>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="min-h-screen pb-20 bg-slate-50 dark:bg-slate-950"
        >
            {/* Hero Section */}
            <div className="relative h-64 md:h-80 w-full overflow-hidden">
                <img
                    src={provider.logo_url || "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=1600&q=80"}
                    alt={provider.business_name}
                    className="w-full h-full object-cover blur-sm brightness-75 scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />

                <div className="absolute top-4 left-4 z-10">
                    <GlassButton onClick={() => navigate(-1)} size="icon" className="rounded-full">
                        <ArrowLeft className="w-5 h-5" />
                    </GlassButton>
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-6 text-white max-w-7xl mx-auto w-full">
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="flex items-end justify-between"
                    >
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="bg-blue-600/90 text-white px-2 py-0.5 rounded text-xs font-semibold backdrop-blur-sm">
                                    {provider.category || 'Service'}
                                </span>
                                {provider.badge === 'verified' && (
                                    <span className="bg-emerald-500/90 text-white px-2 py-0.5 rounded text-xs font-semibold backdrop-blur-sm flex items-center gap-1">
                                        <Star className="w-3 h-3 fill-current" /> Verified
                                    </span>
                                )}
                            </div>
                            <h1 className="text-3xl md:text-4xl font-bold mb-1 shadow-sm">{provider.business_name}</h1>
                            <div className="flex items-center text-slate-200 text-sm gap-4">
                                <span className="flex items-center gap-1">
                                    <MapPin className="w-4 h-4" /> {provider.location || 'Samui, Thailand'}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Star className="w-4 h-4 text-yellow-400 fill-current" /> 4.8 (120 reviews)
                                </span>
                            </div>
                        </div>

                        <div className="hidden md:flex gap-2">
                            <GlassButton size="icon" className="rounded-full bg-white/10 hover:bg-white/20">
                                <Share2 className="w-5 h-5 text-white" />
                            </GlassButton>
                            <GlassButton size="icon" className="rounded-full bg-white/10 hover:bg-white/20">
                                <Heart className="w-5 h-5 text-white" />
                            </GlassButton>
                        </div>
                    </motion.div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-3 gap-8">

                {/* Left Column: Details */}
                <div className="md:col-span-2 space-y-6">
                    <GlassCard className="p-6 bg-white dark:bg-slate-900 border-0 shadow-sm">
                        <h2 className="text-xl font-semibold mb-4 text-slate-800 dark:text-slate-100">{t('provider.about') || 'About'}</h2>
                        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                            {provider.description || "Experience the best service in Koh Samui. We are dedicated to providing top-quality experiences for all our guests. Contact us for more details and specific arrangements."}
                        </p>

                        <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-4">
                            <div className="flex flex-col gap-1 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                <span className="text-xs text-slate-400 uppercase font-medium">Contact</span>
                                <div className="flex items-center gap-2 text-sm font-medium">
                                    <Phone className="w-4 h-4 text-blue-500" /> {provider.phone_number || 'N/A'}
                                </div>
                            </div>
                            <div className="flex flex-col gap-1 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                <span className="text-xs text-slate-400 uppercase font-medium">Email</span>
                                <div className="flex items-center gap-2 text-sm font-medium">
                                    <Mail className="w-4 h-4 text-blue-500" /> {provider.email || 'N/A'}
                                </div>
                            </div>
                        </div>
                    </GlassCard>

                    <GlassCard className="p-6 bg-white dark:bg-slate-900 border-0 shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">{t('provider.reviews') || 'Reviews'}</h2>
                            <Button variant="ghost" className="text-blue-600">See All</Button>
                        </div>

                        {/* Mock Reviews */}
                        <div className="space-y-4">
                            {[1, 2].map((i) => (
                                <div key={i} className="flex gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                                    <Avatar>
                                        <AvatarImage src={`https://i.pravatar.cc/150?u=${i}`} />
                                        <AvatarFallback>U{i}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-semibold text-sm">Happy Customer</span>
                                            <div className="flex text-yellow-400">
                                                {[...Array(5)].map((_, j) => <Star key={j} className="w-3 h-3 fill-current" />)}
                                            </div>
                                        </div>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">
                                            "Absolutely amazing service! Would definitely recommend to anyone visiting Samui."
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </GlassCard>
                </div>

                {/* Right Column: Sticky Booking & Map */}
                <div className="md:col-span-1 space-y-6">
                    <div className="sticky top-24 space-y-6">
                        <GlassCard className="p-6 border-blue-100 dark:border-blue-900/30 bg-blue-50/50 dark:bg-blue-900/10">
                            <h3 className="text-lg font-semibold mb-2">Book Your Slot</h3>
                            <p className="text-sm text-slate-500 mb-6">
                                Instant confirmation. No booking fees.
                            </p>
                            <Button onClick={() => setIsBookingOpen(true)} className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-lg font-medium shadow-lg shadow-blue-500/20">
                                Book Now
                            </Button>
                            <p className="text-xs text-center text-slate-400 mt-4">
                                You won't be charged yet.
                            </p>
                        </GlassCard>

                        <div className="h-64 rounded-xl overflow-hidden shadow-lg border border-slate-200 dark:border-slate-800 relative bg-slate-100">
                            {/* Placeholder Map - In real app, integrate Leaflet/Google Maps */}
                            <div className="absolute inset-0 flex items-center justify-center text-slate-400 bg-slate-100 dark:bg-slate-800">
                                <div className="text-center">
                                    <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                    <span className="text-sm">Map View Placeholder</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <BookingDialog
                open={isBookingOpen}
                onOpenChange={setIsBookingOpen}
                provider={provider}
            />
        </motion.div>
    );
}
