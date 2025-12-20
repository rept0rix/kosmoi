import React, { useState } from 'react';
import { Sparkles, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Panel } from '@xyflow/react';

export default function DesignPrompt({ onPromptSubmit, isGenerating }) {
    const [prompt, setPrompt] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!prompt.trim()) return;
        onPromptSubmit(prompt);
        setPrompt('');
    };

    return (
        <Panel position="bottom-center" className="mb-8 w-full max-w-xl">
            <form
                onSubmit={handleSubmit}
                className="nodrag relative bg-white/90 backdrop-blur rounded-full shadow-2xl border border-blue-100 p-2 flex items-center gap-2 group focus-within:ring-2 focus-within:ring-blue-400 transition-all duration-300 transform hover:scale-[1.01]"
            >
                <div className="pl-3 text-blue-500">
                    <Sparkles className={`w-5 h-5 ${isGenerating ? 'animate-pulse' : ''}`} />
                </div>

                <input
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={isGenerating ? "Dreaming up designs..." : "Describe a layout (e.g., 'Add a login screen connected to the dashboard')..."}
                    disabled={isGenerating}
                    className="flex-1 bg-transparent border-none outline-none text-sm px-2 text-gray-700 placeholder:text-gray-400 disabled:opacity-50 h-10"
                />

                <Button
                    type="submit"
                    size="icon"
                    disabled={isGenerating || !prompt.trim()}
                    className="rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-md w-10 h-10 flex-shrink-0 transition-transform active:scale-95"
                >
                    <Send className="w-4 h-4 ml-0.5" />
                </Button>
            </form>
        </Panel>
    );
}
