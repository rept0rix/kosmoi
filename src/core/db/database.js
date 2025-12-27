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
        const reqId = Math.random().toString(36).substring(7);
        console.log(`[DB_DEBUG][${reqId}] DatabaseService.get() called`);

        // Check window global first
        if (window['__KOSMOI_DB_PROMISE__']) {
            console.log(`[DB_DEBUG][${reqId}] Returning existing global promise`);
            return window['__KOSMOI_DB_PROMISE__'];
        }

        console.log(`[DB_DEBUG][${reqId}] Initializing RxDB (${DB_NAME})...`);

        // Start creation and assign to window immediately to block race conditions
        const promise = (async () => {
            try {
                if (typeof createDatabase !== 'function') {
                    throw new Error("createDatabase is not a function. Check rxdb-config.js export.");
                }

                console.log(`[DB_DEBUG][${reqId}] Calling createDatabase()...`);
                const db = await createDatabase();

                // Tag the DB instance to see if we get duplicates
                if (!db._debug_id) db._debug_id = Math.random().toString(36).substring(7);
                console.log(`[DB_DEBUG][${reqId}] DB Instance created: ${db.name} (InstanceID: ${db._debug_id})`);

                // Mutex Lock
                if (!db['_kosmoi_collections_promise']) {
                    console.log(`[DB_DEBUG][${reqId}] Mutex not found. Creating Mutex...`);
                    db['_kosmoi_collections_promise'] = (async () => {
                        console.log(`[DB_DEBUG][${reqId}] [Mutex] Starting exclusive collection creation...`);

                        // Define desired collections
                        const collectionDefinitions = {
                            vendors: {
                                schema: vendorSchema,
                                migrationStrategies: {
                                    1: (oldDoc) => { return oldDoc; } // Simplified for debug
                                }
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
                        console.log(`[DB_DEBUG][${reqId}] [Mutex] Existing collections:`, existingCollections);

                        Object.keys(collectionDefinitions).forEach(name => {
                            if (!existingCollections.includes(name)) {
                                collectionsToAdd[name] = collectionDefinitions[name];
                            }
                        });

                        const keysToAdd = Object.keys(collectionsToAdd);
                        console.log(`[DB_DEBUG][${reqId}] [Mutex] Collections to add:`, keysToAdd);

                        if (keysToAdd.length > 0) {
                            try {
                                console.log(`[DB_DEBUG][${reqId}] [Mutex] Calling db.addCollections()...`);
                                await db.addCollections(collectionsToAdd);
                                console.log(`[DB_DEBUG][${reqId}] [Mutex] db.addCollections() SUCCESS`);
                            } catch (e) {
                                console.warn(`[DB_DEBUG][${reqId}] [Mutex] ERROR in addCollections (Swallowing):`, e);
                            }
                        } else {
                            console.log(`[DB_DEBUG][${reqId}] [Mutex] Skipping addCollections (Empty list).`);
                        }
                    })();
                } else {
                    console.log(`[DB_DEBUG][${reqId}] Mutex found. Waiting for existing promise...`);
                }

                // Wait for the exclusive promise to complete
                await db['_kosmoi_collections_promise'];
                console.log(`[DB_DEBUG][${reqId}] Mutex released. Proceeding to replication.`);

                // Start Replication (Fire and forget, but with better error logging)
                const logError = (context, err) => console.error(`[DB_DEBUG][${reqId}] [Replication Error] ${context}:`, err);

                if (db.vendors) replicateCollection(db.vendors, 'service_providers').catch(err => logError('vendors', err));
                else console.error(`[DB_DEBUG][${reqId}] db.vendors IS MISSING!`);

                if (db.tasks) replicateCollection(db.tasks, 'agent_tasks').catch(err => logError('tasks', err));
                if (db.contacts) replicateCollection(db.contacts, 'crm_leads').catch(err => logError('contacts', err));
                if (db.stages) replicateCollection(db.stages, 'crm_stages').catch(err => logError('stages', err));

                return db;
            } catch (err) {
                console.error(`[DB_DEBUG][${reqId}] Critical Failed during DB creation`, err);
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
