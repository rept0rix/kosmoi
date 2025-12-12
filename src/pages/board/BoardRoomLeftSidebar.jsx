import React from 'react';
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Layout, Plus, Users, TriangleAlert } from 'lucide-react';
import MiniTeamGallery from '@/components/agents/MiniTeamGallery';
import WalletCard from '@/components/WalletCard';

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
        <div className="w-72 border-e bg-white flex flex-col shadow-sm z-10 dark:bg-slate-950 dark:border-slate-800">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50/50 dark:bg-slate-900/50 dark:border-slate-800">
                <h2 className="font-semibold flex items-center gap-2 text-gray-800 dark:text-slate-200">
                    {isWorkerStopped && <TriangleAlert className="h-5 w-5 text-red-600 animate-pulse" />}
                    <Layout className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </h2>
                <Button variant="ghost" size="icon" onClick={handleCreateMeeting} className="h-8 w-8 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20 dark:hover:text-blue-400">
                    <Plus className="w-4 h-4" />
                </Button>
            </div>
            <ScrollArea className="flex-1">
                <div className="p-3 space-y-2">
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

            {/* Wallet Card */}
            <div className="p-4 bg-gray-50/50 border-t dark:bg-slate-900/50 dark:border-slate-800">
                <WalletCard />
            </div>

            {/* Team Gallery (Active Agents + Human) */}
            <div className="flex-1 flex flex-col min-h-0">
                <MiniTeamGallery
                    agents={agents}
                    activeAgentIds={selectedAgentIds}
                />
            </div>
        </div>
    );
}
