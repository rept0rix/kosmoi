import React, { createContext, useContext, useState, useEffect } from 'react';

const LocationContext = createContext(null);

const DEFAULT_LOCATION = {
    latitude: 9.5120,
    longitude: 100.0136,
    address: "Koh Samui, Thailand",
    name: "Koh Samui"
};

export const LocationProvider = ({ children }) => {
    // State for current location
    const [userLocation, setUserLocation] = useState(() => {
        const saved = localStorage.getItem('userLocation');
        return saved ? JSON.parse(saved) : null; // Start null to prompt or default? Let's start null to allow "use current" prompt, or maybe default.
        // Actually, plan says default to Koh Samui if nothing. 
        // But user might want to know if they haven't set it.
        // Let's stick to null initially so we know to ask, BUT if we need a fallback for map, we use constant.
    });

    const [locationName, setLocationName] = useState(() => {
        return localStorage.getItem('locationName') || '';
    });

    const [locationAddress, setLocationAddress] = useState(() => {
        return localStorage.getItem('locationAddressEn') || '';
    });

    // State for history
    const [locationHistory, setLocationHistory] = useState(() => {
        const saved = localStorage.getItem('locationHistory');
        return saved ? JSON.parse(saved) : [];
    });

    // Calculate distance helper
    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        if (!lat1 || !lon1 || !lat2 || !lon2) return null;
        const R = 6371; // km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    // Update Location
    const updateLocation = (locationData) => {
        // locationData: { latitude, longitude, name, address }
        if (!locationData) return;

        setUserLocation({ latitude: locationData.latitude, longitude: locationData.longitude });
        setLocationName(locationData.name || '');
        setLocationAddress(locationData.address || '');

        // Persist
        localStorage.setItem('userLocation', JSON.stringify({ latitude: locationData.latitude, longitude: locationData.longitude }));
        if (locationData.name) localStorage.setItem('locationName', locationData.name);
        if (locationData.address) localStorage.setItem('locationAddressEn', locationData.address);

        // Add to history if it has a name
        if (locationData.name && locationData.address) {
            addToHistory({
                name: locationData.name,
                address: locationData.address,
                latitude: locationData.latitude,
                longitude: locationData.longitude,
                timestamp: new Date().toISOString()
            });
        }
    };

    const addToHistory = (newLocation) => {
        setLocationHistory(prev => {
            // Avoid duplicates
            const filtered = prev.filter(l => l.name !== newLocation.name && l.address !== newLocation.address);
            const updated = [newLocation, ...filtered].slice(0, 5); // Keep last 5
            localStorage.setItem('locationHistory', JSON.stringify(updated));
            return updated;
        });
    };

    const contextValue = React.useMemo(() => ({
        userLocation,
        locationName,
        locationAddress,
        locationHistory,
        updateLocation,
        calculateDistance,
        DEFAULT_LOCATION
    }), [userLocation, locationName, locationAddress, locationHistory]);

    return (
        <LocationContext.Provider value={contextValue}>
            {children}
        </LocationContext.Provider>
    );
};

export const useLocationContext = () => {
    const context = useContext(LocationContext);
    if (!context) {
        throw new Error('useLocationContext must be used within a LocationProvider');
    }
    return context;
};
