import React, { useState } from 'react';
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
    X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// Placeholder sub-components (will be real files later)
const OverviewTab = ({ business }) => (
    <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">1,234</div>
                    <p className="text-xs text-muted-foreground">+12% from last month</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Inquiries</CardTitle>
                    <Bot className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">15</div>
                    <p className="text-xs text-muted-foreground">+3 new today</p>
                </CardContent>
            </Card>
        </div>

        <Card>
            <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest interactions with your business listing.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="text-sm text-muted-foreground text-center py-8">
                    No recent activity to show properly yet. (Mock Data)
                </div>
            </CardContent>
        </Card>
    </div>
);

import { BusinessProfileEditor } from '@/features/vendors/components/BusinessProfileEditor';

// Profile Tab is now handled by the dedicated editor component
const ProfileTab = ({ business }) => (
    <BusinessProfileEditor business={business} />
);

export function DashboardSingleView({ business, onBack }) {
    const [activeTab, setActiveTab] = useState('overview');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const navItems = [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
        { id: 'profile', label: 'Profile', icon: Store },
        { id: 'analytics', label: 'Analytics', icon: BarChart3 },
        { id: 'agents', label: 'AI Agents', icon: Bot },
        { id: 'settings', label: 'Settings', icon: Settings },
    ];

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden">
            {/* Sidebar - Desktop */}
            <aside className="hidden md:flex w-64 flex-col bg-white border-r border-slate-200">
                <div className="p-4 border-b border-slate-200 flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                        K
                    </div>
                    <span className="font-bold text-lg text-slate-900">Kosmoi Business</span>
                </div>
                <div className="flex-1 py-4 px-3 space-y-1">
                    {navItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`flex items-center gap-3 w-full px-3 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === item.id
                                ? 'bg-blue-50 text-blue-700'
                                : 'text-slate-600 hover:bg-slate-100'
                                }`}
                        >
                            <item.icon className="w-5 h-5" />
                            {item.label}
                        </button>
                    ))}
                </div>
                <div className="p-4 border-t border-slate-200">
                    <Button variant="outline" className="w-full justify-start" onClick={onBack}>
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
                        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                            <Menu className="w-5 h-5" />
                        </Button>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold">
                                {business.business_name.charAt(0)}
                            </div>
                            <div>
                                <h1 className="text-lg font-semibold leading-tight">{business.business_name}</h1>
                                <Badge variant="outline" className="text-xs font-normal">
                                    {business.status || 'Free Plan'}
                                </Badge>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon">
                            <Bell className="w-5 h-5 text-slate-500" />
                        </Button>
                        <Avatar className="w-8 h-8">
                            <AvatarFallback>BM</AvatarFallback>
                        </Avatar>
                    </div>
                </header>

                {/* Scrollable Content Area */}
                <main className="flex-1 overflow-auto p-4 sm:p-6">
                    <div className="max-w-6xl mx-auto">
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                            <TabsContent value="overview" className="mt-0">
                                <OverviewTab business={business} />
                            </TabsContent>
                            <TabsContent value="profile" className="mt-0">
                                <ProfileTab business={business} />
                            </TabsContent>
                            <TabsContent value="analytics" className="mt-0">
                                <div className="flex items-center justify-center h-64 border-2 border-dashed rounded-lg bg-slate-50">
                                    <div className="text-center">
                                        <BarChart3 className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                                        <h3 className="text-lg font-medium text-slate-900">Analytics Coming Soon</h3>
                                        <p className="text-slate-500">Detailed insights are being built.</p>
                                    </div>
                                </div>
                            </TabsContent>
                            <TabsContent value="agents" className="mt-0">
                                <div className="flex items-center justify-center h-64 border-2 border-dashed rounded-lg bg-slate-50">
                                    <div className="text-center">
                                        <Bot className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                                        <h3 className="text-lg font-medium text-slate-900">AI Agents Hub</h3>
                                        <p className="text-slate-500">Configure your autopilot assistants here.</p>
                                    </div>
                                </div>
                            </TabsContent>
                            <TabsContent value="settings" className="mt-0">
                                <div className="flex items-center justify-center h-64 border-2 border-dashed rounded-lg bg-slate-50">
                                    <div className="text-center">
                                        <Settings className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                                        <h3 className="text-lg font-medium text-slate-900">Settings</h3>
                                        <p className="text-slate-500">Global business settings.</p>
                                    </div>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>
                </main>
            </div>

            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div className="fixed inset-0 z-50 md:hidden">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setIsSidebarOpen(false)} />
                    <div className="absolute left-0 top-0 bottom-0 w-64 bg-white shadow-xl flex flex-col">
                        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                            <span className="font-bold text-lg">Menu</span>
                            <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(false)}>
                                <X className="w-5 h-5" />
                            </Button>
                        </div>
                        <div className="flex-1 py-4 px-3 space-y-1">
                            {navItems.map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => {
                                        setActiveTab(item.id);
                                        setIsSidebarOpen(false);
                                    }}
                                    className={`flex items-center gap-3 w-full px-3 py-2 text-sm font-medium rounded-md ${activeTab === item.id
                                        ? 'bg-blue-50 text-blue-700'
                                        : 'text-slate-600 hover:bg-slate-100'
                                        }`}
                                >
                                    <item.icon className="w-5 h-5" />
                                    {item.label}
                                </button>
                            ))}
                        </div>
                        <div className="p-4 border-t border-slate-200">
                            <Button variant="outline" className="w-full justify-start" onClick={onBack}>
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
