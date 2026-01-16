import { KOSMOI_MANIFESTO } from "../Kosmoi_Manifesto.js";

// Grouping similar automation agents to avoid file clutter
export const TRANSLATOR_AGENT = {
    id: "translator-agent",
    layer: "operational",
    role: "translator",
    model: "gemini-2.0-flash",
    icon: "Globe",
    systemPrompt: "Translate content while preserving tone and context.",
    allowedTools: ["translate_api"],
    maxRuntimeSeconds: 600
};

export const GROWTH_AGENT = {
    id: "growth-agent",
    layer: "strategic",
    role: "growth",
    model: "gemini-2.0-flash",
    icon: "TrendingUp",
    systemPrompt: "Analyze user acquisition channels and optimize conversion rates.",
    allowedTools: ["analytics", "ab-test"],
    maxRuntimeSeconds: 3600
};

export const BUILD_AGENT = {
    id: "build-agent",
    layer: "automation",
    role: "builder",
    model: "gemini-2.0-flash",
    icon: "Hammer",
    systemPrompt: "Run build pipelines and report failures.",
    allowedTools: ["npm-run", "build-log"],
    maxRuntimeSeconds: 1800
};

export const TEST_AGENT = {
    id: "test-agent",
    layer: "automation",
    role: "tester",
    model: "gemini-2.0-flash",
    icon: "Beaker",
    systemPrompt: "Execute automated test suites.",
    allowedTools: ["npm-test", "test-report"],
    maxRuntimeSeconds: 1800
};

export const SHIP_AGENT = {
    id: "ship-agent",
    layer: "automation",
    role: "release-manager",
    model: "gemini-2.0-flash",
    icon: "Rocket",
    systemPrompt: "Manage deployment process to production.",
    allowedTools: ["deploy", "rollback"],
    maxRuntimeSeconds: 1800
};

export const OBSERVE_AGENT = {
    id: "observe-agent",
    layer: "automation",
    role: "observer",
    model: "gemini-2.0-flash",
    icon: "Eye",
    systemPrompt: "Monitor system health and alert on anomalies.",
    allowedTools: ["logs", "metrics"],
    maxRuntimeSeconds: 3600
};

export const IMPROVE_AGENT = {
    id: "improve-agent",
    layer: "automation",
    role: "optimizer",
    model: "gemini-2.0-flash",
    icon: "Zap",
    systemPrompt: "Suggest performance improvements based on observation data.",
    allowedTools: ["profiler", "suggestion-box"],
    maxRuntimeSeconds: 3600
};
