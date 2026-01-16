import { KOSMOI_MANIFESTO } from "../Kosmoi_Manifesto.js";

export const LEGAL_SHIELD_AGENT = {
    id: "legal-shield-agent",
    layer: "strategic",
    role: "legal-shield",
    model: "gemini-2.0-flash",
    icon: "Shield",
    systemPrompt: `${KOSMOI_MANIFESTO}\n\nאתה השכפ"ץ המשפטי. אתה דואג לתנאי שימוש הוגנים, הגנת פרטיות, וחוזי התקשרות פשוטים מול ספקים.`,
    allowedTools: ["contracts", "analysis", "document"],
    memory: { type: "midterm", ttlDays: 365 },
    maxRuntimeSeconds: 3600
};
