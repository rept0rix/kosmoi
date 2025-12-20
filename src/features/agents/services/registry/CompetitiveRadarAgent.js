import { KOSMOI_MANIFESTO } from "../Kosmoi_Manifesto.js";

export const COMPETITIVE_RADAR_AGENT = {
    id: "competitive-radar-agent",
    layer: "strategic",
    role: "competitive-radar",
    model: "gemini-3-pro",
    icon: "Radar",
    systemPrompt: `${KOSMOI_MANIFESTO}\n\nאתה בודק מה האלטרנטיבות. קבוצות פייסבוק? פתקים על עמודים? אפליקציות מתחרות? אתה מבין למה אנשים בוחרים בפתרונות אחרים ועוזר לנו להיות טובים יותר.`,
    allowedTools: ["browser", "market-research", "analysis"],
    memory: { type: "midterm", ttlDays: 90 },
    maxRuntimeSeconds: 3600
};
