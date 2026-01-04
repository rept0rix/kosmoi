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
    const [isResetting, setIsResetting] = useState(false);

    const handleHardReset = async (force = false) => {
        if (!force && !window.confirm("Are you sure? This will clear all local data and reload the app.")) return;

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

            // Preserve auto-recovery state
            const retryCount = sessionStorage.getItem('rxdb_retry_count');
            sessionStorage.clear();
            if (retryCount) {
                sessionStorage.setItem('rxdb_retry_count', retryCount);
            }

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

    useEffect(() => {
        let timeoutId;
        let isMounted = true;

        const isPublicRoute =
            window.location.pathname === '/' ||
            window.location.pathname.startsWith('/he') ||
            window.location.pathname.startsWith('/th') ||
            window.location.pathname.startsWith('/ru');

        const init = async () => {
            // FAST PATH: If public, do NOT wait for DB to load UI.
            if (isPublicRoute) {
                console.log("⚡ Fast Path (RxDB): Public Route -> Unblocking UI Immediately");
                setIsLoading(false);
            }

            // Set 45s timeout (relaxed) - if it hangs, we fall back to offline mode
            timeoutId = setTimeout(() => {
                if (isMounted) {
                    console.warn("RxDB Init Timeout - Falling back to Offline Mode");
                    setIsOfflineMode(true);
                    // Only modify isLoading if we haven't already unblocked (i.e. if we are on App route)
                    if (!isPublicRoute) setIsLoading(false);
                }
            }, 45000);

            try {
                const database = await DatabaseService.get();
                if (isMounted) {
                    clearTimeout(timeoutId);
                    // Check if we got a Fallback/Mock DB (Critical Failure Recovery)
                    if (database?._isFallback) {
                        console.warn("Received Mock DB. Auto-Recovery disabled for stability debugging.");
                        // Stop the loop!
                        setError(new Error("Database consistency check failed. Please click 'Fix Database' manually."));
                        setIsOfflineMode(true);
                        setIsLoading(false);

                        /* 
                        // Previous Auto-Loop Logic (Disabled)
                        const retryCount = parseInt(sessionStorage.getItem('rxdb_retry_count') || '0');
                        if (retryCount < 3) {
                            console.warn(`Received Mock DB. Triggering AUTO Recovery (Attempt ${retryCount + 1}/3).`);
                            sessionStorage.setItem('rxdb_retry_count', (retryCount + 1).toString());
                            handleHardReset(true);
                        } else {
                            console.error("Auto-Recovery failed 3 times. Giving up.");
                            setError(new Error("System Recovery Failed. Please try manually clearing your browser data."));
                            setIsOfflineMode(true);
                            if (!isPublicRoute) setIsLoading(false);
                        }
                        */
                    } else {
                        // Success! Clear the retry count.
                        sessionStorage.removeItem('rxdb_retry_count');
                        setDb(database);
                        setIsLoading(false);
                    }
                }
            } catch (err) {
                if (isMounted) {
                    clearTimeout(timeoutId);
                    console.error("RxDB Initialization Failed (Graceful Fallback):", err);
                    // Enable Offline Mode and capture error for display
                    setError(err);
                    setIsOfflineMode(true);
                    if (!isPublicRoute) setIsLoading(false);
                }
            }
        };
        init();

        return () => {
            isMounted = false;
            clearTimeout(timeoutId);
        };
    }, []);



    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-slate-900 text-white">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
                <h2 className="text-xl font-semibold">Loading Kosmoi...</h2>
                <div className="text-xs text-white/50 mt-2">v8.5-DEBUG</div>
            </div>
        );
    }

    // Calculate strict public/core route check for rendering logic
    // We expanded this to include "Core App Routes" that do NOT strictly require RxDB (Agents)
    // to function. This ensures "My Bookings" or "Wallet" load instantly via Supabase/offlineQuery
    // even if RxDB is slow to initialize.
    const isPublicRoute =
        window.location.pathname === '/' ||
        window.location.pathname.startsWith('/he') ||
        window.location.pathname.startsWith('/th') ||
        window.location.pathname.startsWith('/ru') ||
        [
            '/about', '/contact', '/pricing', '/blog', '/terms', '/privacy',
            '/real-estate', '/marketplace', '/experiences', '/wellness',
            '/my-bookings', '/wallet', '/provider-dashboard', '/login', '/signup',
            '/notifications', '/claim'
        ].some(p => window.location.pathname.includes(p));

    // SAFEGUARD: If Offline Mode is triggered (Timeout or Critical Error), 
    // DO NOT render children. Rendering children with a broken/null DB can cause infinite loops 
    // in hooks like useRxQuery, leading to browser crashes.
    // EXCEPTION: On public routes ("Fast Path"), we allow rendering even if DB fails,
    // because the Landing Page does not critically depend on RxDB (it mostly uses static data or Supabase).
    if (isOfflineMode && !isPublicRoute) {
        return (
            <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-950 text-white p-6">
                <div className="max-w-md w-full bg-slate-900 rounded-xl border border-red-500/30 p-8 shadow-2xl text-center">
                    <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <span className="text-3xl">⚠️</span>
                    </div>

                    <h2 className="text-2xl font-bold mb-2">System Initializing Slow</h2>
                    <p className="text-slate-400 mb-6 text-sm">
                        The local database is taking longer than expected to start.
                    </p>

                    <div className="bg-black/30 rounded p-4 mb-6 text-left font-mono text-xs text-red-300 overflow-auto max-h-32 border border-white/5">
                        {error?.message || "Connection taking longer than usual..."}
                    </div>

                    <div className="flex flex-col gap-3">
                        <button
                            onClick={() => setIsOfflineMode(false)}
                            className="w-full bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 px-4 rounded-lg transition-all"
                        >
                            Continue Anyway (Risk of Bugs)
                        </button>

                        <button
                            onClick={() => handleHardReset(false)}
                            disabled={isResetting}
                            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-lg transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isResetting ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
                                    Cleaning System...
                                </>
                            ) : (
                                'Fix Database & Reload'
                            )}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <RxDBContext.Provider value={db}>
            {children}
        </RxDBContext.Provider>
    );
};

export const useRxDB = () => useContext(RxDBContext);
