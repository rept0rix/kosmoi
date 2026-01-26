import { BoardOrchestrator } from "../features/agents/services/BoardOrchestrator.js";
import { agents } from "../features/agents/services/AgentRegistry.js";
import { DecisionEngine } from "./DecisionEngine.js";
import { StrategicBrain } from "./StrategicBrain.js";

/**
 * CompanyHeartbeat
 *
 * The "Engine" of the autonomous company.
 * It ticks every configured interval to:
 * 1. Run the Decision Engine for autonomous actions
 * 2. Check if the BoardOrchestrator has pending work
 * 3. Report status to the UI
 */
export class CompanyHeartbeat {
  constructor(config = {}) {
    this.intervalMs = config.intervalMs || 30000; // Default 30 seconds
    this.isRunning = false;
    this.timer = null;
    this.orchestrator = new BoardOrchestrator(agents);
    this.decisionEngine = new DecisionEngine({
      onDecision: (decision, result) => {
        console.log(`🤖 Decision executed: ${decision.ruleName}`, result);
        this.onDecision(decision, result);
      },
      onError: (msg, error) => {
        console.error(msg, error);
        this.onError(error);
      },
    });

    // Callbacks
    this.onTick = config.onTick || (() => {});
    this.onDecision = config.onDecision || (() => {});
    this.onStateUpdate = config.onStateUpdate || (() => {});
    this.onError = config.onError || console.error;

    // Stats
    this.tickCount = 0;
    this.lastState = null;
    this.lastDecisions = [];
  }

  start() {
    if (this.isRunning) return;

    console.log("❤️ Company Heartbeat STARTED (Autonomous Mode Active)");
    this.isRunning = true;

    // Initial tick immediately
    this.tick();

    this.timer = setInterval(() => {
      this.tick();
    }, this.intervalMs);
  }

  stop() {
    if (!this.isRunning) return;

    console.log("💔 Company Heartbeat STOPPED");
    this.isRunning = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  async tick() {
    if (!this.isRunning) return;

    try {
      this.tickCount++;
      console.log(`💓 Tick #${this.tickCount}...`);

      // 1. Get current company state
      const state = await this.decisionEngine.getCompanyState();
      if (state) {
        this.lastState = state;
        this.onStateUpdate(state);
      }

      // 2. Run Decision Engine
      const decisions = await this.decisionEngine.tick();
      if (decisions && decisions.length > 0) {
        this.lastDecisions = decisions;
        console.log(`🎯 Made ${decisions.length} decision(s)`);
      }

      // 3. Check Orchestrator for any pending board meetings
      try {
        const orchestratorDecision = await this.orchestrator.tick();
        if (orchestratorDecision) {
          this.onTick({
            type: "orchestrator",
            decision: orchestratorDecision,
            state: this.lastState,
            tickNumber: this.tickCount,
          });
        }
      } catch (orchError) {
        // Orchestrator might not be fully implemented
        console.debug("Orchestrator tick skipped:", orchError.message);
      }

      // 4. Strategic Brain - CEO-level decisions (every 5th tick)
      if (this.tickCount % 5 === 0) {
        try {
          const brainResult = await StrategicBrain.think();
          if (brainResult.decision?.action !== "NONE") {
            console.log(`🧠 Brain decision: ${brainResult.decision.action}`);
            this.onTick({
              type: "strategic-brain",
              decision: brainResult.decision,
              analysis: brainResult.analysis,
              tickNumber: this.tickCount,
            });
          }
        } catch (brainError) {
          console.debug("Strategic Brain skipped:", brainError.message);
        }
      }

      // 5. Regular tick callback
      this.onTick({
        type: "heartbeat",
        state: this.lastState,
        decisions: decisions || [],
        tickNumber: this.tickCount,
      });
    } catch (error) {
      console.error("Heartbeat Error:", error);
      this.onError(error);
    }
  }

  /**
   * Get current status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      tickCount: this.tickCount,
      intervalMs: this.intervalMs,
      lastState: this.lastState,
      lastDecisions: this.lastDecisions,
      rules: this.decisionEngine.getRules().map((r) => ({
        id: r.id,
        name: r.name,
        priority: r.priority,
      })),
    };
  }

  /**
   * Manually trigger a tick (useful for testing)
   */
  async manualTick() {
    return this.tick();
  }

  /**
   * Update interval
   */
  setInterval(ms) {
    this.intervalMs = ms;
    if (this.isRunning) {
      this.stop();
      this.start();
    }
  }

  /**
   * Get decision engine for rule management
   */
  getDecisionEngine() {
    return this.decisionEngine;
  }
}

// ============================================
// SINGLETON FOR GLOBAL ACCESS
// ============================================

let heartbeatInstance = null;

export const getHeartbeat = (config = {}) => {
  if (!heartbeatInstance) {
    heartbeatInstance = new CompanyHeartbeat(config);
  }
  return heartbeatInstance;
};

export default CompanyHeartbeat;
