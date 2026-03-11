/**
 * agent-tick.js — Vercel Serverless Cron Handler
 *
 * The "Server-Side Brain" of Kosmoi.
 * Replaces the browser-only CoreLoop with a persistent, 24/7 execution engine.
 *
 * Triggered by:
 * - Vercel Cron (configured in vercel.json)
 * - Manual HTTP GET/POST to /api/cron/agent-tick
 *
 * What it does each tick:
 * 1. Reads company_goals to find the biggest gap (target vs current)
 * 2. Checks for open agent_tasks and assigns them
 * 3. If no tasks exist, creates one based on the biggest KPI gap
 * 4. Logs everything to agent_logs for the OptimizerLoop to learn from
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Find the company goal with the biggest gap between target and current
 */
async function findBiggestGap() {
  const { data: goals, error } = await supabase
    .from('company_goals')
    .select('*')
    .eq('status', 'active')
    .order('priority', { ascending: true });

  if (error || !goals || goals.length === 0) {
    return null;
  }

  // Calculate gap percentage for each goal
  let biggestGap = null;
  let biggestGapRatio = 0;

  for (const goal of goals) {
    const gapRatio = goal.target_value > 0
      ? (goal.target_value - goal.current_value) / goal.target_value
      : 1;

    if (gapRatio > biggestGapRatio) {
      biggestGapRatio = gapRatio;
      biggestGap = goal;
    }
  }

  return biggestGap;
}

/**
 * Map a goal's metric_key to a workflow ID
 */
function goalToWorkflow(metricKey) {
  const mapping = {
    'claimed_providers': 'generate_leads',
    'monthly_revenue_thb': 'one_dollar_challenge',
    'active_users': 'generate_leads',
    'avg_provider_rating': null, // No automated workflow yet
  };
  return mapping[metricKey] || 'generate_leads';
}

/**
 * Map a workflow to the best agent for it
 */
function workflowToAgent(workflowId) {
  const mapping = {
    'generate_leads': 'sales-pitch-agent',
    'one_dollar_challenge': 'ceo-agent',
  };
  return mapping[workflowId] || 'ceo-agent';
}

export default async function handler(req, res) {
  const startTime = Date.now();

  try {
    // 1. Check for existing open high-priority tasks
    const { data: openTasks } = await supabase
      .from('agent_tasks')
      .select('*')
      .eq('status', 'open')
      .is('assigned_to', null)
      .order('priority', { ascending: true })
      .limit(1);

    if (openTasks && openTasks.length > 0) {
      const task = openTasks[0];
      const agentId = workflowToAgent(task.workflow || 'generate_leads');

      // Assign the task
      await supabase
        .from('agent_tasks')
        .update({
          assigned_to: agentId,
          status: 'in_progress',
          updated_at: new Date().toISOString()
        })
        .eq('id', task.id);

      // Log
      await logTick('ASSIGN_TASK', {
        taskId: task.id,
        agentId,
        title: task.title,
      });

      return res.status(200).json({
        action: 'assigned_task',
        taskId: task.id,
        agent: agentId,
        duration: Date.now() - startTime,
      });
    }

    // 2. No open tasks — check company goals for the biggest gap
    const biggestGap = await findBiggestGap();

    if (biggestGap) {
      const workflowId = goalToWorkflow(biggestGap.metric_key);

      if (workflowId) {
        // Create a new task based on the gap
        const { data: newTask, error: taskError } = await supabase
          .from('agent_tasks')
          .insert({
            title: `[Auto] Close gap: ${biggestGap.title}`,
            description: `Current: ${biggestGap.current_value}, Target: ${biggestGap.target_value}. Gap: ${((biggestGap.target_value - biggestGap.current_value) / biggestGap.target_value * 100).toFixed(0)}%. Workflow: ${workflowId}`,
            status: 'open',
            priority: biggestGap.priority <= 2 ? 'high' : 'medium',
            workflow: workflowId,
            tags: ['autonomous', 'cron', biggestGap.metric_key],
          })
          .select()
          .single();

        if (!taskError && newTask) {
          await logTick('CREATE_TASK', {
            taskId: newTask.id,
            goal: biggestGap.title,
            gap: `${biggestGap.current_value}/${biggestGap.target_value}`,
            workflow: workflowId,
          });

          return res.status(200).json({
            action: 'created_task',
            taskId: newTask.id,
            goal: biggestGap.title,
            workflow: workflowId,
            duration: Date.now() - startTime,
          });
        }
      }
    }

    // 3. Nothing to do — idle tick
    await logTick('IDLE', { message: 'No actions required.' });

    return res.status(200).json({
      action: 'idle',
      message: 'No immediate actions required.',
      duration: Date.now() - startTime,
    });

  } catch (error) {
    console.error('Agent tick error:', error);
    await logTick('ERROR', { error: error.message });

    return res.status(500).json({
      error: error.message,
      duration: Date.now() - startTime,
    });
  }
}

/**
 * Log a tick event to agent_logs
 */
async function logTick(eventType, metadata) {
  try {
    await supabase.from('agent_logs').insert({
      agent_id: 'core-loop-cron',
      prompt: `[CRON_TICK] ${eventType}`,
      response: JSON.stringify(metadata),
      created_at: new Date().toISOString(),
    });
  } catch (e) {
    console.error('Failed to log tick:', e);
  }
}
