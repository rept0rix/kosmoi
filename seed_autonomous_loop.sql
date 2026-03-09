-- ============================================================
-- Kosmoi Autonomous Loop - Seed Tasks
-- Run this in Supabase SQL Editor to start the autonomous system
-- ============================================================

-- 1. Kickstart the Planner (runs once, then it schedules itself)
INSERT INTO agent_tasks (title, description, assigned_to, status, priority)
VALUES (
  'Daily Planning Run - System Startup',
  'You are the Planner Agent. Review the current state of the company and create today''s task queue. 
  Steps:
  1. Use read_file to read JANUARY_2026_ROADMAP.md for current goals
  2. Use execute_command: node scripts/list_tasks.js to see pending work
  3. Create 3-5 tasks for other agents based on what needs doing today
  4. Save your plan to company_knowledge with key daily_plan_startup
  
  Priority focus: Get the Tech Scout running and check system health.',
  'planner-agent',
  'pending',
  'high'
);

-- 2. Tech Scout - First scan
INSERT INTO agent_tasks (title, description, assigned_to, status, priority)
VALUES (
  'Weekly Tech Scan - First Run',
  'Run your weekly technology scan. 
  Search for:
  1. New AI agent frameworks (CrewAI, AutoGen, LangGraph updates)
  2. WhatsApp Business API capabilities for booking automation
  3. New Gemini / Claude model versions released in 2025-2026
  4. Stripe new features for Southeast Asia merchants
  5. Voice AI tools that could power our Receptionist Agent
  
  For each finding: save to knowledge base with key tech_scout_[tool-name]
  For top 2 findings: create a task for cto-agent to evaluate integration.',
  'tech-scout-agent',
  'pending',
  'medium'
);

-- 3. Innovation Researcher - Deep dive on autonomous agent frameworks
INSERT INTO agent_tasks (title, description, assigned_to, status, priority)
VALUES (
  'Research: Best frameworks for autonomous business agents in 2025',
  'Research the current state of autonomous AI agent frameworks.
  Focus on: CrewAI, AutoGen, LangGraph, Magentic-One, and any new frameworks.
  Key questions:
  - Which framework is best for long-running background agents?
  - What tools do leading frameworks use for web search?
  - How do top companies structure their agent memory?
  
  Deliver: A comparison document saved to company_knowledge with key agent_framework_research_2025
  Then: Create a task for cto-agent with your top recommendation.',
  'innovation-researcher-agent',
  'pending',
  'medium'
);

-- 4. Optimizer - Analyze business metrics
INSERT INTO agent_tasks (title, description, assigned_to, status, priority)
VALUES (
  'Business Health Check - Post-Restart Analysis',
  'Analyze the current state of the business after the system restart.
  Use execute_command to run: node scripts/check_db_status.js
  Check:
  1. How many service providers are in the system?
  2. How many are verified (paid)?
  3. Are there any pending CRM leads?
  4. What is the current MRR estimate?
  
  Save findings to company_knowledge with key company_metrics
  Create a task for the CMO if growth actions are needed.',
  'optimizer-agent',
  'pending',
  'high'
);

-- 5. CRM Sales - Resume outreach
INSERT INTO agent_tasks (title, description, assigned_to, status, priority)
VALUES (
  'Resume CRM Outreach - Check Pending Leads',
  'The system has been offline for ~1 month. Resume outreach operations.
  1. Use execute_command: node scripts/read_leads.js to see current leads
  2. Identify leads with status = new or contacted that haven''t had follow-up in 30+ days
  3. Draft a re-engagement email for the top 3 leads
  4. Use send_email to send outreach (if configured)
  5. Log each interaction using insert_interaction tool
  
  Keep emails short, friendly, and mention that Kosmoi has new features.',
  'crm-sales-agent',
  'pending',
  'medium'
);
