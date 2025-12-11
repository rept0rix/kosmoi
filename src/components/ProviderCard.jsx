import React from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
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
  ShoppingBag
} from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";
import { getSubCategoryLabel } from "@/components/subCategories";
import AuthGate from "@/components/AuthGate";

const categoryIcons = {
  // Fix
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

  // Get Service
  laundry: Shirt,
  housekeeping: Home,
  internet_tech: Wifi,
  visa_services: FileText,

  // Transport
  moving: Truck,
  car_mechanic: Wrench,
  motorcycle_mechanic: Wrench,
  taxi_service: Car,
  car_rental: Car,
  bike_rental: Bike,

  // Other
  translator: Languages,
  real_estate_agent: Building2,
  restaurants: Utensils,
  fashion: ShoppingBag
};

/**
 * @typedef {Object} ServiceProvider
 * @property {string} id - The provider's ID
 * @property {string} category - The service category
 * @property {string} business_name - name of the business
 * @property {string} [contact_name] - contact person name
 * @property {number} [average_rating] - average rating
 * @property {number} [total_reviews] - total number of reviews
 * @property {string[]} [images] - array of image URLs
 * @property {boolean} [verified] - whether the provider is verified
 * @property {string} [phone] - phone number
 * @property {string} [location] - location string
 * @property {number} [distance] - distance from user in km
 */

/**
 * Card component to display service provider information.
 *
 * @param {Object} props
 * @param {ServiceProvider} props.provider - The provider data object
 * @param {(phone: string) => void} props.onCall - Callback function for call button
 * @param {boolean} [props.showDistance=false] - Whether to show distance from user
 */
export default function ProviderCard({ provider, onCall, showDistance = false }) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const CategoryIcon = categoryIcons[provider.category] || Wrench;

  return (
    <Card
      className="hover:shadow-lg transition-shadow border border-gray-200 cursor-pointer"
      onClick={() => navigate(createPageUrl("ServiceProviderDetails") + `?id=${provider.id}`)}
    >
      {provider.images && provider.images.length > 0 ? (
        <div className="h-40 overflow-hidden bg-gray-200 relative">
          <img
            src={provider.images[0]}
            alt={provider.business_name}
            className="w-full h-full object-cover"
          />
          {provider.verified && (
            <div className="absolute top-2 left-2 bg-white rounded-md px-2 py-1 shadow-md flex items-center gap-1">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-xs font-semibold text-green-600">מוסמך</span>
            </div>
          )}
        </div>
      ) : (
        <div className="h-40 bg-gradient-to-br from-blue-50 to-blue-100 flex flex-col items-center justify-center relative">
          <CategoryIcon className="w-16 h-16 text-blue-600 mb-2" />
          {provider.verified && (
            <div className="absolute top-2 left-2 bg-white rounded-md px-2 py-1 shadow-md flex items-center gap-1">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-xs font-semibold text-green-600">מוסמך</span>
            </div>
          )}
        </div>
      )}

      <CardContent className="p-4">
        <div className="flex items-start gap-2 mb-2">
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
            <CategoryIcon className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <Badge className="bg-blue-600 text-white hover:bg-blue-600 mb-1 text-xs">
              {getSubCategoryLabel(provider.category, language)}
            </Badge>
            <h4 className="font-bold text-gray-900 text-lg">
              {provider.business_name}
            </h4>
          </div>
        </div>

        {provider.contact_name && (
          <div className="flex items-center gap-1 text-sm text-gray-600 mb-3">
            <User className="w-3 h-3" />
            <span>איש קשר: {provider.contact_name}</span>
          </div>
        )}

        <div className="flex items-center gap-2 mb-2">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="font-semibold text-sm">
              {provider.average_rating?.toFixed(1) || '0.0'}
            </span>
          </div>
          <span className="text-xs text-gray-500">
            ({provider.total_reviews || 0} ביקורות)
          </span>
        </div>

        {showDistance && provider.distance !== null && provider.distance !== undefined && (
          <div className="flex items-center gap-1 text-xs text-blue-600 mb-2 font-medium">
            <NavigationIcon className="w-3 h-3" />
            <span>{provider.distance.toFixed(1)} ק"מ ממך</span>
          </div>
        )}

        {provider.location && (
          <div className="flex items-center gap-1 text-xs text-gray-600 mb-3">
            <MapPin className="w-3 h-3" />
            <span>{provider.location}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <AuthGate>
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onCall(provider.phone);
              }}
              className="bg-blue-600 hover:bg-blue-700 w-full"
              size="sm"
            >
              <Phone className="w-4 h-4 ml-1" />
              התקשר
            </Button>
          </AuthGate>
          <Button
            onClick={(e) => {
              e.stopPropagation(); // Prevent card's onClick from firing
              navigate(createPageUrl("ServiceProviderDetails") + `?id=${provider.id}`);
            }}
            variant="outline"
            size="sm"
          >
            פרטים נוספים
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
