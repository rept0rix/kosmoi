import React, { useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
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
  Mail,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import AdminCopilotWidget from "../features/admin/components/AdminCopilotWidget";
import { GlassCard } from "@/components/ui/GlassCard"; // Assuming you want to use GlassCard for consistency

import { useAuth } from "@/features/auth/context/AuthContext";

export default function AdminLayout() {
  const { user } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { logout } = useAuth();
  const location = useLocation();

  return (
    <div className="flex h-screen bg-[#020617] text-slate-100 font-sans overflow-hidden selection:bg-neon-cyan/30 selection:text-neon-cyan">
      {/* Global Noise Overlay */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay"></div>

      {/* Background Grid */}
      <div
        className="fixed inset-0 pointer-events-none z-0 opacity-10"
        style={{
          backgroundImage: `linear-gradient(#334155 1px, transparent 1px), linear-gradient(90deg, #334155 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
          maskImage:
            "radial-gradient(circle at center, black, transparent 80%)",
        }}
      ></div>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/80 z-30 md:hidden backdrop-blur-sm"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
                w-64 border-r border-white/5 flex flex-col
                fixed inset-y-0 left-0 z-40 transition-transform duration-300 ease-in-out md:relative md:translate-x-0
                ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
                bg-slate-900/60 backdrop-blur-xl supports-[backdrop-filter]:bg-slate-900/40
            `}
      >
        <div className="p-4 flex items-center justify-between border-b border-white/5 h-16 relative overflow-hidden">
          {/* Logo Glow */}
          <div className="absolute top-1/2 left-4 w-8 h-8 bg-neon-cyan/20 rounded-full blur-xl animate-pulse"></div>
          <div className="flex items-center gap-3 relative z-10">
            {/* Logo / Brand */}
            <div className="w-8 h-8 rounded-lg bg-black/40 flex items-center justify-center border border-neon-cyan/30 shadow-[0_0_10px_rgba(6,182,212,0.2)]">
              <Activity className="w-5 h-5 text-neon-cyan" />
            </div>
            <span className="font-mono font-bold text-lg text-white tracking-wider">
              KOSMOI<span className="text-neon-cyan">_OS</span>
            </span>
          </div>
          {/* Mobile Close Button */}
          <button
            className="md:hidden text-slate-400 hover:text-white"
            onClick={() => setIsMobileOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scroll Area */}
        <nav className="flex-1 p-4 overflow-y-auto space-y-6 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
          <NavGroup title="Command Protocol">
            <NavItem
              to="/admin/command-center"
              icon={<LayoutDashboard />}
              label="Command Center"
              onClick={() => setIsMobileOpen(false)}
            />
            <NavItem
              to="/admin/hyperloop"
              icon={<Activity />}
              label="Mission Control"
              activeColor="text-fuchsia-400"
              onClick={() => setIsMobileOpen(false)}
            />
            <NavItem
              to="/admin/board-room"
              icon={<Bot />}
              label="Board Room"
              onClick={() => setIsMobileOpen(false)}
            />
          </NavGroup>

          <NavGroup title="Neural Network">
            <NavItem
              to="/admin/optimizer"
              icon={<BrainCircuit />}
              label="Optimizer"
              activeColor="text-emerald-400"
              onClick={() => setIsMobileOpen(false)}
            />
            <NavItem
              to="/admin/marketing"
              icon={<Megaphone />}
              label="Dave (Marketing)"
              activeColor="text-orange-400"
              onClick={() => setIsMobileOpen(false)}
            />
            <NavItem
              to="/admin/sales"
              icon={<Target />}
              label="Sarah (Sales)"
              activeColor="text-cyan-400"
              onClick={() => setIsMobileOpen(false)}
            />
            <NavItem
              to="/admin/scheduler"
              icon={<CalendarCheck />}
              label="Claude (Scheduler)"
              activeColor="text-purple-400"
              onClick={() => setIsMobileOpen(false)}
            />
            <NavItem
              to="/admin/automations"
              icon={<CircuitBoard />}
              label="Engine Room"
              onClick={() => setIsMobileOpen(false)}
            />
            <NavItem
              to="/admin/memory"
              icon={<HardDrive />}
              label="Long-term Memory"
              onClick={() => setIsMobileOpen(false)}
            />
            <NavItem
              to="/admin/studio"
              icon={<Code2 />}
              label="Agent Studio"
              onClick={() => setIsMobileOpen(false)}
            />
          </NavGroup>

          <NavGroup title="Data Grid">
            <NavItem
              to="/admin/users"
              icon={<Users />}
              label="Users"
              onClick={() => setIsMobileOpen(false)}
            />
            <NavItem
              to="/admin/businesses"
              icon={<Store />}
              label="Businesses"
              onClick={() => setIsMobileOpen(false)}
            />
            <NavItem
              to="/admin/bookings"
              icon={<CalendarDays />}
              label="Bookings"
              onClick={() => setIsMobileOpen(false)}
            />
            <NavItem
              to="/admin/claims"
              icon={<FileText />}
              label="Claims"
              onClick={() => setIsMobileOpen(false)}
            />
            <NavItem
              to="/admin/wallet"
              icon={<Database />}
              label="System Wallet"
              onClick={() => setIsMobileOpen(false)}
            />
            <NavItem
              to="/admin/tasks"
              icon={<ClipboardList />}
              label="Kanban Tasks"
              onClick={() => setIsMobileOpen(false)}
            />
          </NavGroup>

          <NavGroup title="System Core">
            <NavItem
              to="/admin/logs"
              icon={<Server />}
              label="System Logs"
              onClick={() => setIsMobileOpen(false)}
            />
            <NavItem
              to="/admin/monitoring"
              icon={<Activity />}
              label="Monitoring"
              onClick={() => setIsMobileOpen(false)}
            />
            <NavItem
              to="/admin/infrastructure"
              icon={<Network />}
              label="Infrastructure"
              onClick={() => setIsMobileOpen(false)}
            />
          </NavGroup>
        </nav>

        <div className="p-4 border-t border-white/5 bg-black/20">
          <div
            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer group"
            onClick={() => logout && logout()}
          >
            <Avatar className="w-8 h-8 ring-1 ring-white/10 group-hover:ring-neon-cyan/50 transition-all">
              <AvatarImage src={user?.avatar_url || "/placeholder-user.jpg"} />
              <AvatarFallback className="bg-slate-800 text-slate-200">
                {user?.email?.substring(0, 2).toUpperCase() || "GU"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate text-slate-200 group-hover:text-neon-cyan transition-colors">
                {user?.full_name || user?.email || "Guest User"}
              </p>
              <p className="text-xs text-slate-500 truncate font-mono">
                {user?.email || "Not logged in"}
              </p>
            </div>
            <LogOut className="w-4 h-4 text-slate-500 group-hover:text-red-400 transition-colors" />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
        {/* Header */}
        <header className="h-16 border-b border-white/5 bg-slate-900/20 flex items-center px-4 md:px-6 justify-between backdrop-blur-sm sticky top-0 z-20">
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

            <div className="flex items-center gap-2 text-sm text-slate-500 font-mono">
              <span className="hover:text-slate-300 cursor-pointer hidden md:inline">
                ADMIN
              </span>
              <span className="hidden md:inline text-slate-700">{"//"}</span>
              <span className="text-neon-cyan">DASHBOARD</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="text-slate-400 hover:text-neon-cyan hover:bg-neon-cyan/10 transition-colors"
            >
              <Zap className="w-4 h-4" />
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <div
          className={`flex-1 flex flex-col h-full ${location.pathname.includes("board-room") ? "p-0 overflow-hidden" : "p-4 md:p-8 overflow-auto"} `}
        >
          <Outlet />
        </div>
      </main>
      <AdminCopilotWidget />
    </div>
  );
}

// NavItem Component
function NavItem({
  to,
  icon,
  label,
  end = false,
  activeColor = null,
  onClick,
}) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClick}
      className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 border border-transparent
                ${
                  isActive
                    ? `bg-white/5 text-white border-l-neon-cyan/50 ${activeColor || "text-neon-cyan"} shadow-[inset_10px_0_20px_-10px_rgba(6,182,212,0.1)]`
                    : "text-slate-400 hover:text-slate-100 hover:bg-white/5 hover:translate-x-1 hover:border-white/5"
                }
            `}
    >
      {React.cloneElement(icon, { className: "w-4 h-4" })}
      <span className="truncate">{label}</span>
    </NavLink>
  );
}

function NavGroup({ title, children }) {
  return (
    <div className="mb-6">
      <h3 className="px-3 text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-2 font-mono flex items-center gap-2">
        {title}
        <div className="h-px flex-1 bg-slate-800"></div>
      </h3>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}
