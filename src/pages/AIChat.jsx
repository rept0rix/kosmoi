import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bot, Send, Sparkles, Key, MapPin, Phone, MessageCircle, Navigation, X, Star, Compass, Map as MapIcon, Info, User, Maximize2, Minimize2, ArrowRight } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { db } from '@/api/supabaseClient';
import GoogleMap from "@/components/GoogleMap";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createPageUrl } from "@/utils";
import { getCategoryIcon } from "@/utils/mapIcons";
import MapProviderCard from "@/components/MapProviderCard";
import { useWeather, getWeatherDescription } from '@/hooks/useWeather';
import { samuiKnowledge } from '@/data/samuiKnowledge';
import { CONCIERGE_AGENT } from '@/services/agents/registry/ConciergeAgent';
import SEO from '@/components/SEO';

const categories = [
    { value: "all", label: "All" },
    { value: "handyman", label: "Handyman" },
    { value: "carpenter", label: "Carpenter" },
    { value: "electrician", label: "Electrician" },
    { value: "plumber", label: "Plumber" },
    { value: "ac_repair", label: "AC Repair" },
    { value: "cleaning", label: "Cleaning" },
    { value: "locksmith", label: "Locksmith" },
    { value: "painter", label: "Painter" },
    { value: "gardener", label: "Gardener" },
    { value: "pest_control", label: "Pest Control" },
    { value: "moving", label: "Moving" },
    { value: "internet_tech", label: "Internet" },
];

const quickActions = [
    { id: 'tour_guide', label: 'Tour Guide', icon: Compass, prompt: "Act as a local tour guide. What are the must-see places in Koh Samui?" },
    { id: 'build_trip', label: 'Build a Trip', icon: MapIcon, prompt: "I want to build a trip itinerary for Koh Samui. Can you help me plan?" },
    { id: 'local_info', label: 'Local Info', icon: Info, prompt: "What interesting places are near my current location?" },
    { id: 'plumber', label: 'Plumber', category: 'plumber' },
    { id: 'taxi', label: 'Taxi', category: 'taxi' },
    { id: 'food', label: 'Food', category: 'restaurant' }, // Assuming restaurant category exists or maps to something
    { id: 'cleaning', label: 'Cleaning', category: 'cleaning' },
];

const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

/**
 * AIChat Page (Samui Concierge)
 *
 * A conversational interface powered by Google Gemini to help users plan trips
 * and find local services. Integrates with the ServiceProvider database and
 * weather API to provide context-aware recommendations.
 *
 * Features:
 * - Interactive Map with provider markers
 * - Trip planning capabilities
 * - Local knowledge base integration
 * - Real-time weather context
 */
export default function AIChat() {
    const [messages, setMessages] = useState([
        { role: 'assistant', content: 'Sawadee krup! 🙏 I am your Koh Samui Concierge. How can I help you today?' }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const navigate = useNavigate();
    const messagesEndRef = useRef(null);

    // Map & Location State
    const [userLocation, setUserLocation] = useState(null);
    const [mapCenter, setMapCenter] = useState({ lat: 9.5, lng: 100.0 });
    const [mapZoom, setMapZoom] = useState(13);
    const [selectedProvider, setSelectedProvider] = useState(null);
    const [isMapExpanded, setIsMapExpanded] = useState(false);

    // Fetch Providers
    const { data: providers } = useQuery({
        queryKey: ["serviceProviders"],
        queryFn: () => db.entities.ServiceProvider.filter({ status: "active" }),
        initialData: [],
    });

    // Fetch Weather
    const { data: weatherData } = useWeather();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const locationState = useLocation(); // Need to import useLocation if not already imported, wait, imports are top level.
    // Check if useLocation is imported... it's not in the snippet I saw. I need to check imports text first or just add it.
    // Actually, `useNavigate` is used, so `react-router-dom` is there. I'll add `useLocation` to imports in a separate step if needed. 
    // Assuming I will add it or it exists. I will check file first in thought? No, I viewed it.
    // View of AIChat showed: `import { useNavigate } from 'react-router-dom';` on line 5.

    // I will use `window.location` or safer `useLocation` hook.
    // Let's assume I will fix imports.

    // Logic for context:
    const { state } = useLocation();

    useEffect(() => {
        scrollToBottom();

        // Handle Incoming Context from Dashboard
        if (state?.category && !messages.some(m => m.isContextTrigger)) {
            const prompt = `I'm interested in ${state.label || state.category}. What can you recommend?`;

            // Add user message visually (optional, or just start assistant)
            // Let's make it look like user asked.
            setMessages(prev => [
                ...prev,
                { role: 'user', content: prompt, isContextTrigger: true }
            ]);

            processMessage(prompt);

            // Clear state to prevent re-trigger on refresh? 
            // React Router state persists on refresh usually, but we check `!messages.some` so it's fine.
        }

        // Get User Location
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const location = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    setUserLocation(location);
                    setMapCenter(location);
                    setMapZoom(15); // Zoom in when location is found
                },
                (error) => {
                    // Location access denied - silent fail
                }
            );
        }
    }, [state]); // Add state dependency

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const processMessage = async (text, context = "") => {
        setIsTyping(true);

        try {
            const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
            if (!apiKey) {
                setMessages(prev => [...prev, { role: 'assistant', content: 'System Error: API Key is missing in environment variables.' }]);
                setIsTyping(false);
                return;
            }

            // 1. Prepare Provider Context
            const providersContext = providers.map(p =>
                `- ${p.business_name} (${p.category}): ${p.description?.substring(0, 100)}... (Rating: ${p.average_rating || 'N/A'}, Location: ${p.location || 'Samui'})`
            ).join('\n');

            // Prepare Weather Context
            let weatherContext = "Weather data unavailable.";
            if (weatherData && weatherData.current) {
                const desc = getWeatherDescription(weatherData.current.weather_code);
                weatherContext = `Current Weather in Koh Samui: ${Math.round(weatherData.current.temperature_2m)}°C, ${desc}. Wind Speed: ${weatherData.current.wind_speed_10m} km/h.`;
            }



            const systemInstruction = `
${CONCIERGE_AGENT.systemPrompt}

**DYNAMIC CONTEXT:**

KNOWLEDGE BASE:
${JSON.stringify(samuiKnowledge, null, 2)}

CURRENT WEATHER:
${weatherContext}

AVAILABLE PROVIDERS (Prioritize these):
${providersContext}

AVAILABLE APP ROUTES:
    - /ServiceProviders?category=plumber
    - /ServiceProviders?category=taxi
    - /ServiceProviders?category=restaurant
    - /ServiceProviders?category=tour_guide
    - /ServiceProviders?category=cleaning
    - /ServiceProviders?category=handyman
    - /RequestService
    - /MyRequests

TRIP PLANNER INSTRUCTIONS:
If suggesting an itinerary, you can return a "card" with an "add_to_trip" action.
Action Data Format (Single or Array): 
{ 
  "title": "Place Name", 
  "address": "Location Name", 
  "category": "sightseeing", 
  "time": "10:00", 
  "notes": "Short tip",
  "location": { "lat": 9.53, "lng": 100.05 } // REQUIRED for map placement
}
Use known coordinates from the 'providers' list if available, or estimate reasonable Samui coordinates.
`;

            // 2. Prepare Conversation History
            // Map internal message format to Gemini API format
            const history = messages.map(msg => ({
                role: msg.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: msg.content }]
            }));

            // Add the new user message
            const currentMessage = {
                role: 'user',
                parts: [{ text: context ? `${context}\n\n${text}` : text }]
            };

            const contents = [...history, currentMessage];

            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    systemInstruction: {
                        parts: [{ text: systemInstruction }]
                    },
                    contents: contents,
                    tools: [{ googleSearch: {} }]
                })
            });

            const data = await response.json();
            if (data.error) throw new Error(data.error.message);

            const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

            // Parse JSON response
            let parsedResponse;
            try {
                const cleanJson = responseText.replace(/```json\s*/g, '').replace(/```/g, '').trim();
                parsedResponse = JSON.parse(cleanJson);
            } catch (e) {
                console.error("JSON Parse Error:", e);
                // Attempt to extract JSON if mixed with text
                const jsonMatch = responseText.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    try {
                        parsedResponse = JSON.parse(jsonMatch[0]);
                    } catch (e2) {
                        parsedResponse = { message: responseText, action: null };
                    }
                } else {
                    parsedResponse = { message: responseText, action: null };
                }
            }

            setMessages(prev => [...prev, {
                role: 'assistant',
                content: parsedResponse.message,
                action: parsedResponse.action,
                image: parsedResponse.image,
                choices: parsedResponse.choices,
                card: parsedResponse.card
            }]);

        } catch (error) {
            console.error("AI Error Details:", error);
            let errorMessage = 'Sorry, I had a brain freeze. Please try again.';

            if (error.message.includes('400')) errorMessage = 'Error 400: Bad Request.';
            if (error.message.includes('429')) errorMessage = 'Error 429: Too Many Requests.';

            setMessages(prev => [...prev, { role: 'assistant', content: errorMessage }]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleSend = () => {
        if (!input.trim()) return;

        const userMessage = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        processMessage(input);
    };

    const handleActionClick = (action) => {
        if (action.type === 'navigate') {
            navigate(action.path);
        } else if (action.type === 'add_to_trip') {
            // Add to local storage trip
            const savedTrip = localStorage.getItem('currentTrip');
            let trip = savedTrip ? JSON.parse(savedTrip) : { itinerary: [] };

            if (Array.isArray(action.data)) {
                // Handle Batch Add (Array)
                const newItems = action.data.map((item, idx) => ({
                    id: Date.now() + idx,
                    ...item
                }));
                trip.itinerary.push(...newItems);
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: `Added ${newItems.length} items to your trip!`,
                    isSystem: true
                }]);
            } else {
                // Handle Single Add (Object)
                const newItem = {
                    id: Date.now(),
                    ...action.data
                };
                trip.itinerary.push(newItem);
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: `Added "${action.data.title}" to your trip!`,
                    isSystem: true
                }]);
            }
            localStorage.setItem('currentTrip', JSON.stringify(trip));

            setMessages(prev => [...prev, {
                role: 'assistant',
                content: `Added "${action.data.title}" to your trip!`,
                isSystem: true
            }]);

            // Navigate to planner to show it
            navigate('/TripPlanner');
        }
    };

    const handleQuickAction = (action) => {
        if (action.category) {
            // Find nearest provider
            if (!userLocation) {
                // If no location, just ask
                const userMessage = { role: 'user', content: `I'm looking for a ${action.label}.` };
                setMessages(prev => [...prev, userMessage]);
                processMessage(`I'm looking for a ${action.label}.`);
                return;
            }

            const categoryProviders = providers.filter(p => p.category === action.category && p.latitude && p.longitude);

            if (categoryProviders.length > 0) {
                // Sort by distance
                categoryProviders.sort((a, b) => {
                    const distA = calculateDistance(userLocation.lat, userLocation.lng, a.latitude, a.longitude);
                    const distB = calculateDistance(userLocation.lat, userLocation.lng, b.latitude, b.longitude);
                    return distA - distB;
                });

                const nearest = categoryProviders[0];
                const distance = calculateDistance(userLocation.lat, userLocation.lng, nearest.latitude, nearest.longitude).toFixed(1);

                setSelectedProvider(nearest);
                setMapCenter({ lat: nearest.latitude, lng: nearest.longitude });
                setMapZoom(16); // Zoom in on provider

                const prompt = `I'm looking for a ${action.label}. I see "${nearest.business_name}" is ${distance}km away. Can you tell me about it or other options?`;
                const userMessage = { role: 'user', content: prompt };
                setMessages(prev => [...prev, userMessage]);
                processMessage(prompt);
            } else {
                const userMessage = { role: 'user', content: `I'm looking for a ${action.label}.` };
                setMessages(prev => [...prev, userMessage]);
                processMessage(`I'm looking for a ${action.label}.`);
            }

        } else if (action.prompt) {
            const userMessage = { role: 'user', content: action.label };
            setMessages(prev => [...prev, userMessage]);

            let context = "";
            if (action.id === 'local_info' && userLocation) {
                context = `My current location is Latitude: ${userLocation.lat}, Longitude: ${userLocation.lng}.`;
            }

            processMessage(action.prompt, context);
        }
    };

    const getCategoryLabel = (categoryValue) => {
        return categories.find((c) => c.value === categoryValue)?.label || categoryValue;
    };

    const handleCall = async (phone, e) => {
        e.stopPropagation();
        try {
            const isAuth = await db.auth.isAuthenticated();
            if (!isAuth) {
                db.auth.redirectToLogin(window.location.pathname);
                return;
            }
            window.location.href = `tel:${phone}`;
        } catch (error) {
            db.auth.redirectToLogin(window.location.pathname);
        }
    };

    const handleWhatsApp = async (phone, e) => {
        e.stopPropagation();
        try {
            const isAuth = await db.auth.isAuthenticated();
            if (!isAuth) {
                db.auth.redirectToLogin(window.location.pathname);
                return;
            }
            window.open(`https://wa.me/${phone.replace(/[^0-9]/g, "")}`, "_blank");
        } catch (error) {
            db.auth.redirectToLogin(window.location.pathname);
        }
    };

    const handleNavigate = (provider, e) => {
        e.stopPropagation();
        window.open(
            `https://www.google.com/maps/dir/?api=1&destination=${provider.latitude},${provider.longitude}`,
            "_blank"
        );
    };

    const handleProviderClick = (provider) => {
        setSelectedProvider(provider);
        setMapCenter({ lat: provider.latitude, lng: provider.longitude });
        setMapZoom(16);

        // Trigger AI Chat
        const prompt = `Tell me about ${provider.business_name}.`;
        const userMessage = { role: 'user', content: prompt };
        setMessages(prev => [...prev, userMessage]);
        processMessage(prompt);
    };

    // ... (existing code)

    // ... (existing imports)

    // Prepare Map Markers
    const mapMarkers = providers.map(provider => ({
        lat: provider.latitude,
        lng: provider.longitude,
        title: provider.business_name,
        icon: getCategoryIcon(provider.category),
        onClick: () => handleProviderClick(provider)
    }));

    return (
        <div className="flex flex-col h-[calc(100vh-56px)] bg-gray-50">
            <SEO
                title="Concierge | Kosmoi"
                description="Your AI local expert for Koh Samui. Ask about trips, food, and services."
                url="https://kosmoi.com/AIChat"
            />
            {/* Map Section - Top 23% */}
            <div className={`relative w-full transition-all duration-300 ease-in-out ${isMapExpanded ? 'h-[80%]' : 'h-[23%]'}`}>
                <GoogleMap
                    center={mapCenter}
                    zoom={mapZoom}
                    height="100%"
                    markers={mapMarkers}
                    userLocation={userLocation}
                    options={{ disableDefaultUI: true }}
                />

                {/* Expand/Collapse Button */}
                <Button
                    variant="secondary"
                    size="icon"
                    className="absolute top-4 right-4 z-[1000] h-12 w-12 bg-white/90 backdrop-blur-sm shadow-xl hover:bg-white border border-gray-200 rounded-full transition-all duration-200 hover:scale-105"
                    onClick={() => setIsMapExpanded(!isMapExpanded)}
                    title={isMapExpanded ? "Minimize Map" : "Expand Map"}
                >
                    {isMapExpanded ?
                        <Minimize2 className="h-6 w-6 text-blue-600" /> :
                        <Maximize2 className="h-6 w-6 text-blue-600" />
                    }
                </Button>

                {/* Selected Provider Card Overlay */}
                {selectedProvider && (
                    <MapProviderCard
                        provider={selectedProvider}
                        onClose={() => setSelectedProvider(null)}
                    />
                )}
            </div>

            {/* Separator Line */}
            <div className="h-px bg-gray-200 w-full" />

            {/* Chat Section - Remaining Height */}
            <div className="flex-1 flex flex-col overflow-hidden">

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-3 space-y-3">

                    {/* Quick Actions Chips - Inside Scroll Area */}
                    <div className="pb-2 overflow-x-auto whitespace-nowrap scrollbar-hide shrink-0">
                        <div className="flex gap-2">
                            {quickActions.map((action) => (
                                <button
                                    key={action.id}
                                    onClick={() => handleQuickAction(action)}
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 border border-transparent transition-colors text-sm font-medium text-gray-700"
                                >
                                    {action.icon && <action.icon className="w-4 h-4" />}
                                    {action.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Chat Header / Mode Badge */}
                    <div className="flex justify-center py-2 shrink-0">
                        <div className="bg-white/80 backdrop-blur-md border border-indigo-100 rounded-full px-4 py-1.5 shadow-sm flex items-center gap-2">
                            <span className="relative flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                            </span>
                            <span className="text-xs font-semibold text-indigo-900 uppercase tracking-wider">
                                {messages.some(m => m.card?.action?.type === 'add_to_trip') ? '🏝️ Trip Planning Mode' : '🛎️ Concierge Active'}
                            </span>
                        </div>
                    </div>

                    {messages.map((msg, idx) => (
                        <div key={idx} className={`flex items-end gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>

                            {/* Bot Avatar */}
                            {msg.role === 'assistant' && (
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0 shadow-md ring-2 ring-white">
                                    <Sparkles className="w-4 h-4 text-white" />
                                </div>
                            )}

                            <div className={`max-w-[85%] rounded-2xl p-4 text-sm shadow-sm transition-all duration-200 ${msg.role === 'user'
                                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-br-none shadow-blue-200'
                                : msg.isSystem
                                    ? 'bg-amber-50 border border-amber-100 text-amber-900'
                                    : 'bg-white border border-gray-100 text-gray-800 rounded-bl-none shadow-gray-100'
                                }`}>
                                <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>

                                {/* Image Attachment */}
                                {msg.image && (
                                    <div className="mt-3 rounded-xl overflow-hidden shadow-sm border border-gray-100">
                                        <img src={msg.image} alt="Attachment" className="w-full h-40 object-cover hover:scale-105 transition-transform duration-500" />
                                    </div>
                                )}

                                {/* Premium Card (Glassmorphism) */}
                                {msg.card && (
                                    <div className="mt-4 overflow-hidden rounded-xl border border-white/50 bg-white/60 backdrop-blur-md shadow-lg ring-1 ring-black/5">
                                        {msg.card.image && (
                                            <div className="relative h-32 w-full overflow-hidden">
                                                <img src={msg.card.image} alt={msg.card.title} className="h-full w-full object-cover transition-transform duration-700 hover:scale-110" />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                                <div className="absolute bottom-2 left-2 right-2">
                                                    <h4 className="font-bold text-white text-lg shadow-black/50 drop-shadow-md">{msg.card.title}</h4>
                                                </div>
                                            </div>
                                        )}
                                        <div className="p-4">
                                            {!msg.card.image && <h4 className="font-bold text-gray-900 mb-1">{msg.card.title}</h4>}
                                            <p className="text-xs text-gray-600 mb-4 leading-relaxed">{msg.card.description}</p>

                                            {msg.card.action && (
                                                <Button
                                                    size="sm"
                                                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white border-0 shadow-md hover:shadow-lg transition-all duration-300 font-semibold group"
                                                    onClick={() => handleActionClick(msg.card.action)}
                                                >
                                                    {msg.card.action.label || "Select Option"}
                                                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Legacy Action Button */}
                                {msg.action && !msg.card && (
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        className="mt-3 w-full bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 font-medium text-sm h-9"
                                        onClick={() => handleActionClick(msg.action)}
                                    >
                                        {msg.action.label}
                                    </Button>
                                )}

                                {/* Choice Chips */}
                                {msg.choices && (
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {msg.choices.map((choice, i) => (
                                            <button
                                                key={i}
                                                className="px-3 py-1.5 bg-white border border-indigo-100 text-indigo-600 rounded-full text-xs font-semibold hover:bg-indigo-50 hover:border-indigo-200 transition-all shadow-sm"
                                                onClick={() => {
                                                    setInput(choice);
                                                    processMessage(choice);
                                                }}
                                            >
                                                {choice}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* User Avatar */}
                            {msg.role === 'user' && (
                                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0 border border-gray-200">
                                    <User className="w-4 h-4 text-gray-500" />
                                </div>
                            )}
                        </div>
                    ))}

                    {isTyping && (
                        <div className="flex items-end gap-2 justify-start">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center shrink-0">
                                <Sparkles className="w-3.5 h-3.5 text-white" />
                            </div>
                            <div className="bg-white border border-gray-200 rounded-2xl p-2 rounded-bl-none shadow-sm flex gap-1">
                                <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                <span className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-2 bg-white border-t shrink-0">
                    <form
                        className="flex w-full gap-2"
                        onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                    >
                        <div className="relative flex-1">
                            <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500" />
                            <Input
                                placeholder="Ask me anything..."
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                className="w-full h-11 text-base pl-10 focus-visible:ring-blue-500 bg-gray-50 border-gray-200"
                            />
                        </div>
                        <Button type="submit" size="icon" className="h-11 w-11 bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md">
                            <Send className="w-5 h-5" />
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
}
