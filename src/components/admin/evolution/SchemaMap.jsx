
import React, { useMemo } from 'react';
import {
    ReactFlow,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    BackgroundVariant,
    Handle,
    Position
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

// --- Custom Node: Database Table ---
const TableNode = ({ data }) => (
    <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-xl overflow-hidden min-w-[200px]">
        {/* Header */}
        <div className="bg-slate-800 px-3 py-2 border-b border-slate-700 flex items-center justify-between">
            <span className="font-bold text-sm text-slate-200">{data.label}</span>
            <span className="text-[10px] bg-slate-700 px-1.5 py-0.5 rounded text-slate-400">table</span>
        </div>
        {/* Columns */}
        <div className="p-2 space-y-1">
            {data.columns.map((col, idx) => (
                <div key={idx} className="flex items-center text-xs text-slate-400">
                    <div className={`w-2 h-2 rounded-full mr-2 ${col.pk ? 'bg-amber-500' : col.fk ? 'bg-blue-500' : 'bg-slate-600'}`} />
                    <span className={col.pk ? 'text-amber-400 font-medium' : 'text-slate-300'}>{col.name}</span>
                    <span className="ml-auto text-[10px] text-slate-500">{col.type}</span>
                </div>
            ))}
        </div>
        <Handle type="target" position={Position.Left} className="!bg-slate-500 !w-2 !h-8 !rounded-sm opacity-0" />
        <Handle type="source" position={Position.Right} className="!bg-slate-500 !w-2 !h-8 !rounded-sm opacity-0" />
    </div>
);

const nodeTypes = {
    table: TableNode,
};

// --- Schema Definition ---
const initialNodes = [
    // Core User & Auth
    {
        id: 'users',
        type: 'table',
        position: { x: 50, y: 300 },
        data: {
            label: 'users',
            columns: [
                { name: 'id', type: 'uuid', pk: true },
                { name: 'email', type: 'text' },
                { name: 'created_at', type: 'timestamp' }
            ]
        }
    },

    // Marketplace Core
    {
        id: 'service_providers',
        type: 'table',
        position: { x: 400, y: 150 },
        data: {
            label: 'service_providers',
            columns: [
                { name: 'id', type: 'uuid', pk: true },
                { name: 'business_name', type: 'text' },
                { name: 'category', type: 'text' },
                { name: 'status', type: 'text' },
                { name: 'created_by', type: 'text', fk: true }
            ]
        }
    },
    {
        id: 'reviews',
        type: 'table',
        position: { x: 750, y: 50 },
        data: {
            label: 'reviews',
            columns: [
                { name: 'id', type: 'uuid', pk: true },
                { name: 'service_provider_id', type: 'uuid', fk: true },
                { name: 'user_id', type: 'uuid', fk: true },
                { name: 'rating', type: 'int' },
                { name: 'comment', type: 'text' }
            ]
        }
    },
    {
        id: 'favorites',
        type: 'table',
        position: { x: 750, y: 250 },
        data: {
            label: 'favorites',
            columns: [
                { name: 'id', type: 'uuid', pk: true },
                { name: 'user_id', type: 'uuid', fk: true },
                { name: 'service_provider_id', type: 'uuid', fk: true }
            ]
        }
    },

    // Agent Brain
    {
        id: 'agent_tasks',
        type: 'table',
        position: { x: 400, y: 500 },
        data: {
            label: 'agent_tasks',
            columns: [
                { name: 'id', type: 'uuid', pk: true },
                { name: 'task', type: 'text' },
                { name: 'assigned_to', type: 'text' },
                { name: 'status', type: 'text' },
                { name: 'result', type: 'text' }
            ]
        }
    },
    {
        id: 'agent_memory',
        type: 'table',
        position: { x: 750, y: 450 },
        data: {
            label: 'agent_memory',
            columns: [
                { name: 'id', type: 'uuid', pk: true },
                { name: 'agent_id', type: 'text', fk: true },
                { name: 'user_id', type: 'text', fk: true },
                { name: 'history', type: 'jsonb' }
            ]
        }
    },
    {
        id: 'agent_files',
        type: 'table',
        position: { x: 750, y: 650 },
        data: {
            label: 'agent_files',
            columns: [
                { name: 'id', type: 'uuid', pk: true },
                { name: 'path', type: 'text' },
                { name: 'content', type: 'text' },
                { name: 'agent_id', type: 'text' }
            ]
        }
    }
];

const initialEdges = [
    // Relation lines
    { id: 'e1', source: 'users', target: 'service_providers', animated: true, style: { stroke: '#64748b' } },
    { id: 'e2', source: 'users', target: 'reviews', animated: true, style: { stroke: '#64748b' } },
    { id: 'e3', source: 'service_providers', target: 'reviews', animated: true, style: { stroke: '#64748b' } },
    { id: 'e4', source: 'users', target: 'favorites', animated: true, style: { stroke: '#64748b' } },
    { id: 'e5', source: 'service_providers', target: 'favorites', animated: true, style: { stroke: '#64748b' } },

    // Agent Links (Implicit via IDs)
    { id: 'e6', source: 'agent_memory', target: 'agent_tasks', animated: true, label: 'context', style: { stroke: '#6366f1', strokeDasharray: '5,5' } },
];

export default function SchemaMap() {
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

    return (
        <div className="h-full w-full flex flex-col items-center justify-center bg-slate-950 relative">
            <div className="absolute top-4 left-4 z-10 pointer-events-none">
                <h2 className="text-xl font-bold text-white mb-1">Cortex Schema</h2>
                <p className="text-sm text-slate-400">Live visualization of the system database.</p>
            </div>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                nodeTypes={nodeTypes}
                fitView
                className="bg-slate-950"
            >
                <Background variant={BackgroundVariant.Lines} gap={40} size={1} color="#1e293b" />
                <Controls className="!bg-slate-800 !border-slate-700 !fill-white" />
            </ReactFlow>
        </div>
    );
}
