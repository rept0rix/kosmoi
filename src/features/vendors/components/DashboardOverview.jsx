import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/api/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart3, Bot, Star, Crown } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export const DashboardOverview = ({ business }) => {
    // 1. Fetch Views (Page Views)
    const { data: viewsCount, isLoading: loadingViews } = useQuery({
        queryKey: ['analytics', 'views', business.id],
        queryFn: async () => {
            console.log('Fetching analytics views for:', business.id);
            const { count, error } = await supabase
                .from('business_analytics')
                .select('*', { count: 'exact', head: true })
                .eq('provider_id', business.id)
                .eq('event_type', 'page_view');

            if (error) {
                console.error('Error fetching views:', error);
                throw error;
            }
            console.log('Views count:', count);
            return count || 0;
        }
    });

    // 2. Fetch Inquiries (Clicks/Interactions)
    const { data: inquiriesCount, isLoading: loadingInquiries } = useQuery({
        queryKey: ['analytics', 'inquiries', business.id],
        queryFn: async () => {
            console.log('Fetching analytics inquiries for:', business.id);
            // Count phone_click, whatsapp_click, line_click
            const { count, error } = await supabase
                .from('business_analytics')
                .select('*', { count: 'exact', head: true })
                .eq('provider_id', business.id)
                .in('event_type', ['phone_click', 'whatsapp_click', 'line_click']);

            if (error) {
                console.error('Error fetching inquiries:', error);
                throw error;
            }
            console.log('Inquiries count:', count);
            return count || 0;
        }
    });

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Views */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {loadingViews ? <Skeleton className="h-8 w-16" /> : (viewsCount ?? 0)}
                        </div>
                        <p className="text-xs text-muted-foreground">All time page views</p>
                    </CardContent>
                </Card>

                {/* Inquiries */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Inquiries</CardTitle>
                        <Bot className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {loadingInquiries ? <Skeleton className="h-8 w-16" /> : (inquiriesCount ?? 0)}
                        </div>
                        <p className="text-xs text-muted-foreground">Clicks on contact buttons</p>
                    </CardContent>
                </Card>

                {/* Rating */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Rating</CardTitle>
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{business.average_rating || 'New'}</div>
                        <p className="text-xs text-muted-foreground">{business.total_reviews || 0} reviews</p>
                    </CardContent>
                </Card>

                {/* Plan Status */}
                <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-100">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-indigo-900">Plan</CardTitle>
                        <Crown className="h-4 w-4 text-indigo-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-sm font-medium text-indigo-700 mb-1 capitalize">{business.status || 'Free'}</div>
                        <p className="text-xs text-indigo-600/80">Upgrade for more insights</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>Latest interactions with your business listing.</CardDescription>
                </CardHeader>
                <CardContent>
                    {/* Placeholder for future detailed activity feed */}
                    <div className="text-sm text-muted-foreground text-center py-8">
                        <div className="flex justify-center mb-4">
                            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
                                <Bot className="text-slate-400 w-6 h-6" />
                            </div>
                        </div>
                        <p>Detailed activity feed coming soon.</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
