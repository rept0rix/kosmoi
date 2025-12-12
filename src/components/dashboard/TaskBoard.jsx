import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Activity, Layout } from 'lucide-react';
import { realSupabase as supabase } from '@/api/supabaseClient';
import KanbanBoard from '@/components/board/KanbanBoard';
import { useToast } from "@/components/ui/use-toast";

export default function TaskBoard() {
    const [tasks, setTasks] = useState([]);
    const { toast } = useToast();

    const fetchTasks = async () => {
        const { data } = await supabase.from('agent_tasks').select('*').limit(20).order('created_at', { ascending: false });
        if (data && data.length > 0) {
            setTasks(data.map(t => ({
                id: t.id,
                title: t.title,
                agent: t.assigned_to,
                priority: t.priority || 'medium',
                // Map DB status to Kanban status
                status: mapDbStatusToKanban(t.status),
                assigned_to: t.assigned_to,
                time: new Date(t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            })));
        }
    };

    const mapDbStatusToKanban = (status) => {
        const s = status?.toLowerCase() || 'pending';
        if (s.includes('progress')) return 'in_progress';
        if (s.includes('done') || s.includes('complete')) return 'done';
        if (s.includes('review')) return 'in_review';
        return 'todo'; // default for pending/new/etc
    };

    const mapKanbanStatusToDb = (status) => {
        switch (status) {
            case 'in_progress': return 'in_progress';
            case 'done': return 'completed';
            case 'in_review': return 'in_review';
            default: return 'pending';
        }
    };

    const handleUpdateTaskStatus = async (taskId, newStatus) => {
        // Optimistic update
        const previousTasks = [...tasks];
        setTasks(prev => prev.map(t =>
            t.id === taskId ? { ...t, status: newStatus } : t
        ));

        try {
            const dbStatus = mapKanbanStatusToDb(newStatus);
            const { error } = await supabase
                .from('agent_tasks')
                .update({ status: dbStatus })
                .eq('id', taskId);

            if (error) throw error;
        } catch (error) {
            console.error("Failed to update task status:", error);
            // Revert on error
            setTasks(previousTasks);
            toast({
                title: "Error",
                description: "Failed to update task status",
                variant: "destructive"
            });
        }
    };

    useEffect(() => {
        fetchTasks();

        const subscription = supabase
            .channel('public:agent_tasks')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'agent_tasks' }, (payload) => {
                fetchTasks();
            })
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    return (
        <Card className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 h-full shadow-sm flex flex-col">
            <CardHeader className="pb-4 flex-shrink-0">
                <CardTitle className="flex items-center gap-3 text-xl">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                        <Layout className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span>Mission Control Board</span>
                </CardTitle>
                <CardDescription className="text-base">Drag and drop tasks to manage agent workflow.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden min-h-0">
                <KanbanBoard
                    tasks={tasks}
                    onUpdateTaskStatus={handleUpdateTaskStatus}
                    isRTL={false}
                />
            </CardContent>
        </Card>
    );
}
