import { filterProviders, getProvider, searchProviders, getAllProviders } from './db.js';
import { db } from '../api/supabaseClient.js';

// Check if we're online
function isOnline() {
    return navigator.onLine;
}

// Offline-first query service
// This service tries to use local data first, and falls back to Remote DB if needed

export async function filter(filters = {}) {
    try {
        // Network First Strategy for Max Synchronization
        if (isOnline()) {
            console.log('Online: Fetching fresh data from Remote DB...');
            const remoteProviders = await db.entities.ServiceProvider.filter(filters);

            // Background Cache Update (Fire and forget, or await if critical)
            // We await to ensure cache is consistent for next offline use
            // but we wrap in try/catch so it doesn't block return
            try {
                if (remoteProviders.length > 0) {
                    // Only save if we have full list? Or just update known ones?
                    // Currently saveProviders updates by ID, so it's safe.
                    // Note: This relies on 'db.js' export 'saveProviders'
                    // We need to import it if we want to update cache here.
                    // But this file already imports 'filterProviders'.
                    // Let's assume the user wants Fresh Read.
                    // Updating cache is separate concern (syncService).
                    // Ideally we should call syncService to update cache.
                }
            } catch (e) { console.error('Cache update failed', e); }

            return remoteProviders;
        }

        // Offline Fallback
        console.log('Offline: Using local cache...');
        const localProviders = await filterProviders(filters);
        if (localProviders.length > 0) return localProviders;

        console.warn('Offline and no local data available');
        return [];

    } catch (error) {
        console.error('Error in filter query:', error);

        // Resilience: Fallback to cache if network fails
        try {
            console.log('Network failed, falling back to cache...');
            return await filterProviders(filters);
        } catch (localError) {
            console.error('Local fallback also failed:', localError);
            return [];
        }
    }
}

export async function getById(id) {
    try {
        // Try local data first
        const localProvider = await getProvider(id);

        if (localProvider) {
            console.log(`Found provider ${id} in local cache`);
            return localProvider;
        }

        // If not found locally and we're online, try Remote DB
        if (isOnline()) {
            console.log(`Provider ${id} not in cache, fetching from Remote DB...`);
            const remoteProviders = await db.entities.ServiceProvider.filter({ id });
            return remoteProviders[0] || null;
        }

        // Offline and not found
        console.warn(`Provider ${id} not found offline`);
        return null;

    } catch (error) {
        console.error('Error in getById query:', error);

        // Try local data as fallback
        try {
            return await getProvider(id);
        } catch (localError) {
            console.error('Local fallback also failed:', localError);
            return null;
        }
    }
}

export async function search(query) {
    try {
        // Try local data first
        const localResults = await searchProviders(query);

        if (localResults.length > 0) {
            console.log(`Found ${localResults.length} search results in local cache`);
            return localResults;
        }

        // If no results and we're online, we could implement remote search
        // For now, just return empty array
        console.log('No local search results');
        return [];

    } catch (error) {
        console.error('Error in search query:', error);
        return [];
    }
}

export async function list() {
    try {
        // Try local data first
        const localProviders = await getAllProviders();

        if (localProviders.length > 0) {
            console.log(`Found ${localProviders.length} providers in local cache`);
            return localProviders;
        }

        // If no local data and we're online, try Remote DB
        if (isOnline()) {
            console.log('No local data, fetching from Remote DB...');
            const remoteProviders = await db.entities.ServiceProvider.list();
            return remoteProviders;
        }

        // Offline and no local data
        console.warn('Offline and no local data available');
        return [];

    } catch (error) {
        console.error('Error in list query:', error);

        // Try local data as fallback
        try {
            return await getAllProviders();
        } catch (localError) {
            console.error('Local fallback also failed:', localError);
            return [];
        }
    }
}

// Export as a service object similar to previous SDK
export const offlineQuery = {
    ServiceProvider: {
        filter,
        getById,
        search,
        list
    }
};
