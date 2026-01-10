import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, FastForward, Activity, Zap, Clock, UserPlus } from "lucide-react";
import { AutomationService } from "@/features/agents/services/AutomationService";
import { toast } from "@/components/ui/use-toast";

const AdminAutomations = () => {
    const [isRunning, setIsRunning] = useState(false);
    const [isRealtime, setIsRealtime] = useState(false);
    const [logs, setLogs] = useState([]);

    useEffect(() => {
        // Subscribe to logs
        const unsubscribe = AutomationService.subscribe((updatedLogs) => {
            setLogs([...updatedLogs]);
            setIsRealtime(AutomationService.isRealtime);
        });
        return unsubscribe;
    }, []);

    const handleToggleEngine = () => {
        const newState = !isRunning;
        setIsRunning(newState);

        if (newState) {
            AutomationService.initRealtime();
        } else {
            AutomationService.stopRealtime();
        }

        toast({
            title: newState ? "Engine Started" : "Engine Stopped",
            description: newState ? "Listening for Realtime Events..." : "Automations paused.",
            variant: newState ? "default" : "destructive"
        });
    };

    const handleSimulateLead = async () => {
        if (!isRunning) return toast({ title: "Engine Offline", description: "Start the engine first.", variant: "destructive" });

        const mockLead = {
            id: `lead_${Date.now()}`,
            name: "New Business " + Math.floor(Math.random() * 100),
            business_type: "Restaurant",
            status: "new"
        };

        await AutomationService.triggerNewLead(mockLead);
    };

    const handleSimulateMorning = async () => {
        if (!isRunning) return toast({ title: "Engine Offline", description: "Start the engine first.", variant: "destructive" });
        await AutomationService.triggerMorningRoutine();
    };

    const handleSimulateFriday = async () => {
        if (!isRunning) return toast({ title: "Engine Offline", description: "Start the engine first.", variant: "destructive" });
        await AutomationService.triggerWeeklyReport();
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Engine Room</h1>
                    <p className="text-gray-500">Autonomous Agent Orchestration</p>
                </div>
                <div className="flex gap-2 items-center">
                    <Badge variant="outline" className={`text-lg py-1 px-3 gap-2 ${isRealtime ? 'border-purple-500 bg-purple-50' : 'border-gray-200 bg-gray-50'}`}>
                        <Activity className={`w-4 h-4 ${isRealtime ? 'text-purple-600 animate-pulse' : 'text-gray-400'}`} />
                        Realtime: <span className={isRealtime ? "text-purple-600 font-bold" : "text-gray-500"}>{isRealtime ? "CONNECTED" : "OFF"}</span>
                    </Badge>
                    <Badge variant="outline" className={`text-lg py-1 px-3 gap-2 ${isRunning ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                        <Activity className={`w-4 h-4 ${isRunning ? 'text-green-600 animate-pulse' : 'text-gray-400'}`} />
                        Status: <span className={isRunning ? "text-green-600 font-bold" : "text-gray-500"}>{isRunning ? "ONLINE" : "OFFLINE"}</span>
                    </Badge>
                    <Button
                        onClick={handleToggleEngine}
                        variant={isRunning ? "destructive" : "default"}
                        className="gap-2"
                    >
                        {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        {isRunning ? "Stop Engine" : "Start Engine"}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Simulation Controls */}
                <Card className="lg:col-span-1 border-slate-200 bg-slate-50/50">
                    <CardHeader>
                        <CardTitle className="text-slate-800 flex items-center gap-2">
                            <Zap className="w-5 h-5" />
                            Simulation Controls
                        </CardTitle>
                        <CardDescription>Manually trigger autonomous events</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Button
                            variant="outline"
                            className="w-full justify-start gap-4 hover:bg-blue-50 border-blue-200 text-blue-700 h-14"
                            onClick={handleSimulateLead}
                            disabled={!isRunning}
                        >
                            <UserPlus className="w-5 h-5" />
                            <div className="text-left">
                                <div className="font-semibold">Simulate "New Lead"</div>
                                <div className="text-xs opacity-70">Triggers Sales Agent</div>
                            </div>
                        </Button>

                        <Button
                            variant="outline"
                            className="w-full justify-start gap-4 hover:bg-orange-50 border-orange-200 text-orange-700 h-14"
                            onClick={handleSimulateMorning}
                            disabled={!isRunning}
                        >
                            <FastForward className="w-5 h-5" />
                            <div className="text-left">
                                <div className="font-semibold">Skip to 09:00 AM</div>
                                <div className="text-xs opacity-70">Triggers Marketing Agent</div>
                            </div>
                        </Button>

                        <Button
                            variant="outline"
                            className="w-full justify-start gap-4 hover:bg-purple-50 border-purple-200 text-purple-700 h-14"
                            onClick={handleSimulateFriday}
                            disabled={!isRunning}
                        >
                            <Clock className="w-5 h-5" />
                            <div className="text-left">
                                <div className="font-semibold">Skip to Friday 5PM</div>
                                <div className="text-xs opacity-70">Triggers Analytics Agent</div>
                            </div>
                        </Button>
                    </CardContent>
                </Card>

                {/* System Log */}
                <Card className="lg:col-span-2 shadow-sm border-2 border-slate-100">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2 text-gray-700">
                                <Activity className="w-5 h-5" />
                                System Activity Log
                            </CardTitle>
                            <CardDescription>Real-time execution trace</CardDescription>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => AutomationService.clearLogs()} className="text-xs text-gray-400 hover:text-red-500">
                            Clear Log
                        </Button>
                    </CardHeader>
                    <CardContent className="h-[500px] overflow-y-auto space-y-4 pr-4">
                        {logs.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-full text-gray-300 space-y-2">
                                <Activity className="w-12 h-12" />
                                <p>No activity recorded using engine.</p>
                            </div>
                        )}
                        {logs.map((log) => (
                            <div key={log.id} className="relative pl-6 border-l-2 border-gray-100 pb-2">
                                <div className={`absolute left-[-5px] top-1 w-2.5 h-2.5 rounded-full ${log.type === 'EVENT' ? 'bg-blue-500' :
                                    log.type === 'SCHEDULE' ? 'bg-orange-500' :
                                        log.type === 'SUCCESS' ? 'bg-green-500' :
                                            log.type === 'ERROR' ? 'bg-red-500' : 'bg-gray-400'
                                    }`} />

                                <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                                    <span className="font-mono uppercase">{log.type}</span>
                                    <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                                </div>

                                <div className="text-sm font-medium text-gray-800">
                                    {log.message}
                                </div>

                                {log.data && (
                                    <div className="mt-2 bg-gray-50 rounded p-2 text-xs font-mono text-gray-600 overflow-x-auto">
                                        {/* Summarize complex data */}
                                        {log.type === 'SUCCESS' && log.data.output ? (
                                            <div className="whitespace-pre-wrap max-h-32 overflow-y-auto">
                                                {typeof log.data.output === 'string' ? log.data.output : JSON.stringify(log.data.output, null, 2)}
                                            </div>
                                        ) : (
                                            JSON.stringify(log.data)
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default AdminAutomations;
