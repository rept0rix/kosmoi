import React, { createContext, useContext, useEffect, useState } from 'react';
import { DatabaseService } from './database';

const RxDBContext = createContext(null);

export const RxDBProvider = ({ children }) => {
    const [db, setDb] = useState(null);

    useEffect(() => {
        const initDB = async () => {
            const database = await DatabaseService.get();
            setDb(database);
        };
        initDB();
    }, []);

    if (!db) {
        return <div className="flex h-screen items-center justify-center">Loading Database...</div>;
    }

    return (
        <RxDBContext.Provider value={db}>
            {children}
        </RxDBContext.Provider>
    );
};

export const useRxDB = () => useContext(RxDBContext);
