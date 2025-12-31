

// Remove top-level google declaration as it might be undefined when module loads


export const DataIngestionService = {
    /**
     * Search for places using Google Places TextSearch
     * @param {string} query - Search query (e.g., "Pizza in Chaweng")
     * @param {Object} location - { lat, lng } center point
     * @param {number} radius - Search radius in meters
     * @returns {Promise<Array>} List of transformed place objects
     */
    _serviceInstance: null,
    _mapInstance: null,

    /**
     * Get or create the Singleton PlacesService
     */
    getService: () => {
        if (!window.google || !window.google.maps || !window.google.maps.places) {
            throw new Error("Google Maps API not loaded");
        }
        if (!DataIngestionService._serviceInstance) {
            console.log("[DataIngestion] Initializing Singleton Map Service");
            const mapDiv = document.createElement('div');
            DataIngestionService._mapInstance = new window.google.maps.Map(mapDiv, { center: { lat: 9.5120, lng: 100.0136 }, zoom: 15 });
            DataIngestionService._serviceInstance = new window.google.maps.places.PlacesService(DataIngestionService._mapInstance);
        }
        return DataIngestionService._serviceInstance;
    },

    searchPlaces: async (query, location = { lat: 9.5120, lng: 100.0136 }, radius = 50000) => {
        if (!window.google || !window.google.maps || !window.google.maps.places) {
            throw new Error("Google Maps API (Places Library) not loaded. Ensure 'places' library is included.");
        }

        try {
            const { Place } = window.google.maps.places;
            const center = new window.google.maps.LatLng(location.lat, location.lng);

            // Perform Text Search (New API)
            const { places } = await Place.searchByText({
                textQuery: query,
                locationBias: center, // Bias towards Samui
                fields: [
                    'id',
                    'displayName',
                    'formattedAddress',
                    'location',
                    'rating',
                    'userRatingCount',
                    'types',
                    'priceLevel',
                    'businessStatus',
                    'photos'
                ],
                isOpenNow: false, // Optional: set based on requirements
            });

            if (!places || places.length === 0) {
                return [];
            }

            // Transform results
            const transformed = places
                .filter(place => place.businessStatus === 'OPERATIONAL')
                .map(DataIngestionService.transformBasicData);

            return transformed;

        } catch (error) {
            console.error("[DataIngestion] Search Error:", error);
            throw new Error(`Places API Search Failed: ${error.message}`);
        }
    },

    /**
     * Fetch rich details for a specific place using the new API
     * @param {string} placeId 
     * @returns {Promise<Object>} Full place details
     */
    getPlaceDetails: async (placeId) => {
        if (!window.google || !window.google.maps || !window.google.maps.places) {
            throw new Error("Google Maps API not loaded");
        }

        console.log(`[DataIngestion] Starting getPlaceDetails for ${placeId}`);
        try {
            const { Place } = window.google.maps.places;
            // Create a Place instance with the ID
            const place = new Place({ id: placeId });

            // Fetch detail fields
            console.time(`fetchFields-${placeId}`);
            await place.fetchFields({
                fields: [
                    'displayName',
                    'formattedAddress',
                    'location',
                    'photos',
                    'rating',
                    'userRatingCount',
                    'types',
                    'id',
                    'nationalPhoneNumber',
                    'websiteURI',
                    'regularOpeningHours',
                    'priceLevel',
                    'reviews',
                    'editorialSummary'
                ]
            });
            console.timeEnd(`fetchFields-${placeId}`);

            console.debug(`[DataIngestion] Details fetched for ${placeId}:`, place.displayName);
            return DataIngestionService.transformRichData(place);

        } catch (error) {
            console.warn(`[DataIngestion] Details failed for ${placeId}:`, error);
            throw new Error(`Place Details Error: ${error.message}`);
        }
    },

    /**
     * Transform basic search result (Place object) into our app's internal format
     */
    transformBasicData: (place) => {
        // Prepare photo URL if available
        let photoUrl = null;
        if (place.photos && place.photos.length > 0) {
            // New API photos have getURI()
            photoUrl = place.photos[0].getURI({ maxWidth: 400 });
        }

        return {
            google_place_id: place.id,
            business_name: place.displayName,
            location: place.formattedAddress,
            latitude: place.location?.lat(),
            longitude: place.location?.lng(),
            rating: place.rating,
            user_ratings_total: place.userRatingCount,
            types: place.types,
            photo_url: photoUrl,
            price_level: place.priceLevel, // Check mapping if enum changed
            business_status: place.businessStatus
        };
    },

    /**
     * Transform rich details (Place object) into DB-ready schema
     */
    transformRichData: (place) => {
        // Map Google types to our categories
        const category = DataIngestionService.mapCategory(place.types);

        let imageUrls = [];
        if (place.photos && place.photos.length > 0) {
            imageUrls = place.photos.slice(0, 10).map(photo => photo.getURI({ maxWidth: 800 }));
        }

        return {
            business_name: place.displayName,
            category: category,
            description: place.editorialSummary || `Imported from Google Maps. ${place.formattedAddress}`,
            location: place.formattedAddress,
            latitude: place.location?.lat(),
            longitude: place.location?.lng(),
            images: imageUrls,
            status: 'active',
            verified: true,
            average_rating: place.rating || 0,
            total_reviews: place.userRatingCount || 0,
            google_place_id: place.id,
            phone: place.nationalPhoneNumber || null,
            website: place.websiteURI || null,
            opening_hours: place.regularOpeningHours?.weekdayDescriptions ? JSON.stringify(place.regularOpeningHours.weekdayDescriptions) : null,
            price_range: DataIngestionService.mapPriceLevel(place.priceLevel),
            reviews: place.reviews || []
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
