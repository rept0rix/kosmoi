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

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
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
                                "Full Platform Access",
                                "AI Agent Setup",
                                "Unlimited Leads (Trial)",
                                "No Credit Card Required"
                            ].map((item, i) => (
                                <li key={i} className="flex items-center gap-3 text-slate-600 text-sm">
                                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                        <button className="w-full py-3 px-4 bg-slate-100 text-slate-900 rounded-xl font-bold hover:bg-slate-200 transition-colors">
                            Start Free Trial
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
                                "Verified Business Badge",
                                "Priority Search Listing",
                                "24/7 AI Receptionist",
                                "Direct WhatsApp Integration",
                                "Monthly Performance Report"
                            ].map((item, i) => (
                                <li key={i} className="flex items-center gap-3 text-slate-300 text-sm">
                                    <CheckCircle className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                                    {item}
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
                                "Everything in Starter",
                                "Advanced Analytics Dashboard",
                                "Multi-User Access",
                                "Marketing Campaign Boosts",
                                "API Access"
                            ].map((item, i) => (
                                <li key={i} className="flex items-center gap-3 text-slate-600 text-sm">
                                    <Check className="w-5 h-5 text-blue-500 flex-shrink-0" />
                                    {item}
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
