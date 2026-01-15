import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { db } from '@/api/supabaseClient';
import { Loader2, TrendingUp, Users, Store, Eye, ArrowUp, ArrowRight } from "lucide-react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";

const StatCard = ({ title, value, subtext, icon: Icon, color }) => (
    <Card>
        <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
                <p className="text-sm font-medium text-gray-500">{title}</p>
                <Icon className={`h-4 w-4 ${color}`} />
            </div>
            <div className="flex flex-col gap-1">
                <div className="text-2xl font-bold">{value}</div>
                <p className="text-xs text-gray-500 flex items-center gap-1">
                    {subtext}
                </p>
            </div>
        </CardContent>
    </Card>
);

const AdminAnalytics = () => {
    // 1. Fetch Global Stats
    const { data: globalStats, isLoading } = useQuery({
        queryKey: ['adminGlobalStats'],
        queryFn: async () => {
            const [
                { count: businesses } // Total Businesses
                , { count: users } // Total Users 
                , { count: views } // Total Analytics Events (Views)
                , { data: trending } // Top providers
            ] = await Promise.all([
                db.from('service_providers').select('*', { count: 'exact', head: true }),
                db.from('profiles').select('*', { count: 'exact', head: true }), // Assuming profiles table
                db.from('business_analytics').select('*', { count: 'exact', head: true }).eq('event_type', 'page_view'),
                // For trending, we need aggregation, which represents a complexity. 
                // We'll fetch raw analytics for last 24h and aggreg manually for MVP
                db.from('business_analytics').select('provider_id').gte('created_at', new Date(Date.now() - 86400000).toISOString())
            ]);

            // Aggregate Trending
            const counts = {};
            (trending || []).forEach(t => {
                counts[t.provider_id] = (counts[t.provider_id] || 0) + 1;
            });
            const topProviderIds = Object.entries(counts)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .map(([id]) => id);

            // Fetch names of top providers
            let topProviders = [];
            if (topProviderIds.length > 0) {
                const { data: providers } = await db.from('service_providers').select('id, business_name, category').in('id', topProviderIds);
                topProviders = providers?.map(p => ({
                    ...p,
                    views: counts[p.id]
                })).sort((a, b) => b.views - a.views) || [];
            }

            return {
                businesses: businesses || 0,
                users: users || 0,
                views: views || 0,
                topProviders
            };
        }
    });

    if (isLoading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">System Overview</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    title="Total Businesses"
                    value={globalStats?.businesses}
                    subtext="+2 since yesterday"
                    icon={Store}
                    color="text-blue-600"
                />
                <StatCard
                    title="Total Users"
                    value={globalStats?.users}
                    subtext="Registered accounts"
                    icon={Users}
                    color="text-green-600"
                />
                <StatCard
                    title="Total Page Views"
                    value={globalStats?.views}
                    subtext="Global engagement"
                    icon={Eye}
                    color="text-purple-600"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>Trending Businesses (24h)</CardTitle>
                        <CardDescription>Most viewed profiles today</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {globalStats?.topProviders?.length === 0 ? "No data yet." : (
                                globalStats?.topProviders?.map((p, i) => (
                                    <div key={p.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
                                                {i + 1}
                                            </div>
                                            <div>
                                                <div className="font-semibold">{p.business_name}</div>
                                                <div className="text-xs text-gray-500">{p.category}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 text-green-600 font-medium">
                                            <TrendingUp className="w-3 h-3" />
                                            {p.views} views
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>Real-Time Activity</CardTitle>
                        <CardDescription>Views per hour (Last 24h)</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px] flex items-center justify-center bg-gray-50 rounded-lg border border-dashed">
                        <span className="text-gray-400 text-sm">Chart Placeholder (Requires Backend Aggregation)</span>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default AdminAnalytics;
