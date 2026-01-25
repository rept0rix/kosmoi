import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/api/supabaseClient";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Crown, BarChart3, Sparkles, Star } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { subDays, format, startOfDay, endOfDay } from "date-fns";

export const DashboardAnalytics = ({ business }) => {
  // Fetch last 30 days of analytics data
  const { data: analyticsEvents, isLoading } = useQuery({
    queryKey: ["analytics", "chart", business.id],
    queryFn: async () => {
      const thirtyDaysAgo = subDays(new Date(), 30).toISOString();

      const { data, error } = await supabase
        .from("business_analytics")
        .select("event_type, created_at, visitor_id")
        .eq("provider_id", business.id)
        .gte("created_at", thirtyDaysAgo)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  // Process data for charts
  const chartData = useMemo(() => {
    if (!analyticsEvents) return [];

    // Initialize last 7 days with 0
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = subDays(new Date(), i);
      days.push({
        name: format(d, "EEE"), // Mon, Tue...
        date: format(d, "yyyy-MM-dd"),
        views: 0,
        clicks: 0,
        uniqueValues: new Set(),
      });
    }

    // Aggregate counts
    analyticsEvents.forEach((event) => {
      const eventDate = format(new Date(event.created_at), "yyyy-MM-dd");
      const dayEntry = days.find((d) => d.date === eventDate);

      if (dayEntry) {
        if (event.event_type === "page_view") {
          dayEntry.views += 1;
          if (event.visitor_id) dayEntry.uniqueValues.add(event.visitor_id);
        } else if (
          ["phone_click", "whatsapp_click", "line_click"].includes(
            event.event_type,
          )
        ) {
          dayEntry.clicks += 1;
        }
      }
    });

    // Convert Set size to number and cleanup
    return days.map((day) => ({
      ...day,
      unique: day.uniqueValues.size,
      uniqueValues: undefined,
    }));
  }, [analyticsEvents]);

  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  const isPremium =
    business.status === "premium" || business.status === "verified";

  // --- Vibe Score Logic ---
  const calculateVibe = () => {
    let score = 40; // Base score for being on the platform
    if (business.logo_url) score += 10;
    if (business.images?.length >= 3) score += 15;
    if (business.description?.length > 20) score += 10;
    if (business.location) score += 5;
    // Boost for engagement
    if (chartData.some((d) => d.views > 0)) score += 10;
    if (business.status === "verified") score += 10;

    return Math.min(score, 100);
  };
  const vibeScore = calculateVibe();

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Business Performance</h2>

      {/* Vibe Score Card */}
      <Card className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-0 shadow-lg">
        <CardContent className="flex items-center justify-between p-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-5 h-5 text-yellow-300" />
              <h3 className="text-lg font-bold">Your Vibe Score</h3>
            </div>
            <p className="text-indigo-100 text-sm max-w-md">
              Your Vibe Score reflects your profile quality and visitor
              engagement. Aim for 100 to maximize trust!
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <span className="text-4xl font-extrabold tracking-tight">
                {vibeScore}
              </span>
              <span className="text-indigo-200 text-sm font-medium">/100</span>
            </div>
            <div className="h-12 w-12 rounded-full border-4 border-white/20 flex items-center justify-center bg-white/10">
              {vibeScore >= 80 ? (
                <Crown className="w-6 h-6 text-yellow-400" />
              ) : (
                <Star className="w-6 h-6 text-white" />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Views Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Visitor Trends (Last 7 Days)</CardTitle>
            <CardDescription>
              Daily page views on your business profile.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {chartData.some((d) => d.views > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="views"
                    stroke="#8884d8"
                    fillOpacity={1}
                    fill="url(#colorViews)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-sm">
                <BarChart3 className="w-10 h-10 mb-2 opacity-20" />
                <p>No view data yet.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Engagement / Demographics (Locked for Free) */}
        <Card className="relative overflow-hidden">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Interaction Types</CardTitle>
              {!isPremium && <Crown className="w-5 h-5 text-yellow-500" />}
            </div>
            <CardDescription>
              Breakdown of how users are contacting you.
            </CardDescription>
          </CardHeader>

          <CardContent
            className={`h-[300px] flex items-center justify-center select-none ${!isPremium ? "blur-sm" : ""}`}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="views" name="Page Views" fill="#94a3b8" />
                <Bar dataKey="clicks" name="Inquiries" fill="#4f46e5" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>

          {/* Paywall Overlay */}
          {!isPremium && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/60 z-10">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg mb-4">
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-800">
                Advanced Analytics
              </h3>
              <p className="text-slate-600 mb-4 max-w-xs text-center">
                See clicks, unique visitors, and conversion rates.
              </p>
              <Button className="bg-slate-900 hover:bg-slate-800 text-white">
                Upgrade to Pro
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
