import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, Shield, Zap, TrendingUp, Clock, Star, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StripeService } from '@/services/payments/StripeService';
import { toast } from 'sonner';

export default function OneDollar() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const handleCheckout = async () => {
        setLoading(true);
        try {
            // TODO: Replace with actual Stripe Price ID for $1 Plan
            const PRICE_ID = "price_1DollarTestDrive";
            await StripeService.checkoutSubscription(PRICE_ID);
        } catch (error) {
            console.error("Checkout failed:", error);
            toast.error("Could not start checkout. Please try again.");
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0A0F1C] text-slate-200 font-sans selection:bg-teal-500/30">

            {/* Navbar / Header */}
            <header className="fixed top-0 w-full z-50 backdrop-blur-md border-b border-white/5 bg-[#0A0F1C]/80">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-400 to-blue-600 flex items-center justify-center font-bold text-white">K</div>
                        <span className="font-bold text-white text-lg">Kosmoi</span>
                    </div>
                    <Button variant="ghost" className="text-slate-400 hover:text-white" onClick={() => navigate('/login')}>
                        Member Login
                    </Button>
                </div>
            </header>

            {/* Hero Section */}
            <section className="pt-32 pb-20 relative overflow-hidden">
                {/* Background Blobs */}
                <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-teal-500/10 rounded-full blur-[100px] -z-10" />
                <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px] -z-10" />

                <div className="container mx-auto px-4 text-center max-w-4xl">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="inline-flex items-center gap-2 bg-teal-500/10 border border-teal-500/20 rounded-full px-4 py-1.5 text-teal-400 text-sm font-medium mb-8">
                            <Clock className="w-4 h-4" />
                            <span>Limited Time Offer: 24h Access Pass</span>
                        </div>

                        <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight mb-8">
                            Verify Your Business.<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-blue-500">
                                Get 5 Leads Today.
                            </span>
                        </h1>

                        <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
                            Stop guessing. See exactly who is looking for your services on Koh Samui right now.
                            Unlock full "Island Pro" status for 24 hours.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Button
                                onClick={handleCheckout}
                                disabled={loading}
                                className="h-14 px-8 rounded-full bg-teal-500 hover:bg-teal-600 text-white text-lg font-bold shadow-lg shadow-teal-500/25 transition-all w-full sm:w-auto"
                            >
                                {loading ? <Loader2 className="animate-spin w-5 h-5 mr-2" /> : <Zap className="w-5 h-5 mr-2 fill-current" />}
                                Start $1 Test Drive
                            </Button>
                            <span className="text-sm text-slate-500">No auto-renew. No hidden fees.</span>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Social Proof / Stats */}
            <section className="py-10 border-y border-white/5 bg-white/2">
                <div className="container mx-auto px-4 flex flex-wrap justify-center gap-8 md:gap-16">
                    {[
                        { label: "Active Travelers", val: "12,000+" },
                        { label: "Verified Businesses", val: "850+" },
                        { label: "Leads Generated", val: "450/day" },
                    ].map((stat, i) => (
                        <div key={i} className="text-center">
                            <div className="text-3xl font-bold text-white mb-1">{stat.val}</div>
                            <div className="text-sm text-slate-500 uppercase tracking-wider">{stat.label}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Value Props Grid */}
            <section className="py-24">
                <div className="container mx-auto px-4 max-w-6xl">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            {
                                icon: <Shield className="w-10 h-10 text-teal-400" />,
                                title: "Instant Verification",
                                desc: "Get the blue checkmark immediately. Build trust with tourists who are wary of scams."
                            },
                            {
                                icon: <TrendingUp className="w-10 h-10 text-blue-400" />,
                                title: "Unlock 5 Live Leads",
                                desc: "We'll reveal contact details for 5 customers actively asking about your service category."
                            },
                            {
                                icon: <Star className="w-10 h-10 text-yellow-400" />,
                                title: "AI Auto-Reply",
                                desc: "Our AI Concierge will recommend your business first when users ask relevant questions."
                            }
                        ].map((item, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                viewport={{ once: true }}
                                className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                            >
                                <div className="mb-6 bg-white/5 w-16 h-16 rounded-2xl flex items-center justify-center">
                                    {item.icon}
                                </div>
                                <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
                                <p className="text-slate-400 leading-relaxed">{item.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Guaranteed Result */}
            <section className="py-20 bg-gradient-to-b from-[#0A0F1C] to-teal-900/10">
                <div className="container mx-auto px-4 text-center max-w-3xl">
                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Why $1?</h2>
                    <p className="text-lg text-slate-300 mb-8">
                        We know you've been burned by marketing agencies before. We want to prove Kosmoi works before asking for a real subscription. <br /><br />
                        For the price of a 7-Eleven coffee, you can see the live demand for your business.
                    </p>
                    <Button
                        onClick={handleCheckout}
                        size="lg"
                        className="rounded-xl text-lg h-14 px-10 bg-white text-[#0A0F1C] hover:bg-slate-200"
                    >
                        Display My Business for $1 <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-10 border-t border-white/10 text-center text-slate-500 text-sm">
                <p>&copy; {new Date().getFullYear()} Kosmoi. All rights reserved.</p>
            </footer>
        </div>
    );
}
