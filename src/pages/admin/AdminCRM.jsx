
import React, { useState, useEffect } from 'react';
import { SalesService } from '../../services/SalesService';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { RefreshCw, Send, BrainCircuit, CheckCircle2 } from 'lucide-react';
import { toast } from "@/components/ui/use-toast";

export default function AdminCRM() {
    const [pipeline, setPipeline] = useState({ new: [], qualified: [], contacted: [], won: [] });
    const [loading, setLoading] = useState(true);
    const [agentStatus, setAgentStatus] = useState('idle'); // idle, qualifying, outreach

    useEffect(() => {
        loadPipeline();
    }, []);

    const loadPipeline = async () => {
        setLoading(true);
        const data = await SalesService.getPipeline();
        setPipeline(data);
        setLoading(false);
    };

    const handleAutoQualify = async () => {
        setAgentStatus('qualifying');
        try {
            const result = await SalesService.runAutoQualify();
            // Move some 'new' to 'qualified' in UI for effect
            await loadPipeline();
            alert(`Agent Report: ${result.message}`);
        } finally {
            setAgentStatus('idle');
        }
    };

    const handleOutreach = async () => {
        setAgentStatus('outreach');
        const targetLeads = pipeline.qualified; // Target the qualified column
        if (targetLeads.length === 0) {
            alert("No qualified leads to contact! Run qualification first.");
            setAgentStatus('idle');
            return;
        }

        try {
            const result = await SalesService.runOutreachCampaign(targetLeads);
            // Move 'qualified' to 'contacted' (Mock update)
            // In real app we would update DB. Here we just reload or optimistic update.
            alert(`Agent Report: ${result.message}`);
            await loadPipeline();
        } finally {
            setAgentStatus('idle');
        }
    };

    return (
        <div className="space-y-6 h-full flex flex-col min-h-0">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                        AI Sales Operations
                    </h1>
                    <p className="text-slate-400">Autonomous CRM & Outreach Agent</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={handleAutoQualify}
                        disabled={agentStatus !== 'idle'}
                        className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                    >
                        {agentStatus === 'qualifying' ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <BrainCircuit className="mr-2 h-4 w-4" />}
                        Auto-Qualify Leads
                    </Button>
                    <Button
                        onClick={handleOutreach}
                        disabled={agentStatus !== 'idle'}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                        {agentStatus === 'outreach' ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                        Launch Campaign
                    </Button>
                </div>
            </div>

            {/* Kanban Board */}
            <div className="flex-1 overflow-x-auto">
                <div className="flex gap-4 h-full min-w-[1000px]">
                    <KanbanColumn title="New / Raw" leads={pipeline.new} color="slate" />
                    <KanbanColumn title="AI Qualified" leads={pipeline.qualified} color="blue" />
                    <KanbanColumn title="Contacted" leads={pipeline.contacted} color="orange" />
                    <KanbanColumn title="Won / Clients" leads={pipeline.won} color="green" />
                </div>
            </div>
        </div>
    );
}

function KanbanColumn({ title, leads, color }) {
    const colorStyles = {
        slate: "bg-slate-900/50 border-slate-700",
        blue: "bg-blue-900/20 border-blue-500/30",
        orange: "bg-orange-900/20 border-orange-500/30",
        green: "bg-emerald-900/20 border-emerald-500/30"
    };

    return (
        <div className={`flex-1 rounded-xl border ${colorStyles[color]} p-4 flex flex-col gap-3 min-w-[280px]`}>
            <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold text-slate-200">{title}</h3>
                <Badge variant="secondary" className="bg-slate-800 text-slate-300">{leads.length}</Badge>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-slate-700">
                {leads.map(lead => (
                    <Card key={lead.id} className="p-3 bg-slate-950/50 border-white/5 hover:border-white/10 cursor-grab active:cursor-grabbing transition-all">
                        <div className="flex justify-between items-start">
                            <div className="font-medium text-slate-200 truncate pr-2">{lead.business_name}</div>
                            {lead.badge === 'verified' && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
                        </div>
                        <div className="text-xs text-slate-500 mt-1 truncate">{lead.category}</div>
                        {lead.email && <div className="text-[10px] text-slate-600 mt-2 truncate">{lead.email}</div>}
                    </Card>
                ))}
            </div>
        </div>
    );
}
