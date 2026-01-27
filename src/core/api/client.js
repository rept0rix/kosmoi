import { createClient } from "@supabase/supabase-js";

console.log("[Client.js] Module initializing...");

class APIClient {
  constructor() {
    console.log("[Client.js] Constructor called");
    try {
      this.supabaseUrl = (
        typeof process !== "undefined" && process.env
          ? process.env
          : import.meta.env
      ).VITE_SUPABASE_URL;
      this.supabaseKey = (
        typeof process !== "undefined" && process.env
          ? process.env
          : import.meta.env
      ).VITE_SUPABASE_ANON_KEY;
    } catch (e) {
      console.error("[Client.js] Error accessing env vars:", e);
      this.supabaseUrl = null;
      this.supabaseKey = null;
    }

    if (!this.supabaseUrl || !this.supabaseKey) {
      console.error(
        "CRITICAL: Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Supabase client will not initialize.",
      );
      console.log("APIClient: Initializing MOCK Supabase client.");
      // Return a mock or null to prevent app crash during module load
      // Recursive mock to handle any chain depth
      const mockResult = {
        data: null,
        error: { message: "Supabase not initialized (Missing Env Vars)" },
      };

      const createMock = () =>
        new Proxy(() => {}, {
          get: (target, prop) => {
            if (prop === "then") return (resolve) => resolve(mockResult);
            return createMock();
          },
          apply: (target, thisArg, args) => createMock(),
        });

      const mockChannel = {
        topic: "mock",
        params: {},
        socket: {},
        bindings: {},
        state: "joined",
        push: () => {},
        clean: () => {},
        join: () => {},
        leave: () => {},
        track: () => {},
        on: (event, filter, callback) => mockChannel,
        subscribe: (callback) => mockChannel, // Return channel for chaining (Supabase v2 style)
        unsubscribe: () => {},
        send: () => {},
      };

      this.supabase = {
        from: () => createMock(),
        auth: {
          getSession: async () => ({ data: { session: null }, error: null }),
          getUser: async () => ({ data: { user: null }, error: null }),
          signUp: async () => ({
            data: { user: null, session: null },
            error: null,
          }),
          signInWithPassword: async () => ({
            data: { user: null, session: null },
            error: null,
          }),
          signInWithOAuth: async () => ({
            data: { provider: "", url: "" },
            error: null,
          }),
          signOut: async () => ({ error: null }),
          updateUser: async () => ({ data: { user: null }, error: null }),
          resetPasswordForEmail: async () => ({ data: {}, error: null }),
          setSession: async () => ({ data: { session: null }, error: null }),
          onAuthStateChange: () => ({
            data: { subscription: { unsubscribe: () => {} } },
          }),
        },
        storage: { from: () => createMock() },
        functions: { invoke: async () => ({ data: null, error: null }) },
        channel: () => mockChannel,
        removeChannel: async () => "ok",
        removeAllChannels: async () => "ok",
        getChannels: () => [mockChannel],
        rpc: async () => ({
          data: null,
          error: { message: "RPC not available (Missing Env Vars)" },
        }),
      };
    } else {
      console.log(
        "APIClient: Initializing REAL Supabase client with URL:",
        this.supabaseUrl,
      );
      try {
        this.supabase = createClient(this.supabaseUrl, this.supabaseKey, {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true, // Enabled to allow OAuth hash parsing
            storageKey: "supabase.auth.token.v2", // Explicit key to avoid conflicts
            storage:
              typeof window !== "undefined" ? window.localStorage : undefined,
          },
          realtime: {
            params: {
              eventsPerSecond: 10,
            },
            heartbeatIntervalMs: 30000,
          },
          db: {
            schema: "public",
          },
          // Global fetch retry policy
          global: {
            fetch: (url, options) => {
              return fetch(url, { ...options, cache: "no-store" }); // Prevent stale cache
            },
          },
        });
      } catch (err) {
        console.error("[Client.js] CRASH in createClient:", err);
        // Prevent module failure
        this.supabase = {}; // Dangerously simple fallback
      }
    }
    this.cache = new Map();
    this.listeners = new Map();
    this.inFlight = new Map(); // For request deduplication
  }

  // Cache Management
  invalidate(table) {
    console.log(`[APIClient] Invalidating cache for table: ${table}`);
    for (const [key, value] of this.cache.entries()) {
      if (key.includes(`"table":"${table}"`)) {
        this.cache.delete(key);
      }
    }
  }

  clearCache() {
    console.log("[APIClient] Clearing all cache");
    this.cache.clear();
  }

  // Unified request method
  async request(config) {
    const { method = "GET", table, data, filters, options = {} } = config;
    const cacheKey = this.getCacheKey(config);

    // 1. Cache Check (GET only)
    if (method === "GET" && this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    // 2. Request Deduplication (GET only)
    if (method === "GET" && this.inFlight.has(cacheKey)) {
      return this.inFlight.get(cacheKey);
    }

    // 3. Mutation Safety Check
    if (["PUT", "PATCH", "DELETE"].includes(method.toUpperCase())) {
      if (!filters || Object.keys(filters).length === 0) {
        throw new Error(
          `UNSAFE_MUTATION: ${method} operation on table '${table}' requires filters to prevent full-table impact.`,
        );
      }
    }

    // 4. Execution with Retry & Timeout
    const execute = async () => {
      let lastError;
      for (let i = 0; i < 3; i++) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s Timeout

          const result = await this._executeRequest({
            ...config,
            abortSignal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (method === "GET") {
            this.cache.set(cacheKey, result);
          } else {
            // Auto-invalidate table if it was a mutation
            this.invalidate(table);
            this.notify(table, "updated", result);
          }
          return result;
        } catch (error) {
          lastError = error;
          if (error.name === "AbortError") {
            console.error(`[APIClient] Request timed out on attempt ${i + 1}`);
          }
          console.warn(`[APIClient] Attempt ${i + 1} failed:`, error.message);
          if (i < 2)
            await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
        }
      }
      throw lastError;
    };

    if (method === "GET") {
      const promise = execute().finally(() => this.inFlight.delete(cacheKey));
      this.inFlight.set(cacheKey, promise);
      return promise;
    }

    return execute();
  }

  async _executeRequest(config) {
    const { method, table, data, filters, options, abortSignal } = config;

    // Ensure we are not using a mock if filters are missing for dangerous ops
    let query = this.supabase.from(table);

    switch (method.toUpperCase()) {
      case "GET":
        query = query.select(options.select || "*");
        if (filters) {
          Object.entries(filters).forEach(([key, value]) => {
            query = query.eq(key, value);
          });
        }
        if (options.limit) query = query.limit(options.limit);
        if (options.order)
          query = query.order(options.order.column, {
            ascending: options.order.ascending,
          });
        break;
      case "POST":
        query = query.insert(data).select();
        break;
      case "PUT":
      case "PATCH":
        query = query.update(data).select();
        if (filters) {
          Object.entries(filters).forEach(([key, value]) => {
            query = query.eq(key, value);
          });
        }
        break;
      case "DELETE":
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
    // Avoid circular refs or heavy objects in key
    const { method, table, filters, options } = config;
    return JSON.stringify({ method, table, filters, options });
  }

  subscribe(table, callback) {
    if (!this.listeners.has(table)) {
      this.listeners.set(table, []);
    }
    this.listeners.get(table).push(callback);

    // Setup Supabase Realtime subscription if not already exists (optimization for later)
  }

  notify(table, event, data) {
    this.listeners.get(table)?.forEach((cb) => cb(event, data));
  }

  // Direct access for edge cases
  get client() {
    return this.supabase;
  }
}

export const api = new APIClient();
export default api;
