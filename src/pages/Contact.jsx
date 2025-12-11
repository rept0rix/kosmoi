import React from 'react';
import { Mail, Phone, MapPin, MessageCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import AuthGate from '@/components/AuthGate';

/**
 * Contact Page
 *
 * Displays contact information (Email, WhatsApp, Office) and a quick message form.
 * Includes information for business partnerships.
 */
const Contact = () => {
    return (
        <div className="min-h-screen bg-white py-20 px-4">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-16">
                    <h1 className="text-4xl font-extrabold text-slate-900 mb-4">Get in Touch</h1>
                    <p className="text-xl text-slate-600">
                        We're here to help you navigate the Kosmoi ecosystem.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-12">
                    {/* Contact Info */}
                    <div className="space-y-8">
                        <div>
                            <h3 className="text-xl font-bold text-slate-900 mb-4">Contact Information</h3>
                            <div className="space-y-6">
                                <div className="flex items-start gap-4">
                                    <div className="p-3 bg-blue-50 rounded-lg">
                                        <Mail className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-slate-900">Email</p>
                                        <p className="text-slate-600">support@kosmoi.com</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="p-3 bg-green-50 rounded-lg">
                                        <MessageCircle className="w-6 h-6 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-slate-900">WhatsApp</p>
                                        <p className="text-slate-600">+66 00 000 0000</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="p-3 bg-slate-50 rounded-lg">
                                        <MapPin className="w-6 h-6 text-slate-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-slate-900">Office</p>
                                        <p className="text-slate-600">Koh Samui, Surat Thani, Thailand</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-50 p-6 rounded-2xl">
                            <h4 className="font-bold text-slate-900 mb-2">For Business Inquiries</h4>
                            <p className="text-slate-600 mb-4 text-sm">
                                Interested in partnering with Kosmoi or getting your business listed?
                            </p>
                            <Button className="w-full bg-slate-900 text-white hover:bg-slate-800">
                                Partner Support
                            </Button>
                        </div>
                    </div>

                    {/* Quick Form */}
                    <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8">
                        <h3 className="text-xl font-bold text-slate-900 mb-6">Send us a message</h3>
                        <form className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                                <input type="text" className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="Your name" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                                <input type="email" className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="your@email.com" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Message</label>
                                <textarea rows={4} className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="How can we help?"></textarea>
                            </div>
                            <AuthGate>
                                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-6">
                                    Send Message
                                </Button>
                            </AuthGate>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Contact;
