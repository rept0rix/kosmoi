
import React, { useState, useEffect } from 'react';
import { AdminService } from '../../services/AdminService';
import UserTable from '../../components/admin/UserTable';
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { db } from '../../api/supabaseClient';
import { UserPlus } from 'lucide-react';

import AdminUserLogsDialog from '@/components/admin/AdminUserLogsDialog';
import AdminUserDetailsDialog from '@/components/admin/AdminUserDetailsDialog';

export default function AdminUsers() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedUserForDetails, setSelectedUserForDetails] = useState(null);

    const loadUsers = async () => {
        // ... (existing loadUsers implementation)
        setLoading(true);
        try {
            const { data, error } = await AdminService.getUsers();
            if (error) {
                // Check if table is missing (Postgres error 42P01)
                if (error.code === '42P01') {
                    toast({
                        title: "Setup Required: Users Table Missing",
                        description: "Please run the 'fix_users_table.sql' script in Supabase SQL Editor.",
                        variant: "destructive",
                        duration: 10000,
                    });
                } else {
                    toast({
                        title: "Error Loading Users",
                        description: error.message,
                        variant: "destructive"
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
        if (type === 'ban') {
            await AdminService.toggleUserBan(user.id);
            await loadUsers();
        } else if (type === 'logs' || type === 'view-details') {
            setSelectedUserForDetails(user);
        } else if (type === 'toggle-role') {
            const newRole = user.role === 'admin' ? 'user' : 'admin';

            // Optimistic Update or Wait? Let's wait to be sure.
            const { error } = await AdminService.updateUserRole(user.id, newRole);

            if (error) {
                toast({
                    title: "Role Update Failed",
                    description: error.message,
                    variant: "destructive"
                });
            } else {
                toast({
                    title: "Role Updated",
                    description: `${user.email} is now ${newRole === 'admin' ? 'an Admin' : 'a User'}.`,
                    className: "bg-green-600 text-white border-none"
                });
                await loadUsers();
            }
        } else if (type === 'delete-user') {
            if (window.confirm(`Are you SURE you want to DELETE ${user.email} PERMANENTLY? This action CANNOT be undone.`)) {

                // Double confirmation for admins
                if (user.role === 'admin') {
                    if (!window.confirm("WARNING: You are deleting an ADMIN user. Are you absolutely sure?")) {
                        return;
                    }
                }

                const { error } = await AdminService.deleteUser(user.id);
                if (error) {
                    toast({
                        title: "Deletion Failed",
                        description: error.message,
                        variant: "destructive"
                    });
                } else {
                    toast({
                        title: "User Deleted",
                        description: `${user.email} has been permanently deleted.`,
                        className: "bg-red-600 text-white border-none"
                    });
                    await loadUsers();
                }
            }
        } else if (type === 'impersonate-user') {
            if (window.confirm(`GOD MODE: You are about to log in as ${user.email}.\n\nYou will be logged out of your Admin account.\nTo return, you must log out and sign back in as Admin.\n\nProceed?`)) {

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
                        variant: "destructive"
                    });
                    return;
                }

                // Success
                toast({
                    title: "Redirecting...",
                    description: "Switching identity.",
                    className: "bg-purple-600 text-white border-none"
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
        const password = 'password123';

        try {
            await db.auth.signUp(
                email,
                password,
                {
                    full_name: `Test User ${randomId}`,
                    role: 'user'
                }
            );

            toast({
                title: "Test User Created",
                description: `Email: ${email}\nPassword: ${password}`,
            });

            // Wait a moment for trigger to propagate
            setTimeout(loadUsers, 2000);

        } catch (error) {
            console.error("Test user creation failed:", error);
            toast({
                title: "Creation Failed",
                description: error.message,
                variant: "destructive"
            });
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-white">Users</h1>
                    <p className="text-slate-400">Manage platform users and permissions.</p>
                </div>
                <Button onClick={handleCreateTestUser} className="bg-emerald-600 hover:bg-emerald-700">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Create Test User
                </Button>
            </div>
            <UserTable users={users} onAction={handleAction} />

            <AdminUserDetailsDialog
                isOpen={!!selectedUserForDetails}
                onClose={() => setSelectedUserForDetails(null)}
                userId={selectedUserForDetails?.id}
            />
        </div>
    );
}
