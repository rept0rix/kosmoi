
import React, { useEffect, useState } from 'react';
import { realSupabase } from '@/api/supabaseClient';
import { GlassCard } from '@/components/ui/GlassCard';
import { Loader2, RefreshCw, Save, Trash2 } from 'lucide-react';

export default function MemoryInspector() {
    const [memories, setMemories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedMemory, setSelectedMemory] = useState(null);
    const [editMode, setEditMode] = useState(false);
    const [editedContent, setEditedContent] = useState('');

    const fetchMemories = async () => {
        setLoading(true);
        try {
            // Fetch all memories. 
            // Note: In a real large app you'd paginate this.
            const { data, error } = await realSupabase
                .from('agent_memory')
                .select('*')
                .order('updated_at', { ascending: false });

            if (error) throw error;
            setMemories(data || []);
        } catch (e) {
            console.error("Failed to fetch memories", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMemories();
    }, []);

    const handleSelect = (memory) => {
        setSelectedMemory(memory);
        setEditMode(false);
        setEditedContent(JSON.stringify(memory.history, null, 2));
    };

    const handleSave = async () => {
        if (!selectedMemory) return;
        try {
            const parsedHistory = JSON.parse(editedContent);
            const { error } = await realSupabase
                .from('agent_memory')
                .update({ history: parsedHistory, updated_at: new Date().toISOString() })
                .eq('id', selectedMemory.id);

            if (error) throw error;

            // Update local state
            const updatedMemories = memories.map(m =>
                m.id === selectedMemory.id ? { ...m, history: parsedHistory } : m
            );
            setMemories(updatedMemories);
            setSelectedMemory({ ...selectedMemory, history: parsedHistory });
            setEditMode(false);
            alert("Memory Updated Successfully!");
        } catch (e) {
            alert("Failed to save: " + e.message);
        }
    };

    const handleDelete = async () => {
        if (!selectedMemory || !confirm("Are you sure you want to wipe this agent's memory? This cannot be undone.")) return;

        try {
            const { error } = await realSupabase
                .from('agent_memory')
                .delete()
                .eq('id', selectedMemory.id);

            if (error) throw error;

            setMemories(memories.filter(m => m.id !== selectedMemory.id));
            setSelectedMemory(null);
        } catch (e) {
            alert("Failed to delete: " + e.message);
        }
    };

    return (
        <div className="h-full w-full flex bg-slate-950 text-slate-200">
            {/* Sidebar List */}
            <div className="w-1/3 border-r border-slate-800 flex flex-col">
                <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                    <h2 className="font-bold">Agent Memories</h2>
                    <button onClick={fetchMemories} className="p-2 hover:bg-slate-800 rounded-full transition-colors">
                        <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    {loading ? (
                        <div className="flex justify-center p-8"><Loader2 className="animate-spin text-slate-500" /></div>
                    ) : memories.length === 0 ? (
                        <div className="text-center p-8 text-slate-500">No active memories found.</div>
                    ) : (
                        memories.map(mem => (
                            <div
                                key={mem.id}
                                onClick={() => handleSelect(mem)}
                                className={`p-3 rounded-lg cursor-pointer transition-all border ${selectedMemory?.id === mem.id
                                        ? 'bg-indigo-600/20 border-indigo-500'
                                        : 'bg-slate-900 border-slate-800 hover:border-slate-600'
                                    }`}
                            >
                                <div className="font-semibold text-sm text-indigo-300">{mem.agent_id}</div>
                                <div className="text-xs text-slate-500 truncate">User: {mem.user_id}</div>
                                <div className="text-[10px] text-slate-600 mt-1">
                                    Last Update: {new Date(mem.updated_at || mem.created_at).toLocaleString()}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col bg-slate-950/50">
                {selectedMemory ? (
                    <>
                        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900">
                            <div>
                                <h3 className="font-bold text-lg">{selectedMemory.agent_id}</h3>
                                <p className="text-xs text-slate-400">Memory ID: {selectedMemory.id}</p>
                            </div>
                            <div className="flex gap-2">
                                {editMode ? (
                                    <>
                                        <button onClick={handleSave} className="flex items-center gap-2 px-3 py-1.5 bg-green-600 hover:bg-green-700 rounded text-xs font-semibold">
                                            <Save size={14} /> Save
                                        </button>
                                        <button onClick={() => { setEditMode(false); setEditedContent(JSON.stringify(selectedMemory.history, null, 2)); }} className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded text-xs">
                                            Cancel
                                        </button>
                                    </>
                                ) : (
                                    <button onClick={() => setEditMode(true)} className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 rounded text-xs font-semibold">
                                        Edit Memory
                                    </button>
                                )}
                                <button onClick={handleDelete} className="p-2 text-red-400 hover:bg-red-900/20 rounded">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-hidden relative">
                            {editMode ? (
                                <textarea
                                    className="w-full h-full bg-slate-950 p-4 font-mono text-sm text-green-400 focus:outline-none resize-none"
                                    value={editedContent}
                                    onChange={(e) => setEditedContent(e.target.value)}
                                    spellCheck={false}
                                />
                            ) : (
                                <div className="w-full h-full overflow-auto p-4">
                                    <pre className="text-sm font-mono text-slate-300 whitespace-pre-wrap">
                                        {JSON.stringify(selectedMemory.history, null, 2)}
                                    </pre>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-600">
                        <div className="text-6xl mb-4">🧠</div>
                        <p>Select an agent memory to inspect</p>
                    </div>
                )}
            </div>
        </div>
    );
}
