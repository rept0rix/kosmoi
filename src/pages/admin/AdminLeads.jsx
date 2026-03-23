import React, { useState, useEffect } from "react";
import { SalesService } from "../../services/SalesService";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Bot, FileText, Send, User, RefreshCw, Search,
  Loader2, Wifi, WifiOff
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";
import KosmoiLoader from "@/components/ui/KosmoiLoader";

export default function AdminLeads() {
  const [leads, setLeads] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingLeadId, setProcessingLeadId] = useState(null);
  const [agentOutput, setAgentOutput] = useState(null);
  const [selectedLead, setSelectedLead] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    loadLeads();
  }, []);

  const { isConnected } = useRealtimeSubscription("leads", {
    onInsert: (newLead) => {
      setLeads((prev) => [newLead, ...prev]);
      toast({
        title: "🎯 New Lead!",
        description: `${newLead.company || newLead.first_name || "New lead"} just arrived!`,
      });
    },
    onUpdate: (updatedLead) => {
      setLeads((prev) =>
        prev.map((l) => (l.id === updatedLead.id ? updatedLead : l)),
      );
    },
    onDelete: (deletedLead) => {
      setLeads((prev) => prev.filter((l) => l.id !== deletedLead.id));
    },
  });

  const loadLeads = async () => {
    setIsLoading(true);
    try {
      const data = await SalesService.getLeads();
      setLeads(data || []);
    } catch (error) {
      console.error("Failed to load leads", error);
      toast({ title: "Error", description: "Could not load leads", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunAgent = async (lead) => {
    setProcessingLeadId(lead.id);
    setSelectedLead(lead);
    setAgentOutput(null);

    try {
      const result = await SalesService.runAgentForLead(lead);
      setAgentOutput(result);
    } catch (error) {
      console.error(error);
      toast({ title: "Agent Error", description: "Failed to run sales agent", variant: "destructive" });
    } finally {
      setProcessingLeadId(null);
    }
  };

  const handleSendEmail = async () => {
    if (!agentOutput || !agentOutput.output || !selectedLead) return;

    try {
      const draftText = agentOutput.output;
      let subject = "Partnership Opportunity";
      let body = draftText;

      if (draftText.includes("Subject:")) {
        const parts = draftText.split("Subject:");
        const rest = parts[1] || parts[0];
        const lines = rest.split("\n");
        subject = lines[0].trim();
        body = lines.slice(1).join("\n").trim();
      }

      await SalesService.sendOutreachEmail(selectedLead.id, {
        to: "contact@business.com",
        subject,
        body,
      });

      toast({ title: "Email Sent!", description: `Outreach sent to ${selectedLead.name}` });
      setAgentOutput(null);
      setSelectedLead(null);
      loadLeads();
    } catch (error) {
      toast({ title: "Send Error", description: error.message, variant: "destructive" });
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      new: "bg-blue-500/20 text-blue-400",
      contacted: "bg-yellow-500/20 text-yellow-400",
      qualified: "bg-purple-500/20 text-purple-400",
      converted: "bg-green-500/20 text-green-400",
      lost: "bg-red-500/20 text-red-400",
    };
    return <Badge className={styles[status] || "bg-slate-500/20 text-slate-400"}>{status}</Badge>;
  };

  const filteredLeads = leads.filter(lead => {
    const name = lead.company || `${lead.first_name || ''} ${lead.last_name || ''}`;
    return name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lead.business_type || '').toLowerCase().includes(searchTerm.toLowerCase());
  });

  if (isLoading && leads.length === 0) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <KosmoiLoader />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8 space-y-8 font-sans">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            Leads Management
          </h1>
          <p className="text-slate-400">Manage and contact your potential partners</p>
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm ${
            isConnected
              ? 'bg-green-500/10 border-green-500/20 text-green-400'
              : 'bg-slate-800 border-white/10 text-slate-500'
          }`}>
            {isConnected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            {isConnected ? 'Live' : 'Offline'}
          </div>
          <Button onClick={loadLeads} variant="outline" size="sm" className="border-white/10">
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4 bg-slate-900/40 border-white/5">
          <div className="text-slate-400 text-xs uppercase font-bold tracking-wider mb-1">Total Leads</div>
          <div className="text-2xl font-bold text-white">{leads.length}</div>
        </Card>
        <Card className="p-4 bg-blue-900/20 border-blue-500/10">
          <div className="text-blue-400 text-xs uppercase font-bold tracking-wider mb-1">New</div>
          <div className="text-2xl font-bold text-blue-400">{leads.filter(l => l.status === 'new').length}</div>
        </Card>
        <Card className="p-4 bg-yellow-900/20 border-yellow-500/10">
          <div className="text-yellow-400 text-xs uppercase font-bold tracking-wider mb-1">Contacted</div>
          <div className="text-2xl font-bold text-yellow-400">{leads.filter(l => l.status === 'contacted').length}</div>
        </Card>
        <Card className="p-4 bg-green-900/20 border-green-500/10">
          <div className="text-green-400 text-xs uppercase font-bold tracking-wider mb-1">Converted</div>
          <div className="text-2xl font-bold text-green-400">{leads.filter(l => l.status === 'converted').length}</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Leads Table */}
        <Card className="lg:col-span-2 bg-slate-900/40 border-white/5 overflow-hidden">
          <div className="p-4 border-b border-white/5 flex justify-between items-center">
            <div className="relative w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search leads..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-slate-800/50 border-white/10 text-white placeholder:text-slate-500"
              />
            </div>
            <span className="text-sm text-slate-500">{filteredLeads.length} leads</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5 text-slate-400 text-xs uppercase tracking-wider bg-white/5">
                  <th className="p-4 font-medium">Name</th>
                  <th className="p-4 font-medium">Type</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredLeads.map((lead) => (
                  <tr key={lead.id} className={`hover:bg-white/5 transition-colors cursor-pointer ${
                    selectedLead?.id === lead.id ? 'bg-cyan-500/5 border-l-2 border-l-cyan-500' : ''
                  }`}>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center">
                          <User className="w-4 h-4 text-cyan-400" />
                        </div>
                        <div className="font-medium text-slate-200">
                          {lead.company || `${lead.first_name || ""} ${lead.last_name || ""}` || "Unknown"}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-slate-400">{lead.business_type || '-'}</td>
                    <td className="p-4">{getStatusBadge(lead.status)}</td>
                    <td className="p-4 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-cyan-400 hover:bg-cyan-500/10"
                        onClick={() => handleRunAgent(lead)}
                        disabled={processingLeadId === lead.id}
                      >
                        {processingLeadId === lead.id ? (
                          <><Loader2 className="w-3 h-3 animate-spin mr-1" /> Running...</>
                        ) : (
                          <><Bot className="w-3 h-3 mr-1" /> Run Agent</>
                        )}
                      </Button>
                    </td>
                  </tr>
                ))}
                {filteredLeads.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-12 text-center text-slate-500">
                      <User className="w-12 h-12 mx-auto mb-3 opacity-20" />
                      <p>No leads found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Agent Workspace */}
        <Card className="lg:col-span-1 bg-slate-900/40 border-white/5">
          <div className="p-4 border-b border-white/5">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-cyan-400" />
              <h3 className="font-bold text-white">Agent Workspace</h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {selectedLead
                ? `Drafting for: ${selectedLead.company || selectedLead.first_name || 'Lead'}`
                : "Select a lead to begin"}
            </p>
          </div>

          <div className="p-4">
            {processingLeadId ? (
              <div className="space-y-4 py-8">
                <div className="h-4 bg-slate-800 rounded w-3/4 animate-pulse" />
                <div className="h-4 bg-slate-800 rounded w-1/2 animate-pulse" />
                <div className="h-20 bg-slate-800 rounded animate-pulse" />
                <p className="text-xs text-slate-500 text-center mt-4">Consulting Knowledge Base...</p>
              </div>
            ) : agentOutput ? (
              <div className="space-y-4">
                <div className="p-4 bg-slate-950/50 rounded-lg border border-white/10 text-sm text-slate-300 whitespace-pre-wrap font-mono max-h-[300px] overflow-y-auto">
                  {agentOutput.output}
                </div>

                {agentOutput.thoughtProcess && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-slate-500 uppercase">Thinking Process</p>
                    <ul className="text-xs text-slate-500 space-y-1 list-disc pl-4 bg-slate-950/30 p-3 rounded border border-white/5">
                      {agentOutput.thoughtProcess.map((thought, i) => (
                        <li key={i}>{thought}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex gap-2 pt-4 border-t border-white/5">
                  <Button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white" onClick={handleSendEmail}>
                    <Send className="w-4 h-4 mr-2" />
                    Approve & Send
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-40 text-slate-500 border-2 border-dashed border-white/10 rounded-lg">
                <FileText className="w-8 h-8 mb-2 opacity-30" />
                <p className="text-sm">Select a lead to start</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
