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
                try {
                    await db.addCollections({
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
                    });
                    console.log("DatabaseService: Collections added");
                } catch (e) {
                    // Check broadly for "Collection already exists" (DB9)
                    // We check toString(), message, and code to be absolutely sure we catch it.
                    const errString = (e.toString() || '') + (e.message || '') + (e.code || '');

                    if (
                        errString.includes('DB9') ||
                        errString.includes('already exists') ||
                        (e.parameters && e.parameters.code === 'DB9')
                    ) {
                        console.warn("DatabaseService: DB9 Error caught (Collections already exist). proceeding...");
                    } else {
                        console.error("DatabaseService: Failed to add collections", e);
                        throw e;
                    }
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
