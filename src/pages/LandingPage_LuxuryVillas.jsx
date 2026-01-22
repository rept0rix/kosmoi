import React from 'react';
import { motion } from 'framer-motion';
import { Star, Shield, Lock, Wifi, Coffee, Gem } from 'lucide-react';
import { Button } from '@/components/ui/button';
import LuxuryVillaLeadForm from '@/components/forms/LuxuryVillaLeadForm';
import SEO from '@/components/SEO';

const LandingPage_LuxuryVillas = () => {
    // Unsplash asset for luxury villa
    const HERO_BG = "https://images.unsplash.com/photo-1613490493576-7fde63acd811?q=80&w=2671&auto=format&fit=crop";

    return (
        <div className="min-h-screen bg-midnight-950 font-sans text-white overflow-x-hidden selection:bg-banana-500/30 selection:text-banana-100">
            <SEO
                title="Private Luxury Villas Koh Samui | The Kosmoi Collection"
                description="Exclusive 5-bedroom+ estates with private staff, chefs, and infinity pools. Off-market listings for high-net-worth individuals."
            />

            {/* --- Hero Section --- */}
            <div className="relative h-[90vh] flex items-center justify-center px-4">
                {/* Immersive Background */}
                <div className="absolute inset-0 z-0">
                    <img src={HERO_BG} alt="Luxury Villa Samui" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-midnight-950 via-midnight-950/60 to-black/40"></div>
                </div>

                <div className="relative z-10 w-full max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-16 items-center mt-20">
                    {/* Left: Copy */}
                    <div className="lg:col-span-7 space-y-8 text-center lg:text-left">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="inline-flex items-center gap-3 px-4 py-2 rounded-full border border-white/10 bg-black/20 backdrop-blur-md"
                        >
                            <Gem className="w-4 h-4 text-banana-400" />
                            <span className="text-sm font-serif tracking-widest text-slate-200">THE PRIVATE COLLECTION</span>
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-5xl md:text-8xl font-serif text-white leading-[1.1]"
                        >
                            Silence is <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-banana-200 via-banana-400 to-banana-600">The New Luxury.</span>
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-xl text-slate-300 max-w-xl mx-auto lg:mx-0 font-light leading-relaxed"
                        >
                            Escape to Koh Samui's most exclusive hilltops.
                            Fully staffed estates with private chefs, infinity pools, and absolute privacy.
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="flex flex-wrap justify-center lg:justify-start gap-8 pt-4 text-sm font-medium text-slate-400 uppercase tracking-wider"
                        >
                            <span className="flex items-center gap-2"><Lock className="w-4 h-4" /> Off-Market</span>
                            <span className="flex items-center gap-2"><Shield className="w-4 h-4" /> Vetted</span>
                            <span className="flex items-center gap-2"><Star className="w-4 h-4" /> Concierge</span>
                        </motion.div>
                    </div>

                    {/* Right: Lead Form */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.6 }}
                        className="lg:col-span-5"
                    >
                        <div className="glass-card-premium p-8 rounded-none border-l-4 border-banana-500 relative bg-midnight-950/80 backdrop-blur-xl">
                            <h3 className="text-2xl font-serif mb-2 text-banana-100">Request Access</h3>
                            <p className="text-slate-400 text-sm mb-8 font-light">Tell us your requirements. We'll curate 3 options.</p>
                            <LuxuryVillaLeadForm />
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* --- The Lifestyle Section --- */}
            <div className="py-32 bg-midnight-950 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-banana-900/10 to-transparent pointer-events-none"></div>

                <div className="container mx-auto px-4">
                    <div className="flex flex-col md:flex-row items-end justify-between mb-20 gap-8">
                        <div className="max-w-2xl">
                            <h2 className="text-4xl md:text-6xl font-serif mb-6">Not just a villa.<br />A private sanctuary.</h2>
                            <p className="text-slate-400 text-lg font-light">
                                Forget checking in. Arrive to your favorite champagne on ice,
                                a chef prepping dinner, and your fiber-optic office ready to go.
                            </p>
                        </div>
                        <Button variant="outline" className="border-banana-500 text-banana-400 hover:bg-banana-500 hover:text-midnight-950 px-8 py-6 rounded-none uppercase tracking-widest font-bold transition-all">
                            View All Estates
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-1">
                        {[
                            { title: "The Sky Villa", price: "$1,200/night", img: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=2670&auto=format&fit=crop" },
                            { title: "Oceanfront Estate", price: "$2,500/night", img: "https://images.unsplash.com/photo-1600596542815-22b4899975d6?q=80&w=2675&auto=format&fit=crop" },
                            { title: "Jungle Sanctuary", price: "$850/night", img: "https://images.unsplash.com/photo-1580587771525-78b9dba3b91d?q=80&w=2574&auto=format&fit=crop" }
                        ].map((villa, idx) => (
                            <div key={idx} className="group relative h-[600px] overflow-hidden cursor-pointer">
                                <img src={villa.img} alt={villa.title} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105 saturate-50 group-hover:saturate-100" />
                                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors"></div>
                                <div className="absolute bottom-0 left-0 p-10 w-full bg-gradient-to-t from-black via-black/50 to-transparent">
                                    <h3 className="text-3xl font-serif text-white mb-2 translate-y-4 group-hover:translate-y-0 transition-transform duration-500">{villa.title}</h3>
                                    <p className="text-banana-400 font-mono text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">{villa.price}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* --- Features --- */}
            <div className="py-24 border-t border-white/5 bg-midnight-950">
                <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
                    <div className="space-y-4">
                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto text-banana-400">
                            <Wifi className="w-8 h-8" />
                        </div>
                        <h4 className="text-xl font-serif">Starlink / Fiber</h4>
                        <p className="text-slate-400 text-sm">Enterprise grade connectivity for seamless remote work.</p>
                    </div>
                    <div className="space-y-4">
                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto text-banana-400">
                            <Coffee className="w-8 h-8" />
                        </div>
                        <h4 className="text-xl font-serif">Private Chef</h4>
                        <p className="text-slate-400 text-sm">Breakfast, lunch, and dinner prepared to your dietary needs.</p>
                    </div>
                    <div className="space-y-4">
                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto text-banana-400">
                            <Shield className="w-8 h-8" />
                        </div>
                        <h4 className="text-xl font-serif">24/7 Concierge</h4>
                        <p className="text-slate-400 text-sm">Everything handled by your dedicated Kosmoi agent.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LandingPage_LuxuryVillas;
