import React, { useState, useEffect } from 'react';
import { db } from '@/api/supabaseClient';
import { supabaseAdmin } from '@/api/supabaseClient';
import GoogleMap from '@/components/GoogleMap';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, Plus, Check, MapPin, Star, Image as ImageIcon, Rocket, AlertCircle, Database, CheckCircle, Upload } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import seedData from '@/data/samui_real_data_seed.json';
import { subCategoriesBySuperCategory } from '@/components/subCategories';
import AutomatedImportPanel from './admin/AutomatedImportPanel';
import { getSuperCategory } from '@/utils/categoryMapping';

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

    // Seed Data State
    const [isSeeding, setIsSeeding] = useState(false);



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



    const handleSeedData = async () => {
        setIsSeeding(true);
        try {
            // console.log("Starting quick seed...");

            // Map seed data to database schema
            const rows = seedData.map(item => ({
                business_name: item.title,
                category: item.category,
                super_category: getSuperCategory(item.category),
                description: item.description,
                location: item.location,
                phone: item.contact || null,
                website: null,
                average_rating: item.rating,
                total_reviews: 0,
                status: 'active',
                verified: true,
                created_by: user?.email || 'system',
                metadata: {
                    sub_category: item.sub_category,
                    price_range: item.price_range,
                    tags: item.tags,
                    image_url: item.image_url
                },
                created_at: new Date().toISOString()
            }));

            // Insert into Supabase
            const { data, error } = await supabaseAdmin.from('service_providers').insert(rows).select();

            if (error) {
                console.error("Supabase insert error:", error);
                throw error;
            }

            toast({
                title: "Seeding Complete",
                description: `Successfully injected ${rows.length} real venues into the database.`,
                className: "bg-green-50 border-green-200"
            });
        } catch (error) {
            console.error("Seeding error:", error);
            toast({
                title: "Seeding Failed",
                description: error.message || "Unknown error during seeding",
                variant: "destructive"
            });
        } finally {
            setIsSeeding(false);
        }
    };

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
                        description: `סטטוס: ${status}`,
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

        // Map Google types to our schema categories
        if (types.includes('plumber')) return 'plumber';
        if (types.includes('electrician')) return 'electrician';
        if (types.includes('locksmith')) return 'locksmith';
        if (types.includes('painter')) return 'painter';
        if (types.includes('roofing_contractor') || types.includes('general_contractor')) return 'handyman';

        if (types.includes('restaurant') || types.includes('food')) return 'restaurants';
        if (types.includes('cafe')) return 'cafes';
        if (types.includes('bar') || types.includes('night_club')) return 'pubs';
        if (types.includes('bakery')) return 'sweets';
        if (types.includes('meal_delivery') || types.includes('meal_takeaway')) return 'delivery';

        if (types.includes('lodging') || types.includes('hotel') || types.includes('resort')) return 'accommodation';

        if (types.includes('spa') || types.includes('health')) return 'health_spa';
        if (types.includes('park')) return 'parks_gardens';
        if (types.includes('gym')) return 'gym';
        if (types.includes('tourist_attraction')) return 'attractions';

        if (types.includes('shopping_mall') || types.includes('department_store')) return 'department_store';
        if (types.includes('clothing_store')) return 'fashion';
        if (types.includes('electronics_store')) return 'electronics';
        if (types.includes('supermarket') || types.includes('grocery_or_supermarket') || types.includes('convenience_store')) return 'food_beverages';
        if (types.includes('furniture_store') || types.includes('home_goods_store')) return 'furniture';
        if (types.includes('florist')) return 'flowers';

        if (types.includes('pharmacy')) return 'pharmacies';
        if (types.includes('hospital') || types.includes('doctor') || types.includes('dentist')) return 'health';
        if (types.includes('beauty_salon') || types.includes('hair_care')) return 'beauty';
        if (types.includes('laundry')) return 'laundry';
        if (types.includes('real_estate_agency')) return 'real_estate_agent';
        if (types.includes('car_repair')) return 'car_mechanic';
        if (types.includes('car_rental')) return 'car_rental';

        return 'other';
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
                        resolve(null);
                    }
                });
            });

            const sourcePlace = details || place;

            let imageUrls = [];
            if (sourcePlace.photos && sourcePlace.photos.length > 0) {
                imageUrls = sourcePlace.photos.slice(0, 10).map(photo => photo.getUrl({ maxWidth: 800 }));
            }

            if (!sourcePlace.name || !sourcePlace.geometry || !sourcePlace.geometry.location) {
                console.warn("Skipping place due to missing data:", sourcePlace);
                return false;
            }

            const category = mapCategory(sourcePlace.types);
            const super_category = getSuperCategory(category);

            const businessData = {
                business_name: sourcePlace.name,
                category: category,
                super_category: super_category,
                description: `Imported from Google Maps. ${sourcePlace.formatted_address || ''}`,
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

            const newProvider = await adminDb.entities.ServiceProvider.create(businessData);

            if (sourcePlace.reviews && sourcePlace.reviews.length > 0 && newProvider?.id) {
                for (const review of sourcePlace.reviews) {
                    try {
                        await db.entities.Review.create({
                            service_provider_id: newProvider.id,
                            user_id: user?.id,
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
            if (retryCount < 2) {
                await new Promise(resolve => setTimeout(resolve, 1000));
                return importPlace(place, retryCount + 1);
            }

            if (error.message && error.message.includes('duplicate key')) {
                setImporting(prev => ({ ...prev, [place.place_id]: 'exists' }));
            } else {
                // If we are calling this from the automated panel, we don't want to show toasts for every error
                // The Panel manages its own error count.
                // However, we don't have 'autoImporting' state here anymore. 
                // Using a check for user interaction or passed context would be better, but for now:
                console.error("Import error:", error);

                // We show toast only if it looks like a manual action error, 
                // but checking `importing` state is tricky since we set it to true.
                // Let's rely on the assumption that if it's a bulk operation, the toast spam is bad.
                // But preventing it without the state is hard.
                // Re-introducing a minimal check:
                if (Object.keys(importing).length < 5) { // Heuristic: if many items are importing, don't toast
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



    return (
        <div className="min-h-screen bg-gray-50 p-8" dir="rtl">
            <div className="max-w-4xl mx-auto space-y-8">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                        <Database className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Data Injection Center</h1>
                        <p className="text-gray-500">Populate the Kosmoi Hub with verified intelligence.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Quick Seed Card */}
                    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100">
                        <CardHeader>
                            <CardTitle className="text-blue-900">Quick Seed (Phase 1)</CardTitle>
                            <CardDescription className="text-blue-600">Inject "Top 10" listings for immediate testing.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-blue-700/80 mb-6">
                                Loads 10 verified venues: Coco Tam's, Jungle Club, W Hotel, and more.
                                Use this to demonstrate capabilities instantly.
                            </p>
                            <Button
                                onClick={handleSeedData}
                                disabled={isSeeding}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200"
                            >
                                {isSeeding ? (
                                    <span className="flex items-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Injecting Data...
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4" />
                                        Inject Real Data
                                    </span>
                                )}
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Manual Import Card (Placeholder) */}
                    <Card>
                        <CardHeader>
                            <CardTitle>CSV Import</CardTitle>
                            <CardDescription>Upload bulk data from external sources.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:bg-gray-50 transition-colors cursor-pointer">
                                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                <p className="text-sm text-gray-500">Drag & drop CSV here</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Alert variant="destructive" className="bg-red-50 border-red-200">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>פתרון בעיות תמונות</AlertTitle>
                    <AlertDescription>
                        אם התמונות מופיעות כשבורות (מפה עם איקס אדום), יש לוודא שמוגדר <strong>Billing Account</strong> בפרויקט Google Cloud שלך וש-<strong>Places API</strong> פעיל.
                    </AlertDescription>
                </Alert>

                {/* Automated Import Section */}
                <AutomatedImportPanel importPlace={importPlace} importing={importing} />

                {/* Manual Search Section */}
                <Card>
                    <CardContent className="p-6">
                        <h3 className="text-lg font-semibold mb-4">חיפוש ידני (אופציונלי)</h3>
                        <div className="flex gap-4">
                            <Input
                                placeholder="חפש עסקים (למשל: restaurants)..."
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && searchPlaces()}
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
                                                    if (fallback) fallback.style.display = 'flex';
                                                }}
                                            />
                                        ) : null}
                                        <div className="fallback-icon w-full h-full flex items-center justify-center text-gray-400 absolute top-0 left-0 bg-gray-50" style={{ display: place.photos && place.photos.length > 0 ? 'none' : 'flex' }}>
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
                                                <Badge key={idx} variant="secondary">
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


                <div className="hidden">
                    <GoogleMap />
                </div>
            </div>
        </div>
    );
}
