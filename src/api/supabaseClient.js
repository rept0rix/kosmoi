import { createClient } from '@supabase/supabase-js'

const getEnv = (key) => {
    if (typeof import.meta !== 'undefined' && import.meta.env) return import.meta.env[key];
    if (typeof process !== 'undefined' && process.env) return process.env[key];
    return undefined;
};


console.log("[DEBUG] supabaseClient Env Check:");
console.log("VITE_SUPABASE_URL:", process.env.VITE_SUPABASE_URL ? "Exits" : "Missing");
console.log("VITE_SUPABASE_SERVICE_ROLE_KEY:", process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ? "Exists" : "Missing");
console.log("VITE_SUPABASE_ANON_KEY:", process.env.VITE_SUPABASE_ANON_KEY ? "Exists" : "Missing");

const supabaseUrl = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_URL) || process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = (typeof process !== 'undefined' && process.env && process.env.VITE_SUPABASE_SERVICE_ROLE_KEY)
    ? process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
    : ((typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_ANON_KEY) || process.env.VITE_SUPABASE_ANON_KEY);

console.log("[DEBUG] Final URLs:", { supabaseUrl, keyLength: supabaseAnonKey?.length });



// export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
//     auth: {
//         persistSession: false
//     },
//     global: {
//         fetch: (...args) => fetch(...args)
//     }
// })

// Dummy client to prevent import errors while we use direct fetch
export const supabase = {
    from: () => ({
        select: () => ({
            eq: () => ({
                single: () => Promise.resolve({ data: null, error: null }),
                maybeSingle: () => Promise.resolve({ data: null, error: null })
            })
        })
    }),
    auth: {
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => { } } } }),
        signInWithPassword: () => Promise.resolve({ data: {}, error: { message: "Use db.auth.signIn" } }),
        signOut: () => Promise.resolve({ error: null })
    }
};

// Token management
const TOKEN_KEY = 'sb-access-token';
const REFRESH_TOKEN_KEY = 'sb-refresh-token';

const getAccessToken = () => {
    if (typeof localStorage !== 'undefined') {
        return localStorage.getItem(TOKEN_KEY);
    }
    return null;
};
const setSession = (session) => {
    if (!session) {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        return;
    }
    localStorage.setItem(TOKEN_KEY, session.access_token);
    localStorage.setItem(REFRESH_TOKEN_KEY, session.refresh_token);
};

// Auth State Listeners
const authListeners = new Set();
const notifyAuthListeners = (event, session) => {
    authListeners.forEach(callback => callback(event, session));
};

// Helper for direct fetch to bypass client library issues
const fetchSupabase = async (endpoint, options = {}) => {
    const url = `${supabaseUrl}/rest/v1/${endpoint}`;
    const token = getAccessToken();
    const headers = {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${token || supabaseAnonKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation', // Return the created/updated record
        ...options.headers
    };

    const response = await fetch(url, {
        ...options,
        headers
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Supabase API Error: ${response.status} ${text}`);
    }

    return response.json();
};

// Helper for Auth API
const fetchAuth = async (endpoint, options = {}) => {
    const url = `${supabaseUrl}/auth/v1/${endpoint}`;
    const headers = {
        'apikey': supabaseAnonKey,
        'Content-Type': 'application/json',
        ...options.headers
    };
    const token = getAccessToken();
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, { ...options, headers });
    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Auth Error: ${response.status} ${text}`);
    }
    return response.json();
};

// Helper functions for Supabase API
export const supabaseHelpers = {
    entities: {
        ServiceProvider: {
            async filter(filters = {}) {
                let queryParams = new URLSearchParams({ select: '*' });

                if (filters.status) queryParams.append('status', `eq.${filters.status}`);
                if (filters.verified !== undefined) queryParams.append('verified', `eq.${filters.verified}`);
                if (filters.super_category) queryParams.append('super_category', `eq.${filters.super_category}`);
                if (filters.sub_category) queryParams.append('sub_category', `eq.${filters.sub_category}`);
                if (filters.category) queryParams.append('category', `eq.${filters.category}`);
                if (filters.id) queryParams.append('id', `eq.${filters.id}`);
                if (filters.google_place_id) queryParams.append('google_place_id', `eq.${filters.google_place_id}`);
                if (filters.created_by) queryParams.append('created_by', `eq.${filters.created_by}`);

                return fetchSupabase(`service_providers?${queryParams.toString()}`);
            },

            async list(orderBy = '-created_at', limit) {
                let queryParams = new URLSearchParams({ select: '*' });

                if (orderBy) {
                    const desc = orderBy.startsWith('-');
                    const field = desc ? orderBy.slice(1) : orderBy;
                    queryParams.append('order', `${field}.${desc ? 'desc' : 'asc'}`);
                }

                if (limit) queryParams.append('limit', limit);

                return fetchSupabase(`service_providers?${queryParams.toString()}`);
            },

            async create(data) {
                const result = await fetchSupabase('service_providers', {
                    method: 'POST',
                    body: JSON.stringify(data)
                });
                return result[0]; // Supabase returns array
            },

            async update(id, data) {
                const result = await fetchSupabase(`service_providers?id=eq.${id}`, {
                    method: 'PATCH',
                    body: JSON.stringify(data)
                });
                return result[0];
            },

            async delete(id) {
                await fetchSupabase(`service_providers?id=eq.${id}`, {
                    method: 'DELETE'
                });
            },

            async bulkCreate(items) {
                return fetchSupabase('service_providers', {
                    method: 'POST',
                    body: JSON.stringify(items)
                });
            }
        },

        Review: {
            async filter(filters = {}) {
                let queryParams = new URLSearchParams({ select: '*' });
                if (filters.service_provider_id) queryParams.append('service_provider_id', `eq.${filters.service_provider_id}`);
                if (filters.user_id) queryParams.append('user_id', `eq.${filters.user_id}`);
                if (filters.id) queryParams.append('id', `eq.${filters.id}`);
                return fetchSupabase(`reviews?${queryParams.toString()}`);
            },

            async list(orderBy = '-created_at', limit) {
                let queryParams = new URLSearchParams({ select: '*' });
                if (orderBy) {
                    const desc = orderBy.startsWith('-');
                    const field = desc ? orderBy.slice(1) : orderBy;
                    queryParams.append('order', `${field}.${desc ? 'desc' : 'asc'}`);
                }
                if (limit) queryParams.append('limit', limit);
                return fetchSupabase(`reviews?${queryParams.toString()}`);
            },

            async create(data) {
                const result = await fetchSupabase('reviews', {
                    method: 'POST',
                    body: JSON.stringify(data)
                });
                return result[0];
            },

            async update(id, data) {
                const result = await fetchSupabase(`reviews?id=eq.${id}`, {
                    method: 'PATCH',
                    body: JSON.stringify(data)
                });
                return result[0];
            },

            async delete(id) {
                await fetchSupabase(`reviews?id=eq.${id}`, {
                    method: 'DELETE'
                });
            }
        },

        Favorite: {
            async filter(filters = {}) {
                let queryParams = new URLSearchParams({ select: '*' });
                if (filters.service_provider_id) queryParams.append('service_provider_id', `eq.${filters.service_provider_id}`);
                if (filters.user_id) queryParams.append('user_id', `eq.${filters.user_id}`);
                if (filters.id) queryParams.append('id', `eq.${filters.id}`);
                return fetchSupabase(`favorites?${queryParams.toString()}`);
            },

            async list(orderBy = '-created_at', limit) {
                let queryParams = new URLSearchParams({ select: '*' });
                if (orderBy) {
                    const desc = orderBy.startsWith('-');
                    const field = desc ? orderBy.slice(1) : orderBy;
                    queryParams.append('order', `${field}.${desc ? 'desc' : 'asc'}`);
                }
                if (limit) queryParams.append('limit', limit);
                return fetchSupabase(`favorites?${queryParams.toString()}`);
            },

            async create(data) {
                const result = await fetchSupabase('favorites', {
                    method: 'POST',
                    body: JSON.stringify(data)
                });
                return result[0];
            },

            async delete(id) {
                await fetchSupabase(`favorites?id=eq.${id}`, {
                    method: 'DELETE'
                });
            }
        },

        SearchHistory: {
            async filter(filters = {}) {
                let queryParams = new URLSearchParams({ select: '*' });
                if (filters.user_id) queryParams.append('user_id', `eq.${filters.user_id}`);
                if (filters.id) queryParams.append('id', `eq.${filters.id}`);
                return fetchSupabase(`search_history?${queryParams.toString()}`);
            },

            async list(orderBy = '-created_date', limit) {
                let queryParams = new URLSearchParams({ select: '*' });
                if (orderBy) {
                    const desc = orderBy.startsWith('-');
                    const field = desc ? orderBy.slice(1) : orderBy;
                    queryParams.append('order', `${field}.${desc ? 'desc' : 'asc'}`);
                }
                if (limit) queryParams.append('limit', limit);
                return fetchSupabase(`search_history?${queryParams.toString()}`);
            },

            async create(data) {
                const result = await fetchSupabase('search_history', {
                    method: 'POST',
                    body: JSON.stringify(data)
                });
                return result[0];
            },

            async delete(id) {
                await fetchSupabase(`search_history?id=eq.${id}`, {
                    method: 'DELETE'
                });
            }
        },

        ServiceRequest: {
            async filter(filters = {}) {
                let queryParams = new URLSearchParams({ select: '*' });
                if (filters.user_id) queryParams.append('user_id', `eq.${filters.user_id}`);
                if (filters.category) queryParams.append('category', `eq.${filters.category}`);
                if (filters.status) queryParams.append('status', `eq.${filters.status}`);
                if (filters.id) queryParams.append('id', `eq.${filters.id}`);
                return fetchSupabase(`service_requests?${queryParams.toString()}`);
            },

            async list(orderBy = '-created_at', limit) {
                let queryParams = new URLSearchParams({ select: '*' });
                if (orderBy) {
                    const desc = orderBy.startsWith('-');
                    const field = desc ? orderBy.slice(1) : orderBy;
                    queryParams.append('order', `${field}.${desc ? 'desc' : 'asc'}`);
                }
                if (limit) queryParams.append('limit', limit);
                return fetchSupabase(`service_requests?${queryParams.toString()}`);
            },

            async create(data) {
                const result = await fetchSupabase('service_requests', {
                    method: 'POST',
                    body: JSON.stringify(data)
                });
                return result[0];
            },

            async update(id, data) {
                const result = await fetchSupabase(`service_requests?id=eq.${id}`, {
                    method: 'PATCH',
                    body: JSON.stringify(data)
                });
                return result[0];
            },

            async delete(id) {
                await fetchSupabase(`service_requests?id=eq.${id}`, {
                    method: 'DELETE'
                });
            }
        },

        AgentMemory: {
            async get(agentId, userId) {
                const result = await fetchSupabase(`agent_memory?agent_id=eq.${agentId}&user_id=eq.${userId}&select=history`);
                return result[0] || null;
            },
            async upsert(data) {
                // Upsert based on user_id, agent_id
                const result = await fetchSupabase('agent_memory?on_conflict=user_id,agent_id', {
                    method: 'POST',
                    headers: { 'Prefer': 'resolution=merge-duplicates' },
                    body: JSON.stringify(data)
                });
                return result[0];
            }
        },

        AgentFiles: {
            async list(userId) {
                return fetchSupabase(`agent_files?user_id=eq.${userId}&select=path,updated_at,agent_id`);
            },
            async get(path, userId) {
                const result = await fetchSupabase(`agent_files?user_id=eq.${userId}&path=eq.${path}&select=content`);
                return result[0] || null;
            },
            async upsert(data) {
                const result = await fetchSupabase('agent_files?on_conflict=user_id,path', {
                    method: 'POST',
                    headers: { 'Prefer': 'resolution=merge-duplicates' },
                    body: JSON.stringify(data)
                });
                return result[0];
            }
        },

        AgentTickets: {
            async create(data) {
                const result = await fetchSupabase('agent_tickets', {
                    method: 'POST',
                    body: JSON.stringify(data)
                });
                return result[0];
            }
        },

        AgentTasks: {
            async list(meetingId) {
                let url = `agent_tasks?select=*&order=created_at.desc`;
                if (meetingId) {
                    url += `&meeting_id=eq.${meetingId}`;
                }
                return fetchSupabase(url);
            },
            async create(data) {
                const result = await fetchSupabase('agent_tasks', {
                    method: 'POST',
                    body: JSON.stringify(data)
                });
                return result[0];
            },
            async update(id, data) {
                const result = await fetchSupabase(`agent_tasks?id=eq.${id}`, {
                    method: 'PATCH',
                    body: JSON.stringify(data)
                });
                return result[0];
            }
        },

        AgentConfigs: {
            async get(agentId, key) {
                const result = await fetchSupabase(`agent_configs?agent_id=eq.${agentId}&key=eq.${key}&select=value`);
                return result[0] ? result[0].value : null;
            },
            async list(agentId = null) {
                let url = `agent_configs?select=agent_id,key,value`;
                if (agentId) {
                    url += `&agent_id=eq.${agentId}`;
                }
                const result = await fetchSupabase(url);
                return result || [];
            },
            async upsert(agentId, key, value) {
                const result = await fetchSupabase('agent_configs?on_conflict=agent_id,key', {
                    method: 'POST',
                    headers: { 'Prefer': 'resolution=merge-duplicates' },
                    body: JSON.stringify({ agent_id: agentId, key, value })
                });
                return result[0];
            }
        },

        CompanyKnowledge: {
            async get(key) {
                const result = await fetchSupabase(`company_knowledge?key=eq.${key}&select=*`);
                return result[0] || null;
            },
            async list(category) {
                let url = `company_knowledge?select=*`;
                if (category) {
                    url += `&category=eq.${category}`;
                }
                return fetchSupabase(url);
            },
            async upsert(data) {
                const result = await fetchSupabase('company_knowledge?on_conflict=key', {
                    method: 'POST',
                    headers: { 'Prefer': 'resolution=merge-duplicates' },
                    body: JSON.stringify(data)
                });
                return result[0];
            },
            async delete(key) {
                await fetchSupabase(`company_knowledge?key=eq.${key}`, {
                    method: 'DELETE'
                });
            }
        },

        Query: {
            // Placeholder for custom queries if needed
            async execute(query) {
                // RPC calls also via fetch
                const result = await fetchSupabase(`rpc/${query.name}`, {
                    method: 'POST',
                    body: JSON.stringify(query.params)
                });
                return result;
            }
        },

        AgentApprovals: {
            async create(data) {
                const result = await fetchSupabase('agent_approvals', {
                    method: 'POST',
                    body: JSON.stringify(data)
                });
                return result[0];
            },
            async update(id, data) {
                const result = await fetchSupabase(`agent_approvals?id=eq.${id}`, {
                    method: 'PATCH',
                    body: JSON.stringify(data)
                });
                return result[0];
            },
            async get(id) {
                const result = await fetchSupabase(`agent_approvals?id=eq.${id}&select=*`);
                return result[0];
            },
            async list(userId) {
                return fetchSupabase(`agent_approvals?user_id=eq.${userId}&status=eq.pending&order=created_at.desc`);
            }
        },

        AgentLogs: {
            async create(data) {
                const result = await fetchSupabase('agent_logs', {
                    method: 'POST',
                    body: JSON.stringify(data)
                });
                return result[0];
            }
        }
    },

    auth: {
        async me() {
            const token = getAccessToken();
            if (!token) return null;
            try {
                const user = await fetchAuth('user');
                return user;
            } catch (e) {
                console.warn("me() failed", e);
                setSession(null); // Clear invalid token
                return null;
            }
        },

        async isAuthenticated() {
            return !!getAccessToken();
        },

        redirectToLogin(returnUrl) {
            const url = returnUrl || window.location.pathname
            window.location.href = `/login?returnUrl=${encodeURIComponent(url)}`
        },

        async logout(returnUrl) {
            try {
                await fetchAuth('logout', { method: 'POST' });
            } catch (e) { console.warn("Logout failed", e); }
            setSession(null);
            notifyAuthListeners('SIGNED_OUT', null);
            if (returnUrl) {
                window.location.href = returnUrl
            } else {
                window.location.href = '/'
            }
        },

        async signUp(email, password, metadata = {}) {
            const data = await fetchAuth('signup', {
                method: 'POST',
                body: JSON.stringify({
                    email,
                    password,
                    data: metadata
                })
            });
            // SignUp might return session if auto-confirm is on, or just user
            if (data.session) {
                setSession(data.session);
                notifyAuthListeners('SIGNED_IN', data.session);
            }
            return { user: data.user, session: data.session };
        },

        async signIn(email, password) {
            const data = await fetchAuth('token?grant_type=password', {
                method: 'POST',
                body: JSON.stringify({
                    email,
                    password
                })
            });
            setSession(data);
            notifyAuthListeners('SIGNED_IN', data);
            return { user: data.user, session: data };
        },

        async signInWithOAuth(provider, options = {}) {
            // OAuth is harder with REST as it involves redirects.
            // For now, we can try to construct the URL manually or warn.
            // Supabase URL: /auth/v1/authorize?provider=google&redirect_to=...
            const redirectTo = options.redirectTo || window.location.origin;
            const url = `${supabaseUrl}/auth/v1/authorize?provider=${provider}&redirect_to=${encodeURIComponent(redirectTo)}`;
            window.location.href = url;
            // We can't return data here as it redirects.
        },

        async updateMe(data) {
            const result = await fetchAuth('user', {
                method: 'PUT',
                body: JSON.stringify({ data })
            });
            return result;
        },

        onAuthStateChange(callback) {
            authListeners.add(callback);
            return { data: { subscription: { unsubscribe: () => authListeners.delete(callback) } } };
        },

        setSession(session) {
            setSession(session);
            notifyAuthListeners('SIGNED_IN', session);
        }
    },

    functions: {
        async invoke(functionName, params) {
            // Functions are usually at a different URL, but often proxied.
            // Standard Supabase functions URL: https://<project>.supabase.co/functions/v1/<function>
            const url = `${supabaseUrl}/functions/v1/${functionName}`;
            const token = getAccessToken();
            const headers = {
                'Authorization': `Bearer ${token || supabaseAnonKey}`,
                'Content-Type': 'application/json'
            };

            const response = await fetch(url, {
                method: 'POST',
                headers,
                body: JSON.stringify(params)
            });

            if (!response.ok) {
                const text = await response.text();
                throw new Error(`Function Error: ${response.status} ${text}`);
            }

            const data = await response.json();
            return { data };
        }
    },

    integrations: {
        Core: {
            InvokeLLM: async () => { console.warn('InvokeLLM not implemented'); return {}; },
            SendEmail: async () => { console.warn('SendEmail not implemented'); return {}; },
            SendSMS: async () => { console.warn('SendSMS not implemented'); return {}; },
            UploadFile: async ({ file }) => {
                if (!file) throw new Error('No file provided');

                const fileName = `${Date.now()}_${file.name}`;
                const token = getAccessToken();
                const headers = {
                    'Authorization': `Bearer ${token || supabaseAnonKey}`,
                    'apikey': supabaseAnonKey
                };

                // 1. Upload
                const uploadUrl = `${supabaseUrl}/storage/v1/object/uploads/${fileName}`;
                const uploadRes = await fetch(uploadUrl, {
                    method: 'POST',
                    headers,
                    body: file
                });

                if (!uploadRes.ok) throw new Error('Upload failed');

                // 2. Get Public URL
                // Storage public URLs are usually: https://<project>.supabase.co/storage/v1/object/public/<bucket>/<file>
                const publicUrl = `${supabaseUrl}/storage/v1/object/public/uploads/${fileName}`;

                return { file_url: publicUrl };
            },
            GenerateImage: async () => { console.warn('GenerateImage not implemented'); return {}; },
            ExtractDataFromUploadedFile: async () => { console.warn('ExtractDataFromUploadedFile not implemented'); return {}; }
        }
    },

    appLogs: {
        async logUserInApp(pageName) {
            // Optional: implement app logging if needed
            console.log('User navigated to:', pageName)
        }
    },

    // For service role operations (admin)
    asServiceRole: {
        entities: {
            ServiceProvider: {
                async filter(filters) {
                    // Use service role key for admin operations
                    // For now, use same as regular
                    return supabaseHelpers.entities.ServiceProvider.filter(filters)
                },
                async bulkCreate(items) {
                    return supabaseHelpers.entities.ServiceProvider.bulkCreate(items)
                }
            }
        }
    }
}

// Export db object with all helpers
export const db = supabaseHelpers

// Export supabaseAdmin for AdminImporter
export const supabaseAdmin = supabaseHelpers.asServiceRole

// Export REAL Supabase client for Realtime and standard usage
export const realSupabase = createClient(supabaseUrl, supabaseAnonKey);

// Default export
export default supabase
