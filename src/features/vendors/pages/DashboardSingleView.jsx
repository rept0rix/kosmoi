import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/shared/lib/utils';
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
    ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { BusinessProfileEditor } from '@/features/vendors/components/BusinessProfileEditor';
import { ReceptionistConfig } from '@/features/vendors/components/ReceptionistConfig';
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
    Legend
} from 'recharts';

// --- Sub-components ---

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
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Rating</CardTitle>
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{business.average_rating || 5.0}</div>
                    <p className="text-xs text-muted-foreground">{business.start_rating || 24} reviews</p>
                </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-100">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-indigo-900">Premium Plan</CardTitle>
                    <Crown className="h-4 w-4 text-indigo-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-sm font-medium text-indigo-700 mb-1">Unlock More</div>
                    <p className="text-xs text-indigo-600/80">Get advanced analytics & AI</p>
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
                    <div className="flex justify-center mb-4">
                        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
                            <Bot className="text-slate-400 w-6 h-6" />
                        </div>
                    </div>
                    <p>No recent activity to show properly yet.</p>
                </div>
            </CardContent>
        </Card>
    </div>
);

const ReviewsTab = ({ business }) => (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
            <div>
                <h2 className="text-lg font-semibold">Customer Reviews</h2>
                <p className="text-sm text-slate-500">Manage and reply to your reviews.</p>
            </div>
            <Button variant="outline">
                <ExternalLink className="w-4 h-4 mr-2" /> View on Public Page
            </Button>
        </div>

        <div className="grid gap-4">
            {/* Mock Reviews */}
            {[1, 2].map((i) => (
                <Card key={i}>
                    <CardContent className="p-6">
                        <div className="flex gap-4">
                            <Avatar>
                                <AvatarFallback>U{i}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 space-y-2">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className="font-semibold">Happy Customer {i}</h4>
                                        <div className="flex items-center gap-1 text-yellow-500">
                                            {[...Array(5)].map((_, j) => <Star key={j} className="w-3 h-3 fill-current" />)}
                                        </div>
                                    </div>
                                    <span className="text-xs text-slate-400">2 days ago</span>
                                </div>
                                <p className="text-sm text-slate-600">
                                    Great service! Really loved the atmosphere and the staff was super friendly. Highly recommended!
                                </p>
                                <div className="pt-2">
                                    <Button variant="ghost" size="sm" className="text-blue-600 h-auto p-0 hover:text-blue-700 hover:bg-transparent font-medium">
                                        <MessageCircle className="w-3 h-3 mr-1.5" /> Reply
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    </div>
);

const PostsTab = ({ business }) => (
    <div className="space-y-6">
        <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Create New Post</CardTitle>
                        <CardDescription>Share updates, offers, or news with your customers.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Textarea placeholder="What's new with your business?" className="min-h-[100px]" />
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" className="text-slate-600">
                                <ImageIcon className="w-4 h-4 mr-2" /> Add Photo
                            </Button>
                            <Button variant="outline" size="sm" className="text-slate-600">
                                <Crown className="w-4 h-4 mr-2 text-yellow-600" /> Boost Post
                            </Button>
                        </div>
                    </CardContent>
                    <CardFooter className="justify-end border-t bg-slate-50/50 p-4">
                        <Button className="bg-blue-600 hover:bg-blue-700">
                            <Send className="w-4 h-4 mr-2" /> Publish Post
                        </Button>
                    </CardFooter>
                </Card>

                <div className="space-y-4">
                    <h3 className="font-medium text-slate-900">Active Posts</h3>
                    {/* Mock Post */}
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex gap-4">
                                <div className="w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <ImageIcon className="w-6 h-6 text-slate-400" />
                                </div>
                                <div className="space-y-1 flex-1">
                                    <div className="flex justify-between">
                                        <h4 className="font-medium">Summer Sale Announcement</h4>
                                        <Badge variant="secondary" className="bg-green-100 text-green-700">Active</Badge>
                                    </div>
                                    <p className="text-sm text-slate-600 line-clamp-2">
                                        Don't miss out on our biggest summer sale yet! 50% off all items...
                                    </p>
                                    <div className="flex gap-4 pt-2 text-xs text-slate-500">
                                        <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> 245 views</span>
                                        <span className="flex items-center gap-1"><ThumbsUp className="w-3 h-3" /> 12 likes</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Sidebar / Tips */}
            <div className="space-y-4">
                <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-100">
                    <CardHeader>
                        <CardTitle className="text-amber-900 flex items-center gap-2">
                            <Crown className="w-5 h-5" /> Pro Tips
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-amber-800/80 space-y-3">
                        <p>Posts with images get <strong>2.3x</strong> more engagement.</p>
                        <p>Post at least once a week to keep your audience engaged.</p>
                        <Button size="sm" className="w-full bg-amber-600 hover:bg-amber-700 text-white border-none mt-2">
                            Unlock Premium Templates
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    </div>
);

const AgentsTab = ({ business }) => {
    const [selectedAgent, setSelectedAgent] = useState('receptionist');

    return (
        <div className="grid lg:grid-cols-4 gap-6 h-[calc(100vh-200px)]">
            {/* Agent Sidebar */}
            <div className="lg:col-span-1 space-y-4">
                <h2 className="text-lg font-semibold mb-4">Your Workforce</h2>

                <Card
                    className={`cursor-pointer transition-all ${selectedAgent === 'receptionist' ? 'ring-2 ring-blue-600 border-blue-600 bg-blue-50' : 'hover:border-slate-300'}`}
                    onClick={() => setSelectedAgent('receptionist')}
                >
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                            <Bot className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-sm">AI Receptionist</h3>
                            <Badge variant="secondary" className="text-[10px] h-4 px-1">Active</Badge>
                        </div>
                    </CardContent>
                </Card>

                <Card className="opacity-70">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                            <Zap className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-sm text-slate-500">Sales Agent</h3>
                            <Badge variant="outline" className="text-[10px] h-4 px-1">Coming Soon</Badge>
                        </div>
                    </CardContent>
                </Card>

                <Card className="opacity-70">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                            <Send className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-sm text-slate-500">Marketing Agent</h3>
                            <Badge variant="outline" className="text-[10px] h-4 px-1">Coming Soon</Badge>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Agent Config Area */}
            <div className="lg:col-span-3">
                {selectedAgent === 'receptionist' ? (
                    <div className="h-full overflow-y-auto pr-2">
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold">AI Receptionist Configuration</h2>
                            <p className="text-slate-500">Manage how your AI assistant handles customer inquiries, tone, and auto-replies.</p>
                        </div>
                        <ReceptionistConfig provider={business} />
                    </div>
                ) : (
                    <div className="h-full flex items-center justify-center text-slate-400">
                        Select an agent to configure
                    </div>
                )}
            </div>
        </div>
    );
};

const AnalyticsTab = ({ business }) => {
    // Mock Data
    const visitorData = [
        { name: 'Mon', views: 400, unique: 240 },
        { name: 'Tue', views: 300, unique: 139 },
        { name: 'Wed', views: 200, unique: 980 },
        { name: 'Thu', views: 278, unique: 390 },
        { name: 'Fri', views: 189, unique: 480 },
        { name: 'Sat', views: 239, unique: 380 },
        { name: 'Sun', views: 349, unique: 430 },
    ];

    return (
        <div className="space-y-6">
            <h2 className="text-lg font-semibold">Business Analytics</h2>

            <div className="grid md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Visitor Trends (Last 7 Days)</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={visitorData}
                                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
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
                                <Area type="monotone" dataKey="views" stroke="#8884d8" fillOpacity={1} fill="url(#colorViews)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="relative overflow-hidden">
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <CardTitle>Demographics & Engagement</CardTitle>
                            <Crown className="w-5 h-5 text-yellow-500" />
                        </div>
                        <CardDescription>Unlock deep insights about your audience.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px] flex items-center justify-center blur-sm select-none">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={visitorData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="views" fill="#82ca9d" />
                                <Bar dataKey="unique" fill="#8884d8" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>

                    {/* Paywall Overlay */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/60 z-10">
                        <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg mb-4">
                            <BarChart3 className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800">Advanced Analytics</h3>
                        <p className="text-slate-600 mb-4 max-w-xs text-center">See where your customers are coming from and how they interact.</p>
                        <Button className="bg-slate-900 hover:bg-slate-800 text-white">
                            Upgrade to Pro
                        </Button>
                    </div>
                </Card>
            </div>
        </div>
    );
};

const SettingsTab = ({ business }) => (
    <div className="max-w-2xl space-y-8">
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Globe className="w-5 h-5" /> Online Presence</CardTitle>
                <CardDescription>Manage how your business appears online.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-0.5">
                        <Label className="text-base">Public Profile</Label>
                        <p className="text-sm text-muted-foreground">Make your business visible to everyone.</p>
                    </div>
                    <Switch checked={true} />
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg bg-slate-50">
                    <div className="space-y-0.5">
                        <Label className="text-base flex items-center gap-2">Google Maps Sync <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">Connected</Badge></Label>
                        <p className="text-sm text-muted-foreground">Automatically update hours and photos from Google.</p>
                    </div>
                    <Button variant="outline" size="sm" disabled>Synched</Button>
                </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Bell className="w-5 h-5" /> Notifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                    <Label htmlFor="email-notifs">Email Notifications</Label>
                    <Switch id="email-notifs" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                    <Label htmlFor="push-notifs">Push Notifications</Label>
                    <Switch id="push-notifs" defaultChecked />
                </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><CreditCard className="w-5 h-5" /> Billing & Plan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-center justify-between bg-blue-50 p-4 rounded-lg border border-blue-100">
                    <div>
                        <p className="font-semibold text-blue-900">Current Plan: Free</p>
                        <p className="text-xs text-blue-600">Basic features</p>
                    </div>
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700">Upgrade</Button>
                </div>
                <Button variant="outline" className="w-full">Manage Payment Methods</Button>
            </CardContent>
        </Card>
    </div>
);


const ProfileTab = ({ business }) => (
    <BusinessProfileEditor business={business} />
);

// --- Main Component ---

export function DashboardSingleView({ business, onBack }) {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('overview');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const handleViewPublicPage = () => {
        const url = createPageUrl("ServiceProviderDetails", business.id);
        // Navigate internally or open in new tab? New tab is often better for "preview"
        // navigate(url);
        window.open(url, '_blank');
    };

    const navItems = [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
        { id: 'profile', label: 'Profile', icon: Store },
        { id: 'reviews', label: 'Reviews', icon: MessageCircle },
        { id: 'posts', label: 'Posts & Offers', icon: FileText },
        { id: 'agents', label: 'AI Agents', icon: Bot },
        { id: 'analytics', label: 'Analytics', icon: BarChart3 },
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
                        <p className="text-xs text-slate-300 mb-3">Unlock all AI features & analytics.</p>
                        <Button size="sm" variant="secondary" className="w-full h-7 text-xs">
                            View Plans
                        </Button>
                    </Card>
                    <Button variant="ghost" className="w-full justify-start text-slate-500 hover:text-slate-700" onClick={onBack}>
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
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                            <TabsContent value="overview" className="mt-0">
                                <OverviewTab business={business} />
                            </TabsContent>
                            <TabsContent value="profile" className="mt-0">
                                <ProfileTab business={business} />
                            </TabsContent>
                            <TabsContent value="reviews" className="mt-0">
                                <ReviewsTab business={business} />
                            </TabsContent>
                            <TabsContent value="posts" className="mt-0">
                                <PostsTab business={business} />
                            </TabsContent>
                            <TabsContent value="agents" className="mt-0">
                                <AgentsTab business={business} />
                            </TabsContent>
                            <TabsContent value="analytics" className="mt-0">
                                <AnalyticsTab business={business} />
                            </TabsContent>
                            <TabsContent value="settings" className="mt-0">
                                <SettingsTab business={business} />
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
                                    <item.icon className="w-5 h-5 shrink-0" />
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
