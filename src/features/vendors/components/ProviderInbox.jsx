import React, { useState, useEffect, useCallback } from 'react';
import { useBoardRoom } from '@/shared/hooks/useBoardRoom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/shared/lib/utils';
import {
  MessageSquare, Calendar, CheckCircle2, XCircle,
  Clock, User, AlertCircle, Loader2
} from 'lucide-react';
import BoardRoomMessageList from '@/pages/board/BoardRoomMessageList';
import BoardRoomInput from '@/pages/board/BoardRoomInput';
import { formatDistanceToNow, format } from 'date-fns';
import { BookingService } from '@/services/BookingService';
import { toast } from 'sonner';
import { realSupabase } from '@/api/supabaseClient';

// ── Pending Bookings Panel ────────────────────────────────────────────────

function PendingBookingsPanel({ providerId, onUpdate }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null); // which booking is being actioned

  const load = useCallback(async () => {
    if (!providerId) return;
    setLoading(true);
    try {
      const all = await BookingService.getProviderBookings(providerId);
      setBookings((all || []).filter(b => b.status === 'pending'));
    } catch (err) {
      console.error('ProviderInbox: load bookings failed', err);
    } finally {
      setLoading(false);
    }
  }, [providerId]);

  useEffect(() => { load(); }, [load]);

  const handleAction = async (bookingId, action) => {
    setActionId(bookingId);
    const newStatus = action === 'confirm' ? 'confirmed' : 'cancelled';
    try {
      await BookingService.updateBookingStatus(bookingId, newStatus);

      // Write signal so autonomous agents observe the decision
      try {
        await realSupabase.rpc('write_signal', {
          p_event_type: action === 'confirm' ? 'booking.confirmed' : 'booking.rejected',
          p_entity_type: 'booking',
          p_entity_id: bookingId,
          p_source: 'provider-inbox',
          p_data: { provider_id: providerId, new_status: newStatus }
        });
      } catch (_) { /* signal failure never blocks the action */ }

      toast.success(action === 'confirm' ? 'Booking confirmed!' : 'Booking declined.');
      await load();
      onUpdate?.();
    } catch (err) {
      toast.error(`Failed: ${err.message}`);
    } finally {
      setActionId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 p-4 text-slate-400 text-sm border-b">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading bookings…
      </div>
    );
  }

  if (bookings.length === 0) return null; // hide when empty — don't clutter UI

  return (
    <div className="border-b bg-amber-50">
      <div className="px-4 py-2 flex items-center gap-2">
        <AlertCircle className="w-4 h-4 text-amber-600" />
        <span className="text-sm font-semibold text-amber-800">
          {bookings.length} pending booking{bookings.length > 1 ? 's' : ''} need your response
        </span>
      </div>
      <ScrollArea className="max-h-52">
        <div className="flex flex-col gap-2 px-4 pb-3">
          {bookings.map(booking => (
            <div
              key={booking.id}
              className="bg-white rounded-lg border border-amber-200 p-3 flex flex-col gap-2 shadow-sm"
            >
              {/* Booking details */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-800">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">
                      {booking.service_type || 'Booking'} —{' '}
                      {booking.service_date
                        ? format(new Date(booking.service_date), 'd MMM yyyy')
                        : 'Date TBD'}
                      {booking.start_time ? ` at ${booking.start_time.slice(0, 5)}` : ''}
                    </span>
                  </div>
                  {booking.profiles?.full_name && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                      <User className="w-3 h-3" />
                      {booking.profiles.full_name}
                      {booking.profiles.email && ` · ${booking.profiles.email}`}
                    </div>
                  )}
                </div>
                <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[10px] shrink-0">
                  <Clock className="w-3 h-3 mr-1" />
                  {formatDistanceToNow(new Date(booking.created_at), { addSuffix: true })}
                </Badge>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1 h-8 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium"
                  onClick={() => handleAction(booking.id, 'confirm')}
                  disabled={actionId === booking.id}
                >
                  {actionId === booking.id
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <><CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Confirm</>}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 h-8 border-red-200 text-red-600 hover:bg-red-50 text-xs font-medium"
                  onClick={() => handleAction(booking.id, 'reject')}
                  disabled={actionId === booking.id}
                >
                  <XCircle className="w-3.5 h-3.5 mr-1" /> Decline
                </Button>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

// ── ProviderInbox ────────────────────────────────────────────────────────────

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

  // Handles booking action cards embedded inside chat messages
  const handleBookingRequest = useCallback(async (bookingData) => {
    if (!bookingData?.bookingId && !bookingData?.id) {
      console.warn('ProviderInbox: handleBookingRequest received no bookingId', bookingData);
      return;
    }
    const bookingId = bookingData.bookingId || bookingData.id;
    const action = bookingData.action || 'confirm';
    const newStatus = action === 'confirm' ? 'confirmed' : 'cancelled';

    try {
      await BookingService.updateBookingStatus(bookingId, newStatus);
      try {
        await realSupabase.rpc('write_signal', {
          p_event_type: action === 'confirm' ? 'booking.confirmed' : 'booking.rejected',
          p_entity_type: 'booking',
          p_entity_id: bookingId,
          p_source: 'provider-inbox-chat',
          p_data: { provider_id: providerId, new_status: newStatus }
        });
      } catch (_) {}
      toast.success(action === 'confirm' ? 'Booking confirmed!' : 'Booking declined.');
    } catch (err) {
      toast.error(`Action failed: ${err.message}`);
    }
  }, [providerId]);

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
                  {meeting.created_at
                    ? formatDistanceToNow(new Date(meeting.created_at), { addSuffix: true })
                    : 'Just now'}
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main Area */}
      <div className="flex-1 flex flex-col bg-white min-w-0">
        {/* Pending bookings banner — shows at top when there are requests */}
        <PendingBookingsPanel providerId={providerId} />

        {selectedMeeting ? (
          <>
            {/* Header */}
            <div className="p-4 border-b flex justify-between items-center shrink-0">
              <div>
                <h2 className="font-semibold">{selectedMeeting.title}</h2>
                <p className="text-xs text-slate-500">
                  ID: {selectedMeeting.id.slice(0, 8)}…
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
            <div className="p-4 border-t bg-slate-50 shrink-0">
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
