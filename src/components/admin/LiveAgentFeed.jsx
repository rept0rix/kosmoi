import React, { useEffect, useState, useRef } from 'react';
import { realSupabase } from '../../api/supabaseClient';
import { ScrollArea } from '../ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Loader2, CheckCircle2, XCircle, Clock } from 'lucide-react';

import { Send, MessageSquare } from 'lucide-react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';

// ... existing imports

const LiveAgentFeed = () => {
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [replyingTo, setReplyingTo] = useState(null); // { id: string, sessionId: string, username: string }
    const [replyText, setReplyText] = useState('');
    const scrollRef = useRef(null);

    // Initial Load
    useEffect(() => {
        const fetchRecent = async () => {
            const { data, error } = await realSupabase
                .from('agent_logs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(20);

            if (!error) {
                setMessages(data);
            }
            setIsLoading(false);
        };
        fetchRecent();
    }, []);

    // Real-time Subscription
    useEffect(() => {
        const channel = realSupabase
            .channel('agent-feed')
            // @ts-ignore
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'agent_logs' }, (payload) => {
                const newItem = payload.new;
                if (!newItem) return;

                setMessages((prev) => {
                    const filtered = prev.filter(t => t.id !== newItem.id);
                    return [newItem, ...filtered].slice(0, 50);
                });
            }
            )
            .subscribe();

        return () => {
            if (channel) channel.unsubscribe();
        };
    }, []);

    const handleSendReply = async () => {
        if (!replyText.trim() || !replyingTo) return;

        try {
            const { error } = await realSupabase.from('agent_logs').insert({
                agent_id: 'admin', // Or 'concierge' to spoof
                level: 'chat',
                message: replyText,
                metadata: {
                    role: 'admin', // Key for Client to detect
                    userId: replyingTo.userId, // Target User
                    username: 'Admin',
                    sessionId: replyingTo.sessionId, // Target Session
                    targetInfo: 'Direct Reply'
                }
            });

            if (error) throw error;

            // Clear state
            setReplyText('');
            setReplyingTo(null);

        } catch (err) {
            console.error("Failed to send reply:", err);
            alert("Failed to send reply");
        }
    };

    const getAgentBadge = (msg) => {
        const role = msg.metadata?.role || 'system';
        if (role === 'user') return <Badge variant="secondary" className="gap-1 bg-yellow-500/10 text-yellow-500 border-yellow-500/20">User</Badge>;
        if (role === 'assistant') return <Badge variant="secondary" className="gap-1 bg-blue-500/10 text-blue-400 border-blue-500/20">Concierge</Badge>;
        if (role === 'admin') return <Badge variant="secondary" className="gap-1 bg-red-500/10 text-red-500 border-red-500/20">Admin</Badge>;
        return <Badge variant="outline" className="text-slate-500">{msg.agent_id}</Badge>;
    };

    const getAgentAvatar = (msg) => {
        const role = msg.metadata?.role || 'system';
        return (
            <Avatar className="h-8 w-8 border bg-slate-800">
                <AvatarFallback className={`text-xs ${role === 'user' ? 'bg-yellow-500/10 text-yellow-500' : role === 'admin' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'}`}>
                    {role === 'user' ? 'U' : role === 'admin' ? 'AD' : 'AI'}
                </AvatarFallback>
            </Avatar>
        );
    };

    return (
        <div className="bg-slate-900/40 border border-white/5 rounded-xl overflow-hidden flex flex-col h-[400px]">
            <div className="p-3 border-b border-white/5 bg-slate-900/50 flex justify-between items-center">
                <h3 className="font-semibold text-sm text-slate-200">Live Agent Feed</h3>
                <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    <span className="text-xs text-slate-500">Realtime</span>
                </div>
            </div>

            <ScrollArea className="flex-1 p-0">
                <div className="flex flex-col pb-20">
                    {messages.map((msg) => (
                        <div key={msg.id} className={`p-3 border-b border-white/5 hover:bg-white/5 transition-colors group ${replyingTo?.id === msg.id ? 'bg-blue-500/5' : ''}`}>
                            <div className="flex items-start gap-3">
                                {getAgentAvatar(msg)}
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start mb-1">
                                        <div className="font-bold text-xs truncate pr-2 flex items-center gap-2">
                                            {getAgentBadge(msg)}
                                            <span className="text-slate-500 lowercase">{msg.metadata?.username || 'Guest'}</span>
                                        </div>
                                        <span className="text-[10px] text-slate-600 font-mono">{new Date(msg.created_at).toLocaleTimeString()}</span>
                                    </div>
                                    <div className="text-xs text-slate-300 font-mono leading-relaxed break-words">
                                        {msg.message}
                                    </div>

                                    {/* Action Bar */}
                                    <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                        <button
                                            onClick={() => setReplyingTo({
                                                id: msg.id,
                                                sessionId: msg.metadata?.sessionId,
                                                username: msg.metadata?.username,
                                                userId: msg.metadata?.userId
                                            })}
                                            className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-1"
                                        >
                                            <MessageSquare className="w-3 h-3" /> Reply
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    {messages.length === 0 && !isLoading && (
                        <div className="p-8 text-center text-slate-600 text-sm">
                            No active agents in the field.
                        </div>
                    )}
                </div>
            </ScrollArea>

            {/* Reply Input Area */}
            {replyingTo && (
                <div className="p-3 border-t border-white/10 bg-slate-900 animate-in slide-in-from-bottom-2">
                    <div className="flex items-center justify-between mb-2 text-xs">
                        <span className="text-slate-400">Replying to <span className="text-blue-400">{replyingTo.username}</span>...</span>
                        <button onClick={() => setReplyingTo(null)} className="text-slate-500 hover:text-slate-300">Cancel</button>
                    </div>
                    <div className="flex gap-2">
                        <Input
                            value={replyText}
                            onChange={e => setReplyText(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSendReply()}
                            placeholder="Type admin override..."
                            className="h-8 text-xs bg-slate-800 border-slate-700"
                            autoFocus
                        />
                        <Button size="sm" onClick={handleSendReply} className="h-8 w-8 p-0 bg-blue-600 hover:bg-blue-500">
                            <Send className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LiveAgentFeed;
