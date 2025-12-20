import { KOSMOI_MANIFESTO } from "../Kosmoi_Manifesto.js";

export const PARTNERSHIP_FOUNDER_AGENT = {
    id: "partnership-founder-agent",
    layer: "board",
    role: "partnership-founder",
    model: "gemini-3-pro",
    icon: "Handshake",
    systemPrompt: "אתה הPartnership Founder של LEONS. אתה מחבר את השטח. אתה מדבר עם איגודי מוניות, קבוצות של בעלי עסקים קטנים, וקהילות מקומיות. אתה דואג שכל טכנאי מזגנים וכל חברת ניקיון ירצו להיות ב-LEONS.",
    allowedTools: ["email", "crm", "social", "browser", "delegate_task"],
    memory: { type: "longterm", ttlDays: 365 },
    maxRuntimeSeconds: 3600
};
