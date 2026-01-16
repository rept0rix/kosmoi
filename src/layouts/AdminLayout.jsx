
import React, { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    Database,
    Bot,
    Settings,
    LogOut,
    Menu,
    X,
    Activity,
    Target,
    Server,
    Store,
    Map,
    BrainCircuit,
    Code2,
    Network,
    ClipboardList,
    Milestone,
    Zap,
    FileText,
    Table,
    HardDrive,
    Upload,
    CalendarDays,
    Megaphone,
    BarChart3,
    CalendarCheck,
    CircuitBoard,
    Mail
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import AdminCopilotWidget from '../features/admin/components/AdminCopilotWidget';

import { useAuth } from '@/features/auth/context/AuthContext'; // Ensure this import exists at top

// ... inside component ...
export default function AdminLayout() {
    const { user } = useAuth(); // Get real user
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const { logout } = useAuth();
    const location = useLocation();

    return (
        <div className="flex h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">
            {/* Mobile Overlay */}
            {
                isMobileOpen && (
                    <div
                        className="fixed inset-0 bg-black/80 z-30 md:hidden backdrop-blur-sm"
                        onClick={() => setIsMobileOpen(false)}
                    />
                )
            }

            {/* Sidebar */}
            <aside className={`
                w-64 border-r border-white/5 bg-slate-900/95 flex flex-col
                fixed inset-y-0 left-0 z-40 transition-transform duration-300 ease-in-out md:relative md:translate-x-0
                ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="p-4 flex items-center justify-between border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <img src="/kosmoi_logo_white.svg" alt="Kosmoi Logo" className="h-8 md:h-10 w-auto" />
                    </div>
                    {/* Mobile Close Button */}
                    <button
                        className="md:hidden text-slate-400 hover:text-white"
                        onClick={() => setIsMobileOpen(false)}
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <nav className="flex-1 p-4 overflow-y-auto">
                    <NavGroup title="Overview">
                        <NavItem to="/admin/command-center" icon={<LayoutDashboard />} label="Command Center" onClick={() => setIsMobileOpen(false)} />
                        <NavItem to="/admin/board-room" icon={<Bot />} label="Board Room" onClick={() => setIsMobileOpen(false)} />
                        <NavItem to="/admin/roadmap" icon={<Milestone />} label="Roadmap" onClick={() => setIsMobileOpen(false)} />
                    </NavGroup>

                    <NavGroup title="Operations">
                        <NavItem to="/admin/tasks" icon={<ClipboardList />} label="Task Board" onClick={() => setIsMobileOpen(false)} />
                        <NavItem to="/admin/bookings" icon={<CalendarDays />} label="Bookings" onClick={() => setIsMobileOpen(false)} />
                        <NavItem to="/admin/businesses" icon={<Store />} label="Businesses" onClick={() => setIsMobileOpen(false)} />
                        <NavItem to="/admin/users" icon={<Users />} label="Users" onClick={() => setIsMobileOpen(false)} />
                        <NavItem to="/admin/crm" icon={<Target />} label="CRM Dashboard" onClick={() => setIsMobileOpen(false)} />
                        <NavItem to="/admin/mailbox" icon={<Mail />} label="Mailbox" onClick={() => setIsMobileOpen(false)} />
                        <NavItem to="/admin/sales" icon={<Mail />} label="Sales Coordinator" onClick={() => setIsMobileOpen(false)} />
                        <NavItem to="/admin/leads" icon={<Users />} label="Leads List" onClick={() => setIsMobileOpen(false)} />
                        <NavItem to="/admin/marketing" icon={<Megaphone />} label="Marketing Center" onClick={() => setIsMobileOpen(false)} />
                        <NavItem to="/admin/analytics" icon={<BarChart3 />} label="Analytics & Lara" onClick={() => setIsMobileOpen(false)} />
                        <NavItem to="/admin/automations" icon={<CircuitBoard />} label="Engine Room" onClick={() => setIsMobileOpen(false)} />
                        <NavItem to="/admin/scheduler" icon={<CalendarCheck />} label="Scheduler & Claude" onClick={() => setIsMobileOpen(false)} />
                        <NavItem to="/admin/claims" icon={<FileText />} label="Claims" onClick={() => setIsMobileOpen(false)} />
                        <NavItem to="/admin/wallet" icon={<Store />} label="System Wallet" onClick={() => setIsMobileOpen(false)} />
                        <NavItem to="/admin/data" icon={<Database />} label="Platform Analytics" onClick={() => setIsMobileOpen(false)} />
                    </NavGroup>

                    <NavGroup title="Intelligence">
                        <NavItem to="/admin/hyperloop" icon={<Activity />} label="Mission Control" onClick={() => setIsMobileOpen(false)} />
                        <NavItem to="/admin/optimizer" icon={<BrainCircuit />} label="Optimizer Agent" onClick={() => setIsMobileOpen(false)} />
                        <NavItem to="/admin/agents" icon={<Users />} label="Workforce" onClick={() => setIsMobileOpen(false)} />
                        <NavItem to="/admin/evolution" icon={<Network />} label="Network Graph" onClick={() => setIsMobileOpen(false)} />
                        <NavItem to="/admin/studio" icon={<Code2 />} label="Agent Studio" onClick={() => setIsMobileOpen(false)} />
                        <NavItem to="/admin/skills" icon={<Zap />} label="Skills Library" onClick={() => setIsMobileOpen(false)} />
                        <NavItem to="/admin/memory" icon={<HardDrive />} label="Long-term Memory" onClick={() => setIsMobileOpen(false)} />
                    </NavGroup>

                    <NavGroup title="System">
                        <NavItem to="/admin/infrastructure" icon={<Server />} label="Infrastructure" onClick={() => setIsMobileOpen(false)} />
                        <NavItem to="/admin/logs" icon={<Activity />} label="System Logs" onClick={() => setIsMobileOpen(false)} />
                        <NavItem to="/admin/schema" icon={<Table />} label="Database Schema" onClick={() => setIsMobileOpen(false)} />
                        <NavItem to="/admin/importer" icon={<Upload />} label="Data Importer" onClick={() => setIsMobileOpen(false)} />
                        <NavItem to="/admin/canvas" icon={<LayoutDashboard />} label="Screen Canvas" onClick={() => setIsMobileOpen(false)} />
                        <NavItem to="/admin/sitemap" icon={<Map />} label="Site Map / QA" onClick={() => setIsMobileOpen(false)} />
                        <NavItem to="/admin/company" icon={<Settings />} label="Company Settings" onClick={() => setIsMobileOpen(false)} />
                    </NavGroup>
                </nav>

                <div className="p-4 border-t border-white/5">
                    <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer" onClick={() => logout && logout()}>
                        <Avatar className="w-8 h-8">
                            <AvatarImage src={user?.avatar_url || "/placeholder-user.jpg"} />
                            <AvatarFallback>{user?.email?.substring(0, 2).toUpperCase() || 'GU'}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{user?.full_name || user?.email || 'Guest User'}</p>
                            <p className="text-xs text-slate-500 truncate">{user?.email || 'Not logged in'}</p>
                        </div>
                        <LogOut className="w-4 h-4 text-slate-500" />
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Header */}
                <header className="h-16 border-b border-white/5 bg-slate-900/20 flex items-center px-4 md:px-6 justify-between">
                    <div className="flex items-center gap-4">
                        {/* Mobile Toggle */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="md:hidden text-slate-400"
                            onClick={() => setIsMobileOpen(true)}
                        >
                            <Menu className="w-5 h-5" />
                        </Button>

                        <div className="flex items-center gap-2 text-sm text-slate-500">
                            <span className="hover:text-slate-300 cursor-pointer hidden md:inline">Admin</span>
                            <span className="hidden md:inline">/</span>
                            <span className="text-slate-200">Dashboard</span>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                {/* Page Content */}
                <div className={`flex-1 flex flex-col h-full ${location.pathname.includes('board-room') ? 'p-0 overflow-hidden' : 'p-4 md:p-8 overflow-auto'} `}>
                    <Outlet />
                </div>
            </main>
            <AdminCopilotWidget />
        </div >
    );
}

function NavItem({ to, icon, label, end = false, onClick }) {
    return (
        <NavLink
            to={to}
            end={end}
            onClick={onClick}
            className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                ${isActive
                    ? 'bg-blue-600/10 text-blue-400'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-white/5'
                }
            `}
        >
            {React.cloneElement(icon, { className: "w-4 h-4" })}
            {label}
        </NavLink>
    );
}

function NavGroup({ title, children }) {
    return (
        <div className="mb-6">
            <h3 className="px-3 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                {title}
            </h3>
            <div className="space-y-1">
                {children}
            </div>
        </div>
    );
}
