import React from 'react';
import { Check, CheckCircle, Smartphone, Building, Zap, Star } from 'lucide-react';

/**
 * Pricing Page (Nano Banana Edition)
 *
 * Displays pricing tiers (Trial, Starter, Growth) for business partners.
 * Uses the new "Midnight & Gold" premium design system.
 */
const Pricing = () => {
    return (
        <div className="min-h-screen bg-midnight-950 text-white py-20 font-sans relative overflow-hidden">
            {/* Background Ambient Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-banana-500/10 rounded-full blur-[120px] pointer-events-none" />

            <div className="container mx-auto px-4 relative z-10">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h1 className="text-4xl md:text-6xl font-extrabold mb-6 tracking-tight text-white drop-shadow-xl font-heading">
                        Simple, <span className="text-transparent bg-clip-text bg-gradient-to-r from-banana-400 to-banana-600 animate-pulse">Transparent</span> Pricing
                    </h1>
                    <p className="text-xl text-slate-400">
                        Join the island's digital operating system. No hidden commissions.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
                    {/* Free Plan */}
                    <div className="glass-card-premium p-6 md:p-8 rounded-3xl flex flex-col hover:border-banana-500/30 transition-all duration-300">
                        <div className="mb-8">
                            <h3 className="text-lg font-bold text-slate-300 mb-2 font-heading">Basic</h3>
                            <div className="flex items-baseline gap-1">
                                <span className="text-4xl font-extrabold text-white">Free</span>
                            </div>
                            <p className="text-slate-500 mt-4 text-sm">Essential visibility for every business.</p>
                        </div>
                        <ul className="space-y-4 mb-8 flex-1">
                            {[
                                { t: "Basic Business Listing", d: "Be findable on the map" },
                                { t: "Receive Reviews", d: "Collect feedback from users" },
                                { t: "Standard Support", d: "Email support access" },
                                { t: "No Credit Card Required", d: "Lifetime free access" }
                            ].map((item, i) => (
                                <li key={i} className="flex flex-col gap-1">
                                    <div className="flex items-center gap-3 text-slate-200 font-medium text-sm">
                                        <Check className="w-5 h-5 text-slate-500 flex-shrink-0" />
                                        {item.t}
                                    </div>
                                    <p className="text-xs text-slate-600 pl-8">{item.d}</p>
                                </li>
                            ))}
                        </ul>
                        <button className="w-full py-3 px-4 bg-white/5 border border-white/10 text-white rounded-xl font-bold hover:bg-white/10 transition-colors backdrop-blur-md">
                            Join Free
                        </button>
                    </div>

                    {/* 35 THB Test Drive */}
                    <div className="glass-card-premium p-6 md:p-8 rounded-3xl flex flex-col border-banana-400/30 shadow-gold-glow hover:scale-[1.02] transition-all relative overflow-hidden group">
                        <div className="grainy-noise absolute inset-0 opacity-20"></div>
                        <div className="absolute top-0 right-0 bg-gradient-to-l from-banana-500 to-banana-400 text-midnight-950 text-[10px] font-bold px-3 py-1 rounded-bl-xl z-20">
                            POPULAR
                        </div>
                        <div className="mb-8 relative z-10">
                            <h3 className="text-lg font-bold text-banana-200 mb-2 font-heading">Test Drive</h3>
                            <div className="flex items-baseline gap-1">
                                <span className="text-4xl font-extrabold text-banana-400">฿35</span>
                                <span className="text-slate-400 text-sm">/ 2 wks</span>
                            </div>
                            <p className="text-slate-400 mt-4 text-sm">See the real impact immediately.</p>
                        </div>
                        <ul className="space-y-4 mb-8 flex-1 relative z-10">
                            {[
                                { t: "Verified Status (2 Weeks)", d: "Blue checkmark to build trust" },
                                { t: "Unlock Live Leads", d: "See who's looking for you" },
                                { t: "AI Auto-Reply Trial", d: "Experience automated sales" },
                                { t: "Performance Search Boost", d: "Rank higher for 14 days" }
                            ].map((item, i) => (
                                <li key={i} className="flex flex-col gap-1">
                                    <div className="flex items-center gap-3 text-white font-medium text-sm">
                                        <Check className="w-5 h-5 text-banana-400 flex-shrink-0" />
                                        {item.t}
                                    </div>
                                    <p className="text-xs text-slate-500 pl-8">{item.d}</p>
                                </li>
                            ))}
                        </ul>
                        <button className="relative z-10 w-full py-3 px-4 bg-gradient-to-r from-banana-500 to-banana-600 text-midnight-950 rounded-xl font-bold hover:shadow-lg hover:shadow-banana-500/40 transition-all font-heading tracking-wide">
                            Try for ฿35
                        </button>
                    </div>

                    {/* 1500 THB Growth */}
                    <div className="glass-card-premium p-6 md:p-8 rounded-3xl flex flex-col hover:border-blue-400/30 transition-all duration-300">
                        <div className="mb-8">
                            <h3 className="text-lg font-bold text-blue-200 mb-2 font-heading">Growth</h3>
                            <div className="flex items-baseline gap-1">
                                <span className="text-4xl font-extrabold text-white">฿1,500</span>
                                <span className="text-slate-500">/ mo</span>
                            </div>
                            <p className="text-slate-400 mt-4 text-sm">Consistent leads for steady growth.</p>
                        </div>
                        <ul className="space-y-4 mb-8 flex-1">
                            {[
                                { t: "Everything in Free", d: "Plus priority support" },
                                { t: "Verified Business Badge", d: "Permanent blue checkmark" },
                                { t: "Review Management", d: "Reply to reviews easily" },
                                { t: "Monthly Performance Report", d: "Track your ROI" },
                                { t: "Up to 50 Leads / mo", d: "Direct connections to customers" }
                            ].map((item, i) => (
                                <li key={i} className="flex flex-col gap-1">
                                    <div className="flex items-center gap-3 text-slate-200 font-medium text-sm">
                                        <Check className="w-5 h-5 text-blue-400 flex-shrink-0" />
                                        {item.t}
                                    </div>
                                    <p className="text-xs text-slate-500 pl-8">{item.d}</p>
                                </li>
                            ))}
                        </ul>
                        <button className="w-full py-3 px-4 bg-blue-600/90 text-white rounded-xl font-bold hover:bg-blue-600 transition-colors shadow-lg shadow-blue-900/20">
                            Choose Growth
                        </button>
                    </div>

                    {/* 3500 THB Scale / Premium */}
                    <div className="glass-card-premium p-6 md:p-8 rounded-3xl flex flex-col relative transform md:-translate-y-4 border-purple-500/30 bg-purple-900/10 hover:bg-purple-900/20 transition-all">
                        <div className="absolute top-0 right-0 bg-purple-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl rounded-tr-2xl">
                            MOST POWERFUL
                        </div>
                        <div className="mb-8">
                            <h3 className="text-lg font-bold text-purple-200 mb-2 font-heading">Scale</h3>
                            <div className="flex items-baseline gap-1">
                                <span className="text-4xl font-extrabold text-white">฿3,500</span>
                                <span className="text-slate-400">/ mo</span>
                            </div>
                            <p className="text-slate-400 mt-4">Dominate your niche with AI power.</p>
                        </div>
                        <ul className="space-y-4 mb-8 flex-1">
                            {[
                                { t: "Priority Search Listing", d: "Always appear first in results" },
                                { t: "24/7 AI Receptionist", d: "Auto-reply to every message" },
                                { t: "Unlimited Leads", d: "Never miss a potential customer" },
                                { t: "WhatsApp Integration", d: "Connect directly to your phone" },
                                { t: "Custom Promo Campaigns", d: "Push notifications to nearby users" }
                            ].map((item, i) => (
                                <li key={i} className="flex flex-col gap-1">
                                    <div className="flex items-center gap-3 text-white font-medium text-sm">
                                        <Zap className="w-5 h-5 text-purple-400 flex-shrink-0" />
                                        {item.t}
                                    </div>
                                    <p className="text-xs text-slate-400 pl-8">{item.d}</p>
                                </li>
                            ))}
                        </ul>
                        <button className="w-full py-3 px-4 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-500 transition-colors shadow-lg shadow-purple-500/25">
                            Go Premium
                        </button>
                    </div>
                </div>

                {/* Feature Comparison Table */}
                <div className="mt-24 max-w-7xl mx-auto">
                    <h2 className="text-3xl font-bold text-white text-center mb-12 font-heading">Compare Plans</h2>
                    <div className="overflow-x-auto glass-card-premium rounded-3xl border border-white/10">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/10 bg-white/5">
                                    <th className="p-6 text-slate-400 font-medium">Features</th>
                                    <th className="p-6 text-white font-bold text-center">Basic<br /><span className="text-slate-500 font-normal opacity-0">Free</span></th>
                                    <th className="p-6 text-banana-400 font-bold text-center bg-banana-500/10">Test Drive<br /><span className="text-slate-400 font-normal text-sm">35฿ / 2 wks</span></th>
                                    <th className="p-6 text-blue-400 font-bold text-center">Growth<br /><span className="text-slate-400 font-normal text-sm">1,500฿ / mo</span></th>
                                    <th className="p-6 text-purple-400 font-bold text-center">Scale<br /><span className="text-slate-400 font-normal text-sm">3,500฿ / mo</span></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {/* Visibility */}
                                <tr className="bg-white/5"><td colSpan={5} className="p-4 font-bold text-white text-sm tracking-widest uppercase pl-6">Visibility</td></tr>
                                <tr>
                                    <td className="p-4 pl-6 text-slate-300">Map Listing</td>
                                    <td className="p-4 text-center"><Check className="w-5 h-5 text-slate-500 mx-auto" /></td>
                                    <td className="p-4 text-center bg-banana-500/5"><Check className="w-5 h-5 text-banana-400 mx-auto" /></td>
                                    <td className="p-4 text-center"><Check className="w-5 h-5 text-blue-400 mx-auto" /></td>
                                    <td className="p-4 text-center"><Check className="w-5 h-5 text-purple-400 mx-auto" /></td>
                                </tr>
                                <tr>
                                    <td className="p-4 pl-6 text-slate-300">Verified Badge (Blue Check)</td>
                                    <td className="p-4 text-center"><span className="text-slate-600">-</span></td>
                                    <td className="p-4 text-center bg-banana-500/5"><CheckCircle className="w-5 h-5 text-banana-400 mx-auto" /></td>
                                    <td className="p-4 text-center"><CheckCircle className="w-5 h-5 text-blue-400 mx-auto" /></td>
                                    <td className="p-4 text-center"><CheckCircle className="w-5 h-5 text-purple-400 mx-auto" /></td>
                                </tr>
                                <tr>
                                    <td className="p-4 pl-6 text-slate-300">Search Priority</td>
                                    <td className="p-4 text-center"><span className="text-slate-600">Standard</span></td>
                                    <td className="p-4 text-center bg-banana-500/5"><span className="text-banana-400 font-medium">Boosted</span></td>
                                    <td className="p-4 text-center"><span className="text-blue-400 font-medium">High</span></td>
                                    <td className="p-4 text-center"><span className="text-purple-400 font-bold">Top Tier</span></td>
                                </tr>

                                {/* AI & Automation */}
                                <tr className="bg-white/5"><td colSpan={5} className="p-4 font-bold text-white text-sm tracking-widest uppercase pl-6">AI & Automation</td></tr>
                                <tr>
                                    <td className="p-4 pl-6 text-slate-300">AI Concierge Recommendations</td>
                                    <td className="p-4 text-center"><span className="text-slate-600">Basic</span></td>
                                    <td className="p-4 text-center bg-banana-500/5"><span className="text-banana-400 font-medium">Priority</span></td>
                                    <td className="p-4 text-center"><span className="text-blue-400 font-medium">Priority</span></td>
                                    <td className="p-4 text-center"><span className="text-purple-400 font-bold">Exclusive</span></td>
                                </tr>
                                <tr>
                                    <td className="p-4 pl-6 text-slate-300">AI Auto-Reply (Receptionist)</td>
                                    <td className="p-4 text-center"><span className="text-slate-600">-</span></td>
                                    <td className="p-4 text-center bg-banana-500/5 text-sm text-banana-200">Demo (1 chat)</td>
                                    <td className="p-4 text-center text-sm text-blue-200">Standard</td>
                                    <td className="p-4 text-center font-bold text-purple-400">Unlimited (24/7)</td>
                                </tr>

                                {/* Business Tools */}
                                <tr className="bg-white/5"><td colSpan={5} className="p-4 font-bold text-white text-sm tracking-widest uppercase pl-6">Growth Tools</td></tr>
                                <tr>
                                    <td className="p-4 pl-6 text-slate-300">Review Management</td>
                                    <td className="p-4 text-center"><span className="text-slate-600">-</span></td>
                                    <td className="p-4 text-center bg-banana-500/5"><Check className="w-5 h-5 text-slate-600 mx-auto" /></td>
                                    <td className="p-4 text-center"><Check className="w-5 h-5 text-blue-400 mx-auto" /></td>
                                    <td className="p-4 text-center"><Check className="w-5 h-5 text-purple-400 mx-auto" /></td>
                                </tr>
                                <tr>
                                    <td className="p-4 pl-6 text-slate-300">Analytics Dashboard</td>
                                    <td className="p-4 text-center"><span className="text-slate-600">Basic Views</span></td>
                                    <td className="p-4 text-center bg-banana-500/5 text-sm">2-week History</td>
                                    <td className="p-4 text-center text-sm">30d History</td>
                                    <td className="p-4 text-center font-bold text-purple-400">Live + Heatmaps</td>
                                </tr>
                                <tr>
                                    <td className="p-4 pl-6 text-slate-300">Direct WhatsApp Link</td>
                                    <td className="p-4 text-center"><span className="text-slate-600">-</span></td>
                                    <td className="p-4 text-center bg-banana-500/5"><Check className="w-5 h-5 text-slate-600 mx-auto" /></td>
                                    <td className="p-4 text-center"><Check className="w-5 h-5 text-blue-400 mx-auto" /></td>
                                    <td className="p-4 text-center"><Check className="w-5 h-5 text-purple-400 mx-auto" /></td>
                                </tr>
                                <tr>
                                    <td className="p-4 pl-6 text-slate-300">Push Notifications (Campaigns)</td>
                                    <td className="p-4 text-center"><span className="text-slate-600">-</span></td>
                                    <td className="p-4 text-center bg-banana-500/5"><span className="text-slate-600">-</span></td>
                                    <td className="p-4 text-center text-sm">1 / mo</td>
                                    <td className="p-4 text-center font-bold text-purple-400">4 / mo</td>
                                </tr>

                                {/* Commission Model */}
                                <tr className="bg-white/5"><td colSpan={5} className="p-4 font-bold text-white text-sm tracking-widest uppercase pl-6">Fair & Transparent</td></tr>
                                <tr>
                                    <td className="p-4 pl-6 text-slate-300">
                                        Booking Commission
                                        <div className="text-xs text-banana-400 font-medium mt-1">vs. 30% Industry Standard</div>
                                    </td>
                                    <td className="p-4 text-center"><span className="text-slate-600">N/A</span></td>
                                    <td className="p-4 text-center bg-banana-500/5"><span className="text-banana-400 font-bold">0%</span></td>
                                    <td className="p-4 text-center font-bold text-white">15%</td>
                                    <td className="p-4 text-center font-bold text-purple-400">8%</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Enterprise Section */}
                <div className="mt-16 max-w-4xl mx-auto glass-card-premium rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 border border-white/10">
                    <div className="text-center md:text-left">
                        <h3 className="text-2xl font-bold text-white mb-2 font-heading">Need an Enterprise solution?</h3>
                        <p className="text-slate-400 max-w-md">
                            For hotel chains, large venues, or custom integrations. Get API access, dedicated account management, and multi-location support.
                        </p>
                    </div>
                    <button className="px-8 py-3 bg-white/5 border border-white/20 text-white font-bold rounded-xl hover:bg-white/10 transition-colors">
                        Contact Sales
                    </button>
                </div>

                <div className="mt-20 text-center">
                    <p className="text-slate-500">
                        Are you a user? <span className="font-bold text-white">Kosmoi is 100% Free for everyone.</span>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Pricing;
