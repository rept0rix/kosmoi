
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, Trash2, X, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";

export default function StudioInspector({ selectedNode, onUpdateNode, onDeleteNode, onClose }) {
    const [label, setLabel] = useState('');
    const [subLabel, setSubLabel] = useState('');
    const [systemPrompt, setSystemPrompt] = useState('');
    const [config, setConfig] = useState({});

    // Sync local state when a new node is selected
    useEffect(() => {
        if (selectedNode) {
            setLabel(selectedNode.data.label || '');
            setSubLabel(selectedNode.data.subLabel || '');
            setSystemPrompt(selectedNode.data.systemPrompt || '');
            setConfig(selectedNode.data.config || {});
        }
    }, [selectedNode]);

    if (!selectedNode) return null;

    const handleSave = () => {
        onUpdateNode(selectedNode.id, {
            ...selectedNode.data,
            label,
            subLabel,
            systemPrompt,
            config
        });
    };

    const isAgent = selectedNode.type === 'studioNode' && selectedNode.data.type?.startsWith('agent');
    const isTool = selectedNode.type === 'studioNode' && selectedNode.data.type?.startsWith('tool');
    const isTrigger = selectedNode.type === 'studioNode' && selectedNode.data.type?.startsWith('trigger');

    return (
        <div className="w-80 bg-slate-900 border-l border-white/10 flex flex-col h-full absolute right-0 top-0 z-20 shadow-2xl backdrop-blur-xl bg-opacity-95">
            {/* Header */}
            <div className="p-4 border-b border-white/5 flex items-center justify-between bg-slate-900">
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                    Properties
                </h3>
                <Button variant="ghost" size="icon" onClick={onClose} className="h-6 w-6 text-slate-400 hover:text-white">
                    <X size={14} />
                </Button>
            </div>

            <ScrollArea className="flex-1 p-4">
                <div className="space-y-6">

                    {/* Basic Info */}
                    <div className="space-y-3">
                        <Label className="text-xs text-slate-400 uppercase tracking-widest">Identity</Label>
                        <div className="space-y-2">
                            <Label className="text-xs">Node Name</Label>
                            <Input
                                value={label}
                                onChange={(e) => setLabel(e.target.value)}
                                className="bg-slate-950 border-slate-800 text-xs"
                                placeholder="e.g., Tech Lead"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs">Subtitle / Role</Label>
                            <Input
                                value={subLabel}
                                onChange={(e) => setSubLabel(e.target.value)}
                                className="bg-slate-950 border-slate-800 text-xs"
                                placeholder="e.g., Code Reviewer"
                            />
                        </div>
                    </div>

                    {/* Agent Specifics */}
                    {isAgent && (
                        <div className="space-y-3 pt-4 border-t border-white/5">
                            <Label className="text-xs text-amber-400 uppercase tracking-widest">Agent Brain</Label>

                            <Tabs defaultValue="prompt" className="w-full">
                                <TabsList className="grid w-full grid-cols-2 bg-slate-950">
                                    <TabsTrigger value="prompt" className="text-xs">Instructions</TabsTrigger>
                                    <TabsTrigger value="rules" className="text-xs">Rules</TabsTrigger>
                                </TabsList>
                                <TabsContent value="prompt" className="mt-2">
                                    <Textarea
                                        value={systemPrompt}
                                        onChange={(e) => setSystemPrompt(e.target.value)}
                                        className="min-h-[150px] bg-slate-950 border-slate-800 text-xs font-mono"
                                        placeholder="You are an expert software architect..."
                                    />
                                </TabsContent>
                                <TabsContent value="rules" className="mt-2">
                                    <Alert className="bg-slate-950 border-amber-900/50">
                                        <AlertCircle className="h-4 w-4 text-amber-500" />
                                        <AlertTitle className="text-amber-500 text-xs">Rule Engine</AlertTitle>
                                        <AlertDescription className="text-xs text-slate-400">
                                            Define strict constraints (e.g., "Never expose API keys").
                                        </AlertDescription>
                                    </Alert>
                                    {/* Placeholder for Rule Builder */}
                                    <div className="mt-2 p-2 rounded-md border border-dashed border-slate-700 text-xs text-center text-slate-500">
                                        + Add Rule (Coming Soon)
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </div>
                    )}

                    {/* Tool Specifics */}
                    {(isTool || isTrigger) && (
                        <div className="space-y-3 pt-4 border-t border-white/5">
                            <Label className="text-xs text-green-400 uppercase tracking-widest">Configuration</Label>
                            <div className="grid gap-2">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs">Auto-Retry</Label>
                                    <Switch className="scale-75" />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">API Key (Mock)</Label>
                                    <Input
                                        type="password"
                                        className="bg-slate-950 border-slate-800 text-xs"
                                        placeholder="sk-..."
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </ScrollArea>

            {/* Footer Actions */}
            <div className="p-4 border-t border-white/5 bg-slate-900 flex gap-2">
                <Button
                    onClick={handleSave}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-xs"
                >
                    <Save size={14} className="mr-2" /> Save Changes
                </Button>
                <Button
                    onClick={() => onDeleteNode(selectedNode.id)}
                    variant="destructive"
                    size="icon"
                    className="flex-shrink-0"
                >
                    <Trash2 size={14} />
                </Button>
            </div>
        </div>
    );
}
