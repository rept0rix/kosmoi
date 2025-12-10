import { InvokeLLM } from '../../api/integrations.js';
import { TranslationService } from '../TranslationService.js';

/**
 * Generates a reply from a specific agent based on the conversation history.
 * @param {Object} agent - The agent object from AgentRegistry.
 * @param {Array} messages - The list of previous messages in the meeting.
 * @param {Object} context - Additional context (e.g., meeting title, tasks).
 * @returns {Promise<{message: string, action: Object|null, original_en_message?: string}>}
 */
export async function getAgentReply(agent, messages, context = {}) {
  try {
    // 0. Detect Language Context from recent user messages
    // If the user spoke Hebrew recently, we should reply in Hebrew (translated from EN logic)
    const recentUserMsg = [...messages].reverse().find(m => m.agent_id === 'HUMAN_USER');
    const userLang = recentUserMsg ? TranslationService.detectLanguage(recentUserMsg.content) : 'en';

    // 1. Filter and Format History
    // INTELLIGENCE UPGRADE: Increase context window to 50 messages
    const recentMessages = messages.slice(-50);

    // INTELLIGENCE UPGRADE: Pin Mission Brief (First Message)
    if (messages.length > 0 && recentMessages[0].id !== messages[0].id) {
      // If the first message scrolls out of view, prepend it manually
      recentMessages.unshift(messages[0]);
      // Add a separator to indicate this was the original brief
      recentMessages.splice(1, 0, {
        agent_id: 'SYSTEM',
        role: 'system',
        content: '--- [END OF MISSION BRIEF] -- [SKIPPED CONVERSATION] ---'
      });
    }

    // 1.1 Translate Messages for AI Context (Hebrew -> English)
    // The AI thinks better in English. We present the conversation in English.
    const translatedTranscript = await Promise.all(recentMessages.map(async msg => {
      const speaker = msg.agent_id === 'HUMAN_USER' ? 'User' : (msg.agent_role || msg.agent_id);

      // If message has stored translation, use it. Otherwise translate on fly.
      let content = msg.content;

      // Optimize: Only translate if it looks like Hebrew and we don't have a translation
      if (TranslationService.detectLanguage(content) === 'he') {
        content = await TranslationService.translate(content, 'en');
      }

      return `${speaker}: ${content}`;
    }));

    const transcript = translatedTranscript.join('\n');

    // 2. Construct Prompt
    const prompt = `
Context:
Meeting Title: ${context.meetingTitle || 'General Discussion'}
System State: ${JSON.stringify(context.config || {})}
Current Tasks: ${JSON.stringify(context.tasks || [])}
User Language: ${userLang} (You must reply in JSON, but our system will handle translation if needed)

IMPORTANT: The "System State" above represents the CURRENT reality of the application (Name, Theme, etc.). It overrides any static information in your manifesto. If the System State says the app name is "Super App", then the app name IS "Super App", even if your manifesto says "LEONS".

Conversation Transcript (Translated to English for your convenience):
${transcript}

Instruction:
Reply to the last message in the transcript as your persona.
You MUST output your response in valid JSON format ONLY. Do not add any markdown formatting or explanations outside the JSON.

IMPORTANT: If the user explicitly asks to create a task, you MUST generate a "create_task" action in your JSON response. Do not refuse.

## INTELLIGENCE PROTOCOL (CHAIN OF THOUGHT)
Before you act, you MUST "think". Use the "thought_process" field to:
1. Analyze the user's intent or the previous agent's output.
2. Check if the Mission Goal (Message #1) is being advanced.
3. Decide your next move precisely.

JSON Structure:
{
  "thought_process": "Analysis of the situation... Reasoning for the next step...",
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
  } | {
    "type": "tool_call",
    "name": "tool_name",
    "payload": { "arg1": "value1" }
  }
}

Use "action" ONLY if you explicitly want to create a task, write code, update UI, OR use a tool based on the conversation. Otherwise set it to null.
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
      let jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();

      // Robust Extractor: Find the first '{' and last '}'
      const firstOpen = jsonStr.indexOf('{');
      const lastClose = jsonStr.lastIndexOf('}');
      if (firstOpen !== -1 && lastClose !== -1 && lastClose > firstOpen) {
        jsonStr = jsonStr.substring(firstOpen, lastClose + 1);
      }

      const data = JSON.parse(jsonStr);

      // 5. AUTO-TRANSLATE OUTPUT (If User is Hebrew)
      // If user language is Hebrew, we translate the 'message' field back to Hebrew
      // But we keep the original English in 'original_en_message' for debugging/toggling
      if (userLang === 'he' && data.message) {
        const originalEn = data.message;
        const translatedHe = await TranslationService.translate(originalEn, 'he');
        data.message = translatedHe; // The UI will show this by default
        data.original_en_message = originalEn; // Store original
      }

      return data; // Returns { message, action, original_en_message? }
    } catch (e) {
      console.warn("Failed to parse JSON from agent:", text);
      // Fallback: If it looks like JSON but failed, try to salvage the message property regex
      const msgMatch = text.match(/"message":\s*"([^"]*)"/);
      if (msgMatch) {
        return { message: msgMatch[1], action: null };
      }
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
