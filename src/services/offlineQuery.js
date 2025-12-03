import { filterProviders, getProvider, searchProviders, getAllProviders } from './db';
import { db } from '@/api/supabaseClient';

// Check if we're online
function isOnline() {
    return navigator.onLine;
}

// Offline-first query service
// This service tries to use local data first, and falls back to Remote DB if needed

export async function filter(filters = {}) {
    try {
        // Try local data first
        const localProviders = await filterProviders(filters);

        if (localProviders.length > 0) {
            console.log(`Found ${localProviders.length} providers in local cache`);
            return localProviders;
        }

        // If no local data and we're online, try Remote DB
        if (isOnline()) {
            console.log('No local data, fetching from Remote DB...');
            const remoteProviders = await db.entities.ServiceProvider.filter(filters);
            return remoteProviders;
        }

        // Offline and no local data
        console.warn('Offline and no local data available');
        return [];

    } catch (error) {
        console.error('Error in filter query:', error);

        // Try local data as fallback
        try {
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
