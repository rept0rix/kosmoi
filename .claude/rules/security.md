# Security Guidelines

## 1. Database Security (Supabase)
### Row Level Security (RLS)
- **Mandatory**: RLS must be enabled on ALL tables containing user data.
- **Policies**:
  - `SELECT`: Users can usually view public data (e.g., `service_providers`) but only their own private data (`bookings`, `wallets`).
  - `INSERT/UPDATE`: Strictly limited to the resource owner (`auth.uid() = user_id`) or Admins.
  - **Service Role**: Never use `service_role` key on the client side.

### SQL Injection Prevention
- Use Parameterized Queries or Supabase JS Client methods (which auto-parameterize).
- Avoid raw SQL strings in client code.

## 2. Authentication & Authorization
### Roles
- **Guest**: Unauthenticated. Read-only access to Landing, Pricing, About.
- **User**: Authenticated. Can book services, view own profile.
- **Provider**: Business owner. Can manage own slots and business profile.
- **Admin**: Superuser. Managed via `users` table `role` column.
  - Protected Routes: Wrap sensitive pages in `<RequireAdmin>`.

## 3. Environment Variables
- **Client-Side**: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`. (Safe to expose).
- **Server-Side Only**: `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`. (NEVER commit to git).
- **Git**: `.env` must always be in `.gitignore`.

## 4. API Security
- **Rate Limiting**: Implement for AI endpoints to prevent abuse.
- **Validation**: Validate all inputs using Zod or similar before processing.
