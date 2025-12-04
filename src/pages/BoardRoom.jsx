import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Send, Users, Layout, MessageSquare, CheckSquare, Play, Pause, Archive, Bot, Sparkles, MoreVertical, Zap } from 'lucide-react';
import { agents, getAgentById } from '@/services/agents/AgentRegistry';
import { useLanguage } from "@/components/LanguageContext";
import { getAgentReply } from '@/services/agents/AgentBrain';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAppConfig } from "@/components/AppConfigContext";
import { useToast } from "@/components/ui/use-toast";
import { BoardOrchestrator } from '@/services/agents/BoardOrchestrator';
import CompanyStateDisplay from '@/components/agents/CompanyStateDisplay';
import AgentNetworkGraph from '@/components/agents/AgentNetworkGraph';
import initialCompanyState from '@/data/company_state.json';

// Initialize direct Supabase client for Realtime support
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function BoardRoom() {
    const { language } = useLanguage();
    const { config, updateConfig } = useAppConfig();
    const { toast } = useToast();
    const [meetings, setMeetings] = useState([]);
    const [selectedMeeting, setSelectedMeeting] = useState(null);
    const [messages, setMessages] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [typingAgent, setTypingAgent] = useState(null);
    const [autoDiscuss, setAutoDiscuss] = useState(false);
    const [isCreateMeetingOpen, setIsCreateMeetingOpen] = useState(false);
    const [newMeetingTitle, setNewMeetingTitle] = useState('');
    const [selectedImage, setSelectedImage] = useState(null);
    const [selectedAgentIds, setSelectedAgentIds] = useState([]);
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const [companyState, setCompanyState] = useState(initialCompanyState);

    // Initialize selected agents from localStorage or default to all board agents
    useEffect(() => {
        const saved = localStorage.getItem('board_selected_agents');
        if (saved) {
            try {
                setSelectedAgentIds(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to parse saved agents", e);
                const boardAgents = agents.filter(a => a.layer === 'board');
                setSelectedAgentIds(boardAgents.map(a => a.id));
            }
        } else {
            const boardAgents = agents.filter(a => a.layer === 'board');
            setSelectedAgentIds(boardAgents.map(a => a.id));
        }
    }, []);

    // Save to localStorage whenever selection changes
    useEffect(() => {
        if (selectedAgentIds.length > 0) {
            localStorage.setItem('board_selected_agents', JSON.stringify(selectedAgentIds));
        }
    }, [selectedAgentIds]);

    const isRTL = language === 'he';

    // Fetch Meetings
    useEffect(() => {
        const fetchMeetings = async () => {
            const { data, error } = await supabase.from('board_meetings').select('*').order('created_at', { ascending: false });
            if (data) {
                setMeetings(data);
                if (data.length > 0 && !selectedMeeting) {
                    setSelectedMeeting(data[0]);
                }
            }
            setIsLoading(false);
        };

        fetchMeetings();

        // Realtime subscription for meetings
        const subscription = supabase.channel('board_meetings')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'board_meetings' }, payload => {
                fetchMeetings();
            })
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    // Fetch Messages & Tasks for Selected Meeting
    useEffect(() => {
        if (!selectedMeeting) return;

        const fetchDetails = async () => {
            // Messages
            const { data: msgs } = await supabase.from('board_messages')
                .select('*')
                .eq('meeting_id', selectedMeeting.id)
                .order('created_at', { ascending: true });
            setMessages(msgs || []);

            // Tasks
            const { data: tsks } = await supabase.from('agent_tasks')
                .select('*')
                .eq('meeting_id', selectedMeeting.id)
                .order('created_at', { ascending: false });
            setTasks(tsks || []);
        };

        fetchDetails();

        // Realtime subscriptions
        const msgSub = supabase.channel(`messages:${selectedMeeting.id}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'board_messages', filter: `meeting_id=eq.${selectedMeeting.id}` }, payload => {
                setMessages(prev => [...prev, payload.new]);
                setTypingAgent(null); // Stop typing animation when message arrives
            })
            .subscribe();

        const taskSub = supabase.channel(`tasks:${selectedMeeting.id}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'agent_tasks', filter: `meeting_id=eq.${selectedMeeting.id}` }, payload => {
                // Refresh tasks simply
                supabase.from('agent_tasks').select('*').eq('meeting_id', selectedMeeting.id).then(({ data }) => setTasks(data || []));
            })
            .subscribe();

        return () => {
            msgSub.unsubscribe();
            taskSub.unsubscribe();
        };
    }, [selectedMeeting]);

    // Helper to trigger an agent reply
    const triggerAgentReply = async (forcedAgent = null) => {
        console.log("triggerAgentReply called. Forced:", forcedAgent?.role);
        if (!selectedMeeting) {
            console.log("No selected meeting.");
            return;
        }

        // Pick a random agent from the Board layer to reply if not forced
        // In the future, this could be smarter (who is mentioned, who is relevant)
        // Filter board agents based on selection
        // NOTE: We now allow ANY agent layer if they are in the selected list (e.g. CEO)
        const activeAgents = agents.filter(a => selectedAgentIds.includes(a.id));
        console.log("Active agents count:", activeAgents.length);

        let selectedAgent = forcedAgent;

        // ORCHESTRATOR LOGIC (Dynamic Team Management)
        if (!selectedAgent) {
            const orchestrator = new BoardOrchestrator(agents); // Pass all agents so it knows who exists

            // Prepare history for orchestrator
            const history = messages.map(m => ({
                role: m.agent_id === 'HUMAN_USER' ? 'user' : 'assistant',
                agentId: m.agent_id,
                content: m.content
            }));

            // Get decision
            const decision = await orchestrator.getNextSpeaker(
                selectedMeeting.title, // Goal is the meeting title for now
                history,
                autoDiscuss, // Use autoDiscuss as "Autonomous Mode" flag
                companyState,
                selectedAgentIds // Pass the active agents list
            );

            console.log("Orchestrator Decision:", decision);

            if (decision.nextSpeakerId === 'TERMINATE') {
                console.log("Orchestrator decided to terminate.");
                return;
            }

            // Handle Team Management (ADD/REMOVE)
            if (decision.manageTeam && decision.manageTeam.action) {
                const { action, agentId, reason } = decision.manageTeam;
                const agentToManage = agents.find(a => a.id === agentId);

                if (agentToManage) {
                    if (action === 'ADD' && !selectedAgentIds.includes(agentId)) {
                        setSelectedAgentIds(prev => [...prev, agentId]);
                        toast({
                            title: "Team Update",
                            description: `Orchestrator added ${agentToManage.role}: ${reason}`,
                            className: "bg-blue-600 text-white"
                        });
                        // Add system message
                        await supabase.from('board_messages').insert([{
                            meeting_id: selectedMeeting.id,
                            agent_id: 'SYSTEM',
                            content: `**SYSTEM**: Added **${agentToManage.role}** to the room. Reason: *${reason}*`,
                            type: 'system'
                        }]);
                    } else if (action === 'REMOVE' && selectedAgentIds.includes(agentId)) {
                        setSelectedAgentIds(prev => prev.filter(id => id !== agentId));
                        toast({
                            title: "Team Update",
                            description: `Orchestrator removed ${agentToManage.role}: ${reason}`,
                            variant: "destructive"
                        });
                        // Add system message
                        await supabase.from('board_messages').insert([{
                            meeting_id: selectedMeeting.id,
                            agent_id: 'SYSTEM',
                            content: `**SYSTEM**: Removed **${agentToManage.role}** from the room. Reason: *${reason}*`,
                            type: 'system'
                        }]);
                    }
                }
            }

            // Set the selected agent
            if (decision.nextSpeakerId) {
                selectedAgent = agents.find(a => a.id === decision.nextSpeakerId);
            }
        }

        if (!selectedAgent) {
            console.log("No active agent selected to reply.");
            return;
        }

        setTypingAgent(selectedAgent);

        try {
            console.log('Sending config to agent:', config);
            const response = await getAgentReply(selectedAgent, messages, {
                meetingTitle: selectedMeeting.title,
                tasks: tasks,
                images: selectedImage ? [{ base64: selectedImage, mimeType: 'image/png' }] : [],
                config: config // System Awareness
            });

            // 1. Handle Action (Create Task OR Write Code)
            let msgType = 'text';

            if (response.action) {
                if (response.action.type === 'create_task') {
                    msgType = 'task_created';
                    await supabase.from('agent_tasks').insert([{
                        meeting_id: selectedMeeting.id,
                        title: response.action.title,
                        description: response.action.description || response.message,
                        assigned_to: response.action.assignee || 'Unassigned',
                        priority: response.action.priority || 'medium',
                        status: 'in_progress'
                    }]);
                } else if (response.action.type === 'write_code') {
                    msgType = 'proposal';
                    // Append code to the message content for now, or handle as a special message type
                    // We'll append it as a markdown code block to the message content
                    response.message += `\n\n\`\`\`${response.action.language}\n${response.action.code}\n\`\`\``;
                } else if (response.action.type === 'update_ui') {
                    msgType = 'task_created'; // Re-use green style for positive action
                    updateConfig(response.action.config);
                    toast({
                        title: "UI Updated",
                        description: `App configuration updated by ${selectedAgent.role}`,
                        variant: "default",
                        className: "bg-green-600 text-white border-none"
                    });
                }
            }

            // 2. Send Message
            await supabase.from('board_messages').insert([{
                meeting_id: selectedMeeting.id,
                agent_id: selectedAgent.id,
                content: response.message,
                type: msgType
            }]);

        } catch (error) {
            console.error("Failed to get agent reply:", error);
            setTypingAgent(null);
        }
    };

    // AI Logic: Respond to User OR Auto-Discuss
    useEffect(() => {
        if (!messages.length || !selectedMeeting || selectedMeeting.status !== 'active') return;

        const lastMsg = messages[messages.length - 1];
        const isUser = lastMsg.agent_id === 'HUMAN_USER';

        // 1. User spoke -> Agent replies (always)
        if (isUser) {
            triggerAgentReply();
            return;
        }

        // 2. Agent spoke -> Auto-Discuss loop (if enabled)
        if (autoDiscuss && !isUser && !typingAgent) {
            // Wait a bit before next agent speaks
            const timeout = setTimeout(() => {
                // Ensure we don't trigger if user interrupted or typing started
                triggerAgentReply();
            }, 1500); // 1.5 seconds delay (Turbo Mode)

            return () => clearTimeout(timeout);
        }

    }, [messages, selectedMeeting, autoDiscuss]);

    // Scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, typingAgent]);

    const handleCreateMeeting = () => {
        setIsCreateMeetingOpen(true);
    };

    const confirmCreateMeeting = async () => {
        console.log("confirmCreateMeeting called with title:", newMeetingTitle);
        if (!newMeetingTitle.trim()) {
            console.log("Title is empty, returning");
            return;
        }

        console.log("Attempting Supabase insert...");
        const { data, error } = await supabase.from('board_meetings').insert([{ title: newMeetingTitle, status: 'active' }]).select();

        if (error) {
            console.error("Error creating meeting:", error);
            alert("Failed to create meeting: " + error.message);
        } else {
            console.log("Meeting created successfully:", data);
        }

        if (data) {
            const newMeeting = data[0];
            setMeetings(prev => [newMeeting, ...prev]); // Optimistic update
            setSelectedMeeting(newMeeting);
            setIsCreateMeetingOpen(false);
            setNewMeetingTitle('');
            alert("Meeting Created Successfully!");
        }
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setSelectedImage(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSendMessage = async () => {
        if (!input.trim() || !selectedMeeting) return;

        const { error } = await supabase.from('board_messages').insert([{
            meeting_id: selectedMeeting.id,
            agent_id: 'HUMAN_USER', // Hardcoded for now
            content: input,
            type: 'text'
        }]);

        if (!error) {
            setInput('');
            setSelectedImage(null);
        }
        if (!error) {
            setInput('');
            setSelectedImage(null);
        }
    };

    const handleStartDailyStandup = async () => {
        if (!selectedMeeting) return;

        // 1. Ensure CEO and key agents are in the room
        const requiredAgents = ['ceo-agent', 'product-founder-agent', 'tech-lead-agent'];
        const missingAgents = requiredAgents.filter(id => !selectedAgentIds.includes(id));

        if (missingAgents.length > 0) {
            setSelectedAgentIds(prev => [...new Set([...prev, ...missingAgents])]);
            toast({
                title: "Team Assembled",
                description: "Added CEO, Product, and Tech Lead for the standup.",
                className: "bg-blue-600 text-white"
            });
            // Wait a moment for state to update
            await new Promise(r => setTimeout(r, 500));
        }

        // 2. Trigger Orchestrator for Daily Standup
        const orchestrator = new BoardOrchestrator(agents);
        const decision = orchestrator.startDailyStandup(companyState);

        // 3. Force CEO to speak
        const ceoAgent = agents.find(a => a.id === decision.nextSpeakerId);
        if (ceoAgent) {
            // We manually trigger the reply with the forced instruction
            // But getAgentReply expects messages. We need to inject the instruction as a system prompt or similar.
            // Actually, we can just simulate a "System" message that prompts the CEO.

            const prompt = decision.instruction;

            // Add a system message to the chat to show what's happening
            await supabase.from('board_messages').insert([{
                meeting_id: selectedMeeting.id,
                agent_id: 'SYSTEM',
                content: `**SYSTEM**: Initiating Daily Standup Routine...`,
                type: 'system'
            }]);

            // Now trigger the CEO with this specific context
            // We'll use a trick: Send a hidden user message or just call getAgentReply with a modified context
            // Let's use the triggerAgentReply logic but force the agent and maybe inject a "last message" context?
            // A better way: Insert a system message that IS the prompt, then let the agent reply to it.

            await supabase.from('board_messages').insert([{
                meeting_id: selectedMeeting.id,
                agent_id: 'SYSTEM', // Or 'Orchestrator'
                content: `[DIRECTIVE TO CEO]: ${prompt}`,
                type: 'system_hidden' // We might need to filter this in UI if we don't want to see it, or just show it as "Board Directive"
            }]);

            // Trigger reply
            // We need to make sure the agent SEES this message.
            // The subscription will update 'messages' state, but it might be async.
            // Let's force it by calling triggerAgentReply after a short delay or passing the message directly.

            setTimeout(() => triggerAgentReply(ceoAgent), 1000);
            setAutoDiscuss(true); // Enable auto-discuss so the meeting continues
        }
    };

    const boardAgents = agents.filter(a => a.layer === 'board');

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden font-sans" dir={isRTL ? 'rtl' : 'ltr'}>
            {/* DEBUG INFO */}
            <div className="fixed top-0 left-0 bg-black text-white text-xs p-1 z-50 opacity-50 pointer-events-none">
                App: {config?.appName} | Theme: {config?.themeColor}
            </div>

            {/* Sidebar - Meetings */}
            <div className="w-72 border-e bg-white flex flex-col shadow-sm z-10">
                <div className="p-4 border-b flex justify-between items-center bg-gray-50/50">
                    <h2 className="font-semibold flex items-center gap-2 text-gray-800">
                        <Layout className="w-4 h-4 text-blue-600" />
                    </h2>
                    <Button variant="ghost" size="icon" onClick={handleCreateMeeting} className="h-8 w-8 hover:bg-blue-50 hover:text-blue-600">
                        <Plus className="w-4 h-4" />
                    </Button>
                </div>
                <ScrollArea className="flex-1">
                    <div className="p-3 space-y-2">
                        {meetings.map(meeting => (
                            <button
                                key={meeting.id}
                                onClick={() => setSelectedMeeting(meeting)}
                                className={`w-full text-start px-4 py-3 rounded-xl text-sm transition-all duration-200 flex items-center gap-3 group ${selectedMeeting?.id === meeting.id
                                    ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                                    : 'hover:bg-gray-100 text-gray-700 bg-white border border-gray-100'
                                    }`}
                            >
                                <div className={`p-2 rounded-lg ${selectedMeeting?.id === meeting.id ? 'bg-white/20' : 'bg-gray-100 group-hover:bg-white'}`}>
                                    <Users className="w-4 h-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-medium truncate">{meeting.title}</div>
                                    <div className={`text-xs truncate opacity-80 ${selectedMeeting?.id === meeting.id ? 'text-blue-100' : 'text-gray-400'}`}>
                                        {new Date(meeting.created_at).toLocaleDateString()}
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </ScrollArea>

                {/* Agent Network Graph (Spider Map) */}
                <div className="border-t p-0">
                    <AgentNetworkGraph
                        agents={agents}
                        activeAgentIds={selectedAgentIds}
                        messages={messages}
                    />
                </div>
            </div>

            {/* Main Content - Chat */}
            <div className="flex-1 flex flex-col min-w-0 bg-white/50 backdrop-blur-sm relative">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                }} />

                {selectedMeeting ? (
                    <>
                        <div className="p-4 border-b flex justify-between items-center bg-white/80 backdrop-blur-md sticky top-0 z-10">
                            <div>
                                <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                    {selectedMeeting.title}
                                    <Badge variant={selectedMeeting.status === 'active' ? 'default' : 'secondary'} className="text-xs font-normal">
                                        {selectedMeeting.status}
                                    </Badge>
                                </h1>
                                <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">

                                    {/* Daily Standup Button */}
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-7 text-xs gap-1 bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                                        onClick={handleStartDailyStandup}
                                    >
                                        <Sparkles className="w-3 h-3" />
                                        {isRTL ? 'ישיבת בוקר' : 'Daily Standup'}
                                    </Button>
                                    <Separator orientation="vertical" className="h-4" />

                                    {/* Participants Popover */}
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <button className="flex items-center gap-2 hover:text-blue-600 transition-colors">
                                                <Users className="w-3 h-3" />
                                                <span>{selectedAgentIds.length + 1} {isRTL ? 'משתתפים' : 'Participants'}</span>
                                            </button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-72 p-3" align="start">
                                            <div className="flex justify-between items-center mb-3">
                                                <h4 className="font-medium text-sm text-gray-900">{isRTL ? 'משתתפים בחדר' : 'Room Participants'}</h4>
                                                <div className="flex gap-2">
                                                    <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2" onClick={() => setSelectedAgentIds(boardAgents.map(a => a.id))}>All</Button>
                                                    <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2" onClick={() => setSelectedAgentIds([])}>None</Button>
                                                </div>
                                            </div>
                                            <div className="space-y-3 max-h-96 overflow-y-auto">
                                                <div className="flex items-center gap-3 opacity-50 cursor-not-allowed">
                                                    <Checkbox checked={true} disabled />
                                                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                                        <Users className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-medium">You (Human)</div>
                                                        <div className="text-xs text-green-600 flex items-center gap-1">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                                            Online
                                                        </div>
                                                    </div>
                                                </div>
                                                <Separator />
                                                {/* Active Agents */}
                                                {agents.filter(a => selectedAgentIds.includes(a.id)).map(agent => (
                                                    <div key={agent.id} className="flex items-center gap-3">
                                                        <Checkbox
                                                            checked={true}
                                                            onCheckedChange={() => setSelectedAgentIds(prev => prev.filter(id => id !== agent.id))}
                                                        />
                                                        <div className="w-8 h-8 rounded-full flex items-center justify-center bg-blue-50 text-blue-600">
                                                            <Bot className="w-4 h-4" />
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-medium">{agent.role}</div>
                                                            <div className="text-xs text-gray-500">{agent.model}</div>
                                                        </div>
                                                    </div>
                                                ))}

                                                {/* Inactive Agents (Invite) */}
                                                {agents.filter(a => !selectedAgentIds.includes(a.id)).length > 0 && (
                                                    <>
                                                        <Separator className="my-2" />
                                                        <div className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">
                                                            {isRTL ? 'הזמן סוכן' : 'Invite Agent'}
                                                        </div>
                                                        {agents.filter(a => !selectedAgentIds.includes(a.id)).map(agent => (
                                                            <button
                                                                key={agent.id}
                                                                onClick={() => setSelectedAgentIds(prev => [...prev, agent.id])}
                                                                className="flex items-center gap-3 w-full p-1 hover:bg-gray-50 rounded-lg transition-colors text-start"
                                                            >
                                                                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 text-gray-400 border border-dashed border-gray-300">
                                                                    <Plus className="w-3 h-3" />
                                                                </div>
                                                                <div>
                                                                    <div className="text-sm font-medium text-gray-600">{agent.role}</div>
                                                                    <div className="text-xs text-gray-400">{agent.layer}</div>
                                                                </div>
                                                            </button>
                                                        ))}
                                                    </>
                                                )}
                                            </div>
                                        </PopoverContent>
                                    </Popover>

                                    {/* Auto-Discuss Toggle */}
                                    <div className="flex items-center gap-2 border-s ps-4">
                                        <Zap className={`w-3 h-3 ${autoDiscuss ? 'text-amber-500 fill-amber-500' : 'text-gray-400'}`} />
                                        <span className={autoDiscuss ? 'text-amber-600 font-medium' : ''}>
                                            {isRTL ? 'דיון אוטומטי' : 'Auto-Discuss'}
                                        </span>
                                        <Switch
                                            checked={autoDiscuss}
                                            onCheckedChange={setAutoDiscuss}
                                            className="scale-75"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" className="h-8 gap-2">
                                    <Archive className="w-3 h-3" />
                                    {isRTL ? 'ארכיון' : 'Archive'}
                                </Button>
                            </div>
                        </div>

                        {/* Company State Visualization */}
                        <div className="px-6 pt-4">
                            <CompanyStateDisplay state={companyState} />
                        </div>

                        <ScrollArea className="flex-1 p-6">
                            <div className="space-y-6 max-w-4xl mx-auto">
                                {messages.map((msg) => {
                                    const isUser = msg.agent_id === 'HUMAN_USER';
                                    const agent = getAgentById(msg.agent_id);

                                    return (
                                        <div key={msg.id} className={`flex gap-4 ${isUser ? 'flex-row-reverse' : ''} group`}>
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm border-2 border-white ${isUser ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white' : 'bg-gradient-to-br from-gray-100 to-gray-200 text-gray-600'}`}>
                                                {isUser ? <Users className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                                            </div>
                                            <div className={`flex flex-col max-w-[75%] ${isUser ? 'items-end' : 'items-start'}`}>
                                                <div className="flex items-center gap-2 mb-1 px-1">
                                                    <span className="text-xs font-semibold text-gray-700">
                                                        {isUser ? (isRTL ? 'אתה' : 'You') : (agent?.role || msg.agent_id)}
                                                    </span>
                                                    <span className="text-[10px] text-gray-400">
                                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                                <div className={`p-4 rounded-2xl text-sm shadow-sm leading-relaxed ${isUser
                                                    ? 'bg-blue-600 text-white rounded-tr-none'
                                                    : msg.type === 'task_created'
                                                        ? 'bg-green-50 border-2 border-green-200 text-green-900 rounded-tl-none'
                                                        : msg.type === 'proposal'
                                                            ? 'bg-blue-50 border-2 border-blue-200 text-blue-900 rounded-tl-none'
                                                            : 'bg-white border border-gray-100 text-gray-800 rounded-tl-none'
                                                    }`}>
                                                    <ReactMarkdown
                                                        remarkPlugins={[remarkGfm]}
                                                        components={{
                                                            code({ node, className, children, ...props }) {
                                                                const match = /language-(\w+)/.exec(className || '')
                                                                return match ? (
                                                                    <pre className="p-2 rounded-md bg-gray-800 text-white overflow-x-auto text-xs">
                                                                        <code className={className} {...props}>
                                                                            {children}
                                                                        </code>
                                                                    </pre>
                                                                ) : (
                                                                    <code className={className} {...props}>
                                                                        {children}
                                                                    </code>
                                                                )
                                                            }
                                                        }}
                                                    >
                                                        {msg.content}
                                                    </ReactMarkdown>
                                                </div>
                                                {!isUser && agent && (
                                                    <div className="mt-1 px-1">
                                                        <Badge variant="outline" className="text-[10px] h-5 bg-gray-50/50 border-gray-200 text-gray-500">
                                                            {agent.role}
                                                        </Badge>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}

                                {typingAgent && (
                                    <div className="flex gap-4">
                                        <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm border-2 border-white bg-gradient-to-br from-gray-100 to-gray-200 text-gray-600">
                                            <Bot className="w-5 h-5" />
                                        </div>
                                        <div className="flex flex-col items-start">
                                            <div className="flex items-center gap-2 mb-1 px-1">
                                                <span className="text-xs font-semibold text-gray-700">
                                                    {typingAgent.role || typingAgent.id}
                                                </span>
                                                <span className="text-[10px] text-gray-400">Typing...</span>
                                            </div>
                                            <div className="p-4 rounded-2xl rounded-tl-none bg-white border border-gray-100 shadow-sm">
                                                <div className="flex gap-1">
                                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>
                        </ScrollArea>

                        <div className="p-4 border-t bg-white/80 backdrop-blur-md">
                            <div className="max-w-4xl mx-auto flex gap-3">
                                <Input
                                    placeholder={isRTL ? "כתוב הודעה לצוות..." : "Type a message to the board..."}
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                    className="shadow-sm border-gray-200 focus:border-blue-400 focus:ring-blue-400 bg-white"
                                />
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                />
                                <Button variant="outline" size="icon" onClick={() => fileInputRef.current?.click()} className={selectedImage ? "text-blue-600 border-blue-200 bg-blue-50" : "text-gray-400"}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" /></svg>
                                </Button>
                                <Button onClick={handleSendMessage} className="shadow-sm bg-blue-600 hover:bg-blue-700 text-white px-6">
                                    <Send className="w-4 h-4" />
                                </Button>
                            </div>
                            {selectedImage && (
                                <div className="max-w-4xl mx-auto mt-2 flex items-center gap-2">
                                    <div className="relative group">
                                        <img src={selectedImage} alt="Preview" className="h-16 w-16 object-cover rounded-lg border border-gray-200" />
                                        <button
                                            onClick={() => setSelectedImage(null)}
                                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                        </button>
                                    </div>
                                    <span className="text-xs text-gray-400">Image attached</span>
                                </div>
                            )}
                        </div>
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

            {/* Right Sidebar - Tasks */}
            <div className="w-80 border-s bg-white flex flex-col shadow-sm z-10">
                <div className="p-4 border-b flex justify-between items-center bg-gray-50/50">
                    <h2 className="font-semibold flex items-center gap-2 text-gray-800">
                        <CheckSquare className="w-4 h-4 text-green-600" />
                        {isRTL ? 'משימות סוכנים' : 'Agent Tasks'}
                    </h2>
                    <Badge variant="outline" className="bg-white">
                        {tasks.length}
                    </Badge>
                </div>
                <ScrollArea className="flex-1 p-4 bg-gray-50/30">
                    <div className="space-y-3">
                        {tasks.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mb-3">
                                    <CheckSquare className="w-6 h-6 text-green-200" />
                                </div>
                                <p className="text-sm text-gray-400">
                                    {isRTL ? 'אין משימות פעילות' : 'No active tasks'}
                                </p>
                            </div>
                        )}
                        {tasks.map(task => (
                            <Card key={task.id} className="bg-white border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200">
                                <CardHeader className="p-3 pb-0">
                                    <div className="flex justify-between items-start gap-2">
                                        <CardTitle className="text-sm font-semibold leading-tight text-gray-800">
                                            {task.title}
                                        </CardTitle>
                                        <Badge variant="outline" className={`text-[10px] shrink-0 ${task.status === 'done' ? 'bg-green-50 text-green-700 border-green-200' :
                                            task.status === 'in_progress' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                'bg-gray-50 text-gray-600'
                                            }`}>
                                            {task.status}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-3 pt-2">
                                    <p className="text-xs text-gray-500 mb-3 line-clamp-2 leading-relaxed">
                                        {task.description}
                                    </p>
                                    <div className="flex justify-between items-center pt-2 border-t border-gray-50">
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-4 h-4 rounded-full bg-gray-100 flex items-center justify-center text-[8px] font-bold text-gray-600">
                                                {(task.assigned_to || 'U')[0]}
                                            </div>
                                            <span className="text-[10px] text-gray-400 font-medium">
                                                {task.assigned_to || 'Unassigned'}
                                            </span>
                                        </div>
                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${task.priority === 'high' ? 'bg-red-50 text-red-600' :
                                            task.priority === 'medium' ? 'bg-orange-50 text-orange-600' :
                                                'bg-gray-50 text-gray-500'
                                            }`}>
                                            {task.priority}
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </ScrollArea>
            </div>
            {/* Create Meeting Dialog */}
            <Dialog open={isCreateMeetingOpen} onOpenChange={setIsCreateMeetingOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{isRTL ? 'צור חדר ישיבות חדש' : 'Create New Board Room'}</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <Input
                            placeholder={isRTL ? "שם הפגישה..." : "Meeting title..."}
                            value={newMeetingTitle}
                            onChange={(e) => setNewMeetingTitle(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && confirmCreateMeeting()}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateMeetingOpen(false)}>
                            {isRTL ? 'ביטול' : 'Cancel'}
                        </Button>
                        <Button onClick={confirmCreateMeeting}>
                            {isRTL ? 'צור' : 'Create'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div >
    );
}
