-- Per-user deposit ledger so admins can record deposits and users can see
-- them in transaction history with a tx-hash proof.

create table if not exists public.user_deposits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  asset text not null,
  amount_usd numeric(20,2) not null,
  amount_crypto numeric(36,18),
  tx_hash text not null,
  network text,
  note text,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create index if not exists user_deposits_user_id_created_at_idx
  on public.user_deposits (user_id, created_at desc);

alter table public.user_deposits enable row level security;

create policy "user_deposits_owner_select" on public.user_deposits
  for select using (auth.uid() = user_id);

create policy "user_deposits_admin_all" on public.user_deposits
  for all using (public.is_admin()) with check (public.is_admin());
