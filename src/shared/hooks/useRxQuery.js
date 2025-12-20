import { useState, useEffect } from 'react';
import { useRxDB } from '@/core/db/RxDBProvider';

/**
 * Custom hook to subscribe to an RxDB query
 * @param {string} collectionName - Name of the collection (e.g., 'vendors')
 * @param {Function} queryCallback - Function that takes the collection and returns a query object
 */
export const useRxQuery = (collectionName, queryCallback) => {
    const db = useRxDB();
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!db || !collectionName) return;

        const collection = db[collectionName];
        if (!collection) {
            setError(new Error(`Collection ${collectionName} not found`));
            setLoading(false);
            return;
        }

        let sub = null;

        try {
            const query = queryCallback ? queryCallback(collection) : collection.find();

            sub = query.$.subscribe(docs => {
                setResult(docs);
                setLoading(false);
            });
        } catch (err) {
            setError(err);
            setLoading(false);
        }

        return () => {
            if (sub && sub.unsubscribe) {
                sub.unsubscribe();
            }
        };
    }, [db, collectionName]); // Re-subscribe if db or collection changes. queryCallback should be stable or wrapped in useCallback

    return { data: result, loading, error };
};
