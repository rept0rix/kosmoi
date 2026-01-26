/**
 * STRATEGIC BRAIN
 *
 * The CEO Agent - analyzes the business and decides what to do next.
 * Runs autonomously and takes action without human input.
 *
 * Every 30 minutes it:
 * 1. Analyzes all metrics (MRR, churn, leads, support)
 * 2. Identifies the biggest opportunity or problem
 * 3. Decides what action to take
 * 4. Executes it
 * 5. Logs the decision
 */

import { supabase } from "../api/supabaseClient.js";
import { MetricsService } from "./MetricsService.js";

// Priority thresholds
const THRESHOLDS = {
  HIGH_CHURN: 5, // % churn rate that's alarming
  LOW_CONVERSION: 10, // % conversion rate that needs work
  STALE_LEADS: 48, // hours before lead is "stale"
  URGENT_TICKETS: 2, // hours before escalation
  FAILED_PAYMENTS: 1, // any failed payment is urgent
};

// Action priority (higher = more important)
const PRIORITIES = {
  PAYMENT_RECOVERY: 100, // Money first
  URGENT_SUPPORT: 90, // Unhappy customers
  STALE_LEADS: 70, // Potential money
  HIGH_CHURN: 60, // Losing customers
  LOW_CONVERSION: 50, // Not converting
  OUTREACH: 30, // Growth opportunity
  SYSTEM_HEALTH: 20, // Technical issues
};

export const StrategicBrain = {
  /**
   * Run the brain - analyze and act
   */
  think: async () => {
    console.log("🧠 Strategic Brain thinking...");

    const analysis = await StrategicBrain.analyze();
    const decision = await StrategicBrain.decide(analysis);

    if (decision.action !== "NONE") {
      await StrategicBrain.execute(decision);
    }

    return { analysis, decision };
  },

  /**
   * Analyze current state
   */
  analyze: async () => {
    const metrics = await MetricsService.getAll();
    const issues = [];

    // Check for failed payments
    const { data: failedPayments } = await supabase
      .from("payment_recovery_attempts")
      .select("*")
      .eq("status", "pending");

    if (failedPayments?.length > 0) {
      issues.push({
        type: "PAYMENT_RECOVERY",
        priority: PRIORITIES.PAYMENT_RECOVERY,
        count: failedPayments.length,
        message: `${failedPayments.length} failed payment(s) need recovery`,
      });
    }

    // Check for urgent support tickets
    const { data: urgentTickets } = await supabase
      .from("support_tickets")
      .select("*")
      .eq("priority", "urgent")
      .eq("status", "open");

    if (urgentTickets?.length > 0) {
      issues.push({
        type: "URGENT_SUPPORT",
        priority: PRIORITIES.URGENT_SUPPORT,
        count: urgentTickets.length,
        message: `${urgentTickets.length} urgent support ticket(s)`,
      });
    }

    // Check for stale leads
    const staleTime = new Date(
      Date.now() - THRESHOLDS.STALE_LEADS * 60 * 60 * 1000,
    );
    const { data: staleLeads } = await supabase
      .from("leads")
      .select("*")
      .eq("status", "new")
      .lt("created_at", staleTime.toISOString());

    if (staleLeads?.length > 0) {
      issues.push({
        type: "STALE_LEADS",
        priority: PRIORITIES.STALE_LEADS,
        count: staleLeads.length,
        message: `${staleLeads.length} lead(s) untouched for 48+ hours`,
      });
    }

    // Check churn rate
    if (parseFloat(metrics.churn?.churnRate || 0) > THRESHOLDS.HIGH_CHURN) {
      issues.push({
        type: "HIGH_CHURN",
        priority: PRIORITIES.HIGH_CHURN,
        value: metrics.churn.churnRate,
        message: `High churn rate: ${metrics.churn.churnRate}%`,
      });
    }

    // Check conversion rate
    if (
      parseFloat(metrics.funnel?.conversionRate || 0) <
      THRESHOLDS.LOW_CONVERSION
    ) {
      issues.push({
        type: "LOW_CONVERSION",
        priority: PRIORITIES.LOW_CONVERSION,
        value: metrics.funnel.conversionRate,
        message: `Low conversion: ${metrics.funnel.conversionRate}%`,
      });
    }

    // Check for new businesses to outreach
    const { data: newBusinesses } = await supabase
      .from("service_providers")
      .select("id")
      .is("status", null)
      .limit(10);

    if (newBusinesses?.length > 0) {
      issues.push({
        type: "OUTREACH",
        priority: PRIORITIES.OUTREACH,
        count: newBusinesses.length,
        message: `${newBusinesses.length} business(es) ready for outreach`,
      });
    }

    // Sort by priority
    issues.sort((a, b) => b.priority - a.priority);

    return {
      metrics,
      issues,
      timestamp: new Date().toISOString(),
    };
  },

  /**
   * Decide what action to take
   */
  decide: async (analysis) => {
    if (analysis.issues.length === 0) {
      return {
        action: "NONE",
        reason: "All systems nominal. No action needed.",
        priority: 0,
      };
    }

    const topIssue = analysis.issues[0];

    const actionMap = {
      PAYMENT_RECOVERY: {
        action: "TRIGGER_PAYMENT_RECOVERY",
        endpoint: "payment-recovery",
        payload: { action: "PROCESS_SCHEDULED" },
      },
      URGENT_SUPPORT: {
        action: "ESCALATE_SUPPORT",
        endpoint: "support-router",
        payload: { action: "ESCALATE_ALL_URGENT" },
      },
      STALE_LEADS: {
        action: "FOLLOW_UP_LEADS",
        endpoint: "retention-agent",
        payload: { action: "PROCESS_STALE_LEADS" },
      },
      OUTREACH: {
        action: "START_OUTREACH",
        endpoint: "sales-outreach",
        payload: { action: "PROCESS_FOLLOWUPS" },
      },
      HIGH_CHURN: {
        action: "ANALYZE_CHURN",
        endpoint: null,
        payload: null,
      },
      LOW_CONVERSION: {
        action: "OPTIMIZE_CONVERSION",
        endpoint: null,
        payload: null,
      },
    };

    const decision = actionMap[topIssue.type] || {
      action: "INVESTIGATE",
      endpoint: null,
    };

    return {
      ...decision,
      issue: topIssue,
      reason: topIssue.message,
      priority: topIssue.priority,
      timestamp: new Date().toISOString(),
    };
  },

  /**
   * Execute the decision
   */
  execute: async (decision) => {
    console.log(`🧠 Executing: ${decision.action}`);

    let result = { success: false, message: "" };

    // If there's an endpoint, call it
    if (decision.endpoint) {
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

        const response = await fetch(
          `${supabaseUrl}/functions/v1/${decision.endpoint}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${supabaseKey}`,
            },
            body: JSON.stringify(decision.payload),
          },
        );

        const data = await response.json();
        result = { success: true, data };
      } catch (error) {
        result = { success: false, error: error.message };
      }
    } else {
      // Internal analysis actions
      result = { success: true, message: "Analysis logged for review" };
    }

    // Log the decision
    await supabase.from("agent_decisions").insert({
      agent_id: "strategic-brain",
      decision_type: decision.action,
      context: { issue: decision.issue },
      action: decision,
      result: result,
      success: result.success,
    });

    return result;
  },

  /**
   * Get the brain's activity log
   */
  getActivityLog: async (limit = 20) => {
    const { data } = await supabase
      .from("agent_decisions")
      .select("*")
      .eq("agent_id", "strategic-brain")
      .order("created_at", { ascending: false })
      .limit(limit);

    return data || [];
  },

  /**
   * Start auto-thinking (runs every 30 minutes)
   */
  startAutoThinking: (intervalMs = 30 * 60 * 1000) => {
    console.log("🧠 Strategic Brain: Auto-thinking enabled");

    // Think immediately
    StrategicBrain.think();

    // Then think on interval
    return setInterval(() => {
      StrategicBrain.think();
    }, intervalMs);
  },
};

export default StrategicBrain;
