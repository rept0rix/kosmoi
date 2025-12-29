

// Remove top-level google declaration as it might be undefined when module loads


export const DataIngestionService = {
    /**
     * Search for places using Google Places TextSearch
     * @param {string} query - Search query (e.g., "Pizza in Chaweng")
     * @param {Object} location - { lat, lng } center point
     * @param {number} radius - Search radius in meters
     * @returns {Promise<Array>} List of transformed place objects
     */
    searchPlaces: async (query, location = { lat: 9.5120, lng: 100.0136 }, radius = 50000) => {
        return new Promise((resolve, reject) => {
            if (!window.google || !window.google.maps || !window.google.maps.places) {
                reject(new Error("Google Maps API not loaded"));
                return;
            }

            const timeoutId = setTimeout(() => {
                reject(new Error("Places API Search timed out"));
            }, 10000);

            const mapDiv = document.createElement('div');
            const map = new window.google.maps.Map(mapDiv, { center: location, zoom: 15 });
            const service = new window.google.maps.places.PlacesService(map);

            const request = {
                query: query,
                location: location,
                radius: radius,
            };

            service.textSearch(request, (results, status) => {
                clearTimeout(timeoutId);
                if (status === window.google.maps.places.PlacesServiceStatus.OK) {
                    const transformed = results
                        .filter(place => place.business_status === 'OPERATIONAL')
                        .map(DataIngestionService.transformBasicData);
                    resolve(transformed);
                } else {
                    reject(new Error(`Places API Error: ${status}`));
                }
            });
        });
    },

    /**
     * Fetch rich details for a specific place (Photos, Reviews, Hours)
     * @param {string} placeId 
     * @returns {Promise<Object>} Full place details
     */
    getPlaceDetails: async (placeId) => {
        return new Promise((resolve, reject) => {
            if (!window.google || !window.google.maps || !window.google.maps.places) {
                reject(new Error("Google Maps API not loaded"));
                return;
            }

            const timeoutId = setTimeout(() => {
                reject(new Error("Place Details API timed out"));
            }, 10000);

            const mapDiv = document.createElement('div');
            const map = new window.google.maps.Map(mapDiv, { center: { lat: 0, lng: 0 }, zoom: 1 });
            const service = new window.google.maps.places.PlacesService(map);

            const request = {
                placeId: placeId,
                fields: [
                    'name', 'formatted_address', 'geometry', 'photos', 'rating',
                    'user_ratings_total', 'types', 'place_id', 'formatted_phone_number',
                    'website', 'opening_hours', 'price_level', 'reviews', 'editorial_summary'
                ]
            };

            service.getDetails(request, (place, status) => {
                clearTimeout(timeoutId);
                if (status === window.google.maps.places.PlacesServiceStatus.OK) {
                    resolve(DataIngestionService.transformRichData(place));
                } else {
                    reject(new Error(`Place Details Error: ${status}`));
                }
            });
        });
    },

    /**
     * Transform basic search result into our app's internal format
     */
    transformBasicData: (googlePlace) => {
        const photoUrl = googlePlace.photos?.[0]?.getUrl({ maxWidth: 400 });
        return {
            google_place_id: googlePlace.place_id,
            business_name: googlePlace.name,
            location: googlePlace.formatted_address,
            latitude: googlePlace.geometry?.location?.lat(),
            longitude: googlePlace.geometry?.location?.lng(),
            rating: googlePlace.rating,
            user_ratings_total: googlePlace.user_ratings_total,
            types: googlePlace.types,
            // Basic search doesn't always have photos/phone/website
            photo_url: photoUrl,
            price_level: googlePlace.price_level,
            business_status: googlePlace.business_status
        };
    },

    /**
     * Transform rich details into DB-ready schema
     */
    transformRichData: (place) => {
        // Map Google types to our categories
        const category = DataIngestionService.mapCategory(place.types);

        let imageUrls = [];
        if (place.photos && place.photos.length > 0) {
            imageUrls = place.photos.slice(0, 10).map(photo => photo.getUrl({ maxWidth: 800 }));
        }

        return {
            business_name: place.name,
            category: category,
            // super_category should be derived from category in a separate util if needed, 
            // but for now we keep it simple or import the util.
            description: place.editorial_summary?.overview || `Imported from Google Maps. ${place.formatted_address}`,
            location: place.formatted_address,
            latitude: typeof place.geometry.location.lat === 'function' ? place.geometry.location.lat() : place.geometry.location.lat,
            longitude: typeof place.geometry.location.lng === 'function' ? place.geometry.location.lng() : place.geometry.location.lng,
            images: imageUrls,
            status: 'active',
            verified: true,
            average_rating: place.rating || 0,
            total_reviews: place.user_ratings_total || 0,
            google_place_id: place.place_id,
            phone: place.formatted_phone_number || null,
            website: place.website || null,
            opening_hours: place.opening_hours?.weekday_text ? JSON.stringify(place.opening_hours.weekday_text) : null,
            price_range: DataIngestionService.mapPriceLevel(place.price_level),
            reviews: place.reviews || [] // We need to handle reviews separately during import usually
        };
    },

    mapCategory: (types) => {
        if (!types || types.length === 0) return 'other';
        const typeSet = new Set(types);

        if (typeSet.has('lodging') || typeSet.has('hotel') || typeSet.has('resort')) return 'accommodation';
        if (typeSet.has('restaurant') || typeSet.has('food')) return 'restaurants';
        if (typeSet.has('cafe')) return 'cafes';
        if (typeSet.has('bar') || typeSet.has('night_club')) return 'pubs';
        if (typeSet.has('tourist_attraction')) return 'attractions';
        if (typeSet.has('health') || typeSet.has('spa')) return 'health_spa';
        if (typeSet.has('gym')) return 'gym';
        if (typeSet.has('travel_agency')) return 'tours';
        if (typeSet.has('car_rental')) return 'car_rental';
        if (typeSet.has('store') || typeSet.has('shopping_mall')) return 'shopping';

        return 'other';
    },

    mapPriceLevel: (level) => {
        switch (level) {
            case 0: return 'Free';
            case 1: return 'Inexpensive';
            case 2: return 'Moderate';
            case 3: return 'Expensive';
            case 4: return 'Very Expensive';
            default: return 'Moderate';
        }
    }
};
