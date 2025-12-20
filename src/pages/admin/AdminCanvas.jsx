import React, { useCallback, useMemo, useState, useRef } from 'react';
import {
    ReactFlow,
    Background,
    Controls,
    MiniMap,
    useNodesState,
    useEdgesState,
    addEdge,
    Panel,
    ReactFlowProvider
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import LiveScreenNode from './studio/nodes/LiveScreenNode';
import ShapeNode from './studio/nodes/ShapeNode';
import TextNode from './studio/nodes/TextNode';
import DesignToolbar from './studio/DesignToolbar';
import StudioSidebar from './studio/StudioSidebar';
import StudioProperties from './studio/StudioProperties';
import DesignPrompt from './studio/DesignPrompt';
import ImageUploadZone from './studio/ImageUploadZone';
import { GeminiVisionService } from '@/services/ai/GeminiVisionService';
import { NodeGenerator } from '@/pages/admin/studio/NodeGenerator';
import { CodeExporter } from '@/pages/admin/studio/CodeExporter';
import { toast } from 'sonner';
import { DesignAgent } from '@/features/agents/services/DesignAgent';

// ... (existing imports)

const AdminCanvasContent = () => {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [reactFlowInstance, setReactFlowInstance] = useState(null);
    const [selectedNodeId, setSelectedNodeId] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [showUploadZone, setShowUploadZone] = useState(false);
    const reactFlowWrapper = useRef(null);

    const onConnect = useCallback(
        (params) => setEdges((eds) => addEdge(params, eds)),
        [setEdges]
    );

    const onDragOver = useCallback((event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const onDrop = useCallback(
        (event) => {
            event.preventDefault();

            const type = event.dataTransfer.getData('application/reactflow');

            // check if the dropped element is valid
            if (typeof type === 'undefined' || !type) {
                return;
            }

            const position = reactFlowInstance.screenToFlowPosition({
                x: event.clientX,
                y: event.clientY,
            });
            const newNode = {
                id: `dndnode_${type}_${Date.now()}`,
                type,
                position,
                data: { label: `${type} node` },
            };

            setNodes((nds) => nds.concat(newNode));
        },
        [reactFlowInstance, setNodes]
    );

    const onAddNode = useCallback((type, data) => {
        if (type === 'analyze') {
            setShowUploadZone(true);
            return;
        }

        if (type === 'export') {
            const code = CodeExporter.generateCode(nodes);
            navigator.clipboard.writeText(code);
            toast.success("React code copied to clipboard!");
            console.log("Generated Code:\n", code);
            return;
        }

        const id = `node-${Date.now()}`;
        // ... (rest of logic)
        const newNode = {
            id,
            type,
            position: { x: 100, y: 100 },
            data,
        };
        setNodes((nds) => nds.concat(newNode));
    }, [setNodes, nodes]); // Added nodes dependency


    // Update Node Data from Properties Panel
    const updateNodeData = useCallback((id, newData) => {
        setNodes((nds) =>
            nds.map((node) => {
                if (node.id === id) {
                    return { ...node, data: newData };
                }
                return node;
            })
        );
    }, [setNodes]);

    // Delete Node
    const deleteNode = useCallback((id) => {
        setNodes((nds) => nds.filter((node) => node.id !== id));
        setSelectedNodeId(null);
    }, [setNodes]);

    // Selection Handling
    const onSelectionChange = useCallback(({ nodes }) => {
        if (nodes.length > 0) {
            setSelectedNodeId(nodes[0].id);
        } else {
            setSelectedNodeId(null);
        }
    }, []);

    const selectedNode = useMemo(() => {
        return nodes.find((n) => n.id === selectedNodeId);
    }, [nodes, selectedNodeId]);

    const handleDesignPrompt = async (prompt) => {
        setIsGenerating(true);
        try {
            const result = await DesignAgent.generateLayout(prompt, nodes);
            if (result && result.nodes) {
                const newNodes = result.nodes.map(n => ({
                    ...n,
                    id: n.id || `gen-${Date.now()}-${Math.random()}`
                }));
                const newEdges = result.edges || [];
                setNodes((nds) => [...nds, ...newNodes]);
                setEdges((eds) => [...eds, ...newEdges]);
            }
        } catch (error) {
            console.error("Design Agent failed:", error);
            alert("Design Agent failed to generate layout.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleImageSelected = async (imageData) => {
        setIsGenerating(true);
        toast.info("Analyzing UI image...");

        try {
            const components = await GeminiVisionService.decomposeUI(imageData);
            if (components && components.length > 0) {
                const generatedNodes = NodeGenerator.generateNodes(components);

                // Center the new nodes roughly
                const offsetNodes = generatedNodes.map(n => ({
                    ...n,
                    position: { x: n.position.x + 100, y: n.position.y + 100 }
                }));

                setNodes((nds) => [...nds, ...offsetNodes]);
                toast.success(`Generated ${offsetNodes.length} UI components!`);
                setShowUploadZone(false);
            } else {
                toast.warning("No components identified in the image.");
            }
        } catch (error) {
            console.error("Decomposition failed:", error);
            toast.error("Failed to decompose UI. Check API Key.");
        } finally {
            setIsGenerating(false);
        }
    };

    // Copy/Paste Logic
    const [clipboard, setClipboard] = useState(null);

    React.useEffect(() => {
        const handleKeyDown = (e) => {
            // Check for Ctrl+C or Cmd+C
            if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
                if (selectedNodeId) {
                    const nodeToCopy = nodes.find(n => n.id === selectedNodeId);
                    if (nodeToCopy) {
                        setClipboard(nodeToCopy);
                        console.log('Copied node:', nodeToCopy.id);
                        // Optional: Show toast
                    }
                }
            }

            // Check for Ctrl+V or Cmd+V
            if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
                if (clipboard) {
                    // Create a new ID
                    const newId = `${clipboard.type}-${Date.now()}`;

                    // Offset position slightly
                    const newPosition = {
                        x: clipboard.position.x + 50,
                        y: clipboard.position.y + 50
                    };

                    const newNode = {
                        ...clipboard,
                        id: newId,
                        position: newPosition,
                        selected: true // Select the new node
                    };

                    setNodes((nds) => nds.map(n => ({ ...n, selected: false })).concat(newNode));
                    setSelectedNodeId(newId);
                    console.log('Pasted node:', newId);
                }
            }

            // Delete key
            if (e.key === 'Delete' || e.key === 'Backspace') {
                // Only delete if not editing text/input
                if (document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
                    if (selectedNodeId) {
                        deleteNode(selectedNodeId);
                    }
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [selectedNodeId, nodes, clipboard, deleteNode, setNodes]);

    const nodeTypes = useMemo(() => ({
        'live-screen': LiveScreenNode,
        'shape': ShapeNode,
        'text': TextNode,
    }), []);

    return (
        <div className="flex w-full h-full overflow-hidden bg-slate-50 text-slate-900" dir="ltr">
            {/* Left Sidebar */}
            <StudioSidebar
                nodes={nodes}
                onNodeSelect={(nodeId) => {
                    setSelectedNodeId(nodeId);
                    // Optional: Center view on node
                    const node = nodes.find(n => n.id === nodeId);
                    if (node && reactFlowInstance) {
                        reactFlowInstance.setCenter(node.position.x + 150, node.position.y + 150, { zoom: 1, duration: 800 });
                    }
                }}
                setNodes={setNodes}
            />

            {/* Main Canvas Area */}
            <div className="flex-1 relative h-full" ref={reactFlowWrapper}>
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    onInit={setReactFlowInstance}
                    onDrop={onDrop}
                    onDragOver={onDragOver}
                    onSelectionChange={onSelectionChange}
                    nodeTypes={nodeTypes}
                    fitView
                    className="bg-slate-50"
                >
                    {/* @ts-ignore */}
                    <Background color="#cbd5e1" gap={20} variant="dots" />
                    <Controls />
                    <MiniMap nodeColor="#3b82f6" style={{ height: 100 }} />

                    <Panel position="top-left" className="bg-white/80 backdrop-blur p-2 rounded shadow-sm border border-slate-200 ml-4 mt-4">
                        <h3 className="font-bold text-sm text-slate-800">Kosmoi Studio</h3>
                        <p className="text-[10px] text-slate-500">Design Workshop Environment</p>
                    </Panel>

                    <DesignToolbar onAddNode={onAddNode} />
                    <DesignPrompt onPromptSubmit={handleDesignPrompt} isGenerating={isGenerating} />

                    {showUploadZone && (
                        <ImageUploadZone
                            onImageSelected={handleImageSelected}
                            onClose={() => setShowUploadZone(false)}
                            isAnalyzing={isGenerating}
                        />
                    )}
                </ReactFlow>
            </div>

            {/* Right Sidebar - Properties */}
            <StudioProperties
                selectedNode={selectedNode}
                onChange={updateNodeData}
                onDelete={deleteNode}
            />
        </div>
    );
};

export default function AdminCanvas() {
    return (
        <ReactFlowProvider>
            <AdminCanvasContent />
        </ReactFlowProvider>
    );
}
