import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Search, MapPin, Loader2, Plus, Store } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '@/api/supabaseClient';

/**
 * @typedef {Object} PlaceData
 * @property {string} place_id
 * @property {string} name
 * @property {Object} structured_formatting
 * @property {string} structured_formatting.main_text
 * @property {string} structured_formatting.secondary_text
 */

/**
 * @param {Object} props
 * @param {function(any): void} props.onSelectPlace - Called when a user selects a place from Google Maps
 * @param {function(string): void} props.onCreateNew - Called when user wants to create a fresh business (not on maps)
 */
export function BusinessSearchStep({ onSelectPlace, onCreateNew }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [predictions, setPredictions] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const autocompleteService = useRef(null);
    const placesService = useRef(null);

    useEffect(() => {
        // Initialize Google Places Services
        const initServices = () => {
            if (window.google && window.google.maps && window.google.maps.places) {
                if (!autocompleteService.current) {
                    autocompleteService.current = new window.google.maps.places.AutocompleteService();
                }
                if (!placesService.current) {
                    placesService.current = new window.google.maps.places.PlacesService(document.createElement('div'));
                }
            }
        };

        const interval = setInterval(() => {
            if (window.google) {
                initServices();
                clearInterval(interval);
            }
        }, 500);
        return () => clearInterval(interval);
    }, []);

    const handleSearch = (input) => {
        setSearchTerm(input);
        if (!input || !autocompleteService.current) {
            setPredictions([]);
            return;
        }

        setIsLoading(true);
        // Bias to Koh Samui
        const samuiBounds = new window.google.maps.LatLngBounds(
            new window.google.maps.LatLng(9.4, 99.9),
            new window.google.maps.LatLng(9.6, 100.1)
        );

        autocompleteService.current.getPlacePredictions(
            { input, locationBias: samuiBounds, types: ['establishment'] },
            (results, status) => {
                setIsLoading(false);
                if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
                    setPredictions(results);
                } else {
                    setPredictions([]);
                }
            }
        );
    };

    const handleSelectPrediction = (placeId) => {
        if (!placesService.current) return;

        setIsLoading(true);
        placesService.current.getDetails(
            { placeId, fields: ['name', 'formatted_address', 'geometry', 'photos', 'international_phone_number', 'website', 'rating'] },
            async (place, status) => {
                setIsLoading(false);
                if (status === window.google.maps.places.PlacesServiceStatus.OK) {
                    // Check if already claimed in DB using an RPC or simple query
                    // For now, we pass it up and let the parent decide/check
                    onSelectPlace({ ...place, placeId });
                }
            }
        );
    };

    return (
        <div className="w-full max-w-2xl mx-auto space-y-6">
            <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold">Add a Business</h2>
                <p className="text-slate-500">Search for your business to claim it, or create a new one.</p>
            </div>

            <div className="relative">
                <Search className="absolute right-3 top-3.5 w-5 h-5 text-gray-400" />
                <Input
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    placeholder="Type business name..."
                    className="pr-10 h-12 text-lg shadow-sm"
                    autoFocus
                />
            </div>

            <div className="space-y-2">
                {isLoading && (
                    <div className="flex items-center justify-center py-4 text-blue-600">
                        <Loader2 className="w-6 h-6 animate-spin" />
                    </div>
                )}

                <AnimatePresence>
                    {predictions.map((p) => (
                        <motion.div
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            key={p.place_id}
                            className="p-4 bg-white border hover:border-blue-300 hover:shadow-md cursor-pointer rounded-xl transition-all flex items-start gap-4 group"
                            onClick={() => handleSelectPrediction(p.place_id)}
                        >
                            <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center flex-shrink-0 group-hover:bg-blue-100 transition-colors">
                                <MapPin className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="flex-grow text-right">
                                <p className="font-medium text-slate-900 text-lg group-hover:text-blue-700 transition-colors">{p.structured_formatting.main_text}</p>
                                <p className="text-sm text-slate-500">{p.structured_formatting.secondary_text}</p>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {searchTerm.length > 2 && !isLoading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="pt-4 border-t mt-4"
                    >
                        <Button
                            variant="outline"
                            className="w-full h-14 border-dashed border-2 hover:border-blue-500 hover:bg-blue-50 text-slate-600 hover:text-blue-700 justify-start px-6"
                            onClick={() => onCreateNew(searchTerm)}
                        >
                            <Plus className="w-5 h-5 mr-3" />
                            <div className="text-right">
                                <span className="block font-semibold">Create valid/new business: "{searchTerm}"</span>
                                <span className="text-xs font-normal opacity-70">If you cannot find it on the map</span>
                            </div>
                        </Button>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
