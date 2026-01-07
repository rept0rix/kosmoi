
import { useAdminStats } from '@/shared/hooks/useAdminStats';
import UserTable from '../../components/admin/UserTable';
import BusinessTable from '../../components/admin/BusinessTable';
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Building2, DollarSign, TrendingUp, Activity } from 'lucide-react';

import LiveMap from '../../components/admin/LiveMap';
import AdminTodoList from '../../components/admin/AdminTodoList';
import SentinelWidget from '../../components/admin/SentinelWidget';
import LiveAgentFeed from '../../components/admin/LiveAgentFeed';

export default function AdminDashboard() {
    const {
        stats,
        users,
        businesses,
        loading,
        handleUserAction,
        handleBusinessAction
    } = useAdminStats();

    return (
        <div className="min-h-screen bg-slate-950 text-white p-8 space-y-8 font-sans">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                        Command Center
                    </h1>
                    <p className="text-slate-400">Platform Overview & Administration</p>
                </div>
                {/* Security Widget */}
                <div className="min-w-[300px]">
                    <SentinelWidget />
                </div>
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

            {/* Main Content Tabs */}
            <Tabs defaultValue="tasks" className="w-full">
                <TabsList className="bg-slate-900/50 border border-white/5 p-1">
                    <TabsTrigger value="tasks" className="data-[state=active]:bg-purple-600 font-bold border-r-2 border-white/10">My Tasks</TabsTrigger>
                    <TabsTrigger value="live" className="data-[state=active]:bg-emerald-600">Live Ops</TabsTrigger>
                    <TabsTrigger value="users" className="data-[state=active]:bg-blue-600">Users</TabsTrigger>
                    <TabsTrigger value="businesses" className="data-[state=active]:bg-purple-600">Businesses</TabsTrigger>
                    <TabsTrigger value="finance" className="data-[state=active]:bg-green-600">Finance</TabsTrigger>
                    <TabsTrigger value="system" className="data-[state=active]:bg-orange-600">System</TabsTrigger>
                </TabsList>

                <TabsContent value="tasks" className="mt-6">
                    <AdminTodoList />
                </TabsContent>

                <TabsContent value="live" className="mt-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2">
                            <LiveMap />
                        </div>
                        <div>
                            <LiveAgentFeed />
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="users" className="mt-6">
                    <UserTable users={users} onAction={handleUserAction} />
                </TabsContent>

                <TabsContent value="businesses" className="mt-6">
                    <BusinessTable businesses={businesses} onAction={handleBusinessAction} />
                </TabsContent>

                <TabsContent value="finance" className="mt-6">
                    <Card className="p-12 text-center text-slate-500 border-dashed bg-transparent">
                        Finance Module (Stripe Integration) Coming Soon
                    </Card>
                </TabsContent>

                <TabsContent value="system" className="mt-6">
                    <SystemVerification />
                </TabsContent>
            </Tabs>
        </div>
    );
}

function SystemVerification() {
    const handleTestPayment = async () => {
        try {
            const { CreatePaymentLink } = await import('../../api/integrations');
            const result = await CreatePaymentLink({
                name: "System Verification Test",
                amount: 1,
                currency: 'thb',
                success_url: window.location.href, // Return to dashboard
                cancel_url: window.location.href
            });

            if (result.url) {
                window.open(result.url, '_blank');
            } else {
                alert('Payment Link Creation Failed: ' + (result.error || 'Unknown error'));
            }
        } catch (error) {
            alert('Error: ' + error.message);
        }
    };

    const handleTestEmail = async () => {
        try {
            const { SendEmail } = await import('../../api/integrations');
            const result = await SendEmail({
                to: "naoryanko@gmail.com", // Send to admin
                subject: "System Verification: Edge Email Test",
                html: "<h1>It Works!</h1><p>This email was sent via Supabase Edge Function.</p>"
            });

            if (result.status === 'success') {
                alert('Email Sent Successfully! Check your inbox.');
            } else {
                alert('Email Sending Failed: ' + (result.error || 'Unknown error'));
            }
        } catch (error) {
            console.error(error);
            alert('Error: ' + error.message);
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6 bg-slate-900/40 border-white/5">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-green-400" />
                    Payment Verification
                </h3>
                <p className="text-slate-400 mb-6">
                    Generates a real 1 THB Stripe payment link using the <code>create-payment-link</code> Edge Function.
                </p>
                <button
                    onClick={handleTestPayment}
                    className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                    Test Payment Link (1 THB)
                </button>
            </Card>

            <Card className="p-6 bg-slate-900/40 border-white/5">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-blue-400" />
                    Email Verification
                </h3>
                <p className="text-slate-400 mb-6">
                    Sends a test email to the admin via Resend using the <code>send-email</code> Edge Function.
                </p>
                <button
                    onClick={handleTestEmail}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                    Send Test Email
                </button>
            </Card>
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
