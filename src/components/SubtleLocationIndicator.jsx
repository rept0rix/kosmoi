import React, { useState } from 'react';
import { MapPin } from 'lucide-react';
import { useLocationContext } from '@/contexts/LocationContext';
import LocationSelectorDialog from './LocationSelectorDialog';
import { useTranslation } from 'react-i18next';

export default function SubtleLocationIndicator({ className }) {
    const { userLocation, locationName } = useLocationContext();
    const [showDialog, setShowDialog] = useState(false);
    const { t } = useTranslation();

    // Determine display text and style
    // If no location: Red/Rose style
    // If location: Slate/Blue style

    return (
        <>
            <button
                onClick={(e) => {
                    e.stopPropagation(); // Prevent triggering parent click if inside another clickable
                    setShowDialog(true);
                }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-300 ${userLocation
                        ? 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
                        : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 animate-pulse'
                    } ${className || ''}`}
            >
                <MapPin className={`w-3.5 h-3.5 ${userLocation ? 'text-blue-400' : 'text-rose-500'}`} />
                <span className="text-xs font-medium tracking-wide">
                    {userLocation
                        ? (locationName || t('selectedLocation'))
                        : (t('dashboard.select_location') || 'Add Location')
                    }
                </span>
            </button>
            <LocationSelectorDialog open={showDialog} onOpenChange={setShowDialog} />
        </>
    );
}
