import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Phone, MapPin, MessageCircle, Bot } from 'lucide-react';
import { Button } from "@/components/ui/button";
import AuthGate from '@/components/AuthGate';

/**
 * Contact Page
 *
 * Displays contact information (Email, WhatsApp, Office) and a quick message form.
 * Includes information for business partnerships.
 */
const Contact = () => {
    const navigate = useNavigate();
    return (
        <div className="min-h-screen bg-slate-50 pt-32 pb-20 px-4">
            <div className="max-w-3xl mx-auto space-y-12">
                <div className="text-center">
                    <h1 className="text-4xl font-extrabold text-slate-900 mb-4">Support Center</h1>
                    <p className="text-xl text-slate-600">
                        We're here to help you around the clock.
                    </p>
                </div>

                {/* PRIMARY ACTION: LIVE CHAT */}
                <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100 transform hover:scale-[1.02] transition-transform duration-300 cursor-pointer group"
                    onClick={() => navigate('/support')}
                >
                    <div className="bg-blue-600 p-8 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                        <div className="relative z-10 flex items-center gap-6">
                            <div className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl border border-white/20">
                                <Bot className="w-10 h-10 text-white" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold mb-1">Start a Live Chat</h2>
                                <p className="text-blue-100">Talk to our AI Agent or get escalated to a human instantly.</p>
                            </div>
                            <Button className="ml-auto bg-white text-blue-600 hover:bg-blue-50 font-bold px-6 h-12 rounded-xl shadow-lg hidden md:flex">
                                Start Now &rarr;
                            </Button>
                        </div>
                    </div>
                    <div className="p-6 bg-blue-50/50 flex flex-wrap gap-4 text-sm text-slate-600">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                            Online 24/7
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                            Avg. response: &lt; 1 min
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                            Account & Billing
                        </div>
                    </div>
                </div>

                {/* SECONDARY OPTIONS */}
                <div className="grid md:grid-cols-2 gap-6">
                    {/* Business Inquiries */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-start gap-4 hover:shadow-md transition-shadow">
                        <div className="p-3 bg-slate-100 rounded-xl">
                            <MapPin className="w-6 h-6 text-slate-700" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-slate-900">For Partners</h3>
                            <p className="text-slate-500 text-sm mb-4">
                                Want to list your business? Join our growing network.
                            </p>
                            <Button variant="outline" className="w-full border-slate-200" onClick={() => navigate('/vendor-signup')}>
                                Partner with Us
                            </Button>
                        </div>
                    </div>

                    {/* Direct Contact (Hidden Form, just info) */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-start gap-4 hover:shadow-md transition-shadow">
                        <div className="p-3 bg-green-100 rounded-xl">
                            <MessageCircle className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-slate-900">Direct Message</h3>
                            <p className="text-slate-500 text-sm mb-4">
                                Need to leave a message? Contact us via WhatsApp.
                            </p>
                            <Button variant="outline" className="w-full border-green-200 text-green-700 hover:bg-green-50 hover:text-green-800" onClick={() => window.open('https://wa.me/66000000000', '_blank')}>
                                Open WhatsApp
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="text-center pt-8 border-t border-slate-200 space-y-4">
                    <p className="text-slate-400 text-sm">
                        Prefer email? <a href="mailto:support@kosmoi.com" className="text-slate-500 hover:text-blue-600 underline decoration-slate-300 underline-offset-4">support@kosmoi.com</a>
                    </p>

                    <div className="flex justify-center">
                        <Button
                            variant="secondary"
                            size="sm"
                            className="text-xs text-slate-500"
                            onClick={async () => {
                                try {
                                    const { NotificationService } = await import('@/services/NotificationService');
                                    await NotificationService.subscribeUser();
                                    alert("Subscribed to updates! 🔔");
                                } catch (e) {
                                    alert("Error: " + e.message);
                                    console.error(e);
                                }
                            }}
                        >
                            🔔 Enable Push Updates
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Contact;
