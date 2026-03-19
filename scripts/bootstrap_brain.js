/**
 * bootstrap_brain.js
 * Seeds the company_knowledge table with foundational AI context.
 * Run: node scripts/bootstrap_brain.js
 */

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..");

// ── Supabase Client (Service Role) ──────────────────────────────────────────
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ VITE_SUPABASE_URL or VITE_SUPABASE_SERVICE_ROLE_KEY missing from .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// ── Helper: read a file safely ───────────────────────────────────────────────
function readFile(relativePath) {
  const fullPath = path.join(PROJECT_ROOT, relativePath);
  if (fs.existsSync(fullPath)) {
    return fs.readFileSync(fullPath, "utf-8");
  }
  return null;
}

// ── Build knowledge entries ──────────────────────────────────────────────────
function buildKnowledge() {
  const packageJson = JSON.parse(readFile("package.json") || "{}");
  const specContent = readFile("SPEC.md") || "";
  const roadmapContent = readFile("JANUARY_2026_ROADMAP.md") || "";

  // ── COMPANY_OVERVIEW ──────────────────────────────────────────────────────
  const COMPANY_OVERVIEW = {
    name: "Kosmoi (Samui Service Hub)",
    tagline: "The Premium Service Marketplace for Koh Samui",
    mission:
      "To connect tourists and expats on Koh Samui with trusted, high-quality local service providers — and to help those businesses grow through AI-powered tools, visibility, and automation.",
    target_market: {
      consumers: "Tourists, digital nomads, expats, and long-stay visitors on Koh Samui",
      providers: "Local service businesses: yoga studios, spas, tours, restaurants, repair services, wellness centers",
    },
    location: "Koh Samui, Thailand (primary). Expansion: Koh Phangan, Phuket (Phase 9).",
    pricing_tiers: [
      { name: "Free", price_thb: 0, features: ["Basic listing", "1 photo", "Contact button"] },
      { name: "Starter", price_thb: 35, features: ["Verified badge", "5 photos", "WhatsApp button"] },
      { name: "Growth", price_thb: 1500, features: ["Priority placement", "Analytics", "AI Receptionist (basic)"] },
      { name: "Scale", price_thb: 3500, features: ["Top placement", "Full Analytics", "AI Receptionist (custom tone)", "Commission on bookings"] },
    ],
    tech_stack: {
      frontend: "React 18 + Vite + Tailwind CSS",
      backend: "Supabase (PostgreSQL + Auth + Storage + Realtime)",
      ai: "Google Gemini 2.0 Flash (primary), OpenAI (fallback)",
      agents: "Custom multi-agent system with BoardRoom orchestration",
      infrastructure: "Railway (worker), Vercel (frontend), n8n (automation)",
      key_dependencies: Object.keys(packageJson.dependencies || {}).slice(0, 25),
    },
    current_phase: "Phase 7-8: DevOps, QA, Growth",
    revenue_model: "SaaS subscriptions (THB) + 8-15% commission on bookings",
    spec_summary: specContent.substring(0, 2000),
    roadmap_summary: roadmapContent.substring(0, 2000),
    updated_at: new Date().toISOString(),
  };

  // ── MARKETING_PLAYBOOK ────────────────────────────────────────────────────
  const MARKETING_PLAYBOOK = {
    pitch_headline: "List your Samui business on Kosmoi and get discovered by thousands of tourists",
    value_propositions: [
      "Tourists searching for services in Samui WILL find Kosmoi — be there when they do",
      "AI-powered receptionist answers customer questions 24/7, even while you sleep",
      "Verified badge builds instant trust with foreign visitors who don't know local businesses",
      "Analytics dashboard shows exactly how many leads you're getting each month",
      "Start free — upgrade only when you see real value",
    ],
    target_segments: [
      {
        segment: "Yoga & Wellness Studios",
        pain_point: "Tourists book retreats months in advance — you're invisible if you're not online",
        hook: "Reach retreat-seekers before they land in Thailand",
      },
      {
        segment: "Tour & Activity Operators",
        pain_point: "Competing with big OTAs (Klook, Airbnb Experiences) on their turf",
        hook: "Own your local niche with direct bookings and zero commission on Starter plan",
      },
      {
        segment: "Spas & Massage",
        pain_point: "Walk-in traffic is inconsistent; no online presence = lost bookings",
        hook: "AI receptionist books appointments while you focus on clients",
      },
      {
        segment: "Restaurants & Cafes",
        pain_point: "Google Maps and TripAdvisor reviews are out of their control",
        hook: "Kosmoi lets you tell YOUR story with curated content and AI-written descriptions",
      },
    ],
    objection_handling: [
      {
        objection: "We already have a Facebook page",
        response: "Facebook is great for followers. Kosmoi is for people actively SEARCHING for your service right now. These are ready-to-book customers, not casual browsers.",
      },
      {
        objection: "35 Baht is too expensive",
        response: "That's less than one cup of coffee, once. One booking through Kosmoi pays for 10+ years of Starter plan. What's the risk?",
      },
      {
        objection: "We don't speak good English",
        response: "Our AI writes and translates your listing in perfect English (and Thai). You just provide the details.",
      },
      {
        objection: "We tried other platforms and it didn't work",
        response: "Other platforms are generic directories. We're local-first, Samui-specific, and AI-powered. We show up when tourists search 'yoga Koh Samui' specifically.",
      },
    ],
    outreach_sequence: [
      { day: 0, action: "Send intro email with personalized hook about their category" },
      { day: 3, action: "Follow-up: 'Did you get a chance to check out your free listing?'" },
      { day: 7, action: "Value add: Share a tip about tourist search behavior in their category" },
      { day: 14, action: "Soft close: Limited-time Starter offer or success story from similar business" },
    ],
    email_tone: "Professional, warm, specific to their business — never generic. Always reference something real about their category or location in Samui.",
    updated_at: new Date().toISOString(),
  };

  // ── AGENT_ROSTER ─────────────────────────────────────────────────────────
  const AGENT_ROSTER = {
    executive_layer: [
      { id: "ceo-agent", role: "CEO", description: "Strategic direction, revenue focus, execution oversight", model: "gemini-2.0-flash" },
      { id: "cto-agent", role: "CTO", description: "Technical architecture, system reliability, infrastructure decisions", model: "gemini-2.0-flash" },
      { id: "cmo-agent", role: "CMO", description: "Marketing strategy, brand voice, growth campaigns", model: "gemini-2.0-flash" },
      { id: "cfo-agent", role: "CFO", description: "Financial modeling, pricing strategy, cost optimization", model: "gemini-2.0-flash" },
      { id: "board-chairman", role: "Board Chairman", description: "Orchestrates multi-agent board meetings, final decisions", model: "gemini-2.0-flash" },
    ],
    operational_layer: [
      { id: "crm-sales-agent", role: "Sales Coordinator", description: "Lead outreach, pipeline management, follow-up sequences, personalized emails", model: "gemini-2.0-flash" },
      { id: "planner-agent", role: "Daily Planner", description: "Generates daily task plans, prioritizes backlog, delegates work", model: "gemini-2.0-flash" },
      { id: "optimizer-agent", role: "Business Optimizer", description: "Analyzes business metrics, identifies bottlenecks, writes health reports", model: "gemini-2.0-flash" },
      { id: "tech-scout-agent", role: "Tech Scout", description: "Monitors tech landscape, discovers new tools, evaluates integrations", model: "gemini-2.0-flash" },
      { id: "concierge-agent", role: "AI Concierge", description: "Customer-facing chat for service discovery and booking assistance", model: "gemini-2.0-flash" },
      { id: "receptionist-agent", role: "AI Receptionist", description: "Handles inbound messages for businesses, auto-replies to customer inquiries", model: "gemini-2.0-flash" },
    ],
    specialist_layer: [
      { id: "analytics-agent", role: "Analytics Specialist", description: "Data analysis, reporting, trend detection across all metrics" },
      { id: "blog-writer-agent", role: "Content Writer", description: "SEO blog posts, service descriptions, marketing copy" },
      { id: "security-agent", role: "Security Sentinel", description: "Monitors for vulnerabilities, reviews RLS policies, detects anomalies" },
      { id: "qa-agent", role: "QA Specialist", description: "Tests features, validates data integrity, regression testing" },
      { id: "admin-agent", role: "Admin Assistant", description: "Handles admin portal tasks, user management, provider verification" },
      { id: "worker-node-agent", role: "Worker Node", description: "General-purpose task executor for delegated background work" },
    ],
    worker_infrastructure: {
      worker_file: "scripts/agent_worker.js",
      task_table: "agent_tasks",
      knowledge_table: "company_knowledge",
      loop_interval_ms: 15000,
      cron_check_interval_ms: 60000,
    },
    updated_at: new Date().toISOString(),
  };

  // ── SYSTEM_HEALTH_BASELINE ────────────────────────────────────────────────
  const SYSTEM_HEALTH_BASELINE = {
    description: "Defines what 'healthy' looks like for the Kosmoi autonomous system",
    thresholds: {
      task_queue: {
        pending_tasks_max: 20,
        pending_tasks_alert: 5,
        description: "More than 5 tasks pending >1hr triggers alert; >20 is critical",
      },
      task_failures: {
        failed_in_24h_alert: 10,
        failed_in_24h_critical: 25,
        description: "Failed tasks indicate agent errors or tool failures",
      },
      agent_activity: {
        idle_threshold_hours: 6,
        description: "An agent idle >6h likely means no tasks were dispatched to it",
      },
      response_times: {
        task_processing_max_seconds: 300,
        llm_response_max_seconds: 30,
        supabase_query_max_ms: 2000,
      },
      business_metrics: {
        new_leads_per_week_target: 10,
        crm_conversion_rate_target_pct: 15,
        verified_providers_growth_pct_monthly: 5,
      },
    },
    monitoring_script: "scripts/monitor_agent.js",
    alert_channel: "Telegram (TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID env vars)",
    health_endpoint: "GET /health on port 8080 (worker_start.js)",
    updated_at: new Date().toISOString(),
  };

  return {
    COMPANY_OVERVIEW,
    MARKETING_PLAYBOOK,
    AGENT_ROSTER,
    SYSTEM_HEALTH_BASELINE,
  };
}

// ── Upsert to Supabase ────────────────────────────────────────────────────────
async function upsertKnowledge(key, value, category = "system") {
  const { error } = await supabase.from("company_knowledge").upsert(
    {
      key,
      value,
      category,
      updated_by: "bootstrap_brain",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "key" }
  );

  if (error) {
    console.error(`❌ Failed to upsert ${key}:`, error.message);
    return false;
  }

  console.log(`✅ Upserted: ${key}`);
  return true;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log("🧠 Bootstrapping Company Brain...\n");

  const knowledge = buildKnowledge();

  const results = await Promise.all([
    upsertKnowledge("COMPANY_OVERVIEW", knowledge.COMPANY_OVERVIEW, "company"),
    upsertKnowledge("MARKETING_PLAYBOOK", knowledge.MARKETING_PLAYBOOK, "sales"),
    upsertKnowledge("AGENT_ROSTER", knowledge.AGENT_ROSTER, "system"),
    upsertKnowledge("SYSTEM_HEALTH_BASELINE", knowledge.SYSTEM_HEALTH_BASELINE, "monitoring"),
  ]);

  const successCount = results.filter(Boolean).length;
  console.log(`\n🎉 Brain Bootstrap complete: ${successCount}/${results.length} keys written.`);

  if (successCount < results.length) {
    console.warn("⚠️  Some keys failed. Check error messages above.");
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Fatal Error:", err);
  process.exit(1);
});
