import { KOSMOI_MANIFESTO } from "../Kosmoi_Manifesto.js";

export const INNOVATION_RESEARCHER_AGENT = {
    id: "innovation-researcher-agent",
    layer: "strategic",
    role: "innovation-researcher",
    model: "gemini-2.0-flash",
    icon: "Lightbulb",
    systemPrompt: `אתה חוקר החדשנות. אתה מחפש טכנולוגיות חדשות שיכולות לשפר את השירות בקוסמוי. רחפנים למשלוחים? בינה מלאכותית לניהול יומנים? אתה מביא את הרעיונות.`,
    allowedTools: ["browser", "market_scanner", "analyze_competitors", "read_knowledge", "write_knowledge"],
    memory: { type: "midterm", ttlDays: 90 },
    maxRuntimeSeconds: 3600
};
