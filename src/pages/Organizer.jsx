import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Calendar,
    MapPin,
    Phone,
    Mail,
    MessageCircle,
    Luggage,
    Sparkles,
    Plane,
    CreditCard,
    AlertTriangle,
    Ghost
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';

export default function Organizer() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [destination, setDestination] = useState('');
    const [dates, setDates] = useState({ start: '', end: '' });
    const [selectedInterests, setSelectedInterests] = useState([]);

    const interests = ["Beaches", "Nightlife", "Culture", "Food", "Adventure", "Relaxation"];

    const toggleInterest = (interest) => {
        setSelectedInterests(prev =>
            prev.includes(interest)
                ? prev.filter(i => i !== interest)
                : [...prev, interest]
        );
    };

    const handleGenerateItinerary = () => {
        // In a real app, this would send data to the backend or AI service.
        // For now, we'll navigate to the TripPlanner or AIChat with state.
        navigate('/AIChat', {
            state: {
                context: `Plan a trip to ${destination || 'Koh Samui'} from ${dates.start} to ${dates.end}. Interests: ${selectedInterests.join(', ')}.`
            }
        });
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8 font-sans animate-in fade-in duration-500 pb-24">
            <h1 className="text-3xl font-bold font-['Outfit'] mb-6 text-slate-900 dark:text-white">{t('organizer.title')}</h1>

            <div className="space-y-8 max-w-2xl mx-auto">
                {/* Hero Section */}
                <Card className="border-0 shadow-xl overflow-hidden rounded-3xl">
                    <div className="h-56 bg-gradient-to-r from-blue-600 to-indigo-600 relative flex items-center justify-center overflow-hidden">
                        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1537905569824-f89f14cceb68?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center opacity-40 mix-blend-overlay"></div>
                        <div className="relative z-10 text-center text-white p-6">
                            <h2 className="text-4xl font-bold mb-3">{t('organizer.hero_title')}</h2>
                            <p className="text-blue-100 text-lg">{t('organizer.hero_subtitle')}</p>
                        </div>
                    </div>
                    <CardContent className="p-8 space-y-8 bg-white dark:bg-slate-900">
                        {/* Destination */}
                        <div className="space-y-3">
                            <label className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-blue-500" />
                                {t('organizer.destination_label')}
                            </label>
                            <Input
                                className="h-14 pl-4 text-lg bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 ring-blue-500/20"
                                placeholder={t('organizer.destination_placeholder')}
                                value={destination}
                                onChange={(e) => setDestination(e.target.value)}
                            />
                        </div>

                        {/* Dates */}
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <label className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                                    <Calendar className="w-5 h-5 text-blue-500" />
                                    {t('organizer.start_date')}
                                </label>
                                <Input
                                    type="date"
                                    className="h-14 text-base bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl"
                                    value={dates.start}
                                    onChange={(e) => setDates({ ...dates, start: e.target.value })}
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-base font-semibold text-slate-900 dark:text-white">{t('organizer.end_date')}</label>
                                <Input
                                    type="date"
                                    className="h-14 text-base bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl"
                                    value={dates.end}
                                    onChange={(e) => setDates({ ...dates, end: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Interests */}
                        <div className="space-y-4">
                            <label className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-blue-500" />
                                {t('organizer.interests_label')}
                            </label>
                            <p className="text-sm text-slate-500 dark:text-slate-400 -mt-2">
                                {t('organizer.interests_subtitle')}
                            </p>
                            <div className="flex flex-wrap gap-3">
                                {interests.map(interest => (
                                    <Badge
                                        key={interest}
                                        variant={selectedInterests.includes(interest) ? "default" : "outline"}
                                        className={`h-10 px-5 text-sm cursor-pointer transition-all rounded-full ${selectedInterests.includes(interest)
                                            ? 'bg-blue-600 hover:bg-blue-700 border-blue-600 shadow-md shadow-blue-500/20'
                                            : 'border-slate-200 dark:border-slate-700 hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-slate-800'
                                            }`}
                                        onClick={() => toggleInterest(interest)}
                                    >
                                        {interest}
                                    </Badge>
                                ))}
                            </div>
                        </div>

                        <Button
                            className="w-full h-16 text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-xl shadow-blue-500/30 rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98]"
                            onClick={handleGenerateItinerary}
                        >
                            <Sparkles className="w-6 h-6 mr-3 animate-pulse" />
                            {t('organizer.generate_btn')}
                        </Button>
                    </CardContent>
                </Card>

                {/* My Saved Trips (Placeholder) */}
                <div className="space-y-4 pt-4">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Luggage className="w-5 h-5" /> {t('organizer.saved_trips_title')}
                    </h3>
                    <div className="grid gap-4">
                        {/* Empty State / Placeholder */}
                        <div className="p-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center text-center text-slate-400">
                            <Ghost className="w-8 h-8 mb-2 opacity-50" />
                            <p>{t('organizer.no_saved_trips')}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
