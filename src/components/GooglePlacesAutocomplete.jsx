import React, { useEffect, useRef, useState } from 'react';
import { Input } from "@/components/ui/input";
import { MapPin } from "lucide-react";

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

export default function GooglePlacesAutocomplete({ onPlaceSelected, placeholder, className }) {
    const inputRef = useRef(null);
    const autoCompleteRef = useRef(null);
    const [scriptLoaded, setScriptLoaded] = useState(false);

    useEffect(() => {
        const checkGoogleMaps = () => {
            if (window.google && window.google.maps && window.google.maps.places) {
                setScriptLoaded(true);
                return true;
            }
            return false;
        };

        if (checkGoogleMaps()) return;

        const loadScript = () => {
            const existingScript = document.querySelector(`script[src*="maps.googleapis.com/maps/api/js"]`);
            if (existingScript) {
                existingScript.addEventListener('load', () => {
                    setTimeout(() => checkGoogleMaps(), 100);
                });
                return;
            }

            const script = document.createElement('script');
            // Ensure 'places' library is included
            script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&language=he&libraries=places&v=weekly&loading=async`;
            script.async = true;
            script.defer = true;
            script.onload = () => {
                setTimeout(() => checkGoogleMaps(), 100);
            };
            document.head.appendChild(script);
        };

        loadScript();
    }, []);

    useEffect(() => {
        if (scriptLoaded && inputRef.current && !autoCompleteRef.current) {
            if (!window.google || !window.google.maps || !window.google.maps.places) return;

            autoCompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
                fields: ["geometry", "formatted_address", "name"],
                // location: new window.google.maps.LatLng(9.512017, 100.013593), // Optional: Bias to Samui?
                // radius: 50000,
            });

            // Bind to Koh Samui bounds if desired, or just leave open. 
            // For now, let's just bias it to Thailand or specifically Samui if we wanted, 
            // but "put your location" implies it could be anywhere, though the app is Samui focused.
            // Let's add a bias to Koh Samui roughly.
            const samuiBounds = new window.google.maps.LatLngBounds(
                new window.google.maps.LatLng(9.40, 99.90),
                new window.google.maps.LatLng(9.60, 100.10)
            );
            autoCompleteRef.current.setBounds(samuiBounds);

            // Basic component restriction to Thailand could be useful but maybe too restrictive if used by tourists before arrival.
            // autoCompleteRef.current.setComponentRestrictions({ country: "th" });

            autoCompleteRef.current.addListener("place_changed", () => {
                const place = autoCompleteRef.current.getPlace();
                if (place.geometry && place.geometry.location) {
                    const lat = place.geometry.location.lat();
                    const lng = place.geometry.location.lng();
                    onPlaceSelected({
                        name: place.name || place.formatted_address,
                        address: place.formatted_address,
                        latitude: lat,
                        longitude: lng
                    });
                }
            });
        }
    }, [scriptLoaded, onPlaceSelected]);

    return (
        <div className="relative">
            <Input
                ref={inputRef}
                placeholder={placeholder}
                className={className}
                type="text"
            />
            <MapPin className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        </div>
    );
}
