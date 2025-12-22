import React, { createContext, useContext, useEffect, useState } from 'react';
import { DatabaseService } from './database';

const RxDBContext = createContext(null);

export const RxDBProvider = ({ children }) => {
    const [db, setDb] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const initDB = async () => {
            try {
                const database = await DatabaseService.get();
                setDb(database);
            } catch (err) {
                console.error("RxDB Initialization Failed:", err);
                setError(err);
            }
        };
        initDB();
    }, []);

    if (error) {
        return (
            <div className="flex h-screen flex-col items-center justify-center gap-4 bg-slate-900 text-white">
                <div className="text-red-500 font-bold text-xl">Database Initialization Failed</div>
                <div className="text-slate-400 text-sm max-w-md text-center">
                    {error.message || "An unexpected error occurred while loading the database."}
                </div>
                <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 transition-colors"
                >
                    Retry
                </button>
            </div>
        );
    }

    if (!db) {
        return <div className="flex h-screen items-center justify-center text-slate-400">Loading Database...</div>;
    }

    return (
        <RxDBContext.Provider value={db}>
            {children}
        </RxDBContext.Provider>
    );
};

export const useRxDB = () => useContext(RxDBContext);
