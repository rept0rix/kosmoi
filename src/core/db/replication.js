import { replicateRxCollection } from 'rxdb/plugins/replication';
import { db as supabase } from '@/api/supabaseClient';

/**
 * Replicates a specific RxDB collection with a Supabase table
 * @param {import('rxdb').RxCollection} collection - The RxDB collection to replicate
 * @param {string} tableName - The Supabase table name
 */
export const replicateCollection = async (collection, tableName) => {
    const replicationState = await replicateRxCollection({
        collection,
        replicationIdentifier: `replication-${tableName}`,
        pull: {
            handler: async (lastCheckpoint, batchSize) => {
                let query = supabase.from(tableName).select('*');

                if (lastCheckpoint) {
                    // Assuming 'updated_at' is used for checkpointing
                    query = query.gt('updated_at', lastCheckpoint.updated_at);
                }

                const { data, error } = await query.order('updated_at').limit(batchSize);

                if (error) throw error;

                if (data.length === 0) {
                    return {
                        documents: [],
                        checkpoint: lastCheckpoint
                    };
                }

                const lastDoc = data[data.length - 1];
                return {
                    documents: data,
                    checkpoint: {
                        updated_at: lastDoc.updated_at
                    }
                };
            }
        },
        push: {
            handler: async (rows) => {
                for (const row of rows) {
                    const { id, ...data } = row.newDocumentState;
                    // Handle conflict resolution or simple upsert
                    console.log(`Pushing change to ${tableName}:`, id);
                    const { error } = await supabase.from(tableName).upsert({ id, ...data });
                    if (error) throw error;
                }
                return []; // Return conflicting documents if any
            }
        },
        live: true,
        retryTime: 5000,
    });

    return replicationState;
};
