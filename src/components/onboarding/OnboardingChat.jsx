import React, { useState, useEffect, useRef } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, CheckCircle2, Loader2, Sparkles } from 'lucide-react';

const STEPS = {
    WELCOME: 'welcome',
    NAME: 'name',
    CONTACT: 'contact',
    READY_PAY: 'ready_pay',
    PROCESSING: 'processing'
};

const OnboardingChat = ({ businessName, onComplete }) => {
    const [messages, setMessages] = useState([]);
    const [currentStep, setCurrentStep] = useState(STEPS.WELCOME);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef(null);

    // Initial Greeting
    useEffect(() => {
        addBotMessage(`Sawasdee! 🙏 I am the automated concierge for **${businessName}**.`, 500);
        addBotMessage(`I'm here to help you claim this verified profile so you can start receiving bookings immediately.`, 1500);
        addBotMessage(`First, may I have your full name for our records?`, 2500, STEPS.NAME);
    }, [businessName]);

    const addBotMessage = (text, delay = 0, nextStep = null) => {
        setIsTyping(true);
        setTimeout(() => {
            setMessages(prev => [...prev, { id: Date.now(), role: 'assistant', text }]);
            setIsTyping(false);
            if (nextStep) setCurrentStep(nextStep);
            scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, delay);
    };

    const handleUserResponse = () => {
        if (!inputValue.trim()) return;

        const userText = inputValue;
        setMessages(prev => [...prev, { id: Date.now(), role: 'user', text: userText }]);
        setInputValue('');

        // Process State Machine
        if (currentStep === STEPS.NAME) {
            addBotMessage(`Nice to meet you, ${userText}.`, 500);
            addBotMessage(`To ensure you get instant notifications for new yacht inquiries, what is your best **WhatsApp** number or **Email**?`, 1500, STEPS.CONTACT);
        } else if (currentStep === STEPS.CONTACT) {
            addBotMessage(`Perfect. I've updated our secure registry.`, 500);
            addBotMessage(`The final step is a one-time **1 THB** verification fee. This prevents fraud and instantly marks your business as "Verified" to travelers.`, 1500);
            addBotMessage(`Are you ready to verify?`, 2500, STEPS.READY_PAY);
        } else if (currentStep === STEPS.READY_PAY) {
            addBotMessage(`Excellent. Generating your secure link...`, 500);
            setTimeout(() => {
                onComplete(); // Trigger parent payment logic
            }, 1500);
            setCurrentStep(STEPS.PROCESSING);
        }
    };

    return (
        <div className="flex flex-col h-[450px] bg-slate-900/50 rounded-2xl border border-white/10 overflow-hidden shadow-xl">
            {/* Header */}
            <div className="p-4 bg-slate-900 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Avatar className="h-10 w-10 border border-teal-500/30">
                            <AvatarImage src="/assets/agents/concierge.png" />
                            <AvatarFallback className="bg-teal-500/10 text-teal-500">AI</AvatarFallback>
                        </Avatar>
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-slate-900 rounded-full"></span>
                    </div>
                    <div>
                        <h4 className="text-white font-medium text-sm">Kosmoi Concierge</h4>
                        <p className="text-teal-400 text-xs flex items-center gap-1">
                            <Sparkles className="w-3 h-3" /> Online
                        </p>
                    </div>
                </div>
            </div>

            {/* Chat Area */}
            <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                    {messages.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {msg.role === 'assistant' && (
                                <Avatar className="h-8 w-8 mr-2 mt-1 border border-white/5">
                                    <AvatarFallback className="bg-teal-500/10 text-teal-500 text-xs">AI</AvatarFallback>
                                </Avatar>
                            )}
                            <div
                                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${msg.role === 'user'
                                        ? 'bg-teal-600 text-white rounded-tr-sm'
                                        : 'bg-white/10 text-slate-200 rounded-tl-sm'
                                    }`}
                            >
                                {/* Simple Markdown parser for bold text */}
                                {msg.text.split('**').map((part, i) =>
                                    i % 2 === 1 ? <strong key={i} className="text-white font-semibold">{part}</strong> : part
                                )}
                            </div>
                        </div>
                    ))}
                    {isTyping && (
                        <div className="flex justify-start">
                            <Avatar className="h-8 w-8 mr-2 mt-1 border border-white/5">
                                <AvatarFallback className="bg-teal-500/10 text-teal-500 text-xs">AI</AvatarFallback>
                            </Avatar>
                            <div className="bg-white/5 rounded-2xl px-4 py-3 rounded-tl-sm flex gap-1">
                                <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce"></span>
                            </div>
                        </div>
                    )}
                    <div ref={scrollRef} />
                </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="p-4 bg-slate-900/80 border-t border-white/5">
                <div className="flex gap-2">
                    <Input
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleUserResponse()}
                        placeholder={currentStep === STEPS.WELCOME || isTyping ? "Please wait..." : "Type your reply..."}
                        disabled={isTyping || currentStep === STEPS.PROCESSING}
                        className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-teal-500"
                    />
                    <Button
                        onClick={handleUserResponse}
                        disabled={!inputValue.trim() || isTyping || currentStep === STEPS.PROCESSING}
                        className="bg-teal-600 hover:bg-teal-500"
                    >
                        {currentStep === STEPS.PROCESSING ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default OnboardingChat;
