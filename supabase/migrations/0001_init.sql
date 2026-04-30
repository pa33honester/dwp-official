-- DWP initial schema: profiles, wallet_applications, llc_applications.

create extension if not exists "uuid-ossp";

-- Profiles: extends auth.users with KYC-light identity fields.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  date_of_birth date,
  phone text,
  memorable_phrase_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Wallet applications: one per signed-up wallet.
create table if not exists public.wallet_applications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  vault_name text not null,
  purpose text not null,
  use_case text not null,
  estimated_assets text not null,
  connected_address text,
  connector_type text,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- LLC applications: one per submitted Digital Asset LLC application.
create table if not exists public.llc_applications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  full_legal_name text not null,
  street_address text not null,
  country text not null,
  state_region text not null,
  city text not null,
  ssn_or_ein text not null,
  entity_name text not null,
  formation_jurisdiction text not null,
  intended_use text not null,
  registered_agent boolean not null default true,
  status text not null default 'submitted',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS: every table is owner-scoped.
alter table public.profiles enable row level security;
alter table public.wallet_applications enable row level security;
alter table public.llc_applications enable row level security;

create policy "profiles_owner_select" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles_owner_modify" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "wallet_applications_owner_select" on public.wallet_applications
  for select using (auth.uid() = user_id);

create policy "wallet_applications_owner_modify" on public.wallet_applications
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "llc_applications_owner_select" on public.llc_applications
  for select using (auth.uid() = user_id);

create policy "llc_applications_owner_modify" on public.llc_applications
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Indexes for common lookups.
create index if not exists wallet_applications_user_id_idx
  on public.wallet_applications (user_id);
create index if not exists llc_applications_user_id_idx
  on public.llc_applications (user_id);
