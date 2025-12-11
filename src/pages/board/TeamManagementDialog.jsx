import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, User, Bot, Crown, Shield, Code, Briefcase } from 'lucide-react';

const RoleIcon = ({ role, className }) => {
    const r = (role || '').toLowerCase();
    if (r.includes('ceo') || r.includes('chair')) return <Crown className={className} />;
    if (r.includes('tech') || r.includes('dev')) return <Code className={className} />;
    if (r.includes('security') || r.includes('legal')) return <Shield className={className} />;
    if (r.includes('human')) return <User className={className} />;
    return <Bot className={className} />;
};

export default function TeamManagementDialog({
    open,
    onOpenChange,
    agents = [],
    selectedAgentIds = [],
    onToggleAgent,
    isRTL = false
}) {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredAgents = agents.filter(agent =>
        (agent.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (agent.role || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Group by layer for better organization
    const groupedAgents = filteredAgents.reduce((acc, agent) => {
        const layer = agent.layer || 'Other';
        if (!acc[layer]) acc[layer] = [];
        acc[layer].push(agent);
        return acc;
    }, {});

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col dark:bg-slate-950 dark:border-slate-800">
                <DialogHeader>
                    <DialogTitle className="dark:text-slate-100">{isRTL ? "ניהול צוות" : "Manage Team"}</DialogTitle>
                    <DialogDescription className="dark:text-slate-400">
                        {isRTL
                            ? "בחר אילו סוכנים יהיו פעילים בדיון הנוכחי."
                            : "Select which agents are active in the current session."}
                    </DialogDescription>
                </DialogHeader>

                <div className="relative mb-4">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder={isRTL ? "חפש סוכן..." : "Search agents..."}
                        className="pl-8 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <ScrollArea className="flex-1 pr-4">
                    <div className="space-y-6">
                        {Object.entries(groupedAgents).map(([layer, layerAgents]) => (
                            <div key={layer}>
                                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2 dark:text-slate-500">
                                    {layer.replace('-', ' ')} Layer
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {layerAgents.map(agent => (
                                        <div
                                            key={agent.id}
                                            className={`
                                                flex items-start gap-3 p-3 rounded-lg border transition-all cursor-pointer
                                                ${selectedAgentIds.includes(agent.id)
                                                    ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800'
                                                    : 'bg-white border-gray-100 hover:border-gray-200 dark:bg-slate-900/50 dark:border-slate-800 dark:hover:border-slate-700'
                                                }
                                            `}
                                            onClick={() => onToggleAgent(agent.id)}
                                        >
                                            <Checkbox
                                                checked={selectedAgentIds.includes(agent.id)}
                                                onCheckedChange={() => onToggleAgent(agent.id)}
                                                className="mt-1 dark:border-slate-600 dark:data-[state=checked]:bg-blue-600"
                                            />
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <RoleIcon role={agent.role} className="w-4 h-4 text-gray-500 dark:text-slate-400" />
                                                    <span className="font-medium text-sm dark:text-slate-200">{agent.role}</span>
                                                </div>
                                                <p className="text-xs text-gray-500 line-clamp-2 dark:text-slate-400">
                                                    {agent.name}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}

                        {filteredAgents.length === 0 && (
                            <div className="text-center py-8 text-muted-foreground dark:text-slate-500">
                                No agents found matching "{searchQuery}"
                            </div>
                        )}
                    </div>
                </ScrollArea>

                <DialogFooter className="mt-4 pt-4 border-t dark:border-slate-800">
                    <div className="flex justify-between w-full items-center">
                        <span className="text-sm text-gray-500 dark:text-slate-400">
                            {selectedAgentIds.length} {selectedAgentIds.length === 1 ? 'agent' : 'agents'} active
                        </span>
                        <Button onClick={() => onOpenChange(false)}>
                            {isRTL ? "סגור" : "Done"}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
