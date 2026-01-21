import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bot, Zap, Send } from 'lucide-react';
import { ReceptionistConfig } from '@/features/vendors/components/ReceptionistConfig';
import { ConsultantChat } from '@/features/vendors/components/ConsultantChat';

export const DashboardAgents = ({ business }) => {
    const [selectedAgent, setSelectedAgent] = useState('receptionist');

    return (
        <div className="grid lg:grid-cols-4 gap-6 h-[calc(100vh-200px)]">
            {/* Agent Sidebar */}
            <div className="lg:col-span-1 space-y-4">
                <h2 className="text-lg font-semibold mb-4">Your Workforce</h2>

                <Card
                    className={`cursor-pointer transition-all ${selectedAgent === 'consultant' ? 'ring-2 ring-purple-600 border-purple-600 bg-purple-50' : 'hover:border-slate-300'}`}
                    onClick={() => setSelectedAgent('consultant')}
                >
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600">
                            <Bot className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-sm">AI Consultant</h3>
                            <Badge variant="secondary" className="text-[10px] h-4 px-1 bg-purple-100 text-purple-800">Active</Badge>
                        </div>
                    </CardContent>
                </Card>

                <Card
                    className={`cursor-pointer transition-all ${selectedAgent === 'receptionist' ? 'ring-2 ring-blue-600 border-blue-600 bg-blue-50' : 'hover:border-slate-300'}`}
                    onClick={() => setSelectedAgent('receptionist')}
                >
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                            <Bot className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-sm">AI Receptionist</h3>
                            <Badge variant="secondary" className="text-[10px] h-4 px-1">Active</Badge>
                        </div>
                    </CardContent>
                </Card>

                <Card className="opacity-70">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                            <Zap className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-sm text-slate-500">Sales Agent</h3>
                            <Badge variant="outline" className="text-[10px] h-4 px-1">Coming Soon</Badge>
                        </div>
                    </CardContent>
                </Card>

                <Card className="opacity-70">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                            <Send className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-sm text-slate-500">Marketing Agent</h3>
                            <Badge variant="outline" className="text-[10px] h-4 px-1">Coming Soon</Badge>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Agent Config/Chat Area */}
            <div className="lg:col-span-3 h-full">
                {selectedAgent === 'receptionist' && (
                    <div className="h-full overflow-y-auto pr-2">
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold">AI Receptionist Configuration</h2>
                            <p className="text-slate-500">Manage how your AI assistant handles customer inquiries, tone, and auto-replies.</p>
                        </div>
                        <ReceptionistConfig provider={business} />
                    </div>
                )}
                {selectedAgent === 'consultant' && (
                     <div className="h-full flex flex-col">
                        <div className="mb-4">
                            <h2 className="text-2xl font-bold text-purple-900">Expert Conversation</h2>
                            <p className="text-slate-500">Chat with your dedicated business strategist.</p>
                        </div>
                        <div className="flex-1">
                             <ConsultantChat business={business} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
