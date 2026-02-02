import React, { useState, useEffect } from 'react';
import { db, supabase } from '@/api/supabaseClient';
import { Button } from "@/components/ui/button";
import { CheckCircle, AlertCircle, Loader2, Trash2, RefreshCw, Database, CheckCircle2, AlertTriangle, Terminal } from "lucide-react";

export default function SeedData() {
    const [status, setStatus] = useState('idle');
    const [logs, setLogs] = useState([]);
    const [activeTask, setActiveTask] = useState(null);

    const addLog = (msg) => setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`]);

    // Cleanup interval on unmount
    useEffect(() => {
        let interval;
        if (activeTask) {
            addLog(`⏳ Waiting for worker to process task: ${activeTask.id}`);
            interval = setInterval(async () => {
                const { data, error } = await supabase
                    .from('agent_tasks')
                    .select('status, result')
                    .eq('id', activeTask.id)
                    .single();

                if (error) {
                    addLog(`❌ Error polling task: ${error.message}`);
                    return;
                }

                if (data.status === 'done') {
                    addLog(`✅ Task Finished: ${data.result || 'Success'}`);
                    setStatus('success');
                    setActiveTask(null);
                    clearInterval(interval);
                } else if (data.status === 'error') {
                    addLog(`❌ Task Failed: ${data.result || 'Unknown error'}`);
                    setStatus('error');
                    setActiveTask(null);
                    clearInterval(interval);
                }
            }, 3000);
        }
        return () => clearInterval(interval);
    }, [activeTask]);

    const triggerWorkerTask = async (title, description) => {
        setStatus('loading');
        addLog(`Creating background task: ${title}...`);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            const userId = user?.id;

            const { data, error } = await supabase
                .from('agent_tasks')
                .insert({
                    title,
                    description,
                    assigned_to: 'tech-lead-agent', // Or any worker configured for this
                    status: 'pending',
                    priority: 'high',
                    created_by: userId
                })
                .select()
                .single();

            if (error) throw error;

            addLog(`🚀 Task queued successfully (ID: ${data.id})`);
            setActiveTask(data);
        } catch (error) {
            console.error('Task creation failed:', error);
            addLog(`❌ Error: ${error.message}`);
            setStatus('error');
        }
    };

    const handleClearData = () => {
        setLogs([]);
        triggerWorkerTask(
            "Clear Database",
            "Use the 'clear_db' tool to remove all mock data from the main tables."
        );
    };

    const handleSeed = () => {
        setLogs([]);
        triggerWorkerTask(
            "Seed Database",
            "Use the 'seed_db' tool to populate the database with mock properties, providers, and experiences."
        );
    };

    const handleResetAndSeed = () => {
        setLogs([]);
        triggerWorkerTask(
            "Reset and Seed Database",
            "1. Use 'clear_db' to wipe existing data. 2. Use 'seed_db' to inject fresh mock data."
        );
    };

    return (
        <div className="p-8 max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Database className="w-6 h-6 text-blue-500" />
                Database Seeder
            </h1>

            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-6">
                <div className="flex items-center gap-2 text-blue-800 mb-2">
                    <Terminal className="w-5 h-5" />
                    <span className="font-semibold">Worker Mode Active</span>
                </div>
                <p className="text-sm text-blue-700">
                    Seeding now runs via **Background Worker** to ensure security.
                    Ensure `npm run worker` is running in your terminal.
                </p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-6 text-yellow-800">
                <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-5 h-5" />
                    <span className="font-semibold">Warning</span>
                </div>
                <p className="text-sm">
                    This will modify your live database. Recommended for Dev/Staging only.
                </p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
                <Button
                    onClick={handleClearData}
                    disabled={status === 'loading'}
                    variant="destructive"
                    className="w-full"
                >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear All Data
                </Button>
                <Button
                    onClick={handleResetAndSeed}
                    disabled={status === 'loading'}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                >
                    {status === 'loading' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                    Reset & Seed
                </Button>
            </div>

            <Button
                onClick={handleSeed}
                disabled={status === 'loading'}
                variant="outline"
                className="w-full mb-6"
            >
                {status === 'loading' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : 'Append Mock Data'}
            </Button>

            <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm h-72 overflow-y-auto border border-gray-800 shadow-inner">
                {logs.length === 0 ? (
                    <span className="text-gray-500">// System logs will appear here during background execution...</span>
                ) : (
                    logs.map((log, i) => <div key={i} className="mb-1">{log}</div>)
                )}
                {status === 'loading' && <div className="text-blue-400 mt-2 animate-pulse">_ Worker is thinking...</div>}
            </div>
        </div>
    );
}
