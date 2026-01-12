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
      className="group relative overflow-hidden glass-card-premium hover:border-banana-500/30 transition-all duration-300 cursor-pointer rounded-2xl border-white/10"
      onClick={() => navigate(createPageUrl("ServiceProviderDetails") + `?id=${provider.id}`)}
    >
      {/* Image / Hero Section */}
      <div className="h-48 relative overflow-hidden bg-slate-900/50">
        {(() => {
          // Strict Image Filtering Logic
          const isValidImage = (img, category) => {
            if (!img) return false;

            // 1. Hard Blacklist (Metadata / Generic Site Images)
            const blacklist = [
              'Logo-Samui-Map',
              'Next-Edition-Post',
              'GETTING_',
              'KOH_SAMUI_',
              'ACCOMODATI_',
              'MAENAM_BEA'
            ];

            if (blacklist.some(term => img.includes(term))) return false;

            // 2. Contextual Filtering (e.g. Temples showing up for Restaurants)
            // If image is a Temple image (WAT_), but category is NOT culture/temple
            if (img.includes('WAT_')) {
              const allowedCategories = ['culture', 'temple', 'attraction', 'sightseeing', 'other'];
              // We include 'other' cautiously, but usually 'restaurants' or 'handyman' shouldn't show temples.
              // Actually, let's be strict: if it's explicitly 'handyman', 'restaurant', 'service', don't show temples.
              const isCulture = allowedCategories.some(cat => category?.toLowerCase().includes(cat));

              // If category is clearly NOT culture (e.g. restaurant), ban it.
              if (!isCulture) return false;
            }

            return true;
          };

          const validImages = provider.images ? provider.images.filter(img => isValidImage(img, provider.category)) : [];

          // Use filtered list. If empty, it means we show NO image (placeholder), which is better than wrong image.
          const displayImages = validImages;
          const mainImage = displayImages[0];

          if (mainImage) {
            const imageUrl = mainImage.startsWith('http')
              ? mainImage
              : `https://gzjzeywhqbwppfxqkptf.supabase.co/storage/v1/object/public/service-provider-images/${encodeURIComponent(mainImage)}`;

            return (
              <img
                src={imageUrl}
                alt={provider.business_name}
                className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  if (displayImages.length > 1) {
                    // Try next image if available (but simplistic retry here might loop, so just fallback for now)
                    e.currentTarget.src = 'https://placehold.co/400x300?text=No+Image';
                  } else {
                    e.currentTarget.src = 'https://placehold.co/400x300?text=No+Image';
                  }
                }}
              />
            );
          } else {
            return (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 border-b border-white/5">
                <CategoryIcon className="w-16 h-16 text-slate-700 mb-2" />
              </div>
            );
          }
        })()}


        {/* Badges Overlay */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {provider.verified && (
            <div className="bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full flex items-center gap-1.5 border border-banana-500/50">
              <CheckCircle className="w-3.5 h-3.5 text-banana-400 fill-banana-400/20" />
              <span className="text-[10px] font-bold text-banana-100 uppercase tracking-wide">Verified</span>
            </div>
          )}
        </div>

        {/* Rating Badge (Bottom Right of Image) */}
        <div className="absolute bottom-3 right-3">
          <div className="bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg flex items-center gap-1 border border-white/10">
            <Star className="w-3.5 h-3.5 fill-banana-400 text-banana-400" />
            <span className="text-xs font-bold text-white">
              {(typeof provider.average_rating === 'number' ? provider.average_rating.toFixed(1) : parseFloat(provider.average_rating || 0).toFixed(1)) || 'NEW'}
            </span>
            {provider.total_reviews > 0 && (
              <span className="text-[10px] text-slate-300">({provider.total_reviews})</span>
            )}
          </div>
        </div>
      </div>

      <CardContent className="p-4 pt-5">
        {/* Category & Name */}
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <Badge variant="secondary" className="bg-white/10 text-slate-300 border-white/5 text-[10px] uppercase tracking-wider font-semibold px-2 hover:bg-white/20">
              {getSubCategoryLabel(provider.category, language)}
            </Badge>
            {showDistance && provider.distance != null && !isNaN(provider.distance) && (
              <div className="flex items-center gap-1 text-[11px] font-medium text-banana-400">
                <NavigationIcon className="w-3 h-3" />
                <span>{Number(provider.distance).toFixed(1)} km</span>
              </div>
            )}
          </div>
          <h3 className="text-lg font-bold text-white leading-tight group-hover:text-banana-400 transition-colors line-clamp-1 font-heading">
            {provider.business_name}
          </h3>
        </div>

        {/* Metadata */}
        <div className="space-y-2 mb-4">
          {provider.location && (
            <div className="flex items-start gap-2 text-sm text-slate-400">
              <MapPin className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
              <span className="line-clamp-1">{provider.location}</span>
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
              className="w-full bg-transparent border-white/10 text-slate-300 hover:bg-white/5 hover:text-white"
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
            className="w-full bg-gradient-to-r from-banana-500 to-banana-600 text-midnight-950 font-bold hover:shadow-lg hover:shadow-banana-500/20 transition-all border-0"
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
