import { api } from '../core/api/client.js';

// 1. Initialize official Client using the Singleton from Core
export const supabase = api.client;

// 2. Helper Implementation using the SDK
export const supabaseHelpers = {
    entities: {
        ServiceProvider: {
            async filter(filters = {}) {
                let query = supabase.from('service_providers').select('*');
                if (filters.status) query = query.eq('status', filters.status);
                if (filters.verified !== undefined) query = query.eq('verified', filters.verified);
                if (filters.super_category) query = query.eq('super_category', filters.super_category);
                if (filters.sub_category) query = query.eq('sub_category', filters.sub_category);
                if (filters.category) query = query.eq('category', filters.category);
                if (filters.id) query = query.eq('id', filters.id);
                if (filters.google_place_id) query = query.eq('google_place_id', filters.google_place_id);
                if (filters.created_by) query = query.eq('created_by', filters.created_by);

                const { data, error } = await query;

                if (error) throw error;
                return data;
            },

            async list(orderBy = '-created_at', limit) {
                let query = supabase.from('service_providers').select('*');
                if (orderBy) {
                    const desc = orderBy.startsWith('-');
                    const field = desc ? orderBy.slice(1) : orderBy;
                    query = query.order(field, { ascending: !desc });
                }
                if (limit) query = query.limit(limit);
                const { data, error } = await query;
                if (error) throw error;
                return data;
            },

            async create(data) {
                const { data: res, error } = await supabase.from('service_providers').insert(data).select().single();
                if (error) throw error;
                return res;
            },

            async update(id, data) {
                const { data: res, error } = await supabase.from('service_providers').update(data).eq('id', id).select().single();
                if (error) throw error;
                return res;
            },

            async delete(id) {
                const { error } = await supabase.from('service_providers').delete().eq('id', id);
                if (error) throw error;
            },

            async bulkCreate(items) {
                const { data, error } = await supabase.from('service_providers').insert(items).select();
                if (error) throw error;
                return data;
            }
        },

        Review: {
            async filter(filters = {}) {
                let query = supabase.from('reviews').select('*');
                if (filters.service_provider_id) query = query.eq('service_provider_id', filters.service_provider_id);
                if (filters.user_id) query = query.eq('user_id', filters.user_id);
                if (filters.id) query = query.eq('id', filters.id);
                const { data, error } = await query;
                if (error) throw error;
                return data;
            },

            async list(orderBy = '-created_at', limit) {
                let query = supabase.from('reviews').select('*');
                if (orderBy) {
                    const desc = orderBy.startsWith('-');
                    const field = desc ? orderBy.slice(1) : orderBy;
                    query = query.order(field, { ascending: !desc });
                }
                if (limit) query = query.limit(limit);
                const { data, error } = await query;
                if (error) throw error;
                return data;
            },

            async create(data) {
                const { data: res, error } = await supabase.from('reviews').insert(data).select().single();
                if (error) throw error;
                return res;
            },

            async update(id, data) {
                const { data: res, error } = await supabase.from('reviews').update(data).eq('id', id).select().single();
                if (error) throw error;
                return res;
            },

            async delete(id) {
                const { error } = await supabase.from('reviews').delete().eq('id', id);
                if (error) throw error;
            }
        },

        Favorite: {
            async filter(filters = {}) {
                let query = supabase.from('favorites').select('*');
                if (filters.service_provider_id) query = query.eq('service_provider_id', filters.service_provider_id);
                if (filters.user_id) query = query.eq('user_id', filters.user_id);
                if (filters.id) query = query.eq('id', filters.id);
                const { data, error } = await query;
                if (error) throw error;
                return data;
            },

            async list(orderBy = '-created_at', limit) {
                let query = supabase.from('favorites').select('*');
                if (orderBy) {
                    const desc = orderBy.startsWith('-');
                    const field = desc ? orderBy.slice(1) : orderBy;
                    query = query.order(field, { ascending: !desc });
                }
                if (limit) query = query.limit(limit);
                const { data, error } = await query;
                if (error) throw error;
                return data;
            },

            async create(data) {
                const { data: res, error } = await supabase.from('favorites').insert(data).select().single();
                if (error) throw error;
                return res;
            },

            async delete(id) {
                const { error } = await supabase.from('favorites').delete().eq('id', id);
                if (error) throw error;
            }
        },

        SearchHistory: {
            async filter(filters = {}) {
                let query = supabase.from('search_history').select('*');
                if (filters.user_id) query = query.eq('user_id', filters.user_id);
                if (filters.id) query = query.eq('id', filters.id);
                const { data, error } = await query;
                if (error) throw error;
                return data;
            },

            async list(orderBy = '-created_date', limit) {
                let query = supabase.from('search_history').select('*');
                if (orderBy) {
                    const desc = orderBy.startsWith('-');
                    const field = desc ? orderBy.slice(1) : orderBy; // Note: 'created_date' in db vs 'created_at' usually
                    query = query.order(field, { ascending: !desc });
                }
                if (limit) query = query.limit(limit);
                const { data, error } = await query;
                if (error) throw error;
                return data;
            },

            async create(data) {
                const { data: res, error } = await supabase.from('search_history').insert(data).select().single();
                if (error) throw error;
                return res;
            },

            async delete(id) {
                const { error } = await supabase.from('search_history').delete().eq('id', id);
                if (error) throw error;
            }
        },

        ServiceRequest: {
            async filter(filters = {}) {
                let query = supabase.from('service_requests').select('*');
                if (filters.user_id) query = query.eq('user_id', filters.user_id);
                if (filters.category) query = query.eq('category', filters.category);
                if (filters.status) query = query.eq('status', filters.status);
                if (filters.id) query = query.eq('id', filters.id);
                const { data, error } = await query;
                if (error) throw error;
                return data;
            },

            async list(orderBy = '-created_at', limit) {
                let query = supabase.from('service_requests').select('*');
                if (orderBy) {
                    const desc = orderBy.startsWith('-');
                    const field = desc ? orderBy.slice(1) : orderBy;
                    query = query.order(field, { ascending: !desc });
                }
                if (limit) query = query.limit(limit);
                const { data, error } = await query;
                if (error) throw error;
                return data;
            },

            async create(data) {
                const { data: res, error } = await supabase.from('service_requests').insert(data).select().single();
                if (error) throw error;

                // Sector 4: Ops & Automation Trigger
                // Fire and forget - don't block the UI
                supabase.functions.invoke('automation-proxy', {
                    body: { event: 'NEW_SERVICE_REQUEST', data: res }
                }).catch(err => console.warn('Automation Trigger Failed:', err));

                return res;
            },

            async update(id, data) {
                const { data: res, error } = await supabase.from('service_requests').update(data).eq('id', id).select().single();
                if (error) throw error;
                return res;
            },

            async delete(id) {
                const { error } = await supabase.from('service_requests').delete().eq('id', id);
                if (error) throw error;
            }
        },

        AgentMemory: {
            async get(agentId, userId) {
                const { data, error } = await supabase
                    .from('agent_memory')
                    .select('history')
                    .eq('agent_id', agentId)
                    .eq('user_id', userId)
                    .single();

                if (error && error.code !== 'PGRST116') throw error; // PGRST116 is 'not found'
                return data || null;
            },
            async upsert(data) {
                const { error } = await supabase.from('agent_memory').upsert(data, { onConflict: 'user_id,agent_id' });
                if (error) throw error;
                return null;
            }
        },

        AgentFiles: {
            async list(userId) {
                const { data, error } = await supabase.from('agent_files').select('path,updated_at,agent_id').eq('user_id', userId);
                if (error) throw error;
                return data;
            },
            async get(path, userId) {
                const { data, error } = await supabase.from('agent_files').select('content').eq('user_id', userId).eq('path', path).single();
                if (error && error.code !== 'PGRST116') throw error;
                return data || null;
            },
            async upsert(data) {
                const { data: res, error } = await supabase.from('agent_files').upsert(data, { onConflict: 'user_id,path' }).select().single();
                if (error) throw error;
                return res;
            }
        },

        AgentTickets: {
            async create(data) {
                const { data: res, error } = await supabase.from('agent_tickets').insert(data).select().single();
                if (error) throw error;
                return res;
            }
        },

        AgentTasks: {
            async list(meetingId) {
                let query = supabase.from('agent_tasks').select('*').order('created_at', { ascending: false });
                if (meetingId) {
                    query = query.eq('meeting_id', meetingId);
                }
                const { data, error } = await query;
                if (error) throw error;
                return data;
            },
            async create(data) {
                const { data: res, error } = await supabase.from('agent_tasks').insert(data).select().single();
                if (error) throw error;
                return res;
            },
            async update(id, data) {
                const { data: res, error } = await supabase.from('agent_tasks').update(data).eq('id', id).select().single();
                if (error) throw error;
                return res;
            }
        },

        AgentConfigs: {
            async get(agentId, key) {
                const { data, error } = await supabase
                    .from('agent_configs')
                    .select('value')
                    .eq('agent_id', agentId)
                    .eq('key', key)
                    .single();
                if (error && error.code !== 'PGRST116') throw error;
                return data ? data.value : null;
            },
            async list(agentId = null) {
                let query = supabase.from('agent_configs').select('agent_id,key,value');
                if (agentId) {
                    query = query.eq('agent_id', agentId);
                }
                const { data, error } = await query;
                if (error) throw error;
                return data || [];
            },
            async upsert(agentId, key, value) {
                const { data: res, error } = await supabase.from('agent_configs').upsert({ agent_id: agentId, key, value }, { onConflict: 'agent_id,key' }).select().single();
                if (error) throw error;
                return res;
            }
        },

        CompanyKnowledge: {
            async get(key) {
                const { data, error } = await supabase.from('company_knowledge').select('*').eq('key', key).single();
                if (error && error.code !== 'PGRST116') throw error;
                return data || null;
            },
            async list(category) {
                let query = supabase.from('company_knowledge').select('*');
                if (category) {
                    query = query.eq('category', category);
                }
                const { data, error } = await query;
                if (error) throw error;
                return data;
            },
            async upsert(data) {
                const { data: res, error } = await supabase.from('company_knowledge').upsert(data, { onConflict: 'key' }).select().single();
                if (error) throw error;
                return res;
            },
            async delete(key) {
                const { error } = await supabase.from('company_knowledge').delete().eq('key', key);
                if (error) throw error;
            }
        },

        Query: {
            async execute(query) {
                const { data, error } = await supabase.rpc(query.name, query.params);
                if (error) throw error;
                // RPC returns data directly
                return data;
            }
        },

        AgentApprovals: {
            async create(data) {
                const { data: res, error } = await supabase.from('agent_approvals').insert(data).select().single();
                if (error) throw error;
                return res;
            },
            async update(id, data) {
                const { data: res, error } = await supabase.from('agent_approvals').update(data).eq('id', id).select().single();
                if (error) throw error;
                return res;
            },
            async get(id) {
                const { data, error } = await supabase.from('agent_approvals').select('*').eq('id', id).single();
                if (error) throw error;
                return data;
            },
            async list(userId) {
                const { data, error } = await supabase.from('agent_approvals').select('*').eq('user_id', userId).eq('status', 'pending').order('created_at', { ascending: false });
                if (error) throw error;
                return data;
            }
        },

        AgentLogs: {
            async create(data) {
                const { data: res, error } = await supabase.from('agent_logs').insert(data).select().single();
                if (error) throw error;
                return res;
            }
        }
    },

    auth: {
        async me() {
            // Optimization: Check session first to avoid timeout if clearly not logged in
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return null;

            // Timeout after 3 seconds (increased from 2s)
            const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error("Auth timeout")), 3000));

            try {
                const { data: { user }, error } = await Promise.race([
                    supabase.auth.getUser(),
                    timeout
                ]);

                if (error) {
                    console.warn("me() failed", error);
                    return null;
                }
                return user;
            } catch (error) {
                console.warn("me() check error or timeout:", error);
                return null;
            }
        },

        async isAuthenticated() {
            const { data: { session } } = await supabase.auth.getSession();
            return !!session;
        },

        redirectToLogin(returnUrl) {
            const url = returnUrl || window.location.pathname
            window.location.href = `/login?returnUrl=${encodeURIComponent(url)}`
        },

        async logout(returnUrl) {
            await supabase.auth.signOut();
            if (returnUrl) {
                window.location.href = returnUrl
            } else {
                window.location.href = '/'
            }
        },

        async signUp(email, password, metadata = {}) {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: metadata
                }
            });
            if (error) throw error;
            return data;
        },

        async signIn(email, password) {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });
            if (error) throw error;
            return data;
        },

        async signInWithOAuth(provider, options = {}) {
            const redirectTo = options.redirectTo || window.location.origin;
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider,
                options: {
                    redirectTo
                }
            });
            if (error) throw error;
            return data;
        },

        async updateMe(data) {
            const { data: res, error } = await supabase.auth.updateUser({
                data: data
            });
            if (error) throw error;
            return res;
        },

        onAuthStateChange(callback) {
            return supabase.auth.onAuthStateChange(callback);
        },

        async getUser() {
            return supabase.auth.getUser();
        },

        async getSession() {
            return supabase.auth.getSession();
        },

        // Helper to manually set session if needed (e.g. from tests or URL params)
        async setSession(session) {
            if (!session) {
                return await supabase.auth.signOut();
            } else {
                return await supabase.auth.setSession(session);
            }
        }
    },

    functions: {
        async invoke(functionName, params) {
            const { data, error } = await supabase.functions.invoke(functionName, { body: params });
            if (error) throw error;
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
                const { data, error } = await supabase.storage.from('uploads').upload(fileName, file);

                if (error) throw error;

                const { data: publicData } = supabase.storage.from('uploads').getPublicUrl(fileName);

                return { file_url: publicData.publicUrl };
            },
            GenerateImage: async () => { console.warn('GenerateImage not implemented'); return {}; },
            ExtractDataFromUploadedFile: async () => { console.warn('ExtractDataFromUploadedFile not implemented'); return {}; }
        }
    },

    appLogs: {
        async logUserInApp(pageName) {
            // console.log('User navigated to:', pageName) // Removed for hygiene
        }
    },

    // For service role operations (admin)
    asServiceRole: {
        entities: {
            ServiceProvider: {
                async filter(filters) {
                    return supabaseHelpers.entities.ServiceProvider.filter(filters)
                },
                async bulkCreate(items) {
                    return supabaseHelpers.entities.ServiceProvider.bulkCreate(items)
                }
            }
        }
    }
}

// Export db object with all helpers (Legacy / Custom implementation)
export const db = {
    ...supabaseHelpers,
    from: (table) => supabase.from(table),
    rpc: (fn, args) => supabase.rpc(fn, args),
    storage: supabase.storage,
    channel: (name, config) => supabase.channel(name, config),
    auth: supabaseHelpers.auth || supabase.auth // Use wrapper if exists, fallback to client
};

// Export supabaseAdmin for AdminImporter
export const supabaseAdmin = supabaseHelpers.asServiceRole;

// Backward compatibility for files importing realSupabase
export const realSupabase = supabase;

// Default export
export default supabase;

if (import.meta && import.meta.env && import.meta.env.DEV) {
    // @ts-ignore
    window.supabase = supabase;
    // @ts-ignore
    window.db_admin = db; // Expose the db helper wrapper as db_admin to avoid conflict with RxDB's window.db
}
