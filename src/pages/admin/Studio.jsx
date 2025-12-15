
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
import { Badge } from '@/components/ui/badge';
import { Play, Save, Settings, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

// Backend Integration
import { WorkflowTransformer } from '../../services/agents/WorkflowSchema';
import { workflowService } from '../../services/agents/WorkflowService';

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
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const { screenToFlowPosition } = useReactFlow();
    const [selectedNode, setSelectedNode] = useState(null);
    const [currentWorkflowId, setCurrentWorkflowId] = useState(null);
    const [workflowStatus, setWorkflowStatus] = useState('draft');
    const [workflowVersion, setWorkflowVersion] = useState(1);
    const navigate = useNavigate();

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

    const handleSave = async () => {
        const name = prompt("Name your workflow:", "My New Agent Flow");
        if (!name) return;

        toast.info("Saving Draft...", { description: "Persisting to Supabase..." });
        try {
            // Pass currentWorkflowId to update existing or create new
            const saved = await workflowService.saveWorkflow(name, nodes, edges, currentWorkflowId);
            setCurrentWorkflowId(saved.id);
            setWorkflowStatus(saved.deployment_status);
            setWorkflowVersion(saved.version);

            toast.success("Draft Saved!", { description: `v${saved.version} stored safely.` });
        } catch (e) {
            console.error(e);
            toast.error("Save Failed", { description: e.message });
        }
    }

    const handlePublish = async () => {
        if (!currentWorkflowId) {
            toast.error("Save First", { description: "Please save a draft before publishing." });
            return;
        }

        toast.info("Publishing...", { description: "Promoting to Production... 🚀" });
        try {
            const published = await workflowService.publishWorkflow(currentWorkflowId);
            setWorkflowStatus(published.deployment_status);
            setWorkflowVersion(published.version);
            toast.success("GO LIVE SUCCESSFUL!", { description: `Workflow is now PUBLISHED (v${published.version})` });
        } catch (e) {
            console.error(e);
            toast.error("Publish Failed", { description: e.message });
        }
    }

    const handleLoadWorkflow = async (id) => {
        toast.info("Loading...", { description: "Fetching saved workflow..." });
        try {
            const row = await workflowService.loadWorkflow(id);
            if (row && row.graph_data) {
                setNodes(row.graph_data.nodes || []);
                setEdges(row.graph_data.edges || []);
                setCurrentWorkflowId(row.id);
                setWorkflowStatus(row.deployment_status);
                setWorkflowVersion(row.version);
                toast.success("Loaded!", { description: `Workflow '${row.name}' ready.` });
            }
        } catch (e) {
            console.error(e);
            toast.error("Load Failed", { description: e.message });
        }
    };

    const handleRun = () => {
        toast.info("Compiling Workflow...", { description: "Transforming Graph to Execution Plan..." });

        try {
            // 1. Transform Graph to Linear Workflow
            const executableWorkflow = WorkflowTransformer.toLinearWorkflow(nodes, edges);
            console.log("Executable Workflow:", executableWorkflow);

            if (executableWorkflow.steps.length === 0) {
                toast.error("Workflow Empty", { description: "Please add and connect agent nodes." });
                return;
            }

            // 2. Inject into WorkflowService (Global Singleton)
            workflowService.startCustomWorkflow(executableWorkflow, { source: 'studio_run' });

            toast.success("Workflow Started!", { description: "Redirecting to Board Room for execution..." });

            // 3. Redirect to Board Room to watch it happen
            setTimeout(() => {
                navigate('/admin/board-room');
            }, 1000);

        } catch (error) {
            console.error(error);
            toast.error("Compilation Failed", { description: error.message });
        }
    }

    const handleImportGraph = ({ nodes, edges }) => {
        setNodes(nodes);
        setEdges(edges);
        setCurrentWorkflowId(null); // Reset ID because this is a new generated graph
        setWorkflowStatus('draft');
        setWorkflowVersion(1);
        toast.success("Magic Graph Generated!", { description: "You can now edit and save this workflow." });
    };

    return (
        <div className="flex flex-row h-[calc(100vh-64px)] overflow-hidden bg-slate-950 relative">
            <StudioSidebar onLoadWorkflow={handleLoadWorkflow} onImportGraph={handleImportGraph} />

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
                        <div className="flex items-center gap-2">
                            {workflowStatus === 'published' ? (
                                <Badge variant="default" className="bg-green-500/10 text-green-400 border-green-500/50 hover:bg-green-500/20">
                                    LIVE v{workflowVersion}
                                </Badge>
                            ) : (
                                <Badge variant="outline" className="border-amber-500/50 text-amber-400">
                                    DRAFT v{workflowVersion}
                                </Badge>
                            )}

                            <Button
                                variant="outline"
                                size="sm"
                                className="bg-slate-900 border-slate-700 hover:bg-slate-800 text-slate-300 gap-2"
                                onClick={handleSave}
                            >
                                <Save size={14} /> Save Draft
                            </Button>

                            <Button
                                variant="outline"
                                size="sm"
                                className="bg-indigo-900/20 border-indigo-500/50 hover:bg-indigo-500/30 text-indigo-300 gap-2"
                                onClick={handlePublish}
                            >
                                <Zap size={14} /> Publish
                            </Button>

                            <Button
                                size="sm"
                                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg shadow-purple-500/20 gap-2 transition-all hover:scale-105"
                                onClick={handleRun}
                            >
                                <Play size={14} /> Run Pipeline
                            </Button>
                        </div>
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
