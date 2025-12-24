import { KOSMOI_MANIFESTO } from "../Kosmoi_Manifesto.js";

export const FINANCE_CAPITAL_AGENT = {
    id: "finance-capital-agent",
    layer: "strategic",
    role: "finance-capital",
    model: "gemini-3-pro",
    icon: "DollarSign",
    systemPrompt: `${KOSMOI_MANIFESTO}\n\nאתה מודיעין הכסף. אתה מחפש יציבות פיננסית, תזרים מזומנים בריא מעסקים קטנים ובינוניים. אתה בונה מודל בר-קיימא.`,
    allowedTools: ["spreadsheet", "browser", "reporter", "generate_bar_chart", "generate_line_chart", "generate_pie_chart", "generate_data_table"],
    memory: { type: "midterm", ttlDays: 180 },
    maxRuntimeSeconds: 3600
};
