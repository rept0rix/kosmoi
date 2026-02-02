import { ToolRegistry } from '../ToolRegistry.js';

// Register Admin Tools for Agent Awareness
// Note: Implementation is handled in agent_worker.js dispatcher

ToolRegistry.register(
    'seed_db',
    'Populate the database with mock properties, providers, and experiences. (Internal Admin Use Only)',
    {
        type: 'object',
        properties: {
            agentId: { type: 'string', description: 'Agent ID to assign properties to (optional)' }
        }
    },
    async (payload) => {
        // This is a stub for the registry. Worker handles the actual call.
        return "Command received. Processing seeding in background...";
    }
);

ToolRegistry.register(
    'clear_db',
    'Remove all mock data from the main tables. (Internal Admin Use Only)',
    {
        type: 'object',
        properties: {}
    },
    async (payload) => {
        // This is a stub for the registry. Worker handles the actual call.
        return "Command received. Clearing database in background...";
    }
);
