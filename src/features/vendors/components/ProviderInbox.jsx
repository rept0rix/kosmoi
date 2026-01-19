import React from 'react';
import { useBoardRoom } from '@/shared/hooks/useBoardRoom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/shared/lib/utils';
import { MessageSquare, Calendar } from 'lucide-react';
import BoardRoomMessageList from '@/pages/board/BoardRoomMessageList';
import BoardRoomInput from '@/pages/board/BoardRoomInput';
import { formatDistanceToNow } from 'date-fns';

export function ProviderInbox({ providerId }) {
    const {
        meetings,
        selectedMeeting,
        setSelectedMeeting,
        messages,
        input,
        setInput,
        handleSendMessage,
        typingAgent,
        boardAgents,
        messagesEndRef,
        selectedImage,
        setSelectedImage,
        isRTL
    } = useBoardRoom({ providerId });

    const handleBookingRequest = (bookingData) => {
        console.log("Booking requested", bookingData);
        // TODO: Implement booking request handling logic
    };

    return (
        <div className="flex h-[600px] border rounded-xl overflow-hidden bg-white shadow-sm">
            {/* Sidebar: Conversation List */}
            <div className="w-80 border-r bg-slate-50 flex flex-col">
                <div className="p-4 border-b bg-white">
                    <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" /> Inbox
                    </h3>
                </div>
                <ScrollArea className="flex-1">
                    <div className="flex flex-col gap-1 p-2">
                        {meetings.length === 0 && (
                            <div className="p-4 text-center text-slate-400 text-sm">
                                No conversations yet.
                            </div>
                        )}
                        {meetings.map(meeting => (
                            <button
                                key={meeting.id}
                                onClick={() => setSelectedMeeting(meeting)}
                                className={cn(
                                    "text-left p-3 rounded-lg text-sm transition-colors",
                                    selectedMeeting?.id === meeting.id
                                        ? "bg-blue-100/50 text-blue-700 border border-blue-200"
                                        : "hover:bg-white hover:shadow-sm border border-transparent"
                                )}
                            >
                                <div className="font-medium truncate">{meeting.title || "Untitled Conversation"}</div>
                                <div className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                                    <Calendar className="w-3 h-3" />
                                    {meeting.created_at ? formatDistanceToNow(new Date(meeting.created_at), { addSuffix: true }) : 'Just now'}
                                </div>
                            </button>
                        ))}
                    </div>
                </ScrollArea>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col bg-white">
                {selectedMeeting ? (
                    <>
                        {/* Header */}
                        <div className="p-4 border-b flex justify-between items-center">
                            <div>
                                <h2 className="font-semibold">{selectedMeeting.title}</h2>
                                <p className="text-xs text-slate-500">
                                    ID: {selectedMeeting.id.slice(0, 8)}...
                                </p>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-hidden relative">
                            <BoardRoomMessageList
                                messages={messages}
                                typingAgent={typingAgent}
                                boardAgents={boardAgents}
                                isRTL={isRTL}
                                messagesEndRef={messagesEndRef}
                                className="h-full"
                                onBookingRequest={handleBookingRequest}
                            />
                        </div>

                        {/* Input */}
                        <div className="p-4 border-t bg-slate-50">
                            <BoardRoomInput
                                input={input}
                                setInput={setInput}
                                onSend={handleSendMessage}
                                isRTL={isRTL}
                                selectedImage={selectedImage}
                                setSelectedImage={setSelectedImage}
                                className="max-w-full"
                            />
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                        <MessageSquare className="w-12 h-12 mb-4 opacity-20" />
                        <p>Select a conversation to start chatting.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
