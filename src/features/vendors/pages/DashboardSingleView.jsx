import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/shared/lib/utils";
import {
  LayoutDashboard,
  User,
  BarChart3,
  Settings,
  Bot,
  Store,
  ArrowLeft,
  Bell,
  Search,
  Menu,
  X,
  Send,
  ThumbsUp,
  Star,
  Zap,
  Users,
  CreditCard,
  Globe,
  Eye,
  MessageCircle,
  FileText,
  ImageIcon,
  Crown,
  ExternalLink,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BusinessProfileEditor } from "@/features/vendors/components/BusinessProfileEditor";
import { ProviderInbox } from "@/features/vendors/components/ProviderInbox";

// --- Sub-components ---

// Imports for sub-components
import { DashboardOverview } from "@/features/vendors/components/DashboardOverview";
import { DashboardReviews } from "@/features/vendors/components/DashboardReviews";
import { DashboardSettings } from "@/features/vendors/components/DashboardSettings";
import { DashboardAnalytics } from "@/features/vendors/components/DashboardAnalytics";
import { DashboardPosts } from "@/features/vendors/components/DashboardPosts";
import { DashboardAgents } from "@/features/vendors/components/DashboardAgents";

// --- Main Component ---

export function DashboardSingleView({ business, onBack }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleViewPublicPage = () => {
    // Correct URL for public provider profile
    const url = `/provider/${business.id}`;
    window.open(url, "_blank");
  };

  const navItems = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "profile", label: "Profile", icon: Store },
    { id: "reviews", label: "Reviews", icon: MessageCircle },
    { id: "messages", label: "Messages", icon: MessageSquare },
    { id: "posts", label: "Posts & Offers", icon: FileText },
    { id: "agents", label: "AI Agents", icon: Bot },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex w-64 flex-col bg-white border-r border-slate-200">
        <div className="p-4 border-b border-slate-200 flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
            K
          </div>
          <span className="font-bold text-lg text-slate-900">
            Kosmoi Business
          </span>
        </div>
        <div className="flex-1 py-4 px-3 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-3 w-full px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === item.id
                  ? "bg-blue-50 text-blue-700"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {item.label}
            </button>
          ))}
        </div>
        <div className="p-4 border-t border-slate-200 space-y-2">
          <Card className="bg-slate-900 text-white border-none p-3 mb-2">
            <div className="flex items-center gap-2 mb-2">
              <Crown className="w-4 h-4 text-yellow-400" />
              <span className="font-bold text-sm">Upgrade Plan</span>
            </div>
            <p className="text-xs text-slate-300 mb-3">
              Unlock all AI features & analytics.
            </p>
            <Button
              size="sm"
              variant="secondary"
              className="w-full h-7 text-xs"
              onClick={() => navigate("/pricing")}
            >
              View Plans
            </Button>
          </Card>
          <Button
            variant="ghost"
            className="w-full justify-start text-slate-500 hover:text-slate-700"
            onClick={onBack}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Switch Business
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
              <Menu className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold">
                {business.business_name.charAt(0)}
              </div>
              <div>
                <h1 className="text-lg font-semibold leading-tight flex items-center gap-2">
                  {business.business_name}
                  {business.verified && (
                    <Badge
                      variant="secondary"
                      className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none gap-1 px-1.5 py-0 h-5"
                    >
                      <Crown className="w-3 h-3 fill-current" /> Verified
                    </Badge>
                  )}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs font-normal">
                    {business.stripe_status === "paid"
                      ? "Premium Plan"
                      : business.status || "Free Plan"}
                  </Badge>
                  {business.stripe_status === "paid" && (
                    <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                      <Zap className="w-3 h-3" /> Active
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              className="hidden sm:flex bg-blue-600 hover:bg-blue-700 text-white"
              size="sm"
              onClick={handleViewPublicPage}
            >
              <ExternalLink className="w-4 h-4 mr-2" /> View Public Page
            </Button>
            <Button variant="ghost" size="icon">
              <Bell className="w-5 h-5 text-slate-500" />
            </Button>
            <Avatar className="w-8 h-8">
              <AvatarFallback>BM</AvatarFallback>
            </Avatar>
          </div>
        </header>

        {/* Scrollable Content Area */}
        <main className="flex-1 overflow-auto p-4 sm:p-6 bg-slate-50/50">
          <div className="max-w-6xl mx-auto">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="space-y-6"
            >
              <TabsContent value="overview" className="mt-0">
                <DashboardOverview business={business} />
              </TabsContent>
              <TabsContent value="profile" className="mt-0">
                <BusinessProfileEditor business={business} />
              </TabsContent>
              <TabsContent value="reviews" className="mt-0">
                <DashboardReviews business={business} />
              </TabsContent>
              <TabsContent value="messages" className="mt-0">
                <Card>
                  <CardContent className="p-0">
                    <ProviderInbox providerId={business.id} />
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="posts" className="mt-0">
                <DashboardPosts business={business} />
              </TabsContent>
              <TabsContent value="agents" className="mt-0">
                <DashboardAgents business={business} />
              </TabsContent>
              <TabsContent value="analytics" className="mt-0">
                <DashboardAnalytics business={business} />
              </TabsContent>
              <TabsContent value="settings" className="mt-0">
                <DashboardSettings business={business} />
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsSidebarOpen(false)}
          />
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-white shadow-xl flex flex-col">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <span className="font-bold text-lg">Menu</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSidebarOpen(false)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="flex-1 py-4 px-3 space-y-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsSidebarOpen(false);
                  }}
                  className={`flex items-center gap-3 w-full px-3 py-2 text-sm font-medium rounded-md ${
                    activeTab === item.id
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <item.icon className="w-5 h-5 shrink-0" />
                  {item.label}
                </button>
              ))}
            </div>
            <div className="p-4 border-t border-slate-200">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={onBack}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to List
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
