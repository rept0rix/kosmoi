import React from 'react';
import { Link } from 'react-router-dom';
import {
    Map,
    Layout,
    Shield,
    Users,
    Store,
    Bot,
    Server,
    FileText,
    ExternalLink,
    Home,
    Search,
    CreditCard
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const PageGroup = ({ title, icon: Icon, pages }) => (
    <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader className="pb-3 border-b border-slate-800/50">
            <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                    <Icon className="w-5 h-5 text-blue-400" />
                </div>
                <CardTitle className="text-lg font-medium text-slate-200">{title}</CardTitle>
            </div>
        </CardHeader>
        <CardContent className="pt-4 grid gap-2">
            {pages.map((page) => (
                <div key={page.path} className="group flex items-center justify-between p-2 rounded-md hover:bg-white/5 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-1.5 h-1.5 rounded-full ${page.status === 'dev' ? 'bg-yellow-500' : 'bg-green-500'}`} />
                        <div className="flex flex-col min-w-0">
                            <span className="text-sm font-medium text-slate-300 group-hover:text-white truncate">
                                {page.name}
                            </span>
                            <span className="text-xs text-slate-500 font-mono truncate">
                                {page.path}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white" asChild>
                            <Link to={page.path}>
                                <ExternalLink className="w-4 h-4" />
                            </Link>
                        </Button>
                    </div>
                </div>
            ))}
        </CardContent>
    </Card>
);

export default function AdminSitemap() {
    const sitemapData = [
        {
            title: "Public / Marketing",
            icon: Home,
            pages: [
                { name: "Home (Landing)", path: "/", status: "live" },
                { name: "About Us", path: "/about", status: "live" },
                { name: "Use Cases", path: "/use-cases", status: "live" },
                { name: "Pricing", path: "/pricing", status: "live" },
                { name: "Business Info", path: "/business-info", status: "live" },
                { name: "Contact", path: "/contact", status: "live" },
                { name: "Blog", path: "/blog", status: "live" }
            ]
        },
        {
            title: "Core Application",
            icon: Layout,
            pages: [
                { name: "App Dashboard", path: "/app", status: "live" },
                { name: "Login", path: "/login", status: "live" },
                { name: "Wallet (Kosmoi Pay)", path: "/wallet", status: "live" },
                { name: "Provider Dashboard", path: "/provider-dashboard", status: "live" },
                { name: "My Bookings", path: "/my-bookings", status: "live" },
                { name: "Map View", path: "/mapview", status: "live" },
                { name: "Request Service", path: "/requestservice", status: "live" },
                { name: "AI Chat", path: "/aichat", status: "live" }
            ]
        },
        {
            title: "Super App Verticals",
            icon: Store,
            pages: [
                { name: "Real Estate Hub", path: "/real-estate", status: "live" },
                { name: "Experiences Hub", path: "/experiences", status: "live" },
                { name: "Marketplace", path: "/marketplace", status: "live" },
                { name: "Vendor Signup", path: "/vendor-signup", status: "live" }
            ]
        },
        {
            title: "Admin Console",
            icon: Shield,
            pages: [
                { name: "Command Center", path: "/admin/command-center", status: "live" },
                { name: "Board Room", path: "/admin/board-room", status: "live" },
                { name: "Users Management", path: "/admin/users", status: "live" },
                { name: "Agent Workforce", path: "/admin/agents", status: "live" },
                { name: "CRM Dashboard", path: "/admin/crm", status: "live" },
                { name: "Task Board (Kanban)", path: "/admin/tasks", status: "live" },
                { name: "Infrastructure", path: "/admin/infrastructure", status: "live" },
                { name: "Studio (Builder)", path: "/admin/studio", status: "live" },
                { name: "Data / Analytics", path: "/admin/data", status: "live" },
                { name: "System Logs", path: "/admin/logs", status: "live" }
            ]
        },
        {
            title: "Legal & Trust",
            icon: FileText,
            pages: [
                { name: "Terms of Service", path: "/legal/terms", status: "live" },
                { name: "Privacy Policy", path: "/legal/privacy", status: "live" },
                { name: "Accessibility", path: "/legal/accessibility", status: "live" }
            ]
        },
        {
            title: "Dev & Utilities",
            icon: Server,
            pages: [
                { name: "Diagnostics", path: "/diagnostics", status: "dev" },
                { name: "Persistence Test", path: "/test-persistence", status: "dev" },
                { name: "Local Brain", path: "/local-brain", status: "dev" },
                { name: "Speed Pass Injection", path: "/earnings-preview", status: "dev" }
            ]
        }
    ];

    return (
        <div className="p-8 max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold text-white bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                    System Sitemap
                </h1>
                <p className="text-slate-400">
                    Comprehensive index of all application routes for Quality Assurance and Navigation.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sitemapData.map((group) => (
                    <PageGroup key={group.title} {...group} />
                ))}
            </div>
        </div>
    );
}
