import React, { useEffect, useState } from 'react';
import { AdminService } from '../../services/AdminService';
import { InvitationService } from '@/services/business/InvitationService';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Store, MapPin, Star, MoreHorizontal, Search, ExternalLink, Send } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import AdminEditBusinessDialog from './AdminEditBusinessDialog';
import { Pencil } from "lucide-react";
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

    // Dialog States
    const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);

    const [selectedBusiness, setSelectedBusiness] = useState(null);
    const [inviteEmail, setInviteEmail] = useState('');
    const [sendingInvite, setSendingInvite] = useState(false);

    const loadBusinesses = async () => {
        console.log("AdminBusinesses: Starting loadBusinesses...");
        setLoading(true);
        try {
            console.log("AdminBusinesses: Calling AdminService.getBusinesses()");

            const data = await AdminService.getBusinesses();

            console.log("AdminBusinesses: Data received:", data);
            setBusinesses(data);
        } catch (e) {
            console.error("Businesses Load Failed", e);
            toast.error("Failed to load businesses: " + e.message);
        } finally {
            console.log("AdminBusinesses: Finally block reached");
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

    // New Edit Handler
    const handleEditClick = (business) => {
        setSelectedBusiness(business);
        setEditDialogOpen(true);
    };

    const handleSendInvite = async () => {
        if (!inviteEmail) return;
        setSendingInvite(true);
        try {
            // 1. Generate Token
            const invite = await InvitationService.createInvitation(selectedBusiness.id, { email: inviteEmail });
            const link = `${window.location.origin}/claim?token=${invite.token}`;

            // 2. Send Email
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
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    {/* Category Filter */}
                    <div className="min-w-[150px]">
                        <select
                            className="w-full bg-slate-900 border border-slate-700 text-slate-300 text-sm rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                            onChange={(e) => setSearchTerm(e.target.value)} // Using same filter logic for now or separate?
                        // Actually, let's separate the states.
                        >
                            <option value="">All Categories</option>
                            <option value="restaurants">Restaurants</option>
                            <option value="hotels">Hotels</option>
                            <option value="activity">Activities</option>
                            <option value="handyman">Handyman</option>
                            {/* We should dynamically load these but hardcoding for speed */}
                        </select>
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
                                    Loading businesses... (DEBUG)
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
                                            <span className="truncate max-w-[200px]" title={biz.location}>{biz.location}</span>
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
                                                    {biz.status === 'verified' ? 'Revoke Verification' : 'Verify Business'}
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="cursor-pointer hover:bg-slate-800 focus:bg-slate-800">
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
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </td>
                                </tr>
                            ))
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
