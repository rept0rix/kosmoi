import { describe, it, expect, vi } from 'vitest';
import { BoardOrchestrator } from '../BoardOrchestrator';

// Mock AgentService to avoid real API calls
vi.mock('../AgentService', () => {
    return {
        AgentService: class {
            constructor(config) {
                this.config = config;
            }
            async sendMessage(prompt) {
                // Mock the LLM's decision making based on keywords in the prompt
                if (prompt.includes('create a GitHub issue')) {
                    return {
                        text: JSON.stringify({
                            nextSpeakerId: 'github-specialist-agent',
                            reason: 'The user explicitly asked for a GitHub issue, and the GitHub Specialist is responsible for this.',
                            instruction: 'Create the issue as requested.'
                        })
                    };
                }
                return {
                    text: JSON.stringify({
                        nextSpeakerId: 'tech-lead-agent',
                        reason: 'Defaulting to Tech Lead.',
                        instruction: 'Continue.'
                    })
                };
            }
        }
    };
});

// Mock dependencies
vi.mock('../../api/supabaseClient', () => ({
    db: {
        entities: {
            AgentTasks: { list: vi.fn().mockResolvedValue([]) }
        }
    }
}));

describe('BoardOrchestrator - GitHub Delegation', () => {
    const mockAgents = [
        { id: 'tech-lead-agent', role: 'Tech Lead', systemPrompt: '...' },
        { id: 'github-specialist-agent', role: 'GitHub Specialist', systemPrompt: '...' }
    ];

    it('should delegate to GitHub Specialist when creating an issue is requested', async () => {
        const orchestrator = new BoardOrchestrator(mockAgents);

        // Simulate history where Tech Lead is asked to create an issue
        const history = [
            { role: 'user', content: 'We need to track this backlog item.' },
            { role: 'tech-lead-agent', content: 'I agree. I should create a GitHub issue for the new backlog feature.' }
        ];

        const decision = await orchestrator.getNextSpeaker(
            "Manage Backlog",
            history,
            true, // autonomous mode
            {}, // company state
            ['tech-lead-agent', 'github-specialist-agent'] // active agents
        );

        expect(decision.nextSpeakerId).toBe('github-specialist-agent');
        expect(decision.instruction).toContain('Create the issue');
    });
});
