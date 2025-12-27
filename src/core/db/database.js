import { createDatabase, DB_NAME } from './rxdb-config';
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
    async get() {
        // Initialize Debug Logs Global
        // @ts-ignore
        if (!window.__DB_LOGS__) {
            // @ts-ignore
            window.__DB_LOGS__ = [];
        }
        const log = (msg) => {
            const entry = `[${new Date().toISOString().split('T')[1].slice(0, -1)}] ${msg}`;
            // @ts-ignore
            window.__DB_LOGS__.push(entry);
            console.log(entry); // Keep console log just in case
        };

        const reqId = Math.random().toString(36).substring(7);
        log(`[${reqId}] DatabaseService.get() called`);

        // Check window global first
        // @ts-ignore
        if (window['__KOSMOI_DB_PROMISE__']) {
            log(`[${reqId}] Returning existing global promise`);
            // @ts-ignore
            return window['__KOSMOI_DB_PROMISE__'];
        }

        log(`[${reqId}] Initializing RxDB (${DB_NAME})...`);

        // Start creation and assign to window immediately to block race conditions
        const promise = (async () => {
            let db; // Hoisted for error recovery
            try {
                if (typeof createDatabase !== 'function') {
                    throw new Error("createDatabase is not a function.");
                }

                log(`[${reqId}] Calling createDatabase()...`);
                // Assume createDatabase is safe or throws fatal error (if fatal, we can't recover anyway)
                db = await createDatabase();

                // Tag the DB instance to see if we get duplicates
                // @ts-ignore
                if (!db._debug_id) db._debug_id = Math.random().toString(36).substring(7);
                // @ts-ignore
                log(`[${reqId}] DB Created: ${db.name} (ID: ${db._debug_id})`);

                // Mutex Lock
                // @ts-ignore
                if (!db['_kosmoi_collections_promise']) {
                    log(`[${reqId}] Mutex not found. Creating Mutex...`);
                    // @ts-ignore
                    db['_kosmoi_collections_promise'] = (async () => {
                        log(`[${reqId}] [Mutex] STARTING EXCLUSIVE LOCK`);
                        try {
                            // Define desired collections
                            // @ts-ignore
                            const collectionDefinitions = {
                                vendors: {
                                    schema: vendorSchema,
                                    migrationStrategies: { 1: (oldDoc) => oldDoc }
                                },
                                tasks: {
                                    schema: taskSchema,
                                    migrationStrategies: { 1: (oldDoc) => oldDoc }
                                },
                                contacts: { schema: contactSchema },
                                stages: { schema: stageSchema }
                            };

                            // Filter out collections that already exist (Double check)
                            const collectionsToAdd = {};
                            const existingCollections = Object.keys(db.collections || {});
                            log(`[${reqId}] [Mutex] Existing: ${JSON.stringify(existingCollections)}`);

                            Object.keys(collectionDefinitions).forEach(name => {
                                if (!existingCollections.includes(name)) {
                                    collectionsToAdd[name] = collectionDefinitions[name];
                                }
                            });

                            const keysToAdd = Object.keys(collectionsToAdd);
                            log(`[${reqId}] [Mutex] To Add: ${JSON.stringify(keysToAdd)}`);

                            if (keysToAdd.length > 0) {
                                log(`[${reqId}] [Mutex] Calling addCollections...`);
                                await db.addCollections(collectionsToAdd);
                                log(`[${reqId}] [Mutex] addCollections SUCCESS`);
                            } else {
                                log(`[${reqId}] [Mutex] Skipping (Empty list).`);
                            }
                        } catch (err) {
                            log(`[${reqId}] [Mutex] ERROR (Swallowed): ${err.message}`);
                            // ERROR MIGHT BUBBLE HERE IF NESTED PROMISE REJECTS
                            throw err;
                        }
                    })();
                } else {
                    log(`[${reqId}] Mutex found. Waiting...`);
                }

                // Wait for the exclusive promise to complete
                await db['_kosmoi_collections_promise'];
                log(`[${reqId}] Mutex released. Starting replication (Disabled).`);

                // Start Replication
                const logError = (context, err) => console.error(`[Replication Error] ${context}:`, err);

                // TEMPORARILY DISABLED TO STOP NETWORK FLOOD
                /*
                if (db.vendors) replicateCollection(db.vendors, 'service_providers').catch(err => logError('vendors', err));
                else log(`[${reqId}] ERROR: db.vendors MISSING after init!`);

                if (db.tasks) replicateCollection(db.tasks, 'agent_tasks').catch(err => logError('tasks', err));
                if (db.contacts) replicateCollection(db.contacts, 'crm_leads').catch(err => logError('contacts', err));
                if (db.stages) replicateCollection(db.stages, 'crm_stages').catch(err => logError('stages', err));
                */
                log(`[${reqId}] Replication TEMPORARILY DISABLED for stability check.`);

                return db;
            } catch (err) {
                // SPECIAL HANDLER FOR DB9 (Collection already exists)
                // If we get DB9, it usually means the database instance is ALREADY ALIVE in memory
                // either from HMR (Hot Module Replacement) or a race condition.
                // We typically find it in window.db (if in dev mode) or we can try to return the existing global promise result.

                if (err?.code === 'DB9' || err?.message?.includes('DB9')) {
                    log(`[${reqId}] CAUGHT DB9 ERROR. Attempting recovery...`);

                    // 1. Try variable from scope (if set before error)
                    if (db) {
                        console.warn("Recovering from DB9: Using local instance.");
                        return db;
                    }

                    // 2. Try window.db (Dev Mode helper)
                    // @ts-ignore
                    if (window['db'] && window['db'].name === DB_NAME) {
                        console.warn("Recovering from DB9: Found existing window.db instance.");
                        // @ts-ignore
                        return window['db'];
                    }

                    // 3. Try to await the GLOBAL PROMISE again (maybe it resolved in parallel?)
                    // This creates a circular wait if we aren't careful, but if it resolved elsewhere...
                    // @ts-ignore
                    const existingPromise = window['__KOSMOI_DB_PROMISE__'];
                    if (existingPromise) {
                        console.warn("Recovering from DB9: Awaiting existing global promise...");
                        try {
                            const resolvedDB = await existingPromise;
                            if (resolvedDB) return resolvedDB;
                        } catch (e) {
                            console.error("Recovery failed: Existing promise also rejected.", e);
                        }
                    }

                    // 4. Last Resort: Just return "true" or a dummy if we can't get the object? 
                    // No, app needs the object to run queries. 
                    // If we are here, we are truly stuck without a reference.
                    console.error("Recovery failed: Could not find ANY reference to the existing DB.");
                }

                log(`[${reqId}] CRITICAL FAIL: ${err.message}`);
                console.error(`[DB_DEBUG][${reqId}] Critical Failed`, err);

                // Only nullify if we truly failed. If we recovered, we wouldn't be here.
                window['__KOSMOI_DB_PROMISE__'] = null;
                throw err;
            }
        })();

        window['__KOSMOI_DB_PROMISE__'] = promise;
        return promise;
    },

    reset: () => {
        window['__KOSMOI_DB_PROMISE__'] = null;
    },

    destroy: async () => {
        console.warn("DatabaseService: DESTROYING DATABASE...");
        const currentPromise = window['__KOSMOI_DB_PROMISE__'];
        if (currentPromise) {
            try {
                const db = await currentPromise;
                if (db && !db.destroyed) {
                    await db.destroy();
                }
            } catch (err) { }
            window['__KOSMOI_DB_PROMISE__'] = null;
        }

        try {
            const { storage } = await import('./rxdb-config');
            await removeRxDatabase(DB_NAME, storage);
            return true;
        } catch (e) {
            console.error("DatabaseService: Failed to destroy DB", e);
            throw e;
        }
    }
};
