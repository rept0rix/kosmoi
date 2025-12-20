import React, { useState, useEffect } from 'react';
import KanbanBoard from '@/components/board/KanbanBoard';
import { DatabaseService } from '@/core/db/database';
import { useRxQuery } from '@/shared/hooks/useRxQuery';
import { Button } from '@/components/ui/button';
import { Plus, Loader2, LayoutGrid, Users } from 'lucide-react';
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
import { agents } from '@/features/agents/services/AgentRegistry';
import { useLanguage } from "@/components/LanguageContext";
import { v4 as uuidv4 } from 'uuid';

export default function AdminKanban() {
    const { language } = useLanguage();
    const isRTL = language === 'he';
    const [mode, setMode] = useState('tasks'); // 'tasks' or 'crm'

    // --- RxDB Hooks ---

    // 1. Agent Tasks
    const { data: tasksData, loading: tasksLoading } = useRxQuery('tasks',
        collection => collection.find().sort({ created_at: 'desc' })
    );

    // 2. CRM Data (Stages & Contacts)
    const { data: stagesData, loading: stagesLoading } = useRxQuery('stages',
        collection => collection.find().sort({ position: 'asc' })
    );
    const { data: leadsData, loading: leadsLoading } = useRxQuery('contacts',
        collection => collection.find().sort({ created_at: 'desc' })
    );

    // Create Task State
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [creating, setCreating] = useState(false);
    const [newTask, setNewTask] = useState({
        title: '',
        description: '',
        priority: 'medium',
        assigned_to: 'admin'
    });

    // --- Data Flattening/Mapping ---

    const getBoardData = () => {
        if (mode === 'tasks') {
            const columns = [
                { id: 'pending', label: 'To Do', color: 'bg-slate-100 border-slate-200' },
                { id: 'in_progress', label: 'In Progress', color: 'bg-blue-50 border-blue-200' },
                { id: 'review', label: 'In Review', color: 'bg-purple-50 border-purple-200' },
                { id: 'done', label: 'Done', color: 'bg-green-50 border-green-200' }
            ];

            const tasks = (tasksData || []).map(t => ({
                ...t,
                status: t.status || 'pending',
                title: t.title || t.description || 'Untitled Task',
                priority: t.priority || 'medium'
            }));

            return { columns, tasks, loading: tasksLoading };
        }

        if (mode === 'crm') {
            // Map Stages to Columns
            const columns = (stagesData || []).map(s => ({
                id: s.id,
                label: s.name,
                color: s.color ? `border-l-4` : 'bg-slate-50',
            }));

            // Map Leads to Tasks
            const tasks = (leadsData || []).map(l => ({
                id: l.id,
                status: l.stage_id,
                stage_id: l.stage_id,
                title: `${l.first_name || ''} ${l.last_name || ''}`.trim() || l.company || 'Unknown Lead',
                description: l.notes,
                priority: l.value > 1000 ? 'high' : 'medium',
                assigned_to: null,
                value: l.value,
                company: l.company,
                type: 'lead'
            }));

            return { columns, tasks, loading: stagesLoading || leadsLoading };
        }

        return { columns: [], tasks: [], loading: false };
    };

    const { columns, tasks, loading } = getBoardData();

    const handleUpdateStatus = async (itemId, newColumnId) => {
        try {
            const db = await DatabaseService.get();

            if (mode === 'tasks') {
                const doc = await db.tasks.findOne(itemId).exec();
                if (doc) {
                    await doc.patch({
                        status: newColumnId,
                        updated_at: new Date().toISOString()
                    });
                    toast.success("Task updated");
                }
            } else {
                // CRM Mode
                const doc = await db.contacts.findOne(itemId).exec();
                if (doc) {
                    await doc.patch({
                        stage_id: newColumnId,
                        updated_at: new Date().toISOString()
                    });
                    toast.success("Lead moved");
                }
            }
        } catch (error) {
            console.error("Update failed:", error);
            toast.error("Failed to update status");
        }
    };

    const handleCreateSubmit = async () => {
        if (mode === 'crm') {
            toast.info("Lead creation not yet implemented via this modal.");
            return;
        }

        if (!newTask.title) {
            toast.error("Title is required");
            return;
        }

        setCreating(true);
        try {
            const db = await DatabaseService.get();
            const newId = uuidv4();

            await db.tasks.insert({
                id: newId,
                ...newTask,
                status: 'pending',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            });

            toast.success("Task created");
            setIsCreateOpen(false);
            setNewTask({ title: '', description: '', priority: 'medium', assigned_to: 'admin' });
        } catch (error) {
            console.error("Create task failed:", error);
            toast.error("Failed to create task locally");
        } finally {
            setCreating(false);
        }
    };

    // Use a task adapter for the KanbanBoard to ensure it finds the right column ID
    const taskAdapter = (item) => ({
        ...item,
        status: mode === 'crm' ? item.stage_id : item.status
    });

    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-white mb-2">
                        {mode === 'tasks' ? 'Task Board' : 'Sales Pipeline'}
                    </h1>
                    <p className="text-slate-400">
                        {mode === 'tasks' ? 'Manage ongoing operations' : 'Track leads and deals'}
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    {/* Mode Toggle */}
                    <div className="bg-slate-800 p-1 rounded-lg flex items-center border border-slate-700">
                        <button
                            onClick={() => setMode('tasks')}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${mode === 'tasks' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                                }`}
                        >
                            <LayoutGrid className="w-4 h-4" />
                            Tasks
                        </button>
                        <button
                            onClick={() => setMode('crm')}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${mode === 'crm' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                                }`}
                        >
                            <Users className="w-4 h-4" />
                            CRM
                        </button>
                    </div>

                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700">
                                <Plus className="w-4 h-4" />
                                {mode === 'tasks' ? 'New Task' : 'New Lead'}
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px] bg-slate-900 text-white border-slate-800">
                            {/* Standard Task Create Form (Reused) */}
                            <DialogHeader>
                                <DialogTitle>Create New Task</DialogTitle>
                                <DialogDescription className="text-slate-400">
                                    Assign a new task to an agent or team member.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="title" className="text-right">Title</Label>
                                    <Input
                                        id="title"
                                        value={newTask.title}
                                        onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                                        className="col-span-3 bg-slate-800 border-slate-700"
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="desc" className="text-right">Description</Label>
                                    <Textarea
                                        id="desc"
                                        value={newTask.description}
                                        onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                                        className="col-span-3 bg-slate-800 border-slate-700"
                                    />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="priority" className="text-right">Priority</Label>
                                    <Select value={newTask.priority} onValueChange={(val) => setNewTask({ ...newTask, priority: val })}>
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
                                    <Label htmlFor="agent" className="text-right">Assign To</Label>
                                    <Select value={newTask.assigned_to} onValueChange={(val) => setNewTask({ ...newTask, assigned_to: val })}>
                                        <SelectTrigger className="w-[180px] bg-slate-800 border-slate-700">
                                            <SelectValue placeholder="Select Agent" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-slate-800 border-slate-700 text-white max-h-[200px]">
                                            <SelectItem value="admin">Admin</SelectItem>
                                            <SelectItem value="HUMAN_USER">Human User</SelectItem>
                                            {agents.map(agent => (
                                                <SelectItem key={agent.id} value={agent.id}>{agent.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button disabled={creating} onClick={handleCreateSubmit} type="submit" className="bg-indigo-600 hover:bg-indigo-700">
                                    {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Create
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="flex-1 min-h-0 overflow-hidden">
                {loading ? (
                    <div className="text-white text-center mt-20">Loading (Offline Ready)...</div>
                ) : (
                    <KanbanBoard
                        tasks={tasks}
                        columns={columns}
                        onUpdateTaskStatus={handleUpdateStatus}
                        isRTL={isRTL}
                        taskAdapter={taskAdapter}
                    />
                )}
            </div>
        </div>
    );
}
