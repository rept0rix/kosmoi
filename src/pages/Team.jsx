import React, { useState, useEffect } from 'react';
import { Twitter, Linkedin, Mail, Code, Terminal, Cpu, Shield, Zap, Search, PenTool, Database, Activity, Lock, Share2, DollarSign, Briefcase, Eye, ChevronRight, BarChart2, Globe } from 'lucide-react';
import { agents } from '@/features/agents/services/AgentRegistry';
import { KOSMOI_MANIFESTO } from '@/features/agents/services/Kosmoi_Manifesto';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import NeuralBackground from '../components/NeuralBackground';

// Map specific roles to generated avatars (using stable seeds)
const AVATAR_MAP = {
    'ceo': 'https://api.dicebear.com/7.x/bottts/svg?seed=ceo&backgroundColor=transparent',
    'tech-lead': 'https://api.dicebear.com/7.x/bottts/svg?seed=tech&backgroundColor=transparent',
    'ui': 'https://api.dicebear.com/7.x/bottts/svg?seed=design&backgroundColor=transparent',
    'product-vision': 'https://api.dicebear.com/7.x/bottts/svg?seed=product&backgroundColor=transparent',
    'cmo': 'https://api.dicebear.com/7.x/bottts/svg?seed=marketing&backgroundColor=transparent',
    'qa-auditor': 'https://api.dicebear.com/7.x/bottts/svg?seed=qa&backgroundColor=transparent',
    'human-user': '/founder_avatar.jpg', // The Boss
};

// Default avatar generator
const getAvatarUrl = (seed) => `https://api.dicebear.com/7.x/bottts/svg?seed=${seed}&backgroundColor=transparent`;
const DEFAULT_AVATAR = getAvatarUrl('general');

/**
 * Team Page
 *
 * visualizes the "Synthetic Collective" of autonomous agents.
 * Displays agents grouped by hierarchy/layer with detailed inspection views
 * of their system prompts and capabilities.
 */
const Team = () => {
    const [selectedAgent, setSelectedAgent] = useState(null);

    useEffect(() => {
        // Debugging Agent Models
        // console.log("Team Page Loaded. Agents:", agents.map(a => `${a.role}: ${a.model}`));
    }, []);

    // Group agents by layer for better organization
    const agentsByLayer = agents.reduce((acc, agent) => {
        const layer = agent.layer || 'other';
        if (!acc[layer]) acc[layer] = [];
        acc[layer].push(agent);
        return acc;
    }, {});

    const layerOrder = ['board', 'executive', 'strategic', 'operational', 'automation', 'documentation', 'growth'];
    const layerTitles = {
        board: 'Board of Vision',
        executive: 'Executive Leadership',
        strategic: 'Strategic Intelligence',
        operational: 'Operational Core',
        automation: 'Automation & DevOps',
        documentation: 'Knowledge & Documentation',
        growth: 'Growth & Innovation'
    };

    const getAgentImage = (role) => {
        // Direct match
        if (AVATAR_MAP[role]) return AVATAR_MAP[role];

        // Human fallback (should be caught by map, but safety first)
        if (role === 'human-user' || role === 'user') return '/founder_avatar.jpg';

        // fuzzy match
        if (role.includes('tech') || role.includes('dev')) return AVATAR_MAP['tech-lead'];
        if (role.includes('design') || role.includes('ux')) return AVATAR_MAP['ui'];
        if (role.includes('product') || role.includes('manager')) return AVATAR_MAP['product-vision'];
        if (role.includes('market') || role.includes('growth')) return AVATAR_MAP['cmo'];
        if (role.includes('qa') || role.includes('audit')) return AVATAR_MAP['qa-auditor'];

        // Unique seed for others based on role name
        return getAvatarUrl(role);
    };

    return (
        <div className="min-h-screen bg-slate-950 font-sans text-slate-100 relative selection:bg-blue-500/30">
            <NeuralBackground />

            {/* Hero Section */}
            <div className="relative pt-32 pb-20 overflow-hidden">
                <div className="absolute inset-0 bg-[url('/kosmoi_cover_bg.png')] bg-cover bg-center opacity-10"></div>
                <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-950/90 to-slate-950"></div>

                <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-mono mb-8 animate-pulse">
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                        SYSTEM ACTIVE • {agents.length} NODES ONLINE
                    </div>

                    <img src="/kosmoi_logo.svg" alt="Kosmoi" className="h-20 mx-auto mb-8 opacity-90 drop-shadow-[0_0_15px_rgba(56,189,248,0.3)]" />

                    <h1 className="text-5xl md:text-8xl font-black tracking-tighter mb-6 text-white drop-shadow-2xl">
                        THE <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-teal-400 to-emerald-400">SYNTHETIC</span>
                        <br />
                        COLLECTIVE
                    </h1>

                    <p className="text-xl text-slate-400 max-w-2xl mx-auto font-light leading-relaxed">
                        A sovereign neural network of autonomous agents, architecting the service economy of the future.
                    </p>
                </div>
            </div>

            {/* Manifesto Section - Redesigned */}
            <section className="max-w-5xl mx-auto px-6 mb-32">
                <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-teal-600 rounded-[2rem] blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                    <div className="relative bg-slate-900 border border-slate-800 rounded-[1.8rem] p-10 md:p-14 overflow-hidden">

                        <div className="grid md:grid-cols-5 gap-12">
                            <div className="md:col-span-2 space-y-6">
                                <h2 className="text-3xl font-bold flex items-center gap-3 text-white">
                                    <Shield className="w-8 h-8 text-blue-500" />
                                    Constitution
                                </h2>
                                <p className="text-slate-400 leading-relaxed">
                                    We are not just a chatbot. We are a structured digital organism.
                                    We operate on a strict hierarchical protocol designed for efficiency, autonomy, and trust.
                                </p>
                                <div className="flex gap-4 text-xs font-mono text-slate-500 mt-4">
                                    <div className="flex items-center gap-2">
                                        <Cpu className="w-4 h-4 text-blue-500" />
                                        <span>AUTONOMOUS</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Globe className="w-4 h-4 text-teal-500" />
                                        <span>DISTRIBUTED</span>
                                    </div>
                                </div>
                            </div>

                            <div className="md:col-span-3 bg-slate-950/50 p-8 rounded-2xl border border-slate-800/50 font-mono text-sm text-slate-300 shadow-inner">
                                <ScrollArea className="h-64 pr-4">
                                    <ReactMarkdown
                                        remarkPlugins={[remarkGfm]}
                                        components={{
                                            h2: ({ node, ...props }) => <h2 className="text-blue-400 text-lg font-bold mt-4 mb-2" {...props} />,
                                            strong: ({ node, ...props }) => <strong className="text-teal-300 font-semibold" {...props} />
                                        }}
                                    >
                                        {KOSMOI_MANIFESTO}
                                    </ReactMarkdown>
                                </ScrollArea>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Agents Grid */}
            <div className="max-w-7xl mx-auto px-6 pb-24">
                <div className="space-y-32">
                    {layerOrder.map(layer => {
                        if (!agentsByLayer[layer]) return null;

                        return (
                            <div key={layer} className="relative">
                                <div className="flex items-center gap-6 mb-16">
                                    <div className="h-12 w-1 bg-gradient-to-b from-blue-500 to-teal-500 rounded-full"></div>
                                    <div>
                                        <h3 className="text-2xl font-bold text-white uppercase tracking-widest">
                                            {layerTitles[layer] || layer}
                                        </h3>
                                        <p className="text-sm text-slate-500 font-mono mt-1 uppercase tracking-wider">
                                            {agentsByLayer[layer].length} ACTIVE NODES
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                                    {agentsByLayer[layer].map(agent => (
                                        <div
                                            key={agent.id}
                                            className="group relative bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 hover:border-blue-500/50 transition-all duration-500 hover:shadow-[0_0_30px_rgba(59,130,246,0.15)] flex flex-col"
                                        >
                                            {/* Image Header with Stats Overlay */}
                                            <div className="h-40 overflow-hidden relative bg-slate-900/50">
                                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent z-10"></div>
                                                <img
                                                    src={getAgentImage(agent.role)}
                                                    alt={agent.role}
                                                    className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 ${agent.role === 'human-user' ? 'object-top grayscale-0' : 'grayscale group-hover:grayscale-0'}`}
                                                />
                                                <div className="absolute top-2 right-2 z-20 flex flex-col gap-1 items-end">
                                                    <Badge className="bg-slate-950/90 backdrop-blur text-blue-300 border-blue-500/30 text-[10px] font-mono shadow-xl">
                                                        {agent.model}
                                                    </Badge>
                                                    {agent.memory?.type === 'longterm' && (
                                                        <Badge className="bg-emerald-950/90 backdrop-blur text-emerald-400 border-emerald-500/30 text-[10px] font-mono shadow-xl">
                                                            INFITE MEMORY
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Content */}
                                            <div className="p-6 relative z-20 -mt-10 flex-1 flex flex-col">
                                                <div className="bg-slate-950/90 backdrop-blur-md rounded-xl p-5 border border-slate-800/80 shadow-2xl group-hover:border-slate-700 transition-colors flex-1 flex flex-col">
                                                    <h4 className="text-lg font-bold text-white capitalize mb-1 flex items-center justify-between">
                                                        {agent.role.replace(/-/g, ' ')}
                                                        {agent.role === 'ceo' && <Briefcase className="w-4 h-4 text-yellow-500" />}
                                                    </h4>

                                                    <div className="flex items-center gap-2 mb-4">
                                                        <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></div>
                                                        <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">
                                                            ID: {agent.id}
                                                        </p>
                                                    </div>

                                                    <p className="text-sm text-slate-400 line-clamp-3 mb-6 font-light leading-relaxed flex-grow">
                                                        {agent.systemPrompt.slice(0, 150).replace(/[#*`]/g, '')}...
                                                    </p>

                                                    <Button
                                                        onClick={() => setSelectedAgent(agent)}
                                                        className="w-full bg-slate-900 hover:bg-blue-600 text-slate-300 hover:text-white border border-slate-800 hover:border-blue-500 transition-all group-hover:shadow-lg group-hover:shadow-blue-900/40"
                                                        size="sm"
                                                    >
                                                        <Eye className="w-4 h-4 mr-2" /> Inspect Neural Config
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Agent Detail Modal */}
            <Dialog open={!!selectedAgent} onOpenChange={(open) => !open && setSelectedAgent(null)}>
                <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden bg-slate-950 text-slate-100 border-slate-800 shadow-2xl shadow-blue-900/40">
                    <div className="grid md:grid-cols-3 h-full">
                        {/* Sidebar with Image */}
                        <div className="bg-slate-900/50 relative hidden md:block border-r border-slate-800">
                            {selectedAgent && (
                                <>
                                    <div className="absolute inset-0">
                                        <img
                                            src={getAgentImage(selectedAgent.role)}
                                            alt={selectedAgent.role}
                                            className="w-full h-full object-cover opacity-50 mix-blend-overlay"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent"></div>
                                    </div>
                                    <div className="absolute bottom-6 left-6 right-6 z-10">
                                        <h2 className="text-3xl font-bold text-white capitalize mb-2 leading-tight">{selectedAgent.role.replace(/-/g, ' ')}</h2>
                                        <div className="flex flex-wrap gap-2">
                                            <Badge variant="outline" className="border-blue-500/50 text-blue-300 bg-blue-500/10">
                                                {selectedAgent.model}
                                            </Badge>
                                            <Badge variant="outline" className="border-slate-700">
                                                {selectedAgent.layer}
                                            </Badge>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Content Area */}
                        <div className="md:col-span-2 flex flex-col h-full overflow-hidden">
                            <DialogHeader className="p-6 border-b border-slate-800 bg-slate-950">
                                <DialogTitle className="flex items-center gap-2">
                                    <Terminal className="w-5 h-5 text-blue-500" />
                                    System Configuration
                                </DialogTitle>
                            </DialogHeader>

                            <ScrollArea className="flex-1 p-6">
                                <div className="space-y-8">
                                    {/* System Prompt */}
                                    <div>
                                        <h3 className="text-sm font-medium text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                            <Code className="w-4 h-4" /> Core Directives
                                        </h3>
                                        <div className="bg-slate-900/80 rounded-lg p-5 border border-slate-800/50 font-mono text-xs md:text-sm leading-relaxed text-slate-300 relative group">
                                            <div className="absolute top-2 right-2 text-[10px] text-slate-600">SYSTEM_PROMPT.md</div>
                                            <ReactMarkdown
                                                remarkPlugins={[remarkGfm]}
                                                components={{
                                                    code: ({ node, ...props }) => <span className="text-blue-300" {...props} />,
                                                    strong: ({ node, ...props }) => <strong className="text-teal-400 font-semibold" {...props} />
                                                }}
                                            >
                                                {selectedAgent?.systemPrompt}
                                            </ReactMarkdown>
                                        </div>
                                    </div>

                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-slate-900 p-4 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors">
                                            <h4 className="text-xs text-slate-500 uppercase mb-2 flex items-center gap-2">
                                                <Database className="w-3 h-3" /> Memory Architecture
                                            </h4>
                                            <div className="flex items-center gap-2 text-teal-400 font-mono text-sm">
                                                {selectedAgent?.memory?.type}
                                                <span className="text-slate-600">({selectedAgent?.memory?.ttlDays}d retention)</span>
                                            </div>
                                        </div>
                                        <div className="bg-slate-900 p-4 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors">
                                            <h4 className="text-xs text-slate-500 uppercase mb-2 flex items-center gap-2">
                                                <Activity className="w-3 h-3" /> Capabilities
                                            </h4>
                                            <div className="flex flex-wrap gap-1.5">
                                                {selectedAgent?.allowedTools?.slice(0, 10).map(tool => (
                                                    <Badge key={tool} variant="secondary" className="bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-[10px] transition-colors cursor-default">
                                                        {tool}
                                                    </Badge>
                                                ))}
                                                {(selectedAgent?.allowedTools?.length || 0) > 10 && (
                                                    <span className="text-xs text-slate-500 self-center font-mono">+{selectedAgent.allowedTools.length - 10}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </ScrollArea>

                            <div className="p-4 bg-slate-900 border-t border-slate-800 flex justify-between items-center text-xs text-slate-500 font-mono">
                                <span className='flex items-center gap-2'><BarChart2 className='w-3 h-3' /> MAX RUNTIME: {selectedAgent?.maxRuntimeSeconds}s</span>
                                <div className="flex gap-2 items-center text-green-500/80">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                                    NODE OPERATIONAL
                                </div>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Team;
