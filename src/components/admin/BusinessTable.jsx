
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Building2, CheckCircle2, AlertCircle, CreditCard } from "lucide-react";

export default function BusinessTable({ businesses, onAction }) {
    return (
        <div className="rounded-md border border-white/10 bg-slate-950/50 overflow-hidden">
            <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-400 uppercase bg-slate-900/50 border-b border-white/5">
                    <tr>
                        <th className="px-6 py-3">Business</th>
                        <th className="px-6 py-3">Category</th>
                        <th className="px-6 py-3">Plan / Status</th>
                        <th className="px-6 py-3">Revenue (Est)</th>
                        <th className="px-6 py-3 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {businesses.map((biz) => {
                        const isVerified = biz.badge === 'verified';
                        // Mock Logic for Plan
                        const plan = isVerified ? 'Pro' : 'Free';
                        const revenue = isVerified ? '$29.00' : '$0.00';

                        return (
                            <tr key={biz.id} className="hover:bg-white/5 transition-colors">
                                <td className="px-6 py-4 font-medium text-slate-200">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-blue-900/20 border border-blue-500/20 flex items-center justify-center text-blue-400">
                                            <Building2 className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <div className="font-semibold flex items-center gap-2">
                                                {biz.business_name}
                                                {isVerified && <CheckCircle2 className="w-3 h-3 text-blue-400" />}
                                            </div>
                                            <div className="text-xs text-slate-500">{biz.owner_email || 'No Owner'}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-slate-300">
                                    {biz.category}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-col gap-1">
                                        <Badge variant="outline" className={
                                            isVerified
                                                ? "w-fit border-blue-500/30 text-blue-400 bg-blue-500/10"
                                                : "w-fit border-slate-700 text-slate-500"
                                        }>
                                            {plan} Plan
                                        </Badge>
                                        <span className="text-[10px] text-green-400 flex items-center gap-1">
                                            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                            Active
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 font-mono text-slate-300">
                                    {revenue}
                                    <span className="text-xs text-slate-500 ml-1">/mo</span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => onAction && onAction('verify', biz)}
                                        className={`h-8 px-2 ${isVerified ? 'text-blue-400 hover:text-blue-300' : 'text-slate-500 hover:text-white'}`}
                                    >
                                        {isVerified ? 'Unverify' : 'Verify'}
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => onAction && onAction('send_invoice', biz)}
                                        className="h-8 px-2 text-green-400 hover:text-green-300 hover:bg-green-400/10"
                                        title="Send Payment Link"
                                    >
                                        <CreditCard className="w-4 h-4 mr-1" /> Invoice
                                    </Button>
                                </td>
                            </tr>
                        );
                    })}
                    {businesses.length === 0 && (
                        <tr>
                            <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                                No businesses found.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
