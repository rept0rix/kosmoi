# Kosmoi Autonomous Cyber Defense: The "Immune System" Roadmap

> [!NOTE]
> **Status:** ACTIVE (Implemented v1.0).
> **Trigger:** Activated on 2025-12-22.
> **Reason:** Core infrastructure (Docker MCP, Guardrails, Sentinels) successfully deployed.

This document outlines the architectural vision for a fully autonomous "Self-Protecting" system for Kosmoi. It was designed to address "Infinite Threat Scenarios" using AI-driven evolution.

---

## 🛡️ Current Implementation Status (v1.0)
| Component | Status | Implementation Details |
| :--- | :--- | :--- |
| **Data Layer** | ✅ **Active** | `Docker MCP Gateway` (Secure Containerized Execution) |
| **Input Guardrails** | ✅ **Active** | `InputGuardrailService` (Regex, Homoglyphs, Length) |
| **Output Guardrails** | ✅ **Active** | `OutputGuardrailService` (PII Redaction: Keys, CCs) |
| **Sentinel Agents** | ✅ **Active** | `AuditorSentinelService` (Rapid Fire, Error Loops) |
| **Supreme Court** | ⏳ *Planned* | Future sophisticated decision making |
| **Red Team Sim** | ⏳ *Planned* | Future adversarial training |

---

## 1. Philosophy: Biological Resilience
Traditional security is about building higher walls (Firewalls, Auth).
**Autonomous Defense** is about having a healthy immune system.
*   **Assumption:** The walls *will* be breached, or an internal agent *will* make a mistake.
*   **Goal:** Detect the infection instantly and neutralize it before it causes system-wide damage.
*   **Key Concept:** The "Immune System" is separate from the "Body" (Business Logic).

---

## 2. Enterprise Threat Model (MITRE ATLAS & OWASP Compliant)

We align our defense strategy with the **OWASP Top 10 for LLMs (2025)** and **MITRE ATLAS** framework.

| Threat Category | Industry ID | Kosmoi Defense Component |
| :--- | :--- | :--- |
| **Prompt Injection** | `OWASP LLM01` / `ATLAS AML.T0051` | **Input Guardrails** (Regex + AI Classifier) |
| **Excessive Agency** | `OWASP LLM06` | **Supreme Court Agent** (Humanless "Man-in-the-loop") |
| **Supply Chain** | `OWASP LLM03` / `ATLAS AML.T0010` | **Code Sentinel** (Dependency Scanning) |
| **Data Exfiltration** | `OWASP LLM02` | **Output Guardrails** (PII Redaction) |

---

## 3. Core Components Architecture

### 3.1. Zero Trust Identity Layer (Foundation)
In a "Big Tech" architecture, Agents do not trust each other by default.
1.  **Identity Provider (IdP):** A central "Passport Office" (e.g., `Auth Service`).
2.  **Short-Lived Tokens:** Each Agent spins up and requests a token valid for only 5 minutes.
3.  **Strict Allow-Listing:** The `Finance Service` will REJECT any request from `Sales Agent` unless it has a specific `scope:finance.read`.

### 3.2. The Guardrails ("The Skin")
Deterministic, fast rules that run *before* and *after* every Agent action. Zero intelligence, 100% reliability.
*   **Input Guardrails:** Prevent Prompt Injection (Regex filters for "Ignore previous instructions").
*   **Output Guardrails:** Prevent logical disasters (e.g., `Price sanitizer`: prevents products with `price < $50`).

### 3.3. The Sentinel Agents ("White Blood Cells")
Specialized, lightweight AI models that monitor streams of data. They do not "act", they only "flag".
*   **The Auditor Sentinel:** Reads `agent_tasks` and `transactions` tables. Looks for logic anomalies.
*   **The Network Sentinel:** Monitors API Logs. Looks for volume spikes.

### 3.4. The Supreme Court Agent ("The Brain")
The only agent authorized to take "Destructive" defensive actions.
*   **Input:** Receives "Cases" from Sentinel Agents.
*   **Logic:** Weighs context (e.g., is this a test? or an attack?).
*   **Output:** Issues a "Kill Warrant" to the Enforcers.

---

## 4. Operational Strategy: The "Red Team" (Accelerated Evolution)

To address the "Infinite Scenario" problem, we do not wait for real attacks. We simulate them at machine speed.

### 4.1. The "Adversarial Simulator" (Red Team Agent)
A dedicated, hostile AI that runs in a parallel `Simulation Environment`.
*   **Goal:** Crash the system, steal data, drain wallets.
*   **Speed:** Thousands of Simulations per Hour.

### 4.2. The Feedback Loop ("Warpspeed Evolution")
1.  **Generate:** Red Agent creates 100 variations of an attack.
2.  **Test:** Fires them at the `Staging` environment.
3.  **Patch:** System Brain analyzes successes and **immediately** updates global Guardrails.

---

## 5. Cost Control: Economic Viability Protocol

Running thousands of simulations on GPT-4 is bankrupting. We solve this with a tiered compute strategy.

### 5.1. Tier 1: The "Grunt" Attackers (Local LLMs)
*   **Model:** `Llama-3-8B-Instruct` (Quantized).
*   **Cost:** ~$0 (Electricity only). Runs on our own GPU instances.
*   **Role:** Brute Force. Generates 90% of the "dumb" attacks.

### 5.2. Tier 2: The "Sniper" Attackers (SOTA Models)
*   **Model:** `Claude 3 Opus` / `GPT-4o`.
*   **Cost:** High.
*   **Role:** Creative, novel attacks that the small models can't think of.
*   **Volume:** Capped at 50/day (Peace Time).

### 5.3. Dynamic Scaling Protocol ("DEFCON Levels")
*   **DEFCON 5 (Peace):** 100% Local Models. 1 "Sniper" attack per hour. Cost: <$5/day.
*   **DEFCON 1 (Active Breach):** Uncapped Budget. Total War.

---

## 6. Technical Implementation Strategy (from `aliasrobotics/cai`)

### 6.1. The "Guardrail" Middleware Pattern
*   **Input Guardrails:** Regex Filtering + Unicode Normalization (NFKD) + Lightweight AI Classifier (`PromptInjectionCheck`).
*   **Output Guardrails:** Command Verification (Decode Base64, Scan binaries) + Data Masking (Redact Keys).

### 6.2. Sentinel Implementation: The "Observer" Pattern
*   **Events:** strictly typed `event_log` table.
*   **Analysis:** Cron-job batch-processing events every minute.
