import { createDatabase } from './rxdb-config';
import { vendorSchema } from './schemas/vendor.schema';
import { taskSchema } from './schemas/task.schema';
import { contactSchema } from './schemas/contact.schema';
import { stageSchema } from './schemas/stage.schema';
import { replicateCollection } from './replication';

import { removeRxDatabase } from 'rxdb';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';

let dbPromise = null;

export const DatabaseService = {
    get: async () => {
        if (dbPromise) return dbPromise;

        console.log("DatabaseService: Initializing RxDB...");
        dbPromise = (async () => {
            try {
                if (typeof createDatabase !== 'function') {
                    throw new Error("createDatabase is not a function. Check rxdb-config.js export.");
                }

                const db = await createDatabase();
                console.log("DatabaseService: DB Instance created", db.name);

                // Add collections
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

                // Start Replication (Fire and forget, but with better error logging)
                console.log('Starting replication...');

                const logError = (context, err) => console.error(`[Replication Error] ${context}:`, err);

                replicateCollection(db.vendors, 'service_providers').catch(err => logError('vendors', err));
                replicateCollection(db.tasks, 'agent_tasks').catch(err => logError('tasks', err));
                replicateCollection(db.contacts, 'crm_leads').catch(err => logError('contacts', err));
                replicateCollection(db.stages, 'crm_stages').catch(err => logError('stages', err));

                return db;
            } catch (err) {
                console.error("DatabaseService: Critical Failed during DB creation", err);
                dbPromise = null; // Reset promise so we can retry
                throw err;
            }
        })();

        return dbPromise;
    },

    /**
     * Re-initializes the database (useful for testing or resets)
     */
    reset: () => {
        dbPromise = null;
    },

    /**
     * Destroys the local database completely.
     * Useful for recovering from corruption or schema mismatch glitches.
     */
    destroy: async () => {
        console.warn("DatabaseService: DESTROYING DATABASE...");

        // Try to close existing connection first
        if (dbPromise) {
            try {
                const db = await dbPromise;
                await db.destroy();
                console.log("DatabaseService: Closed existing connection");
            } catch (err) {
                console.warn("DatabaseService: Failed to close existing connection during destroy", err);
            }
            dbPromise = null;
        }

        try {
            // Import storage dynamically or assume it's imported at top (we will fix imports next)
            const { storage } = await import('./rxdb-config');
            await removeRxDatabase('kosmoidb_v4', storage);
            console.log("DatabaseService: Database destroyed.");
            return true;
        } catch (e) {
            console.error("DatabaseService: Failed to destroy DB", e);
            throw e;
        }
    }
};
