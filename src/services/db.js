import { openDB } from 'idb';

const DB_NAME = 'samui-hub';
const DB_VERSION = 1;

// Initialize IndexedDB
export async function initDB() {
    return openDB(DB_NAME, DB_VERSION, {
        upgrade(db) {
            // Providers store
            if (!db.objectStoreNames.contains('providers')) {
                const providerStore = db.createObjectStore('providers', { keyPath: 'id' });
                providerStore.createIndex('super_category', 'super_category');
                providerStore.createIndex('sub_category', 'sub_category');
                providerStore.createIndex('business_name', 'business_name');
                providerStore.createIndex('status', 'status');
                providerStore.createIndex('verified', 'verified');
                providerStore.createIndex('google_place_id', 'google_place_id');
            }

            // Sync metadata store
            if (!db.objectStoreNames.contains('sync_metadata')) {
                db.createObjectStore('sync_metadata', { keyPath: 'key' });
            }
        },
    });
}

// Provider CRUD operations
export async function saveProviders(providers) {
    const db = await initDB();
    const tx = db.transaction('providers', 'readwrite');

    await Promise.all([
        ...providers.map(provider => tx.store.put(provider)),
        tx.done
    ]);
}

export async function getProvider(id) {
    const db = await initDB();
    return db.get('providers', id);
}

export async function getAllProviders() {
    const db = await initDB();
    return db.getAll('providers');
}

export async function filterProviders(filters = {}) {
    const db = await initDB();
    let providers = await db.getAll('providers');

    // Apply filters
    if (filters.status) {
        providers = providers.filter(p => p.status === filters.status);
    }

    if (filters.verified !== undefined) {
        providers = providers.filter(p => p.verified === filters.verified);
    }

    if (filters.super_category) {
        providers = providers.filter(p => p.super_category === filters.super_category);
    }

    if (filters.sub_category) {
        providers = providers.filter(p => p.sub_category === filters.sub_category);
    }

    if (filters.category) {
        providers = providers.filter(p => p.category === filters.category);
    }

    if (filters.google_place_id) {
        providers = providers.filter(p => p.google_place_id === filters.google_place_id);
    }

    return providers;
}

export async function searchProviders(query) {
    const db = await initDB();
    const providers = await db.getAll('providers');

    const searchLower = query.toLowerCase();
    return providers.filter(provider =>
        provider.business_name?.toLowerCase().includes(searchLower) ||
        provider.description?.toLowerCase().includes(searchLower) ||
        provider.location?.toLowerCase().includes(searchLower)
    );
}

export async function clearProviders() {
    const db = await initDB();
    const tx = db.transaction('providers', 'readwrite');
    await tx.store.clear();
    await tx.done;
}

// Sync metadata operations
export async function setSyncMetadata(key, value) {
    const db = await initDB();
    await db.put('sync_metadata', { key, value, timestamp: Date.now() });
}

export async function getSyncMetadata(key) {
    const db = await initDB();
    const record = await db.get('sync_metadata', key);
    return record?.value;
}

export async function getLastSyncTime() {
    return getSyncMetadata('last_sync_time');
}

export async function setLastSyncTime(time) {
    return setSyncMetadata('last_sync_time', time);
}
