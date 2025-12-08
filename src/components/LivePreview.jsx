
import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw, ExternalLink, Maximize2, Minimize2, ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);

const LivePreview = ({
    initialUrl = 'http://localhost:5173',
    onSplitViewToggle,
    isSplitView
}) => {
    const [url, setUrl] = useState(initialUrl);
    const [inputUrl, setInputUrl] = useState(initialUrl);
    const [key, setKey] = useState(0); // Used to force iframe refresh
    const [lastUpdate, setLastUpdate] = useState(null);
    const iframeRef = useRef(null);

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
            <div className="flex-1 relative bg-white">
                <iframe
                    key={key}
                    ref={iframeRef}
                    src={url}
                    className="w-full h-full border-0"
                    title="Live Preview"
                    sandbox="allow-same-origin allow-scripts allow-forms"
                />
            </div>
        </div>
    );
};

export default LivePreview;
