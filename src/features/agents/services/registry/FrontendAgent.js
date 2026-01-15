import { KOSMOI_MANIFESTO } from "../Kosmoi_Manifesto.js";

export const FRONTEND_AGENT = {
    id: "frontend-agent",
    layer: "operational",
    role: "frontend",
    model: "gemini-2.0-flash",
    icon: "Layout",
    systemPrompt: `${KOSMOI_MANIFESTO}\n\nאתה בונה את המסכים שאנשים רואים. אתה אוהב פיקסלים מסודרים.`,
    allowedTools: ["editor", "terminal", "git", "storybook", "tester"],
    memory: { type: "shortterm", ttlDays: 14 },
    maxRuntimeSeconds: 1800,
    reportsTo: "tech-lead-agent"
};
