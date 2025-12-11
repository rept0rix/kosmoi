import React from 'react';
import { Button } from "@/components/ui/button";
import { Plus, Play, Pause, Archive } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/components/LanguageContext";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { agents } from "@/services/agents/AgentRegistry";

export default function BoardRoomHeader({
    meetings,
    selectedMeeting,
    setSelectedMeeting,
    handleCreateMeeting,
    activeAgentsCount,
    autonomousMode,
    setAutonomousMode,
    selectedAgentIds,
    onManageTeam
}) {
    const { language } = useLanguage();
    const isRTL = language === 'he';

    return (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 border-b bg-white dark:bg-slate-950 sticky top-0 z-10 gap-4">
            <div className="flex items-center gap-4 flex-1 w-full md:w-auto">
                <div className="relative">
                    <Select
                        value={selectedMeeting?.id}
                        onValueChange={(val) => setSelectedMeeting(meetings.find(m => m.id === val))}
                    >
                        <SelectTrigger className="w-[280px] font-bold text-lg border-2 border-indigo-100 bg-indigo-50/50 hover:bg-white transition-colors">
                            <SelectValue placeholder="Select Meeting Strategy..." />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                            <div className="p-2 border-b mb-1">
                                <Button
                                    variant="secondary"
                                    className="w-full justify-start gap-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        handleCreateMeeting();
                                    }}
                                >
                                    <Plus className="w-4 h-4" />
                                    Create New Strategy Board
                                </Button>
                            </div>
                            {meetings.map(meeting => (
                                <SelectItem key={meeting.id} value={meeting.id} className="py-3">
                                    <div className="flex flex-col items-start gap-1">
                                        <span className="font-semibold">{meeting.title}</span>
                                        <div className="flex items-center gap-2 text-xs text-slate-500">
                                            <span>{new Date(meeting.created_at).toLocaleDateString()}</span>
                                            {meeting.status === 'archived' && <Badge variant="outline" className="text-[10px]">Archived</Badge>}
                                        </div>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="hidden md:flex items-center gap-2">
                    <Badge variant={selectedMeeting?.status === 'active' ? "default" : "secondary"}
                        className={selectedMeeting?.status === 'active' ? "bg-green-500 hover:bg-green-600" : ""}>
                        {selectedMeeting?.status || 'No Active Meeting'}
                    </Badge>
                </div>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                {/* Active Participants Avatars */}
                <div className="flex items-center -space-x-2 mr-4">
                    {agents.filter(a => selectedAgentIds.includes(a.id)).map(agent => {
                        const getColor = (layer) => {
                            switch (layer) {
                                case 'board': return 'slate';
                                case 'strategic': return 'purple';
                                case 'executive': return 'orange';
                                case 'operational': return 'emerald';
                                default: return 'gray';
                            }
                        };
                        const color = getColor(agent.layer);

                        return (
                            <TooltipProvider key={agent.id}>
                                <Tooltip>
                                    <TooltipTrigger>
                                        <div className={`w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold text-white shadow-sm overflow-hidden bg-${color}-500`}>
                                            {agent['avatar'] ? <img src={agent['avatar']} alt={agent.name} className="w-full h-full object-cover" /> : agent.name.charAt(0)}
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>{agent.name} ({agent.role})</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        )
                    })}
                    <Button variant="outline" size="icon" className="w-8 h-8 rounded-full border-dashed border-2 ml-2" onClick={() => onManageTeam()}>
                        <Plus className="w-3 h-3" />
                    </Button>
                </div>
                {/* Active Agents Counter */}
                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full text-xs font-mono text-slate-600 border border-slate-200">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    {activeAgentsCount} Agents Active
                </div>

                {/* Autonomous Mode Toggle */}
                <Button
                    variant={autonomousMode ? "default" : "outline"}
                    size="sm"
                    onClick={() => setAutonomousMode(!autonomousMode)}
                    className={`gap-2 transition-all duration-500 border-2 ${autonomousMode
                        ? "bg-gradient-to-r from-red-500 to-amber-500 hover:from-red-600 hover:to-amber-600 text-white border-transparent bg-[length:200%_200%] animate-gradient-x shadow-lg shadow-orange-500/20"
                        : "border-slate-200 hover:border-slate-300 text-slate-600"
                        }`}
                >
                    {autonomousMode ? (
                        <>
                            <Pause className="w-4 h-4 fill-current" />
                            <span className="animate-pulse font-bold tracking-wide">AUTONOMOUS ACTIVE</span>
                        </>
                    ) : (
                        <>
                            <Play className="w-4 h-4" />
                            <span>Auto Pilot</span>
                        </>
                    )}
                </Button>

                <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-600" aria-label="More Options">
                    <Archive className="w-4 h-4" />
                </Button>
            </div>
        </div>
    );
}
