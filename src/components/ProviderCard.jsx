import React from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/shared/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Star,
  Phone,
  CheckCircle,
  MapPin,
  Navigation as NavigationIcon,
  Wrench,
  Hammer,
  Zap,
  Droplets,
  Wind,
  Sparkles,
  Lock,
  PaintBucket,
  Leaf,
  Bug,
  Truck,
  Wifi,
  User,
  Waves,
  Sun,
  Shirt,
  Home,
  FileText,
  Car,
  Bike,
  Languages,
  Building2,
  Utensils,
  ShoppingBag,
  ArrowRight
} from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";
import { getSubCategoryLabel } from "@/components/subCategories";
import AuthGate from "@/components/AuthGate";

const categoryIcons = {
  handyman: Wrench,
  carpenter: Hammer,
  electrician: Zap,
  plumber: Droplets,
  ac_repair: Wind,
  cleaning: Sparkles,
  locksmith: Lock,
  painter: PaintBucket,
  gardener: Leaf,
  pest_control: Bug,
  pool_cleaning: Waves,
  solar_energy: Sun,
  laundry: Shirt,
  housekeeping: Home,
  internet_tech: Wifi,
  visa_services: FileText,
  moving: Truck,
  car_mechanic: Wrench,
  motorcycle_mechanic: Wrench,
  taxi_service: Car,
  car_rental: Car,
  bike_rental: Bike,
  translator: Languages,
  real_estate_agent: Building2,
  restaurants: Utensils,
  fashion: ShoppingBag
};

export default function ProviderCard({ provider, onCall, showDistance = false }) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const CategoryIcon = categoryIcons[provider.category] || Wrench;

  return (
    <Card
      className="group relative overflow-hidden bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer rounded-xl"
      onClick={() => navigate(createPageUrl("ServiceProviderDetails") + `?id=${provider.id}`)}
    >
      {/* Image / Hero Section */}
      <div className="h-48 relative overflow-hidden bg-slate-100">
        {provider.images && provider.images.length > 0 ? (
          <img
            src={provider.images[0]}
            alt={provider.business_name}
            className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900">
            <CategoryIcon className="w-16 h-16 text-slate-300 dark:text-slate-600 mb-2" />
          </div>
        )}

        {/* Badges Overlay */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {provider.verified && (
            <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1.5 border border-emerald-100 dark:border-emerald-900/30">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-500 fill-emerald-500/10" />
              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">Verified</span>
            </div>
          )}
        </div>

        {/* Rating Badge (Bottom Right of Image) */}
        <div className="absolute bottom-3 right-3">
          <div className="bg-white dark:bg-slate-900 px-2 py-1 rounded-lg shadow-lg flex items-center gap-1 border border-slate-100 dark:border-slate-800">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{provider.average_rating?.toFixed(1) || 'NEW'}</span>
            {provider.total_reviews > 0 && (
              <span className="text-[10px] text-slate-400">({provider.total_reviews})</span>
            )}
          </div>
        </div>
      </div>

      <CardContent className="p-4 pt-5">
        {/* Category & Name */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <Badge variant="secondary" className="bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 border-0 text-[10px] uppercase tracking-wider font-semibold px-2">
              {getSubCategoryLabel(provider.category, language)}
            </Badge>
            {showDistance && provider.distance !== null && (
              <div className="flex items-center gap-1 text-[11px] font-medium text-slate-500">
                <NavigationIcon className="w-3 h-3 text-blue-500" />
                <span>{provider.distance.toFixed(1)} km</span>
              </div>
            )}
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight group-hover:text-blue-600 transition-colors">
            {provider.business_name}
          </h3>
        </div>

        {/* Metadata */}
        <div className="space-y-2 mb-4">
          {provider.location && (
            <div className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
              <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
              <span className="line-clamp-1">{provider.location}</span>
            </div>
          )}

          {provider.contact_name && (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <User className="w-4 h-4 text-slate-400" />
              <span>{provider.contact_name}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-2 mt-auto">
          <AuthGate>
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onCall(provider.phone);
              }}
              variant="outline"
              className="w-full border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-900 dark:text-blue-400 dark:hover:bg-blue-900/30"
              size="sm"
            >
              <Phone className="w-3.5 h-3.5 mr-1.5" />
              Call
            </Button>
          </AuthGate>
          <Button
            onClick={(e) => {
              e.stopPropagation();
              navigate(createPageUrl("ServiceProviderDetails") + `?id=${provider.id}`);
            }}
            className="w-full bg-slate-900 text-white hover:bg-blue-600 shadow-md shadow-slate-200 dark:shadow-none transition-all"
            size="sm"
          >
            Details
            <ArrowRight className="w-3.5 h-3.5 ml-1.5 opacity-70" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
