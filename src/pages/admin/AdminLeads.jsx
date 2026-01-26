import React, { useState, useEffect } from "react";
import { SalesService } from "../../services/SalesService";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Bot, FileText, Send, User, Wifi, WifiOff } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";

export default function AdminLeads() {
  const [leads, setLeads] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // State for managing agent interactions
  const [processingLeadId, setProcessingLeadId] = useState(null);
  const [agentOutput, setAgentOutput] = useState(null);
  const [selectedLead, setSelectedLead] = useState(null);

  useEffect(() => {
    loadLeads();
  }, []);

  // Real-time subscription for instant updates
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
      if (!data || data.length === 0) {
        toast({
          title: "No Leads Found",
          description: "Create a new lead to get started.",
        });
      }
    } catch (error) {
      console.error("Failed to load leads", error);
      toast({
        title: "Error",
        description: "Could not load leads",
        variant: "destructive",
      });
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
      toast({
        title: "Agent Error",
        description: "Failed to run sales agent",
        variant: "destructive",
      });
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
        subject: subject,
        body: body,
      });

      toast({
        title: "Email Sent!",
        description: `Outreach sent to ${selectedLead.name}`,
      });
      setAgentOutput(null);
      setSelectedLead(null);
      loadLeads();
    } catch (error) {
      toast({
        title: "Send Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Leads Management</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Leads List */}
        <Card className="lg:col-span-2 border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-blue-500" />
              Recent Leads
            </CardTitle>
            <CardDescription>
              Manage and contact your potential partners.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Business Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell className="font-medium">
                      {lead.company ||
                        `${lead.first_name || ""} ${lead.last_name || ""}` ||
                        "Unknown"}
                    </TableCell>
                    <TableCell>{lead.business_type}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          lead.status === "contacted" ? "default" : "secondary"
                        }
                      >
                        {lead.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRunAgent(lead)}
                        disabled={processingLeadId === lead.id}
                      >
                        {processingLeadId === lead.id ? (
                          "Running..."
                        ) : (
                          <>Run Agent</>
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {leads.length === 0 && !isLoading && (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center h-24 text-gray-500"
                    >
                      No leads found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Agent Workspace */}
        <Card className="lg:col-span-1 bg-slate-50 border-slate-200 shadow-inner">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-cyan-500" />
              Agent Workspace
            </CardTitle>
            <CardDescription>
              {selectedLead
                ? `Drafting for: ${selectedLead.name}`
                : "Select a lead to begin"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {processingLeadId ? (
              <div className="space-y-4 animate-in fade-in py-8">
                <div className="h-4 bg-slate-200 rounded w-3/4 animate-pulse"></div>
                <div className="h-4 bg-slate-200 rounded w-1/2 animate-pulse"></div>
                <div className="h-20 bg-slate-200 rounded animate-pulse"></div>
                <p className="text-xs text-slate-500 text-center mt-4">
                  Consulting Knowledge Base...
                </p>
              </div>
            ) : agentOutput ? (
              <div className="space-y-4 animate-in slide-in-from-right-4">
                <div className="p-4 bg-white rounded-lg border border-slate-200 text-sm text-slate-700 whitespace-pre-wrap font-mono shadow-sm">
                  {agentOutput.output}
                </div>

                {agentOutput.thoughtProcess && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-slate-500 uppercase">
                      Thinking Process
                    </p>
                    <ul className="text-xs text-slate-500 space-y-1 list-disc pl-4 bg-slate-100 p-2 rounded">
                      {agentOutput.thoughtProcess.map((thought, i) => (
                        <li key={i}>{thought}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex gap-2 mt-4 pt-4 border-t border-slate-200">
                  <Button
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={handleSendEmail}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Approve & Send
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-40 text-slate-400 border-2 border-dashed border-slate-200 rounded-lg">
                <FileText className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-sm">Select a lead to start</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
