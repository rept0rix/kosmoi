import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, RotateCcw, Users, CheckCircle2, Circle, Info } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AgentDetailsDialog from './AgentDetailsDialog';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch"; // Import Switch
import { AgentService } from '@/features/agents/services/AgentService';
import { agents } from '@/features/agents/services/AgentRegistry';
import ReactMarkdown from 'react-markdown';
import CompanyStateDisplay from './CompanyStateDisplay'; // Import Display
import COMPANY_STATE from '@/data/company_state.json'; // Import Data

export default function GroupChatWindow({ userId }) {
    const [selectedAgents, setSelectedAgents] = useState([]);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');
    const scrollRef = useRef(null);
    const [agentServices, setAgentServices] = useState({});
    const [showContinueButton, setShowContinueButton] = useState(false);
    const [autonomousMode, setAutonomousMode] = useState(false);
    const [companyState, setCompanyState] = useState(COMPANY_STATE); // State for company data // New Autonomous Mode State
    const [viewingAgent, setViewingAgent] = useState(null); // For Agent Details Dialog

    console.log("DEBUG: companyState in GroupChatWindow:", companyState); // DEBUG LOG

    // ... (existing code)

    // In the UI render, add a toggle button near the "Start Meeting" button
    // (This is a simplified representation, I will need to find the exact location in the JSX)

    // Initialize services for all agents
    useEffect(() => {
        const services = {};
        agents.forEach(agent => {
            services[agent.id] = new AgentService(agent, { userId });
        });
        setAgentServices(services);
    }, [userId]);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const toggleAgentSelection = (agentId) => {
        setSelectedAgents(prev => {
            if (prev.includes(agentId)) {
                return prev.filter(id => id !== agentId);
            } else {
                return [...prev, agentId];
            }
        });
    };

    const handleSendMessage = async () => {
        if (!input.trim() || selectedAgents.length === 0) return;

        const userMsg = { role: 'user', content: input, timestamp: new Date() };
        setMessages(prev => [...prev, userMsg]);
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsProcessing(true);
        setShowContinueButton(false);

        await processAgentResponses(userMsg.content, 1);
    };

    const processAgentResponses = async (context, turn) => {
        // If it's the first turn, we treat the user's input as the "Goal" for this session.
        // In a real app, we might want a persistent goal state.
        const currentGoal = messages.length > 0 ? messages[0].content : context;

        try {
            // Initialize Orchestrator with selected agents
            // We filter the global 'agents' list to only include those selected by the user
            const activeAgents = agents.filter(a => selectedAgents.includes(a.id));

            if (activeAgents.length === 0) {
                setMessages(prev => [...prev, { role: 'system', content: 'No agents selected. Please select board members.' }]);
                setIsProcessing(false);
                return;
            }

            // We use a simplified Orchestrator here that doesn't persist across re-renders, 
            // but for a single "turn" of processing it's fine. 
            // Ideally, this should be a ref or state if we want it to persist longer.
            const { BoardOrchestrator } = await import('@/features/agents/services/BoardOrchestrator');
            const orchestrator = new BoardOrchestrator(activeAgents, { userId });

            let loopCount = 0;
            const MAX_LOOPS = 10; // Set to 10 for safety, can be continued
            let conversationActive = true;

            while (conversationActive && loopCount < MAX_LOOPS) {
                loopCount++;

                // 1. Ask Orchestrator who should speak next
                // We pass the *current* messages state + the new ones we've just added locally
                // Note: 'messages' state won't update inside this loop, so we need to track local history if we want true context.
                // However, for this implementation, we'll just read the latest 'messages' from state? 
                // No, state updates are async. We need to build a local chain.

                // Let's build a local history array that starts with current messages
                // We actually need to pass the *accumulated* history to the orchestrator.
                // Since we can't easily access the updated state in a loop, we'll rely on the fact that we are appending to the UI.
                // But for the logic, we need a local variable.

                // Hack: We'll re-read the messages from the DOM or just trust our local accumulation?
                // Better: Pass a local array 'sessionHistory' that we update.

                // Let's grab the latest messages from the state (this might be stale if we don't be careful, but we are in an async function)
                // Actually, we should pass the *accumulated* context.

                // Let's assume 'messages' is the history BEFORE this user input.
                // 'context' is the User's new input.

                // We'll construct a temporary history for the orchestrator
                // It includes all previous messages + the new user message + any agent messages generated in this loop.

                // Wait, 'messages' state is not updated yet with the user's message when this is called? 
                // Ah, handleSendMessage calls setMessages then processAgentResponses. 
                // React state update might not be reflected yet. 
                // Let's pass the full history including the new user message as an argument or build it.

                // Let's simplify: We will just pass the "context" (User Input) as the trigger, 
                // and the Orchestrator will see the previous history (we can pass 'messages' as a prop if we want, but let's just use the 'context' as the main driver for now).

                // Actually, let's do this right. 
                // We will maintain a `sessionMessages` array inside this function.
                const sessionMessages = [...messages, { role: 'user', content: context, timestamp: new Date() }];
                // (Note: 'messages' from closure might be stale if multiple sends happen fast, but for a single turn it's okay)

                // Add any messages generated in this loop so far
                // (We haven't generated any yet in the first iteration)

                // Notify UI: "Chairman is thinking..."
                setStatusMessage("Chairman is deciding who should speak next...");

                const decision = await orchestrator.getNextSpeaker(currentGoal, sessionMessages, autonomousMode, companyState);

                if (decision.nextSpeakerId === 'TERMINATE') {
                    console.log("Orchestrator decided to terminate.");
                    setStatusMessage("Discussion concluded.");
                    conversationActive = false;
                    break;
                }

                if (!decision.nextSpeakerId) {
                    console.warn("Orchestrator returned null. Stopping.");
                    setStatusMessage("Orchestrator stopped.");
                    break;
                }

                const nextAgentId = decision.nextSpeakerId;
                const instruction = decision.instruction;
                const reason = decision.reason;

                console.log(`Orchestrator selected ${nextAgentId} because: ${reason}`);
                setStatusMessage(`Calling ${nextAgentId}...`);

                // 2. Execute the selected agent
                const service = agentServices[nextAgentId];
                if (!service) {
                    console.error(`Service for ${nextAgentId} not found.`);
                    break;
                }

                await service.init();

                // We send the *instruction* from the orchestrator, not just the user context.
                // This gives the agent specific direction (e.g. "Answer the user's question about pricing").
                // We also include the original user context for reference.
                const agentPrompt = `
[Orchestrator Instruction]: ${instruction}
[Context]: The user said: "${context}"
`;
                // Append strict tool usage reminder
                const strictInstruction = `${agentPrompt}
            
SYSTEM REMINDER:
If you generate any content (code, text, json), you MUST save it using the 'notepad' tool.
Format: TOOL: notepad { "filename": "...", "content": "..." }
DO NOT just print the content. SAVE IT.`;

                const response = await service.sendMessage(strictInstruction, { simulateTools: true });

                // AUTO-SAVE SAFETY NET
                // If the agent output contains a JSON block or a file block but didn't call the tool, we save it manually.
                const jsonMatch = response.text.match(/```json\n([\s\S]*?)\n```/) || response.text.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    try {
                        const content = jsonMatch[1] || jsonMatch[0];
                        // Heuristic: If it looks like the system map
                        if (content.includes("modules") || content.includes("screens")) {
                            const filename = "system_map.json";
                            const fs = JSON.parse(localStorage.getItem('agent_filesystem') || '{}');
                            if (!fs[filename]) {
                                fs[filename] = content;
                                localStorage.setItem('agent_filesystem', JSON.stringify(fs));
                                console.log(`[Auto-Save] Saved ${filename} from agent output.`);

                                // Inject a system message to let the Orchestrator know
                                setMessages(prev => [...prev, {
                                    role: 'system',
                                    content: `[System Auto-Save]: Successfully saved '${filename}' based on agent output.`
                                }]);
                            }
                        }
                    } catch (e) {
                        console.warn("Auto-save failed", e);
                    }
                }

                const agentMsg = {
                    role: 'assistant',
                    agentId: nextAgentId,
                    content: response.text,
                    timestamp: new Date(),
                    metadata: { reason } // Store why they were picked
                };

                // 3. Update UI and Local History
                sessionMessages.push(agentMsg);
                setMessages(prev => [...prev, agentMsg]);

                // Small delay for UX
                await new Promise(r => setTimeout(r, 1500));
            }

            if (loopCount >= MAX_LOOPS && conversationActive) {
                setShowContinueButton(true);
                setStatusMessage("Discussion paused (limit reached).");
            }

        } catch (error) {
            console.error("Group Chat Error:", error);
            setMessages(prev => [...prev, { role: 'system', content: 'Error processing group messages.' }]);
        } finally {
            setIsProcessing(false);
            setStatusMessage('');
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <div className="flex h-[calc(100vh-200px)] bg-slate-950/50 p-4 gap-4 font-sans text-slate-200 rounded-xl border border-white/10 backdrop-blur-md">
            {/* Left Sidebar - Agent Selection */}
            <Card className="w-1/4 p-4 flex flex-col gap-4 bg-slate-900/80 backdrop-blur-sm border-white/5 shadow-inner">
                <div className="flex items-center gap-2 pb-2 border-b border-white/10">
                    <Users className="w-5 h-5 text-blue-400" />
                    <h2 className="font-semibold text-slate-200">Board Members</h2>
                </div>
                <ScrollArea className="flex-1 pr-2">
                    <div className="space-y-2">
                        {agents.map(agent => (
                            <div
                                key={agent.id}
                                className={`flex items-center gap-2 p-2 rounded-lg transition-all border ${selectedAgents.includes(agent.id)
                                    ? 'bg-blue-900/30 border-blue-500/30 shadow-sm'
                                    : 'hover:bg-white/5 border-transparent'
                                    }`}
                            >
                                <div
                                    className="flex-1 flex items-center gap-3 cursor-pointer min-w-0"
                                    onClick={() => toggleAgentSelection(agent.id)}
                                >
                                    <div className="relative shrink-0">
                                        <Avatar className="h-8 w-8 border border-white/10 shadow-sm">
                                            <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${agent.id}`} />
                                            <AvatarFallback className="bg-slate-800 text-slate-400">{agent.role[0].toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        {selectedAgents.includes(agent.id) && (
                                            <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-0.5 border-2 border-slate-900">
                                                <CheckCircle2 className="w-3 h-3 text-white" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <p className={`text-sm font-medium truncate ${selectedAgents.includes(agent.id) ? 'text-blue-300' : 'text-slate-300'}`}>
                                            {agent.role}
                                        </p>
                                        <p className="text-xs text-slate-500 truncate">{agent.role}</p>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-slate-500 hover:text-white shrink-0"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setViewingAgent(agent);
                                    }}
                                >
                                    <Info className="w-4 h-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
                <div className="pt-2 border-t border-white/10 text-xs text-slate-500 text-center">
                    {selectedAgents.length} agents selected
                </div>
            </Card>

            <AgentDetailsDialog
                agent={viewingAgent}
                isOpen={!!viewingAgent}
                onClose={() => setViewingAgent(null)}
                onSave={() => {
                    // Start sync to update runtime 
                    import('@/features/agents/services/AgentRegistry').then(({ syncAgentsWithDatabase }) => syncAgentsWithDatabase());
                }}
            />

            {/* Main Chat Area */}
            <Card className="flex-1 flex flex-col bg-slate-900/80 backdrop-blur-sm border-white/5 shadow-xl overflow-hidden">
                {/* Chat Header */}
                <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
                    <div>
                        <h2 className="font-semibold text-slate-200">Board Meeting Room</h2>
                        <p className="text-xs text-slate-500">Multi-Agent Collaboration</p>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2 mr-2">
                            <span className={`text-xs font-medium ${autonomousMode ? 'text-green-400' : 'text-slate-500'}`}>
                                {autonomousMode ? 'Autonomous ON' : 'Autonomous OFF'}
                            </span>
                            <Switch
                                checked={autonomousMode}
                                onCheckedChange={setAutonomousMode}
                                className={autonomousMode ? "bg-green-500" : "bg-slate-700"}
                            />
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => setMessages([])} title="Clear Chat">
                            <RotateCcw className="w-4 h-4 text-slate-500 hover:text-white" />
                        </Button>
                    </div>
                </div>

                {/* Messages Area */}
                <div
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto p-4 space-y-6 bg-transparent"
                >
                    {messages.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-slate-600 space-y-4 opacity-60">
                            <Users className="w-16 h-16" />
                            <p className="text-sm">Select agents and start the meeting</p>
                        </div>
                    )}

                    {messages.map((msg, idx) => {
                        const isUser = msg.role === 'user';
                        const agent = !isUser ? agents.find(a => a.id === msg.agentId) : null;

                        return (
                            <div key={idx} className={`flex gap-4 ${isUser ? 'flex-row-reverse' : ''}`}>
                                {/* Avatar */}
                                <Avatar className={`h-8 w-8 mt-1 border border-white/10 shadow-sm ${isUser ? 'bg-slate-700' : ''}`}>
                                    {isUser ? (
                                        <div className="w-full h-full flex items-center justify-center bg-slate-800 text-white">
                                            <User className="w-4 h-4" />
                                        </div>
                                    ) : (
                                        <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${agent?.id}`} />
                                    )}
                                </Avatar>

                                {/* Message Bubble */}
                                <div className={`flex flex-col max-w-[80%] ${isUser ? 'items-end' : 'items-start'}`}>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs font-medium text-slate-500">
                                            {isUser ? 'You' : agent?.role || 'Unknown Agent'}
                                        </span>
                                        {!isUser && agent && (
                                            <Badge variant="outline" className="text-[10px] h-4 px-1 py-0 border-slate-700 text-slate-500">
                                                {agent.role}
                                            </Badge>
                                        )}
                                        <span className="text-[10px] text-slate-600">
                                            {msg.timestamp ? msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                        </span>
                                    </div>

                                    <div className={`rounded-2xl px-4 py-3 text-sm shadow-sm ${isUser
                                        ? 'bg-blue-600 text-white rounded-tr-sm'
                                        : 'bg-slate-800 border border-white/10 text-slate-300 rounded-tl-sm'
                                        }`}>
                                        {isUser ? (
                                            msg.content
                                        ) : (
                                            <div>
                                                {/* Translation Toggle Trigger */}
                                                {msg.original_en_message && (
                                                    <div className="flex justify-end mb-1">
                                                        <button
                                                            onClick={() => {
                                                                const newMessages = [...messages];
                                                                // Toggle logic: Swap content with original and back
                                                                // We need a way to track state per message or just swap the content property directly in state.
                                                                // Swapping content directly in the state object (for this render cycle) is easiest if we don't persist it wrong.
                                                                // BETTER: Add a local 'showOriginal' property to the message object in state.

                                                                newMessages[idx].showOriginal = !newMessages[idx].showOriginal;
                                                                setMessages(newMessages);
                                                            }}
                                                            className="text-[10px] flex items-center gap-1 text-slate-500 hover:text-blue-400 transition-colors bg-white/5 px-2 py-0.5 rounded-full"
                                                        >
                                                            <RotateCcw className="w-3 h-3" />
                                                            {msg.showOriginal ? "Show Translated (HE)" : "Show Original (EN)"}
                                                        </button>
                                                    </div>
                                                )}

                                                <ReactMarkdown
                                                    className="prose prose-sm max-w-none prose-invert prose-p:leading-relaxed prose-pre:bg-slate-950 prose-pre:p-2 prose-pre:rounded-md"
                                                    components={{
                                                        p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                                                        a: ({ node, ...props }) => <a className="text-blue-400 hover:underline" {...props} />,
                                                        code: (/** @type {any} */ props) => {
                                                            const { node, inline, className, children, ...rest } = props;
                                                            return inline
                                                                ? <code className="bg-slate-950 px-1 py-0.5 rounded text-xs font-mono text-blue-300" {...rest}>{children}</code>
                                                                : <code className="block bg-slate-950 p-2 rounded text-xs font-mono text-slate-300 overflow-x-auto" {...rest}>{children}</code>
                                                        }
                                                    }}
                                                >
                                                    {(msg.showOriginal ? msg.original_en_message : msg.content).replace(/\[TASK\] (.*?) \(Assignee: (.*?)\)/g, '')}
                                                </ReactMarkdown>

                                                {/* Render Detected Tasks */}
                                                {(msg.showOriginal ? msg.original_en_message : msg.content).match(/\[TASK\] (.*?) \(Assignee: (.*?)\)/g)?.map((taskStr, idx) => {
                                                    const match = taskStr.match(/\[TASK\] (.*?) \(Assignee: (.*?)\)/);
                                                    if (!match) return null;
                                                    const [_, taskDesc, assignee] = match;
                                                    return (
                                                        <div key={idx} className="mt-3 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg flex flex-col gap-2">
                                                            <div className="flex items-start justify-between gap-2">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                                                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" /><path d="m9 12 2 2 4-4" /></svg>
                                                                    </div>
                                                                    <span className="font-medium text-sm text-blue-300">New Task Identified</span>
                                                                </div>
                                                                <span className="text-[10px] px-2 py-0.5 bg-slate-800 text-slate-400 rounded-full border border-slate-700">
                                                                    {assignee}
                                                                </span>
                                                            </div>
                                                            <p className="text-sm text-slate-400 pl-8">{taskDesc}</p>
                                                            <div className="pl-8 flex gap-2">
                                                                <button className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-700 transition-colors shadow-sm">
                                                                    Execute Task
                                                                </button>
                                                                <button className="text-xs bg-slate-800 text-slate-300 border border-slate-700 px-3 py-1.5 rounded-md hover:bg-slate-700 transition-colors">
                                                                    Edit Details
                                                                </button>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {isProcessing && (
                        <div className="flex gap-4">
                            <div className="w-8 h-8 rounded-full bg-slate-800 animate-pulse flex items-center justify-center">
                                <Bot className="w-4 h-4 text-slate-500" />
                            </div>
                            <div className="space-y-2">
                                <div className="h-4 w-24 bg-slate-800 rounded animate-pulse" />
                                <div className="h-auto min-h-[40px] w-auto max-w-[300px] bg-slate-900 rounded-2xl border border-white/10 shadow-sm flex items-center px-4 py-2">
                                    <div className="flex gap-2 items-center">
                                        <div className="flex gap-1">
                                            <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                            <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                            <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                        </div>
                                        <span className="text-xs text-slate-400 ml-2">{statusMessage || "Board is deliberating..."}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Continue Button Overlay */}
                {
                    showContinueButton && !isProcessing && (
                        <div className="absolute bottom-20 left-0 right-0 flex justify-center z-10">
                            <Button
                                onClick={() => {
                                    setShowContinueButton(false);
                                    setIsProcessing(true);
                                    processAgentResponses("Please continue the discussion.", 1);
                                }}
                                className="bg-green-600 hover:bg-green-700 text-white shadow-lg animate-bounce"
                            >
                                <RotateCcw className="w-4 h-4 mr-2" />
                                Continue Meeting
                            </Button>
                        </div>
                    )
                }

                {/* Input Area */}
                <div className="p-4 bg-white/5 border-t border-white/10">
                    <div className="flex gap-2">
                        <Input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={selectedAgents.length > 0 ? `Message the board (${selectedAgents.length} listening)...` : "Select agents to start..."}
                            disabled={selectedAgents.length === 0 || isProcessing}
                            className="flex-1 bg-slate-950/50 border-white/10 text-white focus:bg-slate-900 transition-colors placeholder:text-slate-600"
                        />
                        <Button
                            onClick={handleSendMessage}
                            disabled={!input.trim() || selectedAgents.length === 0 || isProcessing}
                            className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                        >
                            <Send className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </Card >
        </div >
    );
}
