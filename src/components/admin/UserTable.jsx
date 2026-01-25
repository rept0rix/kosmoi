import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MoreHorizontal,
  Shield,
  User as UserIcon,
  Info,
  Trash2,
  VenetianMask,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function UserTable({ users, onAction }) {
  return (
    <div className="w-full">
      <table className="w-full text-sm text-left">
        <thead className="text-[10px] text-slate-500 font-mono font-bold uppercase bg-slate-950/30 border-b border-white/5 tracking-wider">
          <tr>
            <th className="px-6 py-4">Identity</th>
            <th className="px-6 py-4">Clearance</th>
            <th className="px-6 py-4">Status</th>
            <th className="px-6 py-4">Timestamp</th>
            <th className="px-6 py-4 text-right">Protocol</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {users.map((user) => (
            <tr
              key={user.id}
              className="hover:bg-white/5 transition-colors group"
            >
              <td className="px-6 py-4 font-medium text-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-900 border border-white/5 flex items-center justify-center text-slate-500 group-hover:border-neon-cyan/50 group-hover:text-neon-cyan group-hover:shadow-[0_0_10px_rgba(6,182,212,0.3)] transition-all">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-white group-hover:text-neon-cyan transition-colors">
                      {user.full_name || "Anonymous"}
                    </div>
                    <div className="text-xs text-slate-500 font-mono">
                      {user.email}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                  {user.role === "admin" ? (
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-neon-purple/10 border border-neon-purple/20 text-neon-purple text-xs font-mono">
                      <Shield className="w-3 h-3" />
                      ADMIN
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-800/50 border border-white/5 text-slate-400 text-xs font-mono">
                      USER
                    </div>
                  )}
                </div>
              </td>
              <td className="px-6 py-4">
                <Badge
                  variant="outline"
                  className={
                    user.status === "active"
                      ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10 font-mono text-[10px] uppercase tracking-wider"
                      : "border-slate-700 text-slate-500 font-mono text-[10px] uppercase tracking-wider"
                  }
                >
                  {user.status || "Active"}
                </Badge>
              </td>
              <td className="px-6 py-4 text-slate-500 font-mono text-xs">
                {new Date(user.created_at).toLocaleDateString()}
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onAction && onAction("view-details", user)}
                    className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-white/10"
                  >
                    <Info className="w-4 h-4" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      onAction && onAction("impersonate-user", user)
                    }
                    className="h-8 w-8 p-0 text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
                    title="God Mode"
                  >
                    <VenetianMask className="w-4 h-4" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onAction && onAction("delete-user", user)}
                    className="h-8 w-8 p-0 text-slate-500 hover:text-red-400 hover:bg-red-500/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
          {users.length === 0 && (
            <tr>
              <td
                colSpan={5}
                className="px-6 py-12 text-center text-slate-500 font-mono text-sm"
              >
                // NO_ENTITIES_FOUND_IN_SECTOR
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
