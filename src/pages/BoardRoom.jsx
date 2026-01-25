import React from "react";
import { useBoardRoom } from "@/shared/hooks/useBoardRoom";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";
import { motion } from "framer-motion";
import { Layout, TriangleAlert, Command, Cpu } from "lucide-react";

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
        <div className="flex-1 flex flex-col relative bg-transparent">
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
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-8 p-4 relative overflow-hidden">
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

              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="relative z-10"
              >
                <div className="absolute inset-0 bg-neon-cyan/20 blur-3xl rounded-full" />
                <GlassCard
                  variant="premium"
                  className="w-48 h-48 flex items-center justify-center relative z-10 border-neon-cyan/30 ring-1 ring-neon-cyan/20"
                >
                  <Cpu className="w-24 h-24 text-neon-cyan drop-shadow-neon animate-pulse-slow" />
                </GlassCard>
              </motion.div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-center space-y-4 z-10 max-w-lg"
              >
                <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                  {isRTL ? "חדר הישיבות" : "BOARD ROOM"}
                </h2>
                <p className="text-lg text-slate-400 max-w-md mx-auto leading-relaxed font-light">
                  {isRTL
                    ? "בחר או צור פגישה כדי להתחיל לעבוד עם הצוות"
                    : "Initialize a session to activate the Neural Link with your AI agents."}
                </p>
              </motion.div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <NeonButton
                  size="lg"
                  variant="cyan"
                  className="px-8 py-6 text-lg tracking-wide font-bold"
                  onClick={() => setIsCreateMeetingOpen(true)}
                >
                  <Command className="w-5 h-5 mr-3" />
                  {isRTL ? "צור פגישה חדשה" : "INITIALIZE SESSION"}
                </NeonButton>
              </motion.div>
            </div>
          )}
        </div>

        {/* Right Sidebar - Tasks & Knowledge */}
        <div className="hidden lg:flex lg:flex-shrink-0">
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
