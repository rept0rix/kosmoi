import React, { useState, useEffect } from 'react';
import { BentoGrid, BentoGridItem } from '@/components/ui/BentoGrid';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { memoryService } from '@/services/ai/MemoryService';
import { useAuth } from '@/features/auth/context/AuthContext';
import {
    Brain,
    Cpu,
    MessageSquare,
    Database,
    Sparkles,
    Activity,
    Fingerprint,
    Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MemoryLab = () => {
    const { user } = useAuth();
    const [profile, setProfile] = useState({ traits: [], memories: [] });
    const [loading, setLoading] = useState(true);
    const [inputMessage, setInputMessage] = useState('');
    const [chatLog, setChatLog] = useState([
        { role: 'assistant', content: 'Hello. I am listening and learning. Tell me about yourself.' }
    ]);
    const [systemContext, setSystemContext] = useState('');

    useEffect(() => {
        if (user?.id) {
            loadProfile();
        }
    }, [user]);

    const loadProfile = async () => {
        setLoading(true);
        if (!user?.id) return;

        // 1. Fetch Profile Data
        const data = await memoryService.getUserProfile(user.id);
        setProfile(data);

        // 2. Generate System Context Preview
        const context = await memoryService.getSystemContext(user.id);
        setSystemContext(context);

        setLoading(false);
    };

    const handleSendMessage = async () => {
        if (!inputMessage.trim()) return;

        // UI Update
        const newMsg = { role: 'user', content: inputMessage };
        setChatLog(prev => [...prev, newMsg]);
        setInputMessage('');

        // Simulate "Learning" (In prod this happens in background)
        // Extract a trait from specific keywords for specific demo effect
        if (inputMessage.toLowerCase().includes('i like')) {
            const preference = inputMessage.toLowerCase().split('i like')[1].trim();
            await memoryService.addMemory(user.id, `User likes ${preference}`, 'preference');
            setTimeout(loadProfile, 1000); // Refresh visual
        }

        // Simulate AI Response
        setTimeout(() => {
            setChatLog(prev => [...prev, { role: 'assistant', content: `I've noted that. Is there anything else I should know?` }]);
        }, 800);
    };

    const clearMemory = async () => {
        // In a real app this would delete from DB
        alert("Clear memory function would go here (DB Wipe)");
    };

    return (
        <div className="min-h-screen bg-black text-white p-8 font-sans selection:bg-purple-500/30">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
                            Neural Memory Lab
                        </h1>
                        <p className="text-gray-400">Visualizing Agent Long-term Memory & Profile Construction</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" className="border-white/10 hover:bg-white/10" onClick={loadProfile}>
                            <Activity className="w-4 h-4 mr-2" /> Refresh
                        </Button>
                        <Button variant="destructive" className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20" onClick={clearMemory}>
                            <Trash2 className="w-4 h-4 mr-2" /> Reset
                        </Button>
                    </div>
                </div>

                {/* Main Grid Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[800px]">

                    {/* Left: Chat Interaction */}
                    <GlassCard className="lg:col-span-1 h-full flex flex-col p-0 overflow-hidden border-purple-500/20 bg-black/60">
                        <div className="p-4 border-b border-white/5 bg-white/5">
                            <h2 className="font-semibold flex items-center gap-2 text-purple-300">
                                <MessageSquare className="w-4 h-4" /> Interaction Stream
                            </h2>
                        </div>

                        <div className="flex-1 p-4 overflow-y-auto space-y-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                            {chatLog.map((msg, idx) => (
                                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${msg.role === 'user'
                                        ? 'bg-purple-600/20 text-purple-100 border border-purple-500/30 rounded-tr-sm'
                                        : 'bg-white/5 text-gray-300 border border-white/5 rounded-tl-sm'
                                        }`}>
                                        {msg.content}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="p-4 border-t border-white/5 bg-white/5 backdrop-blur-md">
                            <div className="flex gap-2">
                                <Input
                                    value={inputMessage}
                                    onChange={(e) => setInputMessage(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                    placeholder="Tell me something about yourself..."
                                    className="bg-black/40 border-white/10 focus:border-purple-500/50"
                                    autoFocus
                                />
                                <Button size="icon" onClick={handleSendMessage} className="bg-purple-600 hover:bg-purple-500">
                                    <Sparkles className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </GlassCard>

                    {/* Right: Bento Visualization */}
                    <div className="lg:col-span-2 space-y-6 flex flex-col h-full">

                        {/* Top Row: Traits & Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-1/2">
                            {/* Traits Cloud */}
                            <GlassCard className="p-6 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <Fingerprint className="w-24 h-24" />
                                </div>
                                <h3 className="text-lg font-semibold text-pink-300 mb-4 flex items-center gap-2">
                                    <Fingerprint className="w-5 h-5" /> Extracted Traits
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {profile.traits.length === 0 && (
                                        <span className="text-gray-500 italic text-sm">No traits detected yet. Try saying "I am a developer".</span>
                                    )}
                                    {profile.traits.map((trait, i) => (
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            key={i}
                                            className="px-3 py-1.5 rounded-md bg-pink-500/10 border border-pink-500/20 text-pink-200 text-xs font-mono flex items-center gap-2 hover:bg-pink-500/20 cursor-default transition-colors"
                                        >
                                            <span className="opacity-50">{trait.trait_key}:</span>
                                            <span className="font-bold">{trait.trait_value}</span>
                                            {trait.confidence_score > 0.8 && <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />}
                                        </motion.div>
                                    ))}
                                </div>
                            </GlassCard>

                            {/* System Prompt Inspector */}
                            <GlassCard className="p-0 overflow-hidden flex flex-col">
                                <div className="p-4 border-b border-white/5 bg-white/5 flex justify-between items-center">
                                    <h3 className="text-lg font-semibold text-blue-300 flex items-center gap-2">
                                        <Cpu className="w-5 h-5" /> Context Injection
                                    </h3>
                                    <span className="text-[10px] uppercase tracking-wider bg-blue-500/20 text-blue-300 px-2 py-1 rounded">Live Preview</span>
                                </div>
                                <div className="flex-1 p-4 bg-black/40 overflow-auto font-mono text-xs text-gray-400">
                                    <pre className="whitespace-pre-wrap">
                                        {systemContext || "// No context available. Profile is empty."}
                                    </pre>
                                </div>
                            </GlassCard>
                        </div>

                        {/* Bottom Row: Memories Stream */}
                        <GlassCard className="flex-1 p-6 relative">
                            <h3 className="text-lg font-semibold text-green-300 mb-4 flex items-center gap-2">
                                <Database className="w-5 h-5" /> Memory Stream
                            </h3>
                            <div className="space-y-3 h-[calc(100%-3rem)] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10">
                                <AnimatePresence>
                                    {profile.memories.map((mem, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 20 }}
                                            transition={{ delay: i * 0.05 }}
                                            className="flex gap-4 p-3 rounded-lg hover:bg-white/5 transition-colors border border-transparent hover:border-white/5"
                                        >
                                            <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${mem.memory_type === 'preference' ? 'bg-purple-400 shadow-[0_0_10px_rgba(192,132,252,0.5)]' :
                                                mem.memory_type === 'fact' ? 'bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.5)]' : 'bg-gray-400'
                                                }`} />
                                            <div>
                                                <p className="text-sm text-gray-200">{mem.content}</p>
                                                <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-wide">{mem.memory_type} • Just now</p>
                                            </div>
                                        </motion.div>
                                    ))}
                                    {profile.memories.length === 0 && (
                                        <div className="text-center text-gray-600 py-10">
                                            <Brain className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                            <p>Memory banks empty. Start interacting.</p>
                                        </div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </GlassCard>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default MemoryLab;
