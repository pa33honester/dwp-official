-- Per-user withdrawal requests with admin approval. Balance is decremented at
-- request time (reservation), refunded on rejection.

create table if not exists public.user_withdrawals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  asset text not null,
  amount_usd numeric(20,2) not null,
  amount_crypto numeric(36,18),
  destination_address text not null,
  network text,
  note text,
  status text not null default 'pending' check (status in ('pending', 'completed', 'rejected')),
  tx_hash text,
  admin_note text,
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists user_withdrawals_user_id_created_at_idx
  on public.user_withdrawals (user_id, created_at desc);

create index if not exists user_withdrawals_status_idx
  on public.user_withdrawals (status);

alter table public.user_withdrawals enable row level security;

create policy "user_withdrawals_owner_select" on public.user_withdrawals
  for select using (auth.uid() = user_id);

create policy "user_withdrawals_admin_all" on public.user_withdrawals
  for all using (public.is_admin()) with check (public.is_admin());
