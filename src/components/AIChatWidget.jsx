import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bot, Send, Sparkles, Map as MapIcon, Info, ArrowRight, Trash2, PlusCircle, History, ChevronUp, ChevronDown, Crosshair, X } from 'lucide-react';
import { useAuth } from '@/features/auth/context/AuthContext';
import { db } from '@/api/supabaseClient';
import { useQuery } from "@tanstack/react-query";
import { useWeather, getWeatherDescription } from '@/shared/hooks/useWeather';
import { samuiKnowledge } from '@/data/samuiKnowledge';
import { CONCIERGE_AGENT } from '@/features/agents/services/registry/ConciergeAgent';
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from 'date-fns';
import { memoryService } from '@/services/ai/MemoryService';
import A2UIRenderer from "@/components/a2ui/A2UIRenderer";

export default function AIChatWidget({ isOpen, onClose, context = {} }) {
    if (!isOpen) return null;

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
    const [showHistory, setShowHistory] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);

    // Initialize/Load Session
    // Initialize/Load Session
    useEffect(() => {
        if (sessions[currentSessionId]) {
            setMessages(sessions[currentSessionId].messages);
        } else {
            // No existing session data
            if (context && (Object.keys(context).length > 0 || (typeof context === 'string' && context.length > 0))) {
                // Generate context-aware greeting
                generateSmartGreeting();
            } else {
                setMessages([{ role: 'assistant', content: 'Sawadee krup! 🙏 I am your Koh Samui Concierge. How can I help you today?' }]);
            }
        }
        localStorage.setItem('kosmoi_current_session_id', currentSessionId);
    }, [currentSessionId]);

    const generateSmartGreeting = async () => {
        setIsTyping(true);
        try {
            const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
            const systemCtx = `
            User is opening the chat from a specific page. 
            CONTEXT: ${typeof context === 'string' ? context : JSON.stringify(context)}
            User Location: ${userLocation ? `${userLocation.lat}, ${userLocation.lng}` : 'Unknown'}
            
            Task: detailed, specific greeting acknowledging the user's current view/search. 
            Example: "I see you're looking for restaurants in Chaweng. How can I help you narrow it down?"
            Keep it under 2 sentences. Friendly, helpful.
            `;

            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    systemInstruction: { parts: [{ text: CONCIERGE_AGENT.systemPrompt }] },
                    contents: [{ role: 'user', parts: [{ text: systemCtx }] }]
                })
            });
            const data = await response.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "Sawadee krup! How can I help?";

            setMessages([{ role: 'assistant', content: text }]);
        } catch (e) {
            console.error("Greeting failed", e);
            setMessages([{ role: 'assistant', content: 'Sawadee krup! 🙏 I am your Koh Samui Concierge. How can I help you today?' }]);
        } finally {
            setIsTyping(false);
        }
    };

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
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);
    const [userLocation, setUserLocation] = useState(null);

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
    }, [messages, showHistory]);

    // Geolocation
    const locateUser = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                    setUserLocation(loc);
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

    // NOTE: Removed previous Initial context greeting effect as it is now handled in session init

    const processMessage = async (text, extraContext = "") => {
        setIsTyping(true);

        try {
            const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
            if (!apiKey) throw new Error("API Key Missing");

            const systemInstruction = `
${CONCIERGE_AGENT.systemPrompt}

**STRICT RESPONSE FORMAT:**
You MUST return valid JSON. Do not return plain text.
Structure the response to be highly interactive.

**A2UI CAPABILITY:**
You can now render rich UI components using the 'a2ui_content' field.
Use this for tables, forms, dashboards, or complex layouts.
For tours/activities, ALWAYS use 'experience-card'.

**OUTPUT SCHEMA:**
{
  "message": "Conversational response...",
  "a2ui_content": { "type": "card", "props": { "title": "Example" }, "children": "..." },
  "carousel": [ { "title": "Business Name", "description": "...", "image": "...", "actionLabel": "View Details" } ],
  "choices": ["Option 1", "Option 2"]
}

**CONTEXT:**
Current Page Context: ${typeof context === 'string' ? context : JSON.stringify(context)}
User Location: ${userLocation ? `${userLocation.lat}, ${userLocation.lng}` : 'Unknown'}
Knowledge: ${JSON.stringify(samuiKnowledge).substring(0, 1000)}...
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
                    contents: [...history, { role: 'user', parts: [{ text: extraContext ? `${extraContext}\n\n${text}` : text }] }]
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
        processMessage(txt);
    };

    return (
        <div
            className={`fixed z-50 flex flex-col overflow-hidden bg-white/95 backdrop-blur-md shadow-2xl border border-white/20 transition-all duration-300 ease-in-out ${isMinimized
                ? 'w-auto h-auto rounded-full bottom-24 right-4'
                : 'w-[90vw] md:w-[400px] h-[600px] max-h-[80vh] rounded-3xl bottom-24 right-4'
                }`}
        >
            {/* HEADER */}
            {isMinimized ? (
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-14 w-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg p-0"
                    onClick={() => setIsMinimized(false)}
                >
                    <Bot className="w-8 h-8" />
                </Button>
            ) : (
                <div className="flex-none flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-white/80 cursor-move">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                            <Bot className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="font-bold text-slate-800 text-sm">Kosmoi Concierge</h2>
                            <p className="text-[10px] text-green-600 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                Online
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-slate-100 text-slate-500" onClick={() => setIsMinimized(true)}>
                            <ChevronDown className="w-5 h-5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-red-50 text-slate-500 hover:text-red-500" onClick={onClose}>
                            <X className="w-5 h-5" />
                        </Button>
                    </div>
                </div>
            )}

            {/* CONTENT */}
            {!isMinimized && (
                <>
                    <div className="flex-1 overflow-y-auto bg-slate-50/50 p-4 scrollbar-hide">
                        <div className="space-y-4">
                            {messages.map((msg, idx) => (
                                <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    {msg.role === 'assistant' && (
                                        <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-1">
                                            <Bot className="w-3 h-3 text-blue-600" />
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

                                        {msg.choices && (
                                            <div className="flex flex-wrap gap-1.5 mt-1">
                                                {msg.choices.map((choice, i) => (
                                                    <button key={i} onClick={() => { setInput(choice); handleSend(); }} className="px-2.5 py-1 bg-white border border-blue-100 text-blue-600 rounded-full text-[10px] font-medium hover:bg-blue-50">
                                                        {choice}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {isTyping && (
                                <div className="flex justify-start">
                                    <div className="bg-slate-100 px-4 py-2 rounded-2xl rounded-tl-none text-slate-500 text-xs flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                    </div>

                    {/* INPUT AREA */}
                    <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-100">
                        <div className="relative flex items-center gap-2">
                            <Input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Ask..."
                                className="pr-10 rounded-full border-slate-200 focus:ring-blue-500/20 bg-slate-50 focus:bg-white transition-all h-10"
                            />
                            <Button
                                type="submit"
                                disabled={!input.trim()}
                                className="absolute right-1 top-1 h-8 w-8 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-sm p-0 flex items-center justify-center transition-all disabled:opacity-50"
                            >
                                <ArrowRight className="w-4 h-4" />
                            </Button>
                        </div>
                    </form>
                </>
            )}
        </div>
    );
}
