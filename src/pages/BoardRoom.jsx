import React from "react";
import { useBoardRoom } from "@/shared/hooks/useBoardRoom";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";
import { motion } from "framer-motion";
import {
  Layout,
  TriangleAlert,
  Command,
  Cpu,
  Sparkles,
  Workflow,
  RadioTower,
  ArrowRight,
} from "lucide-react";

import BoardRoomHeader from "./board/BoardRoomHeader";
import BoardRoomLeftSidebar from "./board/BoardRoomLeftSidebar";
import BoardRoomRightSidebar from "./board/BoardRoomRightSidebar";
import BoardRoomMessageList from "./board/BoardRoomMessageList";
import BoardRoomInput from "./board/BoardRoomInput";
import CreateMeetingDialog from "./board/CreateMeetingDialog";
import TeamManagementDialog from "./board/TeamManagementDialog";
import CompanyStateDisplay from "@/features/agents/components/CompanyStateDisplay";
import BookingDialog from "@/components/BookingDialog";

import { agents } from "@/features/agents/services/AgentRegistry";
import { WORKFLOWS } from "@/features/agents/services/WorkflowService";

import BoardRoomErrorBoundary from "@/components/BoardRoomErrorBoundary";
import WorkflowStateBanner from "@/components/board/WorkflowStateBanner";
import { cn } from "@/lib/utils";

function BoardRoomContent() {
  const {
    // State
    meetings,
    selectedMeeting,
    setSelectedMeeting,
    messages,
    tasks,
    knowledgeItems,
    activeRightTab,
    setActiveRightTab,
    isSplitView,
    setIsSplitView,
    input,
    setInput,
    isLoading,
    typingAgent,
    autonomousMode,
    setAutonomousMode,
    isCreateMeetingOpen,
    setIsCreateMeetingOpen,
    isManageTeamOpen,
    setIsManageTeamOpen,
    isBookingOpen,
    setIsBookingOpen,
    bookingDetails,
    setBookingDetails,
    isMobileLeftOpen,
    setIsMobileLeftOpen,
    isMobileRightOpen,
    setIsMobileRightOpen,
    newMeetingTitle,
    setNewMeetingTitle,
    selectedImage,
    setSelectedImage,
    selectedAgentIds,
    setSelectedAgentIds,
    companyState,
    activeWorkflowState,
    messagesEndRef,
    localLLM,
    localBrainEnabled,
    setLocalBrainEnabled,
    workerStatus,
    isWorkerStopped,
    isRTL,
    boardAgents,
    config,
    // Methods
    handleSendMessage,
    handleToggleAgent,
    handleCreateMeeting,
    confirmCreateMeeting,
    handleCreateTask,
    handleUpdateTaskStatus,
    handleDeleteTask,
    handleStartDailyStandup,
    handleStartOneDollarChallenge,

    handleStartWorkflow,
    yoloMode,
    setYoloMode,
  } = useBoardRoom();

  return (
    <div
      className="flex h-full w-full bg-[#030712] overflow-hidden font-sans text-slate-200"
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* Cyberpunk Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Ambient Glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* DEBUG INFO */}
      <div className="fixed top-0 left-0 bg-black/80 text-neon-cyan text-[10px] px-2 py-1 z-50 opacity-40 hover:opacity-100 pointer-events-none font-mono border-b border-r border-neon-cyan/20 rounded-br-lg">
        HUB: {config?.appName} | SYS: {config?.themeColor} | MODE:{" "}
        {autonomousMode ? "AUTO" : "MANUAL"}
      </div>

      {/* Mobile Sidebar Sheets */}
      <Sheet open={isMobileLeftOpen} onOpenChange={setIsMobileLeftOpen}>
        <SheetContent
          side="left"
          className="p-0 w-80 border-r border-white/10 bg-slate-950/95 backdrop-blur-xl"
        >
          <BoardRoomLeftSidebar
            meetings={meetings}
            selectedMeeting={selectedMeeting}
            onSelectMeeting={(m) => {
              setSelectedMeeting(m);
              setIsMobileLeftOpen(false);
            }}
            agents={agents}
            selectedAgentIds={selectedAgentIds}
            onToggleAgent={handleToggleAgent}
            handleCreateMeeting={handleCreateMeeting}
            isWorkerStopped={isWorkerStopped}
          />
        </SheetContent>
      </Sheet>

      <Sheet open={isMobileRightOpen} onOpenChange={setIsMobileRightOpen}>
        <SheetContent
          side="right"
          className="p-0 w-80 border-l border-white/10 bg-slate-950/95 backdrop-blur-xl"
        >
          <BoardRoomRightSidebar
            files={[]}
            tasks={tasks}
            knowledgeItems={knowledgeItems}
            activeRightTab={activeRightTab}
            setActiveRightTab={setActiveRightTab}
            isSplitView={isSplitView}
            onSplitViewToggle={() => setIsSplitView(!isSplitView)}
            handleCreateTask={handleCreateTask}
            handleUpdateTaskStatus={handleUpdateTaskStatus}
            handleDeleteTask={handleDeleteTask}
          />
        </SheetContent>
      </Sheet>

      <div className="flex flex-1 overflow-hidden relative z-10">
        {/* Left Sidebar (Desktop) */}
        <div className="hidden md:flex flex-shrink-0">
          <BoardRoomLeftSidebar
            meetings={meetings}
            selectedMeeting={selectedMeeting}
            onSelectMeeting={setSelectedMeeting}
            handleCreateMeeting={handleCreateMeeting}
            isWorkerStopped={isWorkerStopped}
            agents={agents}
            selectedAgentIds={selectedAgentIds}
            onToggleAgent={handleToggleAgent}
          />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col relative bg-transparent min-w-0">
          {/* Worker Alert */}
          {isWorkerStopped && (
            <div className="p-4 bg-red-950/30 border-b border-red-500/30 backdrop-blur-sm">
              <Alert
                variant="destructive"
                className="bg-transparent border-red-500/50 text-red-200"
              >
                <TriangleAlert className="h-4 w-4 text-red-500 animate-pulse" />
                <AlertTitle className="text-red-400 font-bold tracking-wide">
                  SYSTEM CRITICAL ALERT
                </AlertTitle>
                <AlertDescription className="flex flex-col gap-2">
                  <p className="font-mono text-xs opacity-90">
                    Autonomous Protocol Halted. Manual override required.
                  </p>
                  <code className="bg-red-950/50 border border-red-500/30 p-2 rounded text-[10px] font-mono text-red-300">
                    ERR: {workerStatus?.error || "Unknown Runtime Exception"}
                  </code>
                  <p className="text-[10px] text-red-400/60 font-mono mt-1">
                    LAST_SEEN:{" "}
                    {new Date(workerStatus?.last_seen).toLocaleString()}
                  </p>
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Header Always Visible */}
          <BoardRoomHeader
            meetings={meetings}
            selectedMeeting={selectedMeeting}
            setSelectedMeeting={setSelectedMeeting}
            handleCreateMeeting={handleCreateMeeting}
            activeAgentsCount={selectedAgentIds.length}
            autonomousMode={autonomousMode}
            setAutonomousMode={setAutonomousMode}
            yoloMode={yoloMode}
            setYoloMode={setYoloMode}
            selectedAgentIds={selectedAgentIds}
            onManageTeam={() => setIsManageTeamOpen(true)}
            onOpenMobileMenu={() => setIsMobileLeftOpen(true)}
            onOpenMobileInfo={() => setIsMobileRightOpen(true)}
            localBrainEnabled={localBrainEnabled}
            setLocalBrainEnabled={setLocalBrainEnabled}
            localBrainStatus={{
              isReady: localLLM.isReady,
              isDownloading: localLLM.isDownloading,
              loadingText: localLLM.loadingText,
            }}
            isRTL={isRTL}
            handleStartDailyStandup={handleStartDailyStandup}
            handleStartOneDollarChallenge={handleStartOneDollarChallenge}
            handleStartWorkflow={handleStartWorkflow}
            handleCreateTask={handleCreateTask}
            boardAgents={boardAgents}
            agents={agents}
            workflows={Object.values(WORKFLOWS)}
          />

          <WorkflowStateBanner state={activeWorkflowState} />

          {selectedMeeting ? (
            <>
              <div className="px-6 pt-4">
                <CompanyStateDisplay state={companyState} />
              </div>

              <div className="flex-1 overflow-hidden relative">
                <BoardRoomMessageList
                  messages={messages}
                  typingAgent={typingAgent}
                  boardAgents={agents}
                  isRTL={isRTL}
                  messagesEndRef={messagesEndRef}
                  onBookingRequest={(details) => {
                    setBookingDetails(details);
                    setIsBookingOpen(true);
                  }}
                  className="h-full w-full max-w-4xl mx-auto border-x border-white/5 bg-slate-950/30 backdrop-blur-sm"
                />
              </div>

              <BoardRoomInput
                input={input}
                setInput={setInput}
                onSend={handleSendMessage}
                isRTL={isRTL}
                selectedImage={selectedImage}
                setSelectedImage={setSelectedImage}
                className="max-w-4xl mx-auto w-full mb-4 px-4"
              />
            </>
          ) : (
            <div className="flex-1 overflow-auto px-6 py-8 md:px-8 lg:px-10">
              {/* Floating Elements for Empty State */}
              <motion.div
                animate={{ y: [0, -20, 0] }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute top-1/4 left-1/4 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl"
              />
              <motion.div
                animate={{ y: [0, 20, 0] }}
                transition={{
                  duration: 7,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 1,
                }}
                className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-pink-500/10 rounded-full blur-3xl"
              />

              <div className="relative z-10 mx-auto grid min-h-full w-full max-w-7xl items-center gap-6 xl:grid-cols-[minmax(0,1.4fr)_360px]">
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.45 }}
                >
                  <GlassCard
                    variant="premium"
                    className="overflow-hidden border-white/10 bg-slate-950/60 p-8 shadow-[0_30px_80px_rgba(2,6,23,0.55)] md:p-10"
                  >
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_26%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.12),transparent_28%)]" />
                    <div className="relative flex flex-col gap-8">
                      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                        <div className="max-w-3xl space-y-4">
                          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-200">
                            <Sparkles className="h-4 w-4" />
                            Neural strategy workspace
                          </div>
                          <h2 className="text-5xl font-black tracking-tight text-white md:text-6xl xl:text-7xl">
                            {isRTL ? "חדר הישיבות" : "BOARD ROOM"}
                          </h2>
                          <p className="max-w-2xl text-lg leading-8 text-slate-300 md:text-xl">
                            {isRTL
                              ? "בחר או צור פגישה כדי להתחיל לעבוד עם הצוות"
                              : "Create a live session, pick a strategy track, and start orchestrating your agents from one place."}
                          </p>
                        </div>
                        <div className="grid w-full gap-3 sm:grid-cols-3 lg:w-[320px] lg:grid-cols-1">
                          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                            <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
                              Sessions
                            </div>
                            <div className="mt-2 text-3xl font-bold text-white">
                              {meetings.length}
                            </div>
                          </div>
                          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                            <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
                              Active agents
                            </div>
                            <div className="mt-2 text-3xl font-bold text-white">
                              {selectedAgentIds.length}
                            </div>
                          </div>
                          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                            <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
                              Mode
                            </div>
                            <div className="mt-2 text-3xl font-bold text-cyan-300">
                              {autonomousMode ? "AUTO" : "MANUAL"}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
                        <div className="rounded-3xl border border-white/10 bg-white/5 p-5 md:p-6">
                          <div className="mb-4 flex items-center gap-3">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-300">
                              <Cpu className="h-7 w-7" />
                            </div>
                            <div>
                              <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
                                Quick start
                              </div>
                              <div className="text-xl font-bold text-white">
                                Create a board session
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col gap-3 lg:flex-row">
                            <Input
                              value={newMeetingTitle}
                              onChange={(e) => setNewMeetingTitle(e.target.value)}
                              onKeyDown={(e) =>
                                e.key === "Enter" && confirmCreateMeeting()
                              }
                              placeholder="Name this session or use a template below"
                              className="h-14 border-white/10 bg-slate-950/70 text-base text-white placeholder:text-slate-500"
                            />
                            <NeonButton
                              size="lg"
                              variant="cyan"
                              className="h-14 min-w-[220px] justify-center px-8 text-base font-bold"
                              onClick={() => confirmCreateMeeting()}
                            >
                              <Command className="mr-3 h-5 w-5" />
                              {newMeetingTitle.trim()
                                ? "Create session"
                                : "Initialize session"}
                            </NeonButton>
                          </div>

                          <div className="mt-6 grid gap-3 md:grid-cols-3">
                            {[
                              {
                                title: "Daily Standup",
                                description:
                                  "Open a fast execution sync for product, growth, and engineering.",
                                icon: Sparkles,
                              },
                              {
                                title: "Growth Sprint",
                                description:
                                  "Coordinate campaign, CRM, and optimization agents around one target.",
                                icon: Workflow,
                              },
                              {
                                title: "Incident Review",
                                description:
                                  "Spin up a troubleshooting board and route action items immediately.",
                                icon: RadioTower,
                              },
                            ].map(({ title, description, icon: Icon }) => (
                              <button
                                key={title}
                                type="button"
                                onClick={() => confirmCreateMeeting(title)}
                                className="rounded-2xl border border-white/10 bg-slate-950/55 p-4 text-left transition hover:-translate-y-0.5 hover:border-cyan-400/30 hover:bg-slate-900/80"
                              >
                                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300">
                                  <Icon className="h-5 w-5" />
                                </div>
                                <div className="text-base font-semibold text-white">
                                  {title}
                                </div>
                                <div className="mt-2 text-sm leading-6 text-slate-400">
                                  {description}
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-4">
                          <GlassCard
                            variant="premium"
                            className="border-white/10 bg-slate-950/55 p-5"
                          >
                            <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
                              How it works
                            </div>
                            <div className="mt-4 space-y-4">
                              {[
                                "Create a session or launch a quick template.",
                                "Select the active agents you want in the room.",
                                "Send a directive and let the board coordinate the next speaker.",
                              ].map((step, index) => (
                                <div
                                  key={step}
                                  className="flex items-start gap-3 text-sm leading-6 text-slate-300"
                                >
                                  <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-full border border-cyan-400/20 bg-cyan-400/10 text-xs font-bold text-cyan-300">
                                    {index + 1}
                                  </div>
                                  <span>{step}</span>
                                </div>
                              ))}
                            </div>
                          </GlassCard>

                          <GlassCard
                            variant="premium"
                            className="border-white/10 bg-slate-950/55 p-5"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
                                  Current team
                                </div>
                                <div className="mt-2 text-xl font-bold text-white">
                                  {selectedAgentIds.length} agents selected
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-cyan-300 hover:bg-cyan-400/10 hover:text-cyan-200"
                                onClick={() => setIsManageTeamOpen(true)}
                              >
                                Manage
                                <ArrowRight className="ml-2 h-4 w-4" />
                              </Button>
                            </div>
                            <p className="mt-3 text-sm leading-6 text-slate-400">
                              The team you choose here becomes the default brain trust for every new board session.
                            </p>
                          </GlassCard>
                        </div>
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar - Tasks & Knowledge */}
        <div className="hidden lg:flex lg:flex-shrink-0">
          {selectedMeeting && (
          <BoardRoomRightSidebar
            activeRightTab={activeRightTab}
            setActiveRightTab={setActiveRightTab}
            tasks={tasks}
            knowledgeItems={knowledgeItems}
            files={[]}
            handleCreateTask={handleCreateTask}
            handleDeleteTask={handleDeleteTask}
            handleUpdateTaskStatus={handleUpdateTaskStatus}
            isSplitView={isSplitView}
            onSplitViewToggle={() => setIsSplitView(!isSplitView)}
          />
          )}
        </div>

        {/* Dialogs */}
        <TeamManagementDialog
          open={isManageTeamOpen}
          onOpenChange={setIsManageTeamOpen}
          agents={agents}
          selectedAgentIds={selectedAgentIds}
          onToggleAgent={handleToggleAgent}
          isRTL={isRTL}
        />

        <CreateMeetingDialog
          open={isCreateMeetingOpen}
          onOpenChange={setIsCreateMeetingOpen}
          title={newMeetingTitle}
          setTitle={setNewMeetingTitle}
          onConfirm={confirmCreateMeeting}
          isRTL={isRTL}
        />

        <BookingDialog
          open={isBookingOpen}
          onOpenChange={setIsBookingOpen}
          provider={{
            id: bookingDetails?.providerId || "default",
            business_name: bookingDetails?.providerName || "Provider",
            category: bookingDetails?.serviceName || "Service",
          }}
          onBookingConfirmed={() => {}}
        />
      </div>
    </div>
  );
}

export default function BoardRoom() {
  return (
    <BoardRoomErrorBoundary>
      <BoardRoomContent />
    </BoardRoomErrorBoundary>
  );
}
