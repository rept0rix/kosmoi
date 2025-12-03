import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Bot, X, Send, Sparkles, MapPin, Wrench } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function AIConcierge() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'assistant', content: 'Sawadee krup! 🙏 I am your Koh Samui Concierge. How can I help you today?' }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    // Simple keyword-based AI logic for MVP
    const processMessage = async (text) => {
        const lowerText = text.toLowerCase();
        let response = "I'm not sure about that yet. I'm still learning! Try asking for a specific service like 'plumber' or 'taxi'.";
        let action = null;

        // 1. Navigation / Service Discovery
        if (lowerText.includes('plumber') || lowerText.includes('pipe') || lowerText.includes('leak')) {
            response = "I can help you find a plumber. Would you like to see a list of plumbers or request one immediately?";
            action = { type: 'navigate', path: '/ServiceProviders?category=plumber', label: 'View Plumbers' };
        } else if (lowerText.includes('ac') || lowerText.includes('air con') || lowerText.includes('cooling')) {
            response = "It's hot in Samui! ☀️ Let's get your AC fixed. I can take you to the AC repair specialists.";
            action = { type: 'navigate', path: '/ServiceProviders?category=ac_repair', label: 'Find AC Repair' };
        } else if (lowerText.includes('taxi') || lowerText.includes('driver') || lowerText.includes('transport')) {
            response = "Need a ride? I can show you local taxi services.";
            action = { type: 'navigate', path: '/ServiceProviders?category=taxi', label: 'Find Taxis' };
        } else if (lowerText.includes('clean') || lowerText.includes('maid')) {
            response = "Looking for a cleaner? We have great housekeeping services.";
            action = { type: 'navigate', path: '/ServiceProviders?category=cleaning', label: 'Find Cleaners' };
        }

        // 2. Direct Requests
        else if (lowerText.includes('request') || lowerText.includes('book') || lowerText.includes('hire')) {
            response = "You can submit a detailed service request and let providers come to you.";
            action = { type: 'navigate', path: '/RequestService', label: 'Create Request' };
        }

        // 3. Support / FAQ
        else if (lowerText.includes('price') || lowerText.includes('cost') || lowerText.includes('free')) {
            response = "Using the Service Hub is free for customers! You only pay the service provider directly for their work.";
        } else if (lowerText.includes('who are you') || lowerText.includes('bot')) {
            response = "I am the Koh Samui Service Hub AI. My job is to connect you with the best local professionals.";
        }

        // Simulate network delay
        setIsTyping(true);
        setTimeout(() => {
            setMessages(prev => [...prev, { role: 'assistant', content: response, action }]);
            setIsTyping(false);
        }, 1000);
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
            setIsOpen(false); // Close chat on navigation
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">
            {/* Chat Window */}
            {isOpen && (
                <Card className="w-80 h-96 mb-4 shadow-2xl border-blue-100 pointer-events-auto flex flex-col animate-in slide-in-from-bottom-5 fade-in duration-300">
                    <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-t-lg flex flex-row justify-between items-center">
                        <div className="flex items-center gap-2">
                            <div className="bg-white/20 p-1.5 rounded-full">
                                <Bot className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <CardTitle className="text-base">Samui Concierge</CardTitle>
                                <p className="text-xs text-blue-100 opacity-90">Always here to help</p>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 h-8 w-8" onClick={() => setIsOpen(false)}>
                            <X className="w-4 h-4" />
                        </Button>
                    </CardHeader>

                    <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] rounded-2xl p-3 text-sm ${msg.role === 'user'
                                        ? 'bg-blue-600 text-white rounded-br-none'
                                        : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm'
                                    }`}>
                                    <p>{msg.content}</p>
                                    {msg.action && (
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            className="mt-2 w-full bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200"
                                            onClick={() => handleActionClick(msg.action)}
                                        >
                                            {msg.action.label}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))}
                        {isTyping && (
                            <div className="flex justify-start">
                                <div className="bg-white border border-gray-200 rounded-2xl p-3 rounded-bl-none shadow-sm flex gap-1">
                                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </CardContent>

                    <CardFooter className="p-3 bg-white border-t">
                        <form
                            className="flex w-full gap-2"
                            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                        >
                            <Input
                                placeholder="Ask for a service..."
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                className="flex-1 focus-visible:ring-blue-500"
                            />
                            <Button type="submit" size="icon" className="bg-blue-600 hover:bg-blue-700">
                                <Send className="w-4 h-4" />
                            </Button>
                        </form>
                    </CardFooter>
                </Card>
            )}

            {/* Toggle Button */}
            <Button
                onClick={() => setIsOpen(!isOpen)}
                size="lg"
                className={`rounded-full h-14 w-14 shadow-xl transition-all duration-300 pointer-events-auto ${isOpen ? 'bg-gray-500 hover:bg-gray-600 rotate-90 scale-0 opacity-0 absolute' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:scale-110'
                    }`}
            >
                <Sparkles className="w-6 h-6 text-white animate-pulse" />
            </Button>

            {/* Close Button when open (alternative to top X) */}
            {isOpen && (
                <Button
                    onClick={() => setIsOpen(false)}
                    size="lg"
                    className="rounded-full h-14 w-14 shadow-xl bg-gray-800 hover:bg-gray-900 pointer-events-auto transition-all duration-300 animate-in zoom-in"
                >
                    <X className="w-6 h-6 text-white" />
                </Button>
            )}
        </div>
    );
}
