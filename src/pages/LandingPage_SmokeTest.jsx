
import React, { useMemo } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import LeadCaptureForm from '../components/LeadCaptureForm';
import { Car, Hammer, Sparkles, MapPin, Clock, ShieldCheck } from 'lucide-react';

// Content Configuration based on Strategy
const LANDING_VARIANTS = {
    taxi: {
        headline: "Stranded? Get a Ride NOW!",
        subheadline: "Reliable airport transfers and island taxis in minutes.",
        icon: Car,
        color: "bg-yellow-500",
        bgImage: "https://images.unsplash.com/photo-1558287843-c0d114d59392?q=80&w=2070&auto=format&fit=crop", // Taxi/Road image
        perks: ["Available 24/7", "Fixed Pricing", "English Speaking Drivers"]
    },
    massage: {
        headline: "Relax NOW! In-Villa Massage.",
        subheadline: "Professional therapists brought directly to your doorstep.",
        icon: Sparkles,
        color: "bg-purple-500",
        bgImage: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=2070&auto=format&fit=crop", // Spa image
        perks: ["Certified Therapists", "Clean Equipement", "Full Relaxation"]
    },
    repair: {
        headline: "Urgent Repair? Get Help NOW!",
        subheadline: "AC broken? Power out? We connect you with local pros instantly.",
        icon: Hammer,
        color: "bg-blue-600",
        bgImage: "https://images.unsplash.com/photo-1581092921461-eab62e97a783?q=80&w=2070&auto=format&fit=crop", // Repair image
        perks: ["Emergency Response", "Vetted Pros", "Fair Quotes"]
    }
};

export default function LandingPage_SmokeTest() {
    const { category } = useParams();

    // Normalize category
    const normalizedCategory = category?.toLowerCase();
    const content = LANDING_VARIANTS[normalizedCategory];

    // 404/Redirect if invalid category
    if (!content) {
        return <Navigate to="/" replace />;
    }

    const Icon = content.icon;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
            {/* Hero Section */}
            <div className="relative bg-gray-900 text-white pb-20 pt-10 px-4">
                {/* Background Overlay */}
                <div className="absolute inset-0 overflow-hidden">
                    <img src={content.bgImage} alt={normalizedCategory} className="w-full h-full object-cover opacity-40 blur-sm" />
                    <div className="absolute inset-0 bg-gradient-to-b from-gray-900/80 to-gray-50"></div>
                </div>

                <div className="relative max-w-lg mx-auto text-center z-10">
                    <div className={`mx-auto w-16 h-16 ${content.color} rounded-full flex items-center justify-center mb-6 shadow-xl`}>
                        <Icon className="w-8 h-8 text-white" />
                    </div>

                    <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 leading-tight drop-shadow-md">
                        {content.headline}
                    </h1>
                    <p className="text-xl text-gray-200 font-medium mb-8">
                        {content.subheadline}
                    </p>

                    {/* Form Container */}
                    <div className="bg-white rounded-2xl shadow-2xl overflow-hidden -mb-32 text-left">
                        <div className="bg-gray-100 px-6 py-3 border-b text-xs font-bold text-gray-500 uppercase tracking-wider flex justify-between">
                            <span>Kosmoi Verified</span>
                            <span className="text-green-600 flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> Secure</span>
                        </div>
                        <div className="p-1">
                            <LeadCaptureForm category={normalizedCategory} source={`landing_${normalizedCategory}`} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Perks / Social Proof Section */}
            <div className="flex-1 mt-36 pb-12 px-4 max-w-lg mx-auto w-full">
                <div className="grid grid-cols-1 gap-4">
                    {content.perks.map((perk, i) => (
                        <div key={i} className="flex items-center gap-3 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                            <span className="font-semibold text-gray-700">{perk}</span>
                        </div>
                    ))}
                </div>

                <div className="mt-8 text-center text-gray-400 text-sm">
                    <p className="flex items-center justify-center gap-2">
                        <MapPin className="w-4 h-4" /> Serving all of Koh Samui
                    </p>
                </div>
            </div>
        </div>
    );
}
