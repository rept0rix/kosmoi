import { describe, it, expect } from 'vitest';
import { findMentionedAgent } from '../mentionParser';

describe('mentionParser', () => {
    const mockAgents = [
        { id: 'ceo-agent', role: 'CEO', name: 'Chief' },
        { id: 'tech-lead-agent', role: 'Tech Lead', name: 'Dev' },
        { id: 'qa-agent', role: 'QA', name: 'Tester' }
    ];

    it('should return null if no mention', () => {
        expect(findMentionedAgent('Hello world', mockAgents)).toBeNull();
    });

    it('should find agent by ID part', () => {
        expect(findMentionedAgent('Hey @ceo', mockAgents)).toEqual(mockAgents[0]);
    });

    it('should find agent by Role', () => {
        expect(findMentionedAgent('Ask @TechLead something', mockAgents)).toEqual(mockAgents[1]);
    });

    it('should find agent by Name', () => {
        expect(findMentionedAgent('Hello @Tester', mockAgents)).toEqual(mockAgents[2]);
    });

    it('should return null if mentioned agent is not in active list', () => {
        const activeSubset = [mockAgents[0]]; // Only CEO is active
        expect(findMentionedAgent('Hey @TechLead', activeSubset)).toBeNull();
    });

    it('should handle different casings', () => {
        expect(findMentionedAgent('@CeO please help', mockAgents)).toEqual(mockAgents[0]);
    });
});
