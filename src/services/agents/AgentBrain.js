import { InvokeLLM } from '../../api/integrations.js';

/**
 * Generates a reply from a specific agent based on the conversation history.
 * @param {Object} agent - The agent object from AgentRegistry.
 * @param {Array} messages - The list of previous messages in the meeting.
 * @param {Object} context - Additional context (e.g., meeting title, tasks).
 * @returns {Promise<{message: string, action: Object|null}>} - The agent's response and optional action.
 */
export async function getAgentReply(agent, messages, context = {}) {
  try {
    // 1. Filter and Format History
    const recentMessages = messages.slice(-15);

    const transcript = recentMessages.map(msg => {
      const speaker = msg.agent_id === 'HUMAN_USER' ? 'User' : (msg.agent_role || msg.agent_id);
      return `${speaker}: ${msg.content}`;
    }).join('\n');

    // 2. Construct Prompt
    const prompt = `
Context:
Meeting Title: ${context.meetingTitle || 'General Discussion'}
System State: ${JSON.stringify(context.config || {})}
Current Tasks: ${JSON.stringify(context.tasks || [])}

IMPORTANT: The "System State" above represents the CURRENT reality of the application (Name, Theme, etc.). It overrides any static information in your manifesto. If the System State says the app name is "Super App", then the app name IS "Super App", even if your manifesto says "LEONS".

Conversation Transcript:
${transcript}

Instruction:
Reply to the last message in the transcript as your persona.
You MUST output your response in valid JSON format ONLY. Do not add any markdown formatting or explanations outside the JSON.

IMPORTANT: If the user explicitly asks to create a task, you MUST generate a "create_task" action in your JSON response. Do not refuse.

JSON Structure:
{
  "message": "Your conversational response here (1-3 sentences)",
  "action": null | {
    "type": "create_task",
    "title": "Task Title",
    "description": "Short description",
    "assignee": "agent-id-or-role",
    "priority": "high" | "medium" | "low"
  } | {
    "type": "write_code",
    "title": "File/Component Name",
    "language": "javascript" | "css" | "html" | "sql" | "json",
    "code": "The actual code content here"
  } | {
    "type": "update_ui",
    "config": {
      "appName": "New App Name",
      "themeColor": "blue" | "red" | "green" | "purple" | "orange",
      "logoUrl": "https://example.com/logo.png"
    }
  }
}

Use "action" ONLY if you explicitly want to create a task OR write code based on the conversation. Otherwise set it to null.
`;

    console.log("FULL PROMPT SENT TO LLM:", prompt);

    // 3. Call LLM
    const response = await InvokeLLM({
      prompt: prompt,
      system_instruction: `CURRENT SYSTEM CONFIGURATION: ${JSON.stringify(context.config || {})}. 
IMPORTANT: This configuration OVERRIDES any static information in your manifesto.
${agent.systemPrompt}

IMPORTANT: You are a helpful AI agent. You always output valid JSON.`,
      model: agent.model,
      images: context.images || []
    });

    const text = response.text.trim();

    // 4. Parse JSON
    try {
      // Clean up potential markdown code blocks
      const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const data = JSON.parse(jsonStr);
      return data; // Returns { message, action }
    } catch (e) {
      console.warn("Failed to parse JSON from agent:", text);
      // Fallback if parsing fails
      return { message: text, action: null };
    }

  } catch (error) {
    console.error("AgentBrain Error:", error);
    return {
      message: "I'm having trouble connecting to my neural network right now. Please check your API key configuration.",
      action: null
    };
  }
}
