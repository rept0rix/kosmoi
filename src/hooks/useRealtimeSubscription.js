import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/api/supabaseClient";

/**
 * useRealtimeSubscription Hook
 *
 * Subscribes to real-time changes on a Supabase table and provides
 * automatic data synchronization.
 *
 * @param {string} table - The table name to subscribe to
 * @param {object} options - Configuration options
 * @param {string} options.schema - Database schema (default: 'public')
 * @param {string} options.event - Event type: 'INSERT', 'UPDATE', 'DELETE', or '*' for all
 * @param {function} options.filter - Optional filter function for incoming changes
 * @param {function} options.onInsert - Callback when a new record is inserted
 * @param {function} options.onUpdate - Callback when a record is updated
 * @param {function} options.onDelete - Callback when a record is deleted
 * @param {function} options.onError - Callback when an error occurs
 *
 * @example
 * const { isConnected, lastEvent } = useRealtimeSubscription('leads', {
 *   onInsert: (newLead) => setLeads(prev => [newLead, ...prev]),
 *   onUpdate: (updatedLead) => setLeads(prev =>
 *     prev.map(l => l.id === updatedLead.id ? updatedLead : l)
 *   ),
 *   onDelete: (deletedLead) => setLeads(prev =>
 *     prev.filter(l => l.id !== deletedLead.id)
 *   )
 * });
 */
export function useRealtimeSubscription(table, options = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState(null);
  const [error, setError] = useState(null);

  const {
    schema = "public",
    event = "*",
    filter,
    onInsert,
    onUpdate,
    onDelete,
    onError,
  } = options;

  useEffect(() => {
    if (!table) return;

    const channelName = `${table}-realtime-${Date.now()}`;

    const subscription = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: event,
          schema: schema,
          table: table,
        },
        (payload) => {
          // Apply filter if provided
          if (filter && !filter(payload)) {
            return;
          }

          setLastEvent({
            type: payload.eventType,
            timestamp: new Date().toISOString(),
            data: payload.new || payload.old,
          });

          // Call appropriate callback
          switch (payload.eventType) {
            case "INSERT":
              onInsert?.(payload.new);
              break;
            case "UPDATE":
              onUpdate?.(payload.new, payload.old);
              break;
            case "DELETE":
              onDelete?.(payload.old);
              break;
          }
        },
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setIsConnected(true);
          setError(null);
          console.log(`🔴 Real-time connected: ${table}`);
        } else if (status === "CHANNEL_ERROR") {
          setIsConnected(false);
          const err = new Error(`Subscription error for ${table}`);
          setError(err);
          onError?.(err);
          console.error(`Real-time error: ${table}`, status);
        } else if (status === "TIMED_OUT") {
          setIsConnected(false);
          console.warn(`Real-time timeout: ${table}`);
        }
      });

    // Cleanup on unmount
    return () => {
      console.log(`⚪ Real-time disconnected: ${table}`);
      subscription.unsubscribe();
    };
  }, [table, schema, event]);

  return {
    isConnected,
    lastEvent,
    error,
  };
}

/**
 * useRealtimeData Hook
 *
 * A higher-level hook that combines data fetching with real-time subscriptions.
 * Automatically keeps local data in sync with database changes.
 *
 * @param {string} table - The table name
 * @param {object} options - Configuration options
 * @param {function} options.fetchFn - Custom fetch function (receives supabase query builder)
 * @param {string} options.orderBy - Column to order by
 * @param {boolean} options.ascending - Order direction
 * @param {number} options.limit - Max records to fetch
 *
 * @example
 * const { data, loading, error, refresh } = useRealtimeData('leads', {
 *   orderBy: 'created_at',
 *   ascending: false,
 *   limit: 50
 * });
 */
export function useRealtimeData(table, options = {}) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const {
    fetchFn,
    orderBy = "created_at",
    ascending = false,
    limit = 100,
  } = options;

  // Fetch initial data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase.from(table).select("*");

      if (orderBy) {
        query = query.order(orderBy, { ascending });
      }

      if (limit) {
        query = query.limit(limit);
      }

      // Allow custom query modifications
      if (fetchFn) {
        query = fetchFn(query);
      }

      const { data: result, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setData(result || []);
      setError(null);
    } catch (err) {
      console.error(`Error fetching ${table}:`, err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [table, fetchFn, orderBy, ascending, limit]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Real-time subscription
  const { isConnected } = useRealtimeSubscription(table, {
    onInsert: (record) => {
      setData((prev) => [record, ...prev]);
    },
    onUpdate: (record) => {
      setData((prev) =>
        prev.map((item) => (item.id === record.id ? record : item)),
      );
    },
    onDelete: (record) => {
      setData((prev) => prev.filter((item) => item.id !== record.id));
    },
    onError: setError,
  });

  return {
    data,
    loading,
    error,
    isConnected,
    refresh: fetchData,
  };
}

/**
 * useRealtimeCount Hook
 *
 * Subscribes to a table and keeps a real-time count.
 * Useful for dashboard stats and badges.
 *
 * @example
 * const { count, isConnected } = useRealtimeCount('leads', {
 *   filter: (payload) => payload.new.status === 'new'
 * });
 */
export function useRealtimeCount(table, options = {}) {
  const [count, setCount] = useState(0);
  const { filter } = options;

  // Fetch initial count
  useEffect(() => {
    const fetchCount = async () => {
      let query = supabase
        .from(table)
        .select("*", { count: "exact", head: true });
      const { count: total } = await query;
      setCount(total || 0);
    };
    fetchCount();
  }, [table]);

  // Real-time updates
  const { isConnected } = useRealtimeSubscription(table, {
    filter,
    onInsert: () => setCount((prev) => prev + 1),
    onDelete: () => setCount((prev) => Math.max(0, prev - 1)),
  });

  return { count, isConnected };
}

export default useRealtimeSubscription;
