
import React, { useState, useRef, useCallback } from 'react';
import {
    ReactFlow,
    ReactFlowProvider,
    addEdge,
    useNodesState,
    useEdgesState,
    Controls,
    Background,
    BackgroundVariant,
    useReactFlow,
    Panel
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import StudioSidebar from './studio/StudioSidebar';
import StudioNode from './studio/StudioNode';
import StudioInspector from './studio/StudioInspector';
import { Button } from '@/components/ui/button';
import { Play, Save, Settings } from 'lucide-react';
import { toast } from 'sonner';

const nodeTypes = {
    studioNode: StudioNode,
};

const initialNodes = [
    {
        id: '1',
        type: 'studioNode',
        position: { x: 250, y: 200 },
        data: { label: 'Startup Launch Blueprint', type: 'blueprint_startup', subLabel: 'Workflow', status: 'idle' },
    },
];

let id = 0;
const getId = () => `dndnode_${id++}`;

const StudioFlow = () => {
    const reactFlowWrapper = useRef(null);
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const { screenToFlowPosition } = useReactFlow();
    const [selectedNode, setSelectedNode] = useState(null);

    const onConnect = useCallback(
        (params) => setEdges((eds) => addEdge({ ...params, animated: true, style: { stroke: '#6366f1' } }, eds)),
        [setEdges],
    );

    const onDragOver = useCallback((event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const onDrop = useCallback(
        (event) => {
            event.preventDefault();

            const type = event.dataTransfer.getData('application/reactflow');
            const label = event.dataTransfer.getData('application/label');
            const color = event.dataTransfer.getData('application/color'); // Currently unused but good for future metadata

            // check if the dropped element is valid
            if (typeof type === 'undefined' || !type) {
                return;
            }

            const position = screenToFlowPosition({
                x: event.clientX,
                y: event.clientY,
            });

            const newNode = {
                id: getId(),
                type: 'studioNode',
                position,
                data: { label: label, type: type, subLabel: type.split('_')[0], status: 'idle' },
            };

            setNodes((nds) => nds.concat(newNode));
        },
        [screenToFlowPosition, setNodes],
    );

    const onNodeClick = useCallback((event, node) => {
        setSelectedNode(node);
    }, []);

    const onPaneClick = useCallback(() => {
        setSelectedNode(null);
    }, []);

    const handleUpdateNode = (nodeId, newData) => {
        setNodes((nds) => nds.map((node) => {
            if (node.id === nodeId) {
                return { ...node, data: newData };
            }
            return node;
        }));
        toast.success("Node updated");
    };

    const handleDeleteNode = (nodeId) => {
        setNodes((nds) => nds.filter(n => n.id !== nodeId));
        setSelectedNode(null);
        toast.info("Node deleted");
    };

    const handleSave = () => {
        toast.success("Workflow saved!", { description: "Your agent graph has been updated." });
        console.log("Nodes:", nodes);
        console.log("Edges:", edges);
    }

    const handleRun = () => {
        toast.info("Starting Workflow...", { description: "Initializing agents..." });

        // Visual Simulation: Light up edges and nodes sequentially
        setNodes((nds) => nds.map(node => ({
            ...node,
            data: { ...node.data, status: 'active' }
        })));

        // Animate edges (mock)
        const newEdges = edges.map(edge => ({
            ...edge,
            animated: true,
            style: { stroke: '#22c55e', strokeWidth: 2 }
        }));
        setEdges(newEdges);

        setTimeout(() => {
            setNodes((nds) => nds.map(node => ({
                ...node,
                data: { ...node.data, status: 'success' }
            })));
            toast.success("Workflow Complete");

            // Revert styles after delay
            setTimeout(() => {
                setNodes((nds) => nds.map(node => ({
                    ...node,
                    data: { ...node.data, status: 'idle' }
                })));
                setEdges((eds) => eds.map(edge => ({
                    ...edge,
                    style: { stroke: '#6366f1' }
                })));
            }, 2000);

        }, 3000);
    }

    return (
        <div className="flex flex-row h-[calc(100vh-64px)] overflow-hidden bg-slate-950 relative">
            <StudioSidebar />

            <div className="flex-1 h-full relative" ref={reactFlowWrapper}>
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    onDragOver={onDragOver}
                    onDrop={onDrop}
                    onNodeClick={onNodeClick}
                    onPaneClick={onPaneClick}
                    nodeTypes={nodeTypes}
                    fitView
                    className="bg-slate-950"
                    snapToGrid={true}
                    snapGrid={[15, 15]}
                >
                    <Background color="#334155" variant={BackgroundVariant.Dots} gap={20} size={1} />
                    <Controls className="!bg-slate-800 !border-slate-700 !fill-white" />

                    <Panel position="top-right" className="flex gap-2">
                        <Button onClick={handleRun} size="sm" className="bg-green-600 hover:bg-green-700 text-white gap-2">
                            <Play size={16} fill="currentColor" /> Run Pipeline
                        </Button>
                        <Button onClick={handleSave} size="sm" variant="outline" className="border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800 gap-2">
                            <Save size={16} /> Save
                        </Button>
                        <Button size="sm" variant="ghost" className="text-slate-400 hover:text-white">
                            <Settings size={16} />
                        </Button>
                    </Panel>
                </ReactFlow>
            </div>

            {/* Right Sidebar - Inspector */}
            {selectedNode && (
                <StudioInspector
                    selectedNode={selectedNode}
                    onUpdateNode={handleUpdateNode}
                    onDeleteNode={handleDeleteNode}
                    onClose={() => setSelectedNode(null)}
                />
            )}
        </div>
    );
};

export default function Studio() {
    return (
        <ReactFlowProvider>
            <StudioFlow />
        </ReactFlowProvider>
    );
}
