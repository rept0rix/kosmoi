import { KnowledgeService } from "../../../services/ai/KnowledgeService.js";

/**
 * ToolRegistry
 * Maps string tool names (from Agent Config) to executable functions.
 */
export const ToolRegistry = {
    // --- AI TOOLS ---
    'search_knowledge_base': async (input) => {
        // Input can be a string or an object { query: "..." }
        const query = typeof input === 'string' ? input : input.query;
        console.log(`[ToolRegistry] Searching Knowledge Base for: ${query}`);
        const result = await KnowledgeService.retrieveContext(query);
        return result || "No relevant information found.";
    },

    'generate_email': async (input, context) => {
        // This is a special tool that typically delegates back to the LLM, 
        // but for now we can implement a template based one or just return a placeholder 
        // if we are strictly testing tool routing. 
        // ideally this is handled by the AgentRunner itself prompting the LLM.
        return `[DRAFT EMAIL]\nTo: ${context.lead?.name || 'Customer'}\nSubject: Re: ${input.topic || 'Inquiry'}\n\n${input.instructions || 'Draft content here...'}`;
    },

    // --- CRM TOOLS ---
    'insert_interaction': async (input) => {
        console.log(`[ToolRegistry] Logging interaction:`, input);
        // TODO: Connect to Real DB
        return { success: true, id: 'mock-interaction-id' };
    },

    'update_lead': async (input) => {
        console.log(`[ToolRegistry] Updating lead:`, input);
        // TODO: Connect to Real DB
        return { success: true, status: input.status };
    },

    'get_lead': async (input) => {
        console.log(`[ToolRegistry] Fetching lead:`, input);
        // TODO: Connect to Real DB
        return { name: "Mock Lead", business_type: "Yoga Studio" };
    }
};
