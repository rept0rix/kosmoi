import { supabase } from '@/shared/lib/instance';

export const LoggerService = {
    /**
     * Log a user action (e.g., sending a message, clicking a button)
     */
    logUserAction: async (userId, action, details = {}) => {
        return LoggerService.log({
            actor_id: userId || 'anonymous',
            actor_type: 'USER',
            action_type: action,
            content: details,
            timestamp: new Date().toISOString()
        });
    },

    /**
     * Log an agent action (e.g., tool call, thought process)
     */
    logAgentAction: async (agentId, action, details = {}) => {
        return LoggerService.log({
            actor_id: agentId,
            actor_type: 'AGENT',
            action_type: action,
            content: details,
            timestamp: new Date().toISOString()
        });
    },

    /**
     * Log a system/worker event (e.g., loop tick, job started)
     */
    logSystemEvent: async (component, event, details = {}) => {
        return LoggerService.log({
            actor_id: component,
            actor_type: 'SYSTEM',
            action_type: event,
            content: details,
            timestamp: new Date().toISOString()
        });
    },

    /**
     * Core log function - writes to Supabase 'audit_logs' table
     */
    log: async (entry) => {
        try {
            // We assume the table 'audit_logs' exists. 
            // If not, this will fail silently in production but log to console in dev.
            const { error } = await supabase.from('audit_logs').insert([entry]);

            if (error) {
                console.warn("LoggerService: Failed to write to Supabase", error);
                // Fallback: Could log to localStorage or just console
                console.log("[AUDIT LOG]", entry);
            }
        } catch (e) {
            console.error("LoggerService: Critical Error", e);
        }
    }
};
