import React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/components/LanguageContext";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Activity,
    Calendar,
    Settings,
    User,
    LogOut,
    Sparkles,
    Bot,
    Languages,
    Menu,
    PanelRight,
    Info,
    Zap,
    Plus,
    Play,
    Pause,
    CreditCard
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/lib/AuthContext';

const BoardRoomHeader = ({
    meetings,
    selectedMeeting,
    setSelectedMeeting,
    handleCreateMeeting,
    activeAgentsCount,
    autonomousMode,
    setAutonomousMode,
    selectedAgentIds,
    onManageTeam,
    onOpenMobileMenu,
    onOpenMobileInfo,
    localBrainEnabled,
    setLocalBrainEnabled,
    localBrainStatus,
    handleStartDailyStandup,
    handleStartOneDollarChallenge,
    handleStartWorkflow,
    workflows,
    isRTL,
    boardAgents,
    agents
}) => {
    const { logout, user } = useAuth();
    const { t, i18n } = useTranslation();

    return (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 border-b bg-white dark:bg-slate-950 dark:border-slate-800 sticky top-0 z-10 gap-4">

            {/* Left Section: Mobile Menu & Logo & Meeting Select */}
            <div className="flex items-center gap-4 flex-1 w-full md:w-auto overflow-x-auto no-scrollbar">

                {/* Mobile Menu Trigger */}
                <Button variant="ghost" size="icon" className="md:hidden flex-shrink-0" onClick={onOpenMobileMenu}>
                    <Menu className="h-5 w-5 text-gray-600 dark:text-slate-400" />
                </Button>

                <div className="relative shrink-0 hidden sm:block">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg text-white font-bold text-sm">
                        K
                    </div>
                </div>

                <Select
                    value={selectedMeeting?.id}
                    onValueChange={(val) => setSelectedMeeting(meetings.find(m => m.id === val))}
                >
                    <SelectTrigger className="w-[200px] md:w-[280px] font-bold text-lg border-2 border-indigo-100 bg-indigo-50/50 hover:bg-white transition-colors dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800">
                        <SelectValue placeholder="Select Meeting Strategy..." />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px] dark:bg-slate-900 dark:border-slate-800">
                        <div className="p-2 border-b mb-1 dark:border-slate-800">
                            <Button
                                variant="secondary"
                                className="w-full justify-start gap-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-400 dark:hover:bg-indigo-900/40"
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
                                    <span className="font-semibold dark:text-slate-200">{meeting.title}</span>
                                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                        <span>{new Date(meeting.created_at).toLocaleDateString()}</span>
                                        {meeting.status === 'archived' && <Badge variant="outline" className="text-[10px] dark:border-slate-700 dark:text-slate-400">Archived</Badge>}
                                    </div>
                                </div>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Middle Actions Group (Desktop) */}
            <div className="hidden md:flex items-center gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    className="h-9 px-3 gap-2 bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 whitespace-nowrap dark:bg-amber-900/10 dark:text-amber-400 dark:border-amber-900/30 dark:hover:bg-amber-900/20"
                    onClick={handleStartDailyStandup}
                >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span className="hidden lg:inline">{isRTL ? 'ישיבת בוקר' : 'Daily'}</span>
                </Button>

                <Button
                    variant="outline"
                    size="sm"
                    className="h-9 px-3 gap-2 bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 whitespace-nowrap dark:bg-purple-900/10 dark:text-purple-400 dark:border-purple-900/30 dark:hover:bg-purple-900/20"
                    onClick={handleStartOneDollarChallenge}
                >
                    <Zap className="w-3.5 h-3.5" />
                    <span className="hidden lg:inline">{isRTL ? 'אתגר הדולר' : '$1 Challenge'}</span>
                </Button>

                <Select onValueChange={handleStartWorkflow}>
                    <SelectTrigger className="h-9 w-[130px] bg-slate-50 border-slate-200 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300">
                        <SelectValue placeholder="Workflow" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-slate-900 dark:border-slate-800">
                        {workflows?.map(wf => (
                            <SelectItem key={wf.id} value={wf.id} className="dark:text-slate-300 dark:focus:bg-slate-800">
                                {wf.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-2 w-full md:w-auto justify-end">

                {/* Active Participants Avatars (Desktop Only) */}
                <div className="items-center -space-x-2 mr-4 hidden lg:flex">
                    {agents.filter(a => selectedAgentIds.includes(a.id)).map(agent => (
                        <TooltipProvider key={agent.id}>
                            <Tooltip>
                                <TooltipTrigger>
                                    <div className={`w-8 h-8 rounded-full border-2 border-white dark:border-slate-800 flex items-center justify-center text-xs font-bold text-white shadow-sm overflow-hidden bg-slate-500`}>
                                        {agent['avatar'] ? <img src={agent['avatar']} alt={agent.name} className="w-full h-full object-cover" /> : agent.name.charAt(0)}
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent><p>{agent.name}</p></TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    ))}
                    <Button variant="outline" size="icon" className="w-8 h-8 rounded-full border-dashed border-2 ml-2 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800" onClick={() => onManageTeam()}>
                        <Plus className="w-3 h-3" />
                    </Button>
                </div>

                {/* Local Brain Toggle */}
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant={localBrainEnabled ? "default" : "outline"}
                                size="sm"
                                onClick={() => setLocalBrainEnabled(!localBrainEnabled)}
                                className={`gap-2 transition-all ${localBrainEnabled
                                    ? "bg-purple-600 hover:bg-purple-700 text-white border-transparent"
                                    : "border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                                    }`}
                            >
                                {localBrainEnabled ? (
                                    <>
                                        <div className={`w-2 h-2 rounded-full ${localBrainStatus?.isReady ? 'bg-green-300' : 'bg-yellow-300 animate-pulse'}`} />
                                        <span className="hidden sm:inline">Local Brain</span>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600" />
                                        <span className="hidden sm:inline">Cloud AI</span>
                                    </>
                                )}
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{localBrainEnabled ? (localBrainStatus?.isReady ? "Ready" : "Loading...") : "Switch to Local Brain"}</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>

                {/* Autonomous Mode Toggle */}
                <Button
                    variant={autonomousMode ? "default" : "outline"}
                    size="sm"
                    onClick={() => setAutonomousMode(!autonomousMode)}
                    className={`gap-2 transition-all duration-500 border-2 ${autonomousMode
                        ? "bg-gradient-to-r from-red-500 to-amber-500 hover:from-red-600 hover:to-amber-600 text-white border-transparent bg-[length:200%_200%] animate-gradient-x shadow-lg shadow-orange-500/20"
                        : "border-slate-200 hover:border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600"
                        }`}
                >
                    {autonomousMode ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    <span className="hidden sm:inline">{autonomousMode ? "AUTONOMOUS" : "Auto Pilot"}</span>
                </Button>

                {/* Mobile Info Trigger */}
                <Button variant="ghost" size="icon" className="md:hidden ml-1" onClick={onOpenMobileInfo}>
                    <PanelRight className="h-5 w-5 text-gray-600 dark:text-slate-400" />
                </Button>

                {/* User Menu */}
                <div className="pl-2 border-l border-slate-200 ml-1 dark:border-slate-800">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" aria-label="User Menu">
                                <Avatar className="h-10 w-10 border-2 border-white dark:border-slate-800 shadow-sm ring-2 ring-indigo-50 dark:ring-indigo-900/30">
                                    <AvatarImage src="/avatars/admin-user.jpg" alt="Naor Yanko" />
                                    <AvatarFallback className="bg-indigo-600 text-white font-bold">NY</AvatarFallback>
                                </Avatar>
                                <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-white dark:border-slate-800"></span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56 dark:bg-slate-900 dark:border-slate-800" align="end" forceMount>
                            <DropdownMenuLabel className="font-normal">
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-medium leading-none dark:text-slate-200">Naor Yanko</p>
                                    <p className="text-xs leading-none text-muted-foreground">Admin Access</p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator className="dark:bg-slate-800" />
                            <DropdownMenuItem className="dark:focus:bg-slate-800 dark:text-slate-300">
                                <User className="mr-2 h-4 w-4" />
                                <span>Profile</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="dark:focus:bg-slate-800 dark:text-slate-300">
                                <CreditCard className="mr-2 h-4 w-4" />
                                <span>Billing</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="dark:focus:bg-slate-800 dark:text-slate-300">
                                <Settings className="mr-2 h-4 w-4" />
                                <span>Settings</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="dark:bg-slate-800" />
                            <DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/10">
                                <LogOut className="mr-2 h-4 w-4" />
                                <span>Log out</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </div>
    );
};

export default BoardRoomHeader;
