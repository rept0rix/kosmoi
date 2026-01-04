/**
 * ServiceProviderChat Component
 *
 * Main customer-facing chat component for service provider pages.
 * Integrates BoardRoom agent system with provider-specific context.
 */

import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Image as ImageIcon, X, Trash2 } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useServiceProviderChat } from '@/shared/hooks/useServiceProviderChat';
import CustomerMessageList from './CustomerMessageList';

/**
 * @param {Object} provider - Service provider data
 * @param {string} variant - Layout variant ('embedded' | 'modal')
 * @param {Function} onBookingRequest - Callback when user clicks book button
 */
export default function ServiceProviderChat({
  provider,
  variant = 'embedded',
  onBookingRequest,
  className = ''
}) {
  const fileInputRef = useRef(null);

  const {
    messages,
    input,
    setInput,
    isLoading,
    typingAgent,
    selectedImage,
    handleSendMessage,
    handleImageSelect,
    clearImage,
    clearChat,
    messagesEndRef
  } = useServiceProviderChat(provider);

  /**
   * Handle image upload
   */
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleImageSelect(file);
    }
  };

  /**
   * Handle send (Enter key or button click)
   */
  const handleSend = () => {
    if (!input.trim() && !selectedImage) return;
    handleSendMessage();
  };

  /**
   * Handle call request from message actions
   */
  const handleCallRequest = (phone) => {
    if (phone) {
      window.location.href = `tel:${phone}`;
    }
  };

  /**
   * Handle map request from message actions
   */
  const handleMapRequest = () => {
    // Scroll to map section if on same page
    const mapElement = document.querySelector('[data-map-section]');
    if (mapElement) {
      mapElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const heightClass = variant === 'modal' ? 'h-full' : 'h-[500px]';

  return (
    <div className={`flex flex-col ${heightClass} ${className} bg-gradient-to-br from-white/80 to-white/60 dark:from-slate-900/80 dark:to-slate-800/60 backdrop-blur-xl rounded-xl border border-white/20 shadow-glass overflow-hidden`}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between p-4 border-b border-white/10 bg-gradient-to-r from-blue-500/10 to-indigo-500/10"
      >
        <div className="flex flex-col">
          <h3 className="font-semibold text-lg">Chat with Support</h3>
          <p className="text-xs text-muted-foreground">
            {provider?.business_name || 'Loading...'}
          </p>
        </div>

        {messages.length > 1 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearChat}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </motion.div>

      {/* Messages */}
      <div className="flex-1 overflow-hidden">
        {isLoading && messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"
            />
          </div>
        ) : (
          <CustomerMessageList
            messages={messages}
            typingAgent={typingAgent}
            messagesEndRef={messagesEndRef}
            onBookingRequest={onBookingRequest}
            onCallRequest={handleCallRequest}
            onMapRequest={handleMapRequest}
          />
        )}
      </div>

      {/* Input area */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 border-t border-white/10 bg-white/5 backdrop-blur-md"
      >
        <div className="flex gap-2">
          <Input
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            disabled={isLoading || !provider}
            className="flex-1 shadow-inner border-white/10 focus:border-primary/50 focus:ring-primary/20 bg-white/10 backdrop-blur-sm"
          />

          {/* Image upload button */}
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleImageUpload}
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading || !provider}
            className={selectedImage ? "text-primary border-primary/20 bg-primary/10" : ""}
          >
            <ImageIcon className="w-4 h-4" />
          </Button>

          {/* Send button */}
          <Button
            onClick={handleSend}
            disabled={(!input.trim() && !selectedImage) || isLoading || !provider}
            className="px-6 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>

        {/* Image preview */}
        <AnimatePresence>
          {selectedImage && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-2 flex items-center gap-2"
            >
              <div className="relative group">
                <img
                  src={`data:image/png;base64,${selectedImage}`}
                  alt="Preview"
                  className="h-16 w-16 object-cover rounded-lg border border-white/10"
                />
                <button
                  onClick={clearImage}
                  className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
              <span className="text-xs text-muted-foreground">Image attached</span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Footer hint */}
      <div className="px-4 py-2 text-center">
        <p className="text-[10px] text-muted-foreground">
          Powered by AI • Responses may vary
        </p>
      </div>
    </div>
  );
}
