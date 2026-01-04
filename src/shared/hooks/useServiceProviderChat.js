/**
 * useServiceProviderChat Hook
 *
 * Simplified customer-facing chat hook for service provider pages.
 * Based on useBoardRoom but streamlined for single-agent interactions.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/features/auth/context/AuthContext";
import { CONCIERGE_AGENT } from '@/features/agents/services/registry/ConciergeAgent';
import { getAgentReply } from '@/features/agents/services/AgentBrain';
import { enhanceAgentPrompt, extractBookingIntent } from '@/features/agents/services/CustomerSupportContext';
import { realSupabase as supabase } from '@/api/supabaseClient';

/**
 * Custom hook for customer-facing service provider chat
 * @param {Object} provider - Service provider data
 * @returns {Object} Chat state and methods
 */
export function useServiceProviderChat(provider) {
  const { user } = useAuth();
  const { toast } = useToast();

  // Core state
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [typingAgent, setTypingAgent] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [meetingId, setMeetingId] = useState(null);
  const [sessionId, setSessionId] = useState(null);

  // Refs
  const messagesEndRef = useRef(null);
  const realtimeChannelRef = useRef(null);

  // Generate or retrieve session ID
  useEffect(() => {
    if (!provider) return;

    // Generate session ID based on provider and timestamp
    const storedSessionId = sessionStorage.getItem(`chat_session_${provider.id}`);

    if (storedSessionId) {
      setSessionId(storedSessionId);
    } else {
      const newSessionId = `provider_${provider.id}_${Date.now()}`;
      sessionStorage.setItem(`chat_session_${provider.id}`, newSessionId);
      setSessionId(newSessionId);
    }
  }, [provider]);

  // Initialize meeting (ephemeral by default)
  useEffect(() => {
    if (!sessionId || !provider) return;

    const initializeMeeting = async () => {
      setIsLoading(true);

      try {
        // Create ephemeral meeting for this chat session
        const meetingTitle = `Customer chat: ${provider.business_name}`;

        const { data: meeting, error } = await supabase
          .from('board_meetings')
          .insert([{
            title: meetingTitle,
            status: 'active'
          }])
          .select()
          .single();

        if (error) {
          console.error('Failed to create meeting:', error);
          toast({
            title: "Connection Error",
            description: "Unable to start chat. Please try again.",
            variant: "destructive"
          });
          return;
        }

        setMeetingId(meeting.id);

        // Add welcome message from Concierge
        const businessName = provider?.business_name || 'this business';
        const welcomeMessage = {
          meeting_id: meeting.id,
          agent_id: CONCIERGE_AGENT.id,
          content: `👋 Welcome! I'm here to help you learn more about ${businessName}. Feel free to ask me anything about their services, hours, or how to book!`,
          type: 'text',
          created_at: new Date().toISOString()
        };

        const { data: msgData } = await supabase
          .from('board_messages')
          .insert([welcomeMessage])
          .select()
          .single();

        if (msgData) {
          setMessages([msgData]);
        }

      } catch (error) {
        console.error('Meeting initialization error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeMeeting();
  }, [sessionId, provider, toast]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!meetingId) return;

    const channel = supabase
      .channel(`customer_chat:${meetingId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'board_messages',
        filter: `meeting_id=eq.${meetingId}`
      }, (payload) => {
        setMessages(prev => {
          // Avoid duplicates
          if (prev.some(msg => msg.id === payload.new.id)) {
            return prev;
          }
          return [...prev, payload.new];
        });
        setTypingAgent(null);
      })
      .subscribe();

    realtimeChannelRef.current = channel;

    return () => {
      if (realtimeChannelRef.current) {
        supabase.removeChannel(realtimeChannelRef.current);
      }
    };
  }, [meetingId]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /**
   * Send user message
   */
  const handleSendMessage = useCallback(async () => {
    if (!input.trim() && !selectedImage) return;
    if (!meetingId) {
      toast({
        title: "Not Ready",
        description: "Chat is still initializing. Please wait...",
        variant: "destructive"
      });
      return;
    }

    const messageContent = input.trim();
    setInput('');
    setSelectedImage(null);

    // Insert user message
    const userMessage = {
      meeting_id: meetingId,
      agent_id: 'HUMAN_USER',
      content: messageContent,
      type: 'text'
    };

    try {
      await supabase
        .from('board_messages')
        .insert([userMessage]);

      // Trigger agent response
      await triggerAgentReply(messageContent);

    } catch (error) {
      console.error('Failed to send message:', error);
      toast({
        title: "Message Failed",
        description: "Unable to send message. Please try again.",
        variant: "destructive"
      });
    }
  }, [input, selectedImage, meetingId, toast]);

  /**
   * Trigger agent reply
   */
  const triggerAgentReply = useCallback(async (userMessage) => {
    if (!meetingId || !provider) return;

    setTypingAgent(CONCIERGE_AGENT);

    try {
      // Enhance agent with provider context
      const enhancedAgent = enhanceAgentPrompt(CONCIERGE_AGENT, provider);

      // Check for booking intent
      const hasBookingIntent = extractBookingIntent(userMessage);

      // Build context for agent
      const context = {
        meetingTitle: `Customer support for ${provider.business_name}`,
        images: selectedImage ? [{ base64: selectedImage, mimeType: 'image/png' }] : [],
        hasBookingIntent,
        providerData: {
          id: provider.id,
          name: provider.business_name,
          category: provider.category
        }
      };

      // Get agent reply
      const response = await getAgentReply(enhancedAgent, messages, context);

      // Handle booking intent
      if (hasBookingIntent && response.message) {
        // Add booking action marker
        response.message += `\n\n[BOOK_NOW:${provider.id}]`;
      }

      // Insert agent message
      await supabase
        .from('board_messages')
        .insert([{
          meeting_id: meetingId,
          agent_id: CONCIERGE_AGENT.id,
          content: response.message,
          type: 'text'
        }]);

    } catch (error) {
      console.error('Agent reply error:', error);

      // Insert error message
      await supabase
        .from('board_messages')
        .insert([{
          meeting_id: meetingId,
          agent_id: 'SYSTEM',
          content: '❌ Sorry, I encountered an error. Please try again or contact support directly.',
          type: 'system'
        }]);

      toast({
        title: "Response Error",
        description: "The assistant encountered an issue. Please try again.",
        variant: "destructive"
      });
    } finally {
      setTypingAgent(null);
    }
  }, [meetingId, provider, messages, selectedImage, toast]);

  /**
   * Handle image selection
   */
  const handleImageSelect = useCallback((file) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result.split(',')[1];
      setSelectedImage(base64);
    };
    reader.readAsDataURL(file);
  }, []);

  /**
   * Clear selected image
   */
  const clearImage = useCallback(() => {
    setSelectedImage(null);
  }, []);

  /**
   * Clear chat history
   */
  const clearChat = useCallback(async () => {
    if (!meetingId) return;

    try {
      // Delete messages
      await supabase
        .from('board_messages')
        .delete()
        .eq('meeting_id', meetingId);

      // Delete meeting
      await supabase
        .from('board_meetings')
        .delete()
        .eq('id', meetingId);

      // Clear session
      if (provider) {
        sessionStorage.removeItem(`chat_session_${provider.id}`);
      }

      // Reset state
      setMessages([]);
      setMeetingId(null);
      setSessionId(null);

      toast({
        title: "Chat Cleared",
        description: "Your conversation has been cleared."
      });

    } catch (error) {
      console.error('Failed to clear chat:', error);
      toast({
        title: "Clear Failed",
        description: "Unable to clear chat. Please refresh the page.",
        variant: "destructive"
      });
    }
  }, [meetingId, provider, toast]);

  return {
    // State
    messages,
    input,
    setInput,
    isLoading,
    typingAgent,
    selectedImage,
    provider,

    // Methods
    handleSendMessage,
    handleImageSelect,
    clearImage,
    clearChat,

    // Refs
    messagesEndRef
  };
}
