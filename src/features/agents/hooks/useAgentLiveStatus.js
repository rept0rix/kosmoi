import { useEffect, useState } from 'react';
import { realSupabase } from '@/api/supabaseClient';

/**
 * Subscribes to agent_tasks in real-time.
 * Returns a map of agentId → { status, currentTask, lastTask }
 * so any component can show live running/idle state.
 */
export function useAgentLiveStatus() {
  const [statusMap, setStatusMap] = useState({}); // { "crm-sales-agent": { status, currentTask, lastTask } }
  const [workerAlive, setWorkerAlive] = useState(null); // null = unknown, true/false

  useEffect(() => {
    // 1. Initial load — get last task per agent
    async function loadInitial() {
      const { data } = await realSupabase
        .from('agent_tasks')
        .select('id, assigned_to, status, title, result, created_at, updated_at')
        .order('created_at', { ascending: false })
        .limit(100);

      if (data) buildStatusMap(data);
    }

    // 2. Check worker heartbeat via company_knowledge
    async function checkHeartbeat() {
      const { data } = await realSupabase
        .from('company_knowledge')
        .select('value, updated_at')
        .eq('key', 'WORKER_HEARTBEAT')
        .single();

      if (data?.updated_at) {
        const lastSeen = new Date(data.updated_at);
        const ageMs = Date.now() - lastSeen.getTime();
        setWorkerAlive(ageMs < 5 * 60 * 1000); // alive if seen in last 5 min
      }
    }

    loadInitial();
    checkHeartbeat();

    // 3. Real-time subscription
    const sub = realSupabase
      .channel('agent-live-status')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'agent_tasks',
      }, (payload) => {
        setStatusMap(prev => {
          const task = payload.new || payload.old;
          if (!task?.assigned_to) return prev;
          return updateAgentStatus(prev, task, payload.eventType);
        });
      })
      .subscribe();

    // 4. Poll heartbeat every 2 min
    const heartbeatInterval = setInterval(checkHeartbeat, 2 * 60 * 1000);

    return () => {
      sub.unsubscribe();
      clearInterval(heartbeatInterval);
    };
  }, []);

  function buildStatusMap(tasks) {
    const map = {};
    // Group by agent, pick most recent per agent
    tasks.forEach(task => {
      const id = task.assigned_to;
      if (!id) return;
      if (!map[id]) {
        map[id] = {
          status: task.status,
          currentTask: task.status === 'in_progress' ? task : null,
          lastTask: task,
        };
      } else if (task.status === 'in_progress') {
        map[id].status = 'in_progress';
        map[id].currentTask = task;
      }
    });
    setStatusMap(map);
  }

  function updateAgentStatus(prev, task, eventType) {
    const id = task.assigned_to;
    const existing = prev[id] || {};

    if (task.status === 'in_progress') {
      return { ...prev, [id]: { status: 'in_progress', currentTask: task, lastTask: existing.lastTask || task } };
    }
    // Task finished — check if any other in_progress tasks exist for this agent
    const stillRunning = task.status === 'in_progress';
    return {
      ...prev,
      [id]: {
        status: stillRunning ? 'in_progress' : 'idle',
        currentTask: stillRunning ? task : null,
        lastTask: ['done', 'failed'].includes(task.status) ? task : existing.lastTask,
      }
    };
  }

  return { statusMap, workerAlive };
}
