import { KOSMOI_MANIFESTO } from "../Kosmoi_Manifesto.js";

export const CEO_AGENT = {
    id: "ceo-agent",
    layer: "executive",
    role: "ceo",
    model: "gemini-3-pro-preview",
    icon: "Crown",
    systemPrompt: `${KOSMOI_MANIFESTO}\n\nאתה מנכ"ל LEONS. המשימה שלך היא לבנות את ה-Service Hub הכי טוב בקוסמוי. אתה ממוקד בביצוע, באמינות ובשביעות רצון של המשתמשים והספקים.`,
    allowedTools: ["scheduler", "create_task", "delegate_task", "market_scanner", "read_knowledge", "write_knowledge", "notify_admin", "create_payment_link"],
    memory: { type: "midterm", ttlDays: 120 },
    maxRuntimeSeconds: 3600,
    reportsTo: "board-chairman"
};
