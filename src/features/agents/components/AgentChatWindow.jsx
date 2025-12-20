// src/components/agents/AgentChatWindow.jsx
import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Bot, User, Terminal, Trash2, ArrowRightCircle } from "lucide-react";

export function AgentChatWindow({ agentConfig, agentService, onForward }) {
    const [input, setInput] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState(null);
    const [messages, setMessages] = useState([]);
    const scrollRef = useRef(null);

    useEffect(() => {
        if (agentService) {
            setMessages(agentService.getHistory() || []);
        }
    }, [agentService]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    if (!agentConfig) {
        return <div className="flex items-center justify-center h-full text-gray-400">Select an agent to start communicating.</div>;
    }

    const handleSend = async () => {
        if (!input.trim()) return;
        setIsSending(true);
        setError(null);

        const userMsg = input;
        setInput("");

        setMessages(prev => [...prev, { role: "user", content: userMsg }]);

        try {
            const res = await agentService.sendMessage(userMsg);
            setMessages(agentService.getHistory());
        } catch (e) {
            console.error(e);
            setError(e.message || "Error communicating with agent");
        } finally {
            setIsSending(false);
        }
    };

    const handleClear = async () => {
        if (confirm("Are you sure you want to clear this agent's memory?")) {
            await agentService.clearHistory();
            setMessages([]);
        }
    }

    return (
        <div className="flex flex-col h-full bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
            {/* Header */}
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div>
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <Bot className="w-4 h-4 text-blue-600" />
                        {agentConfig.role}
                    </h3>
                    <p className="text-xs text-gray-500 font-mono">{agentConfig.id}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={handleClear} title="Clear Memory">
                    <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500" />
                </Button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                {messages.length === 0 && (
                    <div className="text-center text-gray-400 text-sm mt-10">
                        <Bot className="w-12 h-12 mx-auto mb-2 opacity-20" />
                        <p>Start a conversation with {agentConfig.role}...</p>
                    </div>
                )}

                {messages.map((m, idx) => (
                    <div
                        key={idx}
                        className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                        {m.role !== "user" && (
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0 border border-blue-200">
                                <Bot className="w-4 h-4 text-blue-600" />
                            </div>
                        )}

                        <div className="flex flex-col gap-1 max-w-[80%]">
                            <div
                                className={`rounded-2xl p-3 text-sm shadow-sm ${m.role === "user"
                                        ? "bg-blue-600 text-white rounded-br-none"
                                        : "bg-white border border-gray-200 text-gray-800 rounded-bl-none"
                                    }`}
                            >
                                <div className="whitespace-pre-wrap leading-relaxed">{m.content}</div>
                            </div>

                            {/* Forward Button for Assistant Messages */}
                            {m.role === "assistant" && onForward && (
                                <button
                                    onClick={() => onForward(m.content)}
                                    className="self-start text-[10px] text-blue-500 hover:text-blue-700 flex items-center gap-1 mt-1 ml-1"
                                >
                                    <ArrowRightCircle className="w-3 h-3" />
                                    Forward to another agent
                                </button>
                            )}
                        </div>

                        {m.role === "user" && (
                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
                                <User className="w-4 h-4 text-gray-500" />
                            </div>
                        )}
                    </div>
                ))}

                {isSending && (
                    <div className="flex gap-3 justify-start">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0 border border-blue-200">
                            <Bot className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="bg-white border border-gray-200 rounded-2xl p-3 rounded-bl-none shadow-sm flex gap-1 items-center">
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-xs text-center">
                        {error}
                    </div>
                )}

                <div ref={scrollRef} />
            </div>

            {/* Input */}
            <div className="p-3 bg-white border-t border-gray-100">
                <div className="flex gap-2">
                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={`Message ${agentConfig.role}...`}
                        onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                        className="flex-1"
                        disabled={isSending}
                    />
                    <Button
                        onClick={handleSend}
                        disabled={isSending || !input.trim()}
                        className="bg-blue-600 hover:bg-blue-700"
                    >
                        {isSending ? "..." : <Send className="w-4 h-4" />}
                    </Button>
                </div>
                <div className="mt-2 text-[10px] text-gray-400 flex items-center gap-1">
                    <Terminal className="w-3 h-3" />
                    <span>Tools enabled: {agentConfig.allowedTools?.join(", ")}</span>
                </div>
            </div>
        </div>
    );
}
