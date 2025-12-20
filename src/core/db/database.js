import { createDatabase } from './rxdb-config';
import { vendorSchema } from './schemas/vendor.schema';
import { taskSchema } from './schemas/task.schema';
import { contactSchema } from './schemas/contact.schema';
import { stageSchema } from './schemas/stage.schema';
import { replicateCollection } from './replication';

let dbPromise = null;

export const DatabaseService = {
    get: async () => {
        if (!dbPromise) {
            console.log("DatabaseService: Initializing RxDB...");
            try {
                if (typeof createDatabase !== 'function') {
                    console.error("DatabaseService: createDatabase is not a function", createDatabase);
                    throw new Error("createDatabase is not a function");
                }

                dbPromise = createDatabase().then(async (db) => {
                    console.log("DatabaseService: DB Instance created", db);
                    // Add collections
                    try {
                        await db.addCollections({
                            vendors: { schema: vendorSchema },
                            tasks: { schema: taskSchema },
                            contacts: { schema: contactSchema },
                            stages: { schema: stageSchema }
                        });
                        console.log("DatabaseService: Collections added");
                    } catch (err) {
                        console.error("DatabaseService: Failed to add collections", err);
                        throw err;
                    }

                    // Start Replication (Fire and forget)
                    console.log('Starting replication...');

                    // Vendors
                    replicateCollection(db.vendors, 'service_providers')
                        .catch(err => console.error('Replication vendors error', err));

                    // Tasks
                    replicateCollection(db.tasks, 'agent_tasks')
                        .catch(err => console.error('Replication tasks error', err));

                    // Contacts
                    replicateCollection(db.contacts, 'crm_leads') // Assuming 'crm_leads' is the table
                        .catch(err => console.error('Replication contacts error', err));

                    // Stages
                    replicateCollection(db.stages, 'crm_stages')
                        .catch(err => console.error('Replication stages error', err));

                    return db;
                }).catch(err => {
                    console.error("DatabaseService: Failed during DB creation promise", err);
                    dbPromise = null; // Reset promise so we can retry
                    throw err;
                });
            } catch (err) {
                console.error("DatabaseService: Critical error during get()", err);
                throw err;
            }
        }
        return dbPromise;
    },

    /**
     * Re-initializes the database (useful for testing or resets)
     */
    reset: () => {
        dbPromise = null;
    }
};
