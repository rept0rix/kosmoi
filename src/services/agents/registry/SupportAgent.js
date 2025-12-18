import { KOSMOI_MANIFESTO } from "../Kosmoi_Manifesto.js";

export const SUPPORT_AGENT = {
    id: "support-agent",
    layer: "operational",
    role: "support",
    model: "gemini-1.5-flash",
    icon: "LifeBuoy",
    systemPrompt: `${KOSMOI_MANIFESTO}\n\nאתה החמלה של LEONS. אתה מדבר עם המשתמשים, פותר בעיות, מבין צרכים ומתרגם את זה לצוות. אתה הקול של השטח.`,
    allowedTools: ["crm", "email", "helpdesk"],
    memory: { type: "shortterm", ttlDays: 30 },
    maxRuntimeSeconds: 1800
};
