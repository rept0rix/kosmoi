import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Rocket, Database, Terminal, StopCircle, Play, CheckCircle } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { CATEGORY_SEARCH_TERMS, CRAWLER_AREAS } from '@/services/data/CrawlerConfig';
import { DataIngestionService } from '@/services/data/DataIngestionService';

export default function AutomatedImportPanel({ importPlace }) {
    const { toast } = useToast();
    const [isRunning, setIsRunning] = useState(false);
    const [progress, setProgress] = useState({ current: 0, total: 0, area: '', category: '' });
    const [stats, setStats] = useState({ imported: 0, skipped: 0, errors: 0 });
    const [logs, setLogs] = useState([]);
    const stopRef = useRef(false);
    const logsEndRef = useRef(null);

    // Scroll logs to bottom
    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [logs]);

    const addLog = (message, type = 'info') => {
        const timestamp = new Date().toLocaleTimeString();
        setLogs(prev => [...prev.slice(-49), { message, type, timestamp }]); // Keep last 50 logs
    };

    const generateTasks = () => {
        const tasks = [];
        CRAWLER_AREAS.forEach(area => {
            Object.keys(CATEGORY_SEARCH_TERMS).forEach(subCatKey => {
                tasks.push({
                    area,
                    subCatKey,
                    searchTerm: CATEGORY_SEARCH_TERMS[subCatKey]
                });
            });
        });
        return tasks;
    };

    const startCrawler = async () => {
        stopRef.current = false;
        setIsRunning(true);
        setLogs([]);

        const tasks = generateTasks();
        setProgress({ current: 0, total: tasks.length * 20, area: 'Initialization', category: 'Starting...' }); // Estimated total (20 results per task)
        setStats({ imported: 0, skipped: 0, errors: 0 });

        addLog(`🚀 Initializing Island Crawler...`, 'system');
        addLog(`📋 Loaded ${CRAWLER_AREAS.length} Areas and ${Object.keys(CATEGORY_SEARCH_TERMS).length} Categories.`, 'system');
        addLog(`📝 Total Search Tasks: ${tasks.length}`, 'system');

        let totalImported = 0;
        let totalSkipped = 0;
        let totalErrors = 0;

        for (let i = 0; i < tasks.length; i++) {
            if (stopRef.current) {
                addLog('🛑 Crawler Aborted by User.', 'error');
                break;
            }

            const task = tasks[i];
            const query = `${task.searchTerm} in ${task.area}, Koh Samui`;

            setProgress(prev => ({
                ...prev,
                current: i,
                total: tasks.length,
                area: task.area,
                category: task.subCatKey
            }));

            addLog(`📡 Scanning: ${query}...`, 'info');

            try {
                // Search
                const results = await DataIngestionService.searchPlaces(query);

                if (results.length === 0) {
                    addLog(`🔸 No results found for ${query}`, 'warning');
                    continue;
                }

                addLog(`🎯 Found ${results.length} candidates. Processing...`, 'success');

                for (const [index, basicData] of results.entries()) {
                    if (stopRef.current) break;

                    const place = basicData;
                    addLog(`⏳ Processing [${index + 1}/${results.length}]: ${place.business_name}...`, 'info');

                    // Artificial delay to prevent rate limits
                    await new Promise(r => setTimeout(r, 1000));

                    try {
                        // Create a timeout promise
                        const timeoutPromise = new Promise((_, reject) =>
                            setTimeout(() => reject(new Error("Import timed out (15s)")), 15000)
                        );

                        // Race the import against the timeout
                        const success = await Promise.race([
                            importPlace(place, 0, addLog),
                            timeoutPromise
                        ]);

                        console.log(`[Crawler Debug] Import result for ${place.business_name}: ${success}`);

                        if (success) {
                            totalImported++;
                            addLog(`✅ Imported: ${place.business_name}`, 'success');
                        } else {
                            totalSkipped++;
                            // Logs for skips are now handled inside importPlace via onLog
                        }
                    } catch (err) {
                        totalErrors++;
                        addLog(`❌ Error processing ${place.business_name}: ${err.message}`, 'error');
                        console.error(`Crawler Error for ${place.business_name}:`, err);
                    }

                    setStats({ imported: totalImported, skipped: totalSkipped, errors: totalErrors });
                }

            } catch (error) {
                addLog(`💥 Search Error: ${error.message}`, 'error');
                totalErrors++;
            }

            // Cooldown between searches
            await new Promise(r => setTimeout(r, 2000));
        }

        setIsRunning(false);
        addLog(`🏁 Mission Complete! Imported: ${totalImported}, Skipped: ${totalSkipped}, Errors: ${totalErrors}`, 'system');
        toast({
            title: "Crawler Finished",
            description: `Imported ${totalImported} new businesses across Koh Samui.`,
        });
    };

    const stopCrawler = () => {
        stopRef.current = true;
        addLog('🛑 Stopping...', 'error');
    };

    return (
        <Card className="bg-slate-950 text-slate-200 border-slate-800 shadow-xl overflow-hidden">
            <CardContent className="p-0">
                {/* Header */}
                <div className="bg-slate-900/50 p-4 border-b border-slate-800 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold flex items-center gap-2 text-blue-400">
                            <Rocket className="w-5 h-5" />
                            Island Crawler v1.0
                        </h2>
                        <p className="text-xs text-slate-400">Automated Deep-Scan & Ingestion Engine</p>
                    </div>
                    <div className="flex gap-2">
                        {isRunning ? (
                            <Button variant="destructive" size="sm" onClick={stopCrawler} className="gap-2">
                                <StopCircle className="w-4 h-4 animate-pulse" /> Abort
                            </Button>
                        ) : (
                            <Button onClick={startCrawler} size="sm" className="bg-blue-600 hover:bg-blue-500 text-white gap-2">
                                <Play className="w-4 h-4" /> Start Mission
                            </Button>
                        )}
                    </div>
                </div>

                {/* Dashboard */}
                <div className="grid grid-cols-4 gap-4 p-4 bg-slate-900/30">
                    <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 text-center">
                        <div className="text-xs text-slate-500 uppercase">Status</div>
                        <div className={`font-bold ${isRunning ? 'text-green-400 animate-pulse' : 'text-slate-400'}`}>
                            {isRunning ? 'RUNNING' : 'IDLE'}
                        </div>
                    </div>
                    <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 text-center">
                        <div className="text-xs text-slate-500 uppercase">Imported</div>
                        <div className="text-xl font-bold text-green-500">{stats.imported}</div>
                    </div>
                    <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 text-center">
                        <div className="text-xs text-slate-500 uppercase">Skipped</div>
                        <div className="text-xl font-bold text-slate-500">{stats.skipped}</div>
                    </div>
                    <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 text-center">
                        <div className="text-xs text-slate-500 uppercase">Errors</div>
                        <div className="text-xl font-bold text-red-500">{stats.errors}</div>
                    </div>
                </div>

                {/* Progress */}
                {isRunning && (
                    <div className="px-4 py-2">
                        <div className="flex justify-between text-xs text-slate-400 mb-1">
                            <span>Scanning: <span className="text-blue-400">{progress.area}</span></span>
                            <span>Category: <span className="text-yellow-400">{progress.category}</span></span>
                            <span>{Math.round((progress.current / progress.total) * 100)}%</span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                            <div
                                className="bg-blue-500 h-full transition-all duration-300 relative"
                                style={{ width: `${(progress.current / progress.total) * 100}%` }}
                            >
                                <div className="absolute inset-0 bg-white/20 animate-subtle-pulse"></div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Terminal Log */}
                <div className="bg-black p-4 h-64 overflow-y-auto font-mono text-xs custom-scrollbar">
                    <div className="space-y-1">
                        {logs.length === 0 && <div className="text-slate-600 italic">Ready to engage...</div>}
                        {logs.map((log, i) => (
                            <div key={i} className={`flex gap-2 ${log.type === 'error' ? 'text-red-400' :
                                log.type === 'success' ? 'text-green-400' :
                                    log.type === 'warning' ? 'text-yellow-400' :
                                        log.type === 'system' ? 'text-blue-400 font-bold border-b border-slate-800 pb-1 mt-2' :
                                            'text-slate-300'
                                }`}>
                                <span className="text-slate-600 select-none">[{log.timestamp}]</span>
                                <span>{log.message}</span>
                            </div>
                        ))}
                        <div ref={logsEndRef} />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
