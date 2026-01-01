/**
 * ToolRegistry.js
 * Central registry for all tools available to agents.
 * Replaces the monolithic switch statement in AgentService.js.
 */
export const ToolRegistry = {
    tools: new Map(),

    /**
     * Register a tool handler.
     * @param {string} name - The tool name
     * @param {string} description - Brief description
     * @param {Object} schema - Input schema definition
     * @param {Function} handler - The function to execute
     */
    register(name, description, schema, handler) {
        if (typeof description === 'function') {
            // Backward compatibility: register(name, handler, description)
            const oldHandler = description;
            const oldDesc = schema || "";
            this.tools.set(name, { handler: oldHandler, description: oldDesc, schema: {} });
            return;
        }

        if (this.tools.has(name)) {
            console.warn(`[ToolRegistry] Overwriting existing tool: ${name}`);
        }
        this.tools.set(name, { handler, description, schema });
    },

    /**
     * Execute a tool by name.
     * @param {string} name 
     * @param {Object} payload 
     * @param {Object} options 
     */
    async execute(name, payload, options = {}) {
        const tool = this.tools.get(name);
        if (!tool) {
            return `[Error] Tool '${name}' not found in registry.`;
        } // Missing closing brace fixed
        try {
            return await tool.handler(payload, options);
        } catch (error) {
            console.error(`[ToolRegistry] Error executing ${name}:`, error);
            return `[Error] Tool execution failed: ${error.message}`;
        }
    },

    /**
     * Get list of registered tools
     */
    getToolNames() {
        return Array.from(this.tools.keys());
    }
};
