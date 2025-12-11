import { describe, it, expect, vi, beforeEach } from 'vitest';
import { predictCategory } from '../categoryRouter';

// Mock dependencies
vi.mock('@/services/agents/AgentBrain', () => ({
    getAgentReply: vi.fn()
}));

vi.mock('@/services/agents/AgentRegistry', () => ({
    getAgentById: vi.fn()
}));

import { getAgentReply } from '@/services/agents/AgentBrain';
import { getAgentById } from '@/services/agents/AgentRegistry';

describe('categoryRouter', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Default mock for agent registry
        getAgentById.mockReturnValue({ id: 'vector-search-agent' });
    });

    it('predicts category from direct keywords (Fast Path)', async () => {
        expect(await predictCategory('plumber')).toBe('plumber');
        expect(await predictCategory('food')).toBe('restaurants');
        expect(await predictCategory('taxi')).toBe('taxis');
        // Should NOT call AI for known keywords
        expect(getAgentReply).not.toHaveBeenCalled();
    });

    it('predicts category from sentences containing keywords', async () => {
        expect(await predictCategory('find me a good plumber')).toBe('plumber');
        expect(await predictCategory('I want some thai food')).toBe('restaurants');
        expect(await predictCategory('need a taxi to airport')).toBe('taxis');
        expect(getAgentReply).not.toHaveBeenCalled();
    });

    it('handles plurals loosely', async () => {
        expect(await predictCategory('plumbers')).toBe('plumber');
    });

    it('falls back to AI for unknown queries', async () => {
        // Mock AI response
        getAgentReply.mockResolvedValue({ message: 'massage_spa' });

        const result = await predictCategory('my back hurts so bad');

        expect(getAgentById).toHaveBeenCalledWith('vector-search-agent');
        expect(getAgentReply).toHaveBeenCalled();
        expect(result).toBe('massage_spa');
    });

    it('returns null if AI returns invalid category', async () => {
        // Mock AI returning nonsense
        getAgentReply.mockResolvedValue({ message: 'space_travel' });

        const result = await predictCategory('fly me to mars');

        expect(result).toBeNull();
    });

    it('returns null if AI fails', async () => {
        getAgentReply.mockRejectedValue(new Error('AI down'));

        const result = await predictCategory('unknown confusing query');
        expect(result).toBeNull();
    });

    it('returns null for empty queries', async () => {
        expect(await predictCategory('')).toBeNull();
        expect(await predictCategory(null)).toBeNull();
    });
});
