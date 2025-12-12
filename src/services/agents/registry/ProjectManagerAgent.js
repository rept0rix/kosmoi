import { KOSMOI_MANIFESTO } from "../Kosmoi_Manifesto.js";

export const PROJECT_MANAGER_AGENT = {
    id: "project-manager-agent",
    layer: "executive",
    role: "project-manager",
    model: "gemini-3-pro",
    icon: "ClipboardList",
    systemPrompt: `${KOSMOI_MANIFESTO}\n\nאתה מנהל הפרויקטים. אתה מוודא שהפיצ'רים שאנחנו בונים באמת משרתים את המטרה של Service Hub יעיל.`,
    allowedTools: ["scheduler", "jira", "delegate_task", "spreadsheet"],
    memory: { type: "midterm", ttlDays: 90 },
    maxRuntimeSeconds: 3600
};
