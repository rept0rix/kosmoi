
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, Import, Loader2, Calendar, AlertCircle } from 'lucide-react';
import { AdminTaskService } from '@/services/admin/AdminTaskService';
import { useToast } from "@/components/ui/use-toast";

// Suggestion list from project context
const SUGGESTED_TASKS = [
    // 🚨 Critical / Immediate
    { title: "Revoke Leaked Secrets", priority: "critical", description: "Rotate Google Maps and Telegram keys immediately." },

    // 💰 Operation: One Dollar (Phase 8)
    { title: "Verify End-to-End Revenue Flow", priority: "high", description: "Run the full One Dollar challenge scenario." },
    { title: "Agent Coordination Check", priority: "high", description: "Ensure upgraded CEO/Sales agents can execute sales logic." },
    { title: "Stripe Payment Verification", priority: "critical", description: "Confirm payment link generation works with new models." },

    // 📚 Documentation Hygiene
    { title: "Sync AGENTS.md", priority: "medium", description: "Reflect recent agent model upgrades (Gemini 3) in docs." },
    { title: "Review SPEC.md", priority: "medium", description: "Verify Agent Layer section matches actual code." },

    // 🏗️ Active Development
    { title: "Concierge Agent RAG Integration", priority: "high", description: "Implement vector search and knowledge base." },
    { title: "Fix Google Maps Import", priority: "high", description: "Debug data ingestion from Island Crawler." },
    { title: "Audit n8n Automations", priority: "low", description: "Review and categorize existing workflows." },
    { title: "Brain Transplants (Gemini 3)", priority: "low", description: "Verify all agents are running on the new models." } // Mostly done but good to double check
];

export default function AdminTodoList() {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const { toast } = useToast();

    useEffect(() => {
        loadTasks();
    }, []);

    const loadTasks = async () => {
        try {
            setLoading(true);
            const data = await AdminTaskService.list();
            setTasks(data || []);
        } catch (error) {
            console.error("Failed to load tasks", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!newTaskTitle.trim()) return;

        try {
            const newTask = await AdminTaskService.create({
                title: newTaskTitle,
                priority: 'medium',
                status: 'pending'
            });
            setTasks([newTask, ...tasks]);
            setNewTaskTitle('');
            toast({ title: "Task added", description: "Let's get it done!" });
        } catch (error) {
            toast({ title: "Error", description: "Could not add task", variant: "destructive" });
        }
    };

    const handleToggle = async (task) => {
        const newStatus = task.status === 'done' ? 'pending' : 'done';
        // Optimistic update
        const updatedTasks = tasks.map(t => t.id === task.id ? { ...t, status: newStatus } : t);
        setTasks(updatedTasks);

        try {
            await AdminTaskService.update(task.id, { status: newStatus });
        } catch (error) {
            loadTasks(); // Revert on error
            toast({ title: "Error", description: "Could not update task", variant: "destructive" });
        }
    };

    const handleDelete = async (id) => {
        try {
            await AdminTaskService.delete(id);
            setTasks(tasks.filter(t => t.id !== id));
            toast({ title: "Task deleted" });
        } catch (error) {
            toast({ title: "Error", description: "Could not delete task", variant: "destructive" });
        }
    };

    const handleImportSuggestions = async () => {
        try {
            setLoading(true);
            // In a real scenario, we might want to deduplicate or ask user selection
            // For now, we just insert them all if they don't exist exactly (simple check logic omitted for speed, just bulk adding)
            // Actually, let's just add them one by one
            let count = 0;
            for (const suggestion of SUGGESTED_TASKS) {
                // Check dupes by title client side to be nice
                if (!tasks.some(t => t.title === suggestion.title)) {
                    await AdminTaskService.create({
                        title: suggestion.title,
                        description: suggestion.description,
                        priority: suggestion.priority,
                        status: 'pending'
                    });
                    count++;
                }
            }
            await loadTasks();
            toast({ title: "Imported", description: `Added ${count} suggested tasks to your list.` });
        } catch (error) {
            toast({ title: "Error", description: "Import failed", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const getPriorityColor = (p) => {
        switch (p) {
            case 'critical': return 'bg-red-500/20 text-red-500 border-red-500/50';
            case 'high': return 'bg-orange-500/20 text-orange-500 border-orange-500/50';
            case 'medium': return 'bg-blue-500/20 text-blue-500 border-blue-500/50';
            case 'low': return 'bg-slate-500/20 text-slate-500 border-slate-500/50';
            default: return 'bg-slate-500/20 text-slate-500';
        }
    };

    return (
        <Card className="bg-slate-900/40 border-white/5 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="text-xl text-slate-100 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-purple-400" /> My Personal Tasks
                    </CardTitle>
                    <CardDescription className="text-slate-400">Manage your high-priority items and backlog</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={handleImportSuggestions} className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10">
                    <Import className="w-4 h-4 mr-2" /> Import Suggestions
                </Button>
            </CardHeader>
            <CardContent className="space-y-6">

                {/* Add Task Form */}
                <form onSubmit={handleCreate} className="flex gap-2">
                    <Input
                        placeholder="What needs to be done?"
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        className="bg-slate-950/50 border-white/10 text-slate-200"
                    />
                    <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
                        <Plus className="w-4 h-4" />
                    </Button>
                </form>

                {/* Task List */}
                <div className="space-y-2">
                    {loading ? (
                        <div className="flex justify-center p-8">
                            <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
                        </div>
                    ) : tasks.length === 0 ? (
                        <div className="text-center p-8 text-slate-500 border border-dashed border-white/5 rounded-lg">
                            No tasks yet. Add one or import suggestions!
                        </div>
                    ) : (
                        tasks.map(task => (
                            <div key={task.id} className={`flex items-center justify-between p-3 rounded-lg border transition-all ${task.status === 'done' ? 'bg-slate-900/20 border-white/5 opacity-60' : 'bg-slate-900/60 border-white/10 hover:border-purple-500/30'}`}>
                                <div className="flex items-center gap-3">
                                    <Checkbox
                                        checked={task.status === 'done'}
                                        onCheckedChange={() => handleToggle(task)}
                                        className="border-white/20 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                                    />
                                    <div className="space-y-1">
                                        <div className={`font-medium ${task.status === 'done' ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                                            {task.title}
                                        </div>
                                        {task.description && (
                                            <div className="text-xs text-slate-500">{task.description}</div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Badge variant="outline" className={`text-[10px] uppercase ${getPriorityColor(task.priority)}`}>
                                        {task.priority}
                                    </Badge>
                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(task.id)} className="h-8 w-8 text-slate-500 hover:text-red-400 hover:bg-red-500/10">
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
