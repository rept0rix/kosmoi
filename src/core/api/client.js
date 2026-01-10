import { createClient } from '@supabase/supabase-js';

class APIClient {
    constructor() {
        this.supabaseUrl = (typeof process !== "undefined" && process.env ? process.env : import.meta.env).VITE_SUPABASE_URL;
        this.supabaseKey = (typeof process !== "undefined" && process.env ? process.env : import.meta.env).VITE_SUPABASE_ANON_KEY;

        if (!this.supabaseUrl || !this.supabaseKey) {
            console.error('CRITICAL: Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Supabase client will not initialize.');
            console.log('APIClient: Initializing MOCK Supabase client.');
            // Return a mock or null to prevent app crash during module load
            // Recursive mock to handle any chain depth
            const mockResult = { data: null, error: { message: 'Supabase not initialized (Missing Env Vars)' } };
            const createMock = () => new Proxy(() => { }, {
                get: (target, prop) => {
                    if (prop === 'then') return (resolve) => resolve(mockResult);
                    return createMock();
                },
                apply: (target, thisArg, args) => createMock()
            });

            this.supabase = {
                from: () => createMock(),
                auth: {
                    getSession: async () => ({ data: { session: null } }),
                    getUser: async () => ({ data: { user: null } }),
                    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => { } } } })
                },
                storage: { from: () => createMock() },
                functions: { invoke: async () => ({ error: 'No functions' }) },
                channel: () => ({ on: () => ({ subscribe: () => { } }) }),
                rpc: async () => ({ data: null, error: { message: 'RPC not available (Missing Env Vars)' } })
            };
        } else {
            console.log('APIClient: Initializing REAL Supabase client with URL:', this.supabaseUrl);
            this.supabase = createClient(this.supabaseUrl, this.supabaseKey, {
                auth: {
                    persistSession: true,
                    autoRefreshToken: true,
                    detectSessionInUrl: true, // Enabled to allow OAuth hash parsing
                    storageKey: 'supabase.auth.token.v2', // Explicit key to avoid conflicts
                    storage: typeof window !== 'undefined' ? window.localStorage : undefined
                },
                realtime: {
                    params: {
                        eventsPerSecond: 10,
                    },
                    heartbeatIntervalMs: 30000,
                },
                db: {
                    schema: 'public',
                },
                // Global fetch retry policy
                global: {
                    fetch: (url, options) => {
                        return fetch(url, { ...options, cache: 'no-store' }); // Prevent stale cache
                    }
                }
            });
        }
        this.cache = new Map();
        this.listeners = new Map();
    }

    // Unified request method
    async request(config) {
        const { method = 'GET', table, data, filters, options = {} } = config;
        const cacheKey = this.getCacheKey(config);

        if (method === 'GET' && this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        // Basic retry logic tailored for unstable networks
        let lastError;
        for (let i = 0; i < 3; i++) {
            try {
                const result = await this._executeRequest(config);
                if (method === 'GET') {
                    this.cache.set(cacheKey, result);
                }
                if (method !== 'GET') {
                    this.notify(table, 'updated', result);
                }
                return result;
            } catch (error) {
                lastError = error;
                console.warn(`API attempt ${i + 1} failed:`, error);
                if (i < 2) await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
            }
        }
        throw lastError;
    }

    async _executeRequest(config) {
        const { method, table, data, filters, options } = config;

        let query = this.supabase.from(table);

        switch (method) {
            case 'GET':
                query = query.select(options.select || '*');
                if (filters) {
                    Object.entries(filters).forEach(([key, value]) => {
                        query = query.eq(key, value);
                    });
                }
                break;
            case 'POST':
                query = query.insert(data).select();
                break;
            case 'PUT':
            case 'PATCH':
                // Assuming update requires an Update ID in filters or options
                query = query.update(data).select();
                if (filters) {
                    Object.entries(filters).forEach(([key, value]) => {
                        query = query.eq(key, value);
                    });
                }
                break;
            case 'DELETE':
                query = query.delete();
                if (filters) {
                    Object.entries(filters).forEach(([key, value]) => {
                        query = query.eq(key, value);
                    });
                }
                break;
        }

        const { data: resultData, error } = await query;
        if (error) {
            throw new Error(error.message);
        }
        return resultData;
    }

    getCacheKey(config) {
        return JSON.stringify(config);
    }

    subscribe(table, callback) {
        if (!this.listeners.has(table)) {
            this.listeners.set(table, []);
        }
        this.listeners.get(table).push(callback);

        // Setup Supabase Realtime subscription if not already exists (optimization for later)
    }

    notify(table, event, data) {
        this.listeners.get(table)?.forEach(cb => cb(event, data));
    }

    // Direct access for edge cases
    get client() {
        return this.supabase;
    }
}

export const api = new APIClient();
