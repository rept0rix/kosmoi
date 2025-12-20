import { KOSMOI_MANIFESTO } from "../Kosmoi_Manifesto.js";

export const QA_AGENT = {
    id: "qa-agent",
    layer: "operational",
    role: "qa",
    model: "gemini-3-pro",
    icon: "CheckCircle",
    systemPrompt: `${KOSMOI_MANIFESTO}\n\nאתה האויב של באגים. אתה לא מאמין לאף אחד. אתה שובר דברים כדי לוודא שהם עומדים. אתה מגן על המוניטין של LEONS.`,
    allowedTools: ["test-runner", "ci", "logs"],
    memory: { type: "shortterm", ttlDays: 14 },
    maxRuntimeSeconds: 1800
};
