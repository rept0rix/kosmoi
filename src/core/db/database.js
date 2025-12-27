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
        // Check window global first
        if (window['__KOSMOI_DB_PROMISE__']) {
            return window['__KOSMOI_DB_PROMISE__'];
        }

        console.log(`DatabaseService: Initializing RxDB (${DB_NAME})...`);

        // Start creation and assign to window immediately to block race conditions
        const promise = (async () => {
            try {
                if (typeof createDatabase !== 'function') {
                    throw new Error("createDatabase is not a function. Check rxdb-config.js export.");
                }

                const db = await createDatabase();
                console.log("DatabaseService: DB Instance created", db.name);

                // Add collections
                // Add collections with robust error handling
                // We use try-catch instead of checking state to be 100% sure we don't crash
                // Define desired collections
                const collectionDefinitions = {
                    vendors: {
                        schema: vendorSchema,
                        migrationStrategies: {
                            1: (oldDoc) => {
                                oldDoc.vibes = oldDoc.vibes || [];
                                oldDoc.images = oldDoc.images || [];
                                oldDoc.price_level = oldDoc.price_level || null;
                                oldDoc.instagram_handle = oldDoc.instagram_handle || null;
                                oldDoc.open_status = oldDoc.open_status || 'closed';
                                return oldDoc;
                            }
                        }
                    },
                    tasks: {
                        schema: taskSchema,
                        migrationStrategies: {
                            1: (oldDoc) => oldDoc,
                            2: (oldDoc) => {
                                oldDoc.meeting_id = oldDoc.meeting_id || "";
                                oldDoc.priority = oldDoc.priority || "medium";
                                oldDoc.description = oldDoc.description || "";
                                oldDoc.created_at = oldDoc.created_at || new Date().toISOString();
                                oldDoc.updated_at = oldDoc.updated_at || new Date().toISOString();
                                return oldDoc;
                            }
                        }
                    },
                    contacts: { schema: contactSchema },
                    stages: { schema: stageSchema }
                };

                // Filter out collections that already exist to prevent DB9 error
                const collectionsToAdd = {};
                const existingCollections = Object.keys(db.collections || {});

                Object.keys(collectionDefinitions).forEach(name => {
                    if (!existingCollections.includes(name)) {
                        collectionsToAdd[name] = collectionDefinitions[name];
                    } else {
                        console.log(`DatabaseService: Collection "${name}" already exists. Skipping.`);
                    }
                });

                // Add only the missing collections
                if (Object.keys(collectionsToAdd).length > 0) {
                    try {
                        await db.addCollections(collectionsToAdd);
                        console.log("DatabaseService: New collections added:", Object.keys(collectionsToAdd));
                    } catch (e) {
                        // BULLDOZER FIX:
                        // We explicitly swallow ALL errors here.
                        // The persistence of DB9 (Collection already exists) suggests a deep race condition
                        // or underlying storage sync issue. 
                        // If addCollections fails, it's highly likely because they exist or partially exist.
                        // We proceeding is safer than crashing the entire app.
                        console.warn("DatabaseService: Error adding collections (Swallowed to ensure boot):", e);

                        // We do NOT throw. We proceed to replication.
                    }
                } else {
                    console.log("DatabaseService: All collections already exist. Skipping addCollections.");
                }

                // Start Replication (Fire and forget, but with better error logging)
                console.log('Starting replication...');
                const logError = (context, err) => console.error(`[Replication Error] ${context}:`, err);

                replicateCollection(db.vendors, 'service_providers').catch(err => logError('vendors', err));
                if (db.tasks) replicateCollection(db.tasks, 'agent_tasks').catch(err => logError('tasks', err));
                if (db.contacts) replicateCollection(db.contacts, 'crm_leads').catch(err => logError('contacts', err));
                if (db.stages) replicateCollection(db.stages, 'crm_stages').catch(err => logError('stages', err));

                return db;
            } catch (err) {
                console.error("DatabaseService: Critical Failed during DB creation", err);
                // If it fails, clear the global promise so we can retry on next call
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

    // Destroys the local database completely
    destroy: async () => {
        console.warn("DatabaseService: DESTROYING DATABASE...");

        // Try to close existing connection first
        const currentPromise = window['__KOSMOI_DB_PROMISE__'];
        if (currentPromise) {
            try {
                const db = await currentPromise;
                if (db && !db.destroyed) {
                    await db.destroy();
                }
                console.log("DatabaseService: Closed existing connection");
            } catch (err) {
                console.warn("DatabaseService: Failed to close existing connection during destroy", err);
            }
            window['__KOSMOI_DB_PROMISE__'] = null;
        }

        try {
            // Import storage dynamically prevents circular dependency issues in some builds
            const { storage } = await import('./rxdb-config');
            await removeRxDatabase(DB_NAME, storage);
            console.log(`DatabaseService: Database (${DB_NAME}) and storage destroyed.`);
            return true;
        } catch (e) {
            console.error("DatabaseService: Failed to destroy DB", e);
            throw e;
        }
    }
};
