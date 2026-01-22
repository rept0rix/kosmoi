import React from 'react';
import { motion } from 'framer-motion';
import { Anchor, ShieldCheck, Sun, Users, Star, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import BoatRentalLeadForm from '@/components/forms/BoatRentalLeadForm'; // Ensure this is imported correctly
import SEO from '@/components/SEO';

const LandingPage_BoatRentals = () => {
    // Assets (Placeholders for now, normally we'd generated them)
    // Using a reliable Unsplash image for boats
    const HERO_BG = "https://images.unsplash.com/photo-1540206395-688085723adb?q=80&w=2788&auto=format&fit=crop";

    return (
        <div className="min-h-screen bg-midnight-950 font-sans text-white overflow-hidden">
            <SEO
                title="Rent Private Boats in Koh Samui - Best Price Guarantee | Kosmoi"
                description="Book private speedboats, catamarans, and luxury yachts directly from owners. No hidden hotel fees. Verified captains."
            />

            {/* --- Hero Section --- */}
            <div className="relative h-[85vh] flex items-center justify-center px-4">
                {/* Background Image */}
                <div className="absolute inset-0 z-0">
                    <img src={HERO_BG} alt="Boat Charter Samui" className="w-full h-full object-cover opacity-60" />
                    <div className="absolute inset-0 bg-gradient-to-t from-midnight-950 via-midnight-950/40 to-black/30"></div>
                </div>

                <div className="relative z-10 w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mt-16">
                    {/* Left: Copy */}
                    <div className="space-y-6 text-center lg:text-left">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-banana-500/20 border border-banana-500/30 text-banana-300 text-sm font-bold backdrop-blur-md">
                            <Star className="w-3 h-3 fill-banana-300" />
                            <span>#1 Rated Boat Booking Platform</span>
                        </div>
                        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight font-heading">
                            The Samui You <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Can't See From The Road.</span>
                        </h1>
                        <p className="text-xl text-slate-200 max-w-xl mx-auto lg:mx-0">
                            Private islands, hidden lagoons, and sunset champagne.
                            Book direct with captains and save up to <span className="text-banana-400 font-bold">30%</span> vs hotel prices.
                        </p>

                        <div className="flex flex-wrap gap-4 justify-center lg:justify-start pt-4">
                            <div className="flex items-center gap-2 text-sm text-slate-300">
                                <ShieldCheck className="w-5 h-5 text-green-400" />
                                Verified Captains
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-300">
                                <Sun className="w-5 h-5 text-banana-400" />
                                Best Price Guarantee
                            </div>
                        </div>
                    </div>

                    {/* Right: Lead Form (Floating Glass Card) */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="glass-card-premium p-6 md:p-8 rounded-3xl relative"
                    >
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-banana-500/20 rounded-full blur-3xl pointer-events-none"></div>
                        <h3 className="text-2xl font-bold mb-2">Check Availability</h3>
                        <p className="text-slate-400 text-sm mb-6">See which boats are free for your dates.</p>
                        <BoatRentalLeadForm />
                    </motion.div>
                </div>
            </div>

            {/* --- Fleet Section --- */}
            <div className="py-24 px-4 container mx-auto bg-midnight-950 relative z-20">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold font-heading mb-4">Choose Your Vessel</h2>
                    <p className="text-slate-400">From budget longtails to luxury catamarans.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Card 1: Longtail */}
                    <div className="glass-card-premium overflow-hidden rounded-3xl group cursor-pointer hover:border-banana-500/30 transition-all">
                        <div className="h-64 overflow-hidden relative">
                            <img src="https://images.unsplash.com/photo-1590523277543-a94d2e4eb00b?q=80&w=2832&auto=format&fit=crop" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="Longtail" />
                            <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold border border-white/10">
                                Authentic
                            </div>
                        </div>
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="text-xl font-bold">Classic Longtail</h3>
                                <span className="text-banana-400 font-bold">฿3,500</span>
                            </div>
                            <p className="text-slate-400 text-sm mb-4">Perfect for Pig Island trips and snorkeling. The true Thai experience.</p>
                            <div className="flex items-center gap-4 text-xs text-slate-500 mb-6">
                                <span className="flex items-center gap-1"><Users className="w-3 h-3" /> Up to 6</span>
                                <span className="flex items-center gap-1"><Anchor className="w-3 h-3" /> 4 Hours</span>
                            </div>
                            <Button variant="outline" className="w-full border-white/10 hover:bg-white/5">Details</Button>
                        </div>
                    </div>

                    {/* Card 2: Private Speedboat */}
                    <div className="glass-card-premium overflow-hidden rounded-3xl group cursor-pointer border-banana-500/40 shadow-gold-glow relative">
                        <div className="absolute top-0 right-0 bg-banana-500 text-black text-[10px] font-bold px-3 py-1 rounded-bl-xl z-20">MOST POPULAR</div>
                        <div className="h-64 overflow-hidden relative">
                            <img src="https://images.unsplash.com/photo-1563296291-14f26f616585?q=80&w=2753&auto=format&fit=crop" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="Speedboat" />
                        </div>
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="text-xl font-bold text-banana-100">VIP Speedboat</h3>
                                <span className="text-banana-400 font-bold">฿12,000</span>
                            </div>
                            <p className="text-slate-400 text-sm mb-4">Fast, private, and comfortable. Visit Ang Thong Marine Park in style.</p>
                            <div className="flex items-center gap-4 text-xs text-slate-500 mb-6">
                                <span className="flex items-center gap-1"><Users className="w-3 h-3" /> Up to 15</span>
                                <span className="flex items-center gap-1"><Anchor className="w-3 h-3" /> Full Day</span>
                            </div>
                            <Button className="w-full bg-banana-500 text-black hover:bg-banana-400 font-bold">Details</Button>
                        </div>
                    </div>

                    {/* Card 3: Catamaran */}
                    <div className="glass-card-premium overflow-hidden rounded-3xl group cursor-pointer hover:border-purple-500/30 transition-all">
                        <div className="h-64 overflow-hidden relative">
                            <img src="https://images.unsplash.com/photo-1569263979104-865ab7cd8d13?q=80&w=2874&auto=format&fit=crop" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="Catamaran" />
                        </div>
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="text-xl font-bold">Luxury Catamaran</h3>
                                <span className="text-purple-400 font-bold">฿25,500</span>
                            </div>
                            <p className="text-slate-400 text-sm mb-4">Stable sailing, nets for lounging, and sunset dinner options.</p>
                            <div className="flex items-center gap-4 text-xs text-slate-500 mb-6">
                                <span className="flex items-center gap-1"><Users className="w-3 h-3" /> Up to 30</span>
                                <span className="flex items-center gap-1"><Anchor className="w-3 h-3" /> Sunset / Day</span>
                            </div>
                            <Button variant="outline" className="w-full border-white/10 hover:bg-white/5">Details</Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- Social Proof --- */}
            <div className="py-20 bg-midnight-900/50">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-3xl font-bold mb-12">Trusted by 5,000+ Travelers</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            { quote: "Cheaper than the hotel and the captain was amazing.", author: "James, UK" },
                            { quote: "Highlight of our honeymoon. The sunset was unreal.", author: "Sarah, Australia" },
                            { quote: "Easy booking and instant confirmation. Highly recommend.", author: "Marc, France" }
                        ].map((item, i) => (
                            <div key={i} className="glass-card p-6 rounded-2xl">
                                <div className="flex justify-center mb-4">
                                    {[1, 2, 3, 4, 5].map(s => <Star key={s} className="w-4 h-4 text-banana-400 fill-banana-400" />)}
                                </div>
                                <p className="text-slate-300 italic mb-4">"{item.quote}"</p>
                                <p className="font-bold text-slate-500 text-sm">- {item.author}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* --- Footer CTA --- */}
            <div className="py-24 text-center relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />
                <h2 className="text-4xl font-bold mb-6 relative z-10">Don't Miss the Boat.</h2>
                <p className="text-slate-400 mb-8 max-w-md mx-auto relative z-10">Availability for next week is running low. Secure your spot now with just a deposit.</p>
                <Button className="relative z-10 px-8 py-6 text-lg rounded-full bg-white text-midnight-950 hover:scale-105 transition-transform font-bold">
                    Browse All Boats <ArrowRight className="ml-2" />
                </Button>
            </div>
        </div>
    );
};

export default LandingPage_BoatRentals;
