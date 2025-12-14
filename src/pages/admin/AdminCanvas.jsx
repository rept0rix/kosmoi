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

    return (
        <div className="w-full h-[calc(100vh-64px)] bg-gray-100 overflow-hidden relative">

            {/* Toolbar */}
            <div className="absolute top-4 left-4 z-50 flex gap-2 bg-white p-2 rounded-lg shadow-md">
                <Button onClick={runCapture} disabled={loading} size="sm">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4 mr-2" />}
                    Capture Screens
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setLastUpdate(Date.now())}>
                    <RefreshCw className="w-4 h-4" />
                </Button>
            </div>

            <TransformWrapper
                initialScale={0.2}
                minScale={0.1}
                maxScale={2}
                centerOnInit
            >
                <TransformComponent wrapperClass="w-full h-full" contentClass="w-full h-full">
                    <div
                        className="relative bg-gray-100"
                        style={{ width: '5000px', height: '4000px' }} // Canvas Size
                    >
                        {SCREENS.map((screen) => (
                            <div
                                key={screen.name}
                                className="absolute bg-white shadow-2xl rounded-lg overflow-hidden border border-gray-200"
                                style={{
                                    left: screen.x,
                                    top: screen.y,
                                    width: '1440px',
                                    height: '900px', // Aspect ratio of screenshot
                                }}
                            >
                                <div className="bg-gray-800 text-white text-xs px-4 py-2 font-mono uppercase tracking-wider">
                                    {screen.name}
                                </div>
                                <img
                                    src={`/screens/${screen.name}.png?t=${lastUpdate}`}
                                    alt={screen.name}
                                    className="w-full h-full object-contain bg-gray-50"
                                    onError={(e) => {
                                        e.currentTarget.onerror = null;
                                        e.currentTarget.src = "https://placehold.co/1440x900?text=Pending+Capture";
                                    }}
                                />
                            </div>
                        ))}
                    </div>
                </TransformComponent>
            </TransformWrapper>
        </div>
    );
}
