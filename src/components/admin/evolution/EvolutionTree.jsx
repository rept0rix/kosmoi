import React, { useCallback, useEffect, useState } from 'react';
import {
    ReactFlow,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    addEdge,
    BackgroundVariant,
    Handle,
    Position,
    Panel,
    useReactFlow
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Save, Trash2, X, RefreshCw, Layers, FolderOpen } from 'lucide-react';
import { toast } from 'sonner';

// --- Custom Node Types ---
const EvolutionNode = ({ data, selected }) => (
    <div className={`group px-4 py-3 shadow-glass rounded-xl border-2 min-w-[150px] text-center backdrop-blur-md transition-all duration-300 ${selected ? 'ring-2 ring-indigo-500 scale-105 bg-slate-800' : ''
        } ${data.status === 'completed' ? 'bg-green-500/10 border-green-500/50' :
            data.status === 'current' ? 'bg-amber-500/10 border-amber-500/50 shadow-neon' :
                'bg-slate-500/10 border-slate-500/30'
        }`}>
        <Handle type="target" position={Position.Top} className="!bg-slate-400 w-3 h-3" />
        <div className="text-[10px] font-bold tracking-wider uppercase opacity-70 mb-1 flex justify-center items-center gap-2">
            {data.type || 'FEATURE'}
            {data.status === 'completed' && <div className="w-1.5 h-1.5 rounded-full bg-green-500" />}
            {data.status === 'current' && <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />}
        </div>
        <div className="text-sm font-bold text-white leading-tight">{data.label}</div>
        {data.description && (
            <div className="text-[10px] text-slate-400 mt-1 max-w-[140px] truncate mx-auto">{data.description}</div>
        )}
        <Handle type="source" position={Position.Bottom} className="!bg-slate-400 w-3 h-3" />

        {/* Hover Actions (Visual cue only) */}
        <div className="absolute -top-3 -right-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="bg-slate-800 rounded-full p-1 border border-slate-700">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            </div>
        </div>
    </div>
);

const nodeTypes = {
    evolution: EvolutionNode,
};

// --- Initial Data (Default) ---
// --- Initial Data (Default: Kosmoi System Map) ---
const defaultNodes = [
    { id: 'root', type: 'evolution', position: { x: 600, y: 0 }, data: { label: 'Kosmoi Core', type: 'MILESTONE', status: 'current', description: 'The Super App Ecosystem' } },

    // Core Interfaces
    { id: 'admin', type: 'evolution', position: { x: 200, y: 200 }, data: { label: 'Admin Interface', type: 'PHASE', status: 'current', description: 'System Control' } },
    { id: 'business', type: 'evolution', position: { x: 600, y: 200 }, data: { label: 'Business Interface', type: 'PHASE', status: 'planned', description: 'Merchant Dashboard' } },
    { id: 'customer', type: 'evolution', position: { x: 1000, y: 200 }, data: { label: 'Customer App', type: 'PHASE', status: 'planned', description: 'User Experience' } },

    // Features / Modules
    { id: 'trip', type: 'evolution', position: { x: 0, y: 400 }, data: { label: 'Trip Builder', type: 'FEATURE', status: 'planned', description: 'Itinerary AI' } },
    { id: 'ai', type: 'evolution', position: { x: 300, y: 400 }, data: { label: 'AI Chat', type: 'AGENT', status: 'current', description: 'Contextual Assistant' } },
    { id: 'market', type: 'evolution', position: { x: 600, y: 400 }, data: { label: 'Marketplace (Yad2)', type: 'FEATURE', status: 'planned', description: 'Second-hand' } },
    { id: 'wallet', type: 'evolution', position: { x: 900, y: 400 }, data: { label: 'Digital Wallet', type: 'FEATURE', status: 'planned', description: 'Credits & Points' } },
    { id: 'pay', type: 'evolution', position: { x: 1200, y: 400 }, data: { label: 'Payments', type: 'FEATURE', status: 'planned', description: 'Gateway & Split' } },
];

const defaultEdges = [
    { id: 'e-root-admin', source: 'root', target: 'admin', animated: true, style: { stroke: '#6366f1' } },
    { id: 'e-root-business', source: 'root', target: 'business', animated: true, style: { stroke: '#6366f1' } },
    { id: 'e-root-customer', source: 'root', target: 'customer', animated: true, style: { stroke: '#6366f1' } },

    // Connections to appropriate parent phases
    { id: 'e-customer-trip', source: 'customer', target: 'trip', animated: true, style: { stroke: '#94a3b8' } },
    { id: 'e-root-ai', source: 'root', target: 'ai', animated: true, style: { stroke: '#a855f7' } }, // Agent connects to core
    { id: 'e-customer-market', source: 'customer', target: 'market', animated: true, style: { stroke: '#94a3b8' } },
    { id: 'e-customer-wallet', source: 'customer', target: 'wallet', animated: true, style: { stroke: '#94a3b8' } },
    { id: 'e-wallet-pay', source: 'wallet', target: 'pay', animated: true, style: { stroke: '#22c55e' } }, // Wallet needs payments
];

// LocalStorage Keys
const SCENARIOS_KEY = 'kosmoi-evolution-scenarios-v1';
const ACTIVE_SCENARIO_KEY = 'kosmoi-evolution-active-id-v1';

export default function EvolutionTree() {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);

    // Scenarios State
    const [scenarios, setScenarios] = useState({});
    const [activeScenarioId, setActiveScenarioId] = useState(null);
    const [activeScenarioName, setActiveScenarioName] = useState('Default Scene');

    const [selectedNode, setSelectedNode] = useState(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isScenarioManagerOpen, setIsScenarioManagerOpen] = useState(false);

    // 1. Load Scenarios on Mount
    useEffect(() => {
        const savedScenarios = localStorage.getItem(SCENARIOS_KEY);
        const lastActiveId = localStorage.getItem(ACTIVE_SCENARIO_KEY);

        if (savedScenarios) {
            const parsed = JSON.parse(savedScenarios);
            setScenarios(parsed);

            // Determine which scenario to load
            const idToLoad = (lastActiveId && parsed[lastActiveId]) ? lastActiveId : Object.keys(parsed)[0];

            if (idToLoad) {
                loadScenario(idToLoad, parsed);
            } else {
                // Should not happen if savedScenarios is valid, but fallback:
                createNewScenario("Main Architecture");
            }
        } else {
            // First time ever: create default
            createNewScenario("Main Architecture");
        }
    }, []);

    // 2. Auto-save current Nodes/Edges to Active Scenario
    useEffect(() => {
        if (!activeScenarioId) return;

        // Debounce save? For now, direct save is fine for small graphs.
        const updatedScenarios = {
            ...scenarios,
            [activeScenarioId]: {
                id: activeScenarioId,
                name: activeScenarioName,
                nodes,
                edges,
                updatedAt: new Date().toISOString()
            }
        };

        // Update local state ONLY if it's not a loop (this is tricky with ReactFlow)
        // Actually, we just want to write to localStorage. Updating 'scenarios' state might re-trigger.
        // Let's just update the ref or write directly to storage to avoid loop.
        localStorage.setItem(SCENARIOS_KEY, JSON.stringify(updatedScenarios));

        // Also keep the state in sync so UI lists update (e.g. node count?)
        // To avoid infinite loop, we won't setScenarios here unless strictly needed.
        // But if we don't setScenarios, the "Load" menu won't show updated counts.
        // SOLUTION: Only setScenarios if it's significantly different? 
        // Or just let it be. For now, rely on 'nodes'/'edges' for the canvas, and 'scenarios' for the menu.
        // We will update 'scenarios' only when explicitly saving or switching?
        // NO, auto-save is better. 

        // Let's refine: We will update localStorage on every change. 
        // We will updated 'scenarios' state only when CRUD operations happen (Create, Delete, Rename).

    }, [nodes, edges, activeScenarioId, activeScenarioName]); // Added activeScenarioName to dependencies

    const createNewScenario = (name = "New Scenario") => {
        const id = `scene_${Date.now()}`;
        const newScenario = {
            id,
            name,
            nodes: defaultNodes,
            edges: defaultEdges,
            updatedAt: new Date().toISOString()
        };

        const updated = { ...scenarios, [id]: newScenario };
        setScenarios(updated);
        localStorage.setItem(SCENARIOS_KEY, JSON.stringify(updated));

        loadScenario(id, updated);
        toast.success(`Created "${name}"`);
    };

    const loadScenario = (id, fromScenarios = scenarios) => {
        const scene = fromScenarios[id];
        if (!scene) return;

        setActiveScenarioId(id);
        setActiveScenarioName(scene.name);
        setNodes(scene.nodes || []);
        setEdges(scene.edges || []);

        localStorage.setItem(ACTIVE_SCENARIO_KEY, id);
        setSelectedNode(null);
        setIsSidebarOpen(false);
    };

    const deleteScenario = (id) => {
        if (Object.keys(scenarios).length <= 1) {
            toast.error("Cannot delete the last scenario.");
            return;
        }

        if (confirm("Delete this scenario permanently?")) {
            const updated = { ...scenarios };
            delete updated[id];
            setScenarios(updated);
            localStorage.setItem(SCENARIOS_KEY, JSON.stringify(updated));

            // If we deleted the active one, switch to another
            if (id === activeScenarioId) {
                const nextId = Object.keys(updated)[0];
                loadScenario(nextId, updated);
            }
            toast.success("Scenario deleted");
        }
    };

    const renameScenario = (newPageName) => {
        setActiveScenarioName(newPageName);
        // This will trigger the auto-save effect to persist the name change
    };

    // --- Graph Operations ---

    const onConnect = useCallback(
        (params) => setEdges((eds) => addEdge({ ...params, animated: true, style: { stroke: '#94a3b8' } }, eds)),
        [setEdges],
    );

    const handleNodeClick = (_, node) => {
        setSelectedNode(node);
        setIsSidebarOpen(true);
    };

    const handlePaneClick = () => {
        setSelectedNode(null);
        setIsSidebarOpen(false);
    };

    const updateNodeData = (key, value) => {
        if (!selectedNode) return;
        setNodes((nds) =>
            nds.map((node) => {
                if (node.id === selectedNode.id) {
                    const newData = { ...node.data, [key]: value };
                    setSelectedNode({ ...node, data: newData });
                    return { ...node, data: newData };
                }
                return node;
            })
        );
    };

    const addNewNode = () => {
        const id = `node_${Date.now()}`;
        const newNode = {
            id,
            type: 'evolution',
            position: { x: 400 + Math.random() * 50, y: 200 + Math.random() * 50 },
            data: {
                label: 'New Node',
                type: 'FEATURE',
                status: 'planned',
                description: 'Description here...'
            },
        };
        setNodes((nds) => nds.concat(newNode));
        toast.success("New node added");
    };

    const deleteSelectedNode = () => {
        if (!selectedNode) return;
        setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
        setEdges((eds) => eds.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id));
        setSelectedNode(null);
        setIsSidebarOpen(false);
        toast.success("Node deleted");
    };

    const resetTree = () => {
        if (confirm("Are you sure? This will reset the tree to default.")) {
            setNodes(defaultNodes);
            setEdges(defaultEdges);
            // This function is now largely superseded by scenario management,
            // but keeping it for potential internal use or if a "reset current scenario" is desired.
            // localStorage.removeItem(STORAGE_KEY); // No longer relevant for single STORAGE_KEY
            toast.info("Current scenario reset to defaults");
        }
    };

    return (
        <div className="h-full w-full relative bg-slate-950 text-slate-100 flex overflow-hidden">
            {/* Main Canvas */}
            <div className="flex-1 relative">
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    nodeTypes={nodeTypes}
                    onNodeClick={handleNodeClick}
                    onPaneClick={handlePaneClick}
                    fitView
                    className="bg-slate-950"
                >
                    <Controls className="!bg-slate-800 !border-slate-700 !fill-white" />
                    <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#334155" />

                    <Panel position="top-left" className="m-4 flex flex-col gap-2">
                        <GlassCard className="p-4 backdrop-blur-xl border-slate-700/50 w-[300px]">
                            <div className="flex items-center justify-between mb-2">
                                <h2 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                                    Evolution Map
                                </h2>
                                <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => setIsScenarioManagerOpen(!isScenarioManagerOpen)}>
                                    <FolderOpen className="w-4 h-4 text-slate-400" />
                                </Button>
                            </div>

                            {isScenarioManagerOpen && (
                                <div className="mb-4 pt-4 border-t border-slate-700/50 space-y-2 animate-in slide-in-from-top-2">
                                    <div className="text-xs font-semibold text-slate-500 uppercase">Scenarios</div>
                                    <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
                                        {Object.values(scenarios).map(scene => (
                                            <div
                                                key={scene.id}
                                                onClick={() => loadScenario(scene.id)}
                                                className={`flex items-center justify-between p-2 rounded text-sm cursor-pointer hover:bg-white/5 ${activeScenarioId === scene.id ? 'bg-indigo-500/20 text-indigo-300' : 'text-slate-400'}`}
                                            >
                                                <span className="truncate max-w-[150px]">{scene.name}</span>
                                                {Object.keys(scenarios).length > 1 && (
                                                    <X
                                                        className="w-3 h-3 hover:text-red-400"
                                                        onClick={(e) => { e.stopPropagation(); deleteScenario(scene.id); }}
                                                    />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    <Button size="sm" variant="outline" className="w-full text-xs" onClick={() => createNewScenario("New Untitled Scenario")}>
                                        <Plus className="w-3 h-3 mr-1" /> Create Scenario
                                    </Button>
                                    <div className="h-px bg-slate-700/50 my-2" />
                                </div>
                            )}

                            {/* Active Scenario Title Edit */}
                            <div className="mb-4">
                                <label className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Current Scenario</label>
                                <Input
                                    className="h-8 bg-transparent border-0 border-b border-indigo-500/30 rounded-none focus-visible:ring-0 px-0 text-sm font-medium"
                                    value={activeScenarioName}
                                    onChange={(e) => renameScenario(e.target.value)}
                                />
                            </div>

                            <div className="flex gap-2">
                                <Button size="sm" onClick={addNewNode} className="flex-1 bg-indigo-600 hover:bg-indigo-700 font-normal">
                                    <Plus className="w-4 h-4 mr-1" /> Add Node
                                </Button>
                            </div>
                        </GlassCard>
                    </Panel>
                </ReactFlow>
            </div>

            {/* Edit Sidebar */}
            <div className={`
                absolute right-0 top-0 bottom-0 w-80 bg-slate-900/95 backdrop-blur-xl border-l border-slate-700 shadow-2xl z-20 transition-transform duration-300 ease-in-out px-6 py-6 overflow-y-auto
                ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'}
            `}>
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-semibold text-lg">Edit Node</h3>
                    <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(false)}>
                        <X className="w-5 h-5 text-slate-400" />
                    </Button>
                </div>

                {selectedNode ? (
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-slate-400">Node Title</label>
                            <Input
                                value={selectedNode.data.label}
                                onChange={(e) => updateNodeData('label', e.target.value)}
                                className="bg-slate-950 border-slate-800"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-medium text-slate-400">Type (Shape/Color)</label>
                            <Select
                                value={selectedNode.data.type}
                                onValueChange={(val) => updateNodeData('type', val)}
                            >
                                <SelectTrigger className="bg-slate-950 border-slate-800">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                                    <SelectItem value="MILESTONE">Milestone (Green)</SelectItem>
                                    <SelectItem value="PHASE">Phase (Amber)</SelectItem>
                                    <SelectItem value="FEATURE">Feature (Blue)</SelectItem>
                                    <SelectItem value="BUG">Bug (Red)</SelectItem>
                                    <SelectItem value="AGENT">Agent (Purple)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-medium text-slate-400">Status</label>
                            <Select
                                value={selectedNode.data.status}
                                onValueChange={(val) => updateNodeData('status', val)}
                            >
                                <SelectTrigger className="bg-slate-950 border-slate-800">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                                    <SelectItem value="planned">Planned</SelectItem>
                                    <SelectItem value="current">In Progress</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                    <SelectItem value="blocked">Blocked</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-medium text-slate-400">Description</label>
                            <Textarea
                                value={selectedNode.data.description || ''}
                                onChange={(e) => updateNodeData('description', e.target.value)}
                                className="bg-slate-950 border-slate-800 max-h-32"
                            />
                        </div>

                        <div className="pt-4 border-t border-slate-800">
                            <Button
                                variant="destructive"
                                className="w-full bg-red-900/50 hover:bg-red-900 text-red-200"
                                onClick={deleteSelectedNode}
                            >
                                <Trash2 className="w-4 h-4 mr-2" /> Delete Node
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="text-center text-slate-500 mt-10">
                        Select a node to edit details.
                    </div>
                )}
            </div>
        </div>
    );
}
