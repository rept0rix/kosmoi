import { useEffect } from 'react';
import { getDatabase } from './config';
import { startReplication } from './replication';

export function RxDBInitializer() {
    useEffect(() => {
        const init = async () => {
            try {
                console.log("🔌 RxDB: Initializing...");
                const db = await getDatabase();
                if (!db) {
                    console.error("❌ RxDB: Failed to create database instance");
                    return;
                }

                console.log("🔄 RxDB: Starting Replication...");
                await startReplication(db);
                console.log("✅ RxDB: Offline-First System Ready");
            } catch (err) {
                console.error("❌ RxDB Initialization Error:", err);
            }
        };
        init();
    }, []);
    return null;
}
