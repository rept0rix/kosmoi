import React from 'react';
import { screenRegistry } from './screenRegistry';
import { Layout, FilePlus, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import PricingModal from '@/components/payments/PricingModal';

export default function StudioSidebar({ nodes = [], onNodeSelect, setNodes }) {
    const [activeTab, setActiveTab] = React.useState('assets'); // 'assets' | 'layers'
    const [filterStatus, setFilterStatus] = React.useState('all'); // 'all' | 'live' | 'dev' | 'draft'

    const onDragStart = (event, nodeType, screenId, label) => {
        event.dataTransfer.setData('application/reactflow', nodeType);
        event.dataTransfer.setData('screenId', screenId || '');
        event.dataTransfer.setData('label', label || '');
        event.dataTransfer.effectAllowed = 'move';
    };

    const handleDeployAll = () => {
        if (!setNodes) return;

        const newNodes = [];
        const COLUMNS = 4;
        const SPACING_X = 500;
        const SPACING_Y = 800; // ample space for height

        Object.entries(screenRegistry).forEach(([key, value], index) => {
            const row = Math.floor(index / COLUMNS);
            const col = index % COLUMNS;

            newNodes.push({
                id: `deployed-${key}-${Date.now()}`,
                type: 'live-screen',
                position: { x: col * SPACING_X, y: row * SPACING_Y },
                data: { screenId: key, status: 'draft' }, // Default to draft
            });
        });

        if (window.confirm(`This will add ${newNodes.length} screens to the canvas. Continue?`)) {
            setNodes((nds) => [...nds, ...newNodes]);
        }
    };

    // Filter nodes for Layers view
    const visibleNodes = React.useMemo(() => {
        return nodes.filter(n => {
            if (n.type !== 'live-screen') return false; // Only show screens in layers for now? Or all?
            if (filterStatus === 'all') return true;
            return n.data?.status === filterStatus;
        });
    }, [nodes, filterStatus]);

    const getStatusColor = (status) => {
        switch (status) {
            case 'live': return 'bg-green-100 text-green-700 border-green-200';
            case 'dev': return 'bg-orange-100 text-orange-700 border-orange-200';
            case 'draft': return 'bg-gray-100 text-gray-600 border-gray-200';
            default: return 'bg-slate-100 text-slate-600 border-slate-200';
        }
    };

    return (
        <div className="w-72 h-full bg-white border-r border-gray-200 flex flex-col shadow-sm z-10 transition-all">
            {/* Header / Tabs */}
            <div className="flex border-b border-gray-100">
                <button
                    onClick={() => setActiveTab('assets')}
                    className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'assets' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    <Layout size={16} /> Assets
                </button>
                <button
                    onClick={() => setActiveTab('layers')}
                    className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'layers' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    <Monitor size={16} /> Layers ({visibleNodes.length})
                </button>
            </div>

            {/* Content Area */}
            <ScrollArea className="flex-1 bg-slate-50/50">
                <div className="p-4 space-y-6">

                    {activeTab === 'assets' && (
                        <>
                            {/* Deploy All Action */}
                            <div className="mb-6">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleDeployAll}
                                    className="w-full border-dashed border-blue-300 text-blue-600 hover:bg-blue-50"
                                >
                                    <Layout size={14} className="mr-2" /> Deploy All Screens
                                </Button>
                            </div>

                            <div>
                                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Library</h4>
                                <div className="space-y-2">
                                    {Object.entries(screenRegistry).map(([key, value]) => (
                                        <div
                                            key={key}
                                            className="p-2 bg-white border border-slate-200 rounded cursor-grab hover:border-blue-300 hover:shadow-sm flex items-center gap-2 transition-all group"
                                            draggable
                                            onDragStart={(event) => onDragStart(event, 'live-screen', key, value.name)}
                                        >
                                            <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                                                <Monitor size={16} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-slate-700 truncate">{value.name}</p>
                                                <p className="text-[10px] text-slate-400 truncate">{key}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="mt-6">
                                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Tools</h4>
                                <div
                                    className="p-2 border border-dashed border-yellow-400 bg-yellow-50 rounded cursor-grab hover:bg-yellow-100 flex items-center gap-2 transition-colors"
                                    draggable
                                    onDragStart={(event) => onDragStart(event, 'live-screen', 'new-draft', 'New Draft Screen')}
                                >
                                    <FilePlus size={14} className="text-yellow-600" />
                                    <span className="text-sm font-medium text-yellow-700">Draft Placeholder</span>
                                </div>
                            </div>
                        </>
                    )}

                    {activeTab === 'layers' && (
                        <div className="space-y-4">
                            {/* Filters */}
                            <div className="flex gap-1 p-1 bg-slate-200 rounded-lg">
                                {['all', 'live', 'dev', 'draft'].map(status => (
                                    <button
                                        key={status}
                                        onClick={() => setFilterStatus(status)}
                                        className={`flex-1 py-1 text-[10px] font-bold uppercase rounded-md transition-all ${filterStatus === status ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        {status}
                                    </button>
                                ))}
                            </div>

                            <div className="space-y-2">
                                {visibleNodes.length === 0 ? (
                                    <p className="text-center text-xs text-gray-400 py-8 italic">No nodes found.</p>
                                ) : (
                                    visibleNodes.map((node) => {
                                        const screenName = node.data?.screenId ? (screenRegistry[node.data.screenId]?.name || node.data.screenId) : node.type;
                                        const status = node.data?.status || 'draft';

                                        return (
                                            <div
                                                key={node.id}
                                                onClick={() => onNodeSelect && onNodeSelect(node.id)}
                                                className={`p-2 bg-white border rounded cursor-pointer hover:shadow-md flex items-center justify-between group transition-all ${node.selected ? 'ring-2 ring-blue-500 border-transparent' : 'border-slate-200'}`}
                                            >
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <div className={`w-2 h-2 rounded-full ${status === 'live' ? 'bg-green-500' : status === 'dev' ? 'bg-orange-400' : 'bg-gray-300'}`} />
                                                    <span className="text-sm font-medium text-slate-700 truncate max-w-[120px]" title={screenName}>
                                                        {screenName}
                                                    </span>
                                                </div>
                                                <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${getStatusColor(status)}`}>
                                                    {status}
                                                </span>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    )}

                </div>
            </ScrollArea>

            {/* Footer with Upgrade Button */}
            <div className="p-4 border-t border-gray-100 bg-gray-50">
                <PricingModal
                    trigger={
                        <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white shadow-md">
                            Upgrade to Pro
                        </Button>
                    }
                />
            </div>
        </div>
    );
}
