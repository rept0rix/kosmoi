import { createDatabase, DB_NAME, storage } from './rxdb-config';
import { vendorSchema } from './schemas/vendor.schema';
import { taskSchema } from './schemas/task.schema';
import { contactSchema } from './schemas/contact.schema';
import { stageSchema } from './schemas/stage.schema';
import { replicateCollection } from './replication';

import { removeRxDatabase } from 'rxdb';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';

// True Global Singleton Service
// This ensures that even if this module is imported multiple times (e.g. via different paths),
// we only ever have ONE active database creation promise.

export const DatabaseService = {
    // STRICT MUTEX LOCK
    // This ensures that even if 10 components ask for DB at once, we only init ONCE.
    _isInitializing: false,
    _initPromise: null,

    async get(retryCount = 0) {
        // 1. If we already have a valid global promise, return it (Fast Path)
        // @ts-ignore
        if (window['__KOSMOI_DB_PROMISE__'] && !window['__KOSMOI_DB_RECOVERING__']) {
            // @ts-ignore
            return window['__KOSMOI_DB_PROMISE__'];
        }

        // 2. If initialization is already in progress, wait for it (Queueing)
        if (this._isInitializing && this._initPromise) {
            console.log(`[DatabaseService] Waiting for existing initialization...`);
            return this._initPromise;
        }

        // 3. START INITIALIZATION (Critical Section)
        this._isInitializing = true;
        const reqId = Math.random().toString(36).substring(7);
        console.log(`[${reqId}] DatabaseService: Starting Exclusive Initialization...`);

        this._initPromise = (async () => {
            try {
                // @ts-ignore
                if (window['__KOSMOI_DB_RECOVERING__']) {
                    throw new Error("System is in Recovery Mode. Please Wait.");
                }

                // FORCE TIMEOUT on createDatabase
                const createWithTimeout = Promise.race([
                    createDatabase(),
                    new Promise((_, reject) =>
                        setTimeout(() => reject(new Error('DB_INIT_TIMEOUT: createDatabase took > 15000ms')), 15000)
                    )
                ]);

                // @ts-ignore
                const db = await createWithTimeout;

                // Tag and Log
                // @ts-ignore
                if (!db._debug_id) db._debug_id = Math.random().toString(36).substring(7);
                // @ts-ignore
                console.log(`[${reqId}] DB Created: ${db.name} (ID: ${db._debug_id})`);

                // Setup Collections (Idempotent)
                await this._setupCollections(db, reqId);

                // Persist Global Handle
                // @ts-ignore
                window['__KOSMOI_DB_PROMISE__'] = Promise.resolve(db);
                return db;

            } catch (err) {
                console.error(`[${reqId}] DB Init Failed:`, err);

                // HANDLE CRITICAL ERRORS (DB9 / Timeout)
                const isDB9 = err?.code === 'DB9' || err?.message?.includes('DB9');
                const isTimeout = err?.message?.includes('DB_INIT_TIMEOUT');

                if (isDB9 || isTimeout) {
                    return await this._handleRecovery(reqId, retryCount);
                }

                throw err;
            } finally {
                // Release Lock
                this._isInitializing = false;
                this._initPromise = null;
            }
        })();

        return this._initPromise;
    },

    // Extracted Collection Setup to keep get() clean
    async _setupCollections(db, reqId) {
        // @ts-ignore
        if (db['_kosmoi_collections_promise']) return db['_kosmoi_collections_promise'];

        // @ts-ignore
        db['_kosmoi_collections_promise'] = (async () => {
            // @ts-ignore
            const collectionDefinitions = {
                vendors: { schema: vendorSchema },
                tasks: { schema: taskSchema },
                contacts: { schema: contactSchema },
                stages: { schema: stageSchema }
            };

            const existingCollections = Object.keys(db.collections || {});
            // @ts-ignore
            const collectionsToAdd = {};

            Object.keys(collectionDefinitions).forEach(name => {
                if (!existingCollections.includes(name)) {
                    // @ts-ignore
                    collectionsToAdd[name] = collectionDefinitions[name];
                }
            });

            if (Object.keys(collectionsToAdd).length > 0) {
                // @ts-ignore
                await db.addCollections(collectionsToAdd);
                console.log(`[${reqId}] Collections Added.`);
            }
        })();

        // @ts-ignore
        return db['_kosmoi_collections_promise'];
    },

    // Strict Serialized Recovery Logic
    async _handleRecovery(reqId, retryCount) {
        if (retryCount >= 3) {
            console.error(`[${reqId}] Max Retries Reached. Returning MOCK DB.`);
            return {
                name: DB_NAME,
                collections: {},
                // @ts-ignore
                addCollections: async () => { },
                // @ts-ignore
                destroy: async () => { },
                // @ts-ignore
                $: { subscribe: () => { } },
                _isFallback: true
            };
        }

        console.warn(`[${reqId}] RECOVERY MODE TRIGGERED (Attempt ${retryCount + 1})`);
        // @ts-ignore
        window['__KOSMOI_DB_PROMISE__'] = null;
        // @ts-ignore
        window['__KOSMOI_DB_RECOVERING__'] = true;

        try {
            // 1. Remove RxDB
            try { await removeRxDatabase(DB_NAME, storage); } catch (e) { }

            // 2. Kill Service Workers
            if ('serviceWorker' in navigator) {
                const regs = await navigator.serviceWorker.getRegistrations();
                for (const reg of regs) await reg.unregister();
            }

            // 3. Nuke IDB
            await new Promise((resolve) => {
                const req = window.indexedDB.deleteDatabase(DB_NAME);
                // @ts-ignore
                req.onsuccess = resolve;
                // @ts-ignore
                req.onerror = resolve;
                // @ts-ignore
                req.onblocked = resolve;
                setTimeout(resolve, 3000);
            });

            console.log(`[${reqId}] Recovery Complete. Retrying...`);
            // @ts-ignore
            window['__KOSMOI_DB_RECOVERING__'] = false;

            // Retry (will require acquiring the lock again if released, 
            // but since we are inside the 'initPromise' stack, we just recurse logic)
            // But strictness says we should call get() again which handles the lock.
            // However, we are ALREADY holding the lock in the entry point.
            // So we can't call get() or we deadlock if we logic wasn't careful.
            // But our get() checks _isInitializing.
            // Actually, we are IN the promise that _initPromise points to.
            // So calling get() would return... US! (Deadlock waiting for self)

            // FIX: We must NOT call get() recursively if it checks for existing promise.
            // We should recursively calling the INTERNAL logic or just reset state?

            // Better: Release the lock for a split second? No, race condition.

            // Solution: We manually reset the lock flags before calling recursive get,
            // essentially "passing the torch" to the new attempt.
            this._isInitializing = false;
            this._initPromise = null;
            return this.get(retryCount + 1);

        } catch (err) {
            console.error("Recovery Failed", err);
            // @ts-ignore
            window['__KOSMOI_DB_RECOVERING__'] = false;
            throw err;
        }
    },

    reset: () => {
        // @ts-ignore
        window['__KOSMOI_DB_PROMISE__'] = null;
    },

    destroy: async () => {
        console.warn("DatabaseService: DESTROYING DATABASE...");
        // @ts-ignore
        const currentPromise = window['__KOSMOI_DB_PROMISE__'];
        if (currentPromise) {
            try {
                const db = await currentPromise;
                if (db && !db.destroyed) {
                    await db.destroy();
                }
            } catch (err) { }
            // @ts-ignore
            window['__KOSMOI_DB_PROMISE__'] = null;
        }

        try {
            await removeRxDatabase(DB_NAME, storage);
            return true;
        } catch (e) {
            console.error("DatabaseService: Failed to destroy DB", e);
            throw e;
        }
    }
};
