import React, { useState, useEffect, useRef } from 'react';
import { AgentService } from '@/features/agents/services/AgentService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Lightbulb, Send, User, Bot, Loader2, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Hardcoded config matching opencode.json for client-side usage
const CONSULTANT_AGENT_CONFIG = {
    id: 'consultant',
    name: 'The Consultant',
    description: 'Expert AI Business Advisor',
    model: 'claude-3-5-sonnet-latest',
    systemPrompt: `You are **The Consultant**, Kosmoi's expert AI Business Advisor.
Your goal is to help business owners grow their presence, optimize their profile, and understand market trends.

## Identity & Vibe
- **Role:** High-level Business Strategist & Data Analyst.
- **Tone:** Professional, insightful, encouraging, yet direct. Think "mckinsey consultant on a beach".

## Capabilities
1.  **Profile Analysis:** You can critique a business's description, photos, and completeness.
2.  **Market Insights:** (Future) You can compare them to competitors.
3.  **Action Plans:** You always end with concrete "Next Steps" for the user.
`
};

export function ConsultantChat({ business }) {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef(null);
    const agentService = useRef(null);

    // Initialize Agent on Mount
    useEffect(() => {
        agentService.current = new AgentService(CONSULTANT_AGENT_CONFIG);
        
        // Initial Greeting with Context
        const initialContext = `
        Start the conversation by introducing yourself as "The Consultant".
        You have just joined the team for "${business.business_name}".
        
        Here is the current business data:
        - Name: ${business.business_name}
        - Category: ${business.category || 'N/A'}
        - Description Length: ${business.description?.length || 0} chars
        - Photos: ${business.images?.length || 0}
        - Verified: ${business.verified ? 'Yes' : 'No'}
        - Rating: ${business.average_rating || 0} (${business.total_reviews || 0} reviews)
        - Location: ${business.location || 'N/A'}
        
        Give a super brief 1-sentence analysis and ask how you can help optimize their business today.
        `;

        // Send hidden system message to prime the agent
        setIsTyping(true);
        agentService.current.sendMessage(initialContext)
            .then(reply => {
                setMessages([
                    { id: '1', role: 'assistant', content: reply.text }
                ]);
                setIsTyping(false);
            })
            .catch(err => {
                console.error("Agent Init Error:", err);
                setIsTyping(false);
            });

    }, [business]);

    // Auto-scroll
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isTyping]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg = { id: Date.now().toString(), role: 'user', content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);

        try {
            const reply = await agentService.current.sendMessage(input);
            const agentMsg = { 
                id: (Date.now() + 1).toString(), 
                role: 'assistant', 
                content: reply.text 
            };
            setMessages(prev => [...prev, agentMsg]);
        } catch (error) {
            console.error("Agent Error:", error);
            setMessages(prev => [...prev, { 
                id: Date.now().toString(), 
                role: 'system', 
                content: "Applying sunscreen... (Connection Error)" 
            }]);
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
        <Card className="h-[600px] flex flex-col shadow-xl border-t-4 border-t-purple-600">
            <CardHeader className="bg-purple-50/50 pb-3">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center shadow-md">
                        <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <CardTitle className="text-purple-900">The Consultant</CardTitle>
                        <CardDescription className="text-purple-600">Business Strategy & Optimization</CardDescription>
                    </div>
                </div>
            </CardHeader>
            
            <CardContent className="flex-1 flex flex-col p-0 overflow-hidden bg-slate-50">
                <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                {msg.role !== 'user' && (
                                    <Avatar className="w-8 h-8 border border-purple-200">
                                        <AvatarImage src="/agents/consultant.png" />
                                        <AvatarFallback className="bg-purple-100 text-purple-700">C</AvatarFallback>
                                    </Avatar>
                                )}
                                
                                <div
                                    className={`max-w-[80%] rounded-2xl p-4 shadow-sm ${
                                        msg.role === 'user'
                                            ? 'bg-blue-600 text-white rounded-br-none'
                                            : 'bg-white border border-slate-100 text-slate-800 rounded-bl-none'
                                    }`}
                                >
                                    <ReactMarkdown 
                                        className="prose prose-sm max-w-none dark:prose-invert"
                                        remarkPlugins={[remarkGfm]}
                                        components={{
                                            p: ({node, ...props}) => <p className={`mb-2 last:mb-0 ${msg.role === 'user' ? 'text-white' : ''}`} {...props} />,
                                            ul: ({node, ...props}) => <ul className="list-disc pl-4 mb-2" {...props} />,
                                            li: ({node, ...props}) => <li className="mb-1" {...props} />,
                                        }}
                                    >
                                        {msg.content}
                                    </ReactMarkdown>
                                </div>

                                {msg.role === 'user' && (
                                    <Avatar className="w-8 h-8">
                                        <AvatarFallback className="bg-slate-200">Me</AvatarFallback>
                                    </Avatar>
                                )}
                            </div>
                        ))}

                        {isTyping && (
                            <div className="flex gap-3">
                                <Avatar className="w-8 h-8 border border-purple-200">
                                    <AvatarFallback className="bg-purple-100 text-purple-700">C</AvatarFallback>
                                </Avatar>
                                <div className="bg-white border border-slate-100 rounded-2xl rounded-bl-none p-4 shadow-sm flex items-center gap-2">
                                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                                </div>
                            </div>
                        )}
                        <div ref={scrollRef} />
                    </div>
                </ScrollArea>

                <div className="p-4 bg-white border-t border-slate-100">
                    <div className="flex gap-2">
                        <Input
                            placeholder="Ask for advice..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="bg-slate-50 border-slate-200 focus:ring-purple-500"
                        />
                        <Button 
                            onClick={handleSend} 
                            disabled={!input.trim() || isTyping}
                            className="bg-purple-600 hover:bg-purple-700 text-white"
                        >
                            {isTyping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
