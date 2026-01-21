import React, { useState, useEffect, useRef } from 'react';
import { AgentService } from '@/features/agents/services/AgentService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, MapPin, Send, Loader2, X, Sparkles, Navigation } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion, AnimatePresence } from 'framer-motion';

const SCOUT_AGENT_CONFIG = {
    id: 'scout',
    name: 'The Scout',
    description: 'Local Guide & Navigator',
    model: 'claude-3-5-sonnet-latest',
    systemPrompt: `You are **The Scout**, Kosmoi's expert Local Guide and Navigator.
Your goal is to help visitors find the perfect experience, service, or hidden gem in Koh Samui.

## Identity & Vibe
- **Role:** Local Expert & Concierge.
- **Tone:** Enthusiastic, helpful, knowledgeable, and chill. Think "savvy local friend".
- **Knowledge:** You know the best beaches, hidden restaurants, verified service providers, and upcoming events.

## Capabilities
1.  **Smart Search:** You can understand intent (e.g., "romantic dinner with sunset" vs "cheap pad thai").
2.  **Map Control:** You can control the map view. When you recommend a place, you can move the map to it.
    - **Action:** \`move_map({ lat, lng, zoom })\`
3.  **Filtration:** You can filter markers on the map.
    - **Action:** \`filter_map({ category, tags })\`

## Instructions
- When asked for a recommendation, always provide 2-3 options with a brief reason why.
- If the user asks "Where is X?", use the \`move_map\` action.
- Mention "Verified" businesses first (they have the trust badge).
- Explain *why* a place fits their vibe (e.g., "This place has a great vibe for digital nomads").

## Conversation Style
- Use emojis 🌴 🥥 🛵.
- Keep it short and actionable.
- Don't just list; curate.`
};

export function ScoutSearch({ onMapAction }) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef(null);
    const agentService = useRef(null);

    useEffect(() => {
        agentService.current = new AgentService(SCOUT_AGENT_CONFIG);
        
        // Initial "Thought" to prime the agent (hidden)
        // We don't show this to the user, but it sets the context if we needed dynamic context.
    }, []);

    // Auto-scroll
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isTyping, isOpen]);

    const handleSend = async () => {
        if (!input.trim()) return;

        if (!isOpen) setIsOpen(true);

        const userMsg = { id: Date.now().toString(), role: 'user', content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);

        try {
            const reply = await agentService.current.sendMessage(input);
            
            // Check for tools/actions
            if (reply.toolRequest) {
                 console.log("Scout Tool Request:", reply.toolRequest);
                 if (onMapAction && (reply.toolRequest.name === 'move_map' || reply.toolRequest.name === 'filter_map')) {
                     onMapAction(reply.toolRequest);
                 }
            } else if (reply.raw?.action) {
                 console.log("Scout Raw Action:", reply.raw.action);
                 if (onMapAction) onMapAction(reply.raw.action);
            }

            const agentMsg = { 
                id: (Date.now() + 1).toString(), 
                role: 'assistant', 
                content: reply.text 
            };
            setMessages(prev => [...prev, agentMsg]);
        } catch (error) {
            console.error("Scout Error:", error);
        } finally {
            setIsTyping(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="fixed top-20 left-4 right-4 z-50 md:left-1/2 md:-translate-x-1/2 md:w-[600px] pointer-events-none">
            <div className="pointer-events-auto flex flex-col gap-2">
                {/* Search Bar / Input */}
                <Card className="shadow-2xl border-0 ring-1 ring-slate-200/50 backdrop-blur-sm bg-white/90 overflow-hidden">
                    <div className="flex items-center p-2 gap-2">
                        <div className="w-10 h-10 bg-teal-500 rounded-full flex items-center justify-center text-white shrink-0 shadow-md">
                            <Sparkles className="w-5 h-5" />
                        </div>
                        <Input 
                            className="border-0 shadow-none focus-visible:ring-0 bg-transparent text-lg placeholder:text-slate-400 h-12"
                            placeholder="Ask The Scout... (e.g., 'Best sunset dinner?')"
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            onFocus={() => setIsOpen(true)}
                        />
                        {isOpen && (
                            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="shrink-0 text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </Button>
                        )}
                        <Button 
                            className="bg-teal-600 hover:bg-teal-700 text-white rounded-full w-10 h-10 p-0 shrink-0 shadow-sm"
                            onClick={handleSend}
                            disabled={!input.trim() || isTyping}
                        >
                            {isTyping ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 ml-0.5" />}
                        </Button>
                    </div>
                </Card>

                {/* Expanded Chat Area */}
                <AnimatePresence>
                    {isOpen && messages.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: -20, height: 0 }}
                            animate={{ opacity: 1, y: 0, height: 'auto' }}
                            exit={{ opacity: 0, y: -20, height: 0 }}
                            className="overflow-hidden"
                        >
                            <Card className="shadow-2xl border-0 ring-1 ring-slate-200/50 bg-white/95 backdrop-blur-md max-h-[500px] flex flex-col">
                                <ScrollArea className="flex-1 p-4 h-[400px]">
                                    <div className="space-y-4">
                                        {messages.map((msg) => (
                                            <div
                                                key={msg.id}
                                                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                            >
                                                {msg.role !== 'user' && (
                                                    <Avatar className="w-8 h-8 border border-teal-100 shadow-sm">
                                                        <AvatarImage src="/agents/scout.png" />
                                                        <AvatarFallback className="bg-teal-100 text-teal-700">S</AvatarFallback>
                                                    </Avatar>
                                                )}
                                                
                                                <div
                                                    className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm text-sm ${
                                                        msg.role === 'user'
                                                            ? 'bg-teal-600 text-white rounded-tr-sm'
                                                            : 'bg-white border border-slate-100 text-slate-800 rounded-tl-sm'
                                                    }`}
                                                >
                                                    <ReactMarkdown 
                                                        className="prose prose-sm max-w-none dark:prose-invert prose-p:leading-relaxed"
                                                        remarkPlugins={[remarkGfm]}
                                                        components={{
                                                            p: ({node, ...props}) => <p className={`mb-1 last:mb-0`} {...props} />,
                                                        }}
                                                    >
                                                        {msg.content}
                                                    </ReactMarkdown>
                                                </div>
                                            </div>
                                        ))}
                                        {isTyping && (
                                            <div className="flex gap-3">
                                                 <Avatar className="w-8 h-8 border border-teal-100 shadow-sm">
                                                    <AvatarFallback className="bg-teal-100 text-teal-700">S</AvatarFallback>
                                                </Avatar>
                                                <div className="bg-white border border-slate-100 px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-1">
                                                    <div className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                                    <div className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                                    <div className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce"></div>
                                                </div>
                                            </div>
                                        )}
                                        <div ref={scrollRef} />
                                    </div>
                                </ScrollArea>
                            </Card>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
