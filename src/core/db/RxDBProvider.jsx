import React, { createContext, useContext, useEffect, useState } from 'react';
import { DatabaseService } from './database';
import { DB_NAME } from './rxdb-config';

const RxDBContext = createContext(null);

export const RxDBProvider = ({ children }) => {
    const [db, setDb] = useState(null);
    const [error, setError] = useState(null);
    const [isTimeout, setIsTimeout] = useState(false);

    useEffect(() => {
        let timeoutId;
        const initDB = async () => {
            // Set 15s timeout
            timeoutId = setTimeout(() => {
                setIsTimeout(true);
            }, 15000);

            try {
                const database = await DatabaseService.get();
                clearTimeout(timeoutId);
                setDb(database);
            } catch (err) {
                clearTimeout(timeoutId);
                console.error("RxDB Initialization Failed:", err);
                setError(err);
            }
        };
        initDB();

        return () => clearTimeout(timeoutId);
    }, []);

    const [isResetting, setIsResetting] = useState(false);

    const handleHardReset = async () => {
        setIsResetting(true);
        console.log("Initiating Nuclear Hard Reset...");

        try {
            // Attempt graceful destroy
            try {
                await DatabaseService.destroy();
            } catch (e) {
                console.warn("Graceful destroy failed, forcing manual cleanup", e);
            }

            // Nuclear Option: Unregister any Service Workers
            if ('serviceWorker' in navigator) {
                const registrations = await navigator.serviceWorker.getRegistrations();
                for (const registration of registrations) {
                    await registration.unregister();
                }
            }

            // Force clear IndexedDB
            try {
                const dbs = await window.indexedDB.databases();
                await Promise.all(dbs.map(db => new Promise((resolve) => {
                    const req = window.indexedDB.deleteDatabase(db.name);
                    req.onsuccess = () => resolve();
                    req.onerror = () => resolve();
                    req.onblocked = () => resolve();
                })));
            } catch (e) {
                console.warn("Standard DB listing failed, trying fallback lists...", e);
                // Fallback for browsers that don't support databases() or if it fails
                const knownDBs = [DB_NAME, 'kosmoidb_v7', 'kosmoidb_v6', 'kosmoidb_v5', 'rxdb-dexie-' + DB_NAME];
                knownDBs.forEach(name => {
                    try {
                        window.indexedDB.deleteDatabase(name);
                    } catch (err) { /* ignore */ }
                });
            }

            // Clear Storage
            localStorage.clear();
            sessionStorage.clear();

            // Clear Cache API
            if ('caches' in window) {
                const cacheKeys = await caches.keys();
                await Promise.all(cacheKeys.map(key => caches.delete(key)));
            }
        } catch (e) {
            console.error("Hard reset failed", e);
        } finally {
            console.log("Reloading...");
            window.location.reload();
        }
    };

    if (error || isTimeout) {
        return (
            <div className="flex h-screen flex-col items-center justify-center gap-6 bg-slate-900 text-white p-4">
                <div className="text-red-500 font-bold text-2xl">
                    {isTimeout ? "Database Loading Timeout" : "Database Initialization Failed"}
                </div>
                <div className="text-slate-400 text-base max-w-md text-center leading-relaxed">
                    {isTimeout
                        ? "The local database is taking too long to load. This might be due to a corruption or stuck lock."
                        : (
                            <div className="flex flex-col gap-2">
                                <span>{error?.message || "An unexpected error occurred."}</span>
                                <span className="text-white/30 text-xs mt-2 block">DB Error Source: {error?.parameters?.database}</span>
                                <span className="text-green-400/30 text-xs block">Expected DB: {DB_NAME} (v8.2-LOGGING)</span>
                                <div className="mt-4 p-2 bg-black/50 rounded text-left text-[10px] text-green-400 font-mono overflow-auto max-h-60 whitespace-pre-wrap border border-white/10">
                                    {window.__DB_LOGS__ ? window.__DB_LOGS__.join('\n') : "No logs captured."}
                                </div>
                                <span className="text-xs text-slate-600 mt-2">
                                    If this persists, please Hard Reset.
                                </span>
                            </div>
                        )
                    }
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={() => window.location.reload()}
                        className="px-6 py-2 bg-slate-700 rounded hover:bg-slate-600 transition-colors"
                    >
                        Try Reloading
                    </button>
                    <button
                        onClick={handleHardReset}
                        disabled={isResetting}
                        className="px-6 py-2 bg-red-600 rounded hover:bg-red-700 transition-colors font-medium border border-red-500 shadow-lg shadow-red-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isResetting ? "NUKING..." : "HARD RESET (Nuclear)"}
                    </button>
                </div>
            </div>
        );
    }

    if (!db) {
        return <div className="flex h-screen items-center justify-center text-slate-400 animate-pulse flex-col gap-4">
            <div className="w-12 h-12 border-4 border-slate-600 border-t-slate-300 rounded-full animate-spin"></div>
            <span>Loading Database ({DB_NAME})...</span>
        </div>;
    }

    return (
        <RxDBContext.Provider value={db}>
            {children}
        </RxDBContext.Provider>
    );
};

export const useRxDB = () => useContext(RxDBContext);
