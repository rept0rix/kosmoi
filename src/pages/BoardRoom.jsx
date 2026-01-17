import React from 'react';
import { useBoardRoom } from '@/shared/hooks/useBoardRoom';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/GlassCard";
import { motion } from 'framer-motion';
import { Layout, TriangleAlert } from 'lucide-react';

import BoardRoomHeader from './board/BoardRoomHeader';
import BoardRoomLeftSidebar from './board/BoardRoomLeftSidebar';
import BoardRoomRightSidebar from './board/BoardRoomRightSidebar';
import BoardRoomMessageList from './board/BoardRoomMessageList';
import BoardRoomInput from './board/BoardRoomInput';
import CreateMeetingDialog from './board/CreateMeetingDialog';
import TeamManagementDialog from './board/TeamManagementDialog';
import CompanyStateDisplay from '@/features/agents/components/CompanyStateDisplay';
import BookingDialog from '@/components/BookingDialog';

import { agents } from '@/features/agents/services/AgentRegistry';
import { WORKFLOWS } from '@/features/agents/services/WorkflowService';

import BoardRoomErrorBoundary from '@/components/BoardRoomErrorBoundary';
import WorkflowStateBanner from '@/components/board/WorkflowStateBanner';

function BoardRoomContent() {
    const {
        // State
        meetings, selectedMeeting, setSelectedMeeting,
        messages, tasks, knowledgeItems,
        activeRightTab, setActiveRightTab,
        isSplitView, setIsSplitView,
        input, setInput, isLoading, typingAgent,
        autonomousMode, setAutonomousMode,
        isCreateMeetingOpen, setIsCreateMeetingOpen,
        isManageTeamOpen, setIsManageTeamOpen,
        isBookingOpen, setIsBookingOpen,
        bookingDetails, setBookingDetails,
        isMobileLeftOpen, setIsMobileLeftOpen,
        isMobileRightOpen, setIsMobileRightOpen,
        newMeetingTitle, setNewMeetingTitle,
        selectedImage, setSelectedImage,
        selectedAgentIds, setSelectedAgentIds,
        companyState, activeWorkflowState,
        messagesEndRef,
        localLLM, localBrainEnabled, setLocalBrainEnabled,
        workerStatus, isWorkerStopped, isRTL, boardAgents, config,
        // Methods
        handleSendMessage, handleToggleAgent,
        handleCreateMeeting, confirmCreateMeeting,
        handleCreateTask, handleUpdateTaskStatus, handleDeleteTask,
        handleStartDailyStandup, handleStartOneDollarChallenge, handleStartWorkflow
    } = useBoardRoom();

    return (
        <div className="flex h-full w-full bg-slate-950 overflow-hidden font-sans grainy-noise" dir={isRTL ? 'rtl' : 'ltr'}>
            {/* DEBUG INFO */}
            <div className="fixed top-0 left-0 bg-black text-white text-xs p-1 z-50 opacity-50 pointer-events-none">
                App: {config?.appName} | Theme: {config?.themeColor}
            </div>

            {/* Mobile Sidebar Sheets */}
            <Sheet open={isMobileLeftOpen} onOpenChange={setIsMobileLeftOpen}>
                <SheetContent side="left" className="p-0 w-80">
                    <BoardRoomLeftSidebar
                        meetings={meetings}
                        selectedMeeting={selectedMeeting}
                        onSelectMeeting={(m) => { setSelectedMeeting(m); setIsMobileLeftOpen(false); }}
                        agents={agents}
                        selectedAgentIds={selectedAgentIds}
                        onToggleAgent={handleToggleAgent}
                        handleCreateMeeting={handleCreateMeeting}
                        isWorkerStopped={isWorkerStopped}
                    />
                </SheetContent>
            </Sheet>

            <Sheet open={isMobileRightOpen} onOpenChange={setIsMobileRightOpen}>
                <SheetContent side="right" className="p-0 w-80">
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

            <div className="flex flex-1 overflow-hidden relative">
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
                <div className="flex-1 flex flex-col relative bg-slate-950/50 backdrop-blur-md">
                    {/* Worker Alert */}
                    {isWorkerStopped && (
                        <div className="p-4 bg-red-50 border-b border-red-200">
                            <Alert variant="destructive" className="bg-white border-red-200">
                                <TriangleAlert className="h-4 w-4" />
                                <AlertTitle>System Critical Alert</AlertTitle>
                                <AlertDescription className="flex flex-col gap-2">
                                    <p>The Autonomous Worker has stopped due to an error:</p>
                                    <code className="bg-red-100 p-2 rounded text-xs overflow-x-auto">
                                        {workerStatus?.error || "Unknown Error"}
                                    </code>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Last seen: {new Date(workerStatus?.last_seen).toLocaleString()}
                                    </p>
                                </AlertDescription>
                            </Alert>
                        </div>
                    )}

                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23fbbf24' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                    }} />



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
                            loadingText: localLLM.loadingText
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
                                className="max-w-3xl mx-auto w-full border-x border-white/5 shadow-2xl bg-black/20 backdrop-blur-xl min-h-screen"
                            />

                            <BoardRoomInput
                                input={input}
                                setInput={setInput}
                                onSend={handleSendMessage}
                                isRTL={isRTL}
                                selectedImage={selectedImage}
                                setSelectedImage={setSelectedImage}
                                className="max-w-5xl mx-auto w-full"
                            />
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-6 p-4">
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ duration: 0.5 }}
                                className="relative"
                            >
                                <div className="absolute inset-0 bg-banana-500/20 blur-3xl rounded-full animate-pulse" />
                                <GlassCard className="w-32 h-32 md:w-40 md:h-40 flex items-center justify-center relative z-10 border-banana-500/20">
                                    <Layout className="w-16 h-16 md:w-20 md:h-20 text-banana-400 drop-shadow-glow" />
                                </GlassCard>
                            </motion.div>

                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                className="text-center space-y-3 z-10 max-w-lg"
                            >
                                <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white text-glow-banana bg-clip-text text-transparent bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-600 py-1">
                                    {isRTL ? 'חדר הישיבות' : 'The Board Room'}
                                </h2>
                                <p className="text-base md:text-lg text-muted-foreground/80 max-w-sm mx-auto leading-relaxed">
                                    {isRTL ? 'בחר או צור פגישה כדי להתחיל לעבוד עם הצוות' : 'Select or create a meeting to start collaborating with your AI team.'}
                                </p>
                            </motion.div>

                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.4 }}
                            >
                                <Button size="lg" className="shadow-neon hover:shadow-glass-hover bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-8 py-6 text-lg font-medium transition-all duration-300 transform hover:scale-105" onClick={() => setIsCreateMeetingOpen(true)}>
                                    {isRTL ? 'צור פגישה חדשה' : 'Start New Session'}
                                </Button>
                            </motion.div>
                        </div>
                    )}
                </div>

                {/* Right Sidebar - Tasks & Knowledge */}
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
                        id: bookingDetails?.providerId || 'default',
                        business_name: bookingDetails?.providerName || 'Provider',
                        category: bookingDetails?.serviceName || 'Service'
                    }}
                    onBookingConfirmed={() => { }}
                    selectedPackage={null}
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
