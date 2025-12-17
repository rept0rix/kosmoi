import React from 'react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

const WorkflowStateBanner = ({ state }) => {
    if (!state || !state.workflowId) return null;

    const getStatusColor = (status) => {
        switch (status) {
            case 'running': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
            case 'completed': return 'bg-green-500/10 text-green-500 border-green-500/20';
            case 'failed': return 'bg-red-500/10 text-red-500 border-red-500/20';
            case 'waiting_approval': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
            default: return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
        }
    };

    const getIcon = (status) => {
        switch (status) {
            case 'running': return <Loader2 className="h-4 w-4 animate-spin" />;
            case 'completed': return <CheckCircle2 className="h-4 w-4" />;
            case 'failed': return <AlertCircle className="h-4 w-4" />;
            default: return <Loader2 className="h-4 w-4" />;
        }
    };

    return (
        <div className="px-6 pt-4">
            <Alert className={`${getStatusColor(state.status)} border backdrop-blur-sm`}>
                <div className="flex items-center gap-3">
                    {getIcon(state.status)}
                    <div className="flex-1">
                        <AlertTitle className="flex items-center gap-2">
                            Active Workflow: <span className="font-bold">{state.workflowId}</span>
                            <Badge variant="outline" className="ml-2 uppercase text-[10px] tracking-wider">
                                {state.status}
                            </Badge>
                        </AlertTitle>
                        <AlertDescription className="mt-1 text-xs opacity-90">
                            Current Step: <span className="font-semibold">{state.currentStepId || 'Initializing...'}</span>
                        </AlertDescription>
                    </div>
                </div>
            </Alert>
        </div>
    );
};

export default WorkflowStateBanner;
