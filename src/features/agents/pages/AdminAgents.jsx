import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, Search, MoreHorizontal, Edit, Trash2, Bot, Sparkles } from 'lucide-react';
import { agents as initialAgents } from '@/features/agents/services/AgentRegistry';

import { useNavigate } from 'react-router-dom';
import { BlogAgent } from '@/features/agents/BlogAgent';
import { supabase } from '@/api/supabaseClient';
import { useToast } from "@/components/ui/use-toast";
import LiveAgentFeed from '@/components/admin/LiveAgentFeed';

const colorMap = {
    blue: { border: 'border-blue-100', bg: 'bg-blue-100', text: 'text-blue-700' },
    green: { border: 'border-green-100', bg: 'bg-green-100', text: 'text-green-700' },
    purple: { border: 'border-purple-100', bg: 'bg-purple-100', text: 'text-purple-700' },
    red: { border: 'border-red-100', bg: 'bg-red-100', text: 'text-red-700' },
    amber: { border: 'border-amber-100', bg: 'bg-amber-100', text: 'text-amber-700' },
};

export default function AdminAgents() {
    const navigate = useNavigate();
    // Initialize with static agents, but allow local state management
    const [agents, setAgents] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddOpen, setIsAddOpen] = useState(false);

    // Form State
    const [newAgent, setNewAgent] = useState({
        name: '', role: '', description: '', color: 'blue', type: 'assistant'
    });

    // Blog Agent State
    const [blogDialogState, setBlogDialogState] = useState({ isOpen: false, topic: '', tone: 'Inspirational' });
    const [isGenerating, setIsGenerating] = useState(false);
    const { toast } = useToast();

    const fetchAgents = async () => {
        try {
            // Fetch from DB (Single Source of Truth)
            const { data, error } = await supabase
                .from('agent_configs')
                .select('*')
                .order('name', { ascending: true });

            if (error) throw error;

            if (data && data.length > 0) {
                // Merge DB configs with Codebase Registry (for icons/Avatars which are effectively static code assets)
                const merged = data.map(dbAgent => {
                    const codeAgent = initialAgents.find(a => a.id === dbAgent.agent_id);
                    return {
                        ...codeAgent, // Avatar, Code logic
                        ...dbAgent,   // DB Overrides: Name, Prompt, Active Status
                        id: dbAgent.agent_id // Ensure ID match
                    };
                });
                setAgents(merged);
            } else {
                // Fallback: If DB empty, show code agents (and maybe prompt to sync?)
                setAgents(initialAgents);
            }
        } catch (e) {
            console.error("Agent fetch failed:", e);
            toast({ title: "Error loading agents", description: e.message, variant: "destructive" });
        }
    };

    useEffect(() => {
        fetchAgents();
    }, []);

    const saveAgentToDB = async (agent) => {
        const payload = {
            agent_id: agent.id,
            name: agent.name,
            role: agent.role,
            description: agent.description,
            color: agent.color,
            system_prompt: agent.systemPrompt,
            active: true
        };

        const { error } = await supabase.from('agent_configs').upsert(payload, { onConflict: 'agent_id' });
        if (error) {
            toast({ title: "Save Failed", description: error.message, variant: "destructive" });
            return false;
        }
        return true;
    };

    const handleAddAgent = async () => {
        const id = newAgent.name.toLowerCase().replace(/\s+/g, '_');
        const agentToAdd = {
            id,
            ...newAgent,
            capabilities: ['chat'], // default
            systemPrompt: `You are ${newAgent.name}, a ${newAgent.role}.`
        };

        const success = await saveAgentToDB(agentToAdd);
        if (success) {
            fetchAgents();
            setIsAddOpen(false);
            setNewAgent({ name: '', role: '', description: '', color: 'blue', type: 'assistant' });
            toast({ title: "Agent Deployed", description: "Configuration saved to database." });
        }
    };

    const deleteAgent = async (id) => {
        if (confirm('Are you sure you want to decommission this agent?')) {
            const { error } = await supabase.from('agent_configs').delete().eq('agent_id', id);
            if (error) {
                toast({ title: "Delete Failed", description: error.message, variant: "destructive" });
            } else {
                fetchAgents();
                toast({ title: "Agent Retired", description: "Agent configuration removed." });
            }
        }
    };

    // Replaces syncWithRegistry
    const fullSync = async () => {
        const confirmSync = confirm("This will overwrite Database configurations with the default Codebase settings. Continue?");
        if (!confirmSync) return;

        toast({ title: "Syncing...", description: "Pushing code definitions to database." });

        for (const agent of initialAgents) {
            await saveAgentToDB(agent);
        }
        await fetchAgents();
        toast({ title: "Sync Complete", description: "Database is now identical to Code Registry." });
    };

    const handleGenerateArticle = async () => {
        setIsGenerating(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Authentication required");

            const agent = new BlogAgent(user);
            toast({ title: "Agent Activated", description: "Samui Storyteller is drafting your article..." });

            // Trigger generation
            const response = await agent.generateArticle(blogDialogState.topic, blogDialogState.tone);

            toast({
                title: "Draft Complete",
                description: "Article saved to drafts. Check the Blog module."
            });
            console.log("Agent Response:", response);
            setBlogDialogState({ isOpen: false, topic: '', tone: 'Inspirational' });
        } catch (error) {
            console.error("Generation failed:", error);
            toast({
                variant: "destructive",
                title: "Agent Error",
                description: error.message
            });
        } finally {
            setIsGenerating(false);
        }
    };

    const filteredAgents = (agents || [])
        .filter(a => a && a.name) // Filter out undefined/null agents
        .filter(agent =>
            (agent.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (agent.role || '').toLowerCase().includes(searchTerm.toLowerCase())
        );

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Agent Command</h1>
                    <p className="text-gray-500 mt-2">Manage your AI workforce matrix.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={fullSync} title="Resync with Code Registry">
                        <Bot className="w-4 h-4 mr-2" /> Resync DB
                    </Button>
                    <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                        <DialogTrigger asChild>
                            <Button className="gap-2">
                                <Plus className="w-4 h-4" /> Deploy Agent
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Deploy New Agent</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="name" className="text-right">Name</Label>
                                    <Input id="name" value={newAgent.name} onChange={e => setNewAgent({ ...newAgent, name: e.target.value })} className="col-span-3" />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="role" className="text-right">Role</Label>
                                    <Input id="role" value={newAgent.role} onChange={e => setNewAgent({ ...newAgent, role: e.target.value })} className="col-span-3" />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="color" className="text-right">Color Theme</Label>
                                    <Select onValueChange={v => setNewAgent({ ...newAgent, color: v })} defaultValue={newAgent.color}>
                                        <SelectTrigger className="col-span-3">
                                            <SelectValue placeholder="Select color" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="blue">Blue (Tech)</SelectItem>
                                            <SelectItem value="green">Green (Growth)</SelectItem>
                                            <SelectItem value="purple">Purple (Creative)</SelectItem>
                                            <SelectItem value="red">Red (Critical)</SelectItem>
                                            <SelectItem value="amber">Amber (Support)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid grid-cols-4 items-start gap-4">
                                    <Label htmlFor="desc" className="text-right pt-2">Directive</Label>
                                    <textarea
                                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 col-span-3"
                                        placeholder="Brief description of primary function..."
                                        value={newAgent.description || ''}
                                        onChange={e => setNewAgent({ ...newAgent, description: e.target.value })}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={handleAddAgent}>Deploy Unit</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Blog Generation Dialog */}
            <Dialog open={!!blogDialogState.isOpen} onOpenChange={(open) => !open && setBlogDialogState({ isOpen: false, topic: '', tone: 'Inspirational' })}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Draft New Article</DialogTitle>
                        <DialogDescription>
                            Commission the Samui Storyteller to write a new piece.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Topic / Title</Label>
                            <Input
                                placeholder="e.g., Top 10 Hidden Beaches"
                                value={blogDialogState.topic}
                                onChange={(e) => setBlogDialogState(prev => ({ ...prev, topic: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Tone</Label>
                            <Select
                                value={blogDialogState.tone}
                                onValueChange={(val) => setBlogDialogState(prev => ({ ...prev, tone: val }))}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Inspirational">Inspirational</SelectItem>
                                    <SelectItem value="Informative">Informative</SelectItem>
                                    <SelectItem value="Adventurous">Adventurous</SelectItem>
                                    <SelectItem value="Luxury">Luxury</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            onClick={handleGenerateArticle}
                            disabled={!blogDialogState.topic || isGenerating}
                        >
                            {isGenerating ? (
                                <><Sparkles className="w-4 h-4 mr-2 animate-spin" /> Generating...</>
                            ) : (
                                <><Bot className="w-4 h-4 mr-2" /> Start Writing</>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                {filteredAgents.map((agent) => (
                    <Card key={agent.id} className={`overflow-hidden transition-all hover:shadow-md border-t-4 ${colorMap[agent.color]?.border || 'border-slate-200'}`}>
                        {/* ... existing card content ... */}
                        <CardHeader className="pb-4">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                    <Avatar className={`h-12 w-12 border-2 ${colorMap[agent.color]?.border || 'border-slate-200'}`}>
                                        <AvatarImage src={agent.avatar} />
                                        <AvatarFallback className={`${colorMap[agent.color]?.bg || 'bg-slate-100'} ${colorMap[agent.color]?.text || 'text-slate-700'}`}>
                                            {agent.name.charAt(0)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <CardTitle className="text-lg">{agent.name}</CardTitle>
                                        <CardDescription>{agent.role}</CardDescription>
                                    </div>
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                            <span className="sr-only">Open menu</span>
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                        <DropdownMenuItem onSelect={() => navigate(`/admin/agents/${agent.id}`)}>
                                            <Edit className="mr-2 h-4 w-4" />
                                            Configure Agent
                                        </DropdownMenuItem>
                                        {agent.id === 'agent_blog_writer' && (
                                            <DropdownMenuItem onSelect={() => setBlogDialogState({ isOpen: true, topic: '', tone: 'Inspirational' })}>
                                                <Sparkles className="mr-2 h-4 w-4 text-purple-500" />
                                                Draft Article
                                            </DropdownMenuItem>
                                        )}
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onSelect={() => deleteAgent(agent.id)} className="text-red-600">
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Decommission
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex flex-wrap gap-2">
                                    <Badge variant="outline" className="font-mono text-xs">
                                        <Sparkles className="w-3 h-3 mr-1" />
                                        GPT-4o
                                    </Badge>
                                    <Badge className="bg-green-500/15 text-green-700 hover:bg-green-500/25 border-0">
                                        Active
                                    </Badge>
                                </div>
                                {agent.description && (
                                    <p className="text-xs text-muted-foreground line-clamp-2">
                                        {agent.description}
                                    </p>
                                )}
                                <div className="pt-2 flex justify-between items-center text-xs text-muted-foreground border-t">
                                    <span>Tasks: 0</span>
                                    <span>Success: 100%</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Live Conversation Feed */}
            <div className="space-y-4">
                <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Live Neural Network</h2>
                <LiveAgentFeed />
            </div>
        </div>
    );
}
