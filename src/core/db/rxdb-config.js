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

if (import.meta.env.DEV) {
    addRxPlugin(RxDBDevModePlugin);
    disableWarnings();
}

// RxDB Storage setup
import { wrappedValidateAjvStorage } from 'rxdb/plugins/validate-ajv';

// Singleton Storage Instance implementation
// We attach to window to ensure that even if the module is re-evaluated, 
// we use the EXACT SAME storage instance to avoid DB9 errors.
const getGlobalStorage = () => {
    const key = '__KOSMOI_RXDB_STORAGE_V4__';
    if (!window[key]) {
        const rawStorage = getRxStorageDexie();
        window[key] = import.meta.env.DEV
            ? wrappedValidateAjvStorage({ storage: rawStorage })
            : rawStorage;
    }
    return window[key];
};

export const storage = getGlobalStorage();

/**
 * Creates and configures the RxDB database instance
 */
export const createDatabase = async () => {
    const db = await createRxDatabase({
        name: 'kosmoidb_v5',
        storage,
        multiInstance: true,
        eventReduce: true,
        ignoreDuplicate: true
    });

    if (import.meta.env.DEV) {
        window['db'] = db; // accessible in console
    }

    return db;
};
