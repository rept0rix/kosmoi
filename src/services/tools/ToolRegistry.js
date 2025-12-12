/**
 * ToolRegistry.js
 * Central registry for all tools available to agents.
 * Replaces the monolithic switch statement in AgentService.js.
 */
export const ToolRegistry = {
    tools: new Map(),

    /**
     * Register a tool handler.
     * @param {string} name - The tool name (e.g., 'browser', 'execute_command')
     * @param {Function} handler - The function to execute (payload, options) => result
     */
    register(name, handler) {
        if (this.tools.has(name)) {
            console.warn(`[ToolRegistry] Overwriting existing tool: ${name}`);
        }
        this.tools.set(name, handler);
    },

    /**
     * Execute a tool by name.
     * @param {string} name 
     * @param {Object} payload 
     * @param {Object} options 
     */
    async execute(name, payload, options = {}) {
        const handler = this.tools.get(name);
        if (!handler) {
            return `[Error] Tool '${name}' not found in registry.`;
        } // Missing closing brace fixed
        try {
            return await handler(payload, options);
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
