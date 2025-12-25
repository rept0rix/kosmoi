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

/**
 * Creates and configures the RxDB database instance
 */
export const createDatabase = async () => {
    const rawStorage = getRxStorageDexie();
    const storage = import.meta.env.DEV
        ? wrappedValidateAjvStorage({ storage: rawStorage })
        : rawStorage;

    const db = await createRxDatabase({
        name: 'kosmoidb_v3',
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
