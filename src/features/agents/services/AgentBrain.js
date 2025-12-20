import { callAgentInteraction } from '@/api/geminiInteractions.js';
import { callGroqInteraction } from '@/api/groqInteractions.js';
import { getModelConfig, AI_PROVIDERS } from '@/services/ai/ModelRegistry.js';
import { db } from '@/api/supabaseClient.js';
import { TranslationService } from '@/services/TranslationService.js';
import { KnowledgeService } from '@/services/ai/KnowledgeService.js';
import { SkillService } from './SkillService.js';

// JSON Schema for Agent Output
const AGENT_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    thought_process: { type: "string", description: "Your internal reasoning for the response." },
    message: { type: "string", description: "The message to display to the user." },
    action: {
      type: "object",
      description: "Optional action to take (e.g. create task, tool call).",
      properties: {
        type: { type: "string" },
        name: { type: "string" },
        payload: { type: "object" }, // Generic payload
        title: { type: "string" },
        description: { type: "string" },
        assignee: { type: "string" },
        priority: { type: "string" },
        language: { type: "string" },
        code: { type: "string" },
        config: { type: "object" }
      },
      nullable: true
    },
    original_en_message: { type: "string", description: "Original English message if translated." }
  },
  required: ["thought_process", "message"]
};

/**
 * Generates a reply from a specific agent using Gemini Interactions API.
 * @param {Object} agent - The agent object.
 * @param {Array} messages - Conversation history.
 * @param {Object} context - Additional context.
 */
export async function getAgentReply(agent, messages, context = {}) {
  try {
    // 0. Detect Language logic (Preserved)
    const recentUserMsg = [...messages].reverse().find(m => m.agent_id === 'HUMAN_USER');
    const userLang = recentUserMsg ? TranslationService.detectLanguage(recentUserMsg.content) : 'en';

    // 1. Filter History (Preserved)
    const recentMessages = messages.slice(-50);
    if (messages.length > 0 && recentMessages[0].id !== messages[0].id) {
      recentMessages.unshift(messages[0]);
      recentMessages.splice(1, 0, {
        agent_id: 'SYSTEM',
        role: 'system',
        content: '--- [END OF MISSION BRIEF] -- [SKIPPED CONVERSATION] ---'
      });
    }

    // 1.1 Translate (Preserved)
    const translatedTranscript = await Promise.all(recentMessages.map(async msg => {
      const speaker = msg.agent_id === 'HUMAN_USER' ? 'User' : (msg.agent_role || msg.agent_id);
      let content = msg.content;
      if (TranslationService.detectLanguage(content) === 'he') {
        content = await TranslationService.translate(content, 'en');
      }
      return `${speaker}: ${content}`;
    }));

    const transcript = translatedTranscript.join('\n');

    // 1.2 RAG (Preserved)
    let knowledgeContext = "";
    try {
      const lastMsg = recentMessages[recentMessages.length - 1];
      if (lastMsg && lastMsg.agent_id === 'HUMAN_USER') {
        const retreivedText = await KnowledgeService.retrieveContext(lastMsg.content);
        if (retreivedText) knowledgeContext = `Relevant Knowledge Base Articles:\n${retreivedText}`;
      }
    } catch (e) {
      console.warn("RAG Failed:", e);
    }

    // 1.3 Skill Search
    let skillContext = "";
    if (context && context.skillOverride) {
      // Manual override for testing/forcing skills
      skillContext = context.skillOverride;
    } else {
      try {
        const lastMsg = recentMessages[recentMessages.length - 1];
        if (lastMsg && lastMsg.agent_id === 'HUMAN_USER') {
          const relevantSkills = await SkillService.findRelevantSkills(lastMsg.content);
          if (relevantSkills.length > 0) {
            skillContext = `\nActive Skills Instructions:\n${relevantSkills.map(s => `[${s.name}]: ${s.instructions}`).join('\n')}\n`;
          }
        }
      } catch (e) {
        console.warn("Skill Search Failed:", e);
      }
    }

    // 2. Construct Prompt (Simplified for Interactions API)
    // We remove the heavy JSON enforcement text because the schema handles it.
    const prompt = `
Context:
Meeting Title: ${context.meetingTitle || 'General Discussion'}
System State: ${JSON.stringify(context.config || {})}
Current Tasks: ${JSON.stringify(context.tasks || [])}
User Language: ${userLang}
activeWorkflow: ${context.workflow ? JSON.stringify(context.workflow) : 'None'}
activeWorkflowStep: ${context.workflowStep ? JSON.stringify(context.workflowStep) : 'None'}
Knowledge Base:
${knowledgeContext || "No relevant documents found."}
${skillContext}

WORKFLOW INSTRUCTION:
${context.workflow ? `You are participating in the "${context.workflow.name}" workflow. Current Step: ${context.workflowStep.label} (${context.workflowStep.role}).` : ''}

AVAILABLE TOOLS:
${agent.allowedTools ? agent.allowedTools.map(t => `- ${t}`).join('\n') : 'No tools available.'}

Conversation Transcript:
${transcript}

Instruction:
Reply to the last message as your persona.
You MUST output your response in JSON format.
Structure:
{
  "thought_process": "reasoning...",
  "message": "response to user...",
  "action": { "name": "tool_name", "payload": { ... } } // Optional
}

If you need to use a tool, populate the "action" field.
If the user explicitly asks to create a task, generate a "create_task" action.
Use "thought_process" to reason before you speak.
`;

    // 3. Call Interactions API
    let data;
    const modelConfig = getModelConfig(agent.model);

    if (modelConfig.provider === AI_PROVIDERS.GROQ) {
      data = await callGroqInteraction({
        model: agent.model,
        prompt: prompt,
        system_instruction: `PERSONA: ${agent.systemPrompt}. You are a helpful AI agent.`,
        jsonSchema: AGENT_RESPONSE_SCHEMA
      });
    } else {
      data = await callAgentInteraction({
        model: agent.model,
        prompt: prompt,
        system_instruction: `PERSONA: ${agent.systemPrompt}. You are a helpful AI agent.`,
        // jsonSchema: AGENT_RESPONSE_SCHEMA
      });
    }

    // 4. Auto-Translate Output (Preserved)
    if (userLang === 'he' && data.message) {
      const originalEn = data.message;
      const translatedHe = await TranslationService.translate(originalEn, 'he');
      data.message = translatedHe;
      data.original_en_message = originalEn;
    }

    // Logging (Preserved)
    try {
      await db.entities.AgentLogs.create({
        agent_id: agent.id,
        user_id: (await db.auth.getSession()).data.session?.user?.id || null,
        prompt: prompt.slice(0, 1000),
        response: JSON.stringify(data).slice(0, 2000),
        metadata: {
          actions: data.action,
          context_used: !!knowledgeContext,
          model_used: agent.model,
          api: "interactions"
        }
      });
    } catch (logErr) {
      console.error("Failed to log agent interaction", logErr);
    }

    // 3.1 Compat: Map standard tool_calls to our schema's 'action'
    if (data.tool_calls && data.tool_calls.length > 0 && !data.action) {
      const call = data.tool_calls[0];
      const func = call.function || call;
      data.action = {
        type: 'tool_call',
        name: func.name,
        payload: func.arguments || func.parameters || {} // Handle different provider formats
      };
    }

    return data;

  } catch (error) {
    console.error("AgentBrain (Interactions) Error:", error);
    return {
      message: "I'm having trouble connecting to my upgraded neural network. Please check your configuration.",
      action: null,
      thought_process: "Error occurred."
    };
  }
}
