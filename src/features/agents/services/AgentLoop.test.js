import { describe, it, expect, vi } from 'vitest';
import { AgentRunner } from './AgentRunner';
import { CONCIERGE_AGENT } from './registry/ConciergeAgent';

// Mock dependencies
vi.mock('./ToolRegistry', () => ({
    ToolRegistry: {
        search_services: vi.fn(),
        search_knowledge_base: vi.fn()
    }
}));

// Mock Fetch for Gemini
global.fetch = vi.fn();

describe('Concierge Agent - Ralph Loop', () => {

    it('should iterate through Thought -> Action -> Observation before Final Answer', async () => {
        // Step 1: Agent decides to search for pizza
        const turn1Response = {
            candidates: [{
                content: {
                    parts: [{
                        text: JSON.stringify({
                            thought: "User wants pizza. Searching for places.",
                            action: {
                                tool: "search_services",
                                params: { query: "pizza", location: "chaweng" }
                            }
                        })
                    }]
                }
            }]
        };

        // Step 2: Agent gets results and gives final answer
        const turn2Response = {
            candidates: [{
                content: {
                    parts: [{
                        text: JSON.stringify({
                            thought: "Found 2 places. Recommending Prego.",
                            message: "You should go to Prego!"
                        })
                    }]
                }
            }]
        };

        // Mock fetch to return these sequentially
        const fetchMock = vi.fn()
            .mockResolvedValueOnce({ json: () => Promise.resolve(turn1Response) })
            .mockResolvedValueOnce({ json: () => Promise.resolve(turn2Response) });

        global.fetch = fetchMock;

        const result = await AgentRunner.run(CONCIERGE_AGENT, "Where is good pizza?");

        // Expect the runner to have called the tool
        // Note: We need to check if AgentRunner actually supports this tool call loop. 
        // Currently it does NOT, so this test should FAIL or at least show we need a loop mechanism.

        // Assertions for the Future State (Golden Path)
        expect(result.thoughtProcess).toContain("Action: search_services");
        expect(result.output).toContain("Prego");
    });
});
