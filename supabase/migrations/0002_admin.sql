-- Admin role support: balance column on wallet_applications and system-wide deposit_addresses table.

alter table public.wallet_applications
  add column if not exists balance_usd numeric(20,2) not null default 0;

create table if not exists public.deposit_addresses (
  ticker text primary key,
  name text not null,
  color text not null,
  address text not null default '',
  updated_at timestamptz not null default now()
);

alter table public.deposit_addresses enable row level security;

create policy "deposit_addresses_auth_select" on public.deposit_addresses
  for select using (auth.role() = 'authenticated');

create or replace function public.is_admin() returns boolean
  language sql stable as $$
    select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false)
$$;

insert into public.deposit_addresses (ticker, name, color, address) values
  ('BTC',  'Bitcoin',  '#F7931A', ''),
  ('ETH',  'Ethereum', '#627EEA', ''),
  ('XRP',  'XRP',      '#23292F', ''),
  ('XLM',  'Stellar',  '#7D00FF', ''),
  ('ADA',  'Cardano',  '#0033AD', ''),
  ('SOL',  'Solana',   '#14F195', ''),
  ('HBAR', 'Hedera',   '#222222', ''),
  ('TRX',  'TRON',     '#FF060A', ''),
  ('DOGE', 'Dogecoin', '#C2A633', ''),
  ('USDT', 'Tether',   '#26A17B', '')
on conflict (ticker) do nothing;
