import React, { useEffect, useState, useRef } from 'react';
import { realSupabase } from '../../api/supabaseClient';
import { ScrollArea } from '../ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Loader2, CheckCircle2, XCircle, Clock } from 'lucide-react';

const LiveAgentFeed = () => {
    const [tasks, setTasks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const scrollRef = useRef(null);

    // Initial Load
    useEffect(() => {
        const fetchRecent = async () => {
            const { data, error } = await realSupabase
                .from('agent_tasks')
                .select('*')
                .order('updated_at', { ascending: false })
                .limit(20);

            if (!error) {
                setTasks(data);
            }
            setIsLoading(false);
        };
        fetchRecent();
    }, []);

    // Real-time Subscription
    useEffect(() => {
        const channel = realSupabase
            .channel('agent-feed')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'agent_tasks' },
                (payload) => {
                    const newItem = payload.new;
                    if (!newItem) return;

                    setTasks((prev) => {
                        // Remove existing if update, add to top
                        const filtered = prev.filter(t => t.id !== newItem.id);
                        return [newItem, ...filtered].slice(0, 50); // Keep max 50
                    });
                }
            )
            .subscribe();

        return () => {
            realSupabase.removeChannel(channel);
        };
    }, []);

    const getStatusBadge = (status) => {
        switch (status) {
            case 'in_progress':
                return <Badge variant="outline" className="text-blue-500 border-blue-500 gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Working</Badge>;
            case 'done':
                return <Badge variant="outline" className="text-green-500 border-green-500 gap-1"><CheckCircle2 className="w-3 h-3" /> Done</Badge>;
            case 'failed':
                return <Badge variant="destructive" className="gap-1"><XCircle className="w-3 h-3" /> Failed</Badge>;
            default:
                return <Badge variant="secondary" className="gap-1"><Clock className="w-3 h-3" /> {status}</Badge>;
        }
    };

    const getAgentAvatar = (agentId) => {
        // Simplified mapping or generic fallback
        // In a real app we'd map agentId to an avatar URL or Initials
        return (
            <Avatar className="h-8 w-8 border">
                {/* <AvatarImage src={...} /> */}
                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                    {agentId ? agentId.substring(0, 2).toUpperCase() : 'AG'}
                </AvatarFallback>
            </Avatar>
        );
    };

    return (
        <div className="bg-card border rounded-xl overflow-hidden flex flex-col h-[400px]">
            <div className="p-3 border-b bg-muted/30 flex justify-between items-center">
                <h3 className="font-semibold text-sm">Live Agent Feed</h3>
                <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    <span className="text-xs text-muted-foreground">Realtime</span>
                </div>
            </div>

            <ScrollArea className="flex-1 p-0">
                <div className="flex flex-col">
                    {tasks.map((task) => (
                        <div key={task.id} className="p-3 border-b hover:bg-muted/50 transition-colors group">
                            <div className="flex items-start gap-3">
                                {getAgentAvatar(task.assigned_to)}
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start mb-1">
                                        <div className="font-medium text-sm truncate pr-2">{task.title}</div>
                                        {getStatusBadge(task.status)}
                                    </div>
                                    <div className="text-xs text-muted-foreground mb-1 line-clamp-2">
                                        {task.result || task.task}
                                    </div>
                                    <div className="text-[10px] text-muted-foreground/50 flex justify-between">
                                        <span>{task.assigned_to || 'Unassigned'}</span>
                                        <span>{new Date(task.updated_at || task.created_at).toLocaleTimeString()}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    {tasks.length === 0 && !isLoading && (
                        <div className="p-8 text-center text-muted-foreground text-sm">
                            No active tasks found.
                        </div>
                    )}
                </div>
            </ScrollArea>
        </div>
    );
};

export default LiveAgentFeed;
