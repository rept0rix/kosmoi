import React, { useState, useEffect } from "react";
import { AdminService } from "../../services/AdminService";
import UserTable from "../../components/admin/UserTable";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { db } from "../../api/supabaseClient";
import { UserPlus, Users, Database, RefreshCw } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";

import AdminUserLogsDialog from "@/components/admin/AdminUserLogsDialog";
import AdminUserDetailsDialog from "@/components/admin/AdminUserDetailsDialog";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUserForDetails, setSelectedUserForDetails] = useState(null);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await AdminService.getUsers();
      if (error) {
        // Check if table is missing (Postgres error 42P01)
        if (error.code === "42P01") {
          toast({
            title: "Setup Required: Users Table Missing",
            description:
              "Please run the 'fix_users_table.sql' script in Supabase SQL Editor.",
            variant: "destructive",
            duration: 10000,
          });
        } else {
          toast({
            title: "Error Loading Users",
            description: error.message,
            variant: "destructive",
          });
        }
        setUsers([]);
      } else {
        setUsers(data);
      }
    } catch (e) {
      console.error("Users Load Failed", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleAction = async (type, user) => {
    if (type === "ban") {
      await AdminService.toggleUserBan(user.id);
      await loadUsers();
    } else if (type === "logs" || type === "view-details") {
      setSelectedUserForDetails(user);
    } else if (type === "toggle-role") {
      const newRole = user.role === "admin" ? "user" : "admin";

      // Optimistic Update or Wait? Let's wait to be sure.
      const { error } = await AdminService.updateUserRole(user.id, newRole);

      if (error) {
        toast({
          title: "Role Update Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        // Send Notification Email
        await AdminService.sendRoleUpdateEmail(
          user.email,
          user.full_name || "User",
          newRole,
        );

        toast({
          title: "Role Updated",
          description: `${user.email} is now ${newRole === "admin" ? "an Admin" : "a User"}. Email notification sent.`,
          className: "bg-green-600 text-white border-none",
        });
        await loadUsers();
      }
    } else if (type === "delete-user") {
      if (
        window.confirm(
          `Are you SURE you want to DELETE ${user.email} PERMANENTLY? This action CANNOT be undone.`,
        )
      ) {
        // Double confirmation for admins
        if (user.role === "admin") {
          if (
            !window.confirm(
              "WARNING: You are deleting an ADMIN user. Are you absolutely sure?",
            )
          ) {
            return;
          }
        }

        const { error } = await AdminService.deleteUser(user.id);
        if (error) {
          toast({
            title: "Deletion Failed",
            description: error.message,
            variant: "destructive",
          });
        } else {
          toast({
            title: "User Deleted",
            description: `${user.email} has been permanently deleted.`,
            className: "bg-red-600 text-white border-none",
          });
          await loadUsers();
        }
      }
    } else if (type === "impersonate-user") {
      if (
        window.confirm(
          `GOD MODE: You are about to log in as ${user.email}.\n\nYou will be logged out of your Admin account.\nTo return, you must log out and sign back in as Admin.\n\nProceed?`,
        )
      ) {
        toast({
          title: "Generating God Mode Link...",
          description: "Please wait.",
        });

        const { data, error } = await AdminService.impersonateUser(user.email);

        if (error || !data) {
          console.error("Impersonation Error:", error);
          toast({
            title: "Impersonation Failed",
            description: error?.message || "Could not generate link",
            variant: "destructive",
          });
          return;
        }

        // Success
        toast({
          title: "Redirecting...",
          description: "Switching identity.",
          className: "bg-purple-600 text-white border-none",
        });

        // Sign out current admin to prevent session conflicts, then go to magic link
        await db.auth.signOut();
        window.location.href = data.action_link;
      }
    }
  };

  const handleCreateTestUser = async () => {
    const randomId = Math.floor(Math.random() * 1000);
    const email = `test.user.${randomId}@kosmoi.com`;
    const password = "password123";

    try {
      await db.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: `Test User ${randomId}`,
            role: "user",
          },
        },
      });

      toast({
        title: "Test User Created",
        description: `Email: ${email}\nPassword: ${password}`,
      });

      // Wait a moment for trigger to propagate
      setTimeout(() => loadUsers(), 2000);
    } catch (error) {
      console.error("Test user creation failed:", error);
      toast({
        title: "Creation Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-8 p-2 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-end justify-between border-b border-white/5 pb-6">
        <div>
          <h1 className="text-4xl font-black text-white mb-2 tracking-tight">
            USER{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-purple to-pink-500">
              DATABASE
            </span>
          </h1>
          <p className="text-slate-400 font-mono text-sm">
            // IDENTITY_MANAGEMENT_PROTOCOL
          </p>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={loadUsers}
            className="border-white/5 bg-black/20 hover:bg-white/10 hover:text-neon-purple text-slate-400"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <NeonButton onClick={handleCreateTestUser} variant="purple" size="sm">
            <UserPlus className="w-4 h-4 mr-2" />+ INJECT_TEST_ID
          </NeonButton>
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GlassCard className="p-4 flex items-center gap-4 bg-neon-purple/5 border-neon-purple/20">
          <div className="p-3 bg-neon-purple/20 rounded-lg">
            <Users className="w-5 h-5 text-neon-purple" />
          </div>
          <div>
            <div className="text-3xl font-mono font-bold text-white tracking-tight">
              {users.length}
            </div>
            <div className="text-xs text-slate-500 font-mono tracking-widest">
              TOTAL_ENTITIES
            </div>
          </div>
        </GlassCard>
        <GlassCard className="p-4 flex items-center gap-4 bg-blue-500/5 border-blue-500/20">
          <div className="p-3 bg-blue-500/20 rounded-lg">
            <Database className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <div className="text-3xl font-mono font-bold text-white tracking-tight">
              {users.filter((u) => u.role === "admin").length}
            </div>
            <div className="text-xs text-slate-500 font-mono tracking-widest">
              ADMIN_NODES
            </div>
          </div>
        </GlassCard>
      </div>

      <GlassCard className="p-0 overflow-hidden bg-slate-900/20 border-white/5">
        <UserTable users={users} onAction={handleAction} />
      </GlassCard>

      <AdminUserDetailsDialog
        isOpen={!!selectedUserForDetails}
        onClose={() => setSelectedUserForDetails(null)}
        userId={selectedUserForDetails?.id}
      />
    </div>
  );
}
