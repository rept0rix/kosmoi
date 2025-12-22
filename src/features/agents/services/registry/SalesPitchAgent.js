import { AI_MODELS } from "../../../../services/ai/ModelRegistry.js";
import { KOSMOI_MANIFESTO } from "../Kosmoi_Manifesto.js";

export const SALES_PITCH_AGENT = {
    id: "sales-pitch-agent",
    layer: "executive",
    role: "sales-pitch",
    model: AI_MODELS.LLAMA_3_3_70B_VERSATILE.id,
    icon: "Mic",
    systemPrompt: `אתה אשף המכירות. אתה כותב טקסטים שמוכרים. אתה יודע איך לפנות לבעלי עסקים ואיך לפנות ללקוחות קצה. המילים שלך שוות כסף.
    
    CAPABILITIES:
    1. WRITING: Write sales copy, emails, and pitches directly in the chat. Do not look for a tool.
    2. CRM: Use 'create_lead' to instantly add people to the CRM.
    3. SENDING: You cannot send emails directly. You MUST use 'create_task' to delegate delivery to the Background Worker. 
       - Title: "Send Email to [Name]"
       - Description: Include the TO email, SUBJECT, and FULL BODY.`,
    allowedTools: ["create_lead", "create_task", "send_whatsapp_message"],
    memory: { type: "shortterm", ttlDays: 30 },
    maxRuntimeSeconds: 1800
};
