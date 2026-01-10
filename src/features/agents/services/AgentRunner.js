import { ToolRegistry } from "./ToolRegistry.js";

/**
 * AgentRunner
 * Executes an agent's logic, handles prompt construction, and invokes tools.
 */
export const AgentRunner = {
    /**
     * Run an agent for a specific task.
     * @param {Object} agent - The agent configuration object.
     * @param {string} input - The user input or trigger message.
     * @param {Object} context - Additional data (e.g., current lead, weather).
     */
    run: async (agent, input, context = {}) => {
        console.log(`[AgentRunner] Running ${agent.id}...`);

        try {
            const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
            if (!apiKey) throw new Error("API Key Missing");

            // --- STEP 1: GATHER CONTEXT (RAG & TOOLS) ---

            // 1a. Sales Agent: Knowledge Base
            let knowledge = "";
            if (agent.allowedTools.includes("search_knowledge_base") && context.lead?.business_type) {
                console.log(`[AgentRunner] Auto-searching knowledge for: ${context.lead.business_type}`);
                knowledge = await ToolRegistry.search_knowledge_base(`${context.lead.business_type} in Koh Samui`);
            }

            // 1b. Marketing Agent: Trends
            let trends = [];
            if (agent.allowedTools.includes("get_trends")) {
                console.log(`[AgentRunner] Fetching trends for Dave...`);
                trends = await ToolRegistry.get_trends({ niche: context.niche || 'General' });
            }

            // 1c. Analytics Agent: Performance Data
            let analyticsData = null;
            if (agent.allowedTools.includes("get_analytics_summary")) {
                console.log(`[AgentRunner] Fetching analytics...`);
                analyticsData = await ToolRegistry.get_analytics_summary({ period: context.period || 'weekly' });
            }

            // --- STEP 2: CONSTRUCT PROMPT ---
            // Dynamic Context Injection
            let contextData = `
**RUNTIME CONTEXT:**
Lead Name: ${context.lead?.name || "N/A"}
Business Type: ${context.lead?.business_type || "N/A"}
Lead Status: ${context.lead?.status || "N/A"}
System Time: ${new Date().toLocaleString()}
`;

            if (knowledge) contextData += `\nRelevant Knowledge Base Info:\n${knowledge}\n`;
            if (trends.length > 0) contextData += `\nViral Trends detected:\n${trends.map(t => `- ${t}`).join('\n')}\n`;
            if (analyticsData) contextData += `\nPlatform Analytics (${analyticsData.period}):\n${JSON.stringify(analyticsData, null, 2)}\n`;

            const systemPrompt = `
${agent.systemPrompt}
 
${contextData}
 
**INSTRUCTION:**
Reflect on the best approach in your "thoughts".
Then generate the "output" content (Text, Email, Report, or Schedule confirmation).
Output JSON format:
{
  "thoughts": ["step 1", "step 2"],
  "output": "The actual content..."
}
`;

            // --- STEP 3: CALL LLM ---
            console.log(`[AgentRunner] Calling Gemini...`);
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    systemInstruction: { parts: [{ text: systemPrompt }] },
                    contents: [{ role: 'user', parts: [{ text: input }] }],
                    generationConfig: { responseMimeType: "application/json" } // Force JSON
                })
            });

            const data = await response.json();
            const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

            if (!textResponse) throw new Error("Empty response from AI");

            const parsed = JSON.parse(textResponse);
            const outputContent = parsed.output || parsed.email_draft || parsed.report; // Handle all content keys
            const thoughts = parsed.thoughts || [];

            // --- STEP 4: POST-ACTION (Side Effects) ---
            // 4a. CRM Logging
            if (agent.allowedTools.includes("insert_interaction") && context.lead?.id) {
                console.log(`[AgentRunner] Logging interaction...`);
                await ToolRegistry.insert_interaction({
                    lead_id: context.lead.id,
                    type: "email_draft",
                    content: outputContent
                });
            }

            // 4b. Marketing Publishing (Auto-publish if configured, currently we just return content for review)
            // If we wanted full autonomy, we would call ToolRegistry.publish_post(outputContent) here.

            return {
                output: outputContent,
                thoughtProcess: ["Context Gathered", ...thoughts, "Action Complete"]
            };

        } catch (error) {
            console.error("[AgentRunner] Execution Failed:", error);
            return {
                output: "Agent encountered an error: " + error.message,
                thoughtProcess: ["Error encountered"]
            };
        }
    }
};
