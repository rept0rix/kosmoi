import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bot, Send, Sparkles, Key, MapPin, Phone, MessageCircle, Navigation, X, Star, Compass, Map as MapIcon, Info, User, Maximize2, Minimize2 } from 'lucide-react';
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
                    console.log("Location access denied");
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
You are the "Samui Service Hub Concierge", an expert local guide and AI assistant for Koh Samui.

YOUR GOAL:
Help users plan trips, find services, and navigate the island. You have access to a database of verified local service providers AND a deep knowledge base about the island.

CAPABILITIES:
1. **Trip Planning**: Create detailed, day-by-day itineraries based on user preferences (relaxing, adventure, family, nightlife).
2. **Service Recommendations**: Recommend specific businesses from your database. ALWAYS prefer verified providers.
3. **Local Knowledge**: Answer questions about beaches, weather, transport, and culture using the provided KNOWLEDGE BASE.
4. **Weather Aware**: Use the provided weather data to suggest appropriate activities (e.g., indoor activities if raining).
5. **Rich Interactions**: Use images, choice chips, and cards to make the conversation engaging.

RESPONSE FORMAT:
You must respond in JSON format ONLY:
{
    "message": "Your natural language response here.",
    "image": "https://example.com/image.jpg", // Optional: Image URL to display
    "choices": ["Option 1", "Option 2"], // Optional: Quick reply choices for the user
    "card": { // Optional: A card to display a place/service
        "title": "Place Name",
        "description": "Short description",
        "image": "https://example.com/place.jpg",
        "action": { "type": "add_to_trip", "data": { ... }, "label": "Add to Trip" }
    },
    "action": { "type": "navigate", "path": "/Route", "label": "Button Label" } // Optional: Legacy action
}

KNOWLEDGE BASE (Use this to answer general questions):
${JSON.stringify(samuiKnowledge, null, 2)}

CURRENT WEATHER:
${weatherContext}

AVAILABLE PROVIDERS (Use these for recommendations):
${providersContext}

AVAILABLE APP ROUTES (Use these for navigation actions):
    - /ServiceProviders?category=plumber
    - /ServiceProviders?category=taxi
    - /ServiceProviders?category=restaurant
    - /ServiceProviders?category=tour_guide
    - /ServiceProviders?category=cleaning
    - /ServiceProviders?category=handyman
    - /RequestService
    - /MyRequests

RESPONSE FORMAT:
You must respond in JSON format ONLY:
{
    "message": "Your natural language response here. Use Markdown for formatting (bold, lists, etc.).",
    "action": { "type": "navigate", "path": "/Route", "label": "Button Label" } // Optional
}

GUIDELINES:
- **Be Proactive**: If a user asks for a plan, ask clarifying questions (dates, interests, budget) if needed, then build the plan.
- **Be Specific**: When recommending a place, mention its name from the provider list if available.
- **Thai Hospitality**: Be warm and polite ("Sawadee krup/ka").

TRIP PLANNER INTEGRATION:
If the user wants to add a specific place to their trip, or if you suggest a specific place as part of an itinerary, use the "add_to_trip" action.
Action Format: { "type": "add_to_trip", "data": { "title": "Place Name", "address": "Location", "category": "category_key", "time": "10:00", "notes": "AI notes" }, "label": "Add to Trip" }
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

            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-preview:generateContent?key=${apiKey}`, {
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

            const newItem = {
                id: Date.now(),
                ...action.data
            };

            trip.itinerary.push(newItem);
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

                    {messages.map((msg, idx) => (
                        <div key={idx} className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>

                            {/* Bot Avatar */}
                            {msg.role === 'assistant' && (
                                <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center shrink-0">
                                    <Sparkles className="w-3.5 h-3.5 text-white" />
                                </div>
                            )}

                            <div className={`max-w-[85%] rounded-2xl p-3 text-sm shadow-sm ${msg.role === 'user'
                                ? 'bg-blue-600 text-white rounded-br-none'
                                : msg.isSystem
                                    ? 'bg-yellow-50 border border-yellow-200 text-yellow-800'
                                    : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none'
                                }`}>
                                <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>

                                {/* Image Attachment */}
                                {msg.image && (
                                    <img src={msg.image} alt="Attachment" className="mt-2 rounded-lg w-full h-40 object-cover" />
                                )}

                                {/* Rich Card */}
                                {msg.card && (
                                    <div className="mt-3 bg-gray-50 rounded-xl p-3 border border-gray-200">
                                        {msg.card.image && (
                                            <img src={msg.card.image} alt={msg.card.title} className="w-full h-32 object-cover rounded-lg mb-2" />
                                        )}
                                        <h4 className="font-bold text-gray-900">{msg.card.title}</h4>
                                        <p className="text-xs text-gray-500 mb-2">{msg.card.description}</p>
                                        {msg.card.action && (
                                            <Button
                                                size="sm"
                                                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                                                onClick={() => handleActionClick(msg.card.action)}
                                            >
                                                {msg.card.action.label}
                                            </Button>
                                        )}
                                    </div>
                                )}

                                {/* Legacy Action Button */}
                                {msg.action && !msg.card && (
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        className="mt-3 w-full bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 font-medium text-sm h-9"
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
                                                className="px-3 py-1.5 bg-white border border-blue-200 text-blue-600 rounded-full text-xs font-medium hover:bg-blue-50 transition-colors"
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
                                <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
                                    <User className="w-3.5 h-3.5 text-gray-500" />
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
