import React from 'react';
import { Square, Circle, Type, MousePointer2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Panel } from '@xyflow/react';

export default function DesignToolbar({ onAddNode }) {
    return (
        <Panel position="top-center" className="bg-white p-1 rounded-lg shadow-lg border flex gap-1 items-center max-w-fit mx-auto mt-4">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500 bg-blue-50" title="Select">
                <MousePointer2 className="h-4 w-4" />
            </Button>
            <div className="w-px h-6 bg-gray-200 mx-1" />

            <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => onAddNode('shape', { type: 'rectangle', label: 'Box' })}
                title="Rectangle"
            >
                <Square className="h-4 w-4" />
            </Button>

            <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => onAddNode('shape', { type: 'circle', label: 'Circle' })}
                title="Circle"
            >
                <Circle className="h-4 w-4" />
            </Button>

            <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => onAddNode('text', { text: 'Double click to edit' })}
                title="Text"
            >
                <Type className="h-4 w-4" />
            </Button>

            <div className="w-px h-6 bg-gray-200 mx-1" />

            <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                onClick={() => onAddNode('analyze')}
                title="Analyze UI (Vision)"
            >
                <span className="font-bold text-xs">AI</span>
            </Button>

            <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-slate-600 hover:text-slate-700"
                onClick={() => onAddNode('export')}
                title="Export Code"
            >
                <span className="font-bold text-xs">{'</>'}</span>
            </Button>
        </Panel>
    );
}
