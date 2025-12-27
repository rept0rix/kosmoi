import React, { createContext, useContext, useEffect, useState } from 'react';
import { DatabaseService } from './database';
import { DB_NAME } from './rxdb-config';

const RxDBContext = createContext(null);

export const RxDBProvider = ({ children }) => {
    const [db, setDb] = useState(null);
    const [error, setError] = useState(null); // Keep error for critical non-DB failures if needed, or remove
    const [isTimeout, setIsTimeout] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isOfflineMode, setIsOfflineMode] = useState(false); // New Graceful Degradation State

    useEffect(() => {
        let timeoutId;
        let isMounted = true;

        const init = async () => {
            // Set 15s timeout - if it hangs, we fall back to offline mode instead of crashing
            timeoutId = setTimeout(() => {
                if (isMounted) {
                    console.warn("RxDB Init Timeout - Falling back to Offline Mode");
                    setIsOfflineMode(true);
                    setIsLoading(false);
                }
            }, 15000);

            try {
                const database = await DatabaseService.get();
                if (isMounted) {
                    clearTimeout(timeoutId);
                    setDb(database);
                    setIsLoading(false);
                }
            } catch (err) {
                if (isMounted) {
                    clearTimeout(timeoutId);
                    console.error("RxDB Initialization Failed (Graceful Fallback):", err);
                    // Enable Offline Mode and capture error for display
                    setError(err);
                    setIsOfflineMode(true);
                    setIsLoading(false);
                }
            }
        };
        init();

        return () => {
            isMounted = false;
            clearTimeout(timeoutId);
        };
    }, []);

    const [isResetting, setIsResetting] = useState(false);

    const handleHardReset = async () => {
        if (!window.confirm("Are you sure? This will clear all local data and reload the app.")) return;

        setIsResetting(true);
        try {
            await DatabaseService.destroy();

            // Nuke IndexedDB natively (The "Nuclear Option")
            if ('indexedDB' in window) {
                console.warn("Hard Reset: Nuking IndexedDB natively...");

                const deleteDB = (name) => {
                    return new Promise((resolve, reject) => {
                        console.log(`Attempting to delete IDB: ${name}`);
                        const request = window.indexedDB.deleteDatabase(name);
                        request.onsuccess = () => {
                            console.log(`Deleted IDB: ${name}`);
                            resolve();
                        };
                        request.onerror = (e) => {
                            console.error(`Failed to delete IDB: ${name}`, e);
                            resolve(); // Resolve anyway to continue
                        };
                        request.onblocked = () => {
                            console.warn(`Delete blocked for IDB: ${name} (Close other tabs)`);
                            resolve();
                        };
                    });
                };

                try {
                    // Try to list databases
                    const dbs = await window.indexedDB.databases();
                    await Promise.all(
                        dbs
                            .filter(db => db.name && (db.name.includes('kosmoi') || db.name.includes('rxdb')))
                            .map(db => deleteDB(db.name))
                    );
                } catch (err) {
                    console.error("Native IDB list failed, falling back to known names", err);
                    // Fallback names
                    await Promise.all([
                        deleteDB(DB_NAME),
                        deleteDB('kosmoidb_v7'),
                        deleteDB('kosmoidb_v8'),
                        deleteDB('kosmoidb_v9'), // Self
                        deleteDB('rxdb-dexie-kosmoidb_v8--0'),
                        deleteDB('rxdb-dexie-kosmoidb_v9--0')
                    ]);
                }
            }

            if ('serviceWorker' in navigator) {
                const registrations = await navigator.serviceWorker.getRegistrations();
                for (const registration of registrations) await registration.unregister();
            }

            // Clear standard storages
            localStorage.clear();
            sessionStorage.clear();

            if ('caches' in window) {
                const cacheKeys = await caches.keys();
                await Promise.all(cacheKeys.map(key => caches.delete(key)));
            }
        } catch (e) {
            console.error(e);
        } finally {
            window.location.reload();
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-slate-900 text-white">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
                <h2 className="text-xl font-semibold">Loading Kosmoi...</h2>
                <div className="text-xs text-white/50 mt-2">v8.5-DEBUG</div>
            </div>
        );
    }

    // We no longer show the full-screen error for DB failures. 
    // We only show it if something drastically non-DB related explodes, 
    // but here we are swallowing DB errors into isOfflineMode.

    return (
        <RxDBContext.Provider value={db}>
            {isOfflineMode && (
                <div className="fixed top-0 left-0 w-full bg-amber-600/95 text-white text-center text-xs font-bold py-1 z-[9999] flex items-center justify-center gap-3 shadow-md">
                    <span title={error?.message || 'Unknown Error'}>
                        ⚠️ OFFLINE MODE ({error?.code || 'ERR'}) - Browser Database Issue
                    </span>
                    <button
                        onClick={handleHardReset}
                        disabled={isResetting}
                        className="bg-white/20 hover:bg-white/30 active:bg-white/40 text-white px-2 py-0.5 rounded transition-colors cursor-pointer border border-white/30"
                    >
                        {isResetting ? 'Resetting...' : 'Fix Now (Reset App)'}
                    </button>
                </div>
            )}
            {children}
        </RxDBContext.Provider>
    );
};

export const useRxDB = () => useContext(RxDBContext);
