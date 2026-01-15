import React, { useEffect, useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ActivityLogService } from '@/services/ActivityLogService';
import { Loader2 } from 'lucide-react';

export default function AdminUserLogsDialog({ isOpen, onClose, user }) {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen && user) {
            loadLogs(user.id);
        }
    }, [isOpen, user]);

    const loadLogs = async (userId) => {
        setLoading(true);
        const { data } = await ActivityLogService.getLogsByUser(userId);
        setLogs(data || []);
        setLoading(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[80vh] bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 flex flex-col">
                <DialogHeader>
                    <DialogTitle>Activity Logs</DialogTitle>
                    <DialogDescription>
                        User: {user?.email} ({user?.id})
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-hidden mt-4">
                    {loading ? (
                        <div className="flex justify-center items-center h-40">
                            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
                        </div>
                    ) : (
                        <ScrollArea className="h-[50vh] pr-4">
                            {logs.length === 0 ? (
                                <p className="text-center text-slate-500 py-8">No activity logs found for this user.</p>
                            ) : (
                                <div className="space-y-4">
                                    {logs.map((log) => (
                                        <div key={log.id} className="p-3 border rounded-lg border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                            <div className="flex justify-between items-start mb-1">
                                                <span className={`text-xs font-bold px-2 py-1 rounded ${log.action_type === 'LOGIN' ? 'bg-green-100 text-green-700' :
                                                        log.action_type === 'LOGOUT' ? 'bg-orange-100 text-orange-700' :
                                                            log.action_type === 'TRANSFER' ? 'bg-blue-100 text-blue-700' :
                                                                'bg-slate-100 text-slate-700'
                                                    }`}>
                                                    {log.action_type}
                                                </span>
                                                <span className="text-xs text-slate-500 font-mono">
                                                    {new Date(log.created_at).toLocaleString()}
                                                </span>
                                            </div>
                                            <p className="text-sm font-medium text-slate-900 dark:text-gray-100 mt-2">
                                                {log.description}
                                            </p>
                                            {log.metadata && Object.keys(log.metadata).length > 0 && (
                                                <pre className="text-[10px] text-slate-500 mt-2 bg-slate-50 dark:bg-black/20 p-2 rounded overflow-x-auto">
                                                    {JSON.stringify(log.metadata, null, 2)}
                                                </pre>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                    )}
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800 mt-auto">
                    <Button variant="outline" onClick={onClose}>Close</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
