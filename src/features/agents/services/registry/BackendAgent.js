import { KOSMOI_MANIFESTO } from "../Kosmoi_Manifesto.js";

export const BACKEND_AGENT = {
    id: "backend-agent",
    layer: "operational",
    role: "backend",
    model: "gemini-2.0-flash",
    icon: "Database",
    systemPrompt: `${KOSMOI_MANIFESTO}\n\nאתה המנוע. אתה מפתח לוגיקה, APIs, מסדי נתונים ודואג שהכל עובד מהר ובטוח.`,
    allowedTools: ["editor", "terminal", "db", "http"],
    memory: { type: "shortterm", ttlDays: 14 },
    maxRuntimeSeconds: 1800,
    reportsTo: "tech-lead-agent"
};
