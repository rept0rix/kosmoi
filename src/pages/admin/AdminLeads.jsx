import React, { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Filter,
  Mail,
  MailOpen,
  MousePointerClick,
  Phone,
  RefreshCw,
  Search,
  Send,
  TrendingUp,
  User,
  Users,
  Zap,
} from "lucide-react";
import { supabase } from "@/api/supabaseClient";
import { GlassCard } from "@/components/ui/GlassCard";
import { cn } from "@/lib/utils";

// ─── Stat Pill ──────────────────────────────────────────────────────
const StatPill = ({ label, value, sub, icon: Icon, accent = "text-white" }) => (
  <GlassCard variant="flat" className="p-4 flex items-center gap-3">
    {Icon && (
      <div className="p-2 rounded-lg bg-white/5">
        <Icon className={cn("w-5 h-5", accent)} />
      </div>
    )}
    <div>
      <p className={cn("text-xl font-bold font-outfit", accent)}>{value}</p>
      <p className="text-xs text-slate-400">{label}</p>
      {sub && <p className="text-[10px] text-slate-500">{sub}</p>}
    </div>
  </GlassCard>
);

// ─── Funnel Bar ─────────────────────────────────────────────────────
const FunnelBar = ({ stages }) => {
  const max = Math.max(...stages.map((s) => s.count), 1);
  return (
    <div className="flex items-end gap-1 h-10">
      {stages.map((s, i) => (
        <div key={i} className="flex flex-col items-center flex-1">
          <div
            className={cn("w-full rounded-t transition-all", s.color)}
            style={{ height: `${Math.max((s.count / max) * 100, 4)}%` }}
          />
          <span className="text-[9px] text-slate-500 mt-1 truncate w-full text-center">
            {s.label}
          </span>
        </div>
      ))}
    </div>
  );
};

// ─── Provider Row ───────────────────────────────────────────────────
const ProviderRow = ({ provider, onSelect, isSelected }) => {
  const hasEmail = !!provider.email;
  const hasPhone = !!provider.phone;
  const statusColor = {
    active: "bg-emerald-500/20 text-emerald-400",
    outreach_sent: "bg-cyan-500/20 text-cyan-400",
    claimed: "bg-amber-500/20 text-amber-400",
  };

  return (
    <motion.tr
      layout
      onClick={() => onSelect(provider)}
      className={cn(
        "cursor-pointer transition-colors border-b border-white/5",
        isSelected
          ? "bg-cyan-500/10"
          : "hover:bg-white/5"
      )}
    >
      <td className="px-3 py-2.5">
        <p className="text-sm font-medium text-white truncate max-w-[200px]">
          {provider.business_name || "Unnamed"}
        </p>
        <p className="text-[11px] text-slate-500 truncate max-w-[200px]">
          {provider.location || "—"}
        </p>
      </td>
      <td className="px-3 py-2.5">
        <span className="text-xs text-slate-400">
          {provider.category || provider.super_category || "—"}
        </span>
      </td>
      <td className="px-3 py-2.5">
        <div className="flex items-center gap-1.5">
          {hasEmail && <Mail className="w-3.5 h-3.5 text-cyan-400" />}
          {hasPhone && <Phone className="w-3.5 h-3.5 text-emerald-400" />}
          {!hasEmail && !hasPhone && (
            <span className="text-[10px] text-slate-600">none</span>
          )}
        </div>
      </td>
      <td className="px-3 py-2.5">
        <span
          className={cn(
            "text-[11px] px-2 py-0.5 rounded-full",
            statusColor[provider.status] || "bg-slate-700/50 text-slate-400"
          )}
        >
          {provider.status || "new"}
        </span>
      </td>
      <td className="px-3 py-2.5 text-right">
        {provider.outreach_sequences?.[0] ? (
          <span className="text-[11px] text-cyan-400">
            Step {provider.outreach_sequences[0].step}/{provider.outreach_sequences[0].max_steps}
          </span>
        ) : (
          <span className="text-[11px] text-slate-600">—</span>
        )}
      </td>
    </motion.tr>
  );
};

// ─── Sequence Timeline ──────────────────────────────────────────────
const SequenceTimeline = ({ messages }) => {
  if (!messages || messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-slate-500">
        <Mail className="w-8 h-8 mb-2 opacity-30" />
        <p className="text-sm">No outreach yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {messages.map((msg, i) => (
        <div key={msg.id} className="flex gap-3">
          <div className="flex flex-col items-center">
            <div
              className={cn(
                "w-2.5 h-2.5 rounded-full",
                msg.clicked_at
                  ? "bg-emerald-400"
                  : msg.opened_at
                    ? "bg-cyan-400"
                    : "bg-slate-500"
              )}
            />
            {i < messages.length - 1 && (
              <div className="w-px flex-1 bg-white/10 mt-1" />
            )}
          </div>
          <div className="flex-1 pb-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-white font-medium">
                {msg.channel === "email" ? "Email" : msg.channel}
              </span>
              {msg.opened_at && (
                <MailOpen className="w-3 h-3 text-cyan-400" />
              )}
              {msg.clicked_at && (
                <MousePointerClick className="w-3 h-3 text-emerald-400" />
              )}
            </div>
            <p className="text-[11px] text-slate-500">
              {new Date(msg.sent_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
            <p className="text-xs text-slate-400 mt-1 line-clamp-2">
              {msg.content?.slice(0, 120)}
              {msg.content?.length > 120 ? "…" : ""}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════
const PAGE_SIZE = 30;

export default function AdminLeads() {
  // Data
  const [providers, setProviders] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [stats, setStats] = useState(null);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);

  // UI
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterContact, setFilterContact] = useState("all");
  const [sortField, setSortField] = useState("created_at");
  const [sortAsc, setSortAsc] = useState(false);
  const [triggerLoading, setTriggerLoading] = useState(false);

  // ─── Fetch stats ────────────────────────────────────────────────
  const fetchStats = useCallback(async () => {
    const { data, error } = await supabase.rpc("get_platform_snapshot");
    if (!error && data) setStats(data);
  }, []);

  // ─── Fetch providers page ──────────────────────────────────────
  const fetchProviders = useCallback(async () => {
    setLoading(true);
    let q = supabase
      .from("service_providers")
      .select(
        "id, business_name, email, phone, category, super_category, location, status, verified, claimed, average_rating, total_reviews, created_at, outreach_sequences(id, step, max_steps, status, next_send_at)",
        { count: "exact" }
      )
      .order(sortField, { ascending: sortAsc })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    // Filters
    if (filterStatus === "contactable") {
      q = q.not("email", "is", null);
    } else if (filterStatus === "outreach_sent") {
      q = q.eq("status", "outreach_sent");
    } else if (filterStatus === "claimed") {
      q = q.eq("claimed", true);
    } else if (filterStatus === "no_contact") {
      q = q.is("email", null).is("phone", null);
    }

    if (filterContact === "has_email") {
      q = q.not("email", "is", null);
    } else if (filterContact === "has_phone") {
      q = q.not("phone", "is", null);
    }

    if (search.trim()) {
      q = q.ilike("business_name", `%${search.trim()}%`);
    }

    const { data, count, error } = await q;
    if (!error) {
      setProviders(data || []);
      setTotalCount(count || 0);
    }
    setLoading(false);
  }, [page, filterStatus, filterContact, search, sortField, sortAsc]);

  // ─── Fetch messages for selected provider ─────────────────────
  const fetchMessages = useCallback(async (providerId) => {
    const { data: seqs } = await supabase
      .from("outreach_sequences")
      .select("id")
      .eq("business_id", providerId);

    if (!seqs || seqs.length === 0) {
      setMessages([]);
      return;
    }

    const seqIds = seqs.map((s) => s.id);
    const { data: msgs } = await supabase
      .from("outreach_messages")
      .select("*")
      .in("sequence_id", seqIds)
      .order("sent_at", { ascending: true });

    setMessages(msgs || []);
  }, []);

  // ─── Select a provider ────────────────────────────────────────
  const handleSelect = (provider) => {
    setSelected(provider);
    fetchMessages(provider.id);
  };

  // ─── Trigger outreach for one provider ────────────────────────
  const triggerOutreach = async (provider) => {
    if (!provider.email) return;
    setTriggerLoading(true);
    try {
      const { error } = await supabase.functions.invoke("sales-outreach", {
        body: { action: "NEW_BUSINESS", business_id: provider.id },
      });
      if (error) throw error;
      // Refresh after short delay for DB writes to complete
      setTimeout(() => {
        fetchProviders();
        if (selected?.id === provider.id) fetchMessages(provider.id);
      }, 1500);
    } catch (err) {
      console.error("Outreach trigger failed:", err);
    } finally {
      setTriggerLoading(false);
    }
  };

  // ─── Sort toggle ──────────────────────────────────────────────
  const toggleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const SortIcon = ({ field }) =>
    sortField === field ? (
      sortAsc ? (
        <ChevronUp className="w-3 h-3 inline ml-0.5" />
      ) : (
        <ChevronDown className="w-3 h-3 inline ml-0.5" />
      )
    ) : null;

  // ─── Lifecycle ────────────────────────────────────────────────
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  // Realtime: new outreach signals
  useEffect(() => {
    const channel = supabase
      .channel("leads-signals")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "signals",
          filter: "source=eq.sales-outreach",
        },
        () => {
          fetchStats();
          fetchProviders();
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [fetchStats, fetchProviders]);

  // ─── Derived ──────────────────────────────────────────────────
  const totalProviders = stats?.providers?.total ?? 0;
  const hasEmail = stats?.providers?.with_email ?? 0;
  const outreachSent = stats?.outreach?.total_contacted ?? 0;
  const claimed = stats?.providers?.claimed ?? 0;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const funnelStages = [
    { label: "Discovered", count: totalProviders, color: "bg-slate-500" },
    { label: "Has Email", count: hasEmail, color: "bg-cyan-500" },
    { label: "Contacted", count: outreachSent, color: "bg-violet-500" },
    { label: "Claimed", count: claimed, color: "bg-emerald-500" },
  ];

  // ─── Render ───────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-outfit bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-violet-400">
            Outreach Pipeline
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {totalCount.toLocaleString()} providers matching filters
          </p>
        </div>
        <button
          onClick={() => {
            fetchStats();
            fetchProviders();
          }}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatPill
          label="Total Providers"
          value={totalProviders.toLocaleString()}
          icon={Users}
          accent="text-slate-300"
        />
        <StatPill
          label="Has Email"
          value={hasEmail.toLocaleString()}
          sub={`${totalProviders ? ((hasEmail / totalProviders) * 100).toFixed(1) : 0}% reachable`}
          icon={Mail}
          accent="text-cyan-400"
        />
        <StatPill
          label="Outreach Sent"
          value={outreachSent.toLocaleString()}
          sub={`${hasEmail ? ((outreachSent / hasEmail) * 100).toFixed(1) : 0}% of reachable`}
          icon={Send}
          accent="text-violet-400"
        />
        <StatPill
          label="Claimed"
          value={claimed.toLocaleString()}
          sub={`${outreachSent ? ((claimed / outreachSent) * 100).toFixed(1) : 0}% conversion`}
          icon={CheckCircle2}
          accent="text-emerald-400"
        />
      </div>

      {/* ── Funnel Visual ── */}
      <GlassCard variant="flat" className="p-4">
        <p className="text-xs text-slate-500 mb-2 font-medium uppercase tracking-wider">
          Conversion Funnel
        </p>
        <FunnelBar stages={funnelStages} />
      </GlassCard>

      {/* ── Main Content: Table + Detail ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* ── Left: Provider Table ── */}
        <GlassCard className="lg:col-span-2 p-0 overflow-hidden">
          {/* Filters */}
          <div className="p-3 border-b border-white/5 flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search businesses…"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50"
              />
            </div>

            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setPage(0);
              }}
              className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-slate-300 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="contactable">Has Contact Info</option>
              <option value="outreach_sent">Outreach Sent</option>
              <option value="claimed">Claimed</option>
              <option value="no_contact">No Contact</option>
            </select>

            <select
              value={filterContact}
              onChange={(e) => {
                setFilterContact(e.target.value);
                setPage(0);
              }}
              className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-slate-300 focus:outline-none"
            >
              <option value="all">All Channels</option>
              <option value="has_email">Has Email</option>
              <option value="has_phone">Has Phone</option>
            </select>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[11px] text-slate-500 uppercase tracking-wider border-b border-white/5">
                  <th
                    className="px-3 py-2 cursor-pointer hover:text-white transition"
                    onClick={() => toggleSort("business_name")}
                  >
                    Business <SortIcon field="business_name" />
                  </th>
                  <th className="px-3 py-2">Category</th>
                  <th className="px-3 py-2">Contact</th>
                  <th
                    className="px-3 py-2 cursor-pointer hover:text-white transition"
                    onClick={() => toggleSort("status")}
                  >
                    Status <SortIcon field="status" />
                  </th>
                  <th className="px-3 py-2 text-right">Outreach</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="border-b border-white/5">
                      <td colSpan={5} className="px-3 py-3">
                        <div className="h-4 bg-white/5 rounded animate-pulse" />
                      </td>
                    </tr>
                  ))
                ) : providers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="text-center py-12 text-slate-500 text-sm"
                    >
                      No providers match your filters
                    </td>
                  </tr>
                ) : (
                  providers.map((p) => (
                    <ProviderRow
                      key={p.id}
                      provider={p}
                      onSelect={handleSelect}
                      isSelected={selected?.id === p.id}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-3 py-2 border-t border-white/5">
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className="text-xs text-slate-400 hover:text-white disabled:opacity-30 transition"
              >
                ← Prev
              </button>
              <span className="text-[11px] text-slate-500">
                Page {page + 1} of {totalPages}
              </span>
              <button
                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                disabled={page >= totalPages - 1}
                className="text-xs text-slate-400 hover:text-white disabled:opacity-30 transition"
              >
                Next →
              </button>
            </div>
          )}
        </GlassCard>

        {/* ── Right: Detail Panel ── */}
        <GlassCard className="p-4">
          <AnimatePresence mode="wait">
            {selected ? (
              <motion.div
                key={selected.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ type: "spring", damping: 20, stiffness: 300 }}
                className="space-y-4"
              >
                {/* Header */}
                <div>
                  <h2 className="text-lg font-bold text-white font-outfit truncate">
                    {selected.business_name}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {selected.category || selected.super_category || "Uncategorized"}{" "}
                    • {selected.location || "Unknown location"}
                  </p>
                </div>

                {/* Contact Info */}
                <div className="space-y-1.5">
                  {selected.email && (
                    <div className="flex items-center gap-2 text-xs text-cyan-400">
                      <Mail className="w-3.5 h-3.5" />
                      <span className="truncate">{selected.email}</span>
                    </div>
                  )}
                  {selected.phone && (
                    <div className="flex items-center gap-2 text-xs text-emerald-400">
                      <Phone className="w-3.5 h-3.5" />
                      <span>{selected.phone}</span>
                    </div>
                  )}
                  {selected.average_rating > 0 && (
                    <div className="flex items-center gap-2 text-xs text-amber-400">
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>
                        {selected.average_rating}★ ({selected.total_reviews} reviews)
                      </span>
                    </div>
                  )}
                </div>

                {/* Status Badge */}
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "text-xs px-2.5 py-1 rounded-full",
                      selected.claimed
                        ? "bg-emerald-500/20 text-emerald-400"
                        : selected.status === "outreach_sent"
                          ? "bg-cyan-500/20 text-cyan-400"
                          : "bg-slate-700/50 text-slate-400"
                    )}
                  >
                    {selected.claimed
                      ? "✓ Claimed"
                      : selected.status === "outreach_sent"
                        ? "Outreach Sent"
                        : selected.status || "New"}
                  </span>
                  {selected.verified && (
                    <span className="text-xs px-2 py-1 rounded-full bg-violet-500/20 text-violet-400">
                      Verified
                    </span>
                  )}
                </div>

                {/* Action: Trigger Outreach */}
                {selected.email &&
                  selected.status !== "outreach_sent" &&
                  !selected.claimed && (
                    <button
                      onClick={() => triggerOutreach(selected)}
                      disabled={triggerLoading}
                      className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-violet-600 hover:from-cyan-500 hover:to-violet-500 text-white text-sm font-medium transition disabled:opacity-50"
                    >
                      {triggerLoading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Sending…
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4" />
                          Start Outreach
                        </>
                      )}
                    </button>
                  )}

                {/* Outreach Timeline */}
                <div>
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-2">
                    Outreach History
                  </p>
                  <SequenceTimeline messages={messages} />
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-16 text-slate-500"
              >
                <User className="w-10 h-10 mb-3 opacity-20" />
                <p className="text-sm">Select a provider</p>
                <p className="text-xs text-slate-600 mt-1">
                  Click any row to see details & outreach history
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </GlassCard>
      </div>
    </div>
  );
}
