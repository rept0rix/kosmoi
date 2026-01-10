import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Bot, Calendar, CalendarCheck } from "lucide-react";
import { AgentRunner } from "@/features/agents/services/AgentRunner";
import { BOOKING_AGENT } from "@/features/agents/services/registry/BookingAgent";
import { toast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";

const AdminScheduler = () => {
    const [isThinking, setIsThinking] = useState(false);
    const [agentOutput, setAgentOutput] = useState(null);
    const [userInput, setUserInput] = useState("");

    const handleRunClaude = async () => {
        if (!userInput.trim()) return;

        setIsThinking(true);
        setAgentOutput(null);

        try {
            // Mock Context for now - in reality this would come from a selected "request" or user session
            const context = {
                lead: { name: "Test User", id: "user_123" },
                provider_id: "provider_abc", // Ideally user selects a provider to book with
                date: new Date().toISOString().split('T')[0]
            };

            const result = await AgentRunner.run(BOOKING_AGENT, userInput, context);
            setAgentOutput(result);
        } catch (error) {
            console.error(error);
            toast({ title: "Claude Error", description: "Scheduling failed.", variant: "destructive" });
        } finally {
            setIsThinking(false);
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Scheduler Intelligence</h1>
                    <p className="text-gray-500">Claude manages your bookings and calendar</p>
                </div>
                <div className="flex gap-2">
                    <Badge variant="outline" className="text-lg py-1 px-3 gap-1">
                        <Bot className="w-4 h-4 text-orange-600" />
                        Claude Status: <span className="text-green-600 font-bold">Online</span>
                    </Badge>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Control Panel */}
                <Card className="lg:col-span-1 border-orange-100 bg-orange-50/50">
                    <CardHeader>
                        <CardTitle className="text-orange-800 flex items-center gap-2">
                            <Calendar className="w-5 h-5" />
                            Booking Request
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-gray-600">
                            Ask Claude to check availability or make a booking.
                        </p>
                        <div className="space-y-2">
                            <Input
                                placeholder="E.g., Check slots for Provider X tomorrow..."
                                value={userInput}
                                onChange={(e) => setUserInput(e.target.value)}
                                className="bg-white border-orange-200"
                            />
                            <Button
                                className="w-full bg-orange-600 hover:bg-orange-700 h-10"
                                onClick={handleRunClaude}
                                disabled={isThinking || !userInput}
                            >
                                {isThinking ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                        Checking Calendar...
                                    </>
                                ) : (
                                    <>
                                        <CalendarCheck className="w-4 h-4 mr-2" />
                                        Ask Claude
                                    </>
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Agent Workspace */}
                <Card className="lg:col-span-2 shadow-sm border-2 border-orange-50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-gray-700">
                            <Bot className="w-5 h-5" />
                            Claude's Desk
                        </CardTitle>
                        <CardDescription>
                            Interaction Log
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="min-h-[300px]">
                        {!agentOutput && !isThinking && (
                            <div className="flex flex-col items-center justify-center h-full text-gray-400 opacity-50 space-y-2">
                                <Bot className="w-16 h-16" />
                                <p>Ready to assist with scheduling.</p>
                            </div>
                        )}

                        {agentOutput && (
                            <div className="space-y-6">
                                {/* Thoughts */}
                                <div className="space-y-2">
                                    <h4 className="font-medium text-xs uppercase tracking-wider text-gray-500">Internal Monologue</h4>
                                    <div className="bg-gray-50 p-4 rounded-lg text-sm font-mono text-gray-700 space-y-2 border">
                                        {agentOutput.thoughtProcess && agentOutput.thoughtProcess.map((t, i) => (
                                            <div key={i} className="flex gap-2">
                                                <span className="text-orange-500">{">"}</span>
                                                <span>{t}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Result */}
                                <div className="space-y-2">
                                    <h4 className="font-medium text-xs uppercase tracking-wider text-gray-500">Response</h4>
                                    <div className="bg-white p-6 rounded-xl border-2 border-orange-100 shadow-sm">
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

export default AdminScheduler;
