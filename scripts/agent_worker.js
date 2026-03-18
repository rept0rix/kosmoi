import "dotenv/config";
import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { fileURLToPath } from "url";
import readline from "readline"; // Import readline
import nodemailer from "nodemailer"; // Added Nodemailer

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..");

global.localStorage = {
  _data: {},
  getItem: function (key) {
    return this._data[key] || null;
  },
  setItem: function (key, value) {
    this._data[key] = value;
  },
  removeItem: function (key) {
    delete this._data[key];
  },
  clear: function () {
    this._data = {};
  },
};

// Set Service Role Key to bypass RLS
if (process.env.VITE_SUPABASE_SERVICE_ROLE_KEY) {
  global.localStorage.setItem(
    "sb-access-token",
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
  );
  console.log("🔑 Worker running with Service Role Privileges");
}

// --- WORKER RUNTIME CONFIG (applied at startup, no disk writes) ---
let workerRuntimeConfig = {
  logLevel: "info",         // "debug" | "info" | "warn"
  pollIntervalMs: null,     // override poll interval if set
  modelOverride: null,      // override AI model if set
};

// --- SAFE CONFIG PULL (replaces insecure OTA self-overwrite) ---
async function checkForUpdates() {
  console.log("📡 Checking for runtime config (WORKER_CONFIG in company_knowledge)...");

  const { data, error } = await workerSupabase
    .from("company_knowledge")
    .select("key, value, updated_at")
    .eq("key", "WORKER_CONFIG")
    .single();

  if (error || !data) {
    console.log("✅ No WORKER_CONFIG found — using defaults.");
    return;
  }

  try {
    const raw = data.value;
    const config = typeof raw === "string" ? JSON.parse(raw) : raw;

    // Only accept a strict allowlist of safe scalar config keys.
    // Any attempt to set 'code', 'script', 'exec', or similar is ignored.
    const ALLOWED_KEYS = ["logLevel", "pollIntervalMs", "modelOverride", "systemPromptAddendum"];
    const applied = {};

    for (const key of ALLOWED_KEYS) {
      if (config[key] !== undefined) {
        const value = config[key];
        // Additional type guards per key
        if (key === "logLevel" && ["debug", "info", "warn"].includes(value)) {
          workerRuntimeConfig.logLevel = value;
          applied[key] = value;
        } else if (key === "pollIntervalMs" && typeof value === "number" && value >= 5000) {
          workerRuntimeConfig.pollIntervalMs = value;
          applied[key] = value;
        } else if (key === "modelOverride" && typeof value === "string" && value.length < 100) {
          workerRuntimeConfig.modelOverride = value;
          applied[key] = value;
        } else if (key === "systemPromptAddendum" && typeof value === "string" && value.length < 2000) {
          workerRuntimeConfig.systemPromptAddendum = value;
          applied[key] = `[${value.length} chars]`;
        }
      }
    }

    if (Object.keys(applied).length > 0) {
      console.log("✅ WORKER_CONFIG applied to runtime (no disk writes):", applied);
    } else {
      console.log("✅ WORKER_CONFIG present but no valid keys to apply.");
    }
  } catch (e) {
    console.error("❌ Failed to parse WORKER_CONFIG payload:", e.message);
  }
}
// -----------------------------
// --- GIT SYNC LOGIC ---
async function gitSync(taskTitle) {
  if (!process.env.Git_Sync_Enabled) return;

  console.log("💾 Git Sync: Committing changes...");
  try {
    const commitMsg = `feat(worker): Auto-Task: ${taskTitle.replace(/"/g, '\\"')}`;

    await new Promise((resolve, reject) => {
      exec("git add .", { cwd: PROJECT_ROOT }, (err) =>
        err ? reject(err) : resolve(),
      );
    });

    await new Promise((resolve, reject) => {
      exec(`git commit -m "${commitMsg}"`, { cwd: PROJECT_ROOT }, (err) => {
        // Ignore "nothing to commit" errors
        if (err && err.message.includes("nothing to commit")) resolve();
        else if (err) reject(err);
        else resolve();
      });
    });

    await new Promise((resolve, reject) => {
      exec("git push", { cwd: PROJECT_ROOT }, (err) =>
        err ? reject(err) : resolve(),
      );
    });

    console.log("✅ Git Sync: Changes pushed to repo.");
  } catch (e) {
    console.error("❌ Git Sync Failed:", e.message);
  }
}
// -----------------------------

// --- LOGGING OVERRIDE ---
const logFile = path.join(process.cwd(), "worker.log");
const originalLog = console.log;
const originalError = console.error;

function logToFile(type, args) {
  const message = args
    .map((arg) =>
      typeof arg === "object" ? JSON.stringify(arg, null, 2) : String(arg),
    )
    .join(" ");
  const timestamp = new Date().toISOString();
  const logLine = `[${timestamp}] [${type}] ${message}\n`;
  fs.appendFileSync(logFile, logLine);
}

console.log = function (...args) {
  originalLog.apply(console, args);
  logToFile("INFO", args);
};

console.error = function (...args) {
  originalError.apply(console, args);
  logToFile("ERROR", args);
};
// ------------------------

// --- ADMIN VISIBILITY: Log to Supabase agent_logs (powers LiveAgentFeed) ---
async function logToAdmin(agentId, message, level = "info", metadata = {}) {
  try {
    await workerSupabase.from("agent_logs").insert({
      agent_id: agentId || "worker",
      level,
      message,
      metadata: { role: "assistant", username: agentId || "worker", source: "agent_worker", ...metadata },
    });
  } catch (_) { /* non-fatal */ }
}

// --- TELEGRAM NOTIFICATIONS ---
async function notifyTelegram(message) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chat = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chat) return;
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chat, text: message, parse_mode: "Markdown" }),
    });
  } catch (_) { /* non-fatal */ }
}

// --- WORKER MEMORY: persist context between tasks ---
async function loadWorkerMemory() {
  try {
    const { data } = await workerSupabase
      .from("company_knowledge")
      .select("value")
      .eq("key", "WORKER_MEMORY")
      .single();
    return data?.value ? (typeof data.value === "string" ? JSON.parse(data.value) : data.value) : {};
  } catch (_) { return {}; }
}

async function saveWorkerMemory(updates) {
  try {
    const current = await loadWorkerMemory();
    const merged = { ...current, ...updates, last_updated: new Date().toISOString() };
    await workerSupabase.from("company_knowledge").upsert({
      key: "WORKER_MEMORY",
      value: merged,
      category: "worker",
      updated_at: new Date().toISOString(),
    });
  } catch (_) { /* non-fatal */ }
}
// -----------------------------------------------------------------------

// Import services
// Note: We need to use absolute paths or handle imports carefully in Node
// Since package.json has "type": "module", we can use imports.
import { db, realSupabase } from "../src/api/supabaseClient.js";
import { AuditorSentinelService } from "../src/services/security/AuditorSentinelService.js";
import { AgentService } from "../src/features/agents/services/AgentService.js";
// import { AgentBrain } from '../src/features/agents/services/AgentBrain.js'; // Not used directly in worker loop yet
import { agents } from "../src/features/agents/services/AgentRegistry.js";
import { clearMemory } from "../src/features/agents/services/memorySupabase.js";
import { StripeService } from "../src/services/payments/StripeService.js"; // Import StripeService
// ReceptionistAgent loaded dynamically to avoid Vite alias issues in Node.js
let ReceptionistAgent = null;
try {
  const m = await import("../src/features/agents/services/ReceptionistAgent.js");
  ReceptionistAgent = m.ReceptionistAgent;
} catch (e) {
  console.warn("⚠️ ReceptionistAgent not available (Vite alias incompatibility):", e.message);
}
import "./WorkflowTools.js"; // Register Workflow Tools (Node only)
import { MCPClientManager } from "./mcp_client.js"; // Import MCP Manager

// Config loaded
import { createClient } from "@supabase/supabase-js";

// --- ACTIVE SECURITY STATE ---
const actionHistory = new Map(); // Tracks event history per Agent Task ID
// -----------------------------

// Ensure we use the Service Role Key for the worker operations
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const workerSupabase = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : realSupabase;

if (supabaseServiceKey) {
  console.log(
    "🔐 Worker Supabase Client initialized with Service Role Key independently.",
  );
} else {
  console.warn(
    "⚠️ Service Role Key not found in env. Worker using default client (potentially limited).",
  );
}

// Parse CLI args
const args = process.argv.slice(2);
const roleArg = args.find((arg) => arg.startsWith("--role="));
let agentRole = roleArg ? roleArg.split("=")[1] : null;

const nameArg = args.find((arg) => arg.startsWith("--name="));
const workerName = nameArg
  ? nameArg.split("=")[1]
  : `Worker-${Math.floor(Math.random() * 1000)}`;

// Universal Worker Mode Flag
const isUniversal = !agentRole;
let agentConfig = null;

if (isUniversal) {
  console.log(`🤖 Starting Universal Worker: ${workerName}`);
  console.log("🌍 Mode: Universal (Will pick up tasks for ANY agent)");
} else {
  // Validate specific role if provided
  agentConfig = agents.find(
    (a) =>
      a.id === agentRole || a.role.toLowerCase() === agentRole.toLowerCase(),
  );
  if (!agentConfig) {
    console.error(`❌ Agent with role '${agentRole}' not found.`);
    console.log("Available agents:", agents.map((a) => a.id).join(", "));
    process.exit(1);
  }
  console.log(
    `🤖 Starting Dedicated Worker for: ${agentConfig.role} (${agentConfig.id})`,
  );
}

console.log(`📂 Project Root: ${PROJECT_ROOT}`);

// Initialize MCP Manager
const mcpManager = new MCPClientManager();

let agent; // Declare global agent variable

// 1. DYNAMIC TYPE: Fetch a real user ID to use as the Worker Identity
// This fixes the 409 Foreign Key error.
let WORKER_UUID = "87fbda0b-46d9-44e9-a460-395ca941fd31"; // fallback
const { data: userData } = await workerSupabase
  .from("users")
  .select("id")
  .limit(1)
  .single();
if (userData) {
  WORKER_UUID = userData.id;
  console.log(`🆔 Worker Identity: Using existing User ID: ${WORKER_UUID}`);
} else {
  console.warn("⚠️ No users found in DB. Worker might fail to write memory.");
}

if (workerRuntimeConfig?.systemPromptAddendum && agentConfig) {
  agentConfig.systemPrompt += `\n\n=== LEARNED PRINCIPLES ===\n${workerRuntimeConfig.systemPromptAddendum}`;
}

if (!isUniversal && agentConfig) {
  // Override System Prompt for Worker Mode (Dedicated)
  agentConfig.systemPrompt += `
\n\n
=== WORKER MODE ACTIVE ===
You are running as a WORKER on the target machine.
1. You ARE allowed and EXPECTED to use 'execute_command', 'write_code', 'read_file' directly.
2. Ignore any previous instructions about delegating tasks or using 'create_task'.
3. EXECUTE the task description immediately using the appropriate tool.
4. Do not ask for permission. Just do it.
`;

  // Clear memory to avoid "refusal loops" from previous runs
  console.log("🧹 Clearing Agent Memory for fresh start...");

  try {
    await clearMemory(agentConfig.id, WORKER_UUID);
  } catch (e) {
    console.warn("⚠️ Clear memory failed (non-fatal):", e.message);
  }

  // Initialize Agent Service
  agent = new AgentService(agentConfig, { userId: WORKER_UUID });
} else {
  console.log("🌍 Universal Mode: Agent initialized dynamically per task.");
}

async function executeTool(toolName, payload, context = {}) {
  console.log(`🛠️ Executing Tool: ${toolName}`, payload);
  if (!toolName) return "Error: No tool name provided.";

  const normalizeWorkspacePath = (rawPath) => {
    if (!rawPath || typeof rawPath !== "string") return null;
    if (path.isAbsolute(rawPath)) {
      if (rawPath.startsWith(PROJECT_ROOT)) return rawPath;
      return path.join(PROJECT_ROOT, rawPath.replace(/^\/+/, ""));
    }
    return path.resolve(PROJECT_ROOT, rawPath);
  };

  try {
    switch (toolName) {
      // ... (rest of switch)
      // We don't need to change the switch, just the caller.
      case "sanitize_json":
        try {
          const raw = payload.raw_data;
          let clean = raw.trim();
          const jsonMatch =
            clean.match(/```json\n([\s\S]*?)\n```/) ||
            clean.match(/```([\s\S]*?)```/);
          if (jsonMatch) clean = jsonMatch[1];
          const parsed = JSON.parse(clean);
          return JSON.stringify({ status: "success", sanitized: parsed });
        } catch (e) {
          return JSON.stringify({
            status: "error",
            message: "Sanitization Failed: " + e.message,
          });
        }
      case "execute_command":
        return new Promise((resolve) => {
          exec(
            payload.command,
            { cwd: PROJECT_ROOT },
            (error, stdout, stderr) => {
              if (error) {
                resolve(`Error: ${error.message}\nStderr: ${stderr}`);
              } else {
                resolve(stdout || stderr || "Command executed successfully.");
              }
            },
          );
        });
      case "write_file":
      case "write_code":
        const targetPath =
          payload.path ||
          payload.filename ||
          payload.filepath ||
          payload.file ||
          payload.target_file ||
          payload.title;
        if (!targetPath) {
          return "Error: path/filename is required for write_file/write_code.";
        }
        const filePath = normalizeWorkspacePath(targetPath);
        const content = payload.content || payload.code || payload.text || payload.body;
        if (typeof content !== "string") {
          return "Error: content/code must be a string for write_file/write_code.";
        }
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(filePath, content);
        return `File written to ${filePath}`;
      case "read_file":
        const rawPath =
          payload.path ||
          payload.filename ||
          payload.target_file ||
          payload.file;
        if (!rawPath) return "Error: No path provided for read_file.";
        const readPath = normalizeWorkspacePath(rawPath);
        return fs.existsSync(readPath)
          ? fs.readFileSync(readPath, "utf-8")
          : `Error: File not found at ${readPath}`;
      case "list_files":
      case "list_dir":
        return new Promise((resolve) => {
          exec(
            "ls -R " + (payload.path || ""),
            { cwd: PROJECT_ROOT },
            (error, stdout) => {
              resolve(stdout || "Directory listed.");
            },
          );
        });
      case "github_create_issue":
        const token = process.env.GITHUB_TOKEN;
        if (!token) return "Error: GITHUB_TOKEN not set";
        const repo = "rept0rix/kosmoi";
        const issueRes = await fetch(
          `https://api.github.com/repos/${repo}/issues`,
          {
            method: "POST",
            headers: {
              Authorization: `token ${token}`,
              Accept: "application/vnd.github.v3+json",
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ title: payload.title, body: payload.body }),
          },
        );
        const issueData = await issueRes.json();
        if (!issueRes.ok) return `Error: ${JSON.stringify(issueData)}`;
        return `Issue Created: ${issueData.html_url}`;

      case "github_push_file": {
        // Self-improvement: push a file to GitHub → triggers Railway redeploy
        const ghToken = process.env.GITHUB_TOKEN;
        if (!ghToken) return "Error: GITHUB_TOKEN not set in environment";
        const ghRepo = payload.repo || "rept0rix/kosmoi";
        const ghPath = payload.path;
        const ghContent = payload.content;
        const ghMessage = payload.message || `feat(worker): auto-update ${ghPath}`;
        if (!ghPath || !ghContent) return "Error: path and content are required";

        // Get current file SHA (required for update)
        const shaRes = await fetch(`https://api.github.com/repos/${ghRepo}/contents/${ghPath}`, {
          headers: { Authorization: `token ${ghToken}`, Accept: "application/vnd.github.v3+json" }
        });
        const shaData = await shaRes.json();
        const sha = shaData.sha; // undefined if file is new

        const pushRes = await fetch(`https://api.github.com/repos/${ghRepo}/contents/${ghPath}`, {
          method: "PUT",
          headers: { Authorization: `token ${ghToken}`, Accept: "application/vnd.github.v3+json", "Content-Type": "application/json" },
          body: JSON.stringify({
            message: ghMessage,
            content: Buffer.from(ghContent).toString("base64"),
            ...(sha && { sha })
          })
        });
        const pushData = await pushRes.json();
        if (!pushRes.ok) return `GitHub push error: ${JSON.stringify(pushData.message)}`;

        // Schedule a health-check task 3 min after deploy to verify worker survived
        setTimeout(async () => {
          try {
            await workerSupabase.from("agent_tasks").insert([{
              title: `[DeployCheck] Verify worker health after push: ${ghPath}`,
              description: `A file was just pushed to GitHub (${ghPath}). Railway should have redeployed. Check that:\n1. Worker heartbeat is recent (< 5 min)\n2. No new failed tasks since the deploy\n3. If worker is down, alert admin via Telegram`,
              assigned_to: "tech-lead-agent",
              priority: "high",
              status: "pending",
              created_by: "github_push_file",
            }]);
          } catch (e) { /* non-fatal */ }
        }, 3 * 60 * 1000);

        return `✅ Pushed to GitHub: ${pushData.commit?.html_url || ghPath}. Railway will redeploy automatically. Health check scheduled in 3 min.`;
      }

      case "create_task":
        const assignedTo =
          payload.assigned_to ||
          payload.assignee ||
          payload.assignedAgent ||
          "tech-lead-agent";
        const actorId = context.actorId || "worker";
        if (
          String(assignedTo).toLowerCase() === String(actorId).toLowerCase()
        ) {
          return `Error: Self-assignment blocked for '${actorId}'. Execute directly with tools instead.`;
        }
        const taskData = {
          title: payload.title,
          description: payload.description,
          assigned_to: assignedTo,
          priority: payload.priority || "medium",
          status: "pending",
          created_by: actorId,
        };
        const { data: newTask, error: taskError } = await workerSupabase
          .from("agent_tasks")
          .insert([taskData])
          .select()
          .single();

        if (taskError) throw taskError;
        return `Task Created Successfully: ${newTask.title} (ID: ${newTask.id})`;

      // --- CRM TOOLS ---
      case "create_lead":
        const newLead = await workerSupabase
          .from("crm_leads")
          .insert([payload])
          .select()
          .single();
        if (newLead.error)
          return "Error creating lead: " + newLead.error.message;
        return JSON.stringify(newLead.data);

      case "send_email":
        // PATH 1: RESEND API (Preferred - No 2FA headaches)
        const resendKey = process.env.VITE_RESEND_API_KEY;
        if (resendKey) {
          try {
            console.log("📧 Attempting to send via Resend API...");
            const resendRes = await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${resendKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                from: process.env.EMAIL_FROM || "onboarding@resend.dev",
                to: [payload.to || payload.email],
                subject: payload.subject,
                text: payload.body || payload.content || payload.text,
              }),
            });

            const resendData = await resendRes.json();

            if (!resendRes.ok) {
              const errorMsg = `Resend API Error: ${resendData.message || resendRes.statusText}`;
              fs.appendFileSync(
                "worker_debug.log",
                `${new Date().toISOString()} [RESEND] Error: ${errorMsg}\n`,
              );
              // Do NOT return here. Fall through to SMTP.
              console.warn("Resend failed, falling back to SMTP...");
            } else {
              const successMsg = `EMAIL SENT via Resend! ID: ${resendData.id}`;
              fs.appendFileSync(
                "worker_debug.log",
                `${new Date().toISOString()} [RESEND] Success: ${successMsg}\n`,
              );
              return successMsg;
            }
          } catch (e) {
            fs.appendFileSync(
              "worker_debug.log",
              `${new Date().toISOString()} [RESEND] Exception: ${e.message}\n`,
            );
            // Continue to SMTP fallback
          }
        }

        // PATH 2: SMTP (Zoho/Gmail) as Fallback
        const emailUser =
          process.env.EMAIL_USER || process.env.VITE_ADMIN_EMAIL;
        let emailPass =
          process.env.EMAIL_APP_PASSWORD || process.env.COMPANY_EMAIL_PASSWORD;
        const emailHost = process.env.SMTP_HOST || "smtppro.zoho.com";

        if (emailPass && emailPass.startsWith('"') && emailPass.endsWith('"')) {
          emailPass = emailPass.slice(1, -1);
        }

        if (!emailUser || !emailPass) {
          return "FAILED: No email credentials found (Tried Resend & SMTP). Check .env";
        }

        const transporter = nodemailer.createTransport({
          host: emailHost,
          port: 465,
          secure: true,
          auth: { user: emailUser, pass: emailPass },
        });

        try {
          const info = await transporter.sendMail({
            from: `"Kosmoi Agent" <${emailUser}>`,
            to: payload.to || payload.email,
            subject: payload.subject,
            text: payload.body || payload.content || payload.text,
          });
          const successMsg = `EMAIL SENT via SMTP! Message ID: ${info.messageId}`;
          fs.appendFileSync(
            "worker_debug.log",
            `${new Date().toISOString()} [SMTP] Success: ${successMsg}\n`,
          );
          return successMsg;
        } catch (emailErr) {
          const errorMsg = `EMAIL FAILED (SMTP): ${emailErr.message}. (Host: ${emailHost})`;
          fs.appendFileSync(
            "worker_debug.log",
            `${new Date().toISOString()} [SMTP] Error: ${errorMsg}\n`,
          );
          return errorMsg;
        }

      case "update_lead":
        const updateRes = await workerSupabase
          .from("crm_leads")
          .update(payload.updates || payload) // Support {updates: {}} or directly {}
          .eq("id", payload.id || payload.lead_id);
        if (updateRes.error)
          return "Error updating lead: " + updateRes.error.message;
        return "Lead updated successfully.";

      case "insert_interaction":
        const interactRes = await workerSupabase
          .from("crm_interactions")
          .insert([payload]);
        if (interactRes.error)
          return "Error logging interaction: " + interactRes.error.message;
        return "Interaction logged successfully.";

      case "list_leads": {
        const limit = Math.min(Number(payload.limit || payload.max || 10), 100);
        let leadsQuery = workerSupabase
          .from("crm_leads")
          .select("*")
          .order("updated_at", { ascending: false })
          .limit(limit);

        if (payload.status) {
          leadsQuery = leadsQuery.eq("status", payload.status);
        }

        if (payload.email) {
          leadsQuery = leadsQuery.ilike("email", `%${payload.email}%`);
        }

        if (payload.name) {
          const name = String(payload.name).trim();
          if (name) {
            leadsQuery = leadsQuery.or(
              `first_name.ilike.%${name}%,last_name.ilike.%${name}%`,
            );
          }
        }

        if (payload.company) {
          leadsQuery = leadsQuery.ilike("company", `%${payload.company}%`);
        }

        if (payload.q || payload.query) {
          const q = String(payload.q || payload.query).trim();
          if (q) {
            leadsQuery = leadsQuery.or(
              `first_name.ilike.%${q}%,last_name.ilike.%${q}%,company.ilike.%${q}%,email.ilike.%${q}%`,
            );
          }
        }

        if (payload.stale_days) {
          const cutoff = new Date(
            Date.now() - Number(payload.stale_days) * 24 * 60 * 60 * 1000,
          ).toISOString();
          leadsQuery = leadsQuery.lt("updated_at", cutoff);
        }

        const leadsRes = await leadsQuery;
        if (leadsRes.error) {
          return "Error listing leads: " + leadsRes.error.message;
        }
        return JSON.stringify(leadsRes.data || []);
      }

      case "get_lead":
        const leadId = payload.id || payload.lead_id;
        if (leadId) {
          const leadRes = await workerSupabase
            .from("crm_leads")
            .select("*")
            .eq("id", leadId)
            .single();
          if (leadRes.error)
            return "Error fetching lead: " + leadRes.error.message;
          return JSON.stringify(leadRes.data);
        }

        let fallbackLeadQuery = workerSupabase
          .from("crm_leads")
          .select("*")
          .order("updated_at", { ascending: false })
          .limit(1);

        if (payload.status) {
          fallbackLeadQuery = fallbackLeadQuery.eq("status", payload.status);
        }
        if (payload.email) {
          fallbackLeadQuery = fallbackLeadQuery.ilike("email", `%${payload.email}%`);
        }
        if (payload.name) {
          const name = String(payload.name).trim();
          if (name) {
            fallbackLeadQuery = fallbackLeadQuery.or(
              `first_name.ilike.%${name}%,last_name.ilike.%${name}%`,
            );
          }
        }
        if (payload.company) {
          fallbackLeadQuery = fallbackLeadQuery.ilike("company", `%${payload.company}%`);
        }
        if (payload.q || payload.query) {
          const q = String(payload.q || payload.query).trim();
          if (q) {
            fallbackLeadQuery = fallbackLeadQuery.or(
              `first_name.ilike.%${q}%,last_name.ilike.%${q}%,company.ilike.%${q}%,email.ilike.%${q}%`,
            );
          }
        }

        const fallbackLeadRes = await fallbackLeadQuery.maybeSingle();
        if (fallbackLeadRes.error) {
          return "Error fetching lead: " + fallbackLeadRes.error.message;
        }
        if (!fallbackLeadRes.data) {
          return "No matching lead found.";
        }
        return JSON.stringify(fallbackLeadRes.data);

      // --- STRIPE / SALES TOOLS ---
      case "create_payment_link":
        try {
          // Params: businessName, productName, amount, currency, planType
          const linkData = await StripeService.createPaymentLink(
            "Kosmoi Inc.",
            payload.productName || payload.name || "Service",
            payload.amount || 100,
            payload.currency || "usd",
          );
          return JSON.stringify(linkData);
        } catch (stripeErr) {
          return `Error creating payment link: ${stripeErr.message}`;
        }

      case "send_email":
        // Using StripeService.sendInvoice as a proxy for sending an email, or just a mock if needed.
        // The One Dollar Challenge asks to "Send a sales email".
        try {
          const sent = await StripeService.sendInvoice(
            payload.to || payload.email,
            payload.body || payload.content || "Link: " + payload.link,
          );
          return sent ? "Email sent successfully." : "Failed to send email.";
        } catch (emailErr) {
          return `Error sending email: ${emailErr.message}`;
        }

      case "generate_email": {
        const emailApiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
        if (!emailApiKey) return "Error: GEMINI_API_KEY not set for email generation";
        const emailPrompt = `Write a personalized outreach email for a business in Koh Samui, Thailand.
Context: ${JSON.stringify(payload)}
Requirements:
- Professional but warm tone
- Mention specific value of joining Kosmoi platform
- Clear call-to-action to claim their business profile
- Short (max 150 words)
- Subject line included
Format: Subject: [subject]\n\n[body]`;
        const emailRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${emailApiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ parts: [{ text: emailPrompt }] }] })
        });
        const emailData = await emailRes.json();
        return emailData?.candidates?.[0]?.content?.parts?.[0]?.text || "Error generating email";
      }

      // --- KNOWLEDGE BASE ---
      case "read_knowledge": {
        const requestedKeys = Array.isArray(payload.keys)
          ? payload.keys.filter(Boolean)
          : [payload.key].filter(Boolean);

        if (requestedKeys.length === 0) {
          return "Error: key or keys[] is required for read_knowledge";
        }

        if (requestedKeys.length === 1) {
          const knowledgeKey = requestedKeys[0];
          const { data: kbData, error: kbError } = await workerSupabase
            .from("company_knowledge")
            .select("key, value, updated_at")
            .eq("key", knowledgeKey)
            .single();
          if (kbError || !kbData) return `Knowledge key '${knowledgeKey}' not found.`;
          return JSON.stringify(kbData);
        }

        const { data: kbData, error: kbError } = await workerSupabase
          .from("company_knowledge")
          .select("key, value, updated_at")
          .in("key", requestedKeys);

        if (kbError) return `Error reading knowledge: ${kbError.message}`;

        const found = kbData || [];
        const foundKeys = new Set(found.map((item) => item.key));
        const missing = requestedKeys.filter((k) => !foundKeys.has(k));

        return JSON.stringify({
          found,
          missing,
        });
      }

      case "write_knowledge": {
        const { key: wKey, source, category: wCat } = payload;
        const wValue = payload.value ?? payload.content;
        if (!wKey || !wValue) return "Error: key and value are required for write_knowledge";
        // value must be valid JSON (string, number, object, or array)
        const jsonValue = typeof wValue === "string" ? wValue : JSON.stringify(wValue);
        const { error: wError } = await workerSupabase
          .from("company_knowledge")
          .upsert({
            key: wKey,
            value: jsonValue,
            category: wCat || "agent",
            updated_by: source || "agent",
            updated_at: new Date().toISOString()
          }, { onConflict: "key" });
        if (wError) return `Error writing knowledge: ${wError.message}`;
        return `Knowledge '${wKey}' saved successfully.`;
      }

      case "list_knowledge": {
        const { data: listData, error: listError } = await workerSupabase
          .from("company_knowledge")
          .select("key, updated_at, updated_by")
          .order("updated_at", { ascending: false })
          .limit(50);
        if (listError) return `Error listing knowledge: ${listError.message}`;
        return JSON.stringify(listData);
      }

      case "search_knowledge_base": {
        const query = (payload.query || payload.q || "").trim();
        if (!query) return "Error: query is required for search_knowledge_base";

        // 1) Try key-based DB search first (fast)
        const { data: keyHits, error: keyErr } = await workerSupabase
          .from("company_knowledge")
          .select("key, value, updated_at")
          .ilike("key", `%${query}%`)
          .order("updated_at", { ascending: false })
          .limit(20);

        if (keyErr) return `Error searching knowledge base: ${keyErr.message}`;
        if (keyHits && keyHits.length > 0) return JSON.stringify(keyHits);

        // 2) Fallback: fetch recent rows and filter by serialized value text
        const { data: recent, error: recentErr } = await workerSupabase
          .from("company_knowledge")
          .select("key, value, updated_at")
          .order("updated_at", { ascending: false })
          .limit(200);
        if (recentErr) return `Error searching knowledge base: ${recentErr.message}`;

        const lowered = query.toLowerCase();
        const filtered = (recent || []).filter((row) => {
          const keyText = String(row.key || "").toLowerCase();
          const valueText = JSON.stringify(row.value || "").toLowerCase();
          return keyText.includes(lowered) || valueText.includes(lowered);
        });

        return JSON.stringify(filtered.slice(0, 20));
      }

      // --- WEB SEARCH ---
      case "search_web": {
        const requestedQueries = Array.isArray(payload.queries)
          ? payload.queries.filter(Boolean)
          : [payload.query || payload.q].filter(Boolean);

        if (requestedQueries.length === 0) return "Error: query or queries[] is required for search_web";

        const stripHtml = (value = "") =>
          value
            .replace(/<[^>]*>/g, "")
            .replace(/&amp;/g, "&")
            .replace(/&quot;/g, "\"")
            .replace(/&#x27;/g, "'")
            .trim();

        const runSingleQuery = async (searchQuery) => {
          const results = [];

          // First pass: DuckDuckGo Instant Answer API
          try {
            const ddgRes = await fetch(
              `https://api.duckduckgo.com/?q=${encodeURIComponent(searchQuery)}&format=json&no_html=1&skip_disambig=1`,
            );
            const raw = await ddgRes.text();
            const ddgData = raw ? JSON.parse(raw) : {};

            if (ddgData.AbstractText) {
              results.push({
                title: ddgData.Heading || searchQuery,
                snippet: ddgData.AbstractText,
                url: ddgData.AbstractURL || "",
              });
            }

            if (Array.isArray(ddgData.RelatedTopics)) {
              for (const topic of ddgData.RelatedTopics) {
                if (results.length >= 5) break;

                if (topic?.Text) {
                  results.push({
                    title: topic.Text.slice(0, 80),
                    snippet: topic.Text,
                    url: topic.FirstURL || "",
                  });
                }

                if (Array.isArray(topic?.Topics)) {
                  for (const nested of topic.Topics) {
                    if (results.length >= 5) break;
                    if (!nested?.Text) continue;
                    results.push({
                      title: nested.Text.slice(0, 80),
                      snippet: nested.Text,
                      url: nested.FirstURL || "",
                    });
                  }
                }
              }
            }
          } catch {
            // Ignore and try HTML fallback.
          }

          // Second pass: parse DuckDuckGo HTML search page for normal web results.
          if (results.length === 0) {
            try {
              const htmlRes = await fetch(
                `https://html.duckduckgo.com/html/?q=${encodeURIComponent(searchQuery)}`,
                {
                  headers: {
                    "User-Agent": "Mozilla/5.0 (Kosmoi Worker)",
                  },
                },
              );
              const html = await htmlRes.text();
              const anchorRegex = /<a[^>]*class="result__a"[^>]*href="([^"]+)"[^>]*>(.*?)<\/a>/g;
              let match;
              while ((match = anchorRegex.exec(html)) && results.length < 5) {
                const url = stripHtml(match[1]);
                const title = stripHtml(match[2]);
                if (!url || !title) continue;
                results.push({ title, snippet: "", url });
              }
            } catch {
              // Keep empty if fallback fails.
            }
          }

          return { query: searchQuery, results };
        };

        const queryResults = [];
        for (const q of requestedQueries.slice(0, 3)) {
          queryResults.push(await runSingleQuery(q));
        }

        const anyHit = queryResults.some((entry) => entry.results.length > 0);
        if (!anyHit) {
          return `Search returned no results for queries: ${requestedQueries.slice(0, 3).join(", ")}`;
        }

        return JSON.stringify(
          requestedQueries.length === 1 ? queryResults[0] : queryResults,
        );
      }

      // --- LEAD SCORING ---
      case "score_lead": {
        // Resolve the lead by ID or email
        const scoreLookupId = payload.lead_id || payload.id;
        const scoreLookupEmail = payload.lead_email || payload.email;

        let leadRecord = null;

        if (scoreLookupId) {
          const { data: ld, error: ldErr } = await workerSupabase
            .from("crm_leads")
            .select("*")
            .eq("id", scoreLookupId)
            .single();
          if (ldErr) return `Error fetching lead: ${ldErr.message}`;
          leadRecord = ld;
        } else if (scoreLookupEmail) {
          const { data: ld, error: ldErr } = await workerSupabase
            .from("crm_leads")
            .select("*")
            .ilike("email", scoreLookupEmail.trim())
            .limit(1)
            .single();
          if (ldErr) return `Error fetching lead by email: ${ldErr.message}`;
          leadRecord = ld;
        } else {
          return "Error: score_lead requires lead_id or lead_email.";
        }

        if (!leadRecord) return "Error: Lead not found.";

        // Fetch interactions for this lead
        const { data: interactions, error: intErr } = await workerSupabase
          .from("crm_interactions")
          .select("*")
          .eq("lead_id", leadRecord.id)
          .order("created_at", { ascending: false })
          .limit(50);

        if (intErr) return `Error fetching interactions: ${intErr.message}`;

        const scoringNow = Date.now();
        const scoringReasoning = [];
        let leadScore = 0;

        // Factor 1: Recency of last contact (0-35 points)
        const lastInteractionDate = interactions && interactions.length > 0
          ? new Date(interactions[0].created_at).getTime()
          : (leadRecord.updated_at ? new Date(leadRecord.updated_at).getTime() : null);

        if (lastInteractionDate) {
          const daysSinceLast = (scoringNow - lastInteractionDate) / (1000 * 60 * 60 * 24);
          let recencyScore = 0;
          if (daysSinceLast <= 1)       recencyScore = 35;
          else if (daysSinceLast <= 3)  recencyScore = 30;
          else if (daysSinceLast <= 7)  recencyScore = 22;
          else if (daysSinceLast <= 14) recencyScore = 14;
          else if (daysSinceLast <= 30) recencyScore = 7;
          leadScore += recencyScore;
          scoringReasoning.push(`Recency: ${Math.round(daysSinceLast)}d since last contact → +${recencyScore} pts`);
        } else {
          scoringReasoning.push("Recency: No contact date → +0 pts");
        }

        // Factor 2: Number of interactions (0-35 points)
        const interactionCount = interactions ? interactions.length : 0;
        let interactionScore = 0;
        if (interactionCount >= 10)     interactionScore = 35;
        else if (interactionCount >= 7) interactionScore = 28;
        else if (interactionCount >= 4) interactionScore = 20;
        else if (interactionCount >= 2) interactionScore = 12;
        else if (interactionCount >= 1) interactionScore = 5;
        leadScore += interactionScore;
        scoringReasoning.push(`Interactions: ${interactionCount} total → +${interactionScore} pts`);

        // Factor 3: Business size indicators in notes (0-30 points)
        const notesText = [
          leadRecord.notes || "",
          leadRecord.description || "",
          leadRecord.company || "",
          ...(interactions || []).map((i) => i.notes || i.content || ""),
        ].join(" ").toLowerCase();

        const enterpriseSignals = ["enterprise", "large", "corporation", "ceo", "director", "vp ", "chief", "head of", "10,000", "50,000", "100k", "1 million", "regional", "national"];
        const midSignals = ["team", "manager", "lead ", "department", "growing", "scale", "multiple", "several", "200", "500", "1,000"];
        const smallSignals = ["startup", "small", "solo", "freelance", "one-person", "myself", "just me"];

        const enterpriseHits = enterpriseSignals.filter((s) => notesText.includes(s)).length;
        const midHits = midSignals.filter((s) => notesText.includes(s)).length;
        const smallHits = smallSignals.filter((s) => notesText.includes(s)).length;

        let sizeScore = 0;
        let sizeLabel = "unknown";
        if (enterpriseHits >= 2)      { sizeScore = 30; sizeLabel = "enterprise"; }
        else if (enterpriseHits >= 1) { sizeScore = 22; sizeLabel = "large"; }
        else if (midHits >= 2)        { sizeScore = 16; sizeLabel = "mid-size"; }
        else if (midHits >= 1)        { sizeScore = 10; sizeLabel = "growing SMB"; }
        else if (smallHits >= 1)      { sizeScore = 4;  sizeLabel = "small/solo"; }

        leadScore += sizeScore;
        scoringReasoning.push(`Business size (${sizeLabel}): enterprise=${enterpriseHits}, mid=${midHits}, small=${smallHits} → +${sizeScore} pts`);

        // Clamp to 0-100
        leadScore = Math.min(100, Math.max(0, leadScore));

        // Persist score back to lead record
        const { error: updateScoreErr } = await workerSupabase
          .from("crm_leads")
          .update({ score: leadScore, updated_at: new Date().toISOString() })
          .eq("id", leadRecord.id);

        if (updateScoreErr) {
          console.warn(`[score_lead] Failed to persist score: ${updateScoreErr.message}`);
        }

        const scoreResult = {
          lead_id: leadRecord.id,
          lead_email: leadRecord.email,
          lead_name: `${leadRecord.first_name || ""} ${leadRecord.last_name || ""}`.trim(),
          score: leadScore,
          reasoning: scoringReasoning,
          interactions_analyzed: interactionCount,
        };

        console.log(`[score_lead] Lead ${leadRecord.id} scored: ${leadScore}/100`);
        return JSON.stringify(scoreResult);
      }

      // --- TELEGRAM NOTIFICATIONS ---
      case "notify_admin":
      case "send_telegram": {
        const tgToken = process.env.TELEGRAM_BOT_TOKEN;
        const tgChat = process.env.TELEGRAM_CHAT_ID;
        if (!tgToken || !tgChat) return "Error: TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not set";
        const message = payload.message || payload.text || JSON.stringify(payload);
        const tgRes = await fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: tgChat, text: `🤖 ${message}`, parse_mode: "Markdown" })
        });
        const tgData = await tgRes.json();
        return tgData.ok ? "Telegram notification sent." : `Telegram error: ${JSON.stringify(tgData)}`;
      }

      // --- N8N OUTREACH (Email + WhatsApp) ---
      case "send_n8n_email": {
        const n8nEmailUrl = process.env.VITE_N8N_EMAIL_WEBHOOK || process.env.N8N_EMAIL_WEBHOOK;
        if (!n8nEmailUrl || n8nEmailUrl.includes("YOUR_")) return "Error: N8N_EMAIL_WEBHOOK not configured";
        const n8nRes = await fetch(n8nEmailUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        return n8nRes.ok ? `Email sent via n8n to ${payload.to || payload.email}` : `n8n email error: ${n8nRes.status}`;
      }

      case "send_n8n_whatsapp": {
        const n8nWaUrl = process.env.VITE_N8N_WHATSAPP_WEBHOOK || process.env.N8N_WHATSAPP_WEBHOOK;
        if (!n8nWaUrl || n8nWaUrl.includes("YOUR_")) return "Error: N8N_WHATSAPP_WEBHOOK not configured";
        const n8nWaRes = await fetch(n8nWaUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        return n8nWaRes.ok ? `WhatsApp sent via n8n to ${payload.phone || payload.to}` : `n8n WhatsApp error: ${n8nWaRes.status}`;
      }

      // --- BUSINESS METRICS ANALYSIS ---
      case "analyze_business_metrics": {
        const { data: providers } = await workerSupabase
          .from("service_providers").select("id, name, category, verified, created_at").limit(100);
        const { data: leads } = await workerSupabase
          .from("crm_leads").select("id, status, created_at").limit(200);
        const { data: txns } = await workerSupabase
          .from("transactions").select("amount, status, created_at").limit(200);

        const totalRevenue = (txns || []).filter(t => t.status === "succeeded" || t.status === "completed")
          .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
        const verifiedProviders = (providers || []).filter(p => p.verified).length;
        const conversionRate = leads?.length ? ((leads.filter(l => l.status === "converted").length / leads.length) * 100).toFixed(1) : 0;

        const metrics = {
          total_providers: providers?.length || 0,
          verified_providers: verifiedProviders,
          total_leads: leads?.length || 0,
          lead_conversion_rate: `${conversionRate}%`,
          total_revenue_thb: totalRevenue,
          total_transactions: txns?.length || 0,
          generated_at: new Date().toISOString()
        };
        await workerSupabase.from("company_knowledge").upsert({ key: "BUSINESS_METRICS", value: metrics, category: "analytics", updated_at: new Date().toISOString() });
        return JSON.stringify(metrics);
      }

      // --- AGENT META-TOOLS ---
      case "update_agent_prompt": {
        const { agent_id, new_prompt, reason } = payload;
        if (!agent_id || !new_prompt) return "Error: agent_id and new_prompt required";
        await workerSupabase.from("company_knowledge").upsert({
          key: `AGENT_PROMPT_OVERRIDE_${agent_id.toUpperCase()}`,
          value: { prompt: new_prompt, reason, updated_at: new Date().toISOString() },
          category: "agent_config",
          updated_at: new Date().toISOString()
        });
        return `Agent prompt for ${agent_id} updated and stored.`;
      }

      case "delegate_task":
      case "summon_agent": {
        const { agent_id, task_title, task_description, priority } = payload;
        if (!agent_id || !task_title) return "Error: agent_id and task_title required";
        const { error: delegateErr } = await workerSupabase.from("agent_tasks").insert([{
          title: task_title,
          description: task_description || task_title,
          assigned_to: agent_id,
          priority: priority || "medium",
          status: "pending",
          created_by: context.agentId || "system",
        }]);
        return delegateErr ? `Delegation error: ${delegateErr.message}` : `Task delegated to ${agent_id}: "${task_title}"`;
      }

      case "market_scanner":
      case "get_trends": {
        const query = payload.query || payload.topic || "Koh Samui tourism business trends 2025";
        const searchRes = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`);
        const searchData = await searchRes.json();
        const results = (searchData.RelatedTopics || []).slice(0, 5).map(t => t.Text).filter(Boolean);
        return results.length ? results.join("\n\n") : `No trends found for: ${query}`;
      }

      case "read_table": {
        const table = payload.table || "providers";
        const limit = payload.limit || 20;
        // columns can be array or string
        const cols = Array.isArray(payload.columns) ? payload.columns.join(", ") : (payload.columns || "*");
        let q = workerSupabase.from(table).select(cols).limit(limit);
        // support both 'filters' and 'where' keys
        const filterObj = payload.filters || payload.where || {};
        for (const [key, val] of Object.entries(filterObj)) {
          // normalize common aliases (verified → is_verified)
          const col = key === "verified" ? "is_verified" : key;
          q = q.eq(col, val);
        }
        if (payload.order_by) q = q.order(payload.order_by, { ascending: payload.ascending ?? false });
        const { data: tableData, error: tableErr } = await q;
        if (tableErr) return `Error reading ${table}: ${tableErr.message}`;
        return JSON.stringify(tableData, null, 2);
      }

      case "search_providers": {
        const search = payload.query || payload.search || "";
        const verified = payload.verified !== undefined ? payload.verified : null;
        let q = workerSupabase.from("service_providers")
          .select("id, business_name, category, phone, email, whatsapp, verified, claimed, status, created_at")
          .limit(payload.limit || 20);
        if (search) q = q.ilike("business_name", `%${search}%`);
        if (verified !== null) q = q.eq("verified", verified);
        const { data: provData, error: provErr } = await q;
        if (provErr) return `Error searching providers: ${provErr.message}`;
        return JSON.stringify(provData, null, 2);
      }

      case "score_lead": {
        const { providerId, businessName } = payload;
        let provider = null;
        if (providerId) {
          const { data } = await workerSupabase.from("service_providers").select("*").eq("id", providerId).single();
          provider = data;
        } else if (businessName) {
          const { data } = await workerSupabase.from("service_providers").select("*").ilike("business_name", `%${businessName}%`).limit(1).maybeSingle();
          provider = data;
        }
        if (!provider) return `Provider not found for scoring.`;
        let score = 0;
        if (provider.business_name) score += 20;
        if (provider.phone || provider.whatsapp) score += 20;
        if (provider.email) score += 20;
        if (provider.verified) score += 25;
        if (provider.category) score += 15;
        const grade = score >= 80 ? "A" : score >= 60 ? "B" : score >= 40 ? "C" : "D";
        return JSON.stringify({ id: provider.id, name: provider.business_name, score, grade, breakdown: { has_name: !!provider.business_name, has_phone: !!(provider.phone||provider.whatsapp), has_email: !!provider.email, is_verified: !!provider.verified, has_category: !!provider.category } });
      }

      default:
        // Check if it's an MCP Tool
        const mcpTools = mcpManager.getTools();
        const mcpTool = mcpTools.find((t) => t.name === toolName);

        if (mcpTool) {
          // Auto-inject projectRoot if expected by tool but missing
          if (!payload.projectRoot) {
            payload.projectRoot = PROJECT_ROOT;
          }
          return await mcpManager.callTool(toolName, payload);
        }

        return `Tool ${toolName} not supported in Worker Mode.`;
    }
  } catch (e) {
    return `Tool Execution Failed: ${e.message}`;
  }
}

// ── Company Context Injection ────────────────────────────────────────────────
// Reads COMPANY_OVERVIEW, MARKETING_PLAYBOOK, and WORKER_STATUS from
// company_knowledge and returns a formatted context string for agent prompts.
async function getCompanyContext() {
  const CONTEXT_KEYS = ["COMPANY_OVERVIEW", "MARKETING_PLAYBOOK", "WORKER_STATUS"];
  try {
    const { data, error } = await workerSupabase
      .from("company_knowledge")
      .select("key, value")
      .in("key", CONTEXT_KEYS);

    if (error || !data || data.length === 0) {
      return ""; // Gracefully degrade — no context available yet
    }

    const sections = data.map(({ key, value }) => {
      const summary = typeof value === "object" ? JSON.stringify(value, null, 2) : String(value);
      return `### ${key}\n${summary}`;
    });

    return `
=== COMPANY CONTEXT (injected by worker) ===
${sections.join("\n\n")}
=== END COMPANY CONTEXT ===

`;
  } catch (err) {
    console.warn("⚠️ getCompanyContext failed (non-fatal):", err.message);
    return "";
  }
}
// ─────────────────────────────────────────────────────────────────────────────

async function processTask(task, agentService, agentConfigOverride) {
  console.log(`\n📋 Processing Task: ${task.title}`);
  console.log(`[${workerName}] Claiming task...`);

  // Log task start to admin feed + Telegram
  await logToAdmin(task.assigned_to, `🚀 Started: ${task.title}`, "info", { task_id: task.id, priority: task.priority });
  await notifyTelegram(`🤖 *${task.assigned_to || "Worker"}* started:\n*${task.title}*`);

  const { error: updateError } = await workerSupabase
    .from("agent_tasks")
    .update({ status: "in_progress" })
    .eq("id", task.id);

  if (updateError) {
    console.error("❌ Failed to claim task:", updateError.message);
    return;
  }

  // Use the override config if provided (Universal Mode), otherwise fallback to global (Dedicated Mode)
  // Actually, in Universal Mode step we pass both. In dedicated mode (old code) we rely on global.
  // Let's assume we always pass agentService now.
  const activeAgent = agentService || agent;

  // Inject company context unless already present in input_context
  const inputContext = task.input_context || "";
  const companyContext =
    inputContext.includes("=== COMPANY CONTEXT") ? "" : await getCompanyContext();

  const prompt = `
${companyContext}You have been assigned a task:
TITLE: ${task.title}
DESCRIPTION: ${task.description}

Please execute this task using your available tools.

AVAILABLE TOOLS (call by setting "action": {"name": "tool_name", "payload": {...}} in your JSON):
- analyze_business_metrics: Get platform stats (providers, users, revenue). Payload: {}
- write_knowledge: Save to knowledge base. Payload: { "key": "...", "value": "...", "category": "analytics" }
- read_knowledge: Read from knowledge base. Payload: { "key": "..." }
- delegate_task: Assign work to another agent. Payload: { "toAgent": "sales|marketing|tech", "title": "...", "description": "..." }
- market_scanner: Read competitor/market data. Payload: { "topic": "samui_market" }
- score_lead: Score a provider as a lead. Payload: { "providerId": "uuid" }
- create_task: Create agent task. Payload: { "title": "...", "description": "...", "assignee": "agent_role" }
- github_push_file: Push code/file to GitHub → triggers Railway auto-redeploy. Payload: { "path": "scripts/agent_worker.js", "content": "...", "message": "feat: improve X" }
- update_agent_prompt: Improve agent system prompt stored in DB. Payload: { "agent_id": "tech-lead-agent", "new_prompt": "...", "reason": "..." }
- send_telegram: Alert admin. Payload: { "message": "..." }
- execute_command: Run shell command. Payload: { "command": "..." }
- write_code: Write file. Payload: { "path": "...", "content": "..." }
- send_email: Send email. Payload: { "to": "...", "subject": "...", "body": "..." }
- read_table: Query DB. Payload: { "table": "...", "limit": 10 }
- search_providers: Search providers. Payload: { "query": "...", "category": "..." }

${mcpManager.formatToolsSystemPrompt()}

OUTPUT FORMAT (you MUST return valid JSON):
{
  "thought_process": "your reasoning",
  "message": "brief status",
  "action": { "name": "tool_name", "payload": {} }
}

When done, set "message" to contain "TASK_COMPLETED" and do NOT set "action".
`;

  let currentMessage = prompt;
  let turnCount = 0;
  let consecutiveNoToolTurns = 0;
  const MAX_TURNS = 30;
  const MAX_NO_TOOL_TURNS = 3; // Fail fast if Gemini keeps returning text-only

  while (turnCount < MAX_TURNS) {
    turnCount++;
    console.log(`\n🔄 Turn ${turnCount}...`);

    let response;
    try {
      response = await activeAgent.sendMessage(currentMessage, {
        simulateTools: false,
      });
    } catch (err) {
      // API-level error (expired key, quota, network) — fail immediately
      console.error(`❌ Gemini API error on turn ${turnCount}:`, err.message || err);
      await workerSupabase.from("agent_tasks").update({
        status: "failed",
        result: `FAILED: Gemini API error — ${err.message || String(err)}`,
      }).eq("id", task.id);
      return;
    }
    // console.log(`🗣️ Agent Raw Output:`, response); // Debug if needed

    // 2. ROBUST ACTION PARSING
    let action = response.toolRequest;

    // Ensure we map 'type' to 'name' if name is missing (handling AgentBrain JSON output)
    if (action && !action.name && action.type) {
      // Map JSON actions to Tool Names
      if (action.type === "tool_call") {
        action.name = action.name; // should work if structure is right
        action.payload = action.payload;
      } else if (action.type === "write_code") {
        action.name = "write_code";
        action.payload = { path: action.title, content: action.code };
      } else if (action.type === "create_task") {
        action.name = "create_task";
        action.payload = {
          title: action.title,
          description: action.description,
          assignee: action.assignee,
          priority: action.priority,
        };
      } else if (action.type === "execute_command") {
        // In case it uses type instead of tool_call
        action.name = "execute_command";
        // payload usually OK
      }
    }

    // Fallback: Check manual JSON in text if parsing failed earlier
    if (!action && response.text) {
      try {
        const jsonMatch = response.text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const data = JSON.parse(jsonMatch[0]);
          if (data.action) {
            action = data.action;
            // Map again
            if (action.type === "write_code") {
              action = {
                name: "write_code",
                payload: { path: action.title, content: action.code },
              };
            } else if (action.type === "tool_call") {
              action = { name: action.name, payload: action.payload };
            }
          }
        }
      } catch (e) {
        /* ignore */
      }
    }

    if (action && action.name) {
      // --- SECURITY AUDIT (SENTINEL) ---
      if (!actionHistory.has(task.id)) {
        actionHistory.set(task.id, []);
      }
      const history = actionHistory.get(task.id);

      // Audit Tool Usage
      const event = {
        agentId: task.assigned_to,
        type: "ACTION",
        timestamp: new Date().toISOString(),
        details: action,
      };
      history.push(event);

      const alerts = AuditorSentinelService.audit(history);
      const criticalAlert = alerts.find(
        (a) => a.level === "CRITICAL" || a.level === "ERROR",
      );

      if (criticalAlert) {
        console.error(`🚨 SECURITY BLOCK: ${criticalAlert.issue}`);

        // Log Block Event
        history.push({
          agentId: task.assigned_to,
          type: "GUARDRAIL_BLOCK",
          timestamp: new Date().toISOString(),
          details: criticalAlert,
        });

        // KILL SWITCH: Terminate Task
        await workerSupabase
          .from("agent_tasks")
          .update({
            status: "failed",
            result: `SECURITY TERMINATION: ${criticalAlert.issue} - ${criticalAlert.details}`,
          })
          .eq("id", task.id);
        return; // Stop processing loop
      }
      // ---------------------------------

      console.log(`✅ Detected Tool Action: ${action.name}`);
      let result;
      try {
        result = await executeTool(action.name, action.payload, {
          actorId: task.assigned_to,
          taskId: task.id,
        });
      } catch (e) {
        // Log Error for Loop Detection
        if (history) {
          history.push({
            agentId: task.assigned_to,
            type: "ERROR",
            timestamp: new Date().toISOString(),
            details: e.message,
          });
        }
        result = `Error: ${e.message}`;
      }

      console.log(`✅ Tool Result:`, result.substring(0, 100) + "...");
      consecutiveNoToolTurns = 0; // Reset on successful tool call
      currentMessage = `Tool '${action.name}' output:\n${result}\n\nWhat is the next step?`;
    } else if (action && !action.name) {
      console.warn("⚠️ Detected action but NAME is undefined:", action);
      currentMessage =
        "Error: Tool action detected but tool name is missing. Please check your JSON structure.";
    } else {
      // No tool call. Check if done.
      // Check both response.text and response.raw.message (JSON output from Gemini)
      const rawMessage = response.raw?.message || "";
      const completionText = (response.text + " " + rawMessage).toUpperCase();
      if (
        completionText.includes("TASK_COMPLETED") ||
        completionText.includes("TERMINATE")
      ) {
        console.log("✅ Task Completed by Agent.");
        const { error: completeError } = await workerSupabase
          .from("agent_tasks")
          .update({
            status: "done",
            result: response.text,
          })
          .eq("id", task.id);

        if (completeError)
          console.warn("⚠️ Failed to update result:", completeError.message);

        // Log success to admin feed + Telegram + memory
        const snippet = response.text?.slice(0, 200) || "";
        await logToAdmin(task.assigned_to, `✅ Done: ${task.title}\n${snippet}`, "info", { task_id: task.id, status: "done" });
        await notifyTelegram(`✅ *${task.assigned_to || "Worker"}* completed:\n*${task.title}*\n\n${snippet}`);
        await saveWorkerMemory({ [`last_done_${task.assigned_to}`]: { title: task.title, result: snippet, at: new Date().toISOString() } });

        return;
      }

      // If no tool and no completion, just continue conversation or stop?
      consecutiveNoToolTurns++;
      console.log(
        `⚠️ No tool called (${consecutiveNoToolTurns}/${MAX_NO_TOOL_TURNS}). Agent might be confused.`,
      );

      // Fail fast after N consecutive no-tool turns
      if (consecutiveNoToolTurns >= MAX_NO_TOOL_TURNS) {
        console.error("❌ Task Failed: Agent is not calling tools.");
        await workerSupabase
          .from("agent_tasks")
          .update({
            status: "failed",
            result: "FAILED: Agent returned text without calling any tool 3 times in a row.",
          })
          .eq("id", task.id);
        await logToAdmin(task.assigned_to, `❌ Failed: ${task.title} (no tool calls)`, "error", { task_id: task.id });
        await notifyTelegram(`❌ *${task.assigned_to || "Worker"}* failed:\n*${task.title}*\nAgent stopped calling tools.`);
        return;
      }

      // Strong nudge
      if (
        response.text.toLowerCase().includes("complete") ||
        response.text.toLowerCase().includes("finished") ||
        response.text.toLowerCase().includes("done")
      ) {
        currentMessage =
          'SYSTEM: Task not yet marked complete. You MUST call a tool OR reply with the exact text "TASK_COMPLETED" (nothing else).';
      } else {
        currentMessage =
          'SYSTEM: You must use a tool to proceed. Do NOT write explanations — call one of your available tools now. If the task is truly done, reply only with "TASK_COMPLETED".';
      }
    }
  }

  if (turnCount >= MAX_TURNS) {
    console.error("❌ Task Timeout: Max turns reached.");
    await workerSupabase
      .from("agent_tasks")
      .update({ status: "done", result: "FAILED: Timeout: Max turns reached." })
      .eq("id", task.id);
  }
}

// --- CHAT CONSOLE FEATURE ---
function setupChatConsole() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: "", // No prompt to avoid cluttering logs
  });

  rl.on("line", async (line) => {
    const text = line.trim();
    if (!text) return;

    console.log(`\n📨 Sending message to Board Room: "${text}"`);

    try {
      // Insert as a message from the "User (Remote)"
      await workerSupabase.from("messages").insert([
        {
          content: `[Remote Worker] ${text}`,
          role: "user", // Treat as user input so Orchestrator responds!
          user_id: WORKER_UUID, // Use the worker's ID or the user's ID if available
          created_at: new Date().toISOString(),
        },
      ]);
      console.log("✅ Message sent!");
    } catch (e) {
      console.error("❌ Failed to send message:", e.message);
    }
  });
}
// ----------------------------

async function checkDbSchema() {
  try {
    // Attempt to add 'result' column if it doesn't exist
    const { error } = await workerSupabase.rpc("exec_sql", {
      sql: "ALTER TABLE agent_tasks ADD COLUMN IF NOT EXISTS result TEXT; ALTER TABLE agent_tasks ADD COLUMN IF NOT EXISTS input_context JSONB;",
    });

    if (error && !error.message.includes("already exists")) {
      console.warn(
        "⚠️ Failed to patch DB schema via RPC (ignoring):",
        error.message,
      );
    } else {
      console.log("✅ verified 'agent_tasks' schema columns.");
    }
  } catch (e) {
    console.warn("⚠️ DB Schema check skipped:", e.message);
  }
}

async function main() {
  setupChatConsole(); // <--- Enable Chat
  await checkDbSchema(); // <--- Verify DB
  await mcpManager.init(); // <--- Init MCP (Connects to Chrome, etc.)
  await checkForUpdates();

  // AUTO-UPDATE: Start with a fresh codebase
  console.log("🔄 Startup: Ensuring code is up to date...");
  try {
    await new Promise((r) => exec("git pull", { cwd: PROJECT_ROOT }, r));
    console.log("✅ Code pulled.");
  } catch (e) {
    console.warn("⚠️ Startup update failed:", e.message);
  }

  console.log("🚀 Worker Loop Started. Polling for tasks...");
  console.log("💡 TIP: You can type here to send commands to the Board Room!");

  // --- RECEPTIONIST LOOP ---
  async function runReceptionistCycle() {
    // Poll for active provider chats with unread messages
    try {
      // 1. Get active meetings linked to providers
      const { data: meetings, error: meetingError } = await workerSupabase
        .from("board_meetings")
        .select("id, provider_id")
        .eq("status", "active")
        .not("provider_id", "is", null);

      if (meetingError) throw meetingError;
      if (!meetings || meetings.length === 0) return;

      for (const meeting of meetings) {
        // 2. Get last message
        const { data: lastMsg, error: msgError } = await workerSupabase
          .from("board_messages")
          .select("*")
          .eq("meeting_id", meeting.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (msgError && msgError.code !== "PGRST116") {
          console.warn(
            `[Receptionist] Error fetching msg for meeting ${meeting.id}:`,
            msgError.message,
          );
          continue;
        }

        // 3. If last message is from USER (or null/unknown), trigger receptionist
        if (
          lastMsg &&
          (lastMsg.agent_id === "HUMAN_USER" || !lastMsg.agent_id)
        ) {
          // Check if we already replied (simple check: verify no recent reply from receptionist...
          // actually if lastMsg is USER, then we haven't replied yet, as reply would be top of stack)

          if (!ReceptionistAgent) continue;

          // --- MEMORY ENHANCEMENT: Enrich message with provider context ---
          let enrichedMessage = { ...lastMsg };
          try {
            // Load provider profile
            const { data: providerProfile } = await workerSupabase
              .from("service_providers")
              .select("id, business_name, category, description, opening_hours, phone, email, verified, metadata")
              .eq("id", meeting.provider_id)
              .single();

            // Load last 5 interactions with this provider
            const { data: recentInteractions } = await workerSupabase
              .from("crm_interactions")
              .select("id, type, notes, content, created_at, direction")
              .eq("provider_id", meeting.provider_id)
              .order("created_at", { ascending: false })
              .limit(5);

            // Attach enriched context to the message object so ReceptionistAgent can use it
            enrichedMessage._context = {
              providerProfile: providerProfile || null,
              recentInteractions: recentInteractions || [],
              interactionSummary: recentInteractions && recentInteractions.length > 0
                ? `${recentInteractions.length} recent interaction(s). Last: "${(recentInteractions[0].notes || recentInteractions[0].content || "").slice(0, 120)}"`
                : "No prior interactions found.",
            };

            console.log(
              `[Receptionist] Enriched context for provider ${meeting.provider_id}: ` +
              `profile=${!!providerProfile}, interactions=${recentInteractions?.length || 0}`
            );
          } catch (enrichErr) {
            console.warn(`[Receptionist] Context enrichment failed (non-fatal): ${enrichErr.message}`);
            // Fall back to original message without enrichment
          }

          // Trigger Agent with enriched message and workerSupabase (Service Role)
          const responseText = await ReceptionistAgent.handleIncomingMessage(
            enrichedMessage,
            meeting.provider_id,
            workerSupabase,
          );

          if (responseText) {
            console.log(`[Receptionist] Auto-Replying to ${meeting.id}`);
            await workerSupabase.from("board_messages").insert([
              {
                meeting_id: meeting.id,
                agent_id: `receptionist-${meeting.provider_id}`,
                content: responseText,
                type: "text",
              },
            ]);
          }
        }
      }
    } catch (e) {
      console.warn("[ReceptionistCycle] Error:", e.message);
    }
  }

  function isHumanRoutedTask(task) {
    const assigned = String(task?.assigned_to || "")
      .trim()
      .toLowerCase();

    if (!assigned) return true;
    if (assigned.includes("human")) return true;
    if (assigned === "user") return true;
    if (assigned === "manual") return true;
    return false;
  }

  function isSelfDelegatedTask(task) {
    const assigned = String(task?.assigned_to || "")
      .trim()
      .toLowerCase();
    const createdBy = String(task?.created_by || "")
      .trim()
      .toLowerCase();

    if (!assigned || !createdBy) return false;
    if (assigned !== createdBy) return false;
    return assigned.endsWith("-agent");
  }

  // --- WORKER LOOP ---
  while (true) {
    try {
      // 0. Report Heartbeat
      try {
        await workerSupabase.from("company_knowledge").upsert({
          key: "WORKER_STATUS",
          value: {
            status: "RUNNING",
            last_seen: new Date().toISOString(),
            worker: workerName,
          },
          category: "system",
          updated_at: new Date().toISOString(),
        });
      } catch (err) {
        console.warn("⚠️ Heartbeat failed (non-fatal):", err.message);
      }

      // 1. Auto-recover any tasks stuck in-progress
      await autoRecoverStuckTasks();

      // 2. Run Receptionist Cycle (Priority)
      await runReceptionistCycle();

      // 2. Poll for Tasks
      // console.log(`[DEBUG] Polling...`);

      // Build Query
      let query = workerSupabase
        .from("agent_tasks")
        .select("*")
        .in("status", ["pending", "in_progress", "review"])
        .order("created_at", { ascending: true })
        .limit(25);

      if (!isUniversal) {
        query = query.eq("assigned_to", agentRole).limit(1);
      } else {
        // Universal worker should not consume tasks explicitly routed to humans.
        query = query
          .not("assigned_to", "is", null)
          .not("assigned_to", "ilike", "%human%");
      }

      const { data: tasks, error } = await query;

      if (tasks && tasks.length > 0) {
        if (isUniversal) {
          const selfDelegatedIds = tasks
            .filter((candidate) => isSelfDelegatedTask(candidate))
            .map((candidate) => candidate.id);

          if (selfDelegatedIds.length > 0) {
            const { error: skipErr } = await workerSupabase
              .from("agent_tasks")
              .update({
                status: "done",
                result: "SKIPPED: self-delegated loop guard",
              })
              .in("id", selfDelegatedIds);

            if (skipErr) {
              console.warn("⚠️ Failed to skip self-delegated tasks:", skipErr.message);
            } else {
              console.log(
                `🧹 Skipped ${selfDelegatedIds.length} self-delegated task(s) to prevent loops.`,
              );
            }
          }
        }

        const task = isUniversal
          ? tasks.find(
              (candidate) =>
                !isHumanRoutedTask(candidate) &&
                !isSelfDelegatedTask(candidate),
            )
          : tasks[0];

        if (!task) {
          await new Promise((resolve) => setTimeout(resolve, 5000));
          continue;
        }
        console.log(`\n👀 Found Task: "${task.title}" (ID: ${task.id})`);

        // 3. Git Pull (Just-in-Time Update)
        // Before starting, ensure we have the latest code (e.g. new tools/scripts)
        console.log("🔄 Task Found! Syncing code before execution...");
        try {
          await new Promise((r) => exec("git pull", { cwd: PROJECT_ROOT }, r));
          console.log("✅ Code Synced.");
        } catch (e) {
          console.warn("⚠️ Pre-task sync failed:", e.message);
        }

        // 4. Determine Agent Logic (Universal Mode Adaptation)
        let currentAgentConfig;
        if (!isUniversal) {
          currentAgentConfig = agents.find(
            (a) =>
              a.id === agentRole ||
              a.role.toLowerCase() === agentRole.toLowerCase(),
          );
        } else {
          // Dynamic Load - Robust Matching Strategy
          currentAgentConfig =
            agents.find((a) => a.id === task.assigned_to) ||
            agents.find((a) => a.role === task.assigned_to) ||
            agents.find((a) =>
              a.role.toLowerCase().includes(task.assigned_to.toLowerCase()),
            );

          if (!currentAgentConfig) {
            console.warn(
              `⚠️ Unknown agent type '${task.assigned_to}'. Using default Tech Lead.`,
            );
            currentAgentConfig = agents.find((a) => a.id === "tech-lead-agent");
          }
        }
        console.log(
          `🎭 Universal Worker adapting persona: ${currentAgentConfig.role}`,
        );

        // Inject Worker Mode Prompt Dynamically
        if (!currentAgentConfig.systemPrompt.includes("WORKER MODE ACTIVE")) {
          currentAgentConfig.systemPrompt += `
\n\n
=== WORKER MODE ACTIVE ===
You are running as a WORKER on the target machine.
1. You ARE allowed and EXPECTED to use 'execute_command', 'write_code', 'read_file' directly.
2. Ignore any previous instructions about delegating tasks or using 'create_task'.
3. EXECUTE the task description immediately using the appropriate tool.
4. Do not ask for permission. Just do it.
`;
        }

        // Initialize Service with this config
        const dynamicAgent = new AgentService(currentAgentConfig, {
          userId: WORKER_UUID,
        });

        // 5. Process Task
        await processTask(task, dynamicAgent, currentAgentConfig);

        // 6. Auto-Commit Work (Save)
        if (task.status !== "failed") {
          await gitSync(task.title);
        }
      } else {
        if (error) console.error("Polling Error:", error);
        // Idle Wait
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    } catch (e) {
      console.error("\n❌ Error in Worker Loop:", e.message);
      // Wait a bit before retrying to prevent rapid error loops
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
}

// ============================================================
// CRON SCHEDULER — Triggers time-based agents automatically
// ============================================================
const scheduledAgents = [
  { agentId: "planner-agent",    cron: { hour: 8,  minute: 0,  days: [0,1,2,3,4,5,6] }, title: "Daily Planning Session" },
  { agentId: "tech-scout-agent", cron: { hour: 9,  minute: 0,  days: [1] },              title: "Weekly Tech Landscape Scan" },
  { agentId: "optimizer-agent",  cron: { hour: 10, minute: 0,  days: [1,4] },            title: "Bi-Weekly Business Health Check" },
  { agentId: "crm-sales-agent",  cron: { hour: 9,  minute: 30, days: [1,2,3,4,5] },      title: "Morning Lead Follow-Up" },
  // ── Marketing Automation ─────────────────────────────────────────────────
  { agentId: "crm-sales-agent",  cron: { hour: 10, minute: 0,  days: [0,1,2,3,4,5,6] }, title: "Daily Lead Outreach: Find 3 uncontacted businesses and send personalized emails" },
  { agentId: "optimizer-agent",  cron: { hour: 7,  minute: 0,  days: [1] },              title: "Weekly Business Health Report: Analyze metrics and write summary to company_knowledge" },
  { agentId: "crm-sales-agent",  cron: { hour: 18, minute: 0,  days: [0,1,2,3,4,5,6] }, title: "Evening Follow-up: Check leads contacted today, send follow-up to non-responders" },
];

const firedToday = new Set(); // key: "agentId-YYYY-MM-DD-HH" to prevent double-fire

function startCronScheduler() {
  console.log("⏰ Cron Scheduler started");
  setInterval(async () => {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon... 6=Sat
    const hour = now.getHours();
    const minute = now.getMinutes();

    for (const sched of scheduledAgents) {
      if (!sched.cron.days.includes(dayOfWeek)) continue;
      if (sched.cron.hour !== hour) continue;
      if (Math.abs(sched.cron.minute - minute) > 1) continue; // within 1 min window

      const fireKey = `${sched.agentId}-${now.toISOString().slice(0, 13)}`;
      if (firedToday.has(fireKey)) continue;
      firedToday.add(fireKey);

      console.log(`⏰ Cron firing: ${sched.agentId} → "${sched.title}"`);
      const { error } = await workerSupabase.from("agent_tasks").insert([{
        title: sched.title,
        description: `Scheduled task triggered automatically at ${now.toISOString()}`,
        assigned_to: sched.agentId,
        priority: "high",
        status: "pending",
        created_by: "cron-scheduler",
      }]);
      if (error) {
        console.error(`Cron insert error for ${sched.agentId}:`, error.message);
      } else {
        await logToAdmin("cron-scheduler", `⏰ Scheduled: ${sched.title}`, "info", { agent: sched.agentId });
      }
    }

    // Clean old fire keys every hour
    if (minute === 0) {
      const cutoff = new Date(now - 25 * 60 * 60 * 1000).toISOString().slice(0, 13);
      for (const key of firedToday) {
        if (key.slice(-13) < cutoff) firedToday.delete(key);
      }
    }
  }, 60_000); // check every minute
}

// ============================================================
// REALTIME LISTENERS — Instant event-driven triggers
// ============================================================
function startRealtimeListeners() {
  console.log("⚡ Realtime listeners started");

  // Trigger 1: New message → Receptionist responds immediately
  workerSupabase
    .channel("realtime:board_messages")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "board_messages" },
      async (payload) => {
        const msg = payload.new;
        if (!msg.agent_id || msg.agent_id === "HUMAN_USER") {
          console.log(`⚡ [Realtime] New message → running receptionist immediately`);
          await runReceptionistCycle().catch((e) =>
            console.warn("[Realtime] Receptionist error:", e.message)
          );
        }
      }
    )
    .subscribe();

  // Trigger 2: New business registered → CRM agent follows up
  workerSupabase
    .channel("realtime:service_providers")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "service_providers" },
      async (payload) => {
        const business = payload.new;
        console.log(`⚡ [Realtime] New business: ${business.name} → triggering CRM follow-up`);
        await workerSupabase.from("agent_tasks").insert([{
          title: `Welcome new business: ${business.name}`,
          description: `A new business just registered. Send a welcome message and offer onboarding help. Business ID: ${business.id}`,
          assigned_to: "crm-sales-agent",
          priority: "high",
          status: "pending",
          created_by: "realtime-trigger",
          input_context: JSON.stringify({ business_id: business.id, business_name: business.name }),
        }]).then(({ error }) => {
          if (error) console.warn("[Realtime] CRM task insert error:", error.message);
        });
      }
    )
    .subscribe();

  // Trigger 3: Transaction/payment succeeded → activate provider
  // NOTE: The actual table name in this project is "transactions", not "payments"
  workerSupabase
    .channel("realtime:transactions")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "transactions" },
      async (payload) => {
        const payment = payload.new;
        if (payment.status === "succeeded" || payment.status === "completed") {
          console.log(`⚡ [Realtime] Transaction succeeded → activating provider ${payment.provider_id}`);
          await workerSupabase.from("agent_tasks").insert([{
            title: `Activate provider after payment`,
            description: `Payment confirmed. Update provider status to verified and send confirmation. Provider ID: ${payment.provider_id}`,
            assigned_to: "crm-sales-agent",
            priority: "urgent",
            status: "pending",
            created_by: "realtime-trigger",
            input_context: JSON.stringify({ provider_id: payment.provider_id, amount: payment.amount }),
          }]).then(({ error }) => {
            if (error) console.warn("[Realtime] Transaction task insert error:", error.message);
          });
        }
      }
    )
    .subscribe();
}

// ============================================================
// SELF-TASKING LOOP — Agent reviews its own work and spawns follow-ups
// ============================================================
async function runSelfTaskingReview() {
  console.log("🧠 [SelfTask] Running self-review — checking recent completed tasks...");
  try {
    // Look at tasks completed in the last 6 hours
    const since = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
    const { data: doneTasks, error } = await workerSupabase
      .from("agent_tasks")
      .select("id, title, assigned_to, result, updated_at")
      .eq("status", "done")
      .gte("updated_at", since)
      .order("updated_at", { ascending: false })
      .limit(10);

    // Also fetch failed tasks to include in review
    const { data: failedTasks } = await workerSupabase
      .from("agent_tasks")
      .select("id, title, assigned_to, result, updated_at")
      .eq("status", "failed")
      .gte("updated_at", since)
      .order("updated_at", { ascending: false })
      .limit(5);

    if (error || !doneTasks || doneTasks.length === 0) {
      console.log("🧠 [SelfTask] No recent completed tasks — skipping self-review.");
      return;
    }

    // Auto-create remediation tasks for repeated failures
    if (failedTasks && failedTasks.length >= 2) {
      const failuresByAgent = failedTasks.reduce((acc, t) => {
        acc[t.assigned_to] = (acc[t.assigned_to] || 0) + 1;
        return acc;
      }, {});
      for (const [agent, count] of Object.entries(failuresByAgent)) {
        if (count >= 2) {
          const failureSummary = failedTasks
            .filter(t => t.assigned_to === agent)
            .map(t => `- "${t.title}": ${(t.result || "").slice(0, 100)}`)
            .join("\n");
          await workerSupabase.from("agent_tasks").insert([{
            title: `[AutoFix] Investigate repeated failures for ${agent}`,
            description: `The agent ${agent} failed ${count} times in the last 6 hours:\n${failureSummary}\n\nInvestigate root cause and propose a fix.`,
            assigned_to: "tech-lead-agent",
            priority: "high",
            status: "pending",
            created_by: "self-tasking-loop",
          }]);
          console.log(`🧠 [SelfTask] Created remediation task for ${agent} (${count} failures)`);
          await notifyTelegram(`⚠️ *Remediation Task Created*\nAgent *${agent}* failed ${count} times in 6 hours.\nCreated investigation task for tech-lead-agent.\n\n${failureSummary.slice(0, 300)}`);
        }
      }
    }

    // Check if we already ran a self-review recently (avoid double-fire)
    const { data: recentReview } = await workerSupabase
      .from("agent_tasks")
      .select("id")
      .eq("assigned_to", "planner-agent")
      .eq("created_by", "self-tasking-loop")
      .gte("created_at", since)
      .limit(1);

    if (recentReview && recentReview.length > 0) {
      console.log("🧠 [SelfTask] Self-review already scheduled recently — skipping.");
      return;
    }

    const summary = doneTasks
      .map((t) => `- [${t.assigned_to}] "${t.title}" → ${(t.result || "").slice(0, 120)}`)
      .join("\n");

    const failedSummary = failedTasks && failedTasks.length > 0
      ? "\n\nFailed tasks (needs attention):\n" + failedTasks
          .map((t) => `- [${t.assigned_to}] "${t.title}" ❌ ${(t.result || "").slice(0, 100)}`)
          .join("\n")
      : "";

    // Fetch real user analytics from DB
    const { data: newLeads } = await workerSupabase
      .from("crm_leads")
      .select("name, source, notes, created_at")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(10);

    const { data: recentBookings } = await workerSupabase
      .from("bookings")
      .select("service_name, status, created_at")
      .gte("created_at", since)
      .limit(10);

    const analyticsContext = [
      newLeads?.length ? `New leads (${newLeads.length}): ${newLeads.map(l => l.source).join(', ')}` : null,
      recentBookings?.length ? `Bookings (${recentBookings.length}): ${recentBookings.map(b => b.status).join(', ')}` : null,
    ].filter(Boolean).join('\n');

    console.log(`🧠 [SelfTask] Found ${doneTasks.length} completed tasks — spawning planner review`);

    await workerSupabase.from("agent_tasks").insert([{
      title: "Self-Review: Analyze recent work and create follow-up tasks",
      description: `Review the following recently completed tasks and decide what follow-up actions are needed. For each important finding, create a new task by inserting into agent_tasks.\n\nRecent completed work:\n${summary}${failedSummary}${analyticsContext ? `\n\nUser activity (last 6h):\n${analyticsContext}` : ''}\n\nFocus on: missed opportunities, pending follow-ups, patterns that need attention, and proactive outreach.`,
      assigned_to: "planner-agent",
      priority: "medium",
      status: "pending",
      created_by: "self-tasking-loop",
    }]);

    console.log("🧠 [SelfTask] Planner review task created ✅");
  } catch (err) {
    console.warn("🧠 [SelfTask] Error:", err.message);
  }
}

// ============================================================
// AUTO-RECOVERY — Resets tasks stuck in-progress > 45 min
// ============================================================
async function autoRecoverStuckTasks() {
  try {
    const cutoff = new Date(Date.now() - 45 * 60 * 1000).toISOString();
    const { data: stuck } = await workerSupabase
      .from("agent_tasks")
      .select("id, title, assigned_to")
      .eq("status", "in_progress")
      .lt("updated_at", cutoff)
      .limit(3);

    for (const task of stuck || []) {
      await workerSupabase.from("agent_tasks").update({
        status: "pending",
        result: `Auto-recovered: was stuck in-progress > 45 min. Will retry.`,
        updated_at: new Date().toISOString(),
      }).eq("id", task.id);
      console.log(`🔧 [AutoRecover] Reset stuck task: "${task.title}" (${task.assigned_to})`);
      await notifyTelegram(`🔧 *Auto-Recovered Task*\nTask *"${task.title}"* was stuck in-progress for >45 min.\nAgent: ${task.assigned_to || "unknown"}\nStatus reset to pending for retry.`);
    }
  } catch (err) {
    console.warn("🔧 [AutoRecover] Error:", err.message);
  }
}

// ============================================================
// REFLECTION CYCLE — Learns from past tasks, improves system prompt
// ============================================================
async function runReflectionCycle() {
  console.log("🪞 [Reflect] Running reflection cycle...");
  try {
    const geminiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    if (!geminiKey) return;

    const { data: recentTasks } = await workerSupabase
      .from("agent_tasks")
      .select("title, status, result, assigned_to")
      .in("status", ["done", "failed"])
      .order("updated_at", { ascending: false })
      .limit(20);

    if (!recentTasks || recentTasks.length < 5) {
      console.log("🪞 [Reflect] Not enough tasks yet — skipping.");
      return;
    }

    const taskSummary = recentTasks
      .map(t => `[${t.status}] ${t.assigned_to}: "${t.title}" → ${(t.result || "").slice(0, 80)}`)
      .join("\n");

    const reflectPrompt = `You are analyzing an AI agent worker system's recent task history to extract improvement lessons.

Task history:
${taskSummary}

Return a JSON array of up to 3 specific, actionable lessons. Format:
[{"lesson": "...", "applies_to": "agent-name or all", "priority": "high|medium|low"}]

Only return the JSON array, no other text.`;

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: reflectPrompt }] }] }),
      }
    );

    const geminiData = await geminiRes.json();
    const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const jsonMatch = rawText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return;

    const newLessons = JSON.parse(jsonMatch[0]);

    // Load existing learnings
    const { data: existing } = await workerSupabase
      .from("company_knowledge")
      .select("value")
      .eq("key", "WORKER_LEARNINGS")
      .single();

    const allLessons = [...(existing?.value?.lessons || []), ...newLessons].slice(-50);

    await workerSupabase.from("company_knowledge").upsert(
      { key: "WORKER_LEARNINGS", value: { lessons: allLessons, updated_at: new Date().toISOString() } },
      { onConflict: "key" }
    );

    console.log(`🪞 [Reflect] Saved ${newLessons.length} new lessons (total: ${allLessons.length})`);
    const lessonSnippet = newLessons.map((l, i) => `${i + 1}. ${l.lesson}`).join("\n");
    await notifyTelegram(`🪞 *Reflection Cycle Complete*\n+${newLessons.length} new lessons (${allLessons.length} total)\n\n${lessonSnippet}`);;

    // Every 10 learnings — distill into system prompt addendum
    if (allLessons.length > 0 && allLessons.length % 10 === 0) {
      const distillPrompt = `Distill these ${allLessons.length} agent lessons into 3 core operating principles (max 2 sentences each):
${JSON.stringify(allLessons, null, 2)}
Return plain text, one principle per line.`;

      const distillRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ parts: [{ text: distillPrompt }] }] }),
        }
      );
      const distillData = await distillRes.json();
      const principles = distillData?.candidates?.[0]?.content?.parts?.[0]?.text || "";

      if (principles) {
        const { data: cfg } = await workerSupabase
          .from("company_knowledge")
          .select("value")
          .eq("key", "WORKER_CONFIG")
          .single();

        const updatedConfig = { ...(cfg?.value || {}), systemPromptAddendum: principles };
        await workerSupabase.from("company_knowledge").upsert(
          { key: "WORKER_CONFIG", value: updatedConfig },
          { onConflict: "key" }
        );
        console.log("🪞 [Reflect] Updated WORKER_CONFIG systemPromptAddendum with distilled principles ✅");
        await notifyTelegram(`🧠 *System Prompt Evolved*\nReached ${allLessons.length} lessons — distilled new core principles:\n\n${principles.slice(0, 400)}`);
      }
    }
  } catch (err) {
    console.warn("🪞 [Reflect] Error:", err.message);
  }
}

function startSelfTaskingLoop() {
  console.log("🧠 Self-Tasking Loop started (every 4 hours)");
  // Run once 10 min after startup (let the main loop settle first)
  setTimeout(() => runSelfTaskingReview(), 10 * 60 * 1000);
  // Then every 4 hours
  setInterval(() => runSelfTaskingReview(), 4 * 60 * 60 * 1000);
  // Reflection cycle every 8 hours
  setTimeout(() => runReflectionCycle(), 30 * 60 * 1000); // first run 30 min after startup
  setInterval(() => runReflectionCycle(), 8 * 60 * 60 * 1000);
}

// ============================================================
// HEARTBEAT — writes timestamp to Supabase every 2 min
// so the admin dashboard can show "Worker Online/Offline"
// ============================================================
async function startHeartbeat() {
  const beat = async () => {
    await workerSupabase
      .from("company_knowledge")
      .upsert({ key: "WORKER_HEARTBEAT", value: new Date().toISOString() }, { onConflict: "key" });
  };
  await beat(); // immediate first beat
  setInterval(beat, 2 * 60 * 1000);
}

// Start Main
main().catch((err) => console.error("Fatal Error:", err));
startCronScheduler();
startRealtimeListeners();
startSelfTaskingLoop();
startHeartbeat();
