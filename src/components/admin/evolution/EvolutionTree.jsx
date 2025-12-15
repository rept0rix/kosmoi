
import React, { useCallback } from 'react';
import {
    ReactFlow,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    addEdge,
    BackgroundVariant,
    Handle as FlowHandle,
    Position
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { GlassCard } from '@/components/ui/GlassCard';

// --- Custom Node Types ---
const EvolutionNode = ({ data }) => (
    <div className={`px-4 py-3 shadow-glass rounded-xl border-2 min-w-[150px] text-center backdrop-blur-md transition-all hover:scale-105 ${data.status === 'completed' ? 'bg-green-500/10 border-green-500/50' :
        data.status === 'current' ? 'bg-amber-500/10 border-amber-500/50 shadow-neon' :
            'bg-slate-500/10 border-slate-500/30 grayscale opacity-70'
        }`}>
        <FlowHandle type="target" position={Position.Top} className="!bg-slate-400" />
        <div className="text-xs font-bold tracking-wider uppercase opacity-70 mb-1">{data.label}</div>
        <div className="text-sm font-semibold">{data.title}</div>
        {data.status === 'current' && (
            <div className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-amber-500 animate-pulse border-2 border-slate-900" />
        )}
        <FlowHandle type="source" position={Position.Bottom} className="!bg-slate-400" />
    </div>
);

const nodeTypes = {
    evolution: EvolutionNode,
};

// --- Data ---
const initialNodes = [
    // Roots
    { id: 'root', type: 'evolution', position: { x: 400, y: 0 }, data: { label: 'ROOT', title: 'Start Phase \n(Stabilization)', status: 'completed' } },

    // Trunk (Level 1)
    { id: 'phase1', type: 'evolution', position: { x: 200, y: 150 }, data: { label: 'PHASE 1', title: 'Admin \nOperations', status: 'completed' } },
    { id: 'phase2', type: 'evolution', position: { x: 400, y: 150 }, data: { label: 'PHASE 2', title: 'Marketplace \nCore', status: 'completed' } },
    { id: 'phase3', type: 'evolution', position: { x: 600, y: 150 }, data: { label: 'PHASE 3', title: 'Financials \n& Ledger', status: 'completed' } },

    // Branches (Level 2)
    { id: 'phase4', type: 'evolution', position: { x: 200, y: 300 }, data: { label: 'PHASE 4', title: 'Localization \n(Global)', status: 'completed' } },
    { id: 'phase5', type: 'evolution', position: { x: 400, y: 300 }, data: { label: 'PHASE 5', title: 'Agent \nIntelligence', status: 'completed' } },
    { id: 'phase6', type: 'evolution', position: { x: 600, y: 300 }, data: { label: 'PHASE 6', title: 'UI/UX \nPolish', status: 'completed' } },

    // Canopy (Level 3 - Current)
    { id: 'phase7', type: 'evolution', position: { x: 400, y: 450 }, data: { label: 'PHASE 7', title: 'DevOps \n& Hygiene', status: 'current' } },

    // Future
    { id: 'phase8', type: 'evolution', position: { x: 400, y: 600 }, data: { label: 'PHASE 8', title: 'Growth \n& Marketing', status: 'future' } },
];

const initialEdges = [
    { id: 'e1', source: 'root', target: 'phase1', animated: true, style: { stroke: '#22c55e' } },
    { id: 'e2', source: 'root', target: 'phase2', animated: true, style: { stroke: '#22c55e' } },
    { id: 'e3', source: 'root', target: 'phase3', animated: true, style: { stroke: '#22c55e' } },
    { id: 'e4', source: 'phase1', target: 'phase4', animated: true, style: { stroke: '#22c55e' } },
    { id: 'e5', source: 'phase2', target: 'phase5', animated: true, style: { stroke: '#22c55e' } },
    { id: 'e6', source: 'phase3', target: 'phase6', animated: true, style: { stroke: '#22c55e' } },
    { id: 'e7', source: 'phase4', target: 'phase7', animated: true, style: { stroke: '#eab308', strokeWidth: 2, strokeDasharray: 5 } },
    { id: 'e8', source: 'phase5', target: 'phase7', animated: true, style: { stroke: '#eab308', strokeWidth: 2, strokeDasharray: 5 } },
    { id: 'e9', source: 'phase6', target: 'phase7', animated: true, style: { stroke: '#eab308', strokeWidth: 2, strokeDasharray: 5 } },
    { id: 'e10', source: 'phase7', target: 'phase8', animated: false, style: { stroke: '#94a3b8', strokeDasharray: 5 } },
];

export default function EvolutionTree() {
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

    const onConnect = useCallback(
        (params) => setEdges((eds) => addEdge(params, eds)),
        [setEdges],
    );

    return (
        <div className="h-full w-full flex flex-col items-center justify-center relative">
            <div className="absolute top-6 left-6 z-10">
                <GlassCard className="p-6 max-w-sm">
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">
                        Project Evolution Tree
                    </h1>
                    <p className="text-sm text-slate-400 mt-2">
                        Visualizing the growth from startup roots to enterprise canopy.
                    </p>
                    <div className="flex gap-4 mt-4 text-xs">
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-500/50 border border-green-500"></div> Completed</div>
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-amber-500/50 border border-amber-500 animate-pulse"></div> Active</div>
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-slate-500/50 border border-slate-500"></div> Future</div>
                    </div>
                </GlassCard>
            </div>

            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                nodeTypes={nodeTypes}
                fitView
                fitViewOptions={{ padding: 0.5 }}
                className="bg-slate-950"
            >
                <Controls className="!bg-slate-800 !border-slate-700 !fill-white" />
                <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#334155" />
            </ReactFlow>
        </div>
    );
}
