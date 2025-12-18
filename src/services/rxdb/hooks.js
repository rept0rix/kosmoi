import { useState, useEffect } from 'react';
import { getDatabase } from './config';

export function useRxDB() {
    const [db, setDb] = useState(null);

    useEffect(() => {
        getDatabase().then(setDb).catch(err => console.error("RxDB init error:", err));
    }, []);

    return db;
}

export function useRxCollection(collectionName) {
    const db = useRxDB();
    const [collection, setCollection] = useState(null);

    useEffect(() => {
        if (db && db[collectionName]) {
            setCollection(db[collectionName]);
        }
    }, [db, collectionName]);

    return collection;
}

export function useRxQuery(collectionName, queryFn) {
    const collection = useRxCollection(collectionName);
    const [result, setResult] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!collection) return;

        const queryObj = queryFn ? queryFn(collection) : collection.find();

        const sub = queryObj.$.subscribe(docs => {
            setResult(docs);
            setLoading(false);
        });

        return () => sub.unsubscribe();
    }, [collection]);

    return { result, loading };
}
