import React from "react";
import { format } from "date-fns";
import {
  CalendarDays,
  MapPin,
  Plus,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Wallet,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

export default function OrganizerOverview({ activeTrip, onNavigate }) {
  if (!activeTrip) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center space-y-4 animate-in fade-in zoom-in duration-500">
        <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4">
          <Sparkles className="w-10 h-10 text-blue-600 dark:text-blue-400" />
        </div>
        <h2 className="text-2xl font-bold font-['Outfit']">
          No Active Trip Found
        </h2>
        <p className="text-muted-foreground max-w-md">
          Ready to start your Samui adventure? Create your first trip plan to
          unlock the Command Center.
        </p>
        <Button
          size="lg"
          className="mt-4 bg-blue-600 hover:bg-blue-700"
          onClick={() => onNavigate("plan")}
        >
          <Plus className="w-4 h-4 mr-2" />
          Create New Trip
        </Button>
      </div>
    );
  }

  // Calculate stats
  const itemCount = activeTrip.items?.length || 0;
  const daysUntil = activeTrip.start_date
    ? Math.ceil(
        (new Date(activeTrip.start_date).getTime() - new Date().getTime()) /
          (1000 * 60 * 60 * 24),
      )
    : 0;

  const completionPercentage = Math.min(100, (itemCount / 10) * 100); // Mock progress

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* 1. Hero Section: Next Up / Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Status Card */}
        <Card className="md:col-span-2 border-none shadow-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 p-32 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <Badge className="bg-white/20 hover:bg-white/30 text-white border-none mb-2">
                  {daysUntil > 0 ? `${daysUntil} Days To Go` : "Trip Active"}
                </Badge>
                <CardTitle className="text-3xl font-bold font-['Outfit']">
                  {activeTrip.name}
                </CardTitle>
                <CardDescription className="text-blue-100 flex items-center gap-2 mt-1">
                  <CalendarDays className="w-4 h-4" />
                  {activeTrip.start_date
                    ? format(new Date(activeTrip.start_date), "MMM d, yyyy")
                    : "Date TBD"}
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm text-blue-100">
                <span>Trip Readiness</span>
                <span>{itemCount} Items Planned</span>
              </div>
              <Progress
                value={completionPercentage}
                className="h-2 bg-blue-800"
              />
            </div>

            <div className="mt-8 flex gap-3">
              <Button
                onClick={() => onNavigate("plan")}
                className="bg-white text-blue-700 hover:bg-blue-50 font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                Manage Itinerary
              </Button>
              <Button
                variant="outline"
                className="border-blue-400 text-white hover:bg-blue-600 hover:text-white bg-transparent"
              >
                Add Booking
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions / Recommendations */}
        <div className="space-y-6">
          <Card className="border-l-4 border-l-emerald-500 shadow-md hover:shadow-lg transition-all cursor-pointer group">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Wallet className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white">
                  Budget Tracker
                </h3>
                <p className="text-xs text-slate-500">Track spending vs plan</p>
              </div>
              <ArrowRight className="w-4 h-4 ml-auto text-slate-300 group-hover:text-emerald-500" />
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-amber-500 shadow-md hover:shadow-lg transition-all cursor-pointer group">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                <TrendingUp className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white">
                  Analytics
                </h3>
                <p className="text-xs text-slate-500">View trip stats</p>
              </div>
              <ArrowRight className="w-4 h-4 ml-auto text-slate-300 group-hover:text-amber-500" />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 2. Recent Items / Timeline Preview */}
      <div>
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-blue-600" />
          Itinerary Preview
        </h3>
        {itemCount === 0 ? (
          <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center bg-slate-50/50">
            <p className="text-slate-500 mb-2">Your itinerary is empty.</p>
            <Button variant="link" onClick={() => onNavigate("plan")}>
              Start Planning &rarr;
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {activeTrip.items.slice(0, 4).map((item, i) => (
              <Card
                key={item.id || i}
                className="hover:border-blue-400 transition-colors"
              >
                <CardHeader className="p-4 pb-2">
                  <Badge variant="outline" className="w-fit mb-2">
                    {item.type}
                  </Badge>
                  <CardTitle className="text-base truncate" title={item.title}>
                    {item.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <CalendarDays className="w-3 h-3" />
                    {item.start_time
                      ? format(new Date(item.start_time), "MMM d")
                      : "Unscheduled"}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
