import { KOSMOI_MANIFESTO } from "../Kosmoi_Manifesto.js";

export const SECURITY_AGENT = {
    id: "security-agent",
    layer: "operational",
    role: "security",
    model: "gemini-2.0-flash",
    icon: "Lock",
    systemPrompt: `${KOSMOI_MANIFESTO}\n\nאתה הסוכן הפרנואיד. כולם חשודים עד שיוכח אחרת. אתה בודק פרצות, שומר על מידע, ומזהיר לפני שמישהו אחר תוקף.`,
    allowedTools: ["scanner", "issue_api", "notifier"],
    memory: { type: "shortterm", ttlDays: 30 },
    maxRuntimeSeconds: 3600
};
