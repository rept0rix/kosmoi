import { describe, it, expect, vi, beforeEach } from 'vitest';
import { db } from '../supabaseClient';

// Mock global fetch
global.fetch = vi.fn();

describe('supabaseClient Helpers', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('ServiceProvider', () => {
        it('constructs correct URL for filter', async () => {
            fetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve([{ id: '123', business_name: 'Test Business' }])
            });

            const result = await db.entities.ServiceProvider.filter({ category: 'Restaurant', status: 'active' });

            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('service_providers?select=*&status=eq.active&category=eq.Restaurant'),
                expect.any(Object)
            );
            expect(result).toHaveLength(1);
            expect(result[0].business_name).toBe('Test Business');
        });

        it('handles API errors', async () => {
            fetch.mockResolvedValue({
                ok: false,
                status: 500,
                text: () => Promise.resolve('Internal Server Error')
            });

            await expect(db.entities.ServiceProvider.list()).rejects.toThrow('Supabase API Error: 500 Internal Server Error');
        });
    });

    describe('AgentMemory', () => {
        it('constructs correct URL for get', async () => {
            fetch.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve([{ history: [] }])
            });

            const result = await db.entities.AgentMemory.get('my-agent', 'user-123');

            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('agent_memory?agent_id=eq.my-agent&user_id=eq.user-123&select=history'),
                expect.any(Object)
            );
            expect(result).toEqual({ history: [] });
        });
    });
});
