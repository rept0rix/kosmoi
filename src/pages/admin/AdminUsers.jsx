
import React, { useState, useEffect } from 'react';
import { AdminService } from '../../services/AdminService';
import UserTable from '../../components/admin/UserTable';
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { supabase } from '../../api/supabaseClient';
import { UserPlus } from 'lucide-react';

export default function AdminUsers() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadUsers = async () => {
        setLoading(true);
        try {
            const data = await AdminService.getUsers();
            setUsers(data);
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
        }
    };

    const handleCreateTestUser = async () => {
        const randomId = Math.floor(Math.random() * 1000);
        const email = `test.user.${randomId}@kosmoi.com`;
        const password = 'password123';

        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: `Test User ${randomId}`,
                        role: 'user'
                    }
                }
            });

            if (error) throw error;

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
        </div>
    );
}
