import React from 'react';
import { CheckCircle, ArrowRight, Bot, MessageSquare, Briefcase } from 'lucide-react';

const UseCases = () => {
    return (
        <div className="min-h-screen bg-white">
            <div className="container mx-auto px-4 py-20">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h1 className="text-4xl font-bold mb-6 text-slate-900">From Chaos to Clarity</h1>
                    <p className="text-xl text-slate-600">
                        See how Kosmoi transforms daily operations for businesses and customers alike.
                    </p>
                </div>

                {/* Use Case 1: The Business Owner */}
                <div className="flex flex-col md:flex-row items-center gap-12 mb-24">
                    <div className="flex-1 bg-slate-50 p-10 rounded-3xl border border-slate-100">
                        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white mb-8">
                            <Briefcase className="w-8 h-8" />
                        </div>
                        <h2 className="text-3xl font-bold mb-4 text-slate-900">For Service Providers</h2>
                        <p className="text-lg text-slate-600 mb-8">
                            Imagine an employee who never sleeps. Kosmoi's "CEO Agent" manages your inquiries, schedules appointments, and even optimizes your pricing in real-time.
                        </p>
                        <ul className="space-y-4">
                            {[
                                "Auto-reply to leads 24/7",
                                "Smart scheduling & calendar sync",
                                "Automated invoicing & payments",
                                "Reputation management"
                            ].map((item, i) => (
                                <li key={i} className="flex items-center gap-3 text-slate-700">
                                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="flex-1">
                        {/* Placeholder for illustration */}
                        <div className="aspect-video bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center border border-indigo-50">
                            <span className="text-indigo-300 font-bold text-lg">Agent Workflow UI</span>
                        </div>
                    </div>
                </div>

                {/* Use Case 2: The Customer */}
                <div className="flex flex-col md:flex-row-reverse items-center gap-12">
                    <div className="flex-1 bg-slate-50 p-10 rounded-3xl border border-slate-100">
                        <div className="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center text-white mb-8">
                            <MessageSquare className="w-8 h-8" />
                        </div>
                        <h2 className="text-3xl font-bold mb-4 text-slate-900">For Customers</h2>
                        <p className="text-lg text-slate-600 mb-8">
                            No more calling 5 different places to find a plumber. Chat with Kosmoi, describe your problem, and let our agents find the best verified provider for you.
                        </p>
                        <ul className="space-y-4">
                            {[
                                "Natural language search",
                                "Instant price comparisons",
                                "Verified reviews only",
                                "Secure dispute resolution"
                            ].map((item, i) => (
                                <li key={i} className="flex items-center gap-3 text-slate-700">
                                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="flex-1">
                        {/* Placeholder for illustration */}
                        <div className="aspect-video bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl flex items-center justify-center border border-purple-50">
                            <span className="text-purple-300 font-bold text-lg">Chat Interface UI</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UseCases;
