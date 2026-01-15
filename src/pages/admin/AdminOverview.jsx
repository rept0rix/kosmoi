
import React, { useEffect, useState } from 'react';
import { AdminService } from '../../services/AdminService';
import { Card } from "@/components/ui/card";
import { Users, Building2, DollarSign, TrendingUp, Activity } from 'lucide-react';
import KosmoiLoader from '@/components/ui/KosmoiLoader';
import { useToast } from "@/components/ui/use-toast";

export default function AdminOverview() {
    const [stats, setStats] = useState({ totalUsers: 0, totalBusinesses: 0, mrr: 0, activeSubscriptions: 0 });
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        const loadStats = async () => {
            try {
                const data = await AdminService.getStats();
                setStats(data);
            } catch (e) {
                console.error("Stats Load Failed", e);
                toast({
                    title: "Failed to load dashboard stats",
                    description: "Please inspect the console for details.",
                    variant: "destructive"
                });
            } finally {
                setLoading(false);
            }
        };
        loadStats();
    }, []);

    if (loading) return <div className="flex justify-center items-center h-[50vh]"><KosmoiLoader /></div>;

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    Overview
                </h1>
                <p className="text-slate-400">System Performance & Key Metrics</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard
                    title="Total Users"
                    value={stats.totalUsers}
                    icon={<Users className="w-5 h-5 text-blue-400" />}
                    trend="+12% this week"
                />
                <StatCard
                    title="Active Businesses"
                    value={stats.totalBusinesses}
                    icon={<Building2 className="w-5 h-5 text-purple-400" />}
                    trend="+5 new today"
                />
                <StatCard
                    title="Monthly Revenue"
                    value={`$${stats.mrr}`}
                    icon={<DollarSign className="w-5 h-5 text-green-400" />}
                    trend="+8% from last month"
                />
                <StatCard
                    title="Active Subscriptions"
                    value={stats.activeSubscriptions}
                    icon={<TrendingUp className="w-5 h-5 text-orange-400" />}
                    trend="Stable"
                />
            </div>

            <div className="flex items-center gap-2 text-sm text-slate-500 bg-slate-900/50 px-3 py-1 rounded-full border border-white/5 w-fit">
                <Activity className="w-4 h-4 text-green-400" />
                <span>System Status: Operational</span>
            </div>
        </div>
    );
}

function StatCard({ title, value, icon, trend }) {
    return (
        <Card className="p-4 bg-slate-900/40 border-white/5 backdrop-blur-sm hover:border-white/10 transition-colors">
            <div className="flex justify-between items-start mb-2">
                <div className="text-sm font-medium text-slate-400">{title}</div>
                <div className="p-2 bg-slate-800/50 rounded-lg">{icon}</div>
            </div>
            <div className="text-2xl font-bold text-slate-100">{value}</div>
            <div className="text-xs text-slate-500 mt-1">{trend}</div>
        </Card>
    );
}
