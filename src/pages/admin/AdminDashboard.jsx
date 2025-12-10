
import React, { useEffect, useState } from 'react';
import { AdminService } from '../../services/AdminService';
import UserTable from '../../components/admin/UserTable';
import BusinessTable from '../../components/admin/BusinessTable';
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Building2, DollarSign, TrendingUp, Activity } from 'lucide-react';

export default function AdminDashboard() {
    const [stats, setStats] = useState({ totalUsers: 0, totalBusinesses: 0, mrr: 0, activeSubscriptions: 0 });
    const [users, setUsers] = useState([]);
    const [businesses, setBusinesses] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadData = async () => {
        setLoading(true);
        try {
            const [usersData, businessesData, statsData] = await Promise.all([
                AdminService.getUsers(),
                AdminService.getBusinesses(),
                AdminService.getStats()
            ]);

            setUsers(usersData);
            setBusinesses(businessesData);
            setStats(statsData);
        } catch (e) {
            console.error("Dashboard Load Failed", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []); // Only runs once on mount, but actions will call loadData

    const handleUserAction = async (type, user) => {
        if (type === 'ban') {
            await AdminService.toggleUserBan(user.id);
            await loadData();
        }
    };

    const handleBusinessAction = async (type, business) => {
        if (type === 'verify') {
            await AdminService.toggleBusinessVerification(business.id);
            await loadData();
        }
    };

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
                <div className="flex items-center gap-2 text-sm text-slate-500 bg-slate-900/50 px-3 py-1 rounded-full border border-white/5">
                    <Activity className="w-4 h-4 text-green-400" />
                    <span>System Status: Operational</span>
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
            <Tabs defaultValue="users" className="w-full">
                <TabsList className="bg-slate-900/50 border border-white/5 p-1">
                    <TabsTrigger value="users" className="data-[state=active]:bg-blue-600">Users</TabsTrigger>
                    <TabsTrigger value="businesses" className="data-[state=active]:bg-purple-600">Businesses</TabsTrigger>
                    <TabsTrigger value="finance" className="data-[state=active]:bg-green-600">Finance</TabsTrigger>
                </TabsList>

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
            </Tabs>
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
