
import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Bot, Send, ArrowLeft, LifeBuoy, MessageCircle, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SUPPORT_AGENT } from '@/features/agents/services/registry/SupportAgent';
import { useAuth } from '@/features/auth/context/AuthContext';
import ReactMarkdown from 'react-markdown';

export default function SupportChat() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [hasStarted, setHasStarted] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleStartChat = () => {
        setHasStarted(true);
        setMessages([{
            role: 'assistant',
            content: "Hello! I'm the Kosmoi Support Assistant. How can I help you today? I can assist with account issues, business verification, or general questions about the platform."
        }]);
    };

    const handleSend = async (e) => {
        e?.preventDefault();
        const txt = input.trim();
        if (!txt) return;

        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: txt }]);
        setIsTyping(true);

        try {
            const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

            const history = messages.map(msg => ({
                role: msg.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: msg.content }]
            }));

            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    systemInstruction: { parts: [{ text: SUPPORT_AGENT.systemPrompt }] },
                    contents: [...history, { role: 'user', parts: [{ text: txt }] }]
                })
            });

            const data = await response.json();
            const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || "I apologize, but I'm having trouble connecting right now.";

            setMessages(prev => [...prev, { role: 'assistant', content: responseText }]);

        } catch (error) {
            console.error("Support Chat Error:", error);
            setMessages(prev => [...prev, { role: 'assistant', content: "Network error. Please try again." }]);
        } finally {
            setIsTyping(false);
        }
    };

    // --- SCREEN 1: PORTAL / EXPLANATION ---
    if (!hasStarted) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <Card className="max-w-2xl w-full bg-white shadow-xl rounded-2xl overflow-hidden">
                    <div className="bg-blue-600 p-8 text-white text-center">
                        <LifeBuoy className="w-16 h-16 mx-auto mb-4 opacity-90" />
                        <h1 className="text-3xl font-bold mb-2">Kosmoi Support Center</h1>
                        <p className="text-blue-100">We're here to help you get the most out of the island.</p>
                    </div>

                    <div className="p-8 space-y-8">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                                    <Bot className="w-6 h-6" />
                                </div>
                                <h3 className="font-bold text-xl">Instant AI Support</h3>
                                <p className="text-slate-600 text-base">
                                    Our AI agent can answer questions about accounts, verification, and using the site instantly.
                                </p>
                            </div>
                            <div className="space-y-3">
                                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-green-600">
                                    <MessageCircle className="w-6 h-6" />
                                </div>
                                <h3 className="font-bold text-xl">Human Escalation</h3>
                                <p className="text-slate-600 text-base">
                                    If the AI can't solve it, we'll flag your issue for our human support team to review ASAP.
                                </p>
                            </div>
                        </div>

                        <div className="border-t border-slate-100 pt-8">
                            <h4 className="font-medium text-slate-900 mb-4 text-lg">What can we help with?</h4>
                            <ul className="space-y-3 text-base text-slate-600">
                                <li className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-slate-400" />
                                    How do I claim my business profile?
                                </li>
                                <li className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-slate-400" />
                                    I forgot my password / Login issues.
                                </li>
                                <li className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-slate-400" />
                                    Report a bug or incorrect map data.
                                </li>
                            </ul>
                        </div>

                        <div className="flex flex-col gap-3">
                            <Button
                                size="lg"
                                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-lg shadow-lg shadow-blue-200"
                                onClick={handleStartChat}
                            >
                                Start Support Chat
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={() => navigate(-1)}
                                className="w-full text-slate-500"
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>
        );
    }

    // --- SCREEN 2: ACTIVE CHAT ---
    return (
        <div className="min-h-screen bg-slate-100 flex flex-col">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-sm sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                        <ArrowLeft className="w-5 h-5 text-slate-600" />
                    </Button>
                    <div>
                        <h2 className="font-bold text-slate-800 flex items-center gap-2">
                            <Bot className="w-5 h-5 text-blue-600" />
                            Kosmoi Support
                        </h2>
                        <span className="text-sm text-green-600 flex items-center gap-1">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                            Online
                        </span>
                    </div>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 max-w-3xl mx-auto w-full space-y-6">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.role === 'assistant' && (
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0 border border-blue-200">
                                <Bot className="w-4 h-4 text-blue-600" />
                            </div>
                        )}
                        <div className={`flex flex-col max-w-[80%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                            <div className={`px-5 py-3 rounded-2xl shadow-sm text-base leading-relaxed ${msg.role === 'user'
                                ? 'bg-blue-600 text-white rounded-tr-none'
                                : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                                }`}>
                                <ReactMarkdown>{msg.content}</ReactMarkdown>
                            </div>
                        </div>
                    </div>
                ))}
                {isTyping && (
                    <div className="flex gap-3 justify-start">
                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                            <Bot className="w-4 h-4 text-slate-500" />
                        </div>
                        <div className="px-4 py-2 bg-slate-100 rounded-2xl rounded-tl-none text-slate-500 text-xs italic">
                            Typing...
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="bg-white border-t border-slate-200 p-4 sticky bottom-0">
                <form onSubmit={handleSend} className="max-w-3xl mx-auto relative flex gap-2">
                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type your message..."
                        className="h-14 rounded-xl border-slate-300 focus-visible:ring-blue-500 bg-slate-50 focus:bg-white text-lg pl-4"
                        disabled={isTyping}
                        autoFocus
                    />
                    <Button
                        type="submit"
                        size="icon"
                        className="h-12 w-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shrink-0 shadow-sm"
                        disabled={!input.trim() || isTyping}
                    >
                        <Send className="w-5 h-5" />
                    </Button>
                </form>
            </div>
        </div>
    );
}
