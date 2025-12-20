import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { db } from '@/api/supabaseClient';
import { useToast } from "@/components/ui/use-toast";

export default function AgentDetailsDialog({ agent, isOpen, onClose, onSave }) {
    const { toast } = useToast();
    const [systemPrompt, setSystemPrompt] = useState(agent?.systemPrompt || '');
    const [role, setRole] = useState(agent?.role || '');
    const [isSaving, setIsSaving] = useState(false);

    // Update local state when agent changes
    React.useEffect(() => {
        if (agent) {
            setSystemPrompt(agent.systemPrompt);
            setRole(agent.role);
        }
    }, [agent]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            console.log("Saving agent config override...", agent.id);
            // 1. Save System Prompt Override
            if (systemPrompt !== agent.systemPrompt) {
                await db.entities.AgentConfigs.create({
                    agent_id: agent.id,
                    key: 'systemPrompt',
                    value: systemPrompt
                });
            }

            // 2. Save Role Name Override (if changed)
            if (role !== agent.role) {
                await db.entities.AgentConfigs.create({
                    agent_id: agent.id,
                    key: 'role',
                    value: role
                });
            }

            toast({ title: "Agent Updated", description: "Configuration saved. Agent will auto-update shortly." });
            if (onSave) onSave();
            onClose();
        } catch (error) {
            console.error("Failed to save agent config", error);
            toast({ title: "Error", description: "Failed to save configuration.", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    if (!agent) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-4 sm:p-6 mb-0 sm:mb-2 w-[95vw] rounded-xl sm:rounded-lg">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <DialogTitle className="text-xl flex items-center gap-2">
                            {agent.icon && <span>{agent.icon}</span>}
                            <span className="truncate">Details: {agent.role}</span>
                        </DialogTitle>
                        <Badge variant="outline" className="hidden sm:inline-flex">{agent.layer}</Badge>
                    </div>
                    <DialogDescription>
                        Internal ID: <span className="font-mono text-xs">{agent.id}</span>
                        <Badge variant="outline" className="ml-2 sm:hidden text-[10px]">{agent.layer}</Badge>
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="prompt" className="flex-1 overflow-hidden flex flex-col mt-2">
                    <TabsList className="w-full justify-start overflow-x-auto">
                        <TabsTrigger value="prompt">System Prompt</TabsTrigger>
                        <TabsTrigger value="info">Info & Tools</TabsTrigger>
                        <TabsTrigger value="hierarchy">Hierarchy</TabsTrigger>
                    </TabsList>

                    <TabsContent value="prompt" className="flex-1 flex flex-col gap-4 py-4 data-[state=active]:flex">
                        <div className="flex flex-col gap-2 flex-1 min-h-0">
                            <Label>System Instruction (Persona)</Label>
                            <ScrollArea className="flex-1 border rounded-md min-h-[200px]">
                                <Textarea
                                    value={systemPrompt}
                                    onChange={(e) => setSystemPrompt(e.target.value)}
                                    className="min-h-full border-none focus-visible:ring-0 font-mono text-xs p-4 resize-none"
                                />
                            </ScrollArea>
                            <p className="text-xs text-slate-500">
                                This prompt defines how the agent thinks and behaves. Editing this will override the default behavior.
                            </p>
                        </div>
                    </TabsContent>

                    <TabsContent value="info" className="space-y-4 py-4 overflow-y-auto">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Role Name</Label>
                                <Input value={role} onChange={(e) => setRole(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Model</Label>
                                <Input value={agent.model} disabled className="bg-slate-100" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Allowed Tools</Label>
                            <div className="flex flex-wrap gap-2">
                                {agent.allowedTools.map(tool => (
                                    <Badge key={tool} variant="secondary" className="font-mono text-xs">
                                        {tool}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="hierarchy" className="space-y-4 py-4 overflow-y-auto">
                        <div className="p-4 bg-slate-50 border rounded-lg">
                            <h3 className="font-bold text-sm mb-4">Reporting Structure</h3>
                            <div className="flex flex-col gap-4 items-center">
                                {/* BOSS */}
                                {agent.reportsTo && (
                                    <div className="flex flex-col items-center gap-1 opacity-50">
                                        <Badge>Reports To: {agent.reportsTo}</Badge>
                                        <div className="h-4 w-0.5 bg-slate-300"></div>
                                    </div>
                                )}

                                {/* ME */}
                                <div className="p-3 bg-white border border-blue-500 rounded shadow-sm font-bold text-blue-700">
                                    {agent.role}
                                </div>

                                {/* SUBORDINATES (Simulated check) */}
                                {/* We don't have the full list passed here effectively, but we can explain */}
                                <p className="text-xs text-center text-slate-500 mt-4">
                                    Agents in the <strong>{agent.layer}</strong> layer usually report up to the layer above.
                                </p>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>

                <DialogFooter className="mt-4">
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving ? "Saving..." : "Save Changes"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
