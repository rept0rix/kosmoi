/**
 * CustomerMessageList Component
 *
 * Simplified message rendering for customer-facing chat.
 * Based on BoardRoomMessageList but streamlined for customer support.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Users, Bot, Calendar, Phone, MapPin } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function CustomerMessageList({
  messages,
  typingAgent,
  messagesEndRef,
  onBookingRequest,
  onCallRequest,
  onMapRequest,
  className
}) {

  /**
   * Render typing indicator
   */
  const renderTypingIndicator = () => {
    if (!typingAgent) return null;

    return (
      <div className="flex gap-3 items-center">
        <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-gradient-to-br from-gray-100 to-gray-200 border border-white shadow-sm">
          <Bot className="w-4 h-4 text-gray-600" />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 p-4 rounded-2xl rounded-tl-none bg-card/40 backdrop-blur-md border border-white/10"
        >
          <div className="flex gap-1">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 1, delay: 0 }}
              className="w-2 h-2 bg-blue-500 rounded-full"
            />
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
              className="w-2 h-2 bg-blue-500 rounded-full"
            />
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
              className="w-2 h-2 bg-blue-500 rounded-full"
            />
          </div>
          <span className="text-sm text-muted-foreground">Support is typing...</span>
        </motion.div>
      </div>
    );
  };

  /**
   * Extract action buttons from message content
   */
  const extractActions = (content) => {
    const actions = [];

    // Check for [BOOK_NOW:providerId]
    const bookNowMatch = content.match(/\[BOOK_NOW:([^\]]+)\]/);
    if (bookNowMatch) {
      actions.push({
        type: 'book',
        providerId: bookNowMatch[1],
        label: 'Book Now',
        icon: Calendar
      });
    }

    // Check for [CALL:phone]
    const callMatch = content.match(/\[CALL:([^\]]+)\]/);
    if (callMatch) {
      actions.push({
        type: 'call',
        phone: callMatch[1],
        label: 'Call Now',
        icon: Phone
      });
    }

    // Check for [SHOW_MAP]
    if (content.includes('[SHOW_MAP]')) {
      actions.push({
        type: 'map',
        label: 'View on Map',
        icon: MapPin
      });
    }

    return actions;
  };

  /**
   * Remove action markers from content
   */
  const cleanContent = (content) => {
    return content
      .replace(/\[BOOK_NOW:[^\]]+\]/g, '')
      .replace(/\[CALL:[^\]]+\]/g, '')
      .replace(/\[SHOW_MAP\]/g, '')
      .trim();
  };

  /**
   * Handle action button click
   */
  const handleActionClick = (action) => {
    switch (action.type) {
      case 'book':
        onBookingRequest?.(action.providerId);
        break;
      case 'call':
        onCallRequest?.(action.phone);
        break;
      case 'map':
        onMapRequest?.();
        break;
      default:
        console.warn('Unknown action type:', action.type);
    }
  };

  return (
    <ScrollArea className={`flex-1 ${className || ''}`}>
      <div className="space-y-4 p-4">
        {messages.map((msg) => {
          const isUser = msg.agent_id === 'HUMAN_USER';
          const isSystem = msg.agent_id === 'SYSTEM' || msg.type === 'system';

          // Skip hidden/directive messages
          if (msg.type === 'system_hidden' || msg.content.includes('[DIRECTIVE]')) {
            return null;
          }

          // Extract actions from message
          const actions = extractActions(msg.content);
          const cleanedContent = cleanContent(msg.content);

          return (
            <motion.div
              key={msg.id || msg.created_at}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
            >
              {/* Avatar */}
              {!isSystem && (
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm border border-white ${
                  isUser
                    ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white'
                    : 'bg-gradient-to-br from-gray-100 to-gray-200 text-gray-600'
                }`}>
                  {isUser ? <Users className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>
              )}

              {/* Message bubble */}
              <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} ${isSystem ? 'w-full' : 'max-w-[80%]'}`}>
                {/* Header */}
                {!isSystem && (
                  <div className="flex items-center gap-2 mb-1 px-1">
                    <span className="text-sm font-semibold text-foreground/80">
                      {isUser ? 'You' : 'Support'}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(msg.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                )}

                {/* Content */}
                {isSystem ? (
                  // System message (centered, minimal)
                  <div className="w-full flex justify-center">
                    <div className="px-3 py-1 rounded-full bg-muted/50 text-muted-foreground text-xs">
                      {cleanedContent}
                    </div>
                  </div>
                ) : (
                  <div
                    className={`p-4 rounded-2xl text-base shadow-glass backdrop-blur-md leading-relaxed ${
                      isUser
                        ? 'bg-primary text-primary-foreground rounded-tr-none'
                        : 'bg-card/40 border border-white/10 text-card-foreground rounded-tl-none'
                    }`}
                  >
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        img: ({ node, ...props }) => (
                          <img
                            {...props}
                            className="max-w-full h-auto rounded-lg shadow-md my-2 border border-white/10"
                            alt={props.alt || 'Image'}
                          />
                        ),
                        code({ node, className, children, ...props }) {
                          const match = /language-(\w+)/.exec(className || '');
                          return match ? (
                            <pre className="p-2 rounded-md bg-black/50 text-white overflow-x-auto text-xs border border-white/10 my-2">
                              <code className={className} {...props}>
                                {children}
                              </code>
                            </pre>
                          ) : (
                            <code
                              className="px-1 py-0.5 rounded bg-black/20 text-sm font-mono"
                              {...props}
                            >
                              {children}
                            </code>
                          );
                        },
                        a: ({ node, ...props }) => (
                          <a
                            {...props}
                            className="underline hover:text-blue-400 transition-colors"
                            target="_blank"
                            rel="noopener noreferrer"
                          />
                        )
                      }}
                    >
                      {cleanedContent}
                    </ReactMarkdown>

                    {/* Action buttons */}
                    {actions.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-white/10 flex flex-wrap gap-2">
                        {actions.map((action, idx) => {
                          const Icon = action.icon;
                          return (
                            <Button
                              key={idx}
                              onClick={() => handleActionClick(action)}
                              size="sm"
                              className="gap-2"
                              variant={action.type === 'book' ? 'default' : 'outline'}
                            >
                              <Icon className="w-4 h-4" />
                              {action.label}
                            </Button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}

        {/* Typing indicator */}
        {renderTypingIndicator()}

        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>
    </ScrollArea>
  );
}
