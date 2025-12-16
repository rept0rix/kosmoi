import React, { useState, useEffect } from 'react';
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { Loader2, Camera, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Mock list of screens - in a real app, this could be dynamic from the file system
const SCREENS = [
    { name: 'Home', x: 0, y: 0 },
    { name: 'Business', x: 1600, y: 0 },
    { name: 'Login', x: 3200, y: 0 },
    { name: 'App', x: 0, y: 1200 },
    { name: 'TripPlanner', x: 1600, y: 1200 },
    { name: 'AIChat', x: 3200, y: 1200 },
    { name: 'Blog', x: 0, y: 2400 },
    { name: 'BusinessInfo', x: 1600, y: 2400 },
    { name: 'ServiceProviders', x: 3200, y: 2400 },
];

export default function AdminCanvas() {
    const [images, setImages] = useState({});
    const [loading, setLoading] = useState(false);
    const [lastUpdate, setLastUpdate] = useState(Date.now());

    // Effect to check which images exist
    useEffect(() => {
        // In a real generic implementation, we'd list the directory. 
        // Here we just try to load the defined ones.
        setLastUpdate(Date.now());
    }, []);

    const runCapture = async () => {
        setLoading(true);
        try {
            // This would ideally call an API that triggers the backend script
            // For now, we'll simulate a delay and ask the user to run the script
            await new Promise(r => setTimeout(r, 2000));
            alert("Please run 'node scripts/capture_screens.js' in your terminal to update screenshots!");
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    // Controls for the canvas
    const Controls = ({ zoomIn, zoomOut, resetTransform }) => (
        <div className="absolute top-4 left-4 z-50 flex gap-2 bg-white p-2 rounded-lg shadow-md max-w-[90vw] flex-wrap">
            <Button onClick={runCapture} disabled={loading} size="sm">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4 mr-2" />}
                <span className="hidden sm:inline">Capture</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setLastUpdate(Date.now())} title="Refresh Images">
                <RefreshCw className="w-4 h-4" />
            </Button>
            <div className="w-px h-6 bg-gray-200 mx-1"></div>
            <Button variant="outline" size="sm" onClick={() => zoomIn()} title="Zoom In">+</Button>
            <Button variant="outline" size="sm" onClick={() => zoomOut()} title="Zoom Out">-</Button>
            <Button variant="outline" size="sm" onClick={() => resetTransform()} title="Reset">x</Button>
        </div>
    );

    return (
        <div className="w-full h-[calc(100vh-64px)] bg-gray-100 overflow-hidden relative">
            <TransformWrapper
                initialScale={0.2}
                minScale={0.1}
                maxScale={4}
                centerOnInit
                wheel={{ step: 0.1 }}
            >
                {({ zoomIn, zoomOut, resetTransform }) => (
                    <>
                        <Controls zoomIn={zoomIn} zoomOut={zoomOut} resetTransform={resetTransform} />
                        <TransformComponent wrapperClass="w-full h-full" contentClass="w-full h-full">
                            <div
                                className="relative bg-gray-100 flex flex-wrap gap-8 p-10 origin-top-left"
                                style={{ width: '5000px', height: '4000px' }}
                            >
                                {SCREENS.map((screen) => (
                                    <div
                                        key={screen.name}
                                        className="absolute bg-white shadow-2xl rounded-lg overflow-hidden border border-gray-200 transition-shadow hover:shadow-orange-500/20"
                                        style={{
                                            left: screen.x,
                                            top: screen.y,
                                            width: '1440px',
                                            height: '900px',
                                        }}
                                    >
                                        <div className="bg-slate-800 text-white text-xs px-4 py-2 font-mono uppercase tracking-wider flex justify-between items-center">
                                            <span>{screen.name}</span>
                                            <span className="opacity-50">1440x900</span>
                                        </div>
                                        <div className="w-full h-full bg-slate-50 relative group">
                                            <img
                                                src={`/screens/${screen.name}.png?t=${lastUpdate}`}
                                                alt={screen.name}
                                                className="w-full h-full object-contain"
                                                loading="lazy"
                                                onError={(e) => {
                                                    // Prevent infinite loop if placeholder fails
                                                    e.currentTarget.onerror = null;
                                                    // Use a simple colored div fallback if needed, or placehold.co
                                                    e.currentTarget.src = `https://placehold.co/1440x900/e2e8f0/475569?text=${screen.name}`;
                                                }}
                                            />
                                            {/* Overlay for interaction hint */}
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors pointer-events-none" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </TransformComponent>
                    </>
                )}
            </TransformWrapper>
        </div>
    );
}
