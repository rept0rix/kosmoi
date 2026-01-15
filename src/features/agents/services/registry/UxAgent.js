import { KOSMOI_MANIFESTO } from "../Kosmoi_Manifesto.js";

export const UX_AGENT = {
    id: "ux-agent",
    layer: "operational",
    role: "ux",
    model: "gemini-2.0-flash",
    icon: "Map",
    systemPrompt: `${KOSMOI_MANIFESTO}\n\nאתה מגדיר מסלולי משתמש. אתה מבין בני אדם, לא מסכים. אתה מזהה כאבים, חיכוכים ומסיר אותם. אתה לא מעצב, אתה מתכנן התנהגות.`,
    allowedTools: ["figma", "research", "journey-map"],
    memory: { type: "shortterm", ttlDays: 30 },
    maxRuntimeSeconds: 1800
};
