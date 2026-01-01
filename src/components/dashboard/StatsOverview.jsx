import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, MousePointerClick, Star, TrendingUp } from 'lucide-react';

export default function StatsOverview({ provider }) {
    // Generate some mock stats derived from real ID if real columns missing
    // In production, these would be real columns: provider.views_count, provider.clicks_count
    const views = provider?.views_count || 0;
    const clicks = provider?.clicks_count || 0;
    const rating = provider?.rating || 0;
    const reviews = provider?.reviews_count || 0;

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <Card className="bg-slate-900/50 border-white/5 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-slate-400">Total Views</CardTitle>
                    <Eye className="h-4 w-4 text-blue-400" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-white">{views}</div>
                    <p className="text-xs text-slate-500 mt-1 flex items-center">
                        <TrendingUp className="w-3 h-3 mr-1 text-green-400" />
                        +12% from last month
                    </p>
                </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-white/5 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-slate-400">WhatsApp Clicks</CardTitle>
                    <MousePointerClick className="h-4 w-4 text-green-400" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-white">{clicks}</div>
                    <p className="text-xs text-slate-500 mt-1">
                        High intent leads
                    </p>
                </CardContent>
            </Card>

            <Card className="bg-slate-900/50 border-white/5 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-slate-400">Average Rating</CardTitle>
                    <Star className="h-4 w-4 text-yellow-400" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-white">{rating.toFixed(1)}</div>
                    <p className="text-xs text-slate-500 mt-1">
                        Based on {reviews} reviews
                    </p>
                </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-indigo-600/20 to-purple-600/20 border-indigo-500/30 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-indigo-300">Pro Status</CardTitle>

                </CardHeader>
                <CardContent>
                    {/* Placeholder for subscription status */}
                    <div className="text-lg font-bold text-indigo-100">Free Tier</div>
                    <p className="text-xs text-indigo-300/70 mt-1">
                        Upgrade to unlock more
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
