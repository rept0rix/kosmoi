import React, { useState, useEffect } from "react";
import { supabase } from "../../api/supabaseClient";
import {
  Building2,
  Mail,
  ExternalLink,
  CheckCircle2,
  Clock,
  MousePointer2,
  Eye,
  RefreshCw,
  Search,
} from "lucide-react";

const AdminSales = () => {
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, opened, clicked, claimed
  const [searchTerm, setSearchTerm] = useState("");

  const fetchInvitations = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("invitations")
        .select(
          `
            *,
            service_providers (
                business_name,
                category
            )
        `,
        )
        .order("created_at", { ascending: false });

      if (error) throw error;
      setInvitations(data || []);
    } catch (error) {
      console.error("Error fetching invitations:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvitations();

    // Realtime Subscription
    const channel = supabase
      .channel("admin-sales-feed")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "invitations" },
        () => {
          // Refresh list on ANY change (Insert/Update/Delete)
          // We re-fetch essentially because we need the joined 'service_providers' data
          // and it's safer/easier than patching the state manually for joined tables.
          fetchInvitations();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Filter Logic
  const filteredInvitations = invitations.filter((inv) => {
    const matchesSearch = inv.service_providers?.business_name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (filter === "all") return true;
    if (filter === "opened") return inv.opened_at !== null;
    if (filter === "clicked") return inv.clicked_at !== null;
    if (filter === "claimed") return inv.status === "claimed";
    return true;
  });

  const getStatusBadge = (inv) => {
    if (inv.status === "claimed")
      return (
        <span className="px-2 py-1 bg-green-500/10 text-green-500 rounded text-xs font-medium">
          Claimed
        </span>
      );
    if (inv.clicked_at)
      return (
        <span className="px-2 py-1 bg-blue-500/10 text-blue-500 rounded text-xs font-medium">
          Clicked
        </span>
      );
    if (inv.opened_at)
      return (
        <span className="px-2 py-1 bg-purple-500/10 text-purple-500 rounded text-xs font-medium">
          Opened
        </span>
      );
    return (
      <span className="px-2 py-1 bg-gray-500/10 text-gray-400 rounded text-xs font-medium">
        Sent
      </span>
    );
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleString("en-GB", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="p-6 space-y-6 bg-[#0a0a0a] min-h-screen text-white">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent">
            Sales Command Center
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Track Sarah's automated outreach performance
          </p>
        </div>
        <button
          onClick={fetchInvitations}
          className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors border border-white/10"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-3 text-gray-400 mb-2">
            <Mail className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wider">Sent</span>
          </div>
          <div className="text-2xl font-bold">{invitations.length}</div>
        </div>
        <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4">
          <div className="flex items-center gap-3 text-purple-400 mb-2">
            <Eye className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wider">Opened</span>
          </div>
          <div className="text-2xl font-bold text-purple-400">
            {invitations.filter((i) => i.opened_at).length}
          </div>
        </div>
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
          <div className="flex items-center gap-3 text-blue-400 mb-2">
            <MousePointer2 className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wider">Clicked</span>
          </div>
          <div className="text-2xl font-bold text-blue-400">
            {invitations.filter((i) => i.clicked_at).length}
          </div>
        </div>
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
          <div className="flex items-center gap-3 text-green-400 mb-2">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wider">Converted</span>
          </div>
          <div className="text-2xl font-bold text-green-400">
            {invitations.filter((i) => i.status === "claimed").length}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search business..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-yellow-500/50"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-yellow-500/50"
        >
          <option value="all">All Status</option>
          <option value="opened">Opened Only</option>
          <option value="clicked">Clicked Only</option>
          <option value="claimed">Claimed Only</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10 text-gray-400 text-xs uppercase tracking-wider bg-white/5">
              <th className="p-4 font-medium">Business</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium">Sent At</th>
              <th className="p-4 font-medium">Opened At</th>
              <th className="p-4 font-medium">Clicked At</th>
              <th className="p-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredInvitations.map((inv) => (
              <tr key={inv.id} className="hover:bg-white/5 transition-colors">
                <td className="p-4">
                  <div className="font-medium text-white">
                    {inv.service_providers?.business_name || "Unknown Business"}
                  </div>
                  <div className="text-xs text-gray-500">
                    {inv.service_providers?.category}
                  </div>
                </td>
                <td className="p-4">{getStatusBadge(inv)}</td>
                <td className="p-4 text-sm text-gray-400">
                  {formatDate(inv.created_at)}
                </td>
                <td className="p-4 text-sm">
                  {inv.opened_at ? (
                    <div className="flex items-center gap-1.5 text-purple-400">
                      <Eye className="w-3.5 h-3.5" />
                      <span>{formatDate(inv.opened_at)}</span>
                    </div>
                  ) : (
                    "-"
                  )}
                </td>
                <td className="p-4 text-sm">
                  {inv.clicked_at ? (
                    <div className="flex items-center gap-1.5 text-blue-400">
                      <MousePointer2 className="w-3.5 h-3.5" />
                      <span>{formatDate(inv.clicked_at)}</span>
                    </div>
                  ) : (
                    "-"
                  )}
                </td>
                <td className="p-4 text-right">
                  <button
                    className="text-gray-500 hover:text-white transition-colors"
                    title="View Details"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {!loading && filteredInvitations.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-500">
                  No invitations found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminSales;
