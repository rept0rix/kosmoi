import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Send, Bot, User, ArrowRight, Sparkles, RefreshCw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { AgentService } from '@/features/agents/services/AgentService';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

// Hardcoded definition for the frontend (mirroring opencode.json)
const RECEPTIONIST_AGENT_CONFIG = {
    id: 'receptionist',
    role: 'The Receptionist',
    model: 'claude-3-5-sonnet-latest',
    // We use a simplified system prompt here for the client-side AgentService wrapper
    // The actual prompt logic is handled by the AgentBrain/LLM, but we pass identity here.
    systemPrompt: `You are The Receptionist, Kosmoi's friendly onboarding agent. 
    Your goal is to gather business details (Name, Location, Category, Description, Contact) from the user conversationally.
    When you have all details, you MUST output a JSON action "complete_registration".
    Keep it fun, professional, and island-style.`,
    allowedTools: [] // No external tools for now, just conversation
};

export function ReceptionistChat({ onBack, onComplete }) {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [agentService, setAgentService] = useState(null);
    const messagesEndRef = useRef(null);

    // Initialize Agent Service
    useEffect(() => {
        const service = new AgentService(RECEPTIONIST_AGENT_CONFIG);
        setAgentService(service);
        
        // Initial Greeting
        setTimeout(() => {
            const greeting = {
                id: 'welcome',
                role: 'assistant',
                agent_id: 'receptionist',
                content: "Sawasdee krap/kha! 🙏 Welcome to **Kosmoi**. \n\nI'm The Receptionist. I'm here to get your business listed and seen by travelers! \n\n**What is the name of your business?**",
                created_at: new Date().toISOString()
            };
            setMessages([greeting]);
        }, 500);
    }, []);

    // Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);

    const handleSendMessage = async () => {
        if (!input.trim() || !agentService) return;

        const userText = input.trim();
        setInput(''); // Clear input immediately
        
        // Optimistic UI Update
        const userMsg = {
            id: Date.now().toString(),
            role: 'user',
            agent_id: 'HUMAN_USER',
            content: userText,
            created_at: new Date().toISOString()
        };
        setMessages(prev => [...prev, userMsg]);
        setIsTyping(true);

        try {
            // Send to Brain
            const response = await agentService.sendMessage(userText, {
                meetingTitle: 'Business Registration Chat'
            });

            // Handle Response
            const botMsg = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                agent_id: 'receptionist',
                content: response.text,
                created_at: new Date().toISOString()
            };
            setMessages(prev => [...prev, botMsg]);

            // Check for Completion Action
            if (response.toolRequest && response.toolRequest.name === 'complete_registration') {
                handleRegistrationCompletion(response.toolRequest.payload);
            } else if (response.raw?.action?.name === 'complete_registration') {
                 // Fallback if structured differently in raw
                 handleRegistrationCompletion(response.raw.action.data || response.raw.action.payload);
            }
            
            // Should we check for JSON in text fallback? 
            // Sometimes models output JSON in text despite instructions.
            // For now, rely on `action` field.

        } catch (error) {
            console.error(error);
            toast.error("Connection Error", { description: "The Receptionist stepped out for a tea break. Please try again." });
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'system',
                content: "⚠️ *Connection lost. Please try again.*"
            }]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleRegistrationCompletion = (data) => {
        console.log("Registration Complete:", data);
        toast.success("All set!", { description: "Creating your profile..." });
        
        // Small delay for UX
        setTimeout(() => {
            if (onComplete) onComplete(data);
        }, 1500);
    };

    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            className="h-[600px] flex flex-col bg-white rounded-xl shadow-2xl overflow-hidden border border-slate-100"
        >
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex justify-between items-center shadow-md z-10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30">
                        <Sparkles className="w-5 h-5 text-yellow-300 fill-yellow-300" />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg leading-none">The Receptionist</h3>
                        <p className="text-xs text-blue-100 opacity-90">AI Onboarding Assistant</p>
                    </div>
                </div>
                {onBack && (
                     <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={onBack}
                        className="text-white hover:bg-white/20"
                    >
                        Switch to Form
                    </Button>
                )}
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                {messages.map((msg) => (
                    <div 
                        key={msg.id} 
                        className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                    >
                        {/* Avatar */}
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm
                            ${msg.role === 'user' ? 'bg-slate-800 text-white' : 'bg-white border border-blue-100 text-blue-600'}`}>
                            {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-5 h-5" />}
                        </div>

                        {/* Bubble */}
                        <div className={`max-w-[80%] px-4 py-3 rounded-2xl shadow-sm leading-relaxed text-sm
                            ${msg.role === 'user' 
                                ? 'bg-blue-600 text-white rounded-tr-none' 
                                : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none'
                            }`}>
                             <ReactMarkdown 
                                remarkPlugins={[remarkGfm]}
                                className="prose prose-sm dark:prose-invert max-w-none break-words"
                                components={{
                                    p: ({children}) => <p className="mb-1 last:mb-0">{children}</p>
                                }}
                            >
                                {msg.content}
                            </ReactMarkdown>
                        </div>
                    </div>
                ))}

                {isTyping && (
                    <div className="flex gap-3">
                         <div className="w-8 h-8 rounded-full bg-white border border-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                            <Bot className="w-5 h-5" />
                        </div>
                        <div className="bg-white border border-slate-200 px-4 py-3 rounded-2xl rounded-tl-none shadow-sm flex gap-1 items-center h-10">
                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t">
                <div className="flex gap-2">
                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                        placeholder="Type your answer..."
                        className="flex-1"
                        autoFocus
                        disabled={isTyping}
                    />
                    <Button 
                        onClick={handleSendMessage} 
                        disabled={!input.trim() || isTyping}
                        className="bg-blue-600 hover:bg-blue-700 text-white w-10 h-10 p-0 rounded-lg shrink-0"
                    >
                        {isTyping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </Button>
                </div>
            </div>
        </motion.div>
    );
}
