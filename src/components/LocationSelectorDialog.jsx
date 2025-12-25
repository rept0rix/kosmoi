import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Navigation as NavigationIcon, Search, History, MapPin } from "lucide-react";
import GooglePlacesAutocomplete from "@/components/GooglePlacesAutocomplete";
import GoogleMap from "@/components/GoogleMap";
import { useLocationContext } from "@/contexts/LocationContext";
import { db } from "@/api/supabaseClient";

export default function LocationSelectorDialog({ open, onOpenChange }) {
    const { t } = useTranslation();
    const {
        locationHistory,
        updateLocation,
        calculateDistance
    } = useLocationContext();

    const [locationDialogView, setLocationDialogView] = useState('search'); // 'search' | 'confirm'
    const [tempLocation, setTempLocation] = useState(null);
    const [locationError, setLocationError] = useState(null);
    const [locationPermission, setLocationPermission] = useState('pending');
    const [loadingAddress, setLoadingAddress] = useState(false);

    // Reverse Geocoding
    const getAddressFromCoordinates = async (latitude, longitude) => {
        try {
            const isDevelopment = import.meta.env.DEV;

            if (isDevelopment) {
                const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
                const urlEn = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}&language=en`;
                const responseEn = await fetch(urlEn);
                const dataEn = await responseEn.json();
                return { en: dataEn.results?.[0]?.formatted_address || null };
            }

            const response = await db.functions.invoke('geocode', { latitude, longitude });
            return { en: response.data.en };
        } catch (error) {
            console.error('Error getting address:', error);
            return { en: null };
        }
    };

    const handleUseCurrentLocation = () => {
        if (!navigator.geolocation) {
            setLocationError(t('dashboard.location_error_api'));
            return;
        }

        setLocationPermission('loading');

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const location = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    name: t('currentLocation')
                };
                setTempLocation(location);
                setLocationPermission('granted');
                setLocationDialogView('confirm');
            },
            (error) => {
                setLocationPermission('denied');
                if (error.code === error.PERMISSION_DENIED) {
                    setLocationError(t('dashboard.location_error_denied'));
                } else if (error.code === error.POSITION_UNAVAILABLE) {
                    setLocationError(t('dashboard.location_error_unavailable'));
                } else {
                    setLocationError(t('dashboard.location_error_generic'));
                }
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    };

    const handleManualLocationSelect = (location) => {
        setTempLocation({
            latitude: location.latitude,
            longitude: location.longitude,
            name: location.name
        });
        setLocationDialogView('confirm');
    };

    const confirmLocation = async () => {
        if (!tempLocation) return;

        const newLocation = {
            latitude: tempLocation.latitude,
            longitude: tempLocation.longitude,
            name: tempLocation.name || t('selectedLocation')
        };

        updateLocation(newLocation);
        setLocationPermission('granted');
        setLocationError(null);
        onOpenChange(false);
        setLocationDialogView('search');

        setLoadingAddress(true);
        try {
            const addresses = await getAddressFromCoordinates(newLocation.latitude, newLocation.longitude);
            if (addresses.en) {
                updateLocation({ ...newLocation, address: addresses.en });
            }
        } catch (error) {
            console.error('Error fetching addresses:', error);
        }
        setLoadingAddress(false);
    };

    return (
        <Dialog open={open} onOpenChange={(val) => {
            onOpenChange(val);
            if (!val) {
                setLocationDialogView('search');
                setTempLocation(null);
            }
        }}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{locationDialogView === 'confirm' ? t('confirmLocation') : t('selectLocation')}</DialogTitle>
                    {locationDialogView === 'search' && (
                        <DialogDescription>
                            {t('dashboard.search_location_description')}
                        </DialogDescription>
                    )}
                </DialogHeader>

                {locationDialogView === 'search' ? (
                    <div className="space-y-4 py-4">
                        <Button
                            onClick={handleUseCurrentLocation}
                            className="w-full bg-blue-100 text-blue-700 hover:bg-blue-200 shadow-none border border-blue-200 h-12 flex items-center justify-center gap-2"
                        >
                            <NavigationIcon className="w-5 h-5 fill-current" />
                            {t('useCurrentLocation')}
                        </Button>

                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none z-10">
                                <Search className="w-5 h-5 text-gray-400" />
                            </div>
                            <GooglePlacesAutocomplete
                                placeholder={t('dashboard.search_location_placeholder')}
                                onPlaceSelected={handleManualLocationSelect}
                                className="text-base h-12 pl-10 w-full"
                            />
                        </div>

                        {locationHistory.length > 0 && (
                            <div className="pt-2">
                                <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                                    <History className="w-4 h-4" />
                                    {t('recentSearches') || "Recent Locations"}
                                </p>
                                <div className="space-y-2">
                                    {locationHistory.map((location, index) => (
                                        <Button
                                            key={`${location.name}-${index}`}
                                            onClick={() => handleManualLocationSelect(location)}
                                            variant="ghost"
                                            className="w-full justify-start h-auto py-2 px-3 text-left font-normal hover:bg-gray-100"
                                        >
                                            <MapPin className="w-4 h-4 mr-2 text-gray-400 shrink-0" />
                                            <span className="truncate">{location.name}</span>
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        )}
                        <p className="text-xs text-center text-gray-400 mt-4 px-4">
                            {t('dashboard.location_privacy_note') || "Location data is stored locally on your device."}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="h-64 w-full rounded-lg overflow-hidden border border-gray-200 relative">
                            {tempLocation && (
                                <GoogleMap
                                    center={{ lat: tempLocation.latitude, lng: tempLocation.longitude }}
                                    zoom={15}
                                    markers={[{
                                        lat: tempLocation.latitude,
                                        lng: tempLocation.longitude,
                                        title: tempLocation.name
                                    }]}
                                    options={{
                                        disableDefaultUI: true,
                                        draggable: true
                                    }}
                                    height="100%"
                                />
                            )}
                            <div className="absolute bottom-2 left-2 bg-white/90 px-2 py-1 rounded text-xs shadow-sm">
                                {tempLocation?.name}
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                onClick={() => setLocationDialogView('search')}
                                className="flex-1"
                            >
                                {t('change')}
                            </Button>
                            <Button
                                onClick={confirmLocation}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                            >
                                {t('confirm')}
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
