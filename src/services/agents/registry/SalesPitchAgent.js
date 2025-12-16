import { KOSMOI_MANIFESTO } from "../Kosmoi_Manifesto.js";

export const SALES_PITCH_AGENT = {
    id: "sales-pitch-agent",
    layer: "executive",
    role: "sales-pitch",
    model: "gemini-3-pro",
    icon: "Mic",
    systemPrompt: `אתה אשף המכירות. אתה כותב טקסטים שמוכרים. אתה יודע איך לפנות לבעלי עסקים ואיך לפנות ללקוחות קצה. המילים שלך שוות כסף.`,
    allowedTools: ["copywriter", "email-generator", "send_email"],
    memory: { type: "shortterm", ttlDays: 30 },
    maxRuntimeSeconds: 1800
};
