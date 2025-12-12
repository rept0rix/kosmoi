import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, Terminal, Code, Brain, Bot } from 'lucide-react';
import { agents as initialAgents } from '@/services/agents/AgentRegistry';

export default function AgentDetail() {
    const { agentId } = useParams();
    const navigate = useNavigate();
    const [agent, setAgent] = useState(null);

    useEffect(() => {
        // Load agents from storage or registry
        const stored = localStorage.getItem('kosmoi_admin_agents');
        const allAgents = stored ? JSON.parse(stored) : initialAgents;
        const found = allAgents.find(a => a.id === agentId);
        if (found) {
            setAgent(found);
        } else {
            console.error("Agent not found:", agentId);
            // navigate('/admin/agents'); // Optional: redirect if not found
        }
    }, [agentId]);

    const handleSave = () => {
        const stored = localStorage.getItem('kosmoi_admin_agents');
        const allAgents = stored ? JSON.parse(stored) : initialAgents;
        const updatedAgents = allAgents.map(a => a.id === agent.id ? agent : a);
        localStorage.setItem('kosmoi_admin_agents', JSON.stringify(updatedAgents));
        alert('Agent configuration saved.');
    };

    if (!agent) return <div className="p-10">Loading agent data...</div>;

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-10">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate('/admin/agents')}>
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        {agent.name}
                        <Badge variant="outline" className={`ml-2 text-${agent.color || 'blue'}-500 border-${agent.color || 'blue'}-200`}>
                            {agent.role}
                        </Badge>
                    </h1>
                    <p className="text-muted-foreground text-sm font-mono mt-1">ID: {agent.id}</p>
                </div>
                <div className="ml-auto flex gap-2">
                    <Button onClick={handleSave} className="gap-2">
                        <Save className="w-4 h-4" /> Save Config
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-6">
                <div className="col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Terminal className="w-5 h-5 text-blue-500" />
                                System Prompt (Personality Core)
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Textarea
                                className="min-h-[400px] font-mono text-xs leading-relaxed bg-slate-950 text-slate-100 p-4"
                                value={agent.systemPrompt}
                                onChange={e => setAgent({ ...agent, systemPrompt: e.target.value })}
                            />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Code className="w-5 h-5 text-purple-500" />
                                Tool Capabilities
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-2">
                                {agent.allowedTools?.map((tool, i) => (
                                    <Badge key={i} variant="secondary" className="px-3 py-1">
                                        {tool}
                                    </Badge>
                                ))}
                                <Button variant="outline" size="sm" className="text-xs border-dashed text-muted-foreground">+ Add Tool</Button>
                            </div>
                            <p className="text-xs text-muted-foreground mt-4">
                                * Tools are defined in the backend `AgentService`. Adding them here enables permission access.
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Brain className="w-5 h-5 text-amber-500" />
                                Model Configuration
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Model Provider</Label>
                                <Select
                                    value={agent.model}
                                    onValueChange={v => setAgent({ ...agent, model: v })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="gemini-3-pro">Gemini 3.0 Pro</SelectItem>
                                        <SelectItem value="gemini-2.0-flash">Gemini 2.0 Flash</SelectItem>
                                        <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                                        <SelectItem value="claude-3-5-sonnet">Claude 3.5 Sonnet</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Max Runtime</Label>
                                <div className="relative">
                                    <Input
                                        type="number"
                                        value={agent.maxRuntimeSeconds || 3600}
                                        onChange={e => setAgent({ ...agent, maxRuntimeSeconds: parseInt(e.target.value) })}
                                    />
                                    <span className="absolute right-3 top-2.5 text-xs text-muted-foreground">sec</span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Memory Type</Label>
                                <Select
                                    value={agent.memory?.type || 'shortterm'}
                                    onValueChange={v => setAgent({ ...agent, memory: { ...agent.memory, type: v } })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="shortterm">Short Term (Context Window)</SelectItem>
                                        <SelectItem value="midterm">Mid Term (Summary)</SelectItem>
                                        <SelectItem value="longterm">Long Term (Vector DB)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Bot className="w-5 h-5 text-green-500" />
                                Visual Identity
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-center p-4">
                                <div className={`w-24 h-24 rounded-full bg-${agent.color || 'blue'}-100 flex items-center justify-center text-4xl border-4 border-${agent.color || 'blue'}-200`}>
                                    {agent.name?.[0]}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Color Theme</Label>
                                <Select
                                    value={agent.color || 'blue'}
                                    onValueChange={v => setAgent({ ...agent, color: v })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select color" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="blue">Blue</SelectItem>
                                        <SelectItem value="green">Green</SelectItem>
                                        <SelectItem value="purple">Purple</SelectItem>
                                        <SelectItem value="red">Red</SelectItem>
                                        <SelectItem value="amber">Amber</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
