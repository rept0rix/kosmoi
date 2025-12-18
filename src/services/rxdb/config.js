import { createRxDatabase, addRxPlugin } from 'rxdb';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { getRxStorageMemory } from 'rxdb/plugins/storage-memory';
import { wrappedValidateAjvStorage } from 'rxdb/plugins/validate-ajv';
import { taskSchema, leadSchema } from './schemas.js';

// Add plugins
import { RxDBDevModePlugin } from 'rxdb/plugins/dev-mode';
if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV) {
    addRxPlugin(RxDBDevModePlugin);
}

let dbPromise = null;

const _create = async () => {
    console.log('RxDB: Initializing Database...');
    let storage = getRxStorageDexie();
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV) {
        storage = wrappedValidateAjvStorage({
            storage: storage
        });
    }

    const db = await createRxDatabase({
        name: 'samuidb_' + Date.now(),
        storage,
        ignoreDuplicate: true,
        multiInstance: false
    });

    console.log('RxDB: Adding collections...');
    await db.addCollections({
        tasks: {
            schema: taskSchema
        },
        leads: {
            schema: leadSchema
        }
    });

    console.log('RxDB: Database created');
    return db;
};

export const getDatabase = () => {
    if (!dbPromise) {
        dbPromise = _create();
    }
    return dbPromise;
};
