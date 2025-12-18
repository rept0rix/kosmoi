
import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw, ExternalLink, Maximize2, Minimize2, ArrowLeft, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from '@/lib/instance';
import { HeatmapService } from '@/services/HeatmapService';
import HeatmapOverlay from '@/components/HeatmapOverlay';

const LivePreview = ({
    initialUrl = 'http://localhost:5173',
    onSplitViewToggle,
    isSplitView,
    additionalActions,
    overlay
}) => {
    const [url, setUrl] = useState(initialUrl);
    const [inputUrl, setInputUrl] = useState(initialUrl);
    const [key, setKey] = useState(0); // Used to force iframe refresh
    const [lastUpdate, setLastUpdate] = useState(null);
    const iframeRef = useRef(null);
    const containerRef = useRef(null);

    // UX Vision / Heatmap State
    const [showHeatmap, setShowHeatmap] = useState(false);
    const [heatmapData, setHeatmapData] = useState([]);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

    // Measure container for heatmap
    useEffect(() => {
        if (!containerRef.current) return;
        const updateDims = () => {
            const { clientWidth, clientHeight } = containerRef.current;
            setDimensions({ width: clientWidth, height: clientHeight });
        };
        updateDims();
        window.addEventListener('resize', updateDims);
        return () => window.removeEventListener('resize', updateDims);
    }, []);

    // Toggle Heatmap Logic
    const toggleHeatmap = () => {
        if (!showHeatmap) {
            // Generating...
            const data = HeatmapService.generateHeatmapData(dimensions.width, dimensions.height);
            setHeatmapData(data);
        }
        setShowHeatmap(!showHeatmap);
    };

    // Auto-refresh on task completion
    useEffect(() => {
        console.log("⚡ LivePreview: Subscribing to task updates...");
        const subscription = supabase
            .channel('tasks-monitor')
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'agent_tasks',
                filter: "status=eq.completed"
            }, (payload) => {
                console.log("⚡ Task Completed! Refreshing preview...", payload);
                refresh();
                setLastUpdate(`Task completed: ${payload.new.title}`);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
    }, []);

    const refresh = () => {
        setKey(prev => prev + 1); // Force re-mount of iframe to ensure clean state
    };

    const handleUrlSubmit = (e) => {
        e.preventDefault();
        let target = inputUrl;
        if (!target.startsWith('http')) {
            target = `http://localhost:5173${target.startsWith('/') ? '' : '/'}${target}`;
        }
        setUrl(target);
    };

    return (
        <div className="flex flex-col h-full bg-white border-l shadow-xl">
            {/* Browser Toolbar */}
            <div className="bg-gray-100 border-b p-2 flex items-center gap-2">
                <div className="flex gap-1">
                    <Button size="icon" variant="ghost" className="h-6 w-6" disabled>
                        <ArrowLeft className="w-3 h-3 text-gray-400" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={refresh}>
                        <RefreshCw className="w-3 h-3 text-gray-600" />
                    </Button>
                </div>

                <form onSubmit={handleUrlSubmit} className="flex-1">
                    <Input
                        value={inputUrl}
                        onChange={(e) => setInputUrl(e.target.value)}
                        className="h-7 text-xs bg-white border-gray-200 focus-visible:ring-1"
                    />
                </form>

                <div className="flex gap-1">
                    <Button
                        size="icon"
                        variant={showHeatmap ? "default" : "ghost"}
                        className={`h-6 w-6 ${showHeatmap ? 'bg-purple-600 text-white hover:bg-purple-700' : 'text-purple-600 hover:bg-purple-50'}`}
                        onClick={toggleHeatmap}
                        title="Toggle UX Vision (Heatmap)"
                    >
                        {showHeatmap ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                    </Button>

                    {additionalActions}
                    <Button
                        size="icon"
                        variant="ghost"
                        className={`h-6 w-6 ${isSplitView ? 'text-blue-600 bg-blue-100' : 'text-gray-500'}`}
                        onClick={onSplitViewToggle}
                        title={isSplitView ? "Exit Split View" : "Enter Split View"}
                    >
                        {isSplitView ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
                    </Button>
                    <a href={url} target="_blank" rel="noopener noreferrer">
                        <Button size="icon" variant="ghost" className="h-6 w-6 text-gray-500">
                            <ExternalLink className="w-3 h-3" />
                        </Button>
                    </a>
                </div>
            </div>

            {/* Connection Status / Last Update Toast */}
            {lastUpdate && (
                <div className="bg-green-50 text-green-700 text-[10px] px-2 py-1 flex justify-between items-center animate-in fade-in slide-in-from-top-1">
                    <span>{lastUpdate}</span>
                    <button onClick={() => setLastUpdate(null)} className="ml-2 hover:bg-green-100 rounded">×</button>
                </div>
            )}

            {/* Iframe */}
            <div className="flex-1 relative bg-white" ref={containerRef}>
                <iframe
                    key={key}
                    ref={iframeRef}
                    src={url}
                    className="w-full h-full border-0 relative z-0"
                    title="Live Preview"
                    sandbox="allow-same-origin allow-scripts allow-forms"
                />

                {/* Heatmap Layer */}
                <HeatmapOverlay
                    width={dimensions.width}
                    height={dimensions.height}
                    data={heatmapData}
                    visible={showHeatmap}
                />

                {overlay}
            </div>
        </div>
    );
};

export default LivePreview;
