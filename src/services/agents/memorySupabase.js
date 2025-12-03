// src/services/agents/memorySupabase.js

const getEnv = (key) => {
    if (typeof import.meta !== 'undefined' && import.meta.env) {
        return import.meta.env[key];
    }
    if (typeof process !== 'undefined' && process.env) {
        return process.env[key];
    }
    return undefined;
};

/**
 * Load agent memory from Supabase
 * @param {string} agentId 
 * @param {string} userId 
 * @returns {Promise<Array>}
 */
export async function loadMemoryFromSupabase(agentId, userId) {
    if (!userId) return [];

    try {
        const supabaseUrl = getEnv('VITE_SUPABASE_URL');
        const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY');

        if (!supabaseUrl || !supabaseAnonKey) {
            console.warn("Supabase credentials missing, skipping memory load.");
            return [];
        }

        // Helper to get token
        const getAccessToken = () => localStorage.getItem('sb-access-token');

        const url = `${supabaseUrl}/rest/v1/agent_memory?agent_id=eq.${agentId}&user_id=eq.${userId}&select=history`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout

        const response = await fetch(url, {
            signal: controller.signal,
            headers: {
                'apikey': supabaseAnonKey,
                'Authorization': `Bearer ${getAccessToken()}`,
                'Content-Type': 'application/json'
            }
        });
        clearTimeout(timeoutId);

        if (!response.ok) return [];

        const data = await response.json();
        // data is an array
        if (data && data.length > 0) {
            return data[0].history || [];
        }
        return [];

    } catch (error) {
        if (error.name === 'AbortError') {
            console.warn("Supabase memory load timed out.");
        } else {
            console.error("Failed to load memory:", error);
        }
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
        const supabaseUrl = getEnv('VITE_SUPABASE_URL');
        const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY');
        const getAccessToken = () => localStorage.getItem('sb-access-token');

        const url = `${supabaseUrl}/rest/v1/agent_memory`;

        // Upsert logic: we need to handle conflict on (user_id, agent_id)
        // Supabase REST API supports upsert via Prefer header or just POST with on_conflict

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout

        const response = await fetch(`${url}?on_conflict=user_id,agent_id`, {
            method: 'POST',
            signal: controller.signal,
            headers: {
                'apikey': supabaseAnonKey,
                'Authorization': `Bearer ${getAccessToken()}`,
                'Content-Type': 'application/json',
                'Prefer': 'resolution=merge-duplicates' // This performs an upsert
            },
            body: JSON.stringify({
                agent_id: agentId,
                user_id: userId,
                history: history,
                updated_at: new Date().toISOString()
            })
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
            const text = await response.text();
            console.error("Failed to save memory:", text);
        }

    } catch (error) {
        console.error("Failed to save memory:", error);
    }
}

// --- FILE SYSTEM PERSISTENCE ---

export async function saveFileToSupabase(path, content, agentId, userId) {
    if (!userId) return;
    try {
        const supabaseUrl = getEnv('VITE_SUPABASE_URL');
        const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY');
        const getAccessToken = () => localStorage.getItem('sb-access-token');

        const url = `${supabaseUrl}/rest/v1/agent_files?on_conflict=user_id,path`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'apikey': supabaseAnonKey,
                'Authorization': `Bearer ${getAccessToken()}`,
                'Content-Type': 'application/json',
                'Prefer': 'resolution=merge-duplicates'
            },
            body: JSON.stringify({
                path,
                content,
                agent_id: agentId,
                user_id: userId,
                updated_at: new Date().toISOString()
            })
        });

        if (!response.ok) {
            console.error("Failed to save file:", await response.text());
        }
    } catch (e) {
        console.error("Error saving file to Supabase:", e);
    }
}

export async function listFilesFromSupabase(userId) {
    if (!userId) return [];
    try {
        const supabaseUrl = getEnv('VITE_SUPABASE_URL');
        const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY');
        const getAccessToken = () => localStorage.getItem('sb-access-token');

        const url = `${supabaseUrl}/rest/v1/agent_files?user_id=eq.${userId}&select=path,updated_at,agent_id`;

        const response = await fetch(url, {
            headers: {
                'apikey': supabaseAnonKey,
                'Authorization': `Bearer ${getAccessToken()}`
            }
        });

        if (response.ok) {
            return await response.json();
        }
        return [];
    } catch (e) {
        console.error("Error listing files:", e);
        return [];
    }
}

export async function loadFileFromSupabase(path, userId) {
    if (!userId) return null;
    try {
        const supabaseUrl = getEnv('VITE_SUPABASE_URL');
        const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY');
        const getAccessToken = () => localStorage.getItem('sb-access-token');

        const url = `${supabaseUrl}/rest/v1/agent_files?user_id=eq.${userId}&path=eq.${path}&select=content`;

        const response = await fetch(url, {
            headers: {
                'apikey': supabaseAnonKey,
                'Authorization': `Bearer ${getAccessToken()}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            return data.length > 0 ? data[0].content : null;
        }
        return null;
    } catch (e) {
        console.error("Error loading file:", e);
        return null;
    }
}

// --- TICKET SYSTEM PERSISTENCE ---

export async function createTicketInSupabase(ticket, userId) {
    if (!userId) return;
    try {
        const supabaseUrl = getEnv('VITE_SUPABASE_URL');
        const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY');
        const getAccessToken = () => localStorage.getItem('sb-access-token');

        const url = `${supabaseUrl}/rest/v1/agent_tickets`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'apikey': supabaseAnonKey,
                'Authorization': `Bearer ${getAccessToken()}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ...ticket,
                user_id: userId
            })
        });

        if (!response.ok) {
            console.error("Failed to create ticket:", await response.text());
        }
    } catch (e) {
        console.error("Error creating ticket:", e);
    }
}
