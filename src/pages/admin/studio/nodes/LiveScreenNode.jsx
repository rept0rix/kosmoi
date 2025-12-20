import { useState, useEffect } from 'react';
import { Smartphone, Monitor, AlertCircle } from 'lucide-react';
import React, { Suspense } from 'react';
// @ts-ignore
import { Handle, Position } from '@xyflow/react';
import { AuthContext } from '@/features/auth/context/AuthContext';
import { screenRegistry } from '../screenRegistry';

// Mock Auth Context for Studio
const MockAuthProvider = ({ children, isAuthenticated = true, userRole = 'admin' }) => {
    const mockValue = {
        user: isAuthenticated ? { id: 'mock-user', role: userRole } : null,
        loading: false,
        session: isAuthenticated ? { access_token: 'mock-token' } : null,
        signIn: async () => { },
        signOut: async () => { },
        userRole,
    };

    return (
        <AuthContext.Provider value={mockValue}>
            {children}
        </AuthContext.Provider>
    );
};

export default function LiveScreenNode({ data }) {
    // Default to 'desktop' if not specified, user complained about mobile view destroying layout
    const { screenId, width: initialWidth = 400, height: initialHeight = 600, status = 'live' } = data;
    const Screen = screenRegistry[screenId]?.component;

    // Internal state for device mode
    const [mode, setMode] = useState('desktop'); // default to desktop to fix resolution issue
    const [dimensions, setDimensions] = useState({ width: 1280, height: 800 });

    useEffect(() => {
        if (mode === 'mobile') {
            setDimensions({ width: 375, height: 667 });
        } else {
            setDimensions({ width: 1280, height: 800 });
        }
    }, [mode]);

    // Calculate scale to fit in the node if it's huge, or just let the node be huge?
    // User wants to see it properly. Let's make the node container resizable or scrollable?
    // Status-based styling
    const statusStyles = {
        live: { border: 'border-green-500', bg: 'bg-green-50', badge: 'bg-green-100 text-green-700', label: 'LIVE' },
        dev: { border: 'border-orange-400', bg: 'bg-orange-50', badge: 'bg-orange-100 text-orange-700', label: 'DEV' },
        draft: { border: 'border-gray-400 border-dashed', bg: 'bg-gray-50', badge: 'bg-gray-200 text-gray-700', label: 'DRAFT' }
    };

    // Fallback to draft style if status is unknown
    const currentStyle = statusStyles[status] || statusStyles.draft;
    const isDraft = status === 'draft'; // Keep compatible with existing logic if needed

    if (!Screen) {
        return (
            <div className={`border-2 border-dashed ${currentStyle.border} ${currentStyle.bg} p-4 rounded text-gray-700 w-64 h-32 flex items-center justify-center flex-col gap-2`}>
                <AlertCircle className={status === 'dev' ? 'text-orange-500' : 'text-gray-400'} />
                <span className="font-bold">Draft Screen</span>
                <span className="text-xs">{screenId} (Not Created)</span>
            </div>
        );
    }

    return (
        <div
            className={`shadow-xl rounded-lg overflow-hidden border transition-all duration-300 flex flex-col ${currentStyle.border} ${status === 'live' ? 'border-2' : 'border-[1.5px]'}`}
            style={{ width: dimensions.width, height: dimensions.height }}
        >
            <Handle type="target" position={Position.Top} className="w-3 h-3 bg-blue-500" />

            {/* Header / Title Bar */}
            <div className={`h-8 min-h-[32px] text-xs text-gray-600 px-2 border-b flex justify-between items-center cursor-move draggable-handle ${currentStyle.bg}`}>
                <div className="flex items-center gap-2">
                    <span className="font-bold truncate max-w-[150px]">{screenRegistry[screenId]?.name || screenId}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider ${currentStyle.badge}`}>
                        {currentStyle.label}
                    </span>
                </div>

                <div className="flex items-center gap-1 nodrag">
                    <button
                        onClick={() => setMode('mobile')}
                        className={`p-0.5 rounded ${mode === 'mobile' ? 'bg-white shadow text-blue-600' : 'hover:bg-gray-200 text-gray-400'}`}
                        title="Mobile View"
                    >
                        <Smartphone size={12} />
                    </button>
                    <button
                        onClick={() => setMode('desktop')}
                        className={`p-0.5 rounded ${mode === 'desktop' ? 'bg-white shadow text-blue-600' : 'hover:bg-gray-200 text-gray-400'}`}
                        title="Desktop View"
                    >
                        <Monitor size={12} />
                    </button>
                </div>
            </div>

            {/* The Sandbox for the Page */}
            <div className="flex-1 w-full relative overflow-y-auto overflow-x-hidden nodrag nowheel bg-white">
                <div className="min-h-full">
                    <Suspense fallback={<div className="p-4 text-center text-gray-400 text-xs">Loading...</div>}>
                        <MockAuthProvider>
                            <Screen />
                        </MockAuthProvider>
                    </Suspense>
                </div>
            </div>

            <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-blue-500" />
        </div>
    );
}
