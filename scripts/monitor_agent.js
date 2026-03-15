/**
 * monitor_agent.js
 * Self-monitoring script for the Kosmoi autonomous agent system.
 * Checks system health every 5 minutes and sends alerts via Telegram.
 *
 * Run: node scripts/monitor_agent.js
 * Or cron: * /5 * * * * node /app/scripts/monitor_agent.js >> /app/logs/monitor.log 2>&1
 */

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

// ── Config ────────────────────────────────────────────────────────────────────
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

const CHECK_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

// Thresholds (matching SYSTEM_HEALTH_BASELINE)
const THRESHOLDS = {
  PENDING_TASKS_ALERT: 5,
  FAILED_TASKS_24H_ALERT: 10,
  AGENT_IDLE_HOURS: 6,
};

// Agents we actively monitor for idle status
const MONITORED_AGENTS = [
  "crm-sales-agent",
  "planner-agent",
  "optimizer-agent",
  "tech-scout-agent",
  "ceo-agent",
  "concierge-agent",
];

// ── Supabase ──────────────────────────────────────────────────────────────────
if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ VITE_SUPABASE_URL or VITE_SUPABASE_SERVICE_ROLE_KEY missing from .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// ── Telegram ──────────────────────────────────────────────────────────────────
async function sendTelegramAlert(message) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.warn("⚠️ Telegram credentials not set — skipping alert");
    console.warn("   Message would have been:", message);
    return;
  }

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: `🚨 *Kosmoi Monitor Alert*\n\n${message}`,
          parse_mode: "Markdown",
        }),
      }
    );

    if (!res.ok) {
      const body = await res.text();
      console.error("❌ Telegram send failed:", body);
    } else {
      console.log("📬 Telegram alert sent");
    }
  } catch (err) {
    console.error("❌ Telegram fetch error:", err.message);
  }
}

// ── Check 1: Pending tasks older than 1 hour ─────────────────────────────────
async function checkStalePendingTasks() {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("agent_tasks")
    .select("id, title, assigned_to, created_at")
    .eq("status", "pending")
    .lt("created_at", oneHourAgo);

  if (error) {
    console.error("❌ checkStalePendingTasks error:", error.message);
    return { count: 0, tasks: [] };
  }

  return { count: data.length, tasks: data };
}

// ── Check 2: Failed tasks in last 24 hours ────────────────────────────────────
async function checkFailedTasksLast24h() {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("agent_tasks")
    .select("id, title, assigned_to, updated_at")
    .eq("status", "failed")
    .gte("updated_at", oneDayAgo);

  if (error) {
    console.error("❌ checkFailedTasksLast24h error:", error.message);
    return { count: 0, tasks: [] };
  }

  return { count: data.length, tasks: data };
}

// ── Check 3: Agent idle >6h — create health check task ───────────────────────
async function checkIdleAgents() {
  const idleThreshold = new Date(
    Date.now() - THRESHOLDS.AGENT_IDLE_HOURS * 60 * 60 * 1000
  ).toISOString();

  const idleAgents = [];

  for (const agentId of MONITORED_AGENTS) {
    // Find the most recent completed/in_progress task for this agent
    const { data, error } = await supabase
      .from("agent_tasks")
      .select("id, updated_at, status")
      .eq("assigned_to", agentId)
      .in("status", ["done", "completed", "in_progress"])
      .order("updated_at", { ascending: false })
      .limit(1);

    if (error) {
      console.error(`❌ checkIdleAgents error for ${agentId}:`, error.message);
      continue;
    }

    if (!data || data.length === 0) {
      // Never worked — counts as idle
      idleAgents.push({ agentId, lastSeen: null });
    } else if (data[0].updated_at < idleThreshold) {
      idleAgents.push({ agentId, lastSeen: data[0].updated_at });
    }
  }

  // Create health check tasks for idle agents
  for (const { agentId, lastSeen } of idleAgents) {
    const { error } = await supabase.from("agent_tasks").insert([
      {
        title: `[HEALTH CHECK] Ping ${agentId}`,
        description: `Automated health check: ${agentId} has been idle since ${lastSeen || "never"}. Please confirm you are running and report system status.`,
        assigned_to: agentId,
        priority: "high",
        status: "pending",
        created_by: "monitor-agent",
      },
    ]);

    if (error) {
      console.error(`❌ Failed to create health check task for ${agentId}:`, error.message);
    } else {
      console.log(`🩺 Health check task created for idle agent: ${agentId}`);
    }
  }

  return idleAgents;
}

// ── Check 4: Update WORKER_STATUS in company_knowledge ───────────────────────
async function updateWorkerStatus(metrics) {
  const { error } = await supabase.from("company_knowledge").upsert(
    {
      key: "WORKER_STATUS",
      value: {
        ...metrics,
        last_checked_at: new Date().toISOString(),
        monitor_version: "1.0.0",
        status: deriveStatus(metrics),
      },
      category: "monitoring",
      updated_by: "monitor-agent",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "key" }
  );

  if (error) {
    console.error("❌ Failed to update WORKER_STATUS:", error.message);
  } else {
    console.log("📊 WORKER_STATUS updated in company_knowledge");
  }
}

function deriveStatus(metrics) {
  if (
    metrics.failed_tasks_24h >= THRESHOLDS.FAILED_TASKS_24H_ALERT ||
    metrics.stale_pending_tasks >= THRESHOLDS.PENDING_TASKS_ALERT * 2
  ) {
    return "critical";
  }
  if (
    metrics.stale_pending_tasks >= THRESHOLDS.PENDING_TASKS_ALERT ||
    metrics.idle_agents_count > 0
  ) {
    return "degraded";
  }
  return "healthy";
}

// ── Main Health Check Cycle ───────────────────────────────────────────────────
async function runHealthCheck() {
  const startTime = Date.now();
  console.log(`\n[${new Date().toISOString()}] 🔍 Running health check...`);

  const alerts = [];

  // Check 1: Stale pending tasks
  const { count: stalePendingCount, tasks: staleTasks } = await checkStalePendingTasks();
  console.log(`  📋 Stale pending tasks (>1h): ${stalePendingCount}`);

  if (stalePendingCount > THRESHOLDS.PENDING_TASKS_ALERT) {
    const taskSummary = staleTasks
      .slice(0, 5)
      .map((t) => `  • ${t.assigned_to}: "${t.title}"`)
      .join("\n");
    alerts.push(
      `⏳ *${stalePendingCount} tasks pending >1h*\nTop offenders:\n${taskSummary}`
    );
  }

  // Check 2: Failed tasks in 24h
  const { count: failedCount } = await checkFailedTasksLast24h();
  console.log(`  💀 Failed tasks (24h): ${failedCount}`);

  if (failedCount > THRESHOLDS.FAILED_TASKS_24H_ALERT) {
    alerts.push(
      `💀 *${failedCount} tasks failed in the last 24h* — investigate agent logs immediately`
    );
  }

  // Check 3: Idle agents
  const idleAgents = await checkIdleAgents();
  console.log(`  😴 Idle agents (>${THRESHOLDS.AGENT_IDLE_HOURS}h): ${idleAgents.length}`);

  if (idleAgents.length > 0) {
    const idleList = idleAgents.map((a) => `  • ${a.agentId}`).join("\n");
    alerts.push(`😴 *${idleAgents.length} agents idle >${THRESHOLDS.AGENT_IDLE_HOURS}h*\n${idleList}\n_Health check tasks created._`);
  }

  // Build metrics payload
  const metrics = {
    stale_pending_tasks: stalePendingCount,
    failed_tasks_24h: failedCount,
    idle_agents_count: idleAgents.length,
    idle_agents: idleAgents.map((a) => a.agentId),
    check_duration_ms: Date.now() - startTime,
  };

  // Check 4: Update WORKER_STATUS
  await updateWorkerStatus(metrics);

  // Send consolidated Telegram alert if any issues
  if (alerts.length > 0) {
    const alertMessage = alerts.join("\n\n---\n\n");
    await sendTelegramAlert(alertMessage);
  } else {
    console.log("  ✅ All systems nominal — no alerts");
  }

  console.log(`  ⏱️  Check completed in ${Date.now() - startTime}ms`);
}

// ── Entry Point ───────────────────────────────────────────────────────────────
const runOnce = process.argv.includes("--once");

if (runOnce) {
  // Single run mode (for cron)
  runHealthCheck()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Fatal error:", err);
      process.exit(1);
    });
} else {
  // Daemon mode — runs every 5 minutes
  console.log("🤖 Monitor Agent started (daemon mode — checks every 5 minutes)");
  runHealthCheck(); // run immediately on start
  setInterval(runHealthCheck, CHECK_INTERVAL_MS);
}
