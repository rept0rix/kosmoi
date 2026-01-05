import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Send, ShieldAlert, X, Minimize2, Maximize2 } from "lucide-react";
import { AgentService } from "@/features/agents/services/AgentService";
import { ADMIN_AGENT } from "@/features/agents/services/registry/AdminAgent";
import { useLocation } from 'react-router-dom';

export default function AdminCopilotWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'assistant', content: 'Ready strictly for business. What do you need?' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef(null);
    const location = useLocation();

    // Agent Instance
    const agentRef = useRef(null);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        // Initialize Agent
        agentRef.current = new AgentService(ADMIN_AGENT, {
            userId: 'admin-user' // In real app, get from Auth Context
        });
    }, []);

    // Auto-scroll
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, isOpen]);

    const handleSend = async () => {
        if (!input.trim() || loading) return;

        const userMsg = input;
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setLoading(true);

        try {
            // Inject Context: Current Page
            const contextOptions = {
                systemConfig: {
                    pageContext: `User is currently on page: ${location.pathname}`
                }
            };

            const response = await agentRef.current.sendMessage(userMsg, contextOptions);

            // Parse JSON response if possible, or use raw text
            let content = response.text;
            let choices = [];

            try {
                // The agent is instructed to return JSON.
                // However, sometimes it wraps it in markdown blocks or plain text.
                // We'll try to extract JSON if present.
                const jsonMatch = response.text.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    const parsed = JSON.parse(jsonMatch[0]);
                    content = parsed.message || parsed.text;
                    choices = parsed.choices || [];

                    if (parsed.thought) {
                        console.log("[Gravity Thought]:", parsed.thought);
                    }
                }
            } catch (e) {
                // Fallback to raw text
                console.warn("Failed to parse agent JSON", e);
            }

            setMessages(prev => [...prev, {
                role: 'assistant',
                content: content,
                choices: choices
            }]);

        } catch (error) {
            setMessages(prev => [...prev, { role: 'system', content: `Error: ${error.message}` }]);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) {
        return (
            <Button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-xl bg-slate-900 border border-slate-700 hover:bg-slate-800 z-50 transition-all duration-300 hover:scale-110"
            >
                <ShieldAlert className="h-6 w-6 text-red-500" />
            </Button>
        );
    }

    return (
        <Card className={`fixed bottom-6 right-6 z-50 flex flex-col shadow-2xl bg-slate-950 border-slate-800 transition-all duration-300 ${isMinimized ? 'w-72 h-14' : 'w-96 h-[600px]'}`}>
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-slate-800 bg-slate-900/50 rounded-t-lg cursor-pointer" onClick={() => !isMinimized && setIsMinimized(!isMinimized)}>
                <div className="flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 text-red-500" />
                    <span className="font-semibold text-slate-200">Gravity <span className="text-xs text-slate-500 font-normal">v1.0</span></span>
                    <Badge variant="outline" className="text-[10px] h-5 border-slate-700 text-slate-400">COO</Badge>
                </div>
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }}>
                        {isMinimized ? <Maximize2 className="h-3 w-3" /> : <Minimize2 className="h-3 w-3" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-red-900/20 hover:text-red-500" onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}>
                        <X className="h-3 w-3" />
                    </Button>
                </div>
            </div>

            {/* Chat Area */}
            {!isMinimized && (
                <>
                    <ScrollArea className="flex-1 p-4">
                        <div className="space-y-4">
                            {messages.map((msg, idx) => (
                                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] rounded-lg p-3 text-sm ${msg.role === 'user'
                                        ? 'bg-blue-600 text-white'
                                        : msg.role === 'system'
                                            ? 'bg-red-900/20 text-red-200 border border-red-900'
                                            : 'bg-slate-800 text-slate-200 border border-slate-700'
                                        }`}>
                                        {msg.content}
                                        {msg.choices && msg.choices.length > 0 && (
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                {msg.choices.map(choice => (
                                                    <Button
                                                        key={choice}
                                                        variant="secondary"
                                                        size="sm"
                                                        onClick={() => { setInput(choice); handleSend(); }}
                                                        className="text-xs h-7"
                                                    >
                                                        {choice}
                                                    </Button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {loading && (
                                <div className="flex justify-start">
                                    <div className="bg-slate-800 rounded-lg p-3">
                                        <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                    </ScrollArea>

                    {/* Input */}
                    <div className="p-3 border-t border-slate-800 bg-slate-900/30">
                        <form
                            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                            className="flex gap-2"
                        >
                            <Input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Command or query..."
                                className="bg-slate-900 border-slate-700 text-slate-200 focus-visible:ring-red-500"
                            />
                            <Button type="submit" size="icon" className="bg-red-600 hover:bg-red-700 text-white" disabled={loading}>
                                <Send className="h-4 w-4" />
                            </Button>
                        </form>
                    </div>
                </>
            )}
        </Card>
    );
}
