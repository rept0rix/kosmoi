import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { X, Star, DollarSign, MapPin, Zap, ChevronDown } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export default function SearchFiltersPanel({
  filters,
  onFiltersChange,
  language = 'he',
  compact = false
}) {
  const [openPopover, setOpenPopover] = useState(null);

  const updateFilter = (key, value) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const togglePriceRange = (range) => {
    const current = filters.priceRanges || [];
    const updated = current.includes(range)
      ? current.filter(r => r !== range)
      : [...current, range];
    updateFilter('priceRanges', updated);
  };

  const clearAllFilters = () => {
    onFiltersChange({
      minRating: 0,
      minReviews: 0,
      maxDistance: 50,
      priceRanges: [],
      languages: [],
      emergencyService: false,
      verifiedOnly: false,
      superCategory: 'all',
      subCategory: 'all',
    });
  };

  const activeFiltersCount = [
    filters.minRating > 0,
    filters.minReviews > 0,
    filters.maxDistance < 50,
    (filters.priceRanges || []).length > 0,
    filters.emergencyService,
    filters.verifiedOnly,
  ].filter(Boolean).length;

  return (
    <div className={`w-full ${compact ? 'w-auto' : ''}`}>
      <div className={`flex items-center gap-2 ${compact ? 'flex-nowrap' : 'flex-wrap'}`}>
        {/* Rating Filter with Popover */}
        <Popover open={openPopover === 'rating'} onOpenChange={(open) => setOpenPopover(open ? 'rating' : null)}>
          <PopoverTrigger asChild>
            <Badge
              variant={filters.minRating > 0 ? "default" : "outline"}
              className="cursor-pointer px-3 py-1.5 text-sm hover:opacity-80"
            >
              <Star className="w-3.5 h-3.5 ml-1" />
              {filters.minRating > 0 ? `${filters.minRating}+` : 'דירוג'}
              <ChevronDown className="w-3 h-3 mr-1" />
            </Badge>
          </PopoverTrigger>
          <PopoverContent className="w-64" align="start">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">דירוג מינימלי</Label>
                <span className="text-sm font-bold text-blue-600">
                  {(filters.minRating || 0).toFixed(1)}+
                </span>
              </div>
              <Slider
                value={[filters.minRating || 0]}
                onValueChange={([value]) => updateFilter('minRating', value)}
                max={5}
                step={0.5}
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>0</span>
                <span>5</span>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Distance Filter with Popover */}
        <Popover open={openPopover === 'distance'} onOpenChange={(open) => setOpenPopover(open ? 'distance' : null)}>
          <PopoverTrigger asChild>
            <Badge
              variant={filters.maxDistance < 50 ? "default" : "outline"}
              className="cursor-pointer px-3 py-1.5 text-sm hover:opacity-80"
            >
              <MapPin className="w-3.5 h-3.5 ml-1" />
              {filters.maxDistance < 50 ? `${filters.maxDistance} ק"מ` : 'מרחק'}
              <ChevronDown className="w-3 h-3 mr-1" />
            </Badge>
          </PopoverTrigger>
          <PopoverContent className="w-64" align="start">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">מרחק מקסימלי</Label>
                <span className="text-sm font-bold text-blue-600">
                  {filters.maxDistance || 50} ק"מ
                </span>
              </div>
              <Slider
                value={[filters.maxDistance || 50]}
                onValueChange={([value]) => updateFilter('maxDistance', value)}
                max={50}
                step={5}
                min={5}
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>5 ק"מ</span>
                <span>50 ק"מ</span>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Price Range Filter with Popover */}
        <Popover open={openPopover === 'price'} onOpenChange={(open) => setOpenPopover(open ? 'price' : null)}>
          <PopoverTrigger asChild>
            <Badge
              variant={(filters.priceRanges || []).length > 0 ? "default" : "outline"}
              className="cursor-pointer px-3 py-1.5 text-sm hover:opacity-80"
            >
              <DollarSign className="w-3.5 h-3.5 ml-1" />
              מחיר
              <ChevronDown className="w-3 h-3 mr-1" />
            </Badge>
          </PopoverTrigger>
          <PopoverContent className="w-56" align="start">
            <div className="space-y-3">
              <Label className="text-sm font-semibold">טווח מחירים</Label>
              <div className="space-y-2">
                {['budget', 'moderate', 'premium'].map(range => (
                  <div key={range} className="flex items-center gap-2">
                    <Checkbox
                      id={`price-${range}`}
                      checked={(filters.priceRanges || []).includes(range)}
                      onCheckedChange={() => togglePriceRange(range)}
                    />
                    <Label htmlFor={`price-${range}`} className="cursor-pointer text-sm">
                      {range === 'budget' ? '💰 תקציבי' : range === 'moderate' ? '💰💰 בינוני' : '💰💰💰 פרמיום'}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Verified */}
        <Badge
          variant={filters.verifiedOnly ? "default" : "outline"}
          className="cursor-pointer px-3 py-1.5 text-sm hover:opacity-80"
          onClick={() => updateFilter('verifiedOnly', !filters.verifiedOnly)}
        >
          ✓ מאומתים
        </Badge>

        {/* Emergency */}
        <Badge
          variant={filters.emergencyService ? "default" : "outline"}
          className="cursor-pointer px-3 py-1.5 text-sm hover:opacity-80"
          onClick={() => updateFilter('emergencyService', !filters.emergencyService)}
        >
          <Zap className="w-3.5 h-3.5 ml-1" />
          חירום 24/7
        </Badge>

        {/* Clear All */}
        {activeFiltersCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="h-8 px-3 text-sm hover:bg-gray-100"
          >
            <X className="w-3.5 h-3.5 ml-1" />
            נקה ({activeFiltersCount})
          </Button>
        )}
      </div>
    </div>
  );
}