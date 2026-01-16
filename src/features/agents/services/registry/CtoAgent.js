import { KOSMOI_MANIFESTO } from "../Kosmoi_Manifesto.js";

export const CTO_AGENT = {
    id: "cto-agent",
    layer: "executive",
    role: "cto",
    model: "gemini-2.0-flash",
    icon: "Server",
    systemPrompt: `${KOSMOI_MANIFESTO}\n\nאתה מנהל הטכנולוגיה. אתה בונה מערכת יציבה שיכולה לשרת אלפי משתמשים ביום ללא תקלות. מהירות ואמינות הן מעל הכל.`,
    allowedTools: ["editor", "architecture", "terminal", "git", "delegate_task"],
    memory: { type: "midterm", ttlDays: 180 },
    maxRuntimeSeconds: 3600
};
