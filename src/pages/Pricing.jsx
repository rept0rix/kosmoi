import React from 'react';
import { Check, CheckCircle, Smartphone, Building, Zap } from 'lucide-react';

/**
 * Pricing Page
 *
 * Displays pricing tiers (Trial, Starter, Growth) for business partners.
 * Clarifies that the platform is free for users.
 */
const Pricing = () => {
    return (
        <div className="min-h-screen bg-slate-50 py-20 font-sans">
            <div className="container mx-auto px-4">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h1 className="text-4xl font-extrabold mb-6 text-slate-900 tracking-tight">Simple, Transparent Pricing</h1>
                    <p className="text-xl text-slate-600">
                        Join the island's digital operating system. No hidden commissions.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
                    {/* Trial */}
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 flex flex-col hover:border-blue-200 transition-all">
                        <div className="mb-8">
                            <h3 className="text-lg font-bold text-slate-900 mb-2">2-Week Trial</h3>
                            <div className="flex items-baseline gap-1">
                                <span className="text-4xl font-extrabold text-slate-900">Free</span>
                            </div>
                            <p className="text-slate-500 mt-4">Experience the full power of Kosmoi with zero risk.</p>
                        </div>
                        <ul className="space-y-4 mb-8 flex-1">
                            {[
                                { t: "Full Platform Access", d: "Explore every feature without restrictions" },
                                { t: "AI Agent Setup", d: "We build your first AI agent for free" },
                                { t: "Unlimited Leads (Trial)", d: "See real customer requests in your area" },
                                { t: "No Credit Card Required", d: "Zero risk, just sign up and start" }
                            ].map((item, i) => (
                                <li key={i} className="flex flex-col gap-1">
                                    <div className="flex items-center gap-3 text-slate-900 font-medium text-sm">
                                        <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                                        {item.t}
                                    </div>
                                    <p className="text-xs text-slate-500 pl-8">{item.d}</p>
                                </li>
                            ))}
                        </ul>
                        <button className="w-full py-3 px-4 bg-slate-100 text-slate-900 rounded-xl font-bold hover:bg-slate-200 transition-colors">
                            Start Free Trial
                        </button>
                    </div>

                    {/* $1 Trial - New Option */}
                    <div className="bg-white p-8 rounded-2xl shadow-sm border-2 border-teal-500/50 flex flex-col hover:border-teal-500 transition-all relative overflow-hidden">
                        <div className="absolute top-0 right-0 bg-teal-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl">
                            LIMITED TIME
                        </div>
                        <div className="mb-8">
                            <h3 className="text-lg font-bold text-slate-900 mb-2">Test Drive</h3>
                            <div className="flex items-baseline gap-1">
                                <span className="text-4xl font-extrabold text-teal-600">฿35</span>
                                <span className="text-slate-400 text-sm">/ 24h</span>
                            </div>
                            <p className="text-slate-500 mt-4 text-sm">See exactly what Kosmoi can do for you. Live.</p>
                        </div>
                        <ul className="space-y-4 mb-8 flex-1">
                            {[
                                { t: "Instant Verified Status", d: "Get the blue checkmark for 24 hours" },
                                { t: "Unlock 5 Live Leads", d: "Get contact details for 5 real customers" },
                                { t: "Test AI Auto-Reply", d: "Watch our AI handle a simulated inquiry" },
                                { t: "Premium Dashboard", d: "Access advanced analytics for a day" }
                            ].map((item, i) => (
                                <li key={i} className="flex flex-col gap-1">
                                    <div className="flex items-center gap-3 text-slate-900 font-medium text-sm">
                                        <Check className="w-5 h-5 text-teal-500 flex-shrink-0" />
                                        {item.t}
                                    </div>
                                    <p className="text-xs text-slate-500 pl-8">{item.d}</p>
                                </li>
                            ))}
                        </ul>
                        <button className="w-full py-3 px-4 bg-teal-600 text-white rounded-xl font-bold hover:bg-teal-700 transition-colors shadow-lg shadow-teal-500/30">
                            Try for $1
                        </button>
                    </div>

                    {/* Starter Pack - Highlighted */}
                    <div className="bg-slate-900 p-8 rounded-2xl shadow-xl border border-slate-800 flex flex-col relative transform md:-translate-y-4">
                        <div className="absolute top-0 right-0 bg-yellow-500 text-slate-900 text-xs font-bold px-3 py-1 rounded-bl-xl rounded-tr-xl">
                            BEST VALUE
                        </div>
                        <div className="mb-8">
                            <h3 className="text-lg font-bold text-white mb-2">Starter Pack</h3>
                            <div className="flex items-baseline gap-1">
                                <span className="text-4xl font-extrabold text-white">฿3,500</span>
                                <span className="text-slate-400">/ 3mo</span>
                            </div>
                            <p className="text-slate-400 mt-4">Launch your business with maximum visibility.</p>
                        </div>
                        <ul className="space-y-4 mb-8 flex-1">
                            {[
                                { t: "Verified Business Badge", d: "Build instant trust with the blue checkmark" },
                                { t: "Priority Search Listing", d: "Appear at the top of local search results" },
                                { t: "24/7 AI Receptionist", d: "Never miss a booking, even while you sleep" },
                                { t: "WhatsApp Integration", d: "Direct line to customers on their favorite app" },
                                { t: "Monthly ROI Report", d: "See exactly how much money we made you" }
                            ].map((item, i) => (
                                <li key={i} className="flex flex-col gap-1">
                                    <div className="flex items-center gap-3 text-white font-medium text-sm">
                                        <CheckCircle className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                                        {item.t}
                                    </div>
                                    <p className="text-xs text-slate-400 pl-8">{item.d}</p>
                                </li>
                            ))}
                        </ul>
                        <button className="w-full py-3 px-4 bg-yellow-500 text-slate-900 rounded-xl font-bold hover:bg-yellow-400 transition-colors">
                            Get Verified
                        </button>
                    </div>

                    {/* Growth */}
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 flex flex-col hover:border-blue-200 transition-all">
                        <div className="mb-8">
                            <h3 className="text-lg font-bold text-slate-900 mb-2">Growth</h3>
                            <div className="flex items-baseline gap-1">
                                <span className="text-4xl font-extrabold text-slate-900">฿1,500</span>
                                <span className="text-slate-500">/mo</span>
                            </div>
                            <p className="text-slate-500 mt-4">For established businesses scaling up.</p>
                        </div>
                        <ul className="space-y-4 mb-8 flex-1">
                            {[
                                { t: "All Starter Features", d: "Everything in the Starter Pack included" },
                                { t: "Deep Analytics", d: "Heatmaps, customer demographics & trends" },
                                { t: "Multi-User Access", d: "Accounts for your staff and managers" },
                                { t: "Campaign Boosts", d: "Push notifications to users near your shop" },
                                { t: "API Access", d: "Connect Kosmoi to your existing CRM/POS" }
                            ].map((item, i) => (
                                <li key={i} className="flex flex-col gap-1">
                                    <div className="flex items-center gap-3 text-slate-900 font-medium text-sm">
                                        <Check className="w-5 h-5 text-blue-500 flex-shrink-0" />
                                        {item.t}
                                    </div>
                                    <p className="text-xs text-slate-500 pl-8">{item.d}</p>
                                </li>
                            ))}
                        </ul>
                        <button className="w-full py-3 px-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors">
                            Go Growth
                        </button>
                    </div>
                </div>

                <div className="mt-20 text-center">
                    <p className="text-slate-500">
                        Are you a user? <span className="font-bold text-slate-900">Kosmoi is 100% Free for everyone.</span>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Pricing;
