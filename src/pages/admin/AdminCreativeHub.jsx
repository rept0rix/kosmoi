import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { realSupabase } from '../../api/supabaseClient';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  PenTool, Radar, Image, FileText, Mail, Share2,
  AlertTriangle, CheckCircle, Clock, RefreshCw, Eye,
  ChevronDown, ChevronUp, Sparkles, TrendingUp, TrendingDown,
  Shield, Zap, ExternalLink, BarChart3, Hash
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

// ── Content Queue Panel ────────────────────────────────────────
function ContentQueue({ items, onRefresh }) {
  const [expandedId, setExpandedId] = useState(null);

  const typeConfig = {
    blog_post: { icon: <FileText className="w-4 h-4" />, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
    social_copy: { icon: <Share2 className="w-4 h-4" />, color: 'text-pink-400', bg: 'bg-pink-500/10', border: 'border-pink-500/30' },
    meta_description: { icon: <Hash className="w-4 h-4" />, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
    email_template: { icon: <Mail className="w-4 h-4" />, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
    visual_brief: { icon: <Image className="w-4 h-4" />, color: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/30' },
  };

  const statusConfig = {
    queued: { color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-600' },
    generating: { color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30' },
    review: { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
    published: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
    rejected: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30' },
  };

  return (
    <GlassCard>
      <div className="p-4 border-b border-white/5 flex items-center justify-between">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          Content Queue
          <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px]">
            {items.length}
          </Badge>
        </h3>
      </div>

      <ScrollArea className="max-h-[500px]">
        {items.length === 0 && (
          <div className="p-8 text-center">
            <PenTool className="w-8 h-8 text-slate-700 mx-auto mb-2 animate-pulse" />
            <p className="text-sm text-slate-500">No content in queue</p>
          </div>
        )}

        <div className="divide-y divide-white/5">
          {items.map(item => {
            const type = typeConfig[item.content_type] || typeConfig.blog_post;
            const status = statusConfig[item.status] || statusConfig.queued;
            const isExpanded = expandedId === item.id;

            return (
              <div key={item.id}>
                <button
                  onClick={() => setExpandedId(isExpanded ? null : item.id)}
                  className="w-full p-3 flex items-center gap-3 hover:bg-white/5 transition-colors text-left"
                >
                  <div className={`w-8 h-8 rounded-lg ${type.bg} border ${type.border} flex items-center justify-center ${type.color}`}>
                    {type.icon}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-white truncate">
                      {item.title || item.prompt?.slice(0, 60)}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-slate-600 font-mono">{item.content_type}</span>
                      <span className="text-[10px] text-slate-700">•</span>
                      <span className="text-[10px] text-slate-600">{item.requested_by}</span>
                    </div>
                  </div>

                  <Badge className={`${status.bg} ${status.color} ${status.border} text-[10px]`}>
                    {item.status}
                  </Badge>

                  {item.quality_score && (
                    <span className={`text-xs font-mono font-bold ${
                      item.quality_score >= 8 ? 'text-emerald-400' :
                      item.quality_score >= 6 ? 'text-amber-400' : 'text-red-400'
                    }`}>{item.quality_score}</span>
                  )}

                  <span className="text-[10px] text-slate-700 font-mono hidden sm:inline">
                    {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                  </span>

                  {isExpanded ? <ChevronUp className="w-3 h-3 text-slate-600" /> : <ChevronDown className="w-3 h-3 text-slate-600" />}
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-3 pb-3 space-y-2">
                        {/* Prompt */}
                        <div className="bg-black/20 rounded-lg p-2 border border-white/5">
                          <div className="text-[10px] text-slate-500 font-mono mb-1">PROMPT</div>
                          <p className="text-xs text-slate-300 whitespace-pre-wrap">{item.prompt}</p>
                        </div>

                        {/* Result preview */}
                        {item.result && Object.keys(item.result).length > 0 && (
                          <div className="bg-black/20 rounded-lg p-2 border border-white/5">
                            <div className="text-[10px] text-slate-500 font-mono mb-1">GENERATED CONTENT</div>
                            <pre className="text-xs text-slate-300 whitespace-pre-wrap overflow-x-auto max-h-48">
                              {JSON.stringify(item.result, null, 2).slice(0, 1000)}
                            </pre>
                          </div>
                        )}

                        {/* Meta */}
                        <div className="flex items-center gap-3 text-[10px] text-slate-600 font-mono">
                          {item.tokens_used > 0 && <span>🪙 {item.tokens_used} tokens</span>}
                          {item.duration_ms > 0 && <span>⏱ {item.duration_ms}ms</span>}
                          {item.model_used && <span>🤖 {item.model_used}</span>}
                          {item.generated_by && <span>👤 {item.generated_by}</span>}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </GlassCard>
  );
}

// ── Competitive Intel Panel ────────────────────────────────────
function IntelPanel({ items }) {
  const sevConfig = {
    critical: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', icon: <AlertTriangle className="w-4 h-4" /> },
    high: { color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30', icon: <TrendingUp className="w-4 h-4" /> },
    medium: { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', icon: <BarChart3 className="w-4 h-4" /> },
    low: { color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-600', icon: <Eye className="w-4 h-4" /> },
  };

  return (
    <GlassCard>
      <div className="p-4 border-b border-white/5">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Radar className="w-4 h-4 text-cyan-400" />
          Competitive Intelligence
          <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 text-[10px]">
            {items.length}
          </Badge>
        </h3>
      </div>

      <ScrollArea className="max-h-[500px]">
        {items.length === 0 && (
          <div className="p-8 text-center">
            <Radar className="w-8 h-8 text-slate-700 mx-auto mb-2 animate-pulse" />
            <p className="text-sm text-slate-500">No intelligence gathered yet</p>
            <p className="text-xs text-slate-600 mt-1">Radar scans every 4 hours</p>
          </div>
        )}

        <div className="divide-y divide-white/5">
          {items.map(item => {
            const sev = sevConfig[item.severity] || sevConfig.low;

            return (
              <div key={item.id} className="p-3">
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-lg ${sev.bg} border ${sev.border} flex items-center justify-center ${sev.color} shrink-0 mt-0.5`}>
                    {sev.icon}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-white">{item.competitor_name}</span>
                      <Badge variant="outline" className="text-[10px] text-slate-500 border-slate-700">
                        {item.intel_type?.replace(/_/g, ' ')}
                      </Badge>
                      <Badge className={`${sev.bg} ${sev.color} ${sev.border} text-[10px]`}>
                        {item.severity}
                      </Badge>
                    </div>

                    <p className="text-xs text-slate-300">{item.summary}</p>

                    {item.raw_data?.recommended_action && (
                      <div className="mt-1.5 flex items-start gap-1.5">
                        <Zap className="w-3 h-3 text-amber-400 mt-0.5 shrink-0" />
                        <span className="text-[10px] text-amber-400">{item.raw_data.recommended_action}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-600 font-mono">
                      <span>{formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}</span>
                      <Badge variant="outline" className={`text-[10px] ${
                        item.response_status === 'acting' ? 'text-cyan-400 border-cyan-500/30' :
                        item.response_status === 'acknowledged' ? 'text-amber-400 border-amber-500/30' :
                        item.response_status === 'resolved' ? 'text-emerald-400 border-emerald-500/30' :
                        'text-slate-500 border-slate-700'
                      }`}>
                        {item.response_status}
                      </Badge>
                      {item.raw_data?.confidence && (
                        <span>confidence: {Math.round(item.raw_data.confidence * 100)}%</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </GlassCard>
  );
}

// ── Stats Cards ────────────────────────────────────────────────
function StatsCards({ contentItems, intelItems }) {
  const published = contentItems.filter(c => c.status === 'published').length;
  const inReview = contentItems.filter(c => c.status === 'review').length;
  const queued = contentItems.filter(c => c.status === 'queued' || c.status === 'generating').length;
  const avgQuality = contentItems.filter(c => c.quality_score).reduce((sum, c) => sum + c.quality_score, 0)
    / (contentItems.filter(c => c.quality_score).length || 1);
  const criticalIntel = intelItems.filter(i => i.severity === 'critical' || i.severity === 'high').length;
  const totalTokens = contentItems.reduce((sum, c) => sum + (c.tokens_used || 0), 0);

  const stats = [
    { label: 'Published', value: published, icon: <CheckCircle className="w-4 h-4" />, color: 'text-emerald-400' },
    { label: 'In Review', value: inReview, icon: <Eye className="w-4 h-4" />, color: 'text-amber-400' },
    { label: 'Queued', value: queued, icon: <Clock className="w-4 h-4" />, color: 'text-slate-400' },
    { label: 'Avg Quality', value: avgQuality.toFixed(1), icon: <Sparkles className="w-4 h-4" />, color: 'text-violet-400' },
    { label: 'Critical Intel', value: criticalIntel, icon: <AlertTriangle className="w-4 h-4" />, color: criticalIntel > 0 ? 'text-red-400' : 'text-slate-400' },
    { label: 'Tokens Used', value: totalTokens.toLocaleString(), icon: <Zap className="w-4 h-4" />, color: 'text-cyan-400' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {stats.map(stat => (
        <GlassCard key={stat.label} className="p-3">
          <div className="flex items-center gap-2 mb-1">
            <span className={stat.color}>{stat.icon}</span>
            <span className="text-[10px] text-slate-500 font-mono uppercase">{stat.label}</span>
          </div>
          <div className="text-xl font-bold text-white font-mono">{stat.value}</div>
        </GlassCard>
      ))}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────
export default function AdminCreativeHub() {
  const [contentItems, setContentItems] = useState([]);
  const [intelItems, setIntelItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [contentRes, intelRes] = await Promise.all([
      realSupabase
        .from('content_queue')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50),
      realSupabase
        .from('competitive_intel')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(30),
    ]);

    setContentItems(contentRes.data || []);
    setIntelItems(intelRes.data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();

    const channel = realSupabase
      .channel('creative-updates')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'content_queue' }, () => loadData())
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'content_queue' }, () => loadData())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'competitive_intel' }, () => loadData())
      .subscribe();

    return () => { realSupabase.removeChannel(channel); };
  }, [loadData]);

  const triggerContentGen = async () => {
    try {
      const { data: { session } } = await realSupabase.auth.getSession();
      await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/content-generator`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({}),
      });
      loadData();
    } catch (err) {
      console.error('Content gen failed:', err);
    }
  };

  const triggerRadar = async () => {
    try {
      const { data: { session } } = await realSupabase.auth.getSession();
      await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/competitive-radar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({}),
      });
      loadData();
    } catch (err) {
      console.error('Radar failed:', err);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-400 via-pink-400 to-violet-400">
            Creative Hub
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-mono">
            Content generation • Competitive intelligence • Creative agents
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            disabled={loading}
            className="border-white/10 text-slate-400 hover:text-white"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={triggerContentGen}
            className="bg-gradient-to-r from-amber-500/20 to-pink-500/20 border border-amber-500/30 text-amber-400"
          >
            <PenTool className="w-4 h-4 mr-2" />
            Process Queue
          </Button>
          <Button
            size="sm"
            onClick={triggerRadar}
            className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 text-cyan-400"
          >
            <Radar className="w-4 h-4 mr-2" />
            Run Radar
          </Button>
        </div>
      </div>

      {/* Stats */}
      <StatsCards contentItems={contentItems} intelItems={intelItems} />

      {/* Two columns: Content + Intel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ContentQueue items={contentItems} onRefresh={loadData} />
        <IntelPanel items={intelItems} />
      </div>
    </div>
  );
}
