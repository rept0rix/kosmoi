import { ToolRegistry } from "./ToolRegistry.js";
import { supabase } from "../../../api/supabaseClient";

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

        // --- HELPER: Log to DB ---
        const logToDB = async (level, message, metadata = {}) => {
            try {
                await supabase.from('agent_logs').insert({
                    agent_id: agent.id || 'unknown_agent',
                    level,
                    message,
                    metadata: {
                        role: 'assistant',
                        username: agent.name || 'AI Assistant',
                        ...metadata
                    }
                });
            } catch (err) {
                console.warn("Agent Logging Failed:", err);
            }
        };

        // Log Start
        await logToDB('info', `Processing: "${input.substring(0, 50)}..."`, { type: 'start', fullInput: input });

        try {
            const apiKey = import.meta.env?.VITE_GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
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

            // --- STEP 3: EXECUTION LOOP (The Ralph Loop) ---
            let iterations = 0;
            const maxIterations = 5;
            let currentContext = contextData;
            let fullThoughtLog = ["Context Gathered"];

            while (iterations < maxIterations) {
                console.log(`[AgentRunner] Loop iteration ${iterations + 1}...`);

                // Call LLM
                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        systemInstruction: { parts: [{ text: systemPrompt }] },
                        contents: [{ role: 'user', parts: [{ text: currentContext + (iterations > 0 ? "\n(Continue from observation...)" : `\nUser Input: ${input}`) }] }],
                        generationConfig: { responseMimeType: "application/json" }
                    })
                });

                const data = await response.json();
                const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
                if (!textResponse) throw new Error("Empty response from AI");

                let parsed;
                try {
                    parsed = JSON.parse(textResponse);
                } catch (e) {
                    console.error("JSON Parse Error", textResponse);
                    await logToDB('error', "Failed to parse Agent JSON response");
                    // Fallback: If AI fails JSON, try to recover or just return text
                    return { output: textResponse, thoughtProcess: fullThoughtLog };
                }

                // Log thoughts
                if (parsed.thought) {
                    fullThoughtLog.push(parsed.thought);
                    await logToDB('info', parsed.thought, { type: 'thought' });
                }
                if (parsed.thoughts) {
                    fullThoughtLog.push(...parsed.thoughts);
                    await logToDB('info', parsed.thoughts.join(' | '), { type: 'thoughts' });
                }

                // CHECK: Is it an Action or Final Message?
                if (parsed.action && parsed.action.tool) {
                    // ACTION REQUIRED
                    const { tool, params } = parsed.action;
                    console.log(`[AgentRunner] Executing Tool: ${tool}`, params);
                    fullThoughtLog.push(`Action: ${tool}`);
                    await logToDB('action', `Executing ${tool}`, { tool, params });

                    let observation;
                    try {
                        if (ToolRegistry[tool]) {
                            observation = await ToolRegistry[tool](params);
                        } else {
                            observation = "Error: Tool not found.";
                        }
                    } catch (err) {
                        observation = `Error executing tool: ${err.message}`;
                        await logToDB('error', `Tool Error: ${tool}`, { error: err.message });
                    }

                    // Feed observation back into context for next turn
                    currentContext += `\n\n--- TURN ${iterations + 1} ---\nAgent Action: ${tool}\nObservation: ${JSON.stringify(observation)}\n`;
                } else {
                    // FINAL ANSWER (or just message)
                    const finalOutput = parsed.output || parsed.message || parsed.email_draft;
                    await logToDB('chat', finalOutput, { type: 'final_response' });

                    return {
                        output: finalOutput,
                        thoughtProcess: fullThoughtLog,
                        // If there are UI choices/content, pass them through
                        a2ui_content: parsed.a2ui_content,
                        choices: parsed.choices
                    };
                }

                iterations++;
            }

            await logToDB('error', "Agent loop timed out", { maxIterations });
            return {
                output: "I thought about it for too long and got stuck. Please try again.",
                thoughtProcess: fullThoughtLog
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
