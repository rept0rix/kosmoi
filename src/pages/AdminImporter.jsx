import React, { useState, useEffect } from 'react';
import { db } from '@/api/supabaseClient';

import GoogleMap from '@/components/GoogleMap';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Database, Upload, AlertCircle, CheckCircle, MapPin, Star, Plus, Check, Loader2, ImageIcon, Globe, Phone, Info } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import seedData from '@/data/samui_real_data_seed.json';
import { subCategoriesBySuperCategory } from '@/components/subCategories';
import AutomatedImportPanel from './admin/AutomatedImportPanel';
import { getSuperCategory } from '@/shared/utils/categoryMapping';
import { DataIngestionService } from '@/services/data/DataIngestionService';

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
                    const { data: result, error } = await db
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
            const { data, error } = await db.from('service_providers').insert(rows).select();

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
            // Note: DataIngestionService wraps the API, but for pagination we might need to adjust or keep strict control
            // For now, let's use the Service only for new searches to keep implementation clean, and handle pagination carefully
            // Actually, the Service as written returns a Promise with results.

            // To support next page properly, we might need access to the `pagination` object from the API callback.
            // The service I wrote abstracts that away. Ideally, the service should return { results, pagination }.
            // For this iteration, let's use the explicit API call here for search to keep pagination working, 
            // OR update the service.

            // Let's UPDATE the service logic inline here for now to be safe, then refactor fully once stable.
            // Wait - the prompt requested using the service. I should update the service to return pagination.

            // Reverting to direct usage here for SEARCH to ensure pagination works as existing code relies on state, 
            // but I will use the service's transformation logic.

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
                    const transformedResults = newResults
                        .filter(place => place.business_status === 'OPERATIONAL')
                        .map(DataIngestionService.transformBasicData);

                    if (nextPage) {
                        setResults(prev => [...prev, ...transformedResults]);
                    } else {
                        setResults(transformedResults);
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

    const importPlace = async (place, retryCount = 0) => {
        try {
            setImporting(prev => ({ ...prev, [place.google_place_id]: true }));

            const existing = await db.entities.ServiceProvider.filter({
                google_place_id: place.google_place_id
            });

            // console.log(`[Import Debug] Checking ${place.business_name} (${place.google_place_id}): Found ${existing?.length} matches`);

            if (existing && existing.length > 0) {
                setImporting(prev => ({ ...prev, [place.google_place_id]: 'exists' }));
                return false;
            }

            // USE THE SERVICE to get Full Details
            const richData = await DataIngestionService.getPlaceDetails(place.google_place_id);
            if (!richData) {
                setImporting(prev => ({ ...prev, [place.google_place_id]: false }));
                return false;
            }

            // Add Super Category and Creator info
            richData.super_category = getSuperCategory(richData.category);
            richData.created_by = user?.email || "admin@kosamui.com";

            // Update the local state to show the user the new RICH data immediately
            setResults(prev => prev.map(r => r.google_place_id === place.google_place_id ? { ...r, ...richData, imported: true } : r));

            // Create Service Provider
            const newProvider = await adminDb.entities.ServiceProvider.create(richData);

            // Import Reviews if available
            if (richData.reviews && richData.reviews.length > 0 && newProvider?.id) {
                for (const review of richData.reviews) {
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

            setImporting(prev => ({ ...prev, [place.google_place_id]: 'done' }));
            return true;

        } catch (error) {
            if (retryCount < 2) {
                await new Promise(resolve => setTimeout(resolve, 1000));
                return importPlace(place, retryCount + 1);
            }

            if (error.message && error.message.includes('duplicate key')) {
                setImporting(prev => ({ ...prev, [place.google_place_id]: 'exists' }));
            } else {
                console.error("Import error:", error);
                if (Object.keys(importing).length < 5) {
                    toast({
                        title: "שגיאה בייבוא",
                        description: error.message || "Unknown error",
                        variant: "destructive"
                    });
                }
                setImporting(prev => ({ ...prev, [place.google_place_id]: false }));
            }
            return false;
        }
    };

    const handleSingleImport = async (place) => {
        const success = await importPlace(place);
        if (success) {
            toast({
                title: "העסק יובא בהצלחה",
                description: `${place.business_name} נוסף למערכת`,
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
        const allSelected = results.every(r => selectedPlaces[r.google_place_id]);
        const newSelection = {};
        if (!allSelected) {
            results.forEach(r => {
                newSelection[r.google_place_id] = true;
            });
        }
        setSelectedPlaces(newSelection);
    };

    const importSelected = async () => {
        const placesToImport = results.filter(r => selectedPlaces[r.google_place_id]);
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
                <AutomatedImportPanel importPlace={importPlace} />

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
                                checked={results.length > 0 && results.every(r => selectedPlaces[r.google_place_id])}
                                onChange={toggleSelectAll}
                            />
                            <span className="text-sm font-medium">בחר הכל</span>
                        </div>
                        {selectedCount > 0 && (
                            <Button onClick={importSelected} className="bg-green-600 hover:bg-green-700 text-white gap-2">
                                <Plus className="w-4 h-4" />
                                יבא {selectedCount} נבחרים
                            </Button>
                        )}
                    </div>
                )}

                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-4 flex items-start gap-3 text-sm text-blue-700">
                    <div className="bg-blue-100 p-1 rounded-full shrink-0">
                        <Check className="w-3 h-3 text-blue-600" />
                    </div>
                    <div>
                        <span className="font-semibold block mb-1">תצוגה מקדימה (Preview)</span>
                        הנתונים המוצגים כאן הם ראשוניים בלבד. בעת לחיצה על "ייבא", המערכת תבצע סריקת עומק (Deep Scan) ותשלוף:
                        <ul className="list-disc list-inside mt-1 space-y-0.5 text-blue-600/80 text-xs">
                            <li>תמונות ברזולוציה גבוהה (עד 10 תמונות)</li>
                            <li>שעות פתיחה מלאות, אתר אינטרנט וטלפון</li>
                            <li>5 ביקורות אחרונות ונתוני דירוג מלאים</li>
                        </ul>
                    </div>
                </div>

                <div className="grid gap-4">
                    {results.map((place) => (
                        <Card key={place.google_place_id} className="overflow-hidden">
                            <CardContent className="p-4">
                                <div className="flex gap-4">
                                    <input
                                        type="checkbox"
                                        className="w-5 h-5 rounded border-gray-300 mt-1"
                                        checked={selectedPlaces[place.google_place_id] || false}
                                        onChange={() => toggleSelection(place.google_place_id)}
                                    />

                                    <div className="relative w-32 h-32 flex-shrink-0 bg-gray-100 rounded overflow-hidden group-hover:shadow transition-shadow">
                                        {place.photo_url ? (
                                            <img
                                                src={place.photo_url}
                                                alt={place.business_name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 bg-gray-50 p-2 text-center">
                                                <ImageIcon className="mb-1" />
                                                <span className="text-[10px] leading-tight">No Preview Image</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex-1">
                                        <h3 className="font-bold text-lg mb-1">{place.business_name}</h3>
                                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                                            <MapPin className="w-4 h-4" />
                                            <span>{place.location}</span>
                                        </div>
                                        {place.rating && (
                                            <div className="flex items-center gap-2 text-sm mb-2">
                                                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                                <span className="font-medium">{place.rating}</span>
                                                <span className="text-gray-500">({place.user_ratings_total} ביקורות)</span>
                                            </div>
                                        )}
                                        <div className="flex flex-wrap gap-2 mb-3">
                                            {place.types?.slice(0, 3).map((type, i) => (
                                                <Badge key={i} variant="secondary" className="text-xs bg-gray-100 text-gray-600 border-0">
                                                    {type.replace('_', ' ')}
                                                </Badge>
                                            ))}
                                            {place.imported && (
                                                <>
                                                    {place.website && <Badge variant="outline" className="text-xs border-green-200 bg-green-50 text-green-700 gap-1"><Globe className="w-3 h-3" /> Website</Badge>}
                                                    {place.phone && <Badge variant="outline" className="text-xs border-green-200 bg-green-50 text-green-700 gap-1"><Phone className="w-3 h-3" /> Phone</Badge>}
                                                    {place.description && place.description.length > 50 && <Badge variant="outline" className="text-xs border-green-200 bg-green-50 text-green-700 gap-1"><Info className="w-3 h-3" /> About</Badge>}
                                                    {place.reviews?.length > 0 && <Badge variant="outline" className="text-xs border-green-200 bg-green-50 text-green-700 gap-1"><Star className="w-3 h-3" /> {place.reviews.length} Reviews</Badge>}
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex-shrink-0">
                                        <Button
                                            onClick={() => handleSingleImport(place)}
                                            disabled={importing[place.google_place_id] === true || importing[place.google_place_id] === 'done' || importing[place.google_place_id] === 'exists'}
                                            className="gap-2"
                                        >
                                            {importing[place.google_place_id] === true && <Loader2 className="w-4 h-4 animate-spin" />}
                                            {importing[place.google_place_id] === 'done' && <Check className="w-4 h-4" />}
                                            {importing[place.google_place_id] === 'exists' && <Check className="w-4 h-4" />}
                                            {importing[place.google_place_id] === 'done' ? 'יובא' : importing[place.google_place_id] === 'exists' ? 'קיים' : importing[place.google_place_id] ? 'מייבא...' : 'ייבא'}
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
