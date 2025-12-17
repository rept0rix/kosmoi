import React, { useState, useEffect } from 'react';
import KanbanBoard from '@/components/board/KanbanBoard';
import { db } from '@/api/supabaseClient';
import { CrmService } from '@/services/business/CrmService';
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
import { agents } from '@/services/agents/AgentRegistry';

export default function AdminKanban() {
    const [mode, setMode] = useState('tasks'); // 'tasks' or 'crm'
    const [tasks, setTasks] = useState([]);
    const [columns, setColumns] = useState([]); // Dynamic columns
    const [loading, setLoading] = useState(true);
    const [pipelines, setPipelines] = useState([]);
    const [selectedPipelineId, setSelectedPipelineId] = useState(null);

    // Create Task State
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [creating, setCreating] = useState(false);
    const [newTask, setNewTask] = useState({
        title: '',
        description: '',
        priority: 'medium',
        assigned_to: 'admin'
    });

    useEffect(() => {
        loadData();
    }, [mode, selectedPipelineId]);

    const loadData = async () => {
        setLoading(true);
        try {
            if (mode === 'tasks') {
                // Load Agent Tasks
                const data = await db.entities.AgentTasks.list();
                const adaptedTasks = (data || []).map(t => ({
                    ...t,
                    status: t.status || 'pending',
                    title: t.title || t.description || 'Untitled Task',
                    priority: t.priority || 'medium'
                }));
                setTasks(adaptedTasks);

                // Default Task Columns
                setColumns([
                    { id: 'pending', label: 'To Do', color: 'bg-slate-100 border-slate-200' },
                    { id: 'in_progress', label: 'In Progress', color: 'bg-blue-50 border-blue-200' },
                    { id: 'review', label: 'In Review', color: 'bg-purple-50 border-purple-200' },
                    { id: 'done', label: 'Done', color: 'bg-green-50 border-green-200' }
                ]);

            } else if (mode === 'crm') {
                // Load CRM Data
                let currentPipelineId = selectedPipelineId;

                // 1. Fetch Pipelines if not already set
                if (!currentPipelineId) {
                    const pips = await CrmService.getPipelines();
                    if (pips && pips.length > 0) {
                        setPipelines(pips);
                        currentPipelineId = pips[0].id; // Default to first
                        setSelectedPipelineId(currentPipelineId);
                    } else {
                        toast.error("No CRM Pipelines found.");
                        setLoading(false);
                        return;
                    }
                }

                // 2. Fetch Stages (Columns)
                const stages = await CrmService.getStages(currentPipelineId);
                const cols = stages.map(s => ({
                    id: s.id,
                    label: s.name,
                    color: s.color ? `border-l-4` : 'bg-slate-50', // Simplified color logic
                    metadata: s // Keep full stage data
                }));
                setColumns(cols);

                // 3. Fetch Leads (Tasks)
                const leads = await CrmService.getLeads(currentPipelineId);
                // Adapt leads to simple Task interface for Kanban
                const adaptedLeads = leads.map(l => ({
                    id: l.id,
                    stage_id: l.stage_id, // Important for column mapping
                    title: `${l.first_name || ''} ${l.last_name || ''}`.trim() || l.company || 'Unknown Lead',
                    description: l.notes,
                    priority: l.value > 1000 ? 'high' : 'medium', // Mock priority based on value
                    assigned_to: null, // Leads might not be assigned yet
                    value: l.value,
                    company: l.company,
                    //...l
                }));
                setTasks(adaptedLeads);
            }
        } catch (error) {
            console.error("Failed to load data:", error);
            toast.error("Failed to load data");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (taskId, newColumnId) => {
        // Optimistic Update
        if (mode === 'tasks') {
            setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newColumnId } : t));
            try {
                await db.entities.AgentTasks.update(taskId, { status: newColumnId });
                toast.success("Task updated");
            } catch (error) {
                console.error(error);
                toast.error("Failed to update task");
                loadData();
            }
        } else {
            // CRM Mode: Update Lead Stage
            setTasks(prev => prev.map(t => t.id === taskId ? { ...t, stage_id: newColumnId } : t));
            try {
                await CrmService.updateLead(taskId, { stage_id: newColumnId });
                toast.success("Lead moved");
            } catch (error) {
                console.error(error);
                toast.error("Failed to move lead");
                loadData();
            }
        }
    };

    // --- Task Creation Logic (Keeping simple for MVP, only for Tasks) ---
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
            const taskData = {
                ...newTask,
                status: 'pending',
                created_at: new Date().toISOString()
            };

            const created = await db.entities.AgentTasks.create(taskData);
            if (created) {
                const taskToAdd = created.id ? created : { ...taskData, id: 'temp-' + Date.now() };
                setTasks(prev => [taskToAdd, ...prev]);
                toast.success("Task created");
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
                    <div className="text-white text-center mt-20">Loading...</div>
                ) : (
                    <KanbanBoard
                        tasks={tasks}
                        columns={columns}
                        onUpdateTaskStatus={handleUpdateStatus}
                        isRTL={false}
                    />
                )}
            </div>
        </div>
    );
}
