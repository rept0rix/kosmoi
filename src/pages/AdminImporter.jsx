
import React, { useState, useEffect } from 'react';
import { db } from '@/api/supabaseClient';
import { supabaseAdmin } from '@/api/supabaseClient';
import GoogleMap from '@/components/GoogleMap';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, Plus, Check, MapPin, Star, Image as ImageIcon, Rocket, AlertCircle } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

/** @type {any} */
const google = (/** @type {any} */ (window)).google;

export default function AdminImporter() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [importing, setImporting] = useState({});
    const { toast } = useToast();
    const [mapReady, setMapReady] = useState(false);
    const [pagination, setPagination] = useState(null);
    const [selectedPlaces, setSelectedPlaces] = useState({});

    // Automated import state
    const [autoImporting, setAutoImporting] = useState(false);
    const [autoProgress, setAutoProgress] = useState({ current: 0, total: 0, category: '' });
    const [autoStats, setAutoStats] = useState({ imported: 0, skipped: 0, errors: 0 });

    // Areas in Koh Samui to search
    const areas = [
        'Chaweng', 'Lamai', 'Bophut', 'Maenam', 'Nathon',
        'Choeng Mon', 'Bang Rak', 'Lipa Noi', 'Taling Ngam'
    ];

    // Main business categories
    const categories = [
        'restaurant', 'hotel', 'resort', 'spa', 'massage',
        'cafe', 'bar', 'diving', 'tour', 'rental',
        'pharmacy', 'supermarket', 'temple', 'beach'
    ];

    // Generate all search combinations (category + area)
    const searchCategories = [];
    categories.forEach(cat => {
        areas.forEach(area => {
            searchCategories.push(`${cat} ${area} `);
        });
    });

    const { data: user } = useQuery({
        queryKey: ["currentUser"],
        queryFn: () => db.auth.me(),
    });

    // Create admin db helper that uses service role key
    const adminDb = {
        entities: {
            ServiceProvider: {
                create: async (data) => {
                    const { data: result, error } = await supabaseAdmin
                        .from('service_providers')
                        .insert(data)
                        .select()
                        .single();
                    if (error) throw error;
                    return result;
                }
            }
        }
    };

    useEffect(() => {
        // Check if map script is loaded
        const interval = setInterval(() => {
            if ((/** @type {any} */ (window)).google && (/** @type {any} */ (window)).google.maps && (/** @type {any} */ (window)).google.maps.places) {
                setMapReady(true);
                clearInterval(interval);
            }
        }, 100);

        return () => clearInterval(interval);
    }, []);

    const searchPlaces = async (nextPage = false) => {
        if (!mapReady) {
            toast({
                title: "Google Maps טוען...",
                description: "אנא המתן מספר שניות ונסה שוב",
                variant: "destructive"
            });
            return;
        }

        setLoading(true);
        if (!nextPage) {
            setResults([]);
            setPagination(null);
            setSelectedPlaces({});
        }

        try {
            if (nextPage && pagination && pagination.hasNextPage) {
                pagination.nextPage();
                return;
            }

            const mapDiv = document.createElement('div');
            const map = new (/** @type {any} */ (window)).google.maps.Map(mapDiv, {
                center: { lat: 9.5, lng: 100.0 },
                zoom: 12
            });

            const service = new (/** @type {any} */ (window)).google.maps.places.PlacesService(map);

            const koSamuiCenter = { lat: 9.5, lng: 100.0 };
            const searchRadius = 25000;

            const request = {
                query: query,
                location: koSamuiCenter,
                radius: searchRadius,
                fields: ['name', 'formatted_address', 'geometry', 'photos', 'rating', 'user_ratings_total', 'types', 'place_id', 'formatted_phone_number', 'website', 'opening_hours', 'price_level']
            };

            service.textSearch(request, (newResults, status, paginationObj) => {
                if (status === (/** @type {any} */ (window)).google.maps.places.PlacesServiceStatus.OK) {
                    if (nextPage) {
                        setResults(prev => [...prev, ...newResults]);
                    } else {
                        setResults(newResults);
                    }
                    setPagination(paginationObj);
                } else {
                    toast({
                        title: "שגיאה בחיפוש",
                        description: `סטטוס: ${status} `,
                        variant: "destructive"
                    });
                }
                setLoading(false);
            });

        } catch (error) {
            console.error("Search error:", error);
            toast({
                title: "שגיאה בחיפוש",
                description: error.message,
                variant: "destructive"
            });
            setLoading(false);
        }
    };

    const mapCategory = (types) => {
        if (!types || types.length === 0) return 'other';

        // Priority mapping
        if (types.includes('restaurant') || types.includes('food')) return 'restaurant';
        if (types.includes('lodging') || types.includes('hotel') || types.includes('resort')) return 'hotel';
        if (types.includes('spa') || types.includes('health')) return 'spa';
        if (types.includes('cafe')) return 'cafe';
        if (types.includes('bar') || types.includes('night_club')) return 'bar';
        if (types.includes('shopping_mall') || types.includes('store')) return 'shopping';
        if (types.includes('tourist_attraction')) return 'attraction';

        // Default to the first type if no specific mapping
        return types[0];
    };

    const mapPriceLevel = (level) => {
        switch (level) {
            case 0: return 'Free';
            case 1: return 'Inexpensive';
            case 2: return 'Moderate';
            case 3: return 'Expensive';
            case 4: return 'Very Expensive';
            default: return null;
        }
    };

    const importPlace = async (place, retryCount = 0) => {
        try {
            setImporting(prev => ({ ...prev, [place.place_id]: true }));

            const existing = await db.entities.ServiceProvider.filter({
                google_place_id: place.place_id
            });

            if (existing && existing.length > 0) {
                setImporting(prev => ({ ...prev, [place.place_id]: 'exists' }));
                return false;
            }

            // Fetch details for reviews and more photos
            const mapDiv = document.createElement('div');
            const map = new (/** @type {any} */ (window)).google.maps.Map(mapDiv, { center: { lat: 0, lng: 0 }, zoom: 1 });
            const service = new (/** @type {any} */ (window)).google.maps.places.PlacesService(map);

            const details = await new Promise((resolve, reject) => {
                service.getDetails({
                    placeId: place.place_id,
                    fields: ['name', 'formatted_address', 'geometry', 'photos', 'rating', 'user_ratings_total', 'types', 'place_id', 'formatted_phone_number', 'website', 'opening_hours', 'price_level', 'reviews']
                }, (result, status) => {
                    if (status === (/** @type {any} */ (window)).google.maps.places.PlacesServiceStatus.OK) {
                        resolve(result);
                    } else {
                        resolve(null); // Fallback to basic place data if details fail
                    }
                });
            });

            const sourcePlace = details || place;

            let imageUrls = [];
            if (sourcePlace.photos && sourcePlace.photos.length > 0) {
                // Get up to 10 photos
                imageUrls = sourcePlace.photos.slice(0, 10).map(photo => photo.getUrl({ maxWidth: 800 }));
            }

            // Validate required fields
            if (!sourcePlace.name || !sourcePlace.geometry || !sourcePlace.geometry.location) {
                console.warn("Skipping place due to missing data:", sourcePlace);
                return false;
            }

            const businessData = {
                business_name: sourcePlace.name,
                category: mapCategory(sourcePlace.types),
                description: `Imported from Google Maps.${sourcePlace.formatted_address || ''} `,
                location: sourcePlace.formatted_address || 'Koh Samui, Thailand',
                latitude: typeof sourcePlace.geometry.location.lat === 'function' ? sourcePlace.geometry.location.lat() : sourcePlace.geometry.location.lat,
                longitude: typeof sourcePlace.geometry.location.lng === 'function' ? sourcePlace.geometry.location.lng() : sourcePlace.geometry.location.lng,
                images: imageUrls,
                status: 'active',
                verified: true,
                average_rating: sourcePlace.rating || 0,
                total_reviews: sourcePlace.user_ratings_total || 0,
                google_place_id: sourcePlace.place_id,
                phone: sourcePlace.formatted_phone_number || "0000000000",
                website: sourcePlace.website || null,
                opening_hours: sourcePlace.opening_hours?.weekday_text ? JSON.stringify(sourcePlace.opening_hours.weekday_text) : null,
                price_range: mapPriceLevel(sourcePlace.price_level),
                created_by: user?.email || "admin@kosamui.com"
            };

            // Ensure lat/lng are numbers
            if (isNaN(businessData.latitude) || isNaN(businessData.longitude)) {
                console.error("Invalid coordinates for place:", sourcePlace.name);
                return false;
            }

            const newProvider = await adminDb.entities.ServiceProvider.create(businessData);

            // Import Reviews
            if (sourcePlace.reviews && sourcePlace.reviews.length > 0 && newProvider?.id) {
                for (const review of sourcePlace.reviews) {
                    try {
                        await db.entities.Review.create({
                            service_provider_id: newProvider.id,
                            user_id: user?.id, // Assigned to admin for now, or null if schema allows
                            rating: review.rating,
                            comment: review.text,
                            author_name: review.author_name,
                            created_at: new Date(review.time * 1000).toISOString()
                        });
                    } catch (err) {
                        console.warn("Failed to import review:", err);
                    }
                }
            }

            setImporting(prev => ({ ...prev, [place.place_id]: 'done' }));
            return true;

        } catch (error) {
            // Retry logic
            if (retryCount < 2) {
                console.log(`Retrying import for ${place.name}(Attempt ${retryCount + 2})...`);
                await new Promise(resolve => setTimeout(resolve, 1000));
                return importPlace(place, retryCount + 1);
            }

            console.error("FULL IMPORT ERROR:", error); // Log the full error object
            console.error("Error details:", error.message, error.details, error.hint);

            if (error.message && error.message.includes('duplicate key')) {
                setImporting(prev => ({ ...prev, [place.place_id]: 'exists' }));
            } else {
                // Don't show toast for every error in bulk import to avoid spamming
                if (!autoImporting) {
                    toast({
                        title: "שגיאה בייבוא",
                        description: error.message || "Unknown error",
                        variant: "destructive"
                    });
                }
                setImporting(prev => ({ ...prev, [place.place_id]: false }));
            }
            return false;
        }
    };

    const handleSingleImport = async (place) => {
        const success = await importPlace(place);
        if (success) {
            toast({
                title: "העסק יובא בהצלחה",
                description: `${place.name} נוסף למערכת`,
            });
        }
    };

    const toggleSelection = (placeId) => {
        setSelectedPlaces(prev => ({
            ...prev,
            [placeId]: !prev[placeId]
        }));
    };

    const toggleSelectAll = () => {
        const allSelected = results.every(r => selectedPlaces[r.place_id]);
        const newSelection = {};
        if (!allSelected) {
            results.forEach(r => {
                newSelection[r.place_id] = true;
            });
        }
        setSelectedPlaces(newSelection);
    };

    const importSelected = async () => {
        const placesToImport = results.filter(r => selectedPlaces[r.place_id]);
        let successCount = 0;

        for (const place of placesToImport) {
            const success = await importPlace(place);
            if (success) successCount++;
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        toast({
            title: "ייבוא הושלם",
            description: `${successCount} עסקים יובאו בהצלחה`,
        });
        setSelectedPlaces({});
    };

    const selectedCount = Object.values(selectedPlaces).filter(Boolean).length;

    // Automated bulk import function
    const startAutomatedImport = async () => {
        // Check if Google Maps is ready
        if (!(/** @type {any} */ (window)).google || !(/** @type {any} */ (window)).google.maps || !(/** @type {any} */ (window)).google.maps.places) {
            toast({
                title: "Google Maps לא מוכן",
                description: "אנא המתן מספר שניות ונסה שוב",
                variant: "destructive"
            });
            return;
        }

        setAutoImporting(true);
        const stats = { imported: 0, skipped: 0, errors: 0 };
        setAutoStats(stats);
        setAutoProgress({ current: 0, total: searchCategories.length, category: '' });

        // Load completed categories from localStorage
        const completedCategories = JSON.parse(localStorage.getItem('completedCategories') || '[]');
        let skippedCategories = 0;

        for (let i = 0; i < searchCategories.length; i++) {
            const category = searchCategories[i];

            // Skip if already completed successfully
            if (completedCategories.includes(category)) {
                skippedCategories++;
                continue;
            }

            setAutoProgress({ current: i + 1, total: searchCategories.length, category });

            let categoryErrors = 0;

            try {
                // Search for this category using a promise wrapper
                const searchResults = await new Promise((resolve) => {
                    setQuery(category);

                    setTimeout(() => {
                        const mapDiv = document.createElement('div');
                        const map = new (/** @type {any} */ (window)).google.maps.Map(mapDiv, {
                            center: { lat: 9.5, lng: 100.0 },
                            zoom: 12
                        });

                        const service = new (/** @type {any} */ (window)).google.maps.places.PlacesService(map);
                        const koSamuiCenter = { lat: 9.5, lng: 100.0 };
                        const searchRadius = 25000;

                        const request = {
                            query: category + " Koh Samui",
                            location: koSamuiCenter,
                            radius: searchRadius,
                            fields: ['name', 'formatted_address', 'geometry', 'photos', 'rating', 'user_ratings_total', 'types', 'place_id', 'formatted_phone_number', 'website', 'opening_hours', 'price_level']
                        };

                        service.textSearch(request, (newResults, status) => {
                            if (status === (/** @type {any} */ (window)).google.maps.places.PlacesServiceStatus.OK) {
                                resolve(newResults || []);
                            } else {
                                resolve([]);
                            }
                        });
                    }, 500);
                });

                // Import all results from this search
                for (const place of searchResults) {
                    const success = await importPlace(place);
                    if (success) {
                        stats.imported++;
                        setAutoStats({ ...stats });
                    } else {
                        if (importing[place.place_id] === 'exists') {
                            stats.skipped++;
                            setAutoStats({ ...stats });
                        } else {
                            stats.errors++;
                            categoryErrors++;
                            setAutoStats({ ...stats });
                        }
                    }
                    await new Promise(resolve => setTimeout(resolve, 300));
                }

                // If no errors in this category, mark as completed
                if (categoryErrors === 0 && searchResults.length > 0) {
                    completedCategories.push(category);
                    localStorage.setItem('completedCategories', JSON.stringify(completedCategories));
                }

            } catch (error) {
                console.error(`Error importing category ${category}: `, error);
                stats.errors++;
                setAutoStats({ ...stats });
            }

            // Delay between categories
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        setAutoImporting(false);
        toast({
            title: "ייבוא אוטומטי הושלם!",
            description: `יובאו: ${stats.imported} | דולגו: ${stats.skipped} | שגיאות: ${stats.errors} | קטגוריות שדולגו: ${skippedCategories} `,
        });
    };

    const resetProgress = () => {
        localStorage.removeItem('completedCategories');
        toast({
            title: "ההתקדמות אופסה",
            description: "בייבוא הבא המערכת תעבור על כל הקטגוריות מחדש",
        });
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8" dir="rtl">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold mb-8">ייבוא עסקים מגוגל</h1>

                <Alert variant="destructive" className="mb-6 bg-red-50 border-red-200">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>פתרון בעיות תמונות</AlertTitle>
                    <AlertDescription>
                        אם התמונות מופיעות כשבורות (מפה עם איקס אדום), יש לוודא שמוגדר <strong>Billing Account</strong> בפרויקט Google Cloud שלך וש-<strong>Places API</strong> פעיל.
                    </AlertDescription>
                </Alert>

                {/* Automated Import Section */}
                <Card className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-2xl font-bold text-blue-900 mb-2 flex items-center gap-2">
                                    <Rocket className="w-6 h-6" />
                                    ייבוא אוטומטי המוני
                                </h2>
                                <p className="text-gray-700">לחץ כאן כדי לייבא אוטומטית את כל העסקים מכל הקטגוריות ({searchCategories.length} קטגוריות)</p>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    onClick={resetProgress}
                                    disabled={autoImporting}
                                    variant="outline"
                                    className="border-blue-200 text-blue-700 hover:bg-blue-50"
                                >
                                    אפס התקדמות
                                </Button>
                                <Button
                                    onClick={startAutomatedImport}
                                    disabled={autoImporting}
                                    size="lg"
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg"
                                >
                                    {autoImporting ? (
                                        <>
                                            <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                                            מייבא...
                                        </>
                                    ) : (
                                        'התחל ייבוא'
                                    )}
                                </Button>
                            </div>
                        </div>

                        {/* Progress Display */}
                        {autoImporting && (
                            <div className="mt-4 space-y-3">
                                <div className="flex justify-between text-sm text-gray-700">
                                    <span>קטגוריה: <strong>{autoProgress.category}</strong></span>
                                    <span>{autoProgress.current} / {autoProgress.total}</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-3">
                                    <div
                                        className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                                        style={{ width: `${(autoProgress.current / autoProgress.total) * 100}% ` }}
                                    ></div>
                                </div>
                                <div className="flex gap-4 text-sm">
                                    <span className="text-green-600">✓ יובאו: {autoStats.imported}</span>
                                    <span className="text-yellow-600">⊘ דולגו: {autoStats.skipped}</span>
                                    <span className="text-red-600">✗ שגיאות: {autoStats.errors}</span>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Manual Search Section */}
                <Card className="mb-6">
                    <CardContent className="p-6">
                        <h3 className="text-lg font-semibold mb-4">חיפוש ידני (אופציונלי)</h3>
                        <div className="flex gap-4">
                            <Input
                                placeholder="חפש עסקים (למשל: restaurants)..."
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && searchPlaces()}
                                className="text-lg"
                            />
                            <Button onClick={() => searchPlaces()} disabled={loading} className="w-32">
                                {loading ? <Loader2 className="animate-spin" /> : <Search />}
                                <span className="mr-2">חפש</span>
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {results.length > 0 && (
                    <div className="mb-4 flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                className="w-5 h-5 rounded border-gray-300"
                                checked={results.length > 0 && results.every(r => selectedPlaces[r.place_id])}
                                onChange={toggleSelectAll}
                            />
                            <span className="text-sm font-medium">בחר הכל</span>
                        </div>
                        {selectedCount > 0 && (
                            <Button onClick={importSelected} className="bg-green-600 hover:bg-green-700 text-white gap-2">
                                <Plus className="w-4 h-4" />
                                ייבא {selectedCount} נבחרים
                            </Button>
                        )}
                    </div>
                )}

                <div className="grid gap-4">
                    {results.map((place) => (
                        <Card key={place.place_id} className="overflow-hidden">
                            <CardContent className="p-4">
                                <div className="flex gap-4">
                                    <input
                                        type="checkbox"
                                        className="w-5 h-5 rounded border-gray-300 mt-1"
                                        checked={selectedPlaces[place.place_id] || false}
                                        onChange={() => toggleSelection(place.place_id)}
                                    />

                                    <div className="relative w-32 h-32 flex-shrink-0 bg-gray-100 rounded overflow-hidden">
                                        {place.photos && place.photos.length > 0 ? (
                                            <img
                                                src={place.photos[0].getUrl({ maxWidth: 200 })}
                                                alt={place.name}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    e.currentTarget.style.display = 'none';
                                                    const fallback = /** @type {HTMLElement} */ (e.currentTarget.parentElement?.querySelector('.fallback-icon'));
                                                    if (fallback) {
                                                        fallback.style.display = 'flex';
                                                    }
                                                }}
                                            />
                                        ) : null}
                                        <div className="fallback-icon w-full h-full flex items-center justify-center text-gray-400 absolute top-0 left-0" style={{ display: place.photos && place.photos.length > 0 ? 'none' : 'flex' }}>
                                            <ImageIcon />
                                        </div>
                                    </div>

                                    <div className="flex-1">
                                        <h3 className="font-bold text-lg mb-1">{place.name}</h3>
                                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                                            <MapPin className="w-4 h-4" />
                                            <span>{place.formatted_address}</span>
                                        </div>
                                        {place.rating && (
                                            <div className="flex items-center gap-2 text-sm mb-2">
                                                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                                <span className="font-medium">{place.rating}</span>
                                                <span className="text-gray-500">({place.user_ratings_total} ביקורות)</span>
                                            </div>
                                        )}
                                        <div className="flex gap-2 flex-wrap">
                                            {place.types?.slice(0, 3).map((type, idx) => (
                                                <Badge key={idx} variant="secondary" className="">
                                                    {type}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex-shrink-0">
                                        <Button
                                            onClick={() => handleSingleImport(place)}
                                            disabled={importing[place.place_id] === true || importing[place.place_id] === 'done' || importing[place.place_id] === 'exists'}
                                            className="gap-2"
                                        >
                                            {importing[place.place_id] === true && <Loader2 className="w-4 h-4 animate-spin" />}
                                            {importing[place.place_id] === 'done' && <Check className="w-4 h-4" />}
                                            {importing[place.place_id] === 'exists' && <Check className="w-4 h-4" />}
                                            {importing[place.place_id] === 'done' ? 'יובא' : importing[place.place_id] === 'exists' ? 'קיים' : importing[place.place_id] ? 'מייבא...' : 'ייבא'}
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {pagination && pagination.hasNextPage && (
                    <div className="mt-6 text-center">
                        <Button onClick={() => searchPlaces(true)} disabled={loading} className="gap-2">
                            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                            טען עוד תוצאות
                        </Button>
                    </div>
                )}


                {/* Hidden map component to load Google Maps Script */}
                <div className="hidden">
                    <GoogleMap />
                </div>
            </div>
        </div>
    );
}
