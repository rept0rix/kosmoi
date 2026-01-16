
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Shield, User as UserIcon, Info, Trash2, VenetianMask } from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

export default function UserTable({ users, onAction }) {
    return (
        <div className="rounded-md border border-white/10 bg-slate-950/50 overflow-hidden">
            <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-400 uppercase bg-slate-900/50 border-b border-white/5">
                    <tr>
                        <th className="px-6 py-3">User</th>
                        <th className="px-6 py-3">Role</th>
                        <th className="px-6 py-3">Status</th>
                        <th className="px-6 py-3">Joined</th>
                        <th className="px-6 py-3 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {users.map((user) => (
                        <tr key={user.id} className="hover:bg-white/5 transition-colors">
                            <td className="px-6 py-4 font-medium text-slate-200">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                                        <UserIcon className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <div className="font-semibold">{user.full_name || 'Anonymous'}</div>
                                        <div className="text-xs text-slate-500">{user.email}</div>
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-1.5">
                                    {user.role === 'admin' ? (
                                        <Shield className="w-3 h-3 text-purple-400" />
                                    ) : (
                                        <div className="w-3 h-3" />
                                    )}
                                    <span className={user.role === 'admin' ? 'text-purple-300' : 'text-slate-400'}>
                                        {user.role || 'User'}
                                    </span>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <span tabIndex={0} className="cursor-help inline-flex">
                                                <Badge variant="outline" className={
                                                    user.status === 'active'
                                                        ? "border-green-500/30 text-green-400 bg-green-500/10"
                                                        : "border-slate-700 text-slate-500"
                                                }>
                                                    {user.status || 'Active'}
                                                </Badge>
                                            </span>
                                        </TooltipTrigger>
                                        <TooltipContent className="bg-slate-900 border-slate-700 text-slate-300">
                                            <p>{user.status === 'active' ? 'User has full access' : 'User access is restricted'}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </td>
                            <td className="px-6 py-4 text-slate-400">
                                {new Date(user.created_at).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 text-right">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onAction && onAction('logs', user)}
                                    className="h-8 px-2 text-blue-400 hover:text-blue-300 mr-2"
                                >
                                    <Info className="w-4 h-4 mr-1" /> Details
                                </Button>

                                {/* Role Management Button */}
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onAction && onAction('toggle-role', user)}
                                    className={`h-8 px-2 mr-2 ${user.role === 'admin'
                                        ? 'text-amber-500 hover:text-amber-400'
                                        : 'text-purple-400 hover:text-purple-300'
                                        }`}
                                >
                                    {user.role === 'admin' ? (
                                        <>
                                            <UserIcon className="w-3 h-3 mr-1" /> Demote
                                        </>
                                    ) : (
                                        <>
                                            <Shield className="w-3 h-3 mr-1" /> Promote
                                        </>
                                    )}
                                </Button>

                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => onAction && onAction('impersonate-user', user)}
                                                className="h-8 px-2 text-purple-400 hover:text-purple-300 mr-2"
                                            >
                                                <VenetianMask className="w-4 h-4" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent className="bg-slate-900 border-slate-700 text-purple-300">
                                            <p>Impersonate (God Mode)</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>

                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onAction && onAction('ban', user)}
                                    className={`h-8 px-2 ${user.status === 'banned' ? 'text-red-400 hover:text-red-300' : 'text-slate-500 hover:text-white'}`}
                                >
                                    {user.status === 'banned' ? 'Unban' : 'Ban'}
                                </Button>

                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onAction && onAction('delete-user', user)}
                                    className="h-8 px-2 text-red-500 hover:text-red-400 hover:bg-red-500/10 ml-2"
                                    title="Delete User Permanently"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </td>
                        </tr>
                    ))}
                    {users.length === 0 && (
                        <tr>
                            <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                                No users found.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
