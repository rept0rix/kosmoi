
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
  User
} from "lucide-react";

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
  moving: Truck,
  internet_tech: Wifi,
};

const categoryNames = {
  handyman: "אנדימן",
  carpenter: "נגר",
  electrician: "חשמלאי",
  plumber: "אינסטלטור",
  ac_repair: "מזגנים",
  cleaning: "ניקיון",
  locksmith: "מנעולן",
  painter: "צבע",
  gardener: "גנן",
  pest_control: "הדברה",
  moving: "הובלות",
  internet_tech: "אינטרנט",
};

export default function ProviderCard({ provider, onCall, showDistance = false }) {
  const navigate = useNavigate();
  const CategoryIcon = categoryIcons[provider.category] || Wrench;

  return (
    <Card 
      className="hover:shadow-lg transition-shadow border border-gray-200"
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
              {categoryNames[provider.category]}
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
          <Button 
            onClick={(e) => {
              e.stopPropagation();
              onCall(provider.phone);
            }}
            className="bg-blue-600 hover:bg-blue-700"
            size="sm"
          >
            <Phone className="w-4 h-4 ml-1" />
            התקשר
          </Button>
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
