// @ts-nocheck
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Phone, MessageCircle, Navigation, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/shared/lib/utils";
import { db } from "@/api/supabaseClient";

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
      "_blank",
    );
  };

  const handleDetailsClick = () => {
    navigate(createPageUrl("ServiceProviderDetails") + `?id=${provider.id}`);
  };

  if (!provider) return null;

  return (
    <div className="w-full">
      <div className="flex gap-4">
        <div className="flex-1 min-w-0">
          <h3
            className="font-bold text-lg text-slate-100 mb-1 truncate cursor-pointer hover:text-neon-cyan transition-colors shadow-sm"
            onClick={handleDetailsClick}
          >
            {provider.business_name}
          </h3>

          <div className="flex items-center gap-2 mb-3">
            <Badge
              variant="outline"
              className="text-xs px-2 py-0.5 border-neon-purple/50 text-neon-purple bg-neon-purple/10"
            >
              {getCategoryLabel(provider.category)}
            </Badge>
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
              <span className="font-semibold text-sm text-slate-200">
                {provider.average_rating?.toFixed(1) || "0.0"}
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={(e) => handleCall(provider.phone, e)}
              className="h-8 w-8 p-0 rounded-full bg-blue-500/20 text-blue-400 hover:bg-blue-500/40 border border-blue-500/30"
              variant="ghost"
            >
              <Phone className="w-4 h-4" />
            </Button>
            {provider.whatsapp && (
              <Button
                onClick={(e) => handleWhatsApp(provider.whatsapp, e)}
                className="h-8 w-8 p-0 rounded-full bg-green-500/20 text-green-400 hover:bg-green-500/40 border border-green-500/30"
                variant="ghost"
              >
                <MessageCircle className="w-4 h-4" />
              </Button>
            )}
            <Button
              onClick={(e) => handleNavigate(provider, e)}
              className="h-8 w-8 p-0 rounded-full bg-slate-700/50 text-slate-300 hover:bg-slate-700/80 border border-white/10"
              variant="ghost"
            >
              <Navigation className="w-4 h-4" />
            </Button>
            <Button
              onClick={handleDetailsClick}
              className="h-8 px-4 text-xs ml-auto bg-neon-cyan/10 hover:bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/50 hover:shadow-[0_0_10px_rgba(6,182,212,0.3)] transition-all"
              size="sm"
            >
              Open Profile
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
