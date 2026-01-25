import React from "react";
import { useAdminStats } from "@/shared/hooks/useAdminStats";
import UserTable from "../../components/admin/UserTable";
import BusinessTable from "../../components/admin/BusinessTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  Building2,
  DollarSign,
  TrendingUp,
  Activity,
  Terminal,
} from "lucide-react";

import LiveMap from "../../components/admin/LiveMap";
import AdminTodoList from "../../components/admin/AdminTodoList";
import SentinelWidget from "../../components/admin/SentinelWidget";
import LiveAgentFeed from "../../components/admin/LiveAgentFeed";

import VibeTicker from "../../components/admin/VibeTicker";
import FinancialPulse from "../../components/admin/FinancialPulse";
import TransactionTable from "../../components/admin/TransactionTable";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";

export default function AdminDashboard() {
  const {
    stats,
    users,
    businesses,
    loading,
    handleUserAction,
    handleBusinessAction,
  } = useAdminStats();

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans relative animate-in fade-in duration-500">
      {/* Sticky Ticker */}
      <div className="sticky top-0 z-50 border-b border-white/5 bg-slate-950/80 backdrop-blur-md">
        <VibeTicker />
      </div>

      <div className="p-8 space-y-8 max-w-[1920px] mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-4xl font-black text-white mb-2 tracking-tight">
              COMMAND{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
                CENTER
              </span>
            </h1>
            <p className="text-slate-400 font-mono text-sm">
              // PLATFORM_OVERVIEW & ADMINISTRATION
            </p>
          </div>
          {/* Security Widget */}
          <div className="w-full md:w-auto min-w-[300px]">
            <SentinelWidget />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard
            title="TOTAL_USER_NODES"
            value={stats.totalUsers}
            icon={<Users className="w-5 h-5 text-blue-400" />}
            trend="Daily Active Users"
            variant="blue"
          />
          <StatCard
            title="SERVICE_PROVIDERS"
            value={stats.totalBusinesses}
            icon={<Building2 className="w-5 h-5 text-purple-400" />}
            trend="Network Nodes"
            variant="purple"
          />
          <StatCard
            title="RECURRING_REVENUE"
            value={`$${stats.mrr}`}
            icon={<DollarSign className="w-5 h-5 text-emerald-400" />}
            trend="Est. Monthly"
            variant="emerald"
          />
          <StatCard
            title="ACTIVE_SUBS"
            value={stats.activeSubscriptions}
            icon={<TrendingUp className="w-5 h-5 text-orange-400" />}
            trend="Verified Plans"
            variant="orange"
          />
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="live" className="w-full">
          <TabsList className="bg-slate-900/50 border border-white/5 p-1 rounded-xl backdrop-blur-md w-full md:w-auto flex flex-wrap h-auto">
            <TabsTrigger
              value="live"
              className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white font-mono text-xs tracking-wider flex-1 md:flex-none"
            >
              LIVE_OPS
            </TabsTrigger>
            <TabsTrigger
              value="tasks"
              className="data-[state=active]:bg-purple-600 data-[state=active]:text-white font-mono text-xs tracking-wider flex-1 md:flex-none"
            >
              TASKS
            </TabsTrigger>
            <TabsTrigger
              value="users"
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white font-mono text-xs tracking-wider flex-1 md:flex-none"
            >
              USERS
            </TabsTrigger>
            <TabsTrigger
              value="businesses"
              className="data-[state=active]:bg-pink-600 data-[state=active]:text-white font-mono text-xs tracking-wider flex-1 md:flex-none"
            >
              BUSINESSES
            </TabsTrigger>
            <TabsTrigger
              value="finance"
              className="data-[state=active]:bg-amber-600 data-[state=active]:text-white font-mono text-xs tracking-wider flex-1 md:flex-none"
            >
              FINANCE
            </TabsTrigger>
            <TabsTrigger
              value="system"
              className="data-[state=active]:bg-slate-600 data-[state=active]:text-white font-mono text-xs tracking-wider flex-1 md:flex-none"
            >
              SYSTEM
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tasks" className="mt-6">
            <AdminTodoList />
          </TabsContent>

          <TabsContent
            value="live"
            className="mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500"
          >
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
              <div className="xl:col-span-3 space-y-6">
                <div className="h-[500px] rounded-xl overflow-hidden border border-white/10 shadow-2xl shadow-emerald-500/5">
                  <LiveMap businesses={businesses} />
                </div>
                <div className="h-[300px]">
                  <FinancialPulse />
                </div>
              </div>
              <div className="xl:col-span-1">
                <LiveAgentFeed />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="users" className="mt-6">
            <GlassCard className="p-0 overflow-hidden border-white/5 bg-slate-900/20">
              <UserTable users={users} onAction={handleUserAction} />
            </GlassCard>
          </TabsContent>

          <TabsContent value="businesses" className="mt-6">
            <GlassCard className="p-0 overflow-hidden border-white/5 bg-slate-900/20">
              <BusinessTable
                businesses={businesses}
                onAction={handleBusinessAction}
              />
            </GlassCard>
          </TabsContent>

          <TabsContent value="finance" className="mt-6 space-y-6">
            <FinancialPulse />
            <GlassCard className="p-0 overflow-hidden border-white/5 bg-slate-900/20">
              <TransactionTable />
            </GlassCard>
          </TabsContent>

          <TabsContent value="system" className="mt-6">
            <SystemVerification />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function SystemVerification() {
  const handleTestPayment = async () => {
    try {
      const { CreatePaymentLink } = await import("../../api/integrations");
      const result = await CreatePaymentLink({
        name: "System Verification Test",
        amount: 1,
        currency: "thb",
        success_url: window.location.href, // Return to dashboard
        cancel_url: window.location.href,
      });

      if (result.url) {
        window.open(result.url, "_blank");
      } else {
        alert(
          "Payment Link Creation Failed: " + (result.error || "Unknown error"),
        );
      }
    } catch (error) {
      alert("Error: " + error.message);
    }
  };

  const handleTestEmail = async () => {
    try {
      const { SendEmail } = await import("../../api/integrations");
      const result = await SendEmail({
        to: "naoryanko@gmail.com", // Send to admin
        subject: "System Verification: Edge Email Test",
        html: "<h1>It Works!</h1><p>This email was sent via Supabase Edge Function.</p>",
      });

      if (result.status === "success") {
        alert("Email Sent Successfully! Check your inbox.");
      } else {
        alert("Email Sending Failed: " + (result.error || "Unknown error"));
      }
    } catch (error) {
      console.error(error);
      alert("Error: " + error.message);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <GlassCard className="p-6 bg-slate-900/40 border-white/5 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <DollarSign className="w-24 h-24 text-green-500" />
        </div>
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-white">
          <DollarSign className="w-5 h-5 text-green-400" />
          Payment Gateway
        </h3>
        <p className="text-slate-400 mb-6 font-mono text-sm leading-relaxed">
          Generates a real 1 THB Stripe payment link using the{" "}
          <code>create-payment-link</code> Edge Function.
          <br />
          <span className="text-xs opacity-50 block mt-2">
            // VERIFIES STRIPE CONNECTIVITY
          </span>
        </p>
        <NeonButton
          onClick={handleTestPayment}
          variant="emerald"
          className="w-full justify-center"
        >
          INITIATE_TEST_TX (1 THB)
        </NeonButton>
      </GlassCard>

      <GlassCard className="p-6 bg-slate-900/40 border-white/5 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <Terminal className="w-24 h-24 text-blue-500" />
        </div>
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-white">
          <Activity className="w-5 h-5 text-blue-400" />
          Email Relay
        </h3>
        <p className="text-slate-400 mb-6 font-mono text-sm leading-relaxed">
          Sends a test email to the admin via Resend using the{" "}
          <code>send-email</code> Edge Function.
          <br />
          <span className="text-xs opacity-50 block mt-2">
            // VERIFIES SMTP/RESEND API
          </span>
        </p>
        <NeonButton
          onClick={handleTestEmail}
          variant="blue"
          className="w-full justify-center"
        >
          SEND_TEST_PACKET
        </NeonButton>
      </GlassCard>
    </div>
  );
}

function StatCard({ title, value, icon, trend, variant = "blue" }) {
  const borderColor = {
    blue: "group-hover:border-blue-500/50",
    purple: "group-hover:border-purple-500/50",
    emerald: "group-hover:border-emerald-500/50",
    orange: "group-hover:border-orange-500/50",
  }[variant];

  const bgGradient = {
    blue: "from-blue-500/5",
    purple: "from-purple-500/5",
    emerald: "from-emerald-500/5",
    orange: "from-orange-500/5",
  }[variant];

  return (
    <GlassCard
      className={`p-4 bg-slate-900/40 border-white/5 transition-all duration-300 group hover:-translate-y-1 ${borderColor}`}
    >
      <div
        className={`absolute inset-0 bg-gradient-to-br ${bgGradient} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
      />
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-2">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">
            {title}
          </div>
          <div className="p-2 bg-white/5 rounded-lg backdrop-blur-sm border border-white/5 group-hover:border-white/10 transition-colors">
            {icon}
          </div>
        </div>
        <div className="text-3xl font-black text-white tracking-tight">
          {value}
        </div>
        <div className="text-xs text-slate-500 mt-1 font-mono">{trend}</div>
      </div>
    </GlassCard>
  );
}
