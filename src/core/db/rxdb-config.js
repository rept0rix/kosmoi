import { createRxDatabase, addRxPlugin } from 'rxdb';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { RxDBDevModePlugin, disableWarnings } from 'rxdb/plugins/dev-mode';
import { RxDBUpdatePlugin } from 'rxdb/plugins/update';
import { RxDBQueryBuilderPlugin } from 'rxdb/plugins/query-builder';
import { RxDBLeaderElectionPlugin } from 'rxdb/plugins/leader-election';

import { RxDBMigrationSchemaPlugin } from 'rxdb/plugins/migration-schema';

// Add plugins
addRxPlugin(RxDBMigrationSchemaPlugin);
addRxPlugin(RxDBUpdatePlugin);
addRxPlugin(RxDBQueryBuilderPlugin);
addRxPlugin(RxDBLeaderElectionPlugin);

// if (import.meta.env.DEV) {
//    addRxPlugin(RxDBDevModePlugin);
//    disableWarnings();
// }

// RxDB Storage setup
import { wrappedValidateAjvStorage } from 'rxdb/plugins/validate-ajv';

// Singleton Storage Instance implementation
// We attach to window to ensure that even if the module is re-evaluated, 
// we use the EXACT SAME storage instance to avoid DB9 errors.
const getGlobalStorage = () => {
    const key = '__KOSMOI_RXDB_STORAGE_V4__';
    if (typeof window !== 'undefined') {
        if (!window[key]) {
            const rawStorage = getRxStorageDexie();
            window[key] = rawStorage;
        }
        return window[key];
    } else {
        // Node.js environment - return regular instance or mock if needed for simple scripts
        return getRxStorageDexie();
    }
};

export const storage = getGlobalStorage();

// Database Context
export const DB_NAME = 'kosmoidb_v13';

/**
 * Creates and configures the RxDB database instance
 */
export const createDatabase = async () => {
    const db = await createRxDatabase({
        name: DB_NAME,
        storage,
        multiInstance: true,
        eventReduce: true
    });

    if (import.meta.env.DEV && typeof window !== 'undefined') {
        window['db'] = db; // accessible in console
    }

    return db;
};
