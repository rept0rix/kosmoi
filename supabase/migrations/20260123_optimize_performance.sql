-- Optimization: Wrap auth.uid() in select for caching (100x speedup potential)
-- Replaces direct calls with scalar subqueries
-- 1. Optimize Workflows
drop policy if exists "Enable update for users based on user_id" on public.workflows;
create policy "Enable update for users based on user_id" on public.workflows for
update using (
        (
            select auth.uid()
        ) = user_id
    );
drop policy if exists "Enable delete for users based on user_id" on public.workflows;
create policy "Enable delete for users based on user_id" on public.workflows for delete using (
    (
        select auth.uid()
    ) = user_id
);
-- 2. Optimize Service Providers (Vendor Dashboard)
-- Assumes existing policies might be named standardly or need replacement.
-- We safely create optimizations for common vendor access patterns.
-- Indexing: Add missing Foreign Key indexes
create index if not exists idx_workflows_user_id on public.workflows(user_id);
create index if not exists idx_service_providers_owner_id on public.service_providers(owner_id);
create index if not exists idx_messages_sender_id on public.messages(sender_id);
create index if not exists idx_messages_receiver_id on public.messages(receiver_id);
create index if not exists idx_bookings_user_id on public.bookings(user_id);
create index if not exists idx_bookings_provider_id on public.bookings(provider_id);
-- 3. Optimize P2P Wallet Transactions
create index if not exists idx_wallet_transactions_wallet_id on public.wallet_transactions(wallet_id);
create index if not exists idx_wallets_user_id on public.wallets(user_id);