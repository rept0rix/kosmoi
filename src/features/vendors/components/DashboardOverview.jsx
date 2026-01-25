import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/api/supabaseClient";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  BarChart3,
  Bot,
  Star,
  Crown,
  CheckCircle2,
  Circle,
  ArrowRight,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

export const DashboardOverview = ({ business }) => {
  // 1. Fetch Views (Page Views)
  const { data: viewsCount, isLoading: loadingViews } = useQuery({
    queryKey: ["analytics", "views", business.id],
    queryFn: async () => {
      console.log("Fetching analytics views for:", business.id);
      const { count, error } = await supabase
        .from("business_analytics")
        .select("*", { count: "exact", head: true })
        .eq("provider_id", business.id)
        .eq("event_type", "page_view");

      if (error) {
        console.error("Error fetching views:", error);
        throw error;
      }
      console.log("Views count:", count);
      return count || 0;
    },
  });

  // 2. Fetch Inquiries (Clicks/Interactions)
  const { data: inquiriesCount, isLoading: loadingInquiries } = useQuery({
    queryKey: ["analytics", "inquiries", business.id],
    queryFn: async () => {
      console.log("Fetching analytics inquiries for:", business.id);
      // Count phone_click, whatsapp_click, line_click
      const { count, error } = await supabase
        .from("business_analytics")
        .select("*", { count: "exact", head: true })
        .eq("provider_id", business.id)
        .in("event_type", ["phone_click", "whatsapp_click", "line_click"]);

      if (error) {
        console.error("Error fetching inquiries:", error);
        throw error;
      }
      console.log("Inquiries count:", count);
      return count || 0;
    },
  });

  // --- Gamification Logic: Profile Health ---
  const calculateHealth = () => {
    let score = 0;
    const total = 100;
    const checks = [
      {
        id: "name",
        label: "Business Name",
        completed: !!business.business_name,
        points: 10,
      },
      {
        id: "logo",
        label: "Upload Logo",
        completed: !!business.logo_url,
        points: 20,
      },
      {
        id: "desc",
        label: "Add Description",
        completed: !!business.description && business.description.length > 20,
        points: 15,
      },
      {
        id: "loc",
        label: "Set Location",
        completed: !!business.location,
        points: 15,
      },
      {
        id: "contact",
        label: "Add Contact Info",
        completed: !!business.phone || !!business.line || !!business.whatsapp,
        points: 15,
      },
      {
        id: "hours",
        label: "Set Opening Hours",
        completed:
          business.opening_hours &&
          Object.keys(business.opening_hours).length > 0,
        points: 10,
      },
      {
        id: "images",
        label: "Add Gallery Photos",
        completed: business.images && business.images.length >= 3,
        points: 15,
      },
    ];

    const completedChecks = checks.filter((c) => c.completed);
    const currentScore = completedChecks.reduce(
      (acc, curr) => acc + curr.points,
      0,
    );
    const nextSteps = checks.filter((c) => !c.completed).slice(0, 3); // Top 3 missing

    return {
      score: currentScore,
      nextSteps,
      totalChecks: checks.length,
      completedCount: completedChecks.length,
    };
  };

  const { score, nextSteps } = calculateHealth();

  return (
    <div className="space-y-6">
      {/* Gamification: Profile Health Widget */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg flex items-center gap-2">
                <Crown className="w-5 h-5 text-blue-600" />
                Profile Health: <span className="text-blue-700">{score}%</span>
              </CardTitle>
              <CardDescription>
                {score === 100
                  ? "Your profile is fully optimized! Great job."
                  : "Complete these steps to boost your visibility."}
              </CardDescription>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="bg-white hover:bg-slate-50"
              onClick={() => {
                const tabTriggers = document.querySelectorAll('[role="tab"]');
                const profileTab = Array.from(tabTriggers).find(
                  (t) => t.textContent === "Profile",
                );
                if (profileTab instanceof HTMLElement) {
                  profileTab.click();
                } else {
                  // Fallback if role attributes aren't perfect, though radix-ui tabs usually have them.
                  // Or target by value if possible, depending on Tabs impl.
                  // The radix-ui Tabs triggers have `data-state` and value is prop, not necessarily attribute.
                  // But we set `value="profile"` on the item in `DashboardSingleView`.
                  // The layout uses `onClick={() => setActiveTab(item.id)}` on regular buttons in sidebar.
                  // AND actual TabsTrigger in TabsList?
                  // Wait, `DashboardSingleView` controls `activeTab` state.
                  // But `DashboardOverview` is a child. It can't easily set state unless we pass a setter.
                  // Or we can simulate a click on the sidebar button?
                  // The sidebar buttons have `onClick={() => setActiveTab('profile')}`.
                  // They don't have unique IDs.
                  // Let's defer this complex interaction or just pass `onEditProfile` prop if we were refactoring.
                  // For now, let's just try to click the sidebar button by text "Profile".
                  const buttons = document.querySelectorAll("button");
                  for (const btn of buttons) {
                    if (btn.textContent?.includes("Profile")) {
                      btn.click();
                      break;
                    }
                  }
                }
              }}
            >
              Edit Profile
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Progress value={score} className="h-2" />

            {nextSteps.length > 0 && (
              <div className="grid gap-3 md:grid-cols-3">
                {nextSteps.map((step) => (
                  <div
                    key={step.id}
                    className="flex items-center gap-3 bg-white p-3 rounded-lg border border-blue-100 shadow-sm"
                  >
                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                      <Circle className="w-4 h-4 text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-700 truncate">
                        {step.label}
                      </p>
                      <p className="text-xs text-blue-500">
                        +{step.points} pts
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* ... Existing Cards ... */}
        {/* Total Views */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loadingViews ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                (viewsCount ?? 0)
              )}
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
              {loadingInquiries ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                (inquiriesCount ?? 0)
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Clicks on contact buttons
            </p>
          </CardContent>
        </Card>

        {/* Rating */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rating</CardTitle>
            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {business.average_rating || "New"}
            </div>
            <p className="text-xs text-muted-foreground">
              {business.total_reviews || 0} reviews
            </p>
          </CardContent>
        </Card>

        {/* Plan Status */}
        <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-indigo-900">
              Plan
            </CardTitle>
            <Crown className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium text-indigo-700 mb-1 capitalize">
              {business.status || "Free"}
            </div>
            <p className="text-xs text-indigo-600/80">
              Upgrade for more insights
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Latest interactions with your business listing.
          </CardDescription>
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
