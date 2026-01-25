import React, { useState, useRef, useEffect } from 'react';
import { tripPlanner } from '@/services/ai/TripPlannerService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, Anchor, Sparkles, Loader2, Map } from 'lucide-react';
import yachtData from '@/data/yacht_listings.json';

const RecommendedYachtCard = ({ yachtId }) => {
    const yacht = yachtData.find(y => y.id === yachtId);
    if (!yacht) return null;

    return (
        <div className="mt-3 p-4 bg-slate-800/80 rounded-xl border border-amber-500/30 flex flex-col gap-3 shadow-lg max-w-sm">
            <div className="aspect-video w-full overflow-hidden rounded-lg">
                <img src={yacht.image} alt={yacht.name} className="w-full h-full object-cover" />
            </div>
            <div>
                <h4 className="text-white font-bold text-lg">{yacht.name}</h4>
                <p className="text-amber-400 text-sm font-mono">{Number(yacht.price_thb).toLocaleString()} THB</p>
            </div>
            <p className="text-slate-300 text-xs line-clamp-2">{yacht.description}</p>
            <Button className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs uppercase tracking-wider">
                Book {yacht.name}
            </Button>
        </div>
    );
};

const TripPlannerChat = () => {
    const [messages, setMessages] = useState([
        { id: 'welcome', role: 'assistant', content: "Sawasdee! ⚓ I'm Captain Kosmoi. Tell me about your dream trip (e.g., 'Family snorkeling trip' or 'Romantic sunset'), and I'll plan it for you." }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef(null);

    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userText = input;
        setInput('');
        setMessages(prev => [...prev, { id: Date.now(), role: 'user', content: userText }]);
        setIsLoading(true);

        try {
            const response = await tripPlanner.sendMessage(userText);

            // Extract Recommendation Tag
            const recommendMatch = response.match(/\[RECOMMEND: (.*?)\]/);
            const cleanResponse = response.replace(/\[RECOMMEND: .*?\]/, '').trim();
            const recommendedId = recommendMatch ? recommendMatch[1] : null;

            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                role: 'assistant',
                content: cleanResponse,
                recommendedId: recommendedId
            }]);

        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, { id: Date.now() + 1, role: 'assistant', content: "My radio is a bit fuzzy (Connection Error). Please try again." }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-[600px] w-full max-w-2xl mx-auto bg-slate-950 border border-white/10 rounded-2xl shadow-2xl overflow-hidden relative">
            {/* Header */}
            <div className="p-4 bg-slate-900 border-b border-white/5 flex items-center gap-3">
                <div className="p-2 bg-amber-500/10 rounded-lg">
                    <Anchor className="w-6 h-6 text-amber-500" />
                </div>
                <div>
                    <h3 className="text-white font-heading text-lg">Captain Kosmoi</h3>
                    <p className="text-slate-400 text-xs">AI Trip Planner</p>
                </div>
            </div>

            {/* Chat Area */}
            <ScrollArea className="flex-1 p-4 bg-slate-950/50">
                <div className="space-y-6 pb-4">
                    {messages.map((msg) => (
                        <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                            <Avatar className="w-8 h-8 border border-white/10 mt-1">
                                <AvatarFallback className={msg.role === 'assistant' ? 'bg-amber-500/10 text-amber-500' : 'bg-blue-500/10 text-blue-500'}>
                                    {msg.role === 'assistant' ? 'CK' : 'U'}
                                </AvatarFallback>
                            </Avatar>

                            <div className={`flex flex-col max-w-[80%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${msg.role === 'user'
                                        ? 'bg-blue-600 text-white rounded-tr-sm'
                                        : 'bg-white/10 text-slate-200 rounded-tl-sm'
                                    }`}>
                                    {/* Simple Markdown Bold Parsing */}
                                    {msg.content.split('**').map((part, i) =>
                                        i % 2 === 1 ? <strong key={i} className="text-white font-semibold">{part}</strong> : part
                                    )}
                                </div>

                                {/* Render Recommendation Card if exists */}
                                {msg.recommendedId && (
                                    <RecommendedYachtCard yachtId={msg.recommendedId} />
                                )}
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex gap-3">
                            <Avatar className="w-8 h-8 border border-white/10 mt-1">
                                <AvatarFallback className="bg-amber-500/10 text-amber-500">CK</AvatarFallback>
                            </Avatar>
                            <div className="bg-white/5 px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-2">
                                <Loader2 className="w-4 h-4 text-slate-500 animate-spin" />
                                <span className="text-xs text-slate-500">Charting course...</span>
                            </div>
                        </div>
                    )}
                    <div ref={scrollRef} />
                </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="p-4 bg-slate-900 border-t border-white/5">
                <div className="flex gap-2">
                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Ask about trips, islands, or yachts..."
                        className="bg-slate-950 border-slate-800 text-white focus-visible:ring-amber-500"
                        disabled={isLoading}
                    />
                    <Button
                        onClick={handleSend}
                        disabled={isLoading || !input.trim()}
                        className="bg-amber-500 hover:bg-amber-600 text-slate-950"
                    >
                        <Send className="w-4 h-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default TripPlannerChat;
