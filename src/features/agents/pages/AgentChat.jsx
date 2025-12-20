import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Send, Bot, User, Loader2, Sparkles } from 'lucide-react';
// import { createClient } from '@supabase/supabase-js'; // Removed unused import
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { toast } from 'sonner';

// Import Agent Logic
import { getAgentReply } from '@/features/agents/services/AgentBrain';
import { workflowService } from '@/features/agents/services/WorkflowService';

// Initialize Supabase Client
import { supabase } from '@/api/supabaseClient';

export default function AgentChat() {
    const { workflowId } = useParams();
    const navigate = useNavigate();
    const [workflow, setWorkflow] = useState(null);
    const [agent, setAgent] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        loadWorkflow();
    }, [workflowId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const loadWorkflow = async () => {
        try {
            const row = await workflowService.loadWorkflow(workflowId);
            if (!row) {
                toast.error("Agent Not Found", { description: "This agent may have been unpublished." });
                navigate('/marketplace');
                return;
            }

            setWorkflow(row);

            // Extract the Primary Agent (first 'studioNode' with type 'agent_*')
            const nodes = row.graph_data?.nodes || [];
            const agentNode = nodes.find(n => n.data?.type && n.data.type.startsWith('agent_'));

            if (agentNode) {
                // Construct an Agent Object compatible with AgentRegistry/AgentBrain
                const constructedAgent = {
                    id: agentNode.id,
                    role: agentNode.data.label, // Use label as role name
                    systemPrompt: agentNode.data.systemPrompt || "You are a helpful AI assistant.",
                    model: agentNode.data.model || "gpt-4o",
                    layer: "user_interaction"
                };
                setAgent(constructedAgent);

                // Add Welcome Message
                setMessages([{
                    id: 'welcome',
                    role: 'assistant',
                    agent_id: constructedAgent.id,
                    content: `Hello! I am **${row.name}** (v${row.version}). How can I help you today?`,
                    created_at: new Date().toISOString()
                }]);
            } else {
                toast.error("Invalid Agent", { description: "This workflow does not contain a valid agent configuration." });
            }

        } catch (e) {
            console.error(e);
            toast.error("Error", { description: "Failed to load agent." });
        }
    };

    const handleSendMessage = async () => {
        if (!input.trim() || !agent) return;

        const userMsg = {
            id: Date.now().toString(),
            role: 'user',
            agent_id: 'HUMAN_USER',
            content: input.trim(),
            created_at: new Date().toISOString()
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);

        try {
            // Convert chat history format for AgentBrain
            // AgentBrain expects: { agent_id, content, ... }
            const history = [...messages, userMsg].map(m => ({
                agent_id: m.agent_id,
                role: m.role,
                content: m.content
            }));

            // Context Object
            const context = {
                meetingTitle: `Private Chat with ${workflow.name}`,
                config: {}, // App config if needed
            };

            const response = await getAgentReply(agent, history, context);

            // Add response message
            const botMsg = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                agent_id: agent.id,
                content: response.message || "I'm not sure how to respond to that.",
                created_at: new Date().toISOString()
            };
            setMessages(prev => [...prev, botMsg]);

            // Handle Actions
            if (response.action) {
                if (response.action.name === 'create_task' || response.action.type === 'create_task') {
                    try {
                        // Create Task in Supabase (Watched by Worker)
                        const { error } = await supabase.from('agent_tasks').insert([{
                            meeting_id: null,
                            title: response.action.payload?.title || response.action.title,
                            description: response.action.payload?.description || response.action.description,
                            assigned_to: response.action.payload?.assignee || response.action.assignee || 'Unassigned',
                            priority: response.action.payload?.priority || response.action.priority || 'medium',
                            status: 'in_progress',
                            created_by: 'consumer-chat'
                        }]);

                        if (error) throw error;

                        const sysMsg = {
                            id: (Date.now() + 2).toString(),
                            role: 'system',
                            agent_id: 'SYSTEM',
                            content: `**Action Started:** ${response.action.payload?.title || response.action.title}`,
                            created_at: new Date().toISOString()
                        };
                        setMessages(prev => [...prev, sysMsg]);
                        toast.success("Task Started", { description: "The agent has initiated a background task." });

                    } catch (actionError) {
                        console.error("Task Creation Failed:", actionError);
                        toast.error("Action Failed", { description: "Could not create the task ticket." });
                    }
                } else if (response.action.name === 'create_lead' || response.action.type === 'create_lead') {
                    // Direct CRM Action
                    try {
                        const leadPayload = response.action.payload || {};
                        const { data, error } = await supabase.from('crm_leads').insert([leadPayload]).select().single();

                        if (error) throw error;

                        const sysMsg = {
                            id: (Date.now() + 2).toString(),
                            role: 'system',
                            agent_id: 'SYSTEM',
                            content: `**Lead Created:** ${data.first_name} ${data.last_name} (${data.company || 'Individual'})`,
                            created_at: new Date().toISOString()
                        };
                        setMessages(prev => [...prev, sysMsg]);
                        toast.success("Lead Created", { description: "Added to CRM successfully." });

                    } catch (actionError) {
                        console.error("Lead Creation Failed:", actionError);
                        toast.error("Action Failed", { description: "Could not create CRM lead." });
                    }
                }
            }

        } catch (error) {
            console.error(error);
            toast.error("Response Failed", { description: "The agent is currently unavailable." });
        } finally {
            setIsTyping(false);
        }
    };

    if (!workflow || !agent) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-white">
            {/* Header */}
            <div className="flex items-center gap-4 px-4 py-3 border-b bg-white/80 backdrop-blur-md sticky top-0 z-10">
                <Button variant="ghost" size="icon" onClick={() => navigate('/marketplace')}>
                    <ArrowLeft className="w-5 h-5 text-slate-600" />
                </Button>

                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white shadow-md">
                        <Bot className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            {workflow.name}
                            <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-mono">
                                v{workflow.version}
                            </span>
                        </h1>
                        <p className="text-xs text-slate-500 flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                            Online & Ready
                        </p>
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50/50">
                {messages.map((msg) => {
                    if (msg.role === 'system') {
                        return (
                            <div key={msg.id} className="flex justify-center my-4 opacity-75">
                                <div className="bg-slate-100 border border-slate-200 text-slate-600 px-4 py-2 rounded-lg text-xs font-mono max-w-lg w-full">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                                </div>
                            </div>
                        );
                    }
                    const isUser = msg.role === 'user';
                    return (
                        <div key={msg.id} className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''} max-w-3xl mx-auto w-full group`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm border border-white 
                                ${isUser ? 'bg-slate-900 text-white' : 'bg-white text-blue-600'}`}>
                                {isUser ? <User className="w-5 h-5" /> : <Sparkles className="w-4 h-4" />}
                            </div>

                            <div className={`flex flex-col max-w-[85%] sm:max-w-[75%] ${isUser ? 'items-end' : 'items-start'}`}>
                                <div className={`px-4 py-3 rounded-2xl shadow-sm text-sm leading-relaxed
                                    ${isUser
                                        ? 'bg-slate-900 text-white rounded-tr-none'
                                        : 'bg-white text-slate-700 border border-slate-200 rounded-tl-none'
                                    }`}>
                                    <ReactMarkdown
                                        remarkPlugins={[remarkGfm]}
                                        className="prose prose-sm dark:prose-invert max-w-none break-words"
                                    >
                                        {msg.content}
                                    </ReactMarkdown>
                                </div>
                                <span className="text-[10px] text-slate-400 mt-1 px-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </div>
                    );
                })}

                {isTyping && (
                    <div className="flex gap-3 max-w-3xl mx-auto w-full">
                        <div className="w-8 h-8 rounded-full bg-white text-blue-600 flex items-center justify-center shrink-0 shadow-sm border border-white">
                            <Bot className="w-5 h-5" />
                        </div>
                        <div className="bg-white border border-slate-200 px-4 py-3 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-white border-t relative z-20">
                <div className="max-w-3xl mx-auto flex gap-2">
                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                        placeholder={`Message ${workflow.name}...`}
                        className="flex-1 rounded-full border-slate-200 focus-visible:ring-blue-500 bg-slate-50"
                        autoFocus
                    />
                    <Button
                        onClick={handleSendMessage}
                        size="icon"
                        disabled={!input.trim() || isTyping}
                        className="rounded-full bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 w-10 h-10 shrink-0"
                    >
                        <Send className="w-4 h-4 ml-0.5" />
                    </Button>
                </div>
                <div className="text-center mt-2">
                    <p className="text-[10px] text-slate-400">
                        AI can make mistakes. Consider checking important information.
                    </p>
                </div>
            </div>
        </div>
    );
}
