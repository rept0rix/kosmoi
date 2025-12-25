import React, { createContext, useContext, useEffect, useState } from 'react';
import { DatabaseService } from './database';

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
            const dbs = await window.indexedDB.databases();
            await Promise.all(dbs.map(db => new Promise((resolve) => {
                const req = window.indexedDB.deleteDatabase(db.name);
                req.onsuccess = () => resolve();
                req.onerror = () => resolve();
                req.onblocked = () => resolve();
            })));

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
                                {error?.parameters?.database && (
                                    <span className="text-xs font-mono text-slate-500 bg-slate-800 p-1 rounded">
                                        DB Error Source: {error.parameters.database}
                                    </span>
                                )}
                                <span className="text-xs font-mono text-green-400 bg-green-900/30 p-1 rounded border border-green-800">
                                    Expected DB: kosmoidb_v6
                                </span>
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
            <span>Loading Database (v6)...</span>
        </div>;
    }

    return (
        <RxDBContext.Provider value={db}>
            {children}
        </RxDBContext.Provider>
    );
};

export const useRxDB = () => useContext(RxDBContext);
