import React, { useEffect, useState } from 'react';
import { db, realSupabase } from '../../api/supabaseClient';
import { approveToolCall, rejectToolCall } from '../../services/agents/AgentService';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Check, X, AlertTriangle } from 'lucide-react';

export function ApprovalQueue({ userId }) {
    const [approvals, setApprovals] = useState([]);

    useEffect(() => {
        if (!userId) return;

        // Initial fetch
        fetchApprovals();

        // Realtime subscription
        const subscription = realSupabase.channel('approvals')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'agent_approvals', filter: `user_id=eq.${userId}` }, (payload) => {
                fetchApprovals();
            })
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, [userId]);

    const fetchApprovals = async () => {
        const data = await db.entities.AgentApprovals.list(userId);
        if (data) setApprovals(data);
    };

    const handleApprove = async (id) => {
        try {
            await approveToolCall(id, userId);
            // Optimistic update
            setApprovals(prev => prev.filter(a => a.id !== id));
        } catch (e) {
            console.error("Approval failed:", e);
            alert("Failed to approve: " + e.message);
        }
    };

    const handleReject = async (id) => {
        try {
            await rejectToolCall(id);
            // Optimistic update
            setApprovals(prev => prev.filter(a => a.id !== id));
        } catch (e) {
            console.error("Rejection failed:", e);
            alert("Failed to reject: " + e.message);
        }
    };

    if (approvals.length === 0) return null;

    return (
        <Card className="border-yellow-500 bg-yellow-50/10 mb-4">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2 text-yellow-600">
                    <AlertTriangle className="h-4 w-4" />
                    Approval Queue ({approvals.length})
                </CardTitle>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[200px]">
                    <div className="space-y-3">
                        {approvals.map(approval => (
                            <div key={approval.id} className="flex flex-col gap-2 p-3 border rounded-md bg-background/50">
                                <div className="flex justify-between items-start">
                                    <div className="text-sm text-gray-400 mt-1">
                                        <span className="font-mono text-xs bg-gray-800 px-1 rounded mr-2">{approval.tool_name}</span>
                                        {approval.reasoning && (
                                            <div className="mt-2 p-2 bg-gray-800/50 rounded border border-gray-700 text-gray-300 italic text-xs">
                                                <span className="font-bold text-blue-400 not-italic">PLAN:</span> {approval.reasoning}
                                            </div>
                                        )}
                                        <div className="mt-1 font-mono text-xs text-gray-500 truncate" title={JSON.stringify(approval.payload)}>
                                            {JSON.stringify(approval.payload)}
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-100" onClick={() => handleReject(approval.id)}>
                                            <X className="h-4 w-4" />
                                        </Button>
                                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-green-500 hover:text-green-600 hover:bg-green-100" onClick={() => handleApprove(approval.id)}>
                                            <Check className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                                <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                                    {JSON.stringify(approval.payload, null, 2)}
                                </pre>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
