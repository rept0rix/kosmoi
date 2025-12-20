import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Phone, MessageCircle, Navigation, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from "@/shared/lib/utils";
import { db } from '@/api/supabaseClient';

const categories = {
    handyman: "Handyman",
    carpenter: "Carpenter",
    electrician: "Electrician",
    plumber: "Plumber",
    ac_repair: "AC Repair",
    cleaning: "Cleaning",
    locksmith: "Locksmith",
    painter: "Painter",
    gardener: "Gardener",
    pest_control: "Pest Control",
    moving: "Moving",
    internet_tech: "Internet",
    car_mechanic: "Mechanic",
    translator: "Translator",
    visa_services: "Visa",
    real_estate_agent: "Real Estate",
    taxi: "Taxi",
};

/**
 * Popup card component for map markers showing provider details.
 *
 * @param {Object} props
 * @param {Object} props.provider - The provider data object (see ProviderCard for typedef)
 * @param {number} [props.provider.average_rating]
 * @param {string} props.provider.business_name
 * @param {string} props.provider.category
 * @param {string} [props.provider.phone]
 * @param {string} [props.provider.whatsapp]
 * @param {number} props.provider.latitude
 * @param {number} props.provider.longitude
 * @param {() => void} props.onClose - Callback to close the popup
 */
export default function MapProviderCard({ provider, onClose }) {
    const navigate = useNavigate();

    const getCategoryLabel = (categoryValue) => {
        return categories[categoryValue] || categoryValue;
    };

    const handleCall = async (phone, e) => {
        e.stopPropagation();
        try {
            const isAuth = await db.auth.isAuthenticated();
            if (!isAuth) {
                db.auth.redirectToLogin(window.location.pathname);
                return;
            }
            window.location.href = `tel:${phone}`;
        } catch (error) {
            db.auth.redirectToLogin(window.location.pathname);
        }
    };

    const handleWhatsApp = async (phone, e) => {
        e.stopPropagation();
        try {
            const isAuth = await db.auth.isAuthenticated();
            if (!isAuth) {
                db.auth.redirectToLogin(window.location.pathname);
                return;
            }
            window.open(`https://wa.me/${phone.replace(/[^0-9]/g, "")}`, "_blank");
        } catch (error) {
            db.auth.redirectToLogin(window.location.pathname);
        }
    };

    const handleNavigate = (provider, e) => {
        e.stopPropagation();
        window.open(
            `https://www.google.com/maps/dir/?api=1&destination=${provider.latitude},${provider.longitude}`,
            "_blank"
        );
    };

    const handleDetailsClick = () => {
        navigate(createPageUrl("ServiceProviderDetails") + `?id=${provider.id}`);
    };

    if (!provider) return null;

    return (
        <div className="absolute bottom-2 left-2 right-2 z-[1000]">
            <Card className="shadow-lg border border-gray-200 bg-white/95 backdrop-blur-sm">
                <CardContent className="p-3">
                    <button
                        onClick={onClose}
                        className="absolute top-1 right-1 text-gray-400 hover:text-gray-600 bg-white rounded-full p-0.5 shadow-sm"
                    >
                        <X className="w-4 h-4" />
                    </button>

                    <div className="flex gap-3">


                        <div className="flex-1 min-w-0">
                            <h3
                                className="font-bold text-sm text-gray-900 mb-0.5 truncate cursor-pointer hover:text-blue-600"
                                onClick={handleDetailsClick}
                            >
                                {provider.business_name}
                            </h3>

                            <div className="flex items-center gap-2 mb-1">
                                <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">
                                    {getCategoryLabel(provider.category)}
                                </Badge>
                                <div className="flex items-center gap-0.5">
                                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                    <span className="font-semibold text-[10px]">
                                        {provider.average_rating?.toFixed(1) || "0.0"}
                                    </span>
                                </div>
                            </div>

                            <div className="flex gap-2 mt-1">
                                <Button
                                    onClick={(e) => handleCall(provider.phone, e)}
                                    className="h-6 w-6 p-0 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200"
                                    variant="ghost"
                                >
                                    <Phone className="w-3 h-3" />
                                </Button>
                                {provider.whatsapp && (
                                    <Button
                                        onClick={(e) => handleWhatsApp(provider.whatsapp, e)}
                                        className="h-6 w-6 p-0 rounded-full bg-green-100 text-green-600 hover:bg-green-200"
                                        variant="ghost"
                                    >
                                        <MessageCircle className="w-3 h-3" />
                                    </Button>
                                )}
                                <Button
                                    onClick={(e) => handleNavigate(provider, e)}
                                    className="h-6 w-6 p-0 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"
                                    variant="ghost"
                                >
                                    <Navigation className="w-3 h-3" />
                                </Button>
                                <Button
                                    onClick={handleDetailsClick}
                                    className="h-6 px-2 text-[10px] ml-auto bg-blue-600 hover:bg-blue-700 text-white"
                                    size="sm"
                                >
                                    Open
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
