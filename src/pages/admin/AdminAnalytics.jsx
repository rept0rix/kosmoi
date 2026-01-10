import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Bot, PieChart, TrendingUp, AlertCircle } from "lucide-react";
import { AgentRunner } from "@/features/agents/services/AgentRunner";
import { ANALYTICS_AGENT } from "@/features/agents/services/registry/AnalyticsAgent";
import { toast } from "@/components/ui/use-toast";

const AdminAnalytics = () => {
    const [isThinking, setIsThinking] = useState(false);
    const [agentOutput, setAgentOutput] = useState(null);

    const handleRunAnalysis = async () => {
        setIsThinking(true);
        setAgentOutput(null);

        try {
            const input = "Analyze the platform metrics for the last week and suggest improvements.";
            const result = await AgentRunner.run(ANALYTICS_AGENT, input, {
                period: "weekly"
            });

            setAgentOutput(result);
        } catch (error) {
            console.error(error);
            toast({ title: "Lara Error", description: "Analysis failed.", variant: "destructive" });
        } finally {
            setIsThinking(false);
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Analytics Intelligence</h1>
                    <p className="text-gray-500">Lara is monitoring your business performance</p>
                </div>
                <div className="flex gap-2">
                    <Badge variant="outline" className="text-lg py-1 px-3 gap-1">
                        <Bot className="w-4 h-4 text-blue-600" />
                        Lara Status: <span className="text-green-600 font-bold">Active</span>
                    </Badge>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Control Panel */}
                <Card className="lg:col-span-1 border-blue-100 bg-blue-50/50">
                    <CardHeader>
                        <CardTitle className="text-blue-800 flex items-center gap-2">
                            <PieChart className="w-5 h-5" />
                            Data Actions
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-gray-600">
                            Run a comprehensive analysis of user retention, revenue, and traffic.
                        </p>
                        <Button
                            className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-lg"
                            onClick={handleRunAnalysis}
                            disabled={isThinking}
                        >
                            {isThinking ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                    Analyzing Data...
                                </>
                            ) : (
                                <>
                                    <TrendingUp className="w-5 h-5 mr-2" />
                                    Run Weekly Report
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>

                {/* Agent Workspace */}
                <Card className="lg:col-span-2 shadow-sm border-2 border-blue-50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-gray-700">
                            <Bot className="w-5 h-5" />
                            Lara's Insights
                        </CardTitle>
                        <CardDescription>
                            AI-driven analysis and recommendations.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="min-h-[300px]">
                        {!agentOutput && !isThinking && (
                            <div className="flex flex-col items-center justify-center h-full text-gray-400 opacity-50 space-y-2">
                                <Bot className="w-16 h-16" />
                                <p>No report generated yet.</p>
                            </div>
                        )}

                        {agentOutput && (
                            <div className="space-y-6">
                                {/* Thoughts */}
                                <div className="space-y-2">
                                    <h4 className="font-medium text-xs uppercase tracking-wider text-gray-500">Analysis Process</h4>
                                    <div className="bg-gray-50 p-4 rounded-lg text-sm font-mono text-gray-700 space-y-2 border">
                                        {agentOutput.thoughtProcess.map((t, i) => (
                                            <div key={i} className="flex gap-2">
                                                <span className="text-blue-500">{">"}</span>
                                                <span>{t}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Result */}
                                <div className="space-y-2">
                                    <h4 className="font-medium text-xs uppercase tracking-wider text-gray-500">Strategic Report</h4>
                                    <div className="bg-white p-6 rounded-xl border-2 border-blue-100 shadow-sm prose prose-blue max-w-none">
                                        <div className="whitespace-pre-wrap font-sans text-gray-800">
                                            {agentOutput.output}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

            </div>
        </div>
    );
};

export default AdminAnalytics;
