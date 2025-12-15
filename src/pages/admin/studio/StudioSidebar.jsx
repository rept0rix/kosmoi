
import React from 'react';
import { Bot, Zap, Box, Layers, Search, Code, Globe, MessageSquare } from 'lucide-react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

const SidebarItem = ({ type, label, icon: Icon, color }) => {
    const onDragStart = (event, nodeType) => {
        event.dataTransfer.setData('application/reactflow', nodeType);
        event.dataTransfer.setData('application/label', label);
        event.dataTransfer.setData('application/color', color);
        event.dataTransfer.effectAllowed = 'move';
    };

    return (
        <div
            className={`
                flex items-center gap-3 p-3 rounded-lg border border-slate-800 bg-slate-900/50 
                cursor-grab active:cursor-grabbing hover:bg-slate-800 hover:border-slate-700 
                transition-all group
            `}
            draggable
            onDragStart={(event) => onDragStart(event, type)}
        >
            <div className={`p-2 rounded-md bg-opacity-10 ${color.bg} ${color.text}`}>
                <Icon size={16} />
            </div>
            <div className="flex-1">
                <div className="text-xs font-semibold text-slate-200">{label}</div>
                <div className="text-[10px] text-slate-500 group-hover:text-slate-400">Drag to canvas</div>
            </div>
        </div>
    );
};



export default function StudioSidebar({ onLoadWorkflow, onImportGraph }) {
    const [savedWorkflows, setSavedWorkflows] = React.useState([]);

    React.useEffect(() => {
        // Dynamic import to avoid circular dep issues in some bundlers, though unlikely here
        import('../../../services/agents/WorkflowService').then(({ workflowService }) => {
            workflowService.listWorkflows().then(setSavedWorkflows).catch(console.error);
        });
    }, []);

    return (
        <aside className="w-72 bg-slate-950 border-r border-slate-800 flex flex-col h-full z-20">
            <div className="p-4 border-b border-slate-800">
                <h2 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
                    Kosmoi Studio
                </h2>
                <p className="text-xs text-slate-500">Visual Agent Orchestration</p>
            </div>

            <ScrollArea className="flex-1">
                <div className="p-4 space-y-6">

                    {/* Magic Input */}
                    <div className="mb-6 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 p-3 rounded-xl border border-indigo-500/30">
                        <h3 className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-2 mb-2">
                            <Zap size={12} /> Magic Build
                        </h3>
                        {/* Only show input if handler is provided */}
                        {onImportGraph && (
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="e.g. 'Build a blog agent'..."
                                    className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 pl-3 pr-8 text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            const p = e.target.value;
                                            if (!p.trim()) return;
                                            import('../../../services/agents/MagicGraph').then(async ({ generateGraphFromPrompt }) => {
                                                const btn = e.target;
                                                const originalPlaceholder = btn.placeholder;
                                                btn.disabled = true;
                                                btn.value = "Thinking...";

                                                try {
                                                    const graph = await generateGraphFromPrompt(p);
                                                    onImportGraph(graph);
                                                } catch (err) {
                                                    console.error("Magic Build Failed:", err);
                                                    // Optional: toast.error("Magic Build Failed");
                                                } finally {
                                                    btn.disabled = false;
                                                    btn.value = '';
                                                    btn.placeholder = originalPlaceholder;
                                                    btn.focus();
                                                }
                                            });
                                        }
                                    }}
                                />
                                <Bot size={14} className="absolute right-2 top-2.5 text-indigo-400 opacity-50" />
                            </div>
                        )}
                        {!onImportGraph && <p className="text-[10px] text-slate-500">Magic Build unavailable in this mode.</p>}
                    </div>

                    {/* Saved Workflows */}
                    {savedWorkflows.length > 0 && (
                        <div className="space-y-3">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                <Layers size={12} /> My Workflows
                            </h3>
                            {savedWorkflows.map(wf => (
                                <div
                                    key={wf.id}
                                    onClick={() => onLoadWorkflow(wf.id)}
                                    className="flex items-center gap-3 p-3 rounded-lg border border-slate-800 bg-slate-900/30 cursor-pointer hover:bg-slate-800 hover:border-indigo-500/50 transition-all"
                                >
                                    <div className="p-2 rounded-md bg-indigo-500/10 text-indigo-400">
                                        <Layers size={14} />
                                    </div>
                                    <div>
                                        <div className="text-xs font-semibold text-slate-200">{wf.name}</div>
                                        <div className="text-[10px] text-slate-500">{new Date(wf.created_at).toLocaleDateString()}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Blueprints */}
                    <div className="space-y-3">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                            <Layers size={12} /> Blueprints
                        </h3>
                        <SidebarItem
                            type="blueprint_startup"
                            label="Startup Launch"
                            icon={Layers}
                            color={{ bg: 'bg-indigo-500', text: 'text-indigo-400' }}
                        />
                        <SidebarItem
                            type="blueprint_content"
                            label="Content Engine"
                            icon={Layers}
                            color={{ bg: 'bg-indigo-500', text: 'text-indigo-400' }}
                        />
                    </div>

                    {/* Agents */}
                    <div className="space-y-3">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                            <Bot size={12} /> Agents
                        </h3>
                        <SidebarItem
                            type="agent_ceo"
                            label="CEO Agent"
                            icon={Bot}
                            color={{ bg: 'bg-amber-500', text: 'text-amber-400' }}
                        />
                        <SidebarItem
                            type="agent_dev"
                            label="Tech Lead"
                            icon={Code}
                            color={{ bg: 'bg-cyan-500', text: 'text-cyan-400' }}
                        />
                        <SidebarItem
                            type="agent_marketing"
                            label="Marketing"
                            icon={Globe}
                            color={{ bg: 'bg-pink-500', text: 'text-pink-400' }}
                        />
                    </div>

                    {/* Skills */}
                    <div className="space-y-3">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                            <Box size={12} /> Innovation Tools
                        </h3>
                        <SidebarItem
                            type="tool_market_watch"
                            label="Market Watchtower"
                            icon={Search}
                            color={{ bg: 'bg-green-500', text: 'text-green-400' }}
                        />
                        <SidebarItem
                            type="tool_trend_spy"
                            label="Trend Spy"
                            icon={Zap}
                            color={{ bg: 'bg-red-500', text: 'text-red-400' }}
                        />
                    </div>

                    {/* Triggers */}
                    <div className="space-y-3">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                            <Zap size={12} /> Triggers
                        </h3>
                        <SidebarItem
                            type="trigger_webhook"
                            label="Webhook"
                            icon={Globe}
                            color={{ bg: 'bg-slate-500', text: 'text-slate-400' }}
                        />
                        <SidebarItem
                            type="trigger_schedule"
                            label="Schedule (Cron)"
                            icon={Zap}
                            color={{ bg: 'bg-slate-500', text: 'text-slate-400' }}
                        />
                    </div>

                </div>
            </ScrollArea>
        </aside>
    );
}
