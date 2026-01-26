import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLanguage } from "@/components/LanguageContext";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
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
  CreditCard,
  Database,
  Github,
  Skull, // 💀 For YOLO Mode
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/features/auth/context/AuthContext";

const BoardRoomHeader = ({
  meetings,
  selectedMeeting,
  setSelectedMeeting,
  handleCreateMeeting,
  activeAgentsCount,
  autonomousMode,
  setAutonomousMode,
  yoloMode,
  setYoloMode,
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
  handleCreateTask,
  workflows,
  isRTL,
  boardAgents,
  agents,
}) => {
  const { logout, user } = useAuth();
  const { t, i18n } = useTranslation();

  const handleSyncLinear = async () => {
    const apiKey =
      import.meta.env.VITE_LINEAR_API_KEY || prompt("Enter Linear API Key:");
    if (!apiKey) return;
    const teamKey = prompt("Enter Team Key (e.g. KOS) [Optional]:") || null;

    try {
      const response = await fetch(
        "http://127.0.0.1:8003/integrations/linear/sync",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ api_key: apiKey, team_key: teamKey }),
        },
      );
      const result = await response.json();

      if (result.status === "success") {
        const issues = result.issues;
        let createdCount = 0;

        // Create tasks for each issue
        for (const issue of issues) {
          await handleCreateTask({
            title: `[LINEAR-${issue.identifier}] ${issue.title}`,
            description:
              issue.description || `Imported from Linear: ${issue.url}`,
            priority: "medium",
          });
          createdCount++;
        }

        alert(
          `Successfully imported ${createdCount} issues from Linear into the Board Room!`,
        );
      } else {
        alert("Sync failed: " + result.message);
      }
    } catch (e) {
      console.error(e);
      alert(
        "Failed to connect to Integration Hub. Is it running? (cd src/knowledge/n8n-workflows/src && python3 integration_hub.py)",
      );
    }
  };

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 md:p-6 border-b border-white/10 bg-white/80 dark:bg-black/40 backdrop-blur-xl sticky top-0 z-10 gap-4 md:gap-6 shadow-sm">
      {/* Left Section: Mobile Menu & Logo & Meeting Select */}
      <div className="flex items-center gap-5 flex-1 w-full md:w-auto overflow-x-auto no-scrollbar max-w-5xl mx-auto">
        {/* Mobile Menu Trigger */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden flex-shrink-0"
          onClick={onOpenMobileMenu}
        >
          <Menu className="h-6 w-6 text-gray-600 dark:text-slate-400" />
        </Button>

        <div className="relative shrink-0 hidden sm:block">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg text-white font-bold text-lg">
            K
          </div>
        </div>

        <Select
          value={selectedMeeting?.id}
          onValueChange={(val) =>
            setSelectedMeeting(meetings.find((m) => m.id === val))
          }
        >
          <SelectTrigger className="w-[240px] md:w-[320px] h-12 font-bold text-xl border-white/10 bg-white/5 hover:bg-white/10 transition-colors dark:bg-white/5 dark:border-white/10 text-foreground dark:text-foreground dark:hover:bg-white/10 rounded-xl backdrop-blur-sm">
            <SelectValue placeholder="Select Meeting Strategy..." />
          </SelectTrigger>
          <SelectContent className="max-h-[300px] dark:bg-slate-900 dark:border-slate-800">
            <div className="p-2 border-b mb-1 dark:border-slate-800">
              <Button
                variant="secondary"
                className="w-full justify-start gap-3 h-10 text-base text-indigo-600 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-400 dark:hover:bg-indigo-900/40"
                onClick={(e) => {
                  e.preventDefault();
                  handleCreateMeeting();
                }}
              >
                <Plus className="w-5 h-5" />
                Create New Strategy Board
              </Button>
            </div>
            {meetings.map((meeting) => (
              <SelectItem key={meeting.id} value={meeting.id} className="py-4">
                <div className="flex flex-col items-start gap-1">
                  <span className="font-bold text-base dark:text-slate-200">
                    {meeting.title}
                  </span>
                  <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                    <span>
                      {new Date(meeting.created_at).toLocaleDateString()}
                    </span>
                    {meeting.status === "archived" && (
                      <Badge
                        variant="outline"
                        className="text-xs dark:border-slate-700 dark:text-slate-400"
                      >
                        Archived
                      </Badge>
                    )}
                  </div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Middle Actions Group (Desktop) */}
      <div className="hidden md:flex items-center gap-3">
        <Button
          variant="outline"
          size="default"
          className="h-10 px-4 gap-2 text-base font-medium bg-amber-500/10 text-amber-600 border-amber-500/20 hover:bg-amber-500/20 whitespace-nowrap dark:text-amber-400 rounded-lg shadow-sm backdrop-blur-sm"
          onClick={handleStartDailyStandup}
        >
          <Sparkles className="w-4 h-4" />
          <span className="hidden lg:inline">
            {isRTL ? "ישיבת בוקר" : "Daily"}
          </span>
        </Button>

        <Button
          variant="outline"
          size="default"
          className="h-10 px-4 gap-2 text-base font-medium bg-purple-500/10 text-purple-600 border-purple-500/20 hover:bg-purple-500/20 whitespace-nowrap dark:text-purple-400 rounded-lg shadow-sm backdrop-blur-sm"
          onClick={handleStartOneDollarChallenge}
        >
          <Zap className="w-4 h-4" />
          <span className="hidden lg:inline">
            {isRTL ? "אתגר הדולר" : "$1 Challenge"}
          </span>
        </Button>

        <Button
          variant="outline"
          size="default"
          className="h-10 px-4 gap-2 text-base font-medium bg-blue-500/10 text-blue-600 border-blue-500/20 hover:bg-blue-500/20 whitespace-nowrap dark:text-blue-400 rounded-lg shadow-sm backdrop-blur-sm"
          onClick={handleSyncLinear}
        >
          <Activity className="w-4 h-4" />
          <span className="hidden lg:inline">Linear</span>
        </Button>

        <Select onValueChange={handleStartWorkflow}>
          <SelectTrigger className="h-10 w-[140px] text-base bg-slate-50 border-slate-200 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300 rounded-lg shadow-sm">
            <SelectValue placeholder="Workflow" />
          </SelectTrigger>
          <SelectContent className="dark:bg-slate-900 dark:border-slate-800">
            {workflows?.map((wf) => (
              <SelectItem
                key={wf.id}
                value={wf.id}
                className="dark:text-slate-300 dark:focus:bg-slate-800 py-3 text-base"
              >
                {wf.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Right Section: Agents, Autonomous Mode, User Menu */}
      <div className="flex items-center gap-3 ml-auto">
        {/* Active Agents Count */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="default"
                className="h-10 px-4 gap-2 text-base border-slate-200 hover:border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600 rounded-lg"
                onClick={onManageTeam}
              >
                <Bot className="w-4 h-4" />
                <span className="hidden sm:inline">
                  {activeAgentsCount} Agents
                </span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Manage Agents</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Local Brain Toggle */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="default"
                className={`h-10 px-4 gap-2 text-base transition-colors rounded-lg ${localBrainEnabled ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100 dark:bg-green-900/10 dark:text-green-400 dark:border-green-900/30 dark:hover:bg-green-900/20" : "border-slate-200 hover:border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600"}`}
                onClick={() => setLocalBrainEnabled(!localBrainEnabled)}
              >
                {localBrainEnabled ? (
                  <>
                    <div
                      className={`w-2.5 h-2.5 rounded-full ${localBrainStatus?.isReady ? "bg-green-300" : "bg-yellow-300 animate-pulse"}`}
                    />
                    <span className="hidden sm:inline">Local Brain</span>
                  </>
                ) : (
                  <>
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-600" />
                    <span className="hidden sm:inline">Cloud AI</span>
                  </>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                {localBrainEnabled
                  ? localBrainStatus?.isReady
                    ? "Ready"
                    : "Loading..."
                  : "Switch to Local Brain"}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Autonomous Mode Toggle */}
        <Button
          variant={autonomousMode ? "default" : "outline"}
          size="default"
          onClick={() => setAutonomousMode(!autonomousMode)}
          className={`h-10 px-4 gap-2 text-base rounded-lg transition-all duration-500 border-2 ${
            autonomousMode
              ? "bg-gradient-to-r from-red-500 to-amber-500 hover:from-red-600 hover:to-amber-600 text-white border-transparent bg-[length:200%_200%] animate-gradient-x shadow-lg shadow-orange-500/20"
              : "border-slate-200 hover:border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600"
          }`}
        >
          {autonomousMode ? (
            <Pause className="w-5 h-5" />
          ) : (
            <Play className="w-5 h-5" />
          )}
          <span className="hidden sm:inline font-bold">
            {autonomousMode ? "AUTONOMOUS" : "Auto Pilot"}
          </span>
        </Button>

        {/* YOLO Mode Toggle (Danger) */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={yoloMode ? "default" : "outline"}
                size="icon"
                onClick={() => setYoloMode(!yoloMode)}
                className={`h-10 w-10 transition-all duration-300 border-2 ${
                  yoloMode
                    ? "bg-red-600 border-red-500 text-white hover:bg-red-700 animate-pulse shadow-[0_0_15px_rgba(220,38,38,0.7)]"
                    : "border-slate-800 text-slate-600 hover:text-red-500 hover:border-red-900/50"
                }`}
              >
                <Skull className="w-5 h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="font-bold text-red-500">
                YOLO Mode: Auto-Approve ALL Actions 💀
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Mobile Info Trigger */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden ml-1"
          onClick={onOpenMobileInfo}
        >
          <PanelRight className="h-5 w-5 text-gray-600 dark:text-slate-400" />
        </Button>

        {/* User Menu */}
        <div className="pl-3 border-l border-slate-200 ml-2 dark:border-slate-800">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-12 w-12 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="User Menu"
              >
                <Avatar className="h-11 w-11 border-2 border-white dark:border-slate-800 shadow-sm ring-2 ring-indigo-50 dark:ring-indigo-900/30">
                  <AvatarImage src="/avatars/admin-user.jpg" alt="Naor Yanko" />
                  <AvatarFallback className="bg-indigo-600 text-white font-bold text-lg">
                    NY
                  </AvatarFallback>
                </Avatar>
                <span className="absolute bottom-1 right-0 h-3.5 w-3.5 rounded-full bg-green-500 border-2 border-white dark:border-slate-800"></span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-56 dark:bg-slate-900 dark:border-slate-800"
              align="end"
              forceMount
            >
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none dark:text-slate-200">
                    Naor Yanko
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    Admin Access
                  </p>
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
