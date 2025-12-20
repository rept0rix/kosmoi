import React from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Activity, DollarSign, Users, Target, FileText } from 'lucide-react';

const CompanyStateDisplay = ({ state }) => {
    if (!state) return null;

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* KPIs Card */}
            <Card className="p-4 bg-white/80 backdrop-blur-sm border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                    <Activity className="w-4 h-4 text-blue-600" />
                    <h3 className="font-semibold text-sm text-slate-700">Live KPIs</h3>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col p-2 bg-slate-50 rounded-lg">
                        <span className="text-[10px] text-slate-400 uppercase">Budget</span>
                        <div className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3 text-green-600" />
                            <span className="font-bold text-slate-700">{state.kpis?.budget?.toLocaleString()}</span>
                        </div>
                    </div>
                    <div className="flex flex-col p-2 bg-slate-50 rounded-lg">
                        <span className="text-[10px] text-slate-400 uppercase">Users</span>
                        <div className="flex items-center gap-1">
                            <Users className="w-3 h-3 text-blue-600" />
                            <span className="font-bold text-slate-700">{state.kpis?.users}</span>
                        </div>
                    </div>
                </div>
            </Card>

            {/* News Feed Card */}
            <Card className="p-4 bg-white/80 backdrop-blur-sm border-slate-200 shadow-sm col-span-1 md:col-span-2">
                <div className="flex items-center gap-2 mb-3">
                    <FileText className="w-4 h-4 text-purple-600" />
                    <h3 className="font-semibold text-sm text-slate-700">Company News Feed</h3>
                </div>
                <ScrollArea className="h-[80px]">
                    <div className="space-y-2">
                        {state.news_feed?.slice().reverse().map((news, idx) => (
                            <div key={idx} className="flex items-start gap-2 text-xs">
                                <Badge variant="outline" className="text-[10px] px-1 py-0 border-purple-200 text-purple-600 shrink-0">
                                    {new Date(news.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </Badge>
                                <span className="text-slate-600">{news.content}</span>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </Card>
        </div>
    );
};

export default CompanyStateDisplay;
