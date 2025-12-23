
import React, { useState, useRef, useEffect } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Bot, User, Code, FileText, Database, Loader2 } from 'lucide-react';
import Markdown from 'react-markdown';
import { KnowledgeService } from '@/services/ai/KnowledgeService';
import { InvokeLLM } from '@/api/integrations';
import { realSupabase } from '@/api/supabaseClient';

export default function AdminWiki() {
    const [messages, setMessages] = useState([
        { role: 'assistant', content: 'Hi! I am the **Code Wiki**. I have access to the entire codebase. Ask me anything about the architecture, auth flow, or specific components.' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [retrieving, setRetrieving] = useState(false);
    const [stats, setStats] = useState({ count: 0 });
    const scrollRef = useRef(null);

    // Fetch Stats
    useEffect(() => {
        const fetchStats = async () => {
            const { count } = await realSupabase.from('code_knowledge').select('*', { count: 'exact', head: true });
            setStats({ count: count || 0 });
        };
        fetchStats();
    }, []);

    // Auto-scroll
    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || loading) return;

        const userMsg = input;
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setLoading(true);
        setRetrieving(true);

        try {
            // 1. Retrieve Context
            const context = await KnowledgeService.retrieveContext(userMsg);
            setRetrieving(false);

            // 2. Construct Prompt
            const systemPrompt = `
You are an expert Senior Software Engineer acting as the "Code Wiki" for this project.
You have access to the codebase via RAG (Retrieval Augmented Generation).
Below is the relevant code context retrieved for the user's question.

Use this context to answer the question accurately.
- Cite file paths when possible.
- Explain the logic clearly.
- If the context mentions specific functions or constants, reference them.
- If the context is insufficient, say so, but try to answer based on general React/Node patterns if appropriate (with a disclaimer).

CONTEXT:
${context || "(No relevant code found in knowledge base)"}
`;

            // 3. Generate Answer (using Gemini via backend/integration)
            const { text } = await InvokeLLM({
                prompt: userMsg,
                system_instruction: systemPrompt,
                model: 'gemini-2.0-flash' // Fast and smart
            });

            setMessages(prev => [...prev, { role: 'assistant', content: text, context: context ? true : false }]);

        } catch (error) {
            console.error("Wiki Error:", error);
            setMessages(prev => [...prev, { role: 'assistant', content: "❌ Sorry, I encountered an error processing your request." }]);
        } finally {
            setLoading(false);
            setRetrieving(false);
        }
    };

    return (
        <div className="h-[calc(100vh-64px)] w-full flex bg-slate-950 text-slate-200 relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-3xl"></div>
            </div>

            {/* Sidebar / Stats */}
            <div className="w-80 border-r border-slate-800 bg-slate-900/50 backdrop-blur-sm z-10 flex flex-col hidden md:flex">
                <div className="p-6 border-b border-slate-800">
                    <h2 className="text-xl font-bold flex items-center gap-2 text-blue-400">
                        <Code className="w-6 h-6" />
                        Code Wiki
                    </h2>
                    <p className="text-xs text-slate-500 mt-2">Semantic Search & RAG Engine</p>
                </div>

                <div className="p-6 space-y-6">
                    <GlassCard className="p-4 space-y-2 bg-slate-900/60">
                        <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">Index Status</div>
                        <div className="flex items-center gap-3">
                            <Database className="w-8 h-8 text-emerald-500" />
                            <div>
                                <div className="text-2xl font-bold text-white">{stats.count}</div>
                                <div className="text-xs text-emerald-400">Code Chunks Indexed</div>
                            </div>
                        </div>
                    </GlassCard>

                    <div className="p-4 rounded-xl bg-blue-900/20 border border-blue-800/50 text-sm text-blue-200">
                        <div className="font-semibold mb-2 flex items-center gap-2">
                            <FileText className="w-4 h-4" /> How to Update?
                        </div>
                        <p className="text-blue-200/70 text-xs leading-relaxed">
                            To refresh the knowledge base, run the indexer script locally:
                            <br />
                            <code className="bg-slate-950 px-1 py-0.5 rounded text-blue-300 block mt-2 p-2">
                                npm run index-code
                            </code>
                        </p>
                    </div>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col z-10 relative">
                {/* Messages */}
                <div className="flex-1 overflow-hidden p-4">
                    <ScrollArea className="h-full pr-4">
                        <div className="space-y-6 max-w-4xl mx-auto pb-4">
                            {messages.map((msg, idx) => (
                                <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-blue-600' : 'bg-emerald-600'
                                        }`}>
                                        {msg.role === 'user' ? <User className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-white" />}
                                    </div>

                                    <div className={`flex-1 max-w-[80%] space-y-2`}>
                                        <GlassCard className={`p-5 ${msg.role === 'user'
                                                ? 'bg-blue-600/20 border-blue-500/30'
                                                : 'bg-slate-800/50 border-slate-700/50'
                                            }`}>
                                            <div className="prose prose-invert prose-sm max-w-none">
                                                <Markdown>{msg.content}</Markdown>
                                            </div>
                                        </GlassCard>

                                        {msg.context && (
                                            <div className="flex items-center gap-2 text-[10px] text-emerald-400 pl-2 opacity-70">
                                                <Database className="w-3 h-3" />
                                                <span>Context retrieved from codebase</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {loading && (
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center shrink-0 animate-pulse">
                                        <Bot className="w-5 h-5 text-white" />
                                    </div>
                                    <div className="flex items-center gap-3 text-slate-400 text-sm p-4">
                                        <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
                                        <span>
                                            {retrieving ? "Reading codebase..." : "Thinking..."}
                                        </span>
                                    </div>
                                </div>
                            )}
                            <div ref={scrollRef} />
                        </div>
                    </ScrollArea>
                </div>

                {/* Input Area */}
                <div className="p-4 border-t border-slate-800 bg-slate-900/80 backdrop-blur pb-8">
                    <form
                        onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                        className="max-w-4xl mx-auto relative flex gap-2"
                    >
                        <Input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask about authentication, database schema, or project structure..."
                            className="bg-slate-950/50 border-slate-700 focus:border-blue-500 text-slate-200 pl-4 py-6 text-base rounded-xl shadow-inner"
                            disabled={loading}
                        />
                        <Button
                            type="submit"
                            disabled={loading || !input.trim()}
                            className="h-auto px-6 bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-lg shadow-blue-900/20 transition-all hover:scale-105 active:scale-95"
                        >
                            <Send className="w-5 h-5" />
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
}
