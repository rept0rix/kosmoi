import React from 'react';
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Layout, Plus, Users, TriangleAlert, RadioTower, Sparkles } from 'lucide-react';
import MiniTeamGallery from '@/features/agents/components/MiniTeamGallery';

export default function BoardRoomLeftSidebar({
    meetings,
    selectedMeeting,
    onSelectMeeting,
    handleCreateMeeting,
    isWorkerStopped,
    agents,
    selectedAgentIds,
    onToggleAgent
}) {
    return (
        <div className="w-[280px] border-e bg-white/96 flex flex-col shadow-sm z-10 dark:bg-slate-950/95 dark:border-slate-800 backdrop-blur-xl">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50/50 dark:bg-slate-900/50 dark:border-slate-800">
                <div>
                    <div className="text-[11px] uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Board Room</div>
                    <h2 className="font-semibold flex items-center gap-2 text-gray-800 dark:text-slate-200">
                        {isWorkerStopped && <TriangleAlert className="h-5 w-5 text-red-600 animate-pulse" />}
                        <Layout className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        Sessions
                    </h2>
                </div>
                <Button variant="ghost" size="icon" onClick={handleCreateMeeting} className="h-8 w-8 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20 dark:hover:text-blue-400">
                    <Plus className="w-4 h-4" />
                </Button>
            </div>
            <ScrollArea className="flex-1 min-h-0">
                <div className="p-3 space-y-2">
                    {meetings.length === 0 && (
                        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-400">
                            <div className="mb-2 flex items-center gap-2 text-slate-700 dark:text-slate-200">
                                <Sparkles className="w-4 h-4 text-blue-500" />
                                <span className="font-semibold">No sessions yet</span>
                            </div>
                            <p>Create a board session from the main canvas to start a strategy discussion.</p>
                        </div>
                    )}
                    {meetings.map(meeting => (
                        <button
                            key={meeting.id}
                            onClick={() => onSelectMeeting(meeting)}
                            className={`w-full text-start px-4 py-3 rounded-xl text-sm transition-all duration-200 flex items-center gap-3 group ${selectedMeeting?.id === meeting.id
                                ? 'bg-blue-600 text-white shadow-md shadow-blue-200 dark:bg-blue-700 dark:shadow-none'
                                : 'hover:bg-gray-100 text-gray-700 bg-white border border-gray-100 dark:bg-slate-900/50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800'
                                }`}
                        >
                            <div className={`p-2 rounded-lg ${selectedMeeting?.id === meeting.id ? 'bg-white/20' : 'bg-gray-100 group-hover:bg-white dark:bg-slate-800 dark:group-hover:bg-slate-700'}`}>
                                <Users className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="font-medium truncate">{meeting.title}</div>
                                <div className={`text-xs truncate opacity-80 ${selectedMeeting?.id === meeting.id ? 'text-blue-100' : 'text-gray-400 dark:text-slate-500'}`}>
                                    {new Date(meeting.created_at).toLocaleDateString()}
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </ScrollArea>

            <div className="p-4 bg-gray-50/50 border-t dark:bg-slate-900/50 dark:border-slate-800">
                <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950/60">
                        <div className="text-[11px] uppercase tracking-wide text-slate-400">Sessions</div>
                        <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">{meetings.length}</div>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950/60">
                        <div className="text-[11px] uppercase tracking-wide text-slate-400">Agents</div>
                        <div className="mt-2 flex items-center gap-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
                            <RadioTower className="w-5 h-5 text-emerald-500" />
                            {selectedAgentIds.length}
                        </div>
                    </div>
                </div>
            </div>

            <div className="border-t bg-white/80 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/70">
                <div className="text-[11px] uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Active Team</div>
            </div>
            <div className="min-h-0">
                <MiniTeamGallery
                    agents={agents}
                    activeAgentIds={selectedAgentIds}
                />
            </div>
        </div>
    );
}
