import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
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
    Target
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export default function AdminLayout() {
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    return (
        <div className="flex h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">
            {/* Mobile Overlay */}
            {isMobileOpen && (
                <div
                    className="fixed inset-0 bg-black/80 z-30 md:hidden backdrop-blur-sm"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                w-64 border-r border-white/5 bg-slate-900/95 flex flex-col
                fixed inset-y-0 left-0 z-40 transition-transform duration-300 ease-in-out md:relative md:translate-x-0
                ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="p-6 border-b border-white/5 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold">
                            K
                        </div>
                        <span className="font-semibold text-lg">Kosmoi Admin</span>
                    </div>
                    {/* Mobile Close Button */}
                    <button
                        onClick={() => setIsMobileOpen(false)}
                        className="md:hidden text-slate-400 hover:text-white"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    <NavItem to="/admin" end icon={<LayoutDashboard />} label="Overview" onClick={() => setIsMobileOpen(false)} />
                    <NavItem to="/admin/users" icon={<Users />} label="Users" onClick={() => setIsMobileOpen(false)} />
                    <NavItem to="/admin/data" icon={<Database />} label="Data & Businesses" onClick={() => setIsMobileOpen(false)} />
                    <NavItem to="/board-room" icon={<Bot />} label="Agents" onClick={() => setIsMobileOpen(false)} />
                    <NavItem to="/admin/crm" icon={<Target />} label="CRM / Leads" onClick={() => setIsMobileOpen(false)} />
                    <NavItem to="/admin/logs" icon={<Activity />} label="System Logs" onClick={() => setIsMobileOpen(false)} />
                    <NavItem to="/admin/settings" icon={<Settings />} label="Settings" onClick={() => setIsMobileOpen(false)} />
                </nav>

                <div className="p-4 border-t border-white/5">
                    <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer">
                        <Avatar className="w-8 h-8">
                            <AvatarImage src="/placeholder-user.jpg" />
                            <AvatarFallback>AD</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">Admin User</p>
                            <p className="text-xs text-slate-500 truncate">admin@kosmoi.com</p>
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
                <div className="flex-1 overflow-auto p-4 md:p-8">
                    <Outlet />
                </div>
            </main>
        </div>
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
                    : 'text-slate-400 hover:text-slate-100 hover:bg-white/5'}
            `}
        >
            {React.cloneElement(icon, { className: "w-4 h-4" })}
            {label}
        </NavLink>
    );
}
