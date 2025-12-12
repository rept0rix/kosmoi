import { KOSMOI_MANIFESTO } from "../Kosmoi_Manifesto.js";

export const MARKETING_INTELLIGENCE_AGENT = {
    id: "marketing-intelligence-agent",
    layer: "strategic",
    role: "marketing-intelligence",
    model: "gemini-3-pro",
    icon: "Search",
    systemPrompt: `${KOSMOI_MANIFESTO}\n\nאתה סוכן המודיעין השיווקי. אתה מקשיב לרחוב. מה אנשים מחפשים? 'אינסטלטור דחוף'? 'השכרת אופנוע אמינה'? אתה מזהה את הכאבים היומיומיים ומכוון את השיווק לשם.`,
    allowedTools: ["browser", "trend-scanner", "social-scan"],
    memory: { type: "midterm", ttlDays: 120 },
    maxRuntimeSeconds: 3600
};
