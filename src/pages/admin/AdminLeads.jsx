import React, { useState, useEffect } from 'react';
import { SalesService } from '../../services/SalesService';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Bot, FileText, Send, User } from 'lucide-react';
import { toast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";

export default function AdminLeads() {
    const [leads, setLeads] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [generatedDraft, setGeneratedDraft] = useState(null);
    const [activeLeadId, setActiveLeadId] = useState(null);
    const [isThinking, setIsThinking] = useState(false);

    useEffect(() => {
        loadLeads();
    }, []);

    const loadLeads = async () => {
        setIsLoading(true);
        try {
            // Fetch leads - for now, if empty, we might use mock data or let the user create one
            let data = await SalesService.getLeads();

            // MOCK DATA GENERATOR if empty (for Cycle 4 verification)
            if (!data || data.length === 0) {
                data = [
                    { id: 'mock-1', name: "Samui Yoga Studio", business_type: "Wellness", status: 'new', stage_id: 'new' },
                    { id: 'mock-2', name: "Joe's Burger Joint", business_type: "Restaurant", status: 'new', stage_id: 'new' }
                ];
            }
            setLeads(data);
        } catch (error) {
            console.error("Failed to load leads", error);
            toast({ title: "Error", description: "Could not load leads", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    const handleRunAgent = async (lead) => {
        setActiveLeadId(lead.id);
        setIsThinking(true);
        setGeneratedDraft(null);

        try {
            const result = await SalesService.runAgentForLead(lead);
            setGeneratedDraft(result);
            toast({ title: "Agent Finished", description: "Email draft generated successfully." });
        } catch (error) {
            console.error(error);
            toast({ title: "Agent Error", description: "Failed to run agent.", variant: "destructive" });
        } finally {
            setIsThinking(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-white">Leads Management</h1>
                    <p className="text-slate-400">View and engage with potential partners.</p>
                </div>
                <Button onClick={loadLeads} variant="outline">Refresh</Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Leads List */}
                <div className="lg:col-span-2">
                    <Card className="bg-slate-900 border-slate-800">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-slate-800 hover:bg-slate-800/50">
                                    <TableHead className="text-slate-400">Name</TableHead>
                                    <TableHead className="text-slate-400">Type</TableHead>
                                    <TableHead className="text-slate-400">Status</TableHead>
                                    <TableHead className="text-right text-slate-400">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {leads.map((lead) => (
                                    <TableRow key={lead.id} className="border-slate-800 hover:bg-slate-800/50">
                                        <TableCell className="font-medium text-slate-200">
                                            <div className="flex items-center gap-2">
                                                <User className="w-4 h-4 text-slate-500" />
                                                {lead.name}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-slate-400">{lead.business_type}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="border-slate-700 text-slate-400">
                                                {lead.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-950/30"
                                                onClick={() => handleRunAgent(lead)}
                                                disabled={isThinking && activeLeadId === lead.id}
                                            >
                                                {isThinking && activeLeadId === lead.id ? (
                                                    <span className="animate-pulse">Thinking...</span>
                                                ) : (
                                                    <>
                                                        <Bot className="w-4 h-4 mr-2" />
                                                        Draft Email
                                                    </>
                                                )}
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Card>
                </div>

                {/* Agent Workspace / Output */}
                <div className="lg:col-span-1">
                    <Card className="bg-slate-900 border-slate-800 h-full">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-white">
                                <Bot className="w-5 h-5 text-cyan-400" />
                                Agent Workspace
                            </CardTitle>
                            <CardDescription>Generated content will appear here.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isThinking ? (
                                <div className="space-y-4 animate-in fade-in">
                                    <div className="h-4 bg-slate-800 rounded w-3/4 animate-pulse"></div>
                                    <div className="h-4 bg-slate-800 rounded w-1/2 animate-pulse"></div>
                                    <div className="h-20 bg-slate-800 rounded animate-pulse"></div>
                                    <p className="text-xs text-slate-500 text-center mt-4">Consulting Knowledge Base...</p>
                                </div>
                            ) : generatedDraft ? (
                                <div className="space-y-4 animate-in slide-in-from-right-4">
                                    <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 text-sm text-slate-300 whitespace-pre-wrap font-mono">
                                        {generatedDraft.output}
                                    </div>

                                    {generatedDraft.thoughtProcess && (
                                        <div className="space-y-2">
                                            <p className="text-xs font-semibold text-slate-500 uppercase">Thinking Process</p>
                                            <ul className="text-xs text-slate-400 space-y-1 list-disc pl-4">
                                                {generatedDraft.thoughtProcess.map((thought, i) => (
                                                    <li key={i}>{thought}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    <div className="flex gap-2 mt-4">
                                        <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
                                            <Send className="w-4 h-4 mr-2" />
                                            Approve & Send
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-40 text-slate-600 border-2 border-dashed border-slate-800 rounded-lg">
                                    <FileText className="w-8 h-8 mb-2 opacity-50" />
                                    <p className="text-sm">Select a lead to start</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
