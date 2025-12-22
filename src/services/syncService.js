import { db } from '../api/supabaseClient';
import {
    saveProviders,
    getAllProviders,
    setLastSyncTime,
    getLastSyncTime,
    setSyncMetadata,
    getSyncMetadata
} from './db';

// Sync status
let syncStatus = {
    isSyncing: false,
    progress: 0,
    total: 0,
    error: null,
    lastSyncTime: null
};

// Event listeners for sync status updates
const listeners = new Set();

export function onSyncStatusChange(callback) {
    listeners.add(callback);
    return () => listeners.delete(callback);
}

function notifyListeners() {
    listeners.forEach(callback => callback(syncStatus));
}

function updateSyncStatus(updates) {
    syncStatus = { ...syncStatus, ...updates };
    notifyListeners();
}

// Download all providers from Remote DB
export async function downloadAllProviders() {
    try {
        updateSyncStatus({ isSyncing: true, progress: 0, error: null });

        console.log('Starting provider download...');

        // For development, use mock data if Remote DB is not available
        const isDevelopment = import.meta.env.DEV;

        let providers = [];

        if (isDevelopment) {
            // Try to fetch from Remote DB, but fall back to empty array if it fails
            providers = await db.entities.ServiceProvider.filter({ status: 'active' });
        }

        updateSyncStatus({ total: providers.length, progress: 0 });

        // Save in batches to show progress
        const batchSize = 50;
        for (let i = 0; i < providers.length; i += batchSize) {
            const batch = providers.slice(i, i + batchSize);
            await saveProviders(batch);
            updateSyncStatus({ progress: Math.min(i + batchSize, providers.length) });

            // Small delay to prevent UI blocking
            await new Promise(resolve => setTimeout(resolve, 10));
        }

        const syncTime = Date.now();
        await setLastSyncTime(syncTime);
        await setSyncMetadata('total_providers', providers.length);

        updateSyncStatus({
            isSyncing: false,
            progress: providers.length,
            lastSyncTime: syncTime,
            error: null
        });

        console.log(`Downloaded ${providers.length} providers successfully`);
        return { success: true, count: providers.length };

    } catch (error) {
        console.error('Error downloading providers:', error);
        updateSyncStatus({
            isSyncing: false,
            error: error.message
        });
        throw error;
    }
}

// Sync updates (incremental sync)
export async function syncUpdates() {
    try {
        updateSyncStatus({ isSyncing: true, error: null });

        const lastSync = await getLastSyncTime();

        // If never synced, do full download
        if (!lastSync) {
            return downloadAllProviders();
        }

        // For production, use Supabase backend functionc
        // In the future, you could implement incremental sync based on lastSync timestamp
        return downloadAllProviders();

    } catch (error) {
        console.error('Error syncing updates:', error);
        updateSyncStatus({
            isSyncing: false,
            error: error.message
        });
        throw error;
    }
}

// Get sync status
export function getSyncStatus() {
    return { ...syncStatus };
}

// Initialize sync status from storage
export async function initSyncStatus() {
    const lastSync = await getLastSyncTime();
    const totalProviders = await getSyncMetadata('total_providers') || 0;

    updateSyncStatus({
        lastSyncTime: lastSync,
        total: totalProviders,
        progress: totalProviders
    });
}

// Check if we have local data
export async function hasLocalData() {
    const providers = await getAllProviders();
    return providers.length > 0;
}

// Auto-sync on app start if needed
export async function autoSync() {
    await initSyncStatus();

    const hasData = await hasLocalData();

    if (!hasData) {
        console.log('No local data found, starting initial sync...');
        await downloadAllProviders();
    } else {
        const lastSync = await getLastSyncTime();
        const hoursSinceSync = lastSync ? (Date.now() - lastSync) / (1000 * 60 * 60) : Infinity;

        // Auto-sync if last sync was more than 24 hours ago
        if (hoursSinceSync > 24) {
            console.log('Data is stale, syncing updates...');
            await syncUpdates();
        } else {
            console.log('Local data is fresh, skipping auto-sync');
        }
    }
}
