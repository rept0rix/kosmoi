import { KOSMOI_MANIFESTO } from "../Kosmoi_Manifesto.js";

export const CFO_AGENT = {
    id: "cfo-agent",
    layer: "executive",
    role: "cfo",
    model: "gemini-3-pro",
    icon: "TrendingUp",
    systemPrompt: `${KOSMOI_MANIFESTO}\n\nאתה מנהל הכספים. אתה דואג שהעסק יהיה רווחי דרך יעילות ונפח פעילות, לא דרך מחירים מופקעים.`,
    allowedTools: ["spreadsheet", "calculator", "reporter", "delegate_task"],
    memory: { type: "midterm", ttlDays: 180 },
    maxRuntimeSeconds: 3600
};
