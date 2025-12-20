// @ts-nocheck
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    MapPin,
    Clock,
    Trash2,
    Plus,
    ArrowRight,
    Save,
    Share2,
    Calendar,
    Navigation
} from "lucide-react";
import GoogleMap from "../components/GoogleMap";
import { getCategoryIcon } from "@/shared/utils/mapIcons";
import SEO from '@/components/SEO';

export default function TripPlanner() {
    const navigate = useNavigate();
    const [tripName, setTripName] = useState("הטיול שלי לקוסמוי");
    const [tripDate, setTripDate] = useState(new Date().toISOString().split('T')[0]);
    const [itinerary, setItinerary] = useState([]);
    const [mapCenter, setMapCenter] = useState({ lat: 9.5120, lng: 100.0136 }); // Koh Samui center
    const [mapZoom, setMapZoom] = useState(11);

    // Load trip from localStorage on mount
    useEffect(() => {
        const savedTrip = localStorage.getItem('currentTrip');
        if (savedTrip) {
            try {
                const parsed = JSON.parse(savedTrip);
                setItinerary(parsed.itinerary || []);
                if (parsed.name) setTripName(parsed.name);
                if (parsed.date) setTripDate(parsed.date);
            } catch (e) {
                console.error("Failed to load trip", e);
            }
        }
    }, []);

    // Save trip to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('currentTrip', JSON.stringify({
            name: tripName,
            date: tripDate,
            itinerary
        }));
    }, [tripName, tripDate, itinerary]);

    const removeItem = (id) => {
        setItinerary(itinerary.filter(item => item.id !== id));
    };

    const moveItem = (index, direction) => {
        const newItinerary = [...itinerary];
        if (direction === 'up' && index > 0) {
            [newItinerary[index], newItinerary[index - 1]] = [newItinerary[index - 1], newItinerary[index]];
        } else if (direction === 'down' && index < newItinerary.length - 1) {
            [newItinerary[index], newItinerary[index + 1]] = [newItinerary[index + 1], newItinerary[index]];
        }
        setItinerary(newItinerary);
    };

    const mapMarkers = itinerary.map((item, index) => ({
        lat: item.location?.lat || 0,
        lng: item.location?.lng || 0,
        title: item.title,
        label: `${index + 1}`,
        icon: getCategoryIcon(item.category),
    })).filter(m => m.lat && m.lng);

    return (
        <div className="h-[calc(100vh-64px)] flex flex-col md:flex-row bg-white relative">
            <SEO
                title="Trip Planner | Kosmoi"
                description="Build and manage your perfect Koh Samui itinerary."
                url="https://kosmoi.com/TripPlanner"
            />
            {/* Header */}
            <div className="bg-white border-b px-4 py-3 flex items-center justify-between shadow-sm z-10">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                        <ArrowRight className="w-5 h-5" />
                    </Button>
                    <div>
                        <Input
                            value={tripName}
                            onChange={(e) => setTripName(e.target.value)}
                            className="text-lg font-bold border-none shadow-none p-0 h-auto focus-visible:ring-0"
                        />
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Calendar className="w-4 h-4" />
                            <Input
                                type="date"
                                value={tripDate}
                                onChange={(e) => setTripDate(e.target.value)}
                                className="border-none shadow-none p-0 h-auto w-32 focus-visible:ring-0 text-sm"
                            />
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                        <Share2 className="w-4 h-4 mr-2" />
                        שתף
                    </Button>
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                        <Save className="w-4 h-4 mr-2" />
                        שמור
                    </Button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Timeline Sidebar */}
                <div className="w-1/3 min-w-[320px] bg-white border-l flex flex-col z-0">
                    <div className="p-4 border-b bg-gray-50">
                        <h3 className="font-semibold text-gray-700 mb-1">לוח זמנים</h3>
                        <p className="text-xs text-gray-500">גרור ושחרר כדי לסדר מחדש (בקרוב)</p>
                    </div>

                    <ScrollArea className="flex-1 p-4">
                        {itinerary.length === 0 ? (
                            <div className="text-center py-10 text-gray-500">
                                <MapPin className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                <p>המסלול שלך ריק</p>
                                <p className="text-sm mt-1">השתמש בצ'אט ה-AI כדי למצוא מקומות ולהוסיף אותם לטיול</p>
                                <Button
                                    variant="outline"
                                    className="mt-4"
                                    onClick={() => navigate('/AIChat')}
                                >
                                    עבור לצ'אט
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-4 relative">
                                {/* Connecting Line */}
                                <div className="absolute top-4 bottom-4 right-[19px] w-0.5 bg-blue-100 -z-10" />

                                {itinerary.map((item, index) => (
                                    <div key={item.id} className="flex gap-4 relative group">
                                        {/* Number Badge */}
                                        <div className="flex flex-col items-center gap-1">
                                            <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold shadow-sm z-10 ring-4 ring-white">
                                                {index + 1}
                                            </div>
                                            {index < itinerary.length - 1 && (
                                                <div className="flex-1 w-0.5 bg-blue-200 my-1" />
                                            )}
                                        </div>

                                        {/* Content Card */}
                                        <Card className="flex-1 hover:shadow-md transition-shadow">
                                            <CardContent className="p-3">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <Badge variant="outline" className="mb-1 text-xs">
                                                            {item.time || "00:00"}
                                                        </Badge>
                                                        <h4 className="font-bold text-gray-900">{item.title}</h4>
                                                        <p className="text-xs text-gray-500 flex items-center gap-1">
                                                            <MapPin className="w-3 h-3" />
                                                            {item.address || "Koh Samui"}
                                                        </p>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6 text-gray-400 hover:text-red-500"
                                                        onClick={() => removeItem(item.id)}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                                {item.notes && (
                                                    <div className="bg-yellow-50 p-2 rounded text-xs text-yellow-800 mt-2">
                                                        {item.notes}
                                                    </div>
                                                )}
                                                <div className="flex gap-2 mt-2 justify-end">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-6 text-xs"
                                                        disabled={index === 0}
                                                        onClick={() => moveItem(index, 'up')}
                                                    >
                                                        ▲
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-6 text-xs"
                                                        disabled={index === itinerary.length - 1}
                                                        onClick={() => moveItem(index, 'down')}
                                                    >
                                                        ▼
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                ))}
                            </div>
                        )}
                    </ScrollArea>

                    <div className="p-4 border-t bg-gray-50">
                        <Button className="w-full" variant="outline" onClick={() => navigate('/AIChat')}>
                            <Plus className="w-4 h-4 ml-2" />
                            הוסף מקום חדש
                        </Button>
                    </div>
                </div>

                {/* Map View */}
                <div className="flex-1 relative">
                    <GoogleMap
                        center={mapCenter}
                        zoom={mapZoom}
                        height="100%"
                        markers={mapMarkers}
                        polylines={[
                            {
                                path: itinerary
                                    .filter(item => item.location?.lat && item.location?.lng)
                                    .map(item => ({ lat: item.location.lat, lng: item.location.lng })),
                                strokeColor: "#2563eb", // blue-600
                                strokeWeight: 4,
                                strokeOpacity: 0.8
                            }
                        ]}
                    />
                </div>
            </div>
        </div>
    );
}
