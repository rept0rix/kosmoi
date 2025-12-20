// src/services/agents/memorySupabase.js
import { db } from '@/api/supabaseClient.js';

/**
 * Load agent memory from Supabase
 * @param {string} agentId 
 * @param {string} userId 
 * @returns {Promise<Array>}
 */
export async function loadMemoryFromSupabase(agentId, userId) {
    if (!userId) return [];
    try {
        const data = await db.entities.AgentMemory.get(agentId, userId);
        return data ? data.history : [];
    } catch (error) {
        console.error("Failed to load memory:", error);
        return [];
    }
}

/**
 * Save agent memory to Supabase
 * @param {string} agentId 
 * @param {string} userId 
 * @param {Array} history 
 */
export async function saveMemoryToSupabase(agentId, userId, history) {
    if (!userId) return;
    try {
        await db.entities.AgentMemory.upsert({
            agent_id: agentId,
            user_id: userId,
            history: history,
            updated_at: new Date().toISOString()
        });
    } catch (error) {
        console.error("Failed to save memory:", error);
    }
}

/**
 * Clear agent memory from Supabase
 * @param {string} agentId 
 * @param {string} userId 
 */
export async function clearMemory(agentId, userId) {
    if (!userId) return;
    try {
        await db.entities.AgentMemory.upsert({
            agent_id: agentId,
            user_id: userId,
            history: [],
            updated_at: new Date().toISOString()
        });
        console.log(`[Memory] Cleared history for ${agentId}`);
    } catch (error) {
        console.error("Failed to clear memory:", error);
    }
}

// --- FILE SYSTEM PERSISTENCE ---

export async function saveFileToSupabase(path, content, agentId, userId) {
    if (!userId) return;
    try {
        await db.entities.AgentFiles.upsert({
            path,
            content,
            agent_id: agentId,
            user_id: userId,
            updated_at: new Date().toISOString()
        });
    } catch (e) {
        console.error("Error saving file to Supabase:", e);
    }
}

export async function listFilesFromSupabase(userId) {
    if (!userId) return [];
    try {
        return await db.entities.AgentFiles.list(userId);
    } catch (e) {
        console.error("Error listing files:", e);
        return [];
    }
}

export async function loadFileFromSupabase(path, userId) {
    if (!userId) return null;
    try {
        const data = await db.entities.AgentFiles.get(path, userId);
        return data ? data.content : null;
    } catch (e) {
        console.error("Error loading file:", e);
        return null;
    }
}

// --- TICKET SYSTEM PERSISTENCE ---

export async function createTicketInSupabase(ticket, userId) {
    if (!userId) return;
    try {
        await db.entities.AgentTickets.create({
            ...ticket,
            user_id: userId
        });
    } catch (e) {
        console.error("Error creating ticket:", e);
    }
}
