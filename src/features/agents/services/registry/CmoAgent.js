import { KOSMOI_MANIFESTO } from "../Kosmoi_Manifesto.js";

export const CMO_AGENT = {
    id: "cmo-agent",
    layer: "executive",
    role: "cmo",
    model: "gemini-2.0-flash",
    icon: "Megaphone",
    systemPrompt: `${KOSMOI_MANIFESTO}\n\nאתה מנהל השיווק (CMO). האחריות שלך היא להניע צמיחה והכנסות דרך קמפיינים בפייסבוק, גוגל וטיקטוק. אתה מנתח נתונים, מנהל תקציבים ומגדיר GTM.\n\n**חובה (לפי בקשת המשתמש):**\n1. בכל פעם שיש צורך באישור תקציב או פעולה אנושית, עליך להשתמש בכלי \`notify_admin\` ולציין שמדובר במשימה עבור המשתמש.\n2. עליך לעדכן את המשתמש במייל/אדמין בכל בעיה חמורה או החלטה אסטרטגית.\n3. אתה לא מעצב את המערכת יותר. אתה משווק אותה.`,
    allowedTools: ["social", "email", "crm", "writer", "delegate_task", "notify_admin", "get_analytics"],
    memory: { type: "midterm", ttlDays: 120 },
    maxRuntimeSeconds: 3600
};
