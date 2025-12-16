import React, { useState, useEffect } from 'react';
import KanbanBoard from '@/components/board/KanbanBoard';
import { db } from '@/api/supabaseClient';
import { Button } from '@/components/ui/button';
import { Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { agents } from '@/services/agents/AgentRegistry';

export default function AdminKanban() {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [creating, setCreating] = useState(false);
    const [newTask, setNewTask] = useState({
        title: '',
        description: '',
        priority: 'medium',
        assigned_to: 'admin'
    });

    useEffect(() => {
        loadTasks();
    }, []);

    const loadTasks = async () => {
        try {
            setLoading(true);
            const data = await db.entities.AgentTasks.list();
            const adaptedTasks = (data || []).map(t => ({
                ...t,
                status: t.status || 'pending', // Fallback to pending
                title: t.title || t.description || 'Untitled Task',
                priority: t.priority || 'medium'
            }));
            setTasks(adaptedTasks);
        } catch (error) {
            console.error("Failed to load tasks:", error);
            toast.error("Failed to load tasks");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (taskId, newStatus) => {
        // Optimistic update
        setTasks(prev => prev.map(t =>
            t.id === taskId ? { ...t, status: newStatus } : t
        ));

        try {
            await db.entities.AgentTasks.update(taskId, { status: newStatus });
            toast.success("Task updated");
        } catch (error) {
            console.error("Failed to update task status:", error);
            toast.error("Failed to save status");
            loadTasks(); // Revert on error
        }
    };

    const handleCreateSubmit = async () => {
        if (!newTask.title) {
            toast.error("Title is required");
            return;
        }

        setCreating(true);
        try {
            const taskData = {
                ...newTask,
                status: 'pending',
                created_at: new Date().toISOString()
            };

            const created = await db.entities.AgentTasks.create(taskData);
            if (created) {
                // Determine the correct object to add to state (depends on what create returns)
                // If create returns null/undefined but succeeds, we might need to fetch or use taskData
                const taskToAdd = created.id ? created : { ...taskData, id: 'temp-' + Date.now() };

                setTasks(prev => [taskToAdd, ...prev]);
                toast.success("Task created successfully");
                setIsCreateOpen(false);
                setNewTask({ title: '', description: '', priority: 'medium', assigned_to: 'admin' });
            }
        } catch (error) {
            console.error("Create task failed:", error);
            toast.error("Failed to create task");
        } finally {
            setCreating(false);
        }
    };

    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-white mb-2">Task Board</h1>
                    <p className="text-slate-400">Manage ongoing operations and agent assignments</p>
                </div>

                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700">
                            <Plus className="w-4 h-4" />
                            New Task
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px] bg-slate-900 text-white border-slate-800">
                        <DialogHeader>
                            <DialogTitle>Create New Task</DialogTitle>
                            <DialogDescription className="text-slate-400">
                                Assign a new task to an agent or team member.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="title" className="text-right">
                                    Title
                                </Label>
                                <Input
                                    id="title"
                                    value={newTask.title}
                                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                                    className="col-span-3 bg-slate-800 border-slate-700"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="desc" className="text-right">
                                    Description
                                </Label>
                                <Textarea
                                    id="desc"
                                    value={newTask.description}
                                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                                    className="col-span-3 bg-slate-800 border-slate-700"
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="priority" className="text-right">
                                    Priority
                                </Label>
                                <Select
                                    value={newTask.priority}
                                    onValueChange={(val) => setNewTask({ ...newTask, priority: val })}
                                >
                                    <SelectTrigger className="w-[180px] bg-slate-800 border-slate-700">
                                        <SelectValue placeholder="Select priority" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-slate-800 border-slate-700 text-white">
                                        <SelectItem value="low">Low</SelectItem>
                                        <SelectItem value="medium">Medium</SelectItem>
                                        <SelectItem value="high">High</SelectItem>
                                        <SelectItem value="critical">Critical</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="agent" className="text-right">
                                    Assign To
                                </Label>
                                <Select
                                    value={newTask.assigned_to}
                                    onValueChange={(val) => setNewTask({ ...newTask, assigned_to: val })}
                                >
                                    <SelectTrigger className="w-[180px] bg-slate-800 border-slate-700">
                                        <SelectValue placeholder="Select Agent" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-slate-800 border-slate-700 text-white max-h-[200px]">
                                        <SelectItem value="admin">Admin</SelectItem>
                                        <SelectItem value="HUMAN_USER">Human User</SelectItem>
                                        {agents.map(agent => (
                                            <SelectItem key={agent.id} value={agent.id}>
                                                {agent.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button disabled={creating} onClick={handleCreateSubmit} type="submit" className="bg-indigo-600 hover:bg-indigo-700">
                                {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Create Task
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="flex-1 min-h-0 overflow-hidden">
                {loading ? (
                    <div className="text-white text-center mt-20">Loading tasks...</div>
                ) : (
                    <KanbanBoard
                        tasks={tasks}
                        onUpdateTaskStatus={handleUpdateStatus}
                        isRTL={false}
                    />
                )}
            </div>
        </div>
    );
}
