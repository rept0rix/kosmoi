import React, { useEffect, useState } from 'react';
import { Shield, ShieldAlert, Activity } from 'lucide-react';
import { realSupabase } from '../../api/supabaseClient';

const SentinelWidget = () => {
    const [status, setStatus] = useState('NOMINAL'); // NOMINAL | THREAT_DETECTED
    const [blockedCount, setBlockedCount] = useState(0);
    const [lastAlert, setLastAlert] = useState(null);

    useEffect(() => {
        // 1. Initial Fetch of Blocked Stats
        const fetchStats = async () => {
            try {
                const { count, error } = await realSupabase
                    .from('agent_tasks')
                    .select('*', { count: 'exact', head: true })
                    .ilike('result', '%SECURITY TERMINATION%');
                
                if (!error) {
                    setBlockedCount(count || 0);
                }
            } catch (e) {
                console.error("Sentinel stats fetch failed:", e);
            }
        };

        fetchStats();

        // 2. Real-time Subscription
        const channel = realSupabase
            .channel('sentinel-watch')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'agent_tasks' },
                (payload) => {
                    const newItem = payload.new;
                    // Check if this update is a Security Termination
                    if (newItem && newItem.status === 'failed' && newItem.result && newItem.result.includes('SECURITY TERMINATION')) {
                        setStatus('THREAT_DETECTED');
                        setBlockedCount(prev => prev + 1);
                        setLastAlert({
                            id: newItem.id,
                            message: newItem.result.replace('SECURITY TERMINATION: ', ''),
                            time: new Date().toLocaleTimeString()
                        });

                        // Reset status after 5 seconds
                        setTimeout(() => setStatus('NOMINAL'), 5000);
                    }
                }
            )
            .subscribe();

        return () => {
            realSupabase.removeChannel(channel);
        };
    }, []);

    const isAlert = status === 'THREAT_DETECTED';

    return (
        <div className={`p-4 rounded-xl border transition-all duration-500 ${isAlert ? 'bg-red-900/20 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.5)]' : 'bg-card border-border'}`}>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${isAlert ? 'bg-red-500 animate-pulse' : 'bg-green-500/20'}`}>
                        {isAlert ? <ShieldAlert className="w-6 h-6 text-white" /> : <Shield className="w-6 h-6 text-green-500" />}
                    </div>
                    <div>
                        <h3 className="font-semibold text-lg">Immune System</h3>
                        <p className={`text-xs font-mono uppercase ${isAlert ? 'text-red-400 font-bold' : 'text-green-500'}`}>
                            {isAlert ? 'THREAT ACTIVE' : 'SYSTEM NOMINAL'}
                        </p>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-2xl font-bold font-mono">{blockedCount}</div>
                    <div className="text-xs text-muted-foreground">Threats Blocked</div>
                </div>
            </div>

            {/* Live Activity Line */}
            <div className="h-1 w-full bg-secondary rounded-full overflow-hidden">
                <div className={`h-full w-full origin-left animate-[shimmer_2s_infinite] ${isAlert ? 'bg-red-500' : 'bg-green-500/50'}`} style={{ transform: 'scaleX(0.3)' }} />
            </div>

            {/* Last Alert Detail */}
            {lastAlert && (
                <div className="mt-3 text-xs bg-background/50 p-2 rounded border border-red-500/30 text-red-300 animate-in fade-in slide-in-from-top-2">
                    <span className="font-bold">[{lastAlert.time}] BLOCKED:</span> {lastAlert.message}
                </div>
            )}
        </div>
    );
};

export default SentinelWidget;
