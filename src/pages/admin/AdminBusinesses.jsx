import React, { useEffect, useState } from 'react';
import { AdminService } from '../../services/AdminService';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Store, MapPin, Star, MoreHorizontal, Search, ExternalLink } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function AdminBusinesses() {
    const [businesses, setBusinesses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const loadBusinesses = async () => {
        setLoading(true);
        try {
            const data = await AdminService.getBusinesses();
            setBusinesses(data);
        } catch (e) {
            console.error("Businesses Load Failed", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadBusinesses();
    }, []);

    const handleVerify = async (id) => {
        await AdminService.toggleBusinessVerification(id);
        await loadBusinesses();
    };

    const filteredBusinesses = businesses.filter(b =>
        b.business_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.category?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Businesses</h1>
                    <p className="text-slate-400">Manage service providers and vendor accounts.</p>
                </div>
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Search businesses..."
                        className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="rounded-md border border-white/10 bg-slate-950/50 overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-400 uppercase bg-slate-900/50 border-b border-white/5">
                        <tr>
                            <th className="px-6 py-3">Business</th>
                            <th className="px-6 py-3">Category</th>
                            <th className="px-6 py-3">Location</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3">Rating</th>
                            <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {loading ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                                    Loading businesses...
                                </td>
                            </tr>
                        ) : filteredBusinesses.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                                    No businesses found.
                                </td>
                            </tr>
                        ) : (
                            filteredBusinesses.map((biz) => (
                                <tr key={biz.id} className="hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-blue-900/20 flex items-center justify-center text-blue-400">
                                                <Store className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <div className="font-semibold text-slate-200">{biz.business_name}</div>
                                                <div className="text-xs text-slate-500">{biz.owner_name || 'Unknown Owner'}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <Badge variant="secondary" className="bg-slate-800 text-slate-300 pointer-events-none">
                                            {biz.category}
                                        </Badge>
                                    </td>
                                    <td className="px-6 py-4 text-slate-400">
                                        <div className="flex items-center gap-1.5">
                                            <MapPin className="w-3.5 h-3.5" />
                                            {biz.location}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <Badge variant="outline" className={
                                            biz.status === 'verified' || biz.status === 'active'
                                                ? "border-green-500/30 text-green-400 bg-green-500/10"
                                                : "border-yellow-500/30 text-yellow-400 bg-yellow-500/10"
                                        }>
                                            {biz.status || 'Pending'}
                                        </Badge>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-1 text-slate-300">
                                            <Star className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500" />
                                            <span>{biz.average_rating || '0.0'}</span>
                                            <span className="text-xs text-slate-500">({biz.review_count || 0})</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0 text-slate-400 hover:text-white">
                                                    <span className="sr-only">Open menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="bg-slate-900 border-slate-700 text-slate-200">
                                                <DropdownMenuItem
                                                    onSelect={() => handleVerify(biz.id)}
                                                    className="cursor-pointer hover:bg-slate-800 focus:bg-slate-800"
                                                >
                                                    {biz.status === 'verified' ? 'Revoke Verification' : 'Verify Business'}
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="cursor-pointer hover:bg-slate-800 focus:bg-slate-800">
                                                    <ExternalLink className="mr-2 h-4 w-4" />
                                                    View Public Page
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
