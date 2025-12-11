
import React, { useCallback } from 'react';
import {
    ReactFlow,
    MiniMap,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    addEdge,
} from '@xyflow/react';

import '@xyflow/react/dist/style.css';

const initialNodes = [
    // Roles
    { id: 'guest', position: { x: 250, y: 0 }, data: { label: '👤 Guest' }, style: { background: '#334155', color: '#fff', width: 100 } },
    { id: 'user', position: { x: 100, y: 150 }, data: { label: '🔑 User' }, style: { background: '#2563eb', color: '#fff', width: 100 } },
    { id: 'admin', position: { x: 400, y: 150 }, data: { label: '🛡️ Admin' }, style: { background: '#d97706', color: '#fff', width: 100 } },
    { id: 'vendor', position: { x: 700, y: 150 }, data: { label: '💼 Vendor' }, style: { background: '#16a34a', color: '#fff', width: 100 } },

    // Public Pages
    { id: 'landing', position: { x: 250, y: 100 }, data: { label: 'Landing Page' } },
    { id: 'about', position: { x: 150, y: 300 }, data: { label: 'About Us' }, parentId: 'landing' },
    { id: 'pricing', position: { x: 350, y: 300 }, data: { label: 'Pricing' }, parentId: 'landing' },

    // App Pages
    { id: 'boardroom', position: { x: 0, y: 300 }, data: { label: '🧠 Board Room' }, style: { background: '#dbeafe', border: '1px solid #2563eb' } },
    { id: 'mapview', position: { x: 100, y: 400 }, data: { label: '🗺️ Map View' } },

    // Admin Pages
    { id: 'dashboard', position: { x: 400, y: 300 }, data: { label: '📊 Dashboard' }, style: { background: '#fef3c7', border: '1px solid #d97706' } },
    { id: 'users', position: { x: 350, y: 400 }, data: { label: 'User Mgmt' } },
    { id: 'crm', position: { x: 450, y: 400 }, data: { label: 'CRM' } },

    // Vendor Pages
    { id: 'vendorlite', position: { x: 700, y: 300 }, data: { label: '📱 Vendor Lite' }, style: { background: '#dcfce7', border: '1px solid #16a34a' } },
];

const initialEdges = [
    { id: 'e1-1', source: 'guest', target: 'landing' },

    { id: 'e2-1', source: 'landing', target: 'boardroom', label: 'Login', animated: true },
    { id: 'e2-2', source: 'user', target: 'boardroom' },
    { id: 'e2-3', source: 'boardroom', target: 'mapview' },

    { id: 'e3-1', source: 'admin', target: 'dashboard' },
    { id: 'e3-2', source: 'dashboard', target: 'users' },
    { id: 'e3-3', source: 'dashboard', target: 'crm' },

    { id: 'e4-1', source: 'vendor', target: 'vendorlite' },
];

export default function SystemMap() {
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

    const onConnect = useCallback(
        (params) => setEdges((eds) => addEdge(params, eds)),
        [setEdges],
    );

    return (
        <div style={{ width: '100vw', height: '100vh', background: '#f8fafc' }}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                fitView
            >
                <Controls />
                <MiniMap />
                <Background variant="dots" gap={12} size={1} />

                <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 5, background: 'white', padding: 10, borderRadius: 5, boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
                    <h1 className="font-bold text-lg">Kosmoi System Architecture</h1>
                    <p className="text-sm text-gray-500">Live visualization of system nodes</p>
                </div>
            </ReactFlow>
        </div>
    );
}
