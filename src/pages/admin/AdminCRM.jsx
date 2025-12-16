
import React, { useState } from 'react';
import { SalesService } from '../../services/SalesService';
import CRMDashboard from './CRMDashboard';
import { Button } from "@/components/ui/button";
import { RefreshCw, Send, BrainCircuit, Plus } from 'lucide-react';
import { toast } from "@/components/ui/use-toast";

export default function AdminCRM() {
    const [agentStatus, setAgentStatus] = useState('idle'); // idle, qualifying, outreach
    const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const refreshDashboard = () => setRefreshTrigger(prev => prev + 1);

    const handleAutoQualify = async () => {
        setAgentStatus('qualifying');
        try {
            const result = await SalesService.runAutoQualify();
            toast({
                title: "Auto-Qualify Complete",
                description: result.message,
                variant: result.message.includes("Error") ? "destructive" : "default"
            });
            refreshDashboard();
        } catch (e) {
            console.error(e);
            toast({ title: "Error", description: "Agent failed to qualify.", variant: "destructive" });
        } finally {
            setAgentStatus('idle');
        }
    };

    const handleOutreach = async () => {
        setAgentStatus('outreach');
        try {
            const result = await SalesService.runOutreachCampaign();
            toast({
                title: "Campaign Launched",
                description: result.message,
                variant: result.message.includes("Error") ? "destructive" : "default"
            });
            refreshDashboard();
        } catch (e) {
            console.error(e);
            toast({ title: "Error", description: "Agent failed to launch campaign.", variant: "destructive" });
        } finally {
            setAgentStatus('idle');
        }
    };

    return (
        <div className="space-y-6 h-full flex flex-col min-h-0">
            <div className="flex justify-between items-center bg-slate-900/50 p-6 rounded-xl border border-slate-800 backdrop-blur-sm">
                <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                        AI Sales Operations
                    </h1>
                    <p className="text-slate-400">Autonomous CRM & Outreach Agent</p>
                </div>
                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        onClick={() => setIsAddLeadOpen(true)}
                        className="border-slate-700 hover:bg-slate-800 text-slate-300"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        New Lead
                    </Button>
                    <div className="w-px h-8 bg-slate-700 mx-1"></div>
                    <Button
                        variant="outline"
                        onClick={handleAutoQualify}
                        disabled={agentStatus !== 'idle'}
                        className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 bg-emerald-950/30"
                    >
                        {agentStatus === 'qualifying' ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <BrainCircuit className="mr-2 h-4 w-4" />}
                        Auto-Qualify Leads
                    </Button>
                    <Button
                        onClick={handleOutreach}
                        disabled={agentStatus !== 'idle'}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20"
                    >
                        {agentStatus === 'outreach' ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                        Launch Campaign
                    </Button>
                </div>
            </div>

            {/* Integrated CRM Dashboard */}
            <div className="flex-1 min-h-0 bg-slate-950/30 rounded-xl border border-slate-800/50 overflow-hidden">
                <CRMDashboard
                    pipelineId={null}
                    isAddLeadOpen={isAddLeadOpen}
                    setIsAddLeadOpen={setIsAddLeadOpen}
                    refreshTrigger={refreshTrigger}
                />
            </div>
        </div>
    );
}
