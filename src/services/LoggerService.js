import { supabase } from "../shared/lib/instance";

export const LoggerService = {
  /**
   * Log a user action (e.g., sending a message, clicking a button)
   */
  logUserAction: async (userId, action, details = {}) => {
    return LoggerService.log({
      actor_id: userId || "anonymous",
      actor_type: "USER",
      action_type: action,
      content: details,
      timestamp: new Date().toISOString(),
    });
  },

  /**
   * Log an agent action (e.g., tool call, thought process)
   */
  logAgentAction: async (agentId, action, details = {}) => {
    return LoggerService.log({
      actor_id: agentId,
      actor_type: "AGENT",
      action_type: action,
      content: details,
      timestamp: new Date().toISOString(),
    });
  },

  /**
   * Log a system/worker event (e.g., loop tick, job started)
   */
  logSystemEvent: async (component, event, details = {}) => {
    return LoggerService.log({
      actor_id: component,
      actor_type: "SYSTEM",
      action_type: event,
      content: details,
      timestamp: new Date().toISOString(),
    });
  },

  /**
   * Core log function - writes to Supabase 'agent_logs' table
   */
  log: async (entry) => {
    try {
      // Map internal log format to DB schema (agent_logs)
      // Schema: id, agent_id, level, message, metadata, created_at

      const level =
        entry.action_type === "ERROR"
          ? "error"
          : entry.action_type === "WARNING"
            ? "warning"
            : "info";

      const dbEntry = {
        agent_id: entry.actor_id, // Map actor (SYSTEM/USER/AGENT) to agent_id column
        level: level,
        message: `${entry.actor_type}: ${entry.action_type}`, // e.g. "SYSTEM: STARTUP"
        metadata: entry.content || {},
        // created_at is default now()
      };

      const { error } = await supabase.from("agent_logs").insert([dbEntry]);

      if (error) {
        console.warn("LoggerService: Failed to write to Supabase", error);
        // Fallback: Could log to localStorage or just console
        console.log("[AUDIT LOG]", entry);
      }
    } catch (e) {
      console.error("LoggerService: Critical Error", e);
    }
  },
};
