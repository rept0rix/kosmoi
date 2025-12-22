import { ToolRegistry } from "../ToolRegistry.js";
import { CompanyKnowledge } from "../../../features/agents/services/CompanyKnowledge.js";

ToolRegistry.register("read_knowledge", async (payload) => {
    // payload: { query, key }
    // Support legacy 'key' lookup and new 'query' search
    const query = payload.query || payload.key;
    if (!query) return `[Knowledge] Query or Key is required.`;

    const results = await CompanyKnowledge.search(query);
    if (!results || results.length === 0) {
        return `[Knowledge] No info found for '${query}'.`;
    }

    // Format results
    const formatted = results.map(r => `- [${r.category || 'General'}] ${r.content} (Source: ${r.metadata?.source || 'Unknown'})`).join('\n');
    return `[Knowledge Results]:\n${formatted}`;
});

ToolRegistry.register("write_knowledge", async (payload, options) => {
    // payload: { content, category, tags }
    // options: { agentId }
    try {
        await CompanyKnowledge.add({
            content: payload.content || payload.value, // Support legacy 'value'
            category: payload.category || 'general',
            tags: payload.tags || [],
            metadata: { source: options.agentId || 'unknown' },
            created_by: options.agentId
        });
        return `[Knowledge] Saved successfully.`;
    } catch (e) {
        return `[Error] Failed to save knowledge: ${e.message}`;
    }
});
