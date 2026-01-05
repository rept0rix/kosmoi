import React, { useEffect, useState } from 'react';
import { AdminService } from '../../services/AdminService';
import { getSuperCategory, formatCategory } from '../../shared/utils/categoryMapping';
import { InvitationService } from '@/services/business/InvitationService';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Store, MapPin, Star, MoreHorizontal, Search, ExternalLink, Send, Pencil, Activity } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import AdminEditBusinessDialog from './AdminEditBusinessDialog';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export default function AdminBusinesses() {
    const [businesses, setBusinesses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');

    // Dialog States
    const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);

    const [selectedBusiness, setSelectedBusiness] = useState(null);
    const [inviteEmail, setInviteEmail] = useState('');
    const [sendingInvite, setSendingInvite] = useState(false);

    const loadBusinesses = async () => {
        setLoading(true);
        try {
            const data = await AdminService.getBusinesses();
            setBusinesses(data);
        } catch (e) {
            console.error("Businesses Load Failed", e);
            toast.error("Failed to load businesses: " + e.message);
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

    const handleInviteClick = (business) => {
        setSelectedBusiness(business);
        setInviteEmail(business.email || business.contact_email || '');
        setInviteDialogOpen(true);
    };

    const handleEditClick = (business) => {
        setSelectedBusiness(business);
        setEditDialogOpen(true);
    };

    const handleViewPublic = (business) => {
        if (business.website) {
            window.open(business.website, '_blank');
        } else if (business.google_place_id) {
            window.open(`https://www.google.com/maps/place/?q=place_id:${business.google_place_id}`, '_blank');
        } else {
            toast.info("No website or Google Map found for this business.");
        }
    };

    const handleSendInvite = async () => {
        if (!inviteEmail) return;
        setSendingInvite(true);
        try {
            const invite = await InvitationService.createInvitation(selectedBusiness.id, { email: inviteEmail });
            const link = `${window.location.origin}/claim?token=${invite.token}`;
            const result = await AdminService.sendInvitationEmail(inviteEmail, selectedBusiness?.business_name, link);

            if (result.error) throw new Error(result.error);

            toast.success("Invitation Sent!", { description: `Email sent to ${inviteEmail}` });
            setInviteDialogOpen(false);
        } catch (error) {
            console.error(error);
            toast.error("Failed to send invitation", { description: error.message });
        } finally {
            setSendingInvite(false);
        }
    };

    const handleCopyLink = async () => {
        if (!selectedBusiness) return;
        try {
            const invite = await InvitationService.createInvitation(selectedBusiness.id, { email: inviteEmail });
            const link = `${window.location.origin}/claim?token=${invite.token}`;
            await navigator.clipboard.writeText(link);
            toast.success("Link Copied!");
        } catch (e) {
            console.error(e);
            toast.error("Failed to copy link");
        }
        const handleAuditClick = async (business) => {
            try {
                toast.info(`Starting AI Audit for ${business.business_name}...`);
                await fetch('/api/audit', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ businessId: business.id })
                });
                toast.success("Audit Workflow Started");
            } catch (e) {
                console.error(e);
                toast.error("Failed to start audit");
            }
        };

        // --- FILTER LOGIC ---
        const filteredBusinesses = businesses.filter(b => {
            const matchesSearch = b.business_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                b.category?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = categoryFilter === 'all' || b.category === categoryFilter;
            const matchesStatus = statusFilter === 'all' ||
                (statusFilter === 'verified' && b.verified) ||
                (statusFilter === 'unverified' && !b.verified) ||
                (statusFilter === 'active' && b.status === 'active');

            return matchesSearch && matchesCategory && matchesStatus;
        });

        // Extract unique categories for filter
        const uniqueCategories = [...new Set(businesses.map(b => b.category).filter(Boolean))].sort();

        return (
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Businesses</h1>
                        <p className="text-slate-400">Manage service providers and vendor accounts.</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                        {/* Status Filter */}
                        <select
                            className="bg-slate-900 border border-slate-700 text-slate-300 text-sm rounded-lg px-3 py-2 outline-none focus:border-blue-500"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="verified">Verified</option>
                            <option value="unverified">Unverified</option>
                        </select>

                        {/* Category Filter */}
                        <select
                            className="bg-slate-900 border border-slate-700 text-slate-300 text-sm rounded-lg px-3 py-2 outline-none focus:border-blue-500 max-w-[160px]"
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                        >
                            <option value="all">All Categories</option>
                            {uniqueCategories.map(cat => (
                                <option key={cat} value={cat}>{formatCategory(cat)}</option>
                            ))}
                        </select>

                        {/* Search */}
                        <div className="relative w-full md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <input
                                type="text"
                                placeholder="Search..."
                                className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
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
                                        No businesses match your filters.
                                    </td>
                                </tr>
                            ) : (
                                filteredBusinesses.map((biz) => {
                                    return (
                                        <tr key={biz.id} className="hover:bg-white/5 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-blue-900/20 flex items-center justify-center text-blue-400 overflow-hidden">
                                                        {biz.images && biz.images.length > 0 ? (
                                                            <img src={biz.images[0].startsWith('http') ? biz.images[0] : `https://gzjzeywhqbwppfxqkptf.supabase.co/storage/v1/object/public/provider-images/${biz.images[0]}`} className="w-full h-full object-cover" />
                                                        ) : <Store className="w-5 h-5" />}
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold text-slate-200">{biz.business_name}</div>
                                                        <div className="text-xs text-slate-500 line-clamp-1">{biz.description?.substring(0, 40)}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1 items-start">
                                                    <Badge variant="secondary" className="bg-slate-800 text-slate-300 w-fit pointer-events-none capitalize">
                                                        {formatCategory(biz.category)}
                                                    </Badge>
                                                    {biz.sub_category && biz.sub_category !== biz.category && (
                                                        <span className="text-[10px] text-slate-500 uppercase tracking-wide px-1">
                                                            {formatCategory(biz.sub_category)}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-400">
                                                <div className="flex items-center gap-1.5">
                                                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                                                    <span className="truncate max-w-[200px]" title={biz.location}>{biz.location}</span>
                                                </div>
                                                {biz.phone && (
                                                    <div className="text-xs text-slate-500 mt-1 ml-5">
                                                        {biz.phone}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge variant="outline" className={
                                                    biz.verified
                                                        ? "border-green-500/30 text-green-400 bg-green-500/10"
                                                        : "border-slate-700 text-slate-500"
                                                }>
                                                    {biz.verified ? 'Verified' : 'Unverified'}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-1 text-slate-300">
                                                    <Star className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500" />
                                                    <span>{biz.average_rating || '0.0'}</span>
                                                    <span className="text-xs text-slate-500">({biz.user_ratings_total || 0})</span>
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
                                                            onSelect={() => handleEditClick(biz)}
                                                            className="cursor-pointer hover:bg-slate-800 focus:bg-slate-800 text-yellow-400"
                                                        >
                                                            <Pencil className="mr-2 h-4 w-4" />
                                                            Edit Details
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onSelect={() => handleVerify(biz.id)}
                                                            className="cursor-pointer hover:bg-slate-800 focus:bg-slate-800"
                                                        >
                                                            {biz.verified ? 'Revoke Verification' : 'Verify Business'}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onSelect={(e) => {
                                                                e.preventDefault();
                                                                handleViewPublic(biz);
                                                            }}
                                                            className="cursor-pointer hover:bg-slate-800 focus:bg-slate-800"
                                                        >
                                                            <ExternalLink className="mr-2 h-4 w-4" />
                                                            View Public Page
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onSelect={() => handleInviteClick(biz)}
                                                            className="cursor-pointer hover:bg-slate-800 focus:bg-slate-800 text-teal-400"
                                                        >
                                                            <Send className="mr-2 h-4 w-4" />
                                                            Invite Business
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onSelect={() => handleAuditClick(biz)}
                                                            className="cursor-pointer hover:bg-slate-800 focus:bg-slate-800 text-purple-400"
                                                        >
                                                            <Activity className="mr-2 h-4 w-4" />
                                                            Run AI Audit
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Invite Dialog */}
                <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                    <DialogContent className="bg-slate-900 border-slate-700 text-slate-100">
                        <DialogHeader>
                            <DialogTitle>Invite {selectedBusiness?.business_name}</DialogTitle>
                            <DialogDescription className="text-slate-400">
                                Send an invitation email or copy the claim link.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="email" className="text-slate-200">Email Address</Label>
                                <Input
                                    id="email"
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                    className="bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500"
                                    placeholder="business@example.com"
                                />
                            </div>
                        </div>
                        <DialogFooter className="gap-2 sm:gap-0">
                            <Button variant="outline" onClick={handleCopyLink} className="border-slate-700 text-slate-300 hover:bg-slate-800">
                                Copy Link
                            </Button>
                            <Button onClick={handleSendInvite} disabled={sendingInvite || !inviteEmail} className="bg-blue-600 hover:bg-blue-700 text-white">
                                {sendingInvite ? "Sending..." : "Send Invitation"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Edit Dialog */}
                <AdminEditBusinessDialog
                    open={editDialogOpen}
                    onOpenChange={setEditDialogOpen}
                    business={selectedBusiness}
                    onSaved={loadBusinesses}
                />
            </div>
        );
    }
