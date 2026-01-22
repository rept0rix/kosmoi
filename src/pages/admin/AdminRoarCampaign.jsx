
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CampaignService } from "../../services/CampaignService";
import { Car, Utensils, Wrench, RefreshCw, TrendingUp } from "lucide-react";

export default function AdminRoarCampaign() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    const loadStats = async () => {
        setLoading(true);
        try {
            const data = await CampaignService.getRoarStats();
            setStats(data);
        } catch (error) {
            console.error("Failed to load campaign stats", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadStats();
        // Auto-refresh every 30 seconds
        const interval = setInterval(loadStats, 30000);
        return () => clearInterval(interval);
    }, []);

    if (loading && !stats) {
        return <div className="p-8 text-center text-gray-500">Loading War Room...</div>;
    }

    return (
        <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
                        🦁 Operation Roar
                        <Badge className="bg-orange-500 hover:bg-orange-600">LIVE</Badge>
                    </h1>
                    <p className="text-slate-500">Campaign War Room & Real-time Analytics</p>
                </div>
                <button
                    onClick={loadStats}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                </button>
            </div>

            {/* Scoreboard */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-white border-l-4 border-l-blue-500 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardDescription>Total Leads</CardDescription>
                        <CardTitle className="text-4xl font-bold text-slate-800">{stats.total}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xs text-green-600 flex items-center">
                            <TrendingUp className="w-3 h-3 mr-1" />
                            All Time
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white border-l-4 border-l-yellow-500 shadow-sm">
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <CardDescription>Taxi (Stranded)</CardDescription>
                            <Car className="w-4 h-4 text-yellow-500" />
                        </div>
                        <CardTitle className="text-3xl font-bold text-slate-800">{stats.taxi}</CardTitle>
                    </CardHeader>
                </Card>

                <Card className="bg-white border-l-4 border-l-purple-500 shadow-sm">
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <CardDescription>Massage (Luxury)</CardDescription>
                            <Utensils className="w-4 h-4 text-purple-500" /> {/* Using Utensils/Spa icon logic if available, Utensils logic from generic lib */}
                        </div>
                        <CardTitle className="text-3xl font-bold text-slate-800">{stats.massage}</CardTitle>
                    </CardHeader>
                </Card>

                <Card className="bg-white border-l-4 border-l-red-500 shadow-sm">
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <CardDescription>Repair (Urgent)</CardDescription>
                            <Wrench className="w-4 h-4 text-red-500" />
                        </div>
                        <CardTitle className="text-3xl font-bold text-slate-800">{stats.repair}</CardTitle>
                    </CardHeader>
                </Card>
            </div>

            {/* Live Feed */}
            <Card className="border-0 shadow-md">
                <CardHeader className="bg-slate-900 text-white rounded-t-xl">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                        Live Feed
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="divide-y divide-slate-100">
                        {stats.recent.length === 0 ? (
                            <div className="p-8 text-center text-slate-400">
                                Waiting for first lead...
                            </div>
                        ) : (
                            stats.recent.map(lead => (
                                <div key={lead.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${lead.tags?.includes('taxi') ? 'bg-yellow-100 text-yellow-600' :
                                                lead.tags?.includes('massage') ? 'bg-purple-100 text-purple-600' :
                                                    'bg-red-100 text-red-600'
                                            }`}>
                                            {lead.tags?.includes('taxi') ? <Car className="w-5 h-5" /> :
                                                lead.tags?.includes('massage') ? <Utensils className="w-5 h-5" /> :
                                                    <Wrench className="w-5 h-5" />}
                                        </div>
                                        <div>
                                            <p className="font-medium text-slate-900">{lead.first_name || 'Guest'} {lead.last_name}</p>
                                            <p className="text-xs text-slate-500">
                                                {new Date(lead.created_at).toLocaleTimeString()} • {lead.source}
                                            </p>
                                        </div>
                                    </div>
                                    <Badge variant="outline">{lead.status}</Badge>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
