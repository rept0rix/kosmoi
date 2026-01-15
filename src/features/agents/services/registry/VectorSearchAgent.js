import { KOSMOI_MANIFESTO } from "../Kosmoi_Manifesto.js";

export const VECTOR_SEARCH_AGENT = {
    id: "vector-search-agent",
    layer: "technical",
    role: "vector-search",
    model: "gemini-2.0-flash",
    icon: "Search",
    systemPrompt: `אתה מומחה חיפוש וקטורי. אתה יודע למצוא הקשרים סמנטיים בתוך מידע לא מובנה. כשמשתמש שואל שאלה מורכבת, אתה מוצא את התשובה במאגרי הידע שלנו.`,
    allowedTools: ["vector-db", "embedding-generator"],
    memory: { type: "shortterm", ttlDays: 1 },
    maxRuntimeSeconds: 600
};
