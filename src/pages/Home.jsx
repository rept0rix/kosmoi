import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, ArrowRight, Hotel, Utensils, Car, Hammer, ShoppingBag, Sparkles, Briefcase } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import SEO from '@/components/SEO';
import Footer from '@/components/Footer';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import SubtleLocationIndicator from '@/components/SubtleLocationIndicator';

export default function Home() {
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();
    const isRTL = i18n.dir() === 'rtl';

    // Samui Background Image (High Quality Night Market / Street Vibe)
    // Source: Unsplash (Thailand Street)
    const BG_IMAGE = "https://images.unsplash.com/photo-1535189043414-47a3c49a0bed?q=80&w=2832&auto=format&fit=crop";

    const handleInteraction = () => {
        // Force redirect to App (which handles Auth)
        navigate('/app');
    };

    const categories = [
        { id: 'hotels', label: t('categories.hotels'), icon: Hotel, color: 'text-rose-400' },
        { id: 'food', label: t('categories.food'), icon: Utensils, color: 'text-orange-400' },
        { id: 'transport', label: t('categories.transport'), icon: Car, color: 'text-blue-400' },
        { id: 'pro', label: t('categories.pro'), icon: Hammer, color: 'text-yellow-400' },
        { id: 'secondhand', label: t('categories.secondhand'), icon: ShoppingBag, color: 'text-green-400' },
        { id: 'ai', label: t('categories.ai'), icon: Sparkles, color: 'text-purple-400' },
    ];

    return (
        <div className="min-h-screen relative font-sans text-white">
            <SEO
                title={t('home.seo_title')}
                description={t('home.seo_desc')}
            />
            {/* Background Image with Overlay */}
            <div className="absolute inset-0 z-0">
                <img
                    src={BG_IMAGE}
                    alt="Samui Background"
                    className="w-full h-full object-cover"
                />
                {/* Dark Gradient Overlay for readability */}
                <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-[2px]"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/50"></div>
            </div>

            {/* Header / Logo */}
            <nav className="absolute top-0 left-0 right-0 z-50 p-6 flex justify-between items-center">
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
                    <img
                        src="/kosmoi_logo_white.svg"
                        alt="Kosmoi Logo"
                        className="h-10 w-auto object-contain"
                        onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = "/kosmoi-logo.png"; // Fallback
                        }}
                    />
                    {/* <span className="text-2xl font-bold tracking-tight text-white">Kosmoi</span> */}
                </div>

                <div className="flex items-center gap-4">
                    <LanguageSwitcher />
                    {/* Optional: Login button for direct access if needed */}
                    <Button
                        variant="ghost"
                        className="text-white hover:bg-white/10"
                        onClick={() => navigate('/login')}
                    >
                        {t('profile.login_register')}
                    </Button>
                </div>
            </nav>

            {/* Main Content */}
            <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-12">

                {/* Hero Headings */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="text-center space-y-6 max-w-4xl mx-auto"
                >
                    <div className="flex flex-col items-center gap-4">
                        {/* Digital Nomad Button */}
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-md text-sm font-medium text-slate-200 cursor-pointer hover:bg-white/20 transition-colors">
                            <Briefcase className="w-4 h-4 text-emerald-400" />
                            <span>{t('home.digital_nomad')}</span>
                        </div>

                        {/* Intelligent Guide Pill (Optional: keep or remove? User mentioned Digital Nomad button... let's keep both stacked or replace? I'll Keep Nomad as requested "above") */}
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/20 text-xs font-medium text-slate-300">
                            <MapPin className="w-3 h-3 text-rose-500" />
                            <span>{t('home.city_guide')}</span>
                        </div>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-tight">
                        {t('home.hero_title')} <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                            {t('home.hero_title_suffix')}
                        </span>
                    </h1>

                    <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto">
                        {t('home.hero_subtitle')}
                    </p>
                </motion.div>

                {/* Input Field (Fake Input that redirects) */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3, duration: 0.6 }}
                    className="w-full max-w-2xl mt-12 flex flex-col items-center gap-3"
                >
                    <div
                        onClick={handleInteraction}
                        className="w-full group relative flex items-center gap-4 bg-white/10 hover:bg-white/15 border border-white/20 hover:border-white/30 backdrop-blur-xl rounded-2xl p-4 cursor-pointer transition-all shadow-2xl hover:shadow-blue-500/20"
                    >
                        <Search className="w-6 h-6 text-slate-400 group-hover:text-white transition-colors" />
                        <div className="flex-1 text-left">
                            <span className="text-xl text-slate-400 font-light group-hover:text-slate-200">
                                {t('home.search_placeholder')}
                            </span>
                        </div>
                        <div className="p-2 bg-blue-600 rounded-xl text-white shadow-lg">
                            <ArrowRight className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
                        </div>
                    </div>

                    {/* Subtle Location Indicator */}
                    <SubtleLocationIndicator className="mt-2" />
                </motion.div>

                {/* Categories Grid */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6, duration: 0.6 }}
                    className="flex flex-wrap justify-center gap-4 mt-12 w-full max-w-6xl"
                >
                    {categories.map((cat, idx) => (
                        <button
                            key={cat.id}
                            onClick={() => {
                                if (cat.id === 'ai') {
                                    navigate('/marketplace');
                                } else {
                                    handleInteraction();
                                }
                            }}
                            className="flex flex-col items-center justify-center w-[140px] h-[100px] p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/30 backdrop-blur-sm transition-all group hover:-translate-y-1"
                        >
                            <cat.icon className={`w - 6 h - 6 mb - 2 ${cat.color} opacity - 80 group - hover: opacity - 100 group - hover: scale - 110 transition - all`} />
                            <span className="text-sm font-medium text-slate-300 group-hover:text-white text-center leading-tight px-1">{cat.label}</span>
                        </button>
                    ))}
                </motion.div>

                {/* Business CTA - Bottom */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1, duration: 1 }}
                    className="absolute bottom-8 text-center"
                >
                    <p className="text-slate-400 text-sm mb-3">
                        {t('home.business_cta')}
                    </p>
                    <Button
                        variant="outline"
                        onClick={() => navigate('/business')}
                        className="rounded-full border-white/20 bg-white/5 hover:bg-white/10 text-white backdrop-blur-sm px-6"
                    >
                        <Briefcase className="w-4 h-4 mr-2" />
                        {t('home.join_city_os')}
                    </Button>
                </motion.div>

            </div>
            <Footer />
        </div>
    );
}
