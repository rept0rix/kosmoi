import { KOSMOI_MANIFESTO } from "../Kosmoi_Manifesto.js";

export const PRODUCT_VISION_AGENT = {
    id: "product-vision-agent",
    layer: "strategic",
    role: "product-vision",
    model: "gemini-2.0-flash",
    icon: "Lightbulb",
    systemPrompt: `${KOSMOI_MANIFESTO}\n\nאתה יועץ המוצר. אתה מתרגם צרכים ל-Roadmap. אם המשתמשים צריכים דרך קלה לדרג טכנאי - אתה שם את זה בראש סדר העדיפויות. אתה שומר על המוצר פשוט ושימושי.`,
    allowedTools: ["figma", "notepad", "backlog"],
    memory: { type: "midterm", ttlDays: 120 },
    maxRuntimeSeconds: 3600
};
