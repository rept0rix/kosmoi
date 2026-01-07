import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bot, Send, Sparkles, Map as MapIcon, Info, ArrowRight, Trash2, PlusCircle, History, ChevronUp, ChevronDown, Crosshair, Palmtree, UtensilsCrossed, Martini, ShoppingBag, Flower, Landmark, Car, Bike } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth/context/AuthContext';
import { db } from '@/api/supabaseClient';
import GoogleMap from "@/components/GoogleMap";
import { useQuery } from "@tanstack/react-query";
import { getCategoryIcon } from "@/shared/utils/mapIcons";
import { useWeather, getWeatherDescription } from '@/shared/hooks/useWeather';
import { samuiKnowledge } from '@/data/samuiKnowledge';
import { CONCIERGE_AGENT } from '@/features/agents/services/registry/ConciergeAgent';
import { agents } from '@/features/agents/services/AgentRegistry';
import VideoUpload from '@/components/agents/VideoUpload';
import { Check, ChevronRight } from 'lucide-react';
import SEO from '@/components/SEO';
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from 'date-fns';
import { memoryService } from '@/services/ai/MemoryService';
import A2UIRenderer from "@/components/a2ui/A2UIRenderer";

const quickActions = [
    { id: 'tour_guide', label: 'Tour Guide', icon: MapIcon, prompt: "Act as a local tour guide. What are the must-see places in Koh Samui?" },
    { id: 'build_trip', label: 'Build a Trip', icon: Sparkles, prompt: "I want to build a trip itinerary for Koh Samui. Can you help me plan?" },
    { id: 'local_info', label: 'Local Info', icon: Info, prompt: "What interesting places are near my current location?" },
    { id: 'rentals', label: 'Rentals', category: 'rental', icon: Bike },
    { id: 'beaches', label: 'Beaches', category: 'beach', icon: Palmtree },
    { id: 'restaurants', label: 'Restaurants', category: 'restaurant', icon: UtensilsCrossed },
    { id: 'nightlife', label: 'Nightlife', category: 'bar', icon: Martini },
    { id: 'shopping', label: 'Shopping', category: 'shopping', icon: ShoppingBag },
    { id: 'spas', label: 'Spas', category: 'spa', icon: Flower },
    { id: 'temples', label: 'Temples', category: 'temple', icon: Landmark },
    { id: 'taxi', label: 'Taxi', category: 'taxi', icon: Car },
];

function calculateDistance(lat1, lon1, lat2, lon2) {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2)
        ;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d.toFixed(1);
}

function deg2rad(deg) {
    return deg * (Math.PI / 180);
}

export default function AIChat() {
    const locationState = useLocation().state;
    const { user } = useAuth();

    // --- SCROLL LOCK ---
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = '';
        };
    }, []);

    // --- Session Management ---
    const [sessions, setSessions] = useState(() => {
        try {
            const saved = localStorage.getItem('kosmoi_chat_sessions');
            return saved ? JSON.parse(saved) : {};
        } catch (e) { return {}; }
    });
    const [currentSessionId, setCurrentSessionId] = useState(() => {
        const savedId = localStorage.getItem('kosmoi_current_session_id');
        return savedId || Date.now().toString();
    });

    const [messages, setMessages] = useState([]);
    const [showHistory, setShowHistory] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [isMaximized, setIsMaximized] = useState(false);

    // Agent Selection State
    const [currentAgent, setCurrentAgent] = useState(CONCIERGE_AGENT);

    // Initialize/Load Session
    useEffect(() => {
        if (sessions[currentSessionId]) {
            setMessages(sessions[currentSessionId].messages);
        } else {
            setMessages([{ role: 'assistant', content: 'Sawadee krup! 🙏 I am your Koh Samui Concierge. How can I help you today?' }]);
        }
        localStorage.setItem('kosmoi_current_session_id', currentSessionId);
    }, [currentSessionId]);

    // Save Messages
    useEffect(() => {
        if (messages.length > 0) {
            setSessions(prev => {
                const updated = {
                    ...prev,
                    [currentSessionId]: {
                        id: currentSessionId,
                        timestamp: prev[currentSessionId]?.timestamp || Date.now(),
                        title: prev[currentSessionId]?.title || messages.find(m => m.role === 'user')?.content?.slice(0, 30) || 'New Conversation',
                        messages: messages
                    }
                };
                localStorage.setItem('kosmoi_chat_sessions', JSON.stringify(updated));
                return updated;
            });
        }
    }, [messages, currentSessionId]);

    const createNewSession = () => {
        const newId = Date.now().toString();
        setCurrentSessionId(newId);
    };

    const deleteSession = (id, e) => {
        e.stopPropagation();
        setSessions(prev => {
            const updated = { ...prev };
            delete updated[id];
            localStorage.setItem('kosmoi_chat_sessions', JSON.stringify(updated));
            return updated;
        });
        if (currentSessionId === id) {
            createNewSession();
        }
    };

    // --- UI State ---
    const [input, setInput] = useState('');
    const [miniInput, setMiniInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);

    // --- Map State ---
    const [userLocation, setUserLocation] = useState(null);
    const [mapCenter, setMapCenter] = useState({ lat: 9.53, lng: 100.05 });
    const [mapZoom, setMapZoom] = useState(14);
    const [selectedProvider, setSelectedProvider] = useState(null);
    const [mapPolylines, setMapPolylines] = useState([]);

    const { data: providers } = useQuery({
        queryKey: ["serviceProviders"],
        queryFn: () => db.entities.ServiceProvider.filter({ status: "active" }),
        initialData: [],
    });

    const { data: weatherData } = useWeather();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, showHistory, isMinimized, isMaximized]);

    // Handle Incoming Context
    useEffect(() => {
        if (locationState?.context) {
            const prompt = locationState.context;
            // Only process if we haven't already added this specific prompt or if it's a fresh chat
            if (messages.length <= 1) {
                setMessages(prev => [...prev, { role: 'user', content: prompt }]);
                processMessage(prompt);
            }
        } else if (locationState?.category) {
            const prompt = `I'm interested in ${locationState.label || locationState.category}. What can you recommend?`;
            if (messages.length <= 1) {
                setMessages(prev => [...prev, { role: 'user', content: prompt }]);
                processMessage(prompt);
            }
        }
    }, [locationState]);

    // Geolocation
    const locateUser = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                    setUserLocation(loc);
                    // Shift center South (-0.0025) so the user location dot appears higher on screen
                    setMapCenter({ lat: loc.lat - 0.0025, lng: loc.lng });
                    setMapZoom(16); // High zoom on find
                },
                (err) => {
                    console.warn("Location denied", err);
                },
                { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
            );
        }
    };

    useEffect(() => {
        locateUser();
    }, []);

    const processMessage = async (text, context = "") => {
        setIsTyping(true);

        try {
            const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
            if (!apiKey) throw new Error("API Key Missing");

            const providersContext = providers.map(p => {
                let distInfo = "";
                if (userLocation) {
                    const dist = calculateDistance(userLocation.lat, userLocation.lng, p.latitude, p.longitude);
                    if (dist) distInfo = `(${dist}km away)`;
                }
                return `${p.business_name} (${p.category}): ${p.description || ""} ${distInfo}`;
            }).join("\n");

            const weatherContext = weatherData ? `${weatherData.temp_c}°C, ${weatherData.condition?.text}` : "Sunny, 30°C";

            const systemInstruction = `
${currentAgent.systemPrompt}

**STRICT RESPONSE FORMAT:**
You MUST return valid JSON.
Structure the response to be highly interactive and visual.
Use the provided distance context to explicitly mention how far places are.

**OUTPUT SCHEMA:**
{
  "message": "Conversational response...",
  "carousel": [ 
    {
      "title": "Business Name",
      "description": "Short description.",
      "image": "https://url...",
      "location": { "lat": 0.0, "lng": 0.0 },
      "distance": "5 min drive", // Explicit distance string
      "actions": [
        { "label": "Book Taxi", "type": "transport" },
        { "label": "Rent Bike", "type": "rental" },
        { "label": "Directions", "type": "navigate" }
      ]
    }
  ],
  "choices": ["Option 1", "Option 2"]
}

**CONTEXT:**
Weather: ${weatherContext}
Knowledge: ${JSON.stringify(samuiKnowledge)}
Providers: ${providersContext}
User Location: ${userLocation ? `${userLocation.lat}, ${userLocation.lng}` : 'Unknown'}
`;

            // MEMORY INJECTION
            let memoryContext = "";
            if (user?.id) {
                memoryService.textToMemory(user.id, text).catch(err => console.error("Memory learning failed", err));
                memoryContext = await memoryService.getSystemContext(user.id);
            }

            const finalSystemInstruction = systemInstruction + memoryContext;

            const history = messages.map(msg => ({
                role: msg.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: msg.content }]
            }));

            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    systemInstruction: { parts: [{ text: finalSystemInstruction }] },
                    contents: [...history, { role: 'user', parts: [{ text: context ? `${context}\n\n${text}` : text }] }]
                })
            });

            const data = await response.json();
            const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

            let parsed;
            try {
                const match = responseText.match(/\{[\s\S]*\}/);
                parsed = match ? JSON.parse(match[0]) : { message: responseText };
            } catch (e) {
                parsed = { message: responseText };
            }

            // --- POLYLINE LOGIC ---
            if (parsed.carousel && parsed.carousel.length > 0 && userLocation) {
                const newPolylines = parsed.carousel
                    .filter(item => item.location && item.location.lat && item.location.lng)
                    .map(item => ({
                        path: [
                            { lat: userLocation.lat, lng: userLocation.lng },
                            { lat: item.location.lat, lng: item.location.lng }
                        ],
                        strokeColor: "#3B82F6", // Blue-500
                        strokeOpacity: 0.6,
                        strokeWeight: 4,
                        options: {
                            geodesic: true,
                            icons: [{
                                icon: { path: 2, scale: 2 }, // Forward arrow
                                offset: '100%'
                            }]
                        }
                    }));
                setMapPolylines(newPolylines);
            } else {
                setMapPolylines([]);
            }

            setMessages(prev => [...prev, {
                role: 'assistant',
                content: parsed.message || "Here is what I found:",
                carousel: parsed.carousel,
                choices: parsed.choices,
                a2ui_content: parsed.a2ui_content
            }]);

        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I'm having trouble connecting to the island network. Please try again." }]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleSend = (e) => {
        e?.preventDefault();
        const txt = input.trim();
        if (!txt) return;

        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: txt }]);
        processMessage(txt, userLocation ? `Loc: ${userLocation.lat},${userLocation.lng}` : "");
    };

    const handleMiniSend = (e) => {
        e?.preventDefault();
        const txt = miniInput.trim();
        if (!txt) return;

        setIsMinimized(false);
        setMiniInput('');
        setMessages(prev => [...prev, { role: 'user', content: txt }]);
        processMessage(txt, userLocation ? `Loc: ${userLocation.lat},${userLocation.lng}` : "");
    };

    const handleQuickAction = (action) => {
        const prompt = action.prompt || `Show me best ${action.label} in Samui`;
        setMessages(prev => [...prev, { role: 'user', content: action.label }]);
        processMessage(prompt);
    };

    const handleCardAction = (action, item) => {
        if (action.type === 'navigate') {
            window.open(`https://www.google.com/maps/dir/?api=1&destination=${item.location.lat},${item.location.lng}`, '_blank');
        } else {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: `Okay, checking availability for "${action.label}" at ${item.title}...`
            }]);
        }
    };

    const allMarkers = [
        ...providers.map(p => ({
            lat: p.latitude,
            lng: p.longitude,
            title: p.business_name,
            icon: getCategoryIcon(p.category),
            onClick: () => {
                setSelectedProvider(p);
                setMapCenter({ lat: p.latitude - 0.0025, lng: p.longitude });
            }
        }))
    ];

    return (
        <div className="fixed inset-0 top-0 left-0 w-full h-full z-0 overflow-hidden bg-slate-50">
            <SEO title="Concierge AI | Kosmoi" />

            {/* --- MAP BACKGROUND --- */}
            <div className="absolute inset-0 z-0 w-full h-full pointer-events-auto">
                <GoogleMap
                    center={mapCenter}
                    zoom={mapZoom}
                    height="100%"
                    markers={allMarkers}
                    userLocation={userLocation}
                    userAvatar={user?.user_metadata?.avatar_url || user?.user_metadata?.picture}
                    polylines={mapPolylines}
                    options={{ disableDefaultUI: true, zoomControl: false, mapTypeControl: false, streetViewControl: false }}
                />
            </div>

            {/* --- SELECTED PROVIDER FLOATING CARD --- */}
            {selectedProvider && (
                <div className="fixed top-24 left-4 right-4 z-30 md:left-1/2 md:-translate-x-1/2 md:max-w-md animate-in slide-in-from-top-4 fade-in duration-300">
                    <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-white/40 p-1 flex gap-3 pr-3 relative overflow-hidden">
                        <div className="w-20 h-20 rounded-xl bg-slate-100 shrink-0 overflow-hidden">
                            {selectedProvider.image_url ? (
                                <img src={selectedProvider.image_url} alt={selectedProvider.business_name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-400">
                                    <MapIcon className="w-10 h-10" style={{ color: getCategoryIcon(selectedProvider.category).fillColor }} />
                                </div>
                            )}
                        </div>

                        <div className="flex-1 py-1 flex flex-col justify-center min-w-0">
                            <h3 className="font-bold text-slate-900 truncate">{selectedProvider.business_name}</h3>
                            <div className="flex items-center gap-1 text-xs text-slate-500 mb-1">
                                <span className="capitalize">{selectedProvider.category}</span>
                                <span>•</span>
                                <span>{selectedProvider.price_level || '$$'}</span>
                                {userLocation && (
                                    <>
                                        <span>•</span>
                                        <span className="text-blue-600 font-medium">
                                            {calculateDistance(userLocation.lat, userLocation.lng, selectedProvider.latitude, selectedProvider.longitude)} km
                                        </span>
                                    </>
                                )}
                            </div>

                            <div className="flex gap-2 mt-1">
                                <Button
                                    size="sm"
                                    className="h-7 text-xs bg-blue-600 hover:bg-blue-700 px-3 rounded-full"
                                    onClick={() => {
                                        const prompt = `How do I get to ${selectedProvider.business_name}?`;
                                        setMessages(prev => [...prev, { role: 'user', content: prompt }]);
                                        processMessage(prompt);
                                        setSelectedProvider(null);
                                    }}
                                >
                                    Get Directions
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 w-7 p-0 rounded-full border-slate-200"
                                    onClick={() => setSelectedProvider(null)}
                                >
                                    <Trash2 className="w-3 h-3 text-slate-400" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- CHAT POPUP OVERLAY --- */}
            <div
                className={`fixed z-40 bg-white/95 backdrop-blur-md shadow-2xl flex flex-col overflow-hidden border border-white/20 transition-all duration-300 ease-in-out ${isMinimized
                    ? 'h-[64px] rounded-2xl shadow-lg ring-1 ring-black/5'
                    : 'rounded-3xl'
                    }`}
                style={{
                    left: 0,
                    right: 0,
                    maxWidth: isMinimized ? '600px' : (isMaximized ? '1200px' : '900px'),
                    margin: '0 auto',
                    bottom: isMinimized ? '100px' : (window.innerWidth > 768 ? '10%' : '120px'),
                    top: isMinimized ? 'auto' : (isMaximized ? '10%' : '45%'),
                }}
            >
                {/* HEADERS */}
                {isMinimized ? (
                    <div className="flex items-center w-full h-full px-2 gap-2">
                        <div
                            className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-50 text-blue-600 cursor-pointer hover:bg-blue-100 transition-colors shrink-0"
                            onClick={() => setIsMinimized(false)}
                        >
                            <Sparkles className="w-5 h-5" />
                        </div>

                        <form onSubmit={handleMiniSend} className="flex-1 relative">
                            <Input
                                value={miniInput}
                                onChange={(e) => setMiniInput(e.target.value)}
                                placeholder="Ask Concierge..."
                                className="h-10 bg-transparent border-transparent focus-visible:ring-0 px-2 text-base placeholder:text-slate-400"
                                autoFocus={false}
                            />
                        </form>

                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 text-slate-400 hover:text-blue-600 rounded-full shrink-0"
                            onClick={miniInput.trim() ? handleMiniSend : () => setIsMinimized(false)}
                        >
                            {miniInput.trim() ? <Send className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
                        </Button>
                    </div>
                ) : (
                    <div
                        className="flex-none flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-white/80 cursor-pointer h-14"
                        onClick={() => setIsMinimized(true)}
                    >
                        <div className="flex items-center gap-2">
                            <h2 className="font-bold text-slate-800 text-sm">Concierge AI</h2>
                        </div>

                        <div className="flex items-center gap-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-full hover:bg-slate-100 text-slate-500"
                                onClick={(e) => { e.stopPropagation(); locateUser(); }}
                                title="Find My Location"
                            >
                                <Crosshair className="w-5 h-5" />
                            </Button>

                            <Button
                                variant="ghost"
                                size="icon"
                                className={`h-8 w-8 rounded-full hover:bg-slate-100 ${showHistory ? 'text-blue-600 bg-blue-50' : 'text-slate-500'}`}
                                onClick={(e) => { e.stopPropagation(); setShowHistory(!showHistory); }}
                                title="Chat History"
                            >
                                <History className="w-5 h-5" />
                            </Button>

                            {showHistory && (
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-blue-50 text-blue-600" onClick={(e) => { e.stopPropagation(); createNewSession(); setShowHistory(false); }}>
                                    <PlusCircle className="w-5 h-5" />
                                </Button>
                            )}

                            <Button
                                variant="ghost"
                                size="icon"
                                className={`h-8 w-8 rounded-full hover:bg-slate-100 ${isMaximized ? 'text-blue-600' : 'text-slate-500'}`}
                                onClick={(e) => { e.stopPropagation(); setIsMaximized(!isMaximized); setIsMinimized(false); }}
                                title={isMaximized ? "Restore" : "Maximize"}
                            >
                                {isMaximized ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
                            </Button>

                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-full hover:bg-slate-100 text-slate-500"
                                onClick={(e) => { e.stopPropagation(); setIsMinimized(true); setIsMaximized(false); }}
                                title="Minimize"
                            >
                                <ChevronDown className="w-5 h-5" />
                            </Button>
                        </div>
                    </div>
                )}

                {/* Content... */}
                {!isMinimized && (
                    <>
                        {showHistory ? (
                            <ScrollArea className="flex-1 bg-slate-50/50 p-2">
                                <div className="space-y-2 p-2">
                                    <Button onClick={() => { createNewSession(); setShowHistory(false); }} className="w-full justify-start gap-3 bg-white border border-dashed border-slate-300 text-slate-600 hover:border-blue-500 hover:text-blue-600 h-12">
                                        <PlusCircle className="w-5 h-5" />
                                        Start New Chat
                                    </Button>

                                    {Object.values(sessions).sort((a, b) => b.timestamp - a.timestamp).map(session => (
                                        <div
                                            key={session.id}
                                            onClick={() => { setCurrentSessionId(session.id); setShowHistory(false); }}
                                            className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all border ${currentSessionId === session.id ? 'bg-white border-blue-200 shadow-sm' : 'bg-transparent border-transparent hover:bg-white hover:border-slate-100'}`}
                                        >
                                            <div className="flex flex-col overflow-hidden text-left">
                                                <span className={`text-sm font-medium truncate ${currentSessionId === session.id ? 'text-blue-700' : 'text-slate-700'}`}>
                                                    {session.title || 'New Chat'}
                                                </span>
                                                <span className="text-[10px] text-slate-400">
                                                    {format(session.timestamp, 'MMM d, h:mm a')}
                                                </span>
                                            </div>
                                            <button
                                                onClick={(e) => deleteSession(session.id, e)}
                                                className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-50 hover:text-red-500 rounded transition-all"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                    {Object.keys(sessions).length === 0 && (
                                        <div className="text-center text-slate-400 py-8 text-xs">No conversation history</div>
                                    )}
                                </div>
                            </ScrollArea>
                        ) : (
                            <>
                                <div className="flex-1 overflow-y-auto bg-slate-50/50 p-4 scrollbar-hide">
                                    <div className="space-y-6 max-w-3xl mx-auto pb-4">
                                        {messages.map((msg, idx) => (
                                            <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                                {msg.role === 'assistant' && (
                                                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0 mt-1">
                                                        <Bot className="w-3 h-3 text-white" />
                                                    </div>
                                                )}

                                                <div className={`flex flex-col gap-1 max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                                    {msg.content && (
                                                        <div className={`px-4 py-2.5 rounded-2xl text-sm shadow-sm leading-relaxed ${msg.role === 'user'
                                                            ? 'bg-blue-600 text-white rounded-tr-none'
                                                            : 'bg-white border border-slate-100 text-slate-700 rounded-tl-none'
                                                            }`}>
                                                            {msg.content}
                                                        </div>
                                                    )}

                                                    {/* A2UI RENDERER INTEGRATION */}
                                                    {msg.a2ui_content && (
                                                        <div className="w-full mt-2">
                                                            <A2UIRenderer content={msg.a2ui_content} />
                                                        </div>
                                                    )}

                                                    {msg.carousel && (
                                                        <div className="flex gap-3 overflow-x-auto pb-4 w-full snap-x scrollbar-hide mt-3 max-w-full px-1">
                                                            {msg.carousel.map((card, i) => (
                                                                <div key={i} className="snap-center shrink-0 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col transition-transform hover:scale-[1.02]">
                                                                    {card.image && (
                                                                        <div className="h-32 bg-slate-200 relative group">
                                                                            <img src={card.image} alt={card.title} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-700" />
                                                                            {card.distance && (
                                                                                <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-md text-white text-[10px] px-2 py-1 rounded-full flex items-center gap-1">
                                                                                    <MapIcon className="w-3 h-3" /> {card.distance}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                    <div className="p-3 flex flex-col gap-2 flex-1">
                                                                        <div>
                                                                            <h4 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1">{card.title}</h4>
                                                                            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">{card.description}</p>
                                                                        </div>

                                                                        {card.actions && (
                                                                            <div className="mt-auto pt-2 grid grid-cols-2 gap-2">
                                                                                {card.actions.map((action, idx) => (
                                                                                    <Button
                                                                                        key={idx}
                                                                                        variant={idx === 0 ? "default" : "outline"}
                                                                                        size="sm"
                                                                                        className={`h-7 text-[10px] px-0 ${idx === 0 ? 'bg-blue-600 hover:bg-blue-700' : 'border-slate-200'}`}
                                                                                        onClick={() => handleCardAction(action, card)}
                                                                                    >
                                                                                        {action.label}
                                                                                    </Button>
                                                                                ))}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {msg.choices && (
                                                        <div className="flex flex-wrap gap-2 mt-2">
                                                            {msg.choices.map((choice, i) => (
                                                                <button
                                                                    key={i}
                                                                    onClick={() => {
                                                                        setInput(choice);
                                                                        handleSend();
                                                                    }}
                                                                    className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-full text-xs font-medium hover:bg-blue-100 transition-colors"
                                                                >
                                                                    {choice}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                        {isTyping && (
                                            <div className="flex gap-3 justify-start">
                                                <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                                                    <Bot className="w-3 h-3 text-slate-500" />
                                                </div>
                                                <div className="px-4 py-2 bg-slate-100 rounded-2xl rounded-tl-none text-slate-500 text-xs italic">
                                                    Thinking...
                                                </div>
                                            </div>
                                        )}
                                        <div ref={messagesEndRef} />
                                    </div>
                                </div>

                                <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-50 relative z-20">
                                    <ScrollArea className="w-full whitespace-nowrap mb-3 pb-1">
                                        <div className="flex gap-2">
                                            {quickActions.map(action => (
                                                <button
                                                    key={action.id}
                                                    type="button"
                                                    onClick={() => handleQuickAction(action)}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-blue-600 rounded-full text-xs font-medium transition-colors border border-slate-100"
                                                >
                                                    <action.icon className="w-3.5 h-3.5" />
                                                    {action.label}
                                                </button>
                                            ))}
                                        </div>
                                    </ScrollArea>

                                    <div className="relative flex items-center gap-2">
                                        <div className="relative flex-1">
                                            <Input
                                                value={input}
                                                onChange={(e) => setInput(e.target.value)}
                                                placeholder="Ask your concierge..."
                                                className="pr-10 rounded-full border-slate-200 focus-visible:ring-blue-500/20 bg-slate-50 focus:bg-white transition-all h-11"
                                            />
                                            <Button
                                                type="submit"
                                                disabled={!input.trim()}
                                                className="absolute right-1 top-1 h-9 w-9 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-sm p-0 flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <ArrowRight className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </form>
                            </>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
