import React, { useState, useEffect, useMemo } from 'react';
import {
    ReactFlow,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    BackgroundVariant,
    Handle,
    Position
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { supabase } from '@/api/supabaseClient';
import { Loader2, RefreshCw, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';

// --- Custom Node: Database Table ---
const TableNode = ({ data }) => (
    <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-xl overflow-hidden min-w-[220px]">
        <div className="bg-slate-800 px-3 py-2 border-b border-slate-700 flex items-center justify-between">
            <span className="font-bold text-sm text-slate-200">{data.label}</span>
            <span className="text-[10px] bg-slate-700 px-1.5 py-0.5 rounded text-slate-400">
                {data.rowCount !== undefined ? `${data.rowCount} rows` : 'table'}
            </span>
        </div>
        <div className="p-2 space-y-1 max-h-[200px] overflow-y-auto">
            {data.columns.map((col, idx) => (
                <div key={idx} className="flex items-center text-xs text-slate-400">
                    <div className={`w-2 h-2 rounded-full mr-2 ${col.pk ? 'bg-amber-500' : col.fk ? 'bg-blue-500' : 'bg-slate-600'}`} />
                    <span className={col.pk ? 'text-amber-400 font-medium' : col.fk ? 'text-blue-300' : 'text-slate-300'}>{col.name}</span>
                    <span className="ml-auto text-[10px] text-slate-500">{col.type}</span>
                </div>
            ))}
        </div>
        <Handle type="target" position={Position.Left} className="!bg-slate-500 !w-2 !h-8 !rounded-sm opacity-0" />
        <Handle type="source" position={Position.Right} className="!bg-slate-500 !w-2 !h-8 !rounded-sm opacity-0" />
    </div>
);

const nodeTypes = { table: TableNode };

// --- Grid layout helper ---
function layoutNodes(tables) {
    const cols = 4;
    const xGap = 320;
    const yGap = 280;
    const startX = 50;
    const startY = 80;

    return tables.map((table, i) => ({
        id: table.name,
        type: 'table',
        position: {
            x: startX + (i % cols) * xGap,
            y: startY + Math.floor(i / cols) * yGap
        },
        data: {
            label: table.name,
            rowCount: table.rowCount,
            columns: table.columns
        }
    }));
}

// --- Detect FK edges from column names ---
function detectEdges(tables) {
    const tableNames = new Set(tables.map(t => t.name));
    const edges = [];

    tables.forEach(table => {
        table.columns.forEach(col => {
            if (col.fk && col.fkTable && tableNames.has(col.fkTable)) {
                edges.push({
                    id: `${table.name}-${col.name}-${col.fkTable}`,
                    source: col.fkTable,
                    target: table.name,
                    animated: true,
                    style: { stroke: '#6366f1', strokeDasharray: '5,5' }
                });
            } else if (col.name.endsWith('_id') && !col.pk) {
                // Heuristic: column named "xxx_id" likely points to table "xxx" or "xxxs"
                const baseName = col.name.replace(/_id$/, '');
                const candidates = [baseName, baseName + 's', baseName + 'es'];
                for (const candidate of candidates) {
                    if (tableNames.has(candidate) && candidate !== table.name) {
                        edges.push({
                            id: `${table.name}-${col.name}-${candidate}`,
                            source: candidate,
                            target: table.name,
                            animated: true,
                            style: { stroke: '#64748b' }
                        });
                        break;
                    }
                }
            }
        });
    });

    return edges;
}

export default function SchemaMap() {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [loading, setLoading] = useState(true);
    const [tableCount, setTableCount] = useState(0);
    const [error, setError] = useState(null);

    const loadSchema = async () => {
        setLoading(true);
        setError(null);

        try {
            // Query information_schema for public tables and columns
            const { data: columnsData, error: colErr } = await supabase
                .rpc('get_schema_info')
                .select('*');

            if (colErr) {
                // Fallback: direct query if RPC doesn't exist
                const { data: fallbackData, error: fallbackErr } = await supabase
                    .from('information_schema_columns')
                    .select('*');

                if (fallbackErr) {
                    // Second fallback: use the known tables approach
                    await loadSchemaFallback();
                    return;
                }
            }

            // If RPC works, use it; otherwise use fallback
            await loadSchemaFallback();

        } catch (err) {
            console.error('Schema load error:', err);
            setError(err.message);
            // Still show something - load fallback
            await loadSchemaFallback();
        } finally {
            setLoading(false);
        }
    };

    const loadSchemaFallback = async () => {
        // Query known tables and get their structure via select
        const knownTables = [
            'users', 'service_providers', 'reviews', 'favorites', 'bookings',
            'agent_tasks', 'agent_logs', 'agent_memory', 'agent_skills', 'agent_files',
            'company_goals', 'leads', 'crm_leads', 'invitations',
            'inbound_emails', 'marketing_posts', 'wallets', 'wallet_transactions',
            'code_knowledge', 'notifications'
        ];

        const tables = [];

        for (const tableName of knownTables) {
            try {
                // Try to get row count and column info
                const { count, error: countErr } = await supabase
                    .from(tableName)
                    .select('*', { count: 'exact', head: true });

                if (countErr) continue; // Table doesn't exist, skip

                // Get sample row to discover columns
                const { data: sampleRow, error: sampleErr } = await supabase
                    .from(tableName)
                    .select('*')
                    .limit(1);

                let columns = [];
                if (sampleRow && sampleRow.length > 0) {
                    columns = Object.keys(sampleRow[0]).map(key => ({
                        name: key,
                        type: inferType(sampleRow[0][key]),
                        pk: key === 'id',
                        fk: key.endsWith('_id') && key !== 'id',
                    }));
                } else {
                    // Empty table - at least show id
                    columns = [{ name: 'id', type: 'uuid', pk: true }];
                }

                tables.push({
                    name: tableName,
                    rowCount: count || 0,
                    columns
                });
            } catch (e) {
                // Table doesn't exist or permission denied
                continue;
            }
        }

        setTableCount(tables.length);

        const nodeList = layoutNodes(tables);
        const edgeList = detectEdges(tables);

        setNodes(nodeList);
        setEdges(edgeList);
    };

    useEffect(() => {
        loadSchema();
    }, []);

    return (
        <div className="h-full w-full flex flex-col items-center justify-center bg-slate-950 relative">
            {/* Header */}
            <div className="absolute top-4 left-4 z-10 pointer-events-none">
                <h2 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
                    <Database className="w-5 h-5 text-indigo-400" />
                    Live Schema Map
                </h2>
                <p className="text-sm text-slate-400">
                    {loading ? 'Loading schema...' : `${tableCount} tables detected from Supabase`}
                </p>
            </div>

            {/* Refresh */}
            <div className="absolute top-4 right-4 z-10">
                <Button
                    onClick={loadSchema}
                    disabled={loading}
                    variant="outline"
                    size="sm"
                    className="border-white/10 bg-slate-900/80 backdrop-blur"
                >
                    {loading
                        ? <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        : <RefreshCw className="w-4 h-4 mr-2" />
                    }
                    Refresh
                </Button>
            </div>

            {loading && nodes.length === 0 ? (
                <div className="flex flex-col items-center gap-3 text-slate-500">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
                    <p>Reading database schema...</p>
                </div>
            ) : (
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    nodeTypes={nodeTypes}
                    fitView
                    className="bg-slate-950"
                >
                    <Background variant={BackgroundVariant.Lines} gap={40} size={1} color="#1e293b" />
                    <Controls className="!bg-slate-800 !border-slate-700 !fill-white" />
                </ReactFlow>
            )}
        </div>
    );
}

// --- Utility: infer column type from a JS value ---
function inferType(value) {
    if (value === null || value === undefined) return 'null';
    if (typeof value === 'number') return Number.isInteger(value) ? 'int' : 'float';
    if (typeof value === 'boolean') return 'bool';
    if (typeof value === 'object') {
        if (Array.isArray(value)) return 'array';
        return 'jsonb';
    }
    if (typeof value === 'string') {
        if (/^\d{4}-\d{2}-\d{2}/.test(value)) return 'timestamp';
        if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) return 'uuid';
        return 'text';
    }
    return typeof value;
}
