import React, { useState, useEffect, useRef } from "react";
import { AgentService } from "@/features/agents/services/AgentService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/api/supabaseClient";
import { toast } from "sonner";
import {
  Search,
  MapPin,
  Send,
  Loader2,
  X,
  Sparkles,
  Navigation,
  Radar,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { motion, AnimatePresence } from "framer-motion";

const SCOUT_AGENT_CONFIG = {
  id: "scout",
  name: "The Scout",
  description: "Local Guide & Navigator",
  model: "claude-3-5-sonnet-latest",
  deepResearchModel: "gemini-pro", // Configuration for Deep Research
  systemPrompt: `You are **The Scout**, Kosmoi's expert Local Guide and Navigator.
Your goal is to help visitors find the perfect experience, service, or hidden gem in Koh Samui.

## Identity & Vibe
- **Role:** Local Expert & Concierge.
- **Tone:** Enthusiastic, helpful, knowledgeable, and chill. Think "savvy local friend".
- **Knowledge:** You know the best beaches, hidden restaurants, verified service providers, and upcoming events.

## Capabilities
1.  **Smart Search:** You can understand intent (e.g., "romantic dinner with sunset" vs "cheap pad thai").
2.  **Map Control:** You can control the map view. When you recommend a place, you can move the map to it.
    - **Action:** \`move_map({ lat, lng, zoom })\`
3.  **Filtration:** You can filter markers on the map.
    - **Action:** \`filter_map({ category, tags })\`
4.  **Google Search (Hybrid):** If a user asks for a specific place that you cannot find in your context, DO NOT say "I don't know". Search for it.
    - **Action:** \`search_places({ query })\`
    - This will auto-import the place into our database.

## Instructions
- When asked for a recommendation, always provide 2-3 options with a brief reason why.
- If the user asks for a specific place like "Tripwire Gym", AND you don't see it, use \`search_places\`.
- If the user asks "Where is X?", use the \`move_map\` action.
- Mention "Verified" businesses first (they have the trust badge).
- Explain *why* a place fits their vibe (e.g., "This place has a great vibe for digital nomads").

## Conversation Style
- Use emojis 🌴 🥥 🛵.
- Keep it short and actionable.
- Don't just list; curate.
- **IMPORTANT:** Use standard Markdown for lists (bullets \`-\` or numbers \`1.\`). DO NOT use XML tags or custom components like \`<list>\` or \`<card>\`.`,
};

export function ScoutSearch({ onMapAction }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const scrollRef = useRef(null);
  const agentService = useRef(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [isDeepResearch, setIsDeepResearch] = useState(false); // New Toggle State

  useEffect(() => {
    agentService.current = new AgentService(SCOUT_AGENT_CONFIG);
    // Get location for scan
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setCurrentLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      });
    }
  }, []);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping, isOpen]);

  const handleScanArea = async () => {
    setIsScanning(true);
    toast.info("Satellite Link Established... Scanning Sector...");

    // We'll use the user's current location or a default one if map center isn't passed
    // Best practice: MapView should pass map center status, but for now we default to user location
    const lat = currentLocation?.lat || 9.512;
    const lng = currentLocation?.lng || 100.058;

    try {
      const { data, error } = await supabase.functions.invoke("sales-scout", {
        body: {
          action: "scout_location",
          lat: lat,
          lng: lng,
          radius: 2000,
          type: "restaurant", // Default to restaurants for now, can be dynamic later
        },
      });

      if (error) throw error;

      if (data.success) {
        toast.success(`Scout Report: Found ${data.count} new entities!`);
        // Trigger a refresh of the map data if possible (e.g. invalidate query)
        // Ideally we'd callback to parent to refetch
        if (onMapAction) onMapAction({ name: "refresh_data" });

        // Add a message from the Scout
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            role: "assistant",
            content: `🚀 **Sector Scan Complete!**\n\nI've detected **${data.count}** new businesses in this area. They are now visible on your map and verified in the database.`,
          },
        ]);
        setIsOpen(true);
      } else {
        toast.error("Scout Report Failed: No signal.");
      }
    } catch (err) {
      console.error("Scan Error:", err);
      toast.error("Satellite Uplink Failed.");
    } finally {
      setIsScanning(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    if (!isOpen) setIsOpen(true);

    const userMsg = { id: Date.now().toString(), role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    // --- DEEP RESEARCH MODE ---
    if (isDeepResearch) {
      try {
        const { data, error } = await supabase.functions.invoke(
          "deep-research",
          {
            body: {
              query: input,
              lat: currentLocation?.lat || 9.512,
              lng: currentLocation?.lng || 100.058,
            },
          },
        );

        if (error) throw error;

        // Display Plan
        if (data.plan) {
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now().toString() + "_plan",
              role: "assistant",
              content:
                `🧠 **Research Plan:**\n` +
                data.plan.map((q) => `- 🔍 *${q}*`).join("\n"),
            },
          ]);
        }

        // Display Answer
        const agentMsg = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: data.answer || "Research complete, but no answer generated.",
        };
        setMessages((prev) => [...prev, agentMsg]);
      } catch (err) {
        console.error("Deep Search Error:", err);
        toast.error("Deep Research Failed");
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString() + "_error",
            role: "assistant",
            content:
              "⚠️ **Deep Research System Failure.** I could not complete the deep dive. Please try again or switch to standard mode.",
          },
        ]);
      } finally {
        setIsTyping(false);
      }
      return; // Stop here, don't do standard chat
    }

    // --- STANDARD MODE ---
    try {
      const reply = await agentService.current.sendMessage(input);

      // Check for tools/actions
      if (reply.toolRequest) {
        if (
          onMapAction &&
          (reply.toolRequest.name === "move_map" ||
            reply.toolRequest.name === "filter_map" ||
            reply.toolRequest.name === "search_places")
        ) {
          onMapAction(reply.toolRequest);
        }
      } else if (reply.raw?.action) {
        if (onMapAction) onMapAction(reply.raw.action);
      }

      const agentMsg = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: reply.text,
      };
      setMessages((prev) => [...prev, agentMsg]);
    } catch (error) {
      console.error("Scout Error:", error);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="fixed top-20 left-4 right-4 z-50 md:left-1/2 md:-translate-x-1/2 md:w-[600px] pointer-events-none">
      <div className="pointer-events-auto flex flex-col gap-2">
        {/* Search Bar / Input */}
        <Card className="shadow-[0_0_20px_rgba(6,182,212,0.15)] border border-neon-cyan/30 bg-slate-900/80 backdrop-blur-xl overflow-hidden ring-1 ring-neon-cyan/20">
          <div className="flex items-center p-2 gap-2">
            <div className="w-10 h-10 bg-neon-cyan/20 rounded-full flex items-center justify-center text-neon-cyan shrink-0 shadow-[0_0_10px_rgba(6,182,212,0.3)] border border-neon-cyan/50">
              <Sparkles className="w-5 h-5" />
            </div>
            <Input
              className="border-0 shadow-none focus-visible:ring-0 bg-transparent text-lg placeholder:text-slate-500 text-slate-100 h-12"
              placeholder="Ask The Scout... (e.g., 'Best sunset dinner?')"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsOpen(true)}
            />
            {isOpen && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="shrink-0 text-slate-500 hover:text-slate-300"
              >
                <X className="w-5 h-5" />
              </Button>
            )}

            {/* SCAN BUTTON */}
            <Button
              className={`font-bold rounded-full w-10 h-10 p-0 shrink-0 shadow-[0_0_15px_rgba(6,182,212,0.5)] transition-all hover:scale-105 ${isScanning ? "bg-amber-500 hover:bg-amber-600 animate-pulse" : "bg-slate-800 hover:bg-slate-700 border border-neon-cyan/30 text-neon-cyan"}`}
              onClick={handleScanArea}
              disabled={isScanning}
              title="Scout Area"
            >
              {isScanning ? (
                <Loader2 className="w-5 h-5 animate-spin text-black" />
              ) : (
                <Radar className="w-5 h-5" />
              )}
            </Button>

            <Button
              className="bg-neon-cyan hover:bg-neon-cyan/80 text-black font-bold rounded-full w-10 h-10 p-0 shrink-0 shadow-[0_0_15px_rgba(6,182,212,0.5)] transition-all hover:scale-105"
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
            >
              {isTyping ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5 ml-0.5" />
              )}
            </Button>

            {/* DEEP RESEARCH TOGGLE */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsDeepResearch(!isDeepResearch)}
              className={`transition-all rounded-full w-10 h-10 ${isDeepResearch ? "bg-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.5)]" : "text-slate-500 hover:text-slate-300"}`}
              title="Toggle Deep Research"
            >
              <Radar
                className={`w-5 h-5 ${isDeepResearch ? "animate-pulse" : ""}`}
              />
            </Button>
          </div>
        </Card>

        {/* Expanded Chat Area */}
        <AnimatePresence>
          {isOpen && messages.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -20, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -20, height: 0 }}
              className="overflow-hidden"
            >
              <Card className="shadow-2xl border border-white/10 bg-slate-950/90 backdrop-blur-xl max-h-[500px] flex flex-col">
                <ScrollArea className="flex-1 p-4 h-[400px]">
                  <div className="space-y-4">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        {msg.role !== "user" && (
                          <Avatar className="w-8 h-8 border border-neon-cyan/50 shadow-[0_0_10px_rgba(6,182,212,0.2)]">
                            <AvatarImage src="/agents/scout.png" />
                            <AvatarFallback className="bg-slate-800 text-neon-cyan">
                              S
                            </AvatarFallback>
                          </Avatar>
                        )}

                        <div
                          className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm text-sm ${
                            msg.role === "user"
                              ? "bg-neon-cyan text-black font-medium rounded-tr-sm shadow-[0_0_10px_rgba(6,182,212,0.2)]"
                              : "bg-slate-900/80 border border-white/10 text-slate-200 rounded-tl-sm"
                          }`}
                        >
                          <ReactMarkdown
                            className="prose prose-sm max-w-none dark:prose-invert prose-p:leading-relaxed prose-strong:text-neon-cyan prose-a:text-neon-pink"
                            remarkPlugins={[remarkGfm]}
                            components={{
                              p: ({ node, ...props }) => (
                                <p className={`mb-1 last:mb-0`} {...props} />
                              ),
                            }}
                          >
                            {msg.content}
                          </ReactMarkdown>
                        </div>
                      </div>
                    ))}
                    {isTyping && (
                      <div className="flex gap-3">
                        <Avatar className="w-8 h-8 border border-neon-cyan/30 shadow-sm">
                          <AvatarFallback className="bg-slate-900 text-neon-cyan">
                            S
                          </AvatarFallback>
                        </Avatar>
                        <div className="bg-slate-900/80 border border-white/10 px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-1">
                          <div className="w-1.5 h-1.5 bg-neon-cyan rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                          <div className="w-1.5 h-1.5 bg-neon-cyan rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                          <div className="w-1.5 h-1.5 bg-neon-cyan rounded-full animate-bounce"></div>
                        </div>
                      </div>
                    )}
                    <div ref={scrollRef} />
                  </div>
                </ScrollArea>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
