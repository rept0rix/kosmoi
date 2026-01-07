# Development Strategy & Workflow Protocol 🛠️
**Project Phase:** Operation One Dollar (MVP / Early Growth)
**Strategy Model:** "The Smart Balance" (Speed with Safety Nets)

This document outlines the agreed-upon workflow to balance development velocity with system stability. It serves as the "Constitution" for how we write, test, and deploy code.

---

## 1. Git Workflow (Branching Strategy) 🌿
**Principle:** `main` is sacred. We never commit directly to `main` for complex features.

### The Rules:
1.  **Main Branch (`main`):**
    *   Represents the current *stable* production state.
    *   Must always be deployable.
2.  **Feature Branches:**
    *   Created for every new task or feature (e.g., `feature/payment-flow`, `fix/wallet-rpc`).
    *   Naming Convention: `[type]/[short-description]`
        *   `feature/` - New capabilities
        *   `fix/` - Bug repairs
        *   `refactor/` - Code cleanup
3.  **Merge Process:**
    *   Work is done on the feature branch.
    *   Verify locally (runs expectedly).
    *   Merge to `main` only when "Green" (Tested & Verified).

### Daily Routine:
```bash
# Start new task
git checkout main
git pull origin main
git checkout -b feature/my-cool-feature

# ... Work ... Work ...

# Finish task
git add .
git commit -m "feat: complete cool feature"
git checkout main
git merge feature/my-cool-feature
git push origin main
```

---

## 2. Database Management (Supabase) 🗄️
**Principle:** Production is our only environment for now, so we treat it with extreme caution. "Scripts are documentation."

### The Rules:
1.  **No Manual Console Edits:** Avoid changing schema via the Supabase UI Dashboard whenever possible. It leaves no trace.
2.  **Migration Files:** Every DB change (new table, altered column, RPC function) **MUST** be written as a SQL file in `supabase/migrations/`.
    *   Format: `YYYYMMDD_description.sql` (e.g., `20260107_fix_transfer_func.sql`).
3.  **Execution:** We execute the SQL file via the Dashboard SQL Editor, but the *source of truth* remains in our Git repo.
4.  **Backups:** We rely on Supabase's daily backups, but for critical data operations (like bulk updates), we run a dry-run script first.

---

## 3. Environment & Secrets 🔐
**Principle:** Separation of Concerns.

1.  **Local `.env`:** Contains keys for the *Production* project `gzjzeywhqbwppfxqkptf` (Samui Place). This puts us "live" even when developing locally.
2.  **Edge Functions:**
    *   Deployed individually via `npx supabase functions deploy [name] --project-ref gzjzeywhqbwppfxqkptf`.
    *   Secrets managed via `npx supabase secrets set`.
    *   **CRITICAL:** When adding a new secret key, immediately add it to the local `.env` and the remote Supabase Project Secrets.

---

## 4. Testing Protocol 🧪
**Principle:** Trust but Verify.

1.  **Verification Scripts:** For every major backend logic (Payments, Transfers), we maintain a script in `scripts/` (e.g., `test_p2p.js`).
2.  **Run Before Merge:** Before merging any branch to `main`, run the relevant test scripts.
    *   If `test_p2p.js` fails -> **DO NOT MERGE**.

---

## 5. Future Roadmap (When to Upgrade?) 🚀
We will trigger the move to **Full Local Development (Docker + CI/CD)** when one of the following happens:
1.  **Team Growth:** A second developer joins the team.
2.  **Traffic Spike:** We hit >1,000 active daily users and can't risk *any* downtime.
3.  **Revenue:** "Operation One Dollar" becomes "Operation One Thousand Dollars" (reliable MRR).

Until then, we stick to **The Smart Balance**.
