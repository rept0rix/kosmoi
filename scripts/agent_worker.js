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

// --- OTA AUTO-UPDATE LOGIC ---
async function checkForUpdates() {
  console.log("📡 Checking for updates (via agent_tasks)...");
  const UPDATE_ID = "00000000-0000-0000-0000-000000000001";

  const { data, error } = await realSupabase
    .from("agent_tasks")
    .select("*")
    .eq("id", UPDATE_ID)
    .single();

  if (error || !data) {
    console.log("✅ No updates found.");
    return;
  }

  try {
    const updateData = JSON.parse(data.description);
    const remoteVersion = new Date(updateData.version).getTime();
    const localStats = fs.statSync(__filename);
    const localVersion = localStats.mtime.getTime();

    if (remoteVersion > localVersion) {
      console.log("🚀 New version detected! Downloading update...");
      console.log(`   Remote: ${updateData.version}`);

      // Backup
      fs.copyFileSync(__filename, `${__filename}.bak`);

      // Overwrite
      fs.writeFileSync(__filename, updateData.code);

      console.log("✅ Update applied. Restarting worker...");
      process.exit(0);
    } else {
      console.log("✅ Worker is up to date.");
    }
  } catch (e) {
    console.error("❌ Failed to parse update payload:", e.message);
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
import { ReceptionistAgent } from "../src/features/agents/services/ReceptionistAgent.js"; // Import Receptionist Agent
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
                from: "onboarding@resend.dev", // Fallback to testing domain to unblock flow
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

      case "generate_email":
        return `Subject: Hello from Kosmoi\n\nDear Lead,\n\nWe saw you are interested in... [Generated Content Stub]`;

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

async function processTask(task, agentService, agentConfigOverride) {
  console.log(`\n📋 Processing Task: ${task.title}`);
  console.log(`[${workerName}] Claiming task...`);
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

  const prompt = `
You have been assigned a task:
TITLE: ${task.title}
DESCRIPTION: ${task.description}

Please execute this task using your available tools.
AVAILABLE TOOLS:
- execute_command: Run shell commands
- write_code: Write files
- send_email: Send real emails (Resend/SMTP configured)
- create_lead: Add CRM headers
- create_lead: Add CRM headers
- create_task: Delegate work

${mcpManager.formatToolsSystemPrompt()}

If you need to run commands, use 'execute_command'.
If you need to write code, use 'write_code'.
If you need to send an email, use 'send_email'.

When finished, reply with "TASK_COMPLETED".
`;

  let currentMessage = prompt;
  let turnCount = 0;
  const MAX_TURNS = 30; // Increased to allow for complex data generation tasks

  while (turnCount < MAX_TURNS) {
    turnCount++;
    console.log(`\n🔄 Turn ${turnCount}...`);

    const response = await activeAgent.sendMessage(currentMessage, {
      simulateTools: false,
    });
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
      currentMessage = `Tool '${action.name}' output:\n${result}\n\nWhat is the next step?`;
    } else if (action && !action.name) {
      console.warn("⚠️ Detected action but NAME is undefined:", action);
      currentMessage =
        "Error: Tool action detected but tool name is missing. Please check your JSON structure.";
    } else {
      // No tool call. Check if done.
      // No tool call. Check if done.
      if (
        response.text.toUpperCase().includes("TASK_COMPLETED") ||
        response.text.toUpperCase().includes("TERMINATE")
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

        return;
      }

      // If no tool and no completion, just continue conversation or stop?
      console.log(
        "⚠️ No tool called and not completed. Agent might be confused.",
      );

      // Force fail if we are stuck in a loop without actions (RELAXED LIMIT)
      if (turnCount >= MAX_TURNS) {
        console.error("❌ Task Failed: Agent is not calling tools.");
        await workerSupabase
          .from("agent_tasks")
          .update({
            status: "done",
            result: "FAILED: Agent failed to execute tools.",
          })
          .eq("id", task.id);
        return;
      }

      // Try to nudge the agent
      if (
        response.text.toLowerCase().includes("complete") ||
        response.text.toLowerCase().includes("finished")
      ) {
        currentMessage =
          "System Notification: You have indicated the task is complete. Please strictly reply with the exact text 'TASK_COMPLETED' to finalize the process.";
      } else {
        currentMessage =
          "Action not detected. If you have finished the task, please explicitly reply with 'TASK_COMPLETED'. Otherwise, select the appropriate tool to proceed.";
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

          // Trigger Agent with workerSupabase (Service Role)
          const responseText = await ReceptionistAgent.handleIncomingMessage(
            lastMsg,
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

      // 1. Run Receptionist Cycle (Priority)
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
      if (error) console.error(`Cron insert error for ${sched.agentId}:`, error.message);
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

// Start Main
main().catch((err) => console.error("Fatal Error:", err));
startCronScheduler();
