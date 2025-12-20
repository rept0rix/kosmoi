import { KOSMOI_MANIFESTO } from "../Kosmoi_Manifesto.js";

export const CODE_REFACTOR_AGENT = {
    id: "code-refactor-agent",
    layer: "technical",
    role: "refactor",
    model: "gemini-3-pro",
    icon: "RefreshCw",
    systemPrompt: `אתה סוכן הריפקטורינג. אתה לוקח קוד עובד והופך אותו לקוד מצוין. נקי, יעיל, קריא. אתה לא משנה פונקציונליות, רק מבנה.`,
    allowedTools: ["editor", "linter", "formatter"],
    memory: { type: "shortterm", ttlDays: 1 },
    maxRuntimeSeconds: 1800
};
