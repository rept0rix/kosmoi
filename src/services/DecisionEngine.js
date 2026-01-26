/**
 * DECISION ENGINE
 *
 * The autonomous brain of Kosmoi. This engine:
 * 1. OBSERVES the current state of the company
 * 2. DECIDES what actions to take based on rules
 * 3. EXECUTES actions via Edge Functions
 * 4. LEARNS from results (logs for future analysis)
 *
 * This is a rule-based system that can be expanded to ML-powered decisions.
 */

import { supabase } from "@/api/supabaseClient";

// ============================================
// DECISION RULES
// ============================================

/**
 * Decision rules define when and what actions to take.
 * Each rule has:
 * - id: Unique identifier
 * - name: Human-readable name
 * - condition: Function that returns true if rule should fire
 * - action: The action to execute
 * - priority: Higher priority rules run first
 * - cooldown: Minimum time between executions (minutes)
 */
const DEFAULT_RULES = [
  {
    id: "hot_leads_batch_email",
    name: "Hot Leads Batch Email",
    description: "When we have 20+ hot leads, send batch follow-up emails",
    condition: (state) => state.hotLeads >= 20,
    action: {
      type: "SEND_BATCH_EMAILS",
      agent: "CRM_SALES_AGENT",
      params: { maxLeads: 20 },
    },
    priority: 10,
    cooldown: 60 * 24, // Once per day
  },
  {
    id: "low_mrr_marketing",
    name: "Low MRR Marketing Campaign",
    description: "When MRR is below target, increase marketing",
    condition: (state) => state.mrr < state.targetMrr * 0.8,
    action: {
      type: "START_MARKETING_CAMPAIGN",
      agent: "CMO_AGENT",
      params: { budget: 500 },
    },
    priority: 8,
    cooldown: 60 * 24 * 7, // Once per week
  },
  {
    id: "trial_conversion_optimization",
    name: "Trial Conversion Optimization",
    description:
      "When trial conversion rate drops below 20%, optimize onboarding",
    condition: (state) =>
      state.trialConversionRate < 0.2 && state.totalTrials > 10,
    action: {
      type: "OPTIMIZE_ONBOARDING",
      agent: "PRODUCT_VISION_AGENT",
      params: {},
    },
    priority: 7,
    cooldown: 60 * 24 * 3, // Every 3 days
  },
  {
    id: "no_leads_scout",
    name: "No Leads Scout Activation",
    description: "When no new leads in 3 days, activate scout",
    condition: (state) => state.daysSinceLastLead >= 3,
    action: {
      type: "ACTIVATE_SCOUT",
      agent: "SALES_SCOUT",
      params: { aggressive: true },
    },
    priority: 9,
    cooldown: 60 * 12, // Every 12 hours
  },
  {
    id: "pending_leads_alert",
    name: "Pending Leads Alert",
    description: "When leads are pending for too long, send reminder",
    condition: (state) => state.pendingLeads > 10,
    action: {
      type: "SEND_PENDING_REMINDER",
      agent: "PROJECT_MANAGER_AGENT",
      params: {},
    },
    priority: 6,
    cooldown: 60 * 4, // Every 4 hours
  },
];

// ============================================
// DECISION ENGINE CLASS
// ============================================

export class DecisionEngine {
  constructor(options = {}) {
    this.rules = options.rules || DEFAULT_RULES;
    this.isRunning = false;
    this.lastDecisions = new Map(); // Track cooldowns
    this.onDecision = options.onDecision || (() => {});
    this.onError = options.onError || console.error;
  }

  /**
   * Get the current state of the company
   */
  async getCompanyState() {
    try {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

      // Parallel queries for performance
      const [
        usersResult,
        businessesResult,
        leadsResult,
        subscriptionsResult,
        recentLeadsResult,
      ] = await Promise.all([
        supabase.from("users").select("*", { count: "exact", head: true }),
        supabase
          .from("service_providers")
          .select("*", { count: "exact", head: true }),
        supabase.from("leads").select("*"),
        supabase.from("subscriptions").select("*"),
        supabase
          .from("leads")
          .select("created_at")
          .order("created_at", { ascending: false })
          .limit(1),
      ]);

      // Calculate metrics
      const leads = leadsResult.data || [];
      const subscriptions = subscriptionsResult.data || [];

      const hotLeads = leads.filter((l) => l.status === "hot").length;
      const pendingLeads = leads.filter(
        (l) => l.status === "pending" || l.status === "new",
      ).length;

      const mrr = subscriptions
        .filter((s) => s.status === "active")
        .reduce((sum, s) => sum + (s.amount || 0), 0);

      const trials = subscriptions.filter((s) => s.status === "trial");
      const activeSubscriptions = subscriptions.filter(
        (s) => s.status === "active",
      );
      const trialConversionRate =
        trials.length > 0
          ? activeSubscriptions.length /
            (trials.length + activeSubscriptions.length)
          : 0;

      // Days since last lead
      const lastLead = recentLeadsResult.data?.[0];
      const daysSinceLastLead = lastLead
        ? Math.floor(
            (now.getTime() - new Date(lastLead.created_at).getTime()) /
              (24 * 60 * 60 * 1000),
          )
        : 999;

      return {
        // Counts
        totalUsers: usersResult.count || 0,
        totalBusinesses: businessesResult.count || 0,
        totalLeads: leads.length,
        hotLeads,
        pendingLeads,

        // Subscriptions
        totalTrials: trials.length,
        activeSubscriptions: activeSubscriptions.length,
        trialConversionRate,

        // Revenue
        mrr,
        targetMrr: 50000, // THB - configurable

        // Activity
        daysSinceLastLead,

        // Meta
        timestamp: now.toISOString(),
        collectedAt: now.getTime(),
      };
    } catch (error) {
      this.onError("Failed to get company state:", error);
      return null;
    }
  }

  /**
   * Evaluate rules and return decisions
   */
  async evaluate() {
    const state = await this.getCompanyState();
    if (!state) return [];

    const decisions = [];
    const now = Date.now();

    // Sort rules by priority (highest first)
    const sortedRules = [...this.rules].sort((a, b) => b.priority - a.priority);

    for (const rule of sortedRules) {
      try {
        // Check cooldown
        const lastRun = this.lastDecisions.get(rule.id);
        if (lastRun && now - lastRun < rule.cooldown * 60 * 1000) {
          continue; // Still in cooldown
        }

        // Evaluate condition
        if (rule.condition(state)) {
          decisions.push({
            ruleId: rule.id,
            ruleName: rule.name,
            action: rule.action,
            state: {
              hotLeads: state.hotLeads,
              mrr: state.mrr,
              pendingLeads: state.pendingLeads,
            },
            timestamp: new Date().toISOString(),
          });

          // Mark as executed
          this.lastDecisions.set(rule.id, now);
        }
      } catch (error) {
        this.onError(`Rule ${rule.id} evaluation failed:`, error);
      }
    }

    return decisions;
  }

  /**
   * Execute a decision by calling the appropriate Edge Function
   */
  async executeDecision(decision) {
    try {
      console.log(`🤖 Executing decision: ${decision.ruleName}`);

      // Call agent-worker Edge Function
      const { data, error } = await supabase.functions.invoke("agent-worker", {
        body: {
          type: "DECISION_ENGINE",
          action: decision.action,
          context: decision.state,
        },
      });

      if (error) throw error;

      // Log the decision
      await this.logDecision(decision, data, true);

      return { success: true, data };
    } catch (error) {
      console.error(`Decision execution failed:`, error);
      await this.logDecision(decision, { error: error.message }, false);
      return { success: false, error };
    }
  }

  /**
   * Log decision to database for analytics
   */
  async logDecision(decision, result, success) {
    try {
      await supabase.from("agent_decisions").insert({
        agent_id: decision.action.agent || "decision-engine",
        decision_type: decision.ruleId,
        context: decision.state,
        action: decision.action,
        result: result,
        success: success,
      });
    } catch (error) {
      console.error("Failed to log decision:", error);
    }
  }

  /**
   * Run a single tick of the decision engine
   */
  async tick() {
    if (this.isRunning) return;

    this.isRunning = true;
    try {
      const decisions = await this.evaluate();

      for (const decision of decisions) {
        const result = await this.executeDecision(decision);
        this.onDecision(decision, result);
      }

      return decisions;
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Get current rules
   */
  getRules() {
    return this.rules;
  }

  /**
   * Add a new rule
   */
  addRule(rule) {
    this.rules.push(rule);
  }

  /**
   * Remove a rule by ID
   */
  removeRule(ruleId) {
    this.rules = this.rules.filter((r) => r.id !== ruleId);
  }

  /**
   * Update a rule
   */
  updateRule(ruleId, updates) {
    const index = this.rules.findIndex((r) => r.id === ruleId);
    if (index !== -1) {
      this.rules[index] = { ...this.rules[index], ...updates };
    }
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

let engineInstance = null;

export const getDecisionEngine = (options = {}) => {
  if (!engineInstance) {
    engineInstance = new DecisionEngine(options);
  }
  return engineInstance;
};

export default DecisionEngine;
