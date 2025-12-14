import React, { useState, useEffect } from 'react';
import { realSupabase as supabase } from '@/api/supabaseClient';
import { BadgeCheck, XCircle, CheckCircle, FileText, Link as LinkIcon, Mail, Loader2, RefreshCw } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { format } from 'date-fns';

export default function AdminClaims() {
    const [claims, setClaims] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);

    const fetchClaims = async () => {
        setLoading(true);
        // Fetch claims with business details
        const { data, error } = await supabase
            .from('business_claims')
            .select(`
                *,
                business:service_providers(business_name, location)
            `)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching claims:', error);
        } else {
            setClaims(data || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchClaims();
    }, []);

    const handleAction = async (claimId, newStatus) => {
        setProcessingId(claimId);
        try {
            const { error } = await supabase
                .from('business_claims')
                .update({ status: newStatus })
                .eq('id', claimId);

            if (error) throw error;

            // Refresh local state specific item or reload all
            setClaims(prev => prev.map(c => c.id === claimId ? { ...c, status: newStatus } : c));

        } catch (err) {
            console.error("Failed to update status:", err);
            alert("Failed to update status");
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Business Claims</h1>
                    <p className="text-gray-500 mt-1">Review and verify ownership claims</p>
                </div>
                <Button variant="outline" onClick={fetchClaims}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                </Button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Business</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Claimer</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Method / Proof</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-gray-500">
                                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                                        Loading claims...
                                    </td>
                                </tr>
                            ) : claims.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-gray-500">
                                        No claims found.
                                    </td>
                                </tr>
                            ) : (
                                claims.map((claim) => (
                                    <tr key={claim.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900">
                                                {claim.business?.business_name || 'Unknown Business'}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {claim.business?.location}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-gray-900">{claim.claimer_name}</div>
                                            <div className="text-xs text-gray-500">{claim.claimer_contact}</div>
                                            <div className="text-xs text-gray-400 mt-0.5" title={claim.created_at}>
                                                {format(new Date(claim.created_at), 'MMM d, yyyy')}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 mb-1">
                                                {claim.verification_method === 'document' && <FileText className="w-4 h-4 text-blue-500" />}
                                                {claim.verification_method === 'social' && <LinkIcon className="w-4 h-4 text-purple-500" />}
                                                {claim.verification_method === 'email' && <Mail className="w-4 h-4 text-amber-500" />}
                                                <span className="text-sm capitalize">{claim.verification_method}</span>
                                            </div>
                                            <div className="text-xs text-gray-500 max-w-[200px] truncate" title={claim.verification_proof}>
                                                {claim.verification_proof || 'No proof provided'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
                                                ${claim.status === 'approved' ? 'bg-green-50 text-green-700 border-green-100' : ''}
                                                ${claim.status === 'rejected' ? 'bg-red-50 text-red-700 border-red-100' : ''}
                                                ${claim.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-100' : ''}
                                            `}>
                                                {claim.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {claim.status === 'pending' && (
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                                                        onClick={() => handleAction(claim.id, 'approved')}
                                                        disabled={processingId === claim.id}
                                                    >
                                                        {processingId === claim.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                        onClick={() => handleAction(claim.id, 'rejected')}
                                                        disabled={processingId === claim.id}
                                                    >
                                                        {processingId === claim.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-5 h-5" />}
                                                    </Button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
