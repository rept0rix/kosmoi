
import React, { useEffect, useState } from 'react';
import { AdminService } from '../../services/AdminService';
import UserTable from '../../components/admin/UserTable';

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

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white">Users</h1>
                <p className="text-slate-400">Manage platform users and permissions.</p>
            </div>
            <UserTable users={users} onAction={handleAction} />
        </div>
    );
}
