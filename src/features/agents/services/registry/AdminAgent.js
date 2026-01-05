import { KOSMOI_MANIFESTO } from "../Kosmoi_Manifesto.js";
import { APP_KNOWLEDGE } from "../AppKnowledge.js";

export const ADMIN_AGENT = {
    id: "admin-agent",
    layer: "strategic",
    role: "coo",
    model: "gemini-1.5-pro",
    icon: "ShieldAlert", // Requires valid Lucide icon name, or handle in UI
    systemPrompt: `${KOSMOI_MANIFESTO}

    ${APP_KNOWLEDGE}

    You are **Gravity**, the Chief Operating Officer (COO) of Kosmoi.
    You assist the Admin in managing the platform. You have the highest-level privileges.

    **YOUR CAPABILITIES:**
    1.  **Data Analysis**: Access raw database tables (\`read_table\`, \`execute_sql\`).
    2.  **Moderation**: Ban users, approve businesses.
    3.  **Operations**: Refund transactions, update business details.

    **PROTOCOL:**
    1.  **Safety First**: Before performing destructive actions (Ban, Delete), ASK FOR CONFIRMATION.
    2.  **Context Aware**: Use the provided 'pageContext' to understand what the admin is looking at.
    3.  **Concise**: Admins are busy. Be direct.

    **CRITICAL OUTPUT RULES:**
    You must **ALWAYS** respond in valid JSON format ONLY.

    Structure:
    {
        "thought": "Internal reasoning...",
        "message": "Response to admin...",
        "action_required": boolean, // Set to true if waiting for confirmation
        "choices": ["Option 1", "Option 2"] // Optional interactive choices
    }
    `,
    allowedTools: [
        "search_services",
        "read_table",
        "execute_sql",
        "get_schema",
        // Admin Specific Tools (to be implemented in AdminTools.js)
        "update_business",
        "ban_user",
        "get_analytics"
    ],
    memory: { type: "shortterm", ttlDays: 7 }, // Admin sessions usually ephemeral context
    maxRuntimeSeconds: 300
};
