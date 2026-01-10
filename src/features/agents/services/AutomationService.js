import { supabase } from "@/api/supabaseClient";
import { AgentRunner } from "./AgentRunner";
import { CRM_SALES_AGENT } from "./registry/CRMSalesAgent";
import { MARKETING_AGENT } from "./registry/MarketingAgent";
import { ANALYTICS_AGENT } from "./registry/AnalyticsAgent";

// Simple Observer Pattern for Simulation UI
const listeners = [];

export const AutomationService = {
    // --- STATE ---
    isRunning: false,
    isRealtime: false,
    subscription: null,
    logs: [],

    // --- INIT ---
    initRealtime: () => {
        if (AutomationService.subscription) return;

        console.log("[AutomationService] Subscribing to Realtime...");
        AutomationService.subscription = supabase
            .channel('agent-triggers')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'crm_leads' },
                (payload) => {
                    console.log('[AutomationService] Realtime Event:', payload);
                    AutomationService.triggerNewLead(payload.new);
                }
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    AutomationService.isRealtime = true;
                    AutomationService.log('INFO', 'Realtime Connection Established (Hearing crm_leads)');
                }
            });
    },

    stopRealtime: () => {
        if (AutomationService.subscription) {
            supabase.removeChannel(AutomationService.subscription);
            AutomationService.subscription = null;
            AutomationService.isRealtime = false;
        }
    },

    // --- EVENT TRIGGERS ---

    /**
     * Simulate a "New Lead" Event
     * Triggers Sales Agent
     */
    triggerNewLead: async (lead) => {
        const logEntry = AutomationService.log("EVENT", "New Lead Detected", lead);

        try {
            AutomationService.log("INFO", "Waking up Sales Agent...", null, logEntry.id);

            // Context preparation
            const context = {
                lead: lead,
                niche: lead.business_type // For personalization
            };

            // Run Agent
            // In a real event system, this would be a queue.
            const result = await AgentRunner.run(CRM_SALES_AGENT, "Draft a personalized welcome email for this new lead.", context);

            AutomationService.log("SUCCESS", "Sales Agent Task Complete", result, logEntry.id);
        } catch (error) {
            AutomationService.log("ERROR", "Sales Agent Failed", error.message, logEntry.id);
        }
    },

    // --- SCHEDULE TRIGGERS ---

    /**
     * Simulate "Morning Routine" (e.g. 9:00 AM)
     * Triggers Marketing Agent
     */
    triggerMorningRoutine: async () => {
        const logEntry = AutomationService.log("SCHEDULE", "09:00 AM - Morning Briefing");

        try {
            AutomationService.log("INFO", "Waking up Marketing Agent (Dave)...", null, logEntry.id);

            const context = { niche: "General" };
            const result = await AgentRunner.run(MARKETING_AGENT, "Check trends and generate a daily post.", context);

            AutomationService.log("SUCCESS", "Dave Published Content", result, logEntry.id);
        } catch (error) {
            AutomationService.log("ERROR", "Dave Failed", error.message, logEntry.id);
        }
    },

    /**
     * Simulate "Weekly Report" (e.g. Friday 5:00 PM)
     * Triggers Analytics Agent
     */
    triggerWeeklyReport: async () => {
        const logEntry = AutomationService.log("SCHEDULE", "Friday 17:00 - Weekly Audit");

        try {
            AutomationService.log("INFO", "Waking up Analytics Agent (Lara)...", null, logEntry.id);

            const context = { period: "weekly" };
            const result = await AgentRunner.run(ANALYTICS_AGENT, "Analyze platform performance.", context);

            AutomationService.log("SUCCESS", "Lara Generated Report", result, logEntry.id);
        } catch (error) {
            AutomationService.log("ERROR", "Lara Failed", error.message, logEntry.id);
        }
    },

    // --- UTILS ---

    log: (type, message, data = null, parentId = null) => {
        const entry = {
            id: Date.now() + Math.random(),
            timestamp: new Date().toISOString(),
            type,
            message,
            data,
            parentId
        };
        AutomationService.logs.unshift(entry); // Newest first
        notifyListeners();
        return entry;
    },

    getLogs: () => {
        return AutomationService.logs;
    },

    clearLogs: () => {
        AutomationService.logs = [];
        notifyListeners();
    },

    subscribe: (callback) => {
        listeners.push(callback);
        return () => {
            const index = listeners.indexOf(callback);
            if (index > -1) listeners.splice(index, 1);
        };
    }
};

function notifyListeners() {
    listeners.forEach(cb => cb(AutomationService.logs));
}
