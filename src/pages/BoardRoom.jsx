import React from 'react';
import { useBoardRoom } from '@/hooks/useBoardRoom';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Layout, TriangleAlert } from 'lucide-react';

import BoardRoomHeader from './board/BoardRoomHeader';
import BoardRoomLeftSidebar from './board/BoardRoomLeftSidebar';
import BoardRoomRightSidebar from './board/BoardRoomRightSidebar';
import BoardRoomMessageList from './board/BoardRoomMessageList';
import BoardRoomInput from './board/BoardRoomInput';
import CreateMeetingDialog from './board/CreateMeetingDialog';
import TeamManagementDialog from './board/TeamManagementDialog';
import CompanyStateDisplay from '@/components/agents/CompanyStateDisplay';
import BookingDialog from '@/components/BookingDialog';

import { agents } from '@/services/agents/AgentRegistry';
import { WORKFLOWS } from '@/services/agents/WorkflowService';

import BoardRoomErrorBoundary from '@/components/BoardRoomErrorBoundary';

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
        <div className="flex h-screen bg-gray-50 overflow-hidden font-sans" dir={isRTL ? 'rtl' : 'ltr'}>
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
                <div className="flex-1 flex flex-col relative bg-white">
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
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                    }} />

                    {selectedMeeting ? (
                        <>
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
                                boardAgents={boardAgents}
                                agents={agents}
                                workflows={Object.values(WORKFLOWS)}
                            />

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
                            />

                            <BoardRoomInput
                                input={input}
                                setInput={setInput}
                                onSend={handleSendMessage}
                                isRTL={isRTL}
                                selectedImage={selectedImage}
                                setSelectedImage={setSelectedImage}
                            />
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-4">
                            <div className="w-20 h-20 rounded-3xl bg-gray-50 flex items-center justify-center shadow-inner">
                                <Layout className="w-10 h-10 opacity-20" />
                            </div>
                            <p className="text-lg font-medium text-gray-500">
                                {isRTL ? 'בחר או צור פגישה כדי להתחיל' : 'Select or create a meeting to start'}
                            </p>
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
                    providerId={bookingDetails?.providerId || 'default'}
                    serviceName={bookingDetails?.serviceName || 'Service'}
                    onBookingConfirmed={() => { }}
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
