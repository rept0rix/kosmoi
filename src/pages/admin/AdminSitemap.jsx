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




import { useAnalytics } from '@/services/useAnalytics';

const sitemapData = [
    {
        title: "Overview",
        icon: Layout,
        pages: [
            { name: "Command Center", path: "/admin/command-center", status: "prod" },
            { name: "Board Room", path: "/admin/board-room", status: "prod" },
            { name: "Admin Dashboard", path: "/admin", status: "prod" },
        ]
    },
    {
        title: "Operations",
        icon: Store,
        pages: [
            { name: "Businesses", path: "/admin/businesses", status: "prod" },
            { name: "Users", path: "/admin/users", status: "prod" },
            { name: "CRM / Leads", path: "/admin/crm", status: "dev" },
            { name: "Platform Analytics", path: "/admin/data", status: "dev" },
        ]
    },
    {
        title: "Intelligence",
        icon: Bot,
        pages: [
            { name: "Optimizer Agent", path: "/admin/optimizer", status: "dev" },
            { name: "Workforce", path: "/admin/agents", status: "prod" },
            { name: "Agent Studio", path: "/admin/studio", status: "prod" },
            { name: "Local Brain", path: "/local-brain", status: "prod" },
        ]
    },
    {
        title: "System",
        icon: Server,
        pages: [
            { name: "Infrastructure", path: "/admin/infrastructure", status: "prod" },
            { name: "System Logs", path: "/admin/logs", status: "prod" },
            { name: "Site Map / QA", path: "/admin/sitemap", status: "prod" },
            { name: "Company Settings", path: "/admin/company", status: "prod" },
            { name: "Diagnostics", path: "/diagnostics", status: "dev" },
        ]
    },
    {
        title: "Public Pages",
        icon: Home,
        pages: [
            { name: "Home", path: "/", status: "prod" },
            { name: "About Us", path: "/about", status: "prod" },
            { name: "Use Cases", path: "/use-cases", status: "prod" },
            { name: "Pricing", path: "/pricing", status: "prod" },
            { name: "Contact", path: "/contact", status: "prod" },
            { name: "Blog", path: "/blog", status: "prod" },
        ]
    },
    {
        title: "Legal",
        icon: Shield,
        pages: [
            { name: "Terms of Service", path: "/legal/terms", status: "prod" },
            { name: "Privacy Policy", path: "/legal/privacy", status: "prod" },
            { name: "Accessibility", path: "/legal/accessibility", status: "prod" },
        ]
    }
];

export default function AdminSitemap() {
    useAnalytics('Admin_Sitemap');

    return (
        <div className="min-h-screen bg-[#020617] text-slate-200 font-sans p-8 animate-in fade-in duration-700">
            {/* Background Ambient Glow */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-900/20 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-900/20 rounded-full blur-[120px]" />
            </div>

            <div className="relative max-w-[1600px] mx-auto space-y-12">
                {/* Header Section */}
                <div className="flex flex-col gap-4 border-b border-white/5 pb-8">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
                            <Map className="w-8 h-8 text-blue-400" />
                        </div>
                        <h1 className="text-4xlmd:text-5xl font-bold text-white tracking-tight">
                            System <span className="text-gradient-blue text-glow">Map</span>
                        </h1>
                    </div>
                    <p className="text-slate-400 text-lg max-w-2xl leading-relaxed">
                        Comprehensive index of all application routes. Use this command center for rapid navigation, Quality Assurance, and system overview.
                    </p>
                </div>

                {/* Grid Layout */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {sitemapData.map((group, idx) => (
                        <div
                            key={group.title}
                            className="glass-card rounded-2xl p-6 group hover:border-blue-500/30 transition-all duration-300 hover:shadow-blue-900/20 relative overflow-hidden"
                            style={{ animationDelay: `${idx * 100}ms` }}
                        >
                            {/* Card Header */}
                            <div className="flex items-center gap-4 mb-6">
                                <div className="p-3 rounded-lg bg-slate-800/50 group-hover:bg-blue-500/20 transition-colors">
                                    <group.icon className="w-6 h-6 text-slate-300 group-hover:text-blue-400 transition-colors" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-100">{group.title}</h3>
                            </div>

                            {/* Links List */}
                            <div className="space-y-3">
                                {group.pages.map((page) => (
                                    <div
                                        key={page.path}
                                        className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all group/link"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            {/* Status Dot */}
                                            <div className={`w-2 h-2 rounded-full shadow-[0_0_8px_currentColor] ${page.status === 'dev' ? 'text-yellow-500 bg-yellow-500' : 'text-emerald-500 bg-emerald-500'}`} />

                                            <div className="flex flex-col min-w-0">
                                                <span className="text-sm font-semibold text-slate-300 group-hover/link:text-white truncate transition-colors">
                                                    {page.name}
                                                </span>
                                                <span className="text-[10px] text-slate-500 font-mono truncate group-hover/link:text-blue-400/80 transition-colors">
                                                    {page.path}
                                                </span>
                                            </div>
                                        </div>

                                        <Link
                                            to={page.path}
                                            className="opacity-0 group-hover/link:opacity-100 p-2 rounded-lg hover:bg-blue-600 transition-all transform translate-x-[-10px] group-hover/link:translate-x-0"
                                        >
                                            <ExternalLink className="w-4 h-4 text-white" />
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
