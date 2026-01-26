/**
 * METRICS SERVICE
 *
 * Unified service for all company metrics.
 * Powers the Health Dashboard.
 */

import { supabase } from "../api/supabaseClient.js";

export const MetricsService = {
  /**
   * Get Monthly Recurring Revenue
   */
  getMRR: async () => {
    const { data, error } = await supabase
      .from("subscriptions")
      .select("amount")
      .eq("status", "active");

    if (error) return { mrr: 0, count: 0, error };

    const mrr = (data || []).reduce((sum, s) => sum + (s.amount || 0), 0);
    return { mrr, count: data?.length || 0, error: null };
  },

  /**
   * Get trial conversion funnel
   */
  getTrialFunnel: async () => {
    const { data, error } = await supabase
      .from("subscriptions")
      .select("status");

    if (error) return { funnel: {}, error };

    const funnel = (data || []).reduce((acc, s) => {
      acc[s.status] = (acc[s.status] || 0) + 1;
      return acc;
    }, {});

    const total = data?.length || 0;
    const active = funnel["active"] || 0;
    const conversionRate = total > 0 ? ((active / total) * 100).toFixed(1) : 0;

    return { funnel, total, active, conversionRate, error: null };
  },

  /**
   * Get lead pipeline
   */
  getLeadPipeline: async () => {
    const { data, error } = await supabase.from("leads").select("status");

    if (error) return { pipeline: {}, error };

    const pipeline = (data || []).reduce((acc, l) => {
      const status = l.status || "new";
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    return { pipeline, total: data?.length || 0, error: null };
  },

  /**
   * Get churn rate (last 30 days)
   */
  getChurnRate: async (days = 30) => {
    const since = new Date(
      Date.now() - days * 24 * 60 * 60 * 1000,
    ).toISOString();

    const { data: cancelled } = await supabase
      .from("subscriptions")
      .select("id")
      .eq("status", "cancelled")
      .gte("updated_at", since);

    const { data: total } = await supabase.from("subscriptions").select("id");

    const cancelledCount = cancelled?.length || 0;
    const totalCount = total?.length || 0;
    const churnRate =
      totalCount > 0 ? ((cancelledCount / totalCount) * 100).toFixed(1) : 0;

    return {
      cancelled: cancelledCount,
      total: totalCount,
      churnRate,
      period: days,
    };
  },

  /**
   * Get agent activity (today)
   */
  getAgentActivity: async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from("agent_decisions")
      .select("agent_id, decision_type, success")
      .gte("created_at", today.toISOString());

    if (error) return { activity: {}, total: 0, error };

    const byAgent = (data || []).reduce((acc, d) => {
      if (!acc[d.agent_id]) {
        acc[d.agent_id] = { total: 0, success: 0, failed: 0 };
      }
      acc[d.agent_id].total++;
      d.success ? acc[d.agent_id].success++ : acc[d.agent_id].failed++;
      return acc;
    }, {});

    return { byAgent, total: data?.length || 0, error: null };
  },

  /**
   * Get system health
   */
  getSystemHealth: async () => {
    const checks = {
      database: false,
      realtime: false,
      functions: false,
    };

    // Check database
    try {
      const { error } = await supabase.from("users").select("id").limit(1);
      checks.database = !error;
    } catch (e) {
      checks.database = false;
    }

    // Realtime is checked client-side
    checks.realtime = true;

    // Functions assumed healthy if we got here
    checks.functions = true;

    const allHealthy = Object.values(checks).every((v) => v);

    return { checks, healthy: allHealthy };
  },

  /**
   * Get all metrics at once
   */
  getAll: async () => {
    const [mrr, funnel, pipeline, churn, agents, health] = await Promise.all([
      MetricsService.getMRR(),
      MetricsService.getTrialFunnel(),
      MetricsService.getLeadPipeline(),
      MetricsService.getChurnRate(),
      MetricsService.getAgentActivity(),
      MetricsService.getSystemHealth(),
    ]);

    return {
      mrr,
      funnel,
      pipeline,
      churn,
      agents,
      health,
      timestamp: new Date().toISOString(),
    };
  },
};

export default MetricsService;
