import { db } from "../../api/supabaseClient.js";

// Import Agents from Registry
import { UX_DESIGNER_AGENT } from "./UXDesignerAgent.js";
import { SUPABASE_SPECIALIST_AGENT } from "./SupabaseSpecialist.js";
import { GITHUB_SPECIALIST_AGENT } from "./registry/GitHubSpecialist.js";
import { QA_SPECIALIST_AGENT } from "./registry/QASpecialist.js";

import { BOARD_CHAIRMAN_AGENT } from "./registry/BoardChairmanAgent.js";
import { HUMAN_USER_AGENT } from "./registry/HumanUserAgent.js";
import { WORKER_NODE_AGENT } from "./registry/WorkerNodeAgent.js";
import { VISION_FOUNDER_AGENT } from "./registry/VisionFounderAgent.js";
import { BUSINESS_FOUNDER_AGENT } from "./registry/BusinessFounderAgent.js";
import { PRODUCT_FOUNDER_AGENT } from "./registry/ProductFounderAgent.js";
import { PARTNERSHIP_FOUNDER_AGENT } from "./registry/PartnershipFounderAgent.js";

import { CEO_AGENT } from "./registry/CeoAgent.js";
import { CTO_AGENT } from "./registry/CtoAgent.js";
import { TECH_LEAD_AGENT } from "./registry/TechLeadAgent.js";
import { HR_AGENT } from "./registry/HrAgent.js";
import { CMO_AGENT } from "./registry/CmoAgent.js";
import { CFO_AGENT } from "./registry/CfoAgent.js";
import { CRO_AGENT } from "./registry/CroAgent.js";
import { PROJECT_MANAGER_AGENT } from "./registry/ProjectManagerAgent.js";

import { MARKETING_INTELLIGENCE_AGENT } from "./registry/MarketingIntelligenceAgent.js";
import { FINANCE_CAPITAL_AGENT } from "./registry/FinanceCapitalAgent.js";
import { LEGAL_SHIELD_AGENT } from "./registry/LegalShieldAgent.js";
import { COMPETITIVE_RADAR_AGENT } from "./registry/CompetitiveRadarAgent.js";
import { INNOVATION_RESEARCHER_AGENT } from "./registry/InnovationResearcherAgent.js";

import { FRONTEND_AGENT } from "./registry/FrontendAgent.js";
import { BACKEND_AGENT } from "./registry/BackendAgent.js";
import { GRAPHIC_DESIGNER_AGENT } from "./registry/GraphicDesignerAgent.js";
import { UI_AGENT } from "./registry/UiAgent.js";
import { UX_AGENT } from "./registry/UxAgent.js";
import { QA_AGENT } from "./registry/QaAgent.js";
import { SECURITY_AGENT } from "./registry/SecurityAgent.js";
import { CONTENT_AGENT } from "./registry/ContentAgent.js";
import { CONCIERGE_AGENT } from "./registry/ConciergeAgent.js";
import { SUPPORT_AGENT } from "./registry/SupportAgent.js";
import { BOOKING_AGENT } from "./registry/BookingAgent.js";
import { SALES_PITCH_AGENT } from "./registry/SalesPitchAgent.js";
import { VECTOR_SEARCH_AGENT } from "./registry/VectorSearchAgent.js";
import { CODE_REFACTOR_AGENT } from "./registry/CodeRefactorAgent.js";
import { PRODUCT_VISION_AGENT } from "./registry/ProductVisionAgent.js";

import { SYSTEM_MAPPING_AGENT } from "./registry/SystemMappingAgent.js";
import { UI_UX_DOCS_AGENT } from "./registry/UiUxDocsAgent.js";
import { REQUIREMENTS_AGENT } from "./registry/RequirementsAgent.js";
import { ONBOARDING_AGENT } from "./registry/OnboardingAgent.js";
import { CONSISTENCY_AUDITOR_AGENT } from "./registry/ConsistencyAuditorAgent.js";

import {
    TRANSLATOR_AGENT, GROWTH_AGENT, BUILD_AGENT, TEST_AGENT,
    SHIP_AGENT, OBSERVE_AGENT, IMPROVE_AGENT
} from "./registry/AutomationAgents.js";
import { OPTIMIZER_AGENT } from "./registry/OptimizerAgent.js";

/**
 * The Central Registry of All Agents
 */
export const agents = [
    // --- SPECIALIST AGENTS ---
    UX_DESIGNER_AGENT,
    SUPABASE_SPECIALIST_AGENT,
    GITHUB_SPECIALIST_AGENT,
    QA_SPECIALIST_AGENT,

    // --- BOARD LAYER ---
    BOARD_CHAIRMAN_AGENT,
    HUMAN_USER_AGENT,
    WORKER_NODE_AGENT,
    VISION_FOUNDER_AGENT,
    BUSINESS_FOUNDER_AGENT,
    PRODUCT_FOUNDER_AGENT,
    PARTNERSHIP_FOUNDER_AGENT,

    // --- EXECUTIVE LAYER ---
    CEO_AGENT,
    CTO_AGENT,
    TECH_LEAD_AGENT,
    HR_AGENT,
    CMO_AGENT,
    CFO_AGENT,
    CRO_AGENT,
    PROJECT_MANAGER_AGENT,

    // --- STRATEGIC LAYER ---
    MARKETING_INTELLIGENCE_AGENT,
    FINANCE_CAPITAL_AGENT,
    LEGAL_SHIELD_AGENT,
    COMPETITIVE_RADAR_AGENT,
    INNOVATION_RESEARCHER_AGENT,
    PRODUCT_VISION_AGENT,

    // --- OPERATIONAL LAYER ---
    FRONTEND_AGENT,
    BACKEND_AGENT,
    GRAPHIC_DESIGNER_AGENT,
    UI_AGENT,
    UX_AGENT,
    QA_AGENT,
    SECURITY_AGENT,
    CONTENT_AGENT,
    CONCIERGE_AGENT,
    SUPPORT_AGENT,
    BOOKING_AGENT,
    SALES_PITCH_AGENT,
    VECTOR_SEARCH_AGENT,
    CODE_REFACTOR_AGENT,

    // --- DOCUMENTATION LAYER ---
    SYSTEM_MAPPING_AGENT,
    UI_UX_DOCS_AGENT,
    REQUIREMENTS_AGENT,
    ONBOARDING_AGENT,
    CONSISTENCY_AUDITOR_AGENT,

    // --- AUTOMATION LAYER ---
    TRANSLATOR_AGENT,
    GROWTH_AGENT,
    BUILD_AGENT,
    TEST_AGENT,
    SHIP_AGENT,
    OBSERVE_AGENT,
    IMPROVE_AGENT,
    OPTIMIZER_AGENT
];

// Helper to get agent by ID
export const getAgentById = (id) => {
    return agents.find(agent => agent.id === id);
};

// Sync agents with database (System Prompts)
export const syncAgentsWithDatabase = async () => {
    console.log("Syncing agents with database...");

    try {
        const updates = agents.map(agent => ({
            id: agent.id,
            name: agent.name || agent.role, // Fallback if name missing
            role: agent.role,
            system_prompt: agent.systemPrompt,
            icon: agent.icon,
            metadata: {
                layer: agent.layer,
                model: agent.model,
                tools: agent.allowedTools
            }
        }));

        // Upsert logic would go here if we were writing to DB
        // For now we just update the specific table we know about
        for (const agent of agents) {
            const { error } = await db.entities.AgentConfigs.upsert({
                agent_id: agent.id,
                system_prompt: agent.systemPrompt
            });

            if (error) console.error(`Failed to sync agent ${agent.id}:`, error);
        }
        console.log("Agent sync complete.");
    } catch (err) {
        console.error("Error syncing agents:", err);
    }
};

// Load dynamic prompts from database (The Plastic Brain)
export const loadDynamicPrompts = async () => {
    console.log("Loading dynamic prompts from database...");
    try {
        const { data, error } = await db.entities.AgentConfigs.select('*');
        if (error) throw error;

        let updateCount = 0;
        if (data) {
            data.forEach(config => {
                const agent = agents.find(a => a.id === config.agent_id);
                if (agent && config.system_prompt) {
                    // OVERRIDE: Update the in-memory agent object
                    if (agent.systemPrompt !== config.system_prompt) {
                        agent.systemPrompt = config.system_prompt;
                        console.log(`🧠 Neuro-Plasticity: Updated prompt for ${agent.name}`);
                        updateCount++;
                    }
                }
            });
        }
        console.log(`Dynamic prompt loading complete. ${updateCount} agents updated.`);
        return updateCount;
    } catch (err) {
        console.error("Error loading dynamic prompts:", err);
        return 0;
    }
};

/**
 * Groups agents by their 'layer' property.
 * @returns {Record<string, Array>}
 */
export const groupAgentsByLayer = () => {
    return agents.reduce((acc, agent) => {
        const layer = agent.layer || 'Other';
        if (!acc[layer]) {
            acc[layer] = [];
        }
        acc[layer].push(agent);
        return acc;
    }, {});
};
