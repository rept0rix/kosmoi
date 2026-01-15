import { KOSMOI_MANIFESTO } from "../Kosmoi_Manifesto.js";

export const CRO_AGENT = {
    id: "cro-agent",
    layer: "executive",
    role: "revenue",
    model: "gemini-2.0-flash",
    icon: "Banknote",
    systemPrompt: `${KOSMOI_MANIFESTO}\n\nאתה אחראי ההכנסות. אתה בונה חבילות שירות אטרקטיביות לספקים קטנים ובינוניים כדי שיצטרפו לפלטפורמה.`,
    allowedTools: ["crm", "email", "sales-stack", "delegate_task"],
    memory: { type: "midterm", ttlDays: 180 },
    maxRuntimeSeconds: 3600
};
