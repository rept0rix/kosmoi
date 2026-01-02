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
                    {/* Free Plan */}
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 flex flex-col hover:border-blue-200 transition-all">
                        <div className="mb-8">
                            <h3 className="text-lg font-bold text-slate-900 mb-2">Basic</h3>
                            <div className="flex items-baseline gap-1">
                                <span className="text-4xl font-extrabold text-slate-900">Free</span>
                            </div>
                            <p className="text-slate-500 mt-4">Essential visibility for every business.</p>
                        </div>
                        <ul className="space-y-4 mb-8 flex-1">
                            {[
                                { t: "Basic Business Listing", d: "Be findable on the map" },
                                { t: "Receive Reviews", d: "Collect feedback from users" },
                                { t: "Standard Support", d: "Email support access" },
                                { t: "No Credit Card Required", d: "Lifetime free access" }
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
                            Join Free
                        </button>
                    </div>

                    {/* 35 THB Test Drive */}
                    <div className="bg-white p-8 rounded-2xl shadow-sm border-2 border-teal-500/50 flex flex-col hover:border-teal-500 transition-all relative overflow-hidden">
                        <div className="absolute top-0 right-0 bg-teal-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl">
                            2 WEEKS
                        </div>
                        <div className="mb-8">
                            <h3 className="text-lg font-bold text-slate-900 mb-2">Test Drive</h3>
                            <div className="flex items-baseline gap-1">
                                <span className="text-4xl font-extrabold text-teal-600">฿35</span>
                                <span className="text-slate-400 text-sm">/ 2 wks</span>
                            </div>
                            <p className="text-slate-500 mt-4 text-sm">Long enough to see real impact.</p>
                        </div>
                        <ul className="space-y-4 mb-8 flex-1">
                            {[
                                { t: "Verified Status (2 Weeks)", d: "Blue checkmark to build trust" },
                                { t: "Unlock Live Leads", d: "See who's looking for you" },
                                { t: "AI Auto-Reply Trial", d: "Experience automated sales" },
                                { t: "Performance Search Boost", d: "Rank higher for 14 days" }
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
                            Try for ฿35
                        </button>
                    </div>

                    {/* 1500 THB Growth */}
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 flex flex-col hover:border-blue-500 transition-all">
                        <div className="mb-8">
                            <h3 className="text-lg font-bold text-slate-900 mb-2">Growth</h3>
                            <div className="flex items-baseline gap-1">
                                <span className="text-4xl font-extrabold text-slate-900">฿1,500</span>
                                <span className="text-slate-500">/ mo</span>
                            </div>
                            <p className="text-slate-500 mt-4">Consistent leads for steady growth.</p>
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
                                    <div className="flex items-center gap-3 text-slate-900 font-medium text-sm">
                                        <Check className="w-5 h-5 text-blue-500 flex-shrink-0" />
                                        {item.t}
                                    </div>
                                    <p className="text-xs text-slate-500 pl-8">{item.d}</p>
                                </li>
                            ))}
                        </ul>
                        <button className="w-full py-3 px-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors">
                            Choose Growth
                        </button>
                    </div>

                    {/* 3500 THB Scale / Premium */}
                    <div className="bg-slate-900 p-8 rounded-2xl shadow-xl border border-slate-800 flex flex-col relative transform md:-translate-y-4">
                        <div className="absolute top-0 right-0 bg-purple-500 text-white text-xs font-bold px-3 py-1 rounded-bl-xl rounded-tr-xl">
                            MOST POWERFUL
                        </div>
                        <div className="mb-8">
                            <h3 className="text-lg font-bold text-white mb-2">Scale</h3>
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
                                        <Zap className="w-5 h-5 text-purple-500 flex-shrink-0" />
                                        {item.t}
                                    </div>
                                    <p className="text-xs text-slate-400 pl-8">{item.d}</p>
                                </li>
                            ))}
                        </ul>
                        <button className="w-full py-3 px-4 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-colors shadow-lg shadow-purple-500/25">
                            Go Premium
                        </button>
                    </div>
                </div>

                {/* Feature Comparison Table */}
                <div className="mt-24 max-w-7xl mx-auto">
                    <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">Compare Plans</h2>
                    <div className="overflow-x-auto bg-white rounded-3xl shadow-sm border border-slate-200">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100">
                                    <th className="p-6 text-slate-500 font-medium">Features</th>
                                    <th className="p-6 text-slate-900 font-bold text-center bg-slate-50/50">Basic<br /><span className="text-slate-400 font-normal opacity-0">Free</span></th>
                                    <th className="p-6 text-teal-600 font-bold text-center bg-teal-50/30">Test Drive<br /><span className="text-slate-500 font-normal text-sm">35฿ / 2 wks</span></th>
                                    <th className="p-6 text-blue-600 font-bold text-center bg-blue-50/30">Growth<br /><span className="text-slate-500 font-normal text-sm">1,500฿ / mo</span></th>
                                    <th className="p-6 text-purple-600 font-bold text-center bg-purple-50/30">Scale<br /><span className="text-slate-500 font-normal text-sm">3,500฿ / mo</span></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {/* Visibility */}
                                <tr className="bg-slate-50/50"><td colSpan={5} className="p-4 font-bold text-slate-900 text-sm tracking-widest uppercase">Visibility</td></tr>
                                <tr>
                                    <td className="p-4 pl-6 text-slate-600">Map Listing</td>
                                    <td className="p-4 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                                    <td className="p-4 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                                    <td className="p-4 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                                    <td className="p-4 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                                </tr>
                                <tr>
                                    <td className="p-4 pl-6 text-slate-600">Verified Badge (Blue Check)</td>
                                    <td className="p-4 text-center"><span className="text-slate-300">-</span></td>
                                    <td className="p-4 text-center"><CheckCircle className="w-5 h-5 text-teal-500 mx-auto" /></td>
                                    <td className="p-4 text-center"><CheckCircle className="w-5 h-5 text-blue-500 mx-auto" /></td>
                                    <td className="p-4 text-center"><CheckCircle className="w-5 h-5 text-purple-500 mx-auto" /></td>
                                </tr>
                                <tr>
                                    <td className="p-4 pl-6 text-slate-600">Search Priority</td>
                                    <td className="p-4 text-center"><span className="text-slate-300">Standard</span></td>
                                    <td className="p-4 text-center"><span className="text-teal-600 font-medium">Boosted</span></td>
                                    <td className="p-4 text-center"><span className="text-blue-600 font-medium">High</span></td>
                                    <td className="p-4 text-center"><span className="text-purple-600 font-bold">Top Tier</span></td>
                                </tr>

                                {/* AI & Automation */}
                                <tr className="bg-slate-50/50"><td colSpan={5} className="p-4 font-bold text-slate-900 text-sm tracking-widest uppercase">AI & Automation</td></tr>
                                <tr>
                                    <td className="p-4 pl-6 text-slate-600">AI Concierge Recommendations</td>
                                    <td className="p-4 text-center"><span className="text-slate-300">Basic</span></td>
                                    <td className="p-4 text-center"><span className="text-teal-600 font-medium">Priority</span></td>
                                    <td className="p-4 text-center"><span className="text-blue-600 font-medium">Priority</span></td>
                                    <td className="p-4 text-center"><span className="text-purple-600 font-bold">Exclusive</span></td>
                                </tr>
                                <tr>
                                    <td className="p-4 pl-6 text-slate-600">AI Auto-Reply (Receptionist)</td>
                                    <td className="p-4 text-center"><span className="text-slate-300">-</span></td>
                                    <td className="p-4 text-center">Demo (1 chat)</td>
                                    <td className="p-4 text-center">Standard</td>
                                    <td className="p-4 text-center font-bold text-purple-600">Unlimited (24/7)</td>
                                </tr>

                                {/* Business Tools */}
                                <tr className="bg-slate-50/50"><td colSpan={5} className="p-4 font-bold text-slate-900 text-sm tracking-widest uppercase">Growth Tools</td></tr>
                                <tr>
                                    <td className="p-4 pl-6 text-slate-600">Review Management</td>
                                    <td className="p-4 text-center"><span className="text-slate-300">-</span></td>
                                    <td className="p-4 text-center"><Check className="w-5 h-5 text-gray-400 mx-auto" /></td>
                                    <td className="p-4 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                                    <td className="p-4 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                                </tr>
                                <tr>
                                    <td className="p-4 pl-6 text-slate-600">Analytics Dashboard</td>
                                    <td className="p-4 text-center"><span className="text-slate-300">Basic Views</span></td>
                                    <td className="p-4 text-center">2-week History</td>
                                    <td className="p-4 text-center">30d History</td>
                                    <td className="p-4 text-center font-bold text-purple-600">Live + Heatmaps</td>
                                </tr>
                                <tr>
                                    <td className="p-4 pl-6 text-slate-600">Direct WhatsApp Link</td>
                                    <td className="p-4 text-center"><span className="text-slate-300">-</span></td>
                                    <td className="p-4 text-center"><Check className="w-5 h-5 text-gray-400 mx-auto" /></td>
                                    <td className="p-4 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                                    <td className="p-4 text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                                </tr>
                                <tr>
                                    <td className="p-4 pl-6 text-slate-600">Push Notifications (Campaigns)</td>
                                    <td className="p-4 text-center"><span className="text-slate-300">-</span></td>
                                    <td className="p-4 text-center"><span className="text-slate-300">-</span></td>
                                    <td className="p-4 text-center">1 / mo</td>
                                    <td className="p-4 text-center font-bold text-purple-600">4 / mo</td>
                                </tr>

                                {/* Commission Model */}
                                <tr className="bg-slate-50/50"><td colSpan={5} className="p-4 font-bold text-slate-900 text-sm tracking-widest uppercase">Fair & Transparent</td></tr>
                                <tr>
                                    <td className="p-4 pl-6 text-slate-600">
                                        Booking Commission
                                        <div className="text-xs text-teal-600 font-medium mt-1">vs. 30% Industry Standard</div>
                                    </td>
                                    <td className="p-4 text-center"><span className="text-slate-300">N/A</span></td>
                                    <td className="p-4 text-center"><span className="text-teal-600 font-bold">0%</span></td>
                                    <td className="p-4 text-center font-bold text-slate-900">15%</td>
                                    <td className="p-4 text-center font-bold text-purple-600">8%</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Enterprise Section */}
                <div className="mt-16 max-w-4xl mx-auto bg-slate-100 rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="text-center md:text-left">
                        <h3 className="text-2xl font-bold text-slate-900 mb-2">Need an Enterprise solution?</h3>
                        <p className="text-slate-600 max-w-md">
                            For hotel chains, large venues, or custom integrations. Get API access, dedicated account management, and multi-location support.
                        </p>
                    </div>
                    <button className="px-8 py-3 bg-white border border-slate-300 text-slate-900 font-bold rounded-xl hover:bg-slate-50 transition-colors">
                        Contact Sales
                    </button>
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
