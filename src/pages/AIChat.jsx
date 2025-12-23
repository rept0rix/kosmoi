import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bot, Send, Sparkles, Map as MapIcon, Info, User, Maximize2, Minimize2, ArrowRight, Trash2, PlusCircle, MessageSquare, History, Menu, Phone, ExternalLink } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth/context/AuthContext';
import { db } from '@/api/supabaseClient';
import GoogleMap from "@/components/GoogleMap";
import { useQuery } from "@tanstack/react-query";
import { getCategoryIcon } from "@/shared/utils/mapIcons";
import MapProviderCard from "@/components/MapProviderCard";
import { useWeather, getWeatherDescription } from '@/shared/hooks/useWeather';
import { samuiKnowledge } from '@/data/samuiKnowledge';
import { CONCIERGE_AGENT } from '@/features/agents/services/registry/ConciergeAgent';
import SEO from '@/components/SEO';
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from 'date-fns';

const quickActions = [
    { id: 'tour_guide', label: 'Tour Guide', icon: MapIcon, prompt: "Act as a local tour guide. What are the must-see places in Koh Samui?" },
    { id: 'build_trip', label: 'Build a Trip', icon: Sparkles, prompt: "I want to build a trip itinerary for Koh Samui. Can you help me plan?" },
    { id: 'local_info', label: 'Local Info', icon: Info, prompt: "What interesting places are near my current location?" },
    { id: 'taxi', label: 'Taxi', category: 'taxi' },
    { id: 'food', label: 'Food', category: 'restaurant' },
];

export default function AIChat() {
    const navigate = useNavigate();
    const locationState = useLocation().state;
    const { user } = useAuth();

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
    const [showSidebar, setShowSidebar] = useState(false);

    // Initialize/Load Session
    useEffect(() => {
        if (sessions[currentSessionId]) {
            setMessages(sessions[currentSessionId].messages);
        } else {
            // New Session
            setMessages([{ role: 'assistant', content: 'Sawadee krup! 🙏 I am your Koh Samui Concierge. How can I help you today?' }]);
        }
        localStorage.setItem('kosmoi_current_session_id', currentSessionId);
    }, [currentSessionId]);

    // Save Messages to Session
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
        setShowSidebar(false); // Mobile UX
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
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);

    // --- Map State ---
    const [userLocation, setUserLocation] = useState(null);
    const [mapCenter, setMapCenter] = useState({ lat: 9.5, lng: 100.0 });
    const [mapZoom, setMapZoom] = useState(13);
    const [selectedProvider, setSelectedProvider] = useState(null);
    const [isMapExpanded, setIsMapExpanded] = useState(false);

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
    }, [messages]);

    // Handle Incoming Context (e.g. from Dashboard)
    useEffect(() => {
        if (locationState?.category) {
            const prompt = `I'm interested in ${locationState.label || locationState.category}. What can you recommend?`;
            // Only trigger if it's a new empty session or explicit user intent
            if (messages.length <= 1) {
                setMessages(prev => [...prev, { role: 'user', content: prompt }]);
                processMessage(prompt);
            }
        }
    }, [locationState]);

    // Geolocation
    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                    setUserLocation(loc);
                    setMapCenter(loc);
                    setMapZoom(15);
                },
                () => console.warn("Location denied")
            );
        }
    }, []);


    const processMessage = async (text, context = "") => {
        setIsTyping(true);

        try {
            const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
            if (!apiKey) throw new Error("API Key Missing");

            // Context Building
            const providersContext = providers.map(p =>
                `- ${p.business_name} (${p.category}): ${p.description?.substring(0, 100)}... (Rating: ${p.average_rating || 'N/A'}, Phone: ${p.phone}, Location: ${p.latitude},${p.longitude})`
            ).join('\n');

            let weatherContext = "Weather data unavailable.";
            if (weatherData?.current) {
                const desc = getWeatherDescription(weatherData.current.weather_code);
                weatherContext = `Current Weather: ${Math.round(weatherData.current.temperature_2m)}°C, ${desc}.`;
            }

            const systemInstruction = `
${CONCIERGE_AGENT.systemPrompt}

**STRICT RESPONSE FORMAT:**
You MUST return valid JSON. Do not return plain text.
Structure the response to be highly interactive.

**OUTPUT SCHEMA:**
{
  "message": "Conversational response...",
  "carousel": [ 
    {
      "title": "Business Name",
      "description": "Short description covering key features.",
      "image": "https://url...",
      "phone": "+66...", // OPTIONAL: Only if available
      "whatsapp": "66...", // OPTIONAL: Clean number format
      "location": { "lat": 0.0, "lng": 0.0 }, // OPTIONAL: For map link
      "actionLabel": "View Details" // Button text
    }
  ],
  "choices": ["Option 1", "Option 2"]
}

**CONTEXT:**
Weather: ${weatherContext}
Knowledge: ${JSON.stringify(samuiKnowledge)}
Providers: ${providersContext}
`;

            const history = messages.map(msg => ({
                role: msg.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: msg.content }]
            }));

            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    systemInstruction: { parts: [{ text: systemInstruction }] },
                    contents: [...history, { role: 'user', parts: [{ text: context ? `${context}\n\n${text}` : text }] }]
                })
            });

            const data = await response.json();
            const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

            let parsed;
            try {
                // Extract JSON block
                const match = responseText.match(/\{[\s\S]*\}/);
                parsed = match ? JSON.parse(match[0]) : { message: responseText };
            } catch (e) {
                parsed = { message: responseText };
            }

            setMessages(prev => [...prev, {
                role: 'assistant',
                content: parsed.message || "Here is what I found:",
                carousel: parsed.carousel,
                choices: parsed.choices
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
        if (!input.trim()) return;

        const txt = input;
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: txt }]);
        processMessage(txt, userLocation ? `Loc: ${userLocation.lat},${userLocation.lng}` : "");
    };

    const handleQuickAction = (action) => {
        const prompt = action.prompt || `Show me best ${action.label} in Samui`;
        setMessages(prev => [...prev, { role: 'user', content: action.label }]);
        processMessage(prompt);
    };

    const ActionButton = ({ icon: Icon, label, onClick, className }) => (
        <button onClick={onClick} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${className}`}>
            <Icon className="w-3.5 h-3.5" />
            {label}
        </button>
    );

    return (
        <div className="flex h-[calc(100vh-56px)] bg-slate-50 relative overflow-hidden">
            <SEO title="Concierge AI | Kosmoi" />

            {/* --- SIDEBAR --- */}
            <div className={`fixed inset-y-0 left-0 z-40 w-72 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out ${showSidebar ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0`}>
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                        <h2 className="font-bold text-slate-800 flex items-center gap-2">
                            <History className="w-5 h-5 text-blue-600" />
                            History
                        </h2>
                        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setShowSidebar(false)}>
                            <Minimize2 className="w-5 h-5" />
                        </Button>
                    </div>

                    {/* New Chat Button */}
                    <div className="p-3">
                        <Button onClick={createNewSession} className="w-full justify-start gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-md rounded-xl">
                            <PlusCircle className="w-4 h-4" />
                            New Topic
                        </Button>
                    </div>

                    {/* Session List */}
                    <ScrollArea className="flex-1 px-3">
                        <div className="space-y-1 py-2">
                            {Object.values(sessions).sort((a, b) => b.timestamp - a.timestamp).map(session => (
                                <div
                                    key={session.id}
                                    onClick={() => { setCurrentSessionId(session.id); setShowSidebar(false); }}
                                    className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all ${currentSessionId === session.id ? 'bg-blue-50 border-blue-100 ring-1 ring-blue-200' : 'hover:bg-slate-50 border border-transparent'}`}
                                >
                                    <div className="flex flex-col overflow-hidden">
                                        <span className={`text-sm font-medium truncate ${currentSessionId === session.id ? 'text-blue-700' : 'text-slate-700'}`}>
                                            {session.title || 'New Chat'}
                                        </span>
                                        <span className="text-xs text-slate-400">
                                            {format(session.timestamp, 'MMM d, h:mm a')}
                                        </span>
                                    </div>
                                    <button
                                        onClick={(e) => deleteSession(session.id, e)}
                                        className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-50 hover:text-red-500 rounded-md transition-all"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </div>
            </div>

            {/* --- MAIN CHAT AREA --- */}
            <div className="flex-1 flex flex-col h-full w-full relative">

                {/* Mobile Header */}
                <div className="md:hidden flex items-center justify-between px-4 py-2 bg-white border-b border-slate-100 shrink-0">
                    <Button variant="ghost" size="icon" onClick={() => setShowSidebar(true)}>
                        <Menu className="w-5 h-5 text-slate-600" />
                    </Button>
                    <span className="font-semibold text-slate-700">Kosmoi AI</span>
                    <div className="w-9" />
                </div>

                {/* Map View */}
                <div className={`relative w-full transition-all duration-500 ease-in-out bg-slate-100 ${isMapExpanded ? 'flex-[2]' : 'h-48 shrink-0'}`}>
                    <GoogleMap
                        center={mapCenter}
                        zoom={mapZoom}
                        height="100%"
                        markers={providers.map(p => ({
                            lat: p.latitude, lng: p.longitude,
                            title: p.business_name,
                            icon: getCategoryIcon(p.category),
                            onClick: () => { setSelectedProvider(p); setMapCenter({ lat: p.latitude, lng: p.longitude }); }
                        }))}
                        options={{ disableDefaultUI: true }}
                    />
                    <Button
                        variant="secondary"
                        size="icon"
                        className="absolute top-4 right-4 z-10 bg-white/90 shadow-lg hover:scale-105 transition-transform rounded-full"
                        onClick={() => setIsMapExpanded(!isMapExpanded)}
                    >
                        {isMapExpanded ? <Minimize2 className="w-5 h-5 text-blue-600" /> : <Maximize2 className="w-5 h-5 text-blue-600" />}
                    </Button>
                </div>

                {/* Messages Feed */}
                <ScrollArea className="flex-1 bg-slate-50/50 p-4">
                    <div className="space-y-6 pb-4 max-w-3xl mx-auto">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                {msg.role === 'assistant' && (
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-sm ring-2 ring-white">
                                        <Sparkles className="w-4 h-4 text-white" />
                                    </div>
                                )}

                                <div className={`flex flex-col gap-2 max-w-[90%] md:max-w-[75%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                    {/* Text Bubble */}
                                    {msg.content && (
                                        <div className={`p-3.5 rounded-2xl shadow-sm text-sm leading-relaxed whitespace-pre-wrap ${msg.role === 'user'
                                                ? 'bg-blue-600 text-white rounded-tr-none'
                                                : 'bg-white border border-slate-100 text-slate-700 rounded-tl-none'
                                            }`}>
                                            {msg.content}
                                        </div>
                                    )}

                                    {/* Rich Carousel */}
                                    {msg.carousel && (
                                        <div className="flex gap-3 overflow-x-auto pb-2 w-full snap-x scrollbar-hide">
                                            {msg.carousel.map((card, i) => (
                                                <div key={i} className="snap-center shrink-0 w-64 bg-white rounded-xl shadow-md border border-slate-100 overflow-hidden flex flex-col group hover:shadow-lg transition-all">
                                                    {card.image && (
                                                        <div className="h-32 bg-slate-200 relative overflow-hidden">
                                                            <img src={card.image} alt={card.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                                                            <h3 className="absolute bottom-2 left-3 font-bold text-white shadow-black/20 text-sm truncate w-[90%]">{card.title}</h3>
                                                        </div>
                                                    )}
                                                    <div className="p-3 flex flex-col gap-2 flex-1">
                                                        {!card.image && <h3 className="font-bold text-slate-800">{card.title}</h3>}
                                                        <p className="text-xs text-slate-500 line-clamp-2">{card.description}</p>

                                                        {/* Action Buttons */}
                                                        <div className="mt-auto flex flex-wrap gap-2 pt-2">
                                                            {card.phone && (
                                                                <ActionButton
                                                                    icon={Phone}
                                                                    label="Call"
                                                                    className="bg-green-50 text-green-700 hover:bg-green-100 border-green-100"
                                                                    onClick={() => window.location.href = `tel:${card.phone}`}
                                                                />
                                                            )}
                                                            {card.whatsapp && (
                                                                <ActionButton
                                                                    icon={MessageSquare}
                                                                    label="Chat"
                                                                    className="bg-green-50 text-green-700 hover:bg-green-100 border-green-100"
                                                                    onClick={() => window.open(`https://wa.me/${card.whatsapp.replace(/[^0-9]/g, "")}`, "_blank")}
                                                                />
                                                            )}
                                                            {card.location && (
                                                                <ActionButton
                                                                    icon={MapIcon}
                                                                    label="Map"
                                                                    className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-100 ml-auto"
                                                                    onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${card.location.lat},${card.location.lng}`, "_blank")}
                                                                />
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Choice Chips */}
                                    {msg.choices && (
                                        <div className="flex flex-wrap gap-2 mt-1">
                                            {msg.choices.map((choice, i) => (
                                                <button key={i} onClick={() => { setInput(choice); handleSend(); }} className="px-3 py-1.5 bg-white border border-blue-100 text-blue-600 rounded-full text-xs font-semibold hover:bg-blue-50 transition-colors">
                                                    {choice}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                </ScrollArea>

                {/* Input Area */}
                <div className="p-4 bg-white border-t border-slate-100 shrink-0 max-w-4xl mx-auto w-full">
                    {/* Quick Prompts - Horizontal Scroll */}
                    <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide">
                        {quickActions.map(action => (
                            <button
                                key={action.id}
                                onClick={() => handleQuickAction(action)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-medium rounded-full border border-slate-200 transition-colors whitespace-nowrap"
                            >
                                {action.icon && <action.icon className="w-3 h-3" />}
                                {action.label}
                            </button>
                        ))}
                    </div>

                    <form onSubmit={handleSend} className="relative flex items-center gap-2">
                        <div className="relative flex-1">
                            <Input
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                placeholder="Start a new topic or ask a question..."
                                className="pr-12 py-6 rounded-2xl border-slate-200 bg-slate-50 focus:bg-white transition-all shadow-sm"
                            />
                            <Button type="submit" size="icon" disabled={!input.trim() || isTyping} className="absolute right-1.5 top-1.5 h-9 w-9 bg-blue-600 hover:bg-blue-500 rounded-xl transition-all disabled:opacity-50">
                                <Send className="w-4 h-4 text-white" />
                            </Button>
                        </div>
                    </form>
                </div>

            </div>
        </div>
    );
}
