import { replicateRxCollection } from 'rxdb/plugins/replication';
import { supabase } from '../../api/supabaseClient';

const REPLICATION_SIZE = 50;

/**
 * Replicates a specific collection with Supabase
 * @param {import('rxdb').RxCollection} collection 
 * @param {string} tableName 
 */
async function replicateTable(collection, tableName) {
    console.log(`🔌 Starting replication for ${tableName}...`);

    // Check if table supports last_modified/updated_at for checkpoint
    // We assume 'updated_at' exists as per our standard schema

    const replicationState = await replicateRxCollection({
        collection,
        replicationIdentifier: `supabase-${tableName}`,
        pull: {
            async handler(lastCheckpoint, batchSize) {
                // console.log(`📥 Pulling ${tableName}...`, lastCheckpoint);

                let query = supabase.from(tableName).select('*');

                if (lastCheckpoint) {
                    // Assuming 'updated_at' is the cursor
                    query = query.gt('updated_at', lastCheckpoint.updated_at);
                }

                const { data, error } = await query
                    .order('updated_at', { ascending: true })
                    .limit(batchSize);

                if (error) {
                    console.error(`Pull error for ${tableName}:`, error);
                    throw error;
                }

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
                        updated_at: lastDoc.updated_at,
                        id: lastDoc.id
                    }
                };
            }
        },
        push: {
            async handler(docs) {
                console.log(`outbox 📤 Pushing ${docs.length} docs to ${tableName}...`);
                const rows = docs.map(d => d.newDocumentState);

                const { error } = await supabase
                    .from(tableName)
                    .upsert(rows);

                if (error) {
                    console.error(`Push error for ${tableName}:`, error);
                    throw error;
                }
                return []; // Return empty array if all succeeded
            }
        },
        live: true,
        retryTime: 5000,
        waitForLeadership: false
    });

    replicationState.error$.subscribe(err => {
        console.error(`Replication error on ${tableName}:`, err);
    });

    return replicationState;
}

export async function startReplication(db) {
    const states = [];

    // Replicate Tasks
    if (db.tasks) {
        states.push(await replicateTable(db.tasks, 'agent_tasks'));
    }

    // Replicate Leads
    if (db.leads) {
        states.push(await replicateTable(db.leads, 'crm_leads'));
    }

    return states;
}
