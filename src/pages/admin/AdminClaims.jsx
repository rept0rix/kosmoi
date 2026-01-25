import React, { useState, useEffect } from "react";
import { realSupabase as supabase } from "@/api/supabaseClient";
import {
  BadgeCheck,
  XCircle,
  CheckCircle,
  FileText,
  Link as LinkIcon,
  Mail,
  Loader2,
  RefreshCw,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { GlassCard } from "@/components/ui/GlassCard";
import { NeonButton } from "@/components/ui/NeonButton";
import { Badge } from "@/components/ui/badge";

export default function AdminClaims() {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  const fetchClaims = async () => {
    setLoading(true);
    // Fetch claims with business details
    const { data, error } = await supabase
      .from("business_claims")
      .select(
        `
                *,
                business:service_providers(business_name, location)
            `,
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching claims:", error);
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
        .from("business_claims")
        .update({ status: newStatus })
        .eq("id", claimId);

      if (error) throw error;

      // Refresh local state specific item or reload all
      setClaims((prev) =>
        prev.map((c) => (c.id === claimId ? { ...c, status: newStatus } : c)),
      );
    } catch (err) {
      console.error("Failed to update status:", err);
      alert("Failed to update status");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-8 p-2 animate-in fade-in duration-500">
      <div className="flex items-end justify-between border-b border-white/5 pb-6">
        <div>
          <h1 className="text-4xl font-black text-white mb-2 tracking-tight">
            CLAIM{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">
              VERIFICATION
            </span>
          </h1>
          <p className="text-slate-400 font-mono text-sm">
            // OWNERSHIP_DISPUTES
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={fetchClaims}
            className="border-white/5 bg-black/20 hover:bg-white/10 hover:text-orange-400 text-slate-400"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      <GlassCard className="p-0 overflow-hidden border-white/5 bg-slate-900/20">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-white/[0.02] border-b border-white/5">
                <th className="px-6 py-4 font-mono text-xs tracking-wider text-slate-500 uppercase">
                  Target Node
                </th>
                <th className="px-6 py-4 font-mono text-xs tracking-wider text-slate-500 uppercase">
                  Claimant
                </th>
                <th className="px-6 py-4 font-mono text-xs tracking-wider text-slate-500 uppercase">
                  Evidence
                </th>
                <th className="px-6 py-4 font-mono text-xs tracking-wider text-slate-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-4 font-mono text-xs tracking-wider text-slate-500 uppercase text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-slate-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-orange-400" />
                    <span className="font-mono text-xs">
                      SCANNING_CLAIMS...
                    </span>
                  </td>
                </tr>
              ) : claims.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center opacity-50">
                      <ShieldAlert className="w-8 h-8 mb-2" />
                      <p className="font-mono text-xs">NO_ACTIVE_CLAIMS</p>
                    </div>
                  </td>
                </tr>
              ) : (
                claims.map((claim) => (
                  <tr
                    key={claim.id}
                    className="hover:bg-white/[0.02] border-white/5 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-200">
                        {claim.business?.business_name || "UNKNOWN_NODE"}
                      </div>
                      <div className="text-xs text-slate-500 font-mono">
                        {claim.business?.location || "Unknown Location"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-slate-300">
                        {claim.claimer_name}
                      </div>
                      <div className="text-xs text-slate-500 font-mono">
                        {claim.claimer_contact}
                      </div>
                      <div className="text-[10px] text-slate-600 mt-1 font-mono uppercase tracking-wide">
                        {format(new Date(claim.created_at), "MMM d, yy HH:mm")}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 mb-1">
                        {claim.verification_method === "document" && (
                          <FileText className="w-4 h-4 text-blue-400" />
                        )}
                        {claim.verification_method === "social" && (
                          <LinkIcon className="w-4 h-4 text-purple-400" />
                        )}
                        {claim.verification_method === "email" && (
                          <Mail className="w-4 h-4 text-amber-400" />
                        )}
                        <span className="text-xs font-mono uppercase text-slate-400">
                          {claim.verification_method}
                        </span>
                      </div>
                      <div
                        className="text-xs text-slate-500 max-w-[200px] truncate font-mono"
                        title={claim.verification_proof}
                      >
                        {claim.verification_proof || "No proof provided"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        variant="outline"
                        className={`
                                                ${claim.status === "approved" ? "border-green-500/30 text-green-400 bg-green-500/10" : ""}
                                                ${claim.status === "rejected" ? "border-red-500/30 text-red-400 bg-red-500/10" : ""}
                                                ${claim.status === "pending" ? "border-yellow-500/30 text-yellow-400 bg-yellow-500/10" : ""}
                                            `}
                      >
                        {claim.status.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {claim.status === "pending" && (
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-green-500 hover:text-green-400 hover:bg-green-500/10"
                            onClick={() => handleAction(claim.id, "approved")}
                            disabled={processingId === claim.id}
                          >
                            {processingId === claim.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <CheckCircle className="w-5 h-5" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-400 hover:bg-red-500/10"
                            onClick={() => handleAction(claim.id, "rejected")}
                            disabled={processingId === claim.id}
                          >
                            {processingId === claim.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <XCircle className="w-5 h-5" />
                            )}
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
      </GlassCard>
    </div>
  );
}
