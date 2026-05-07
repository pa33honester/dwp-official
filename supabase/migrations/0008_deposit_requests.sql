-- User-initiated deposit requests. Existing user_deposits rows are
-- treated as already-approved (status='completed') since they were
-- admin-recorded.

alter table public.user_deposits
  add column if not exists status text not null default 'completed',
  add column if not exists sender_initials text,
  add column if not exists admin_note text,
  add column if not exists reviewed_by uuid references auth.users(id),
  add column if not exists reviewed_at timestamptz;

alter table public.user_deposits
  drop constraint if exists user_deposits_status_check;

alter table public.user_deposits
  add constraint user_deposits_status_check
  check (status in ('pending', 'completed', 'rejected'));

create index if not exists user_deposits_status_idx
  on public.user_deposits (status);

-- The existing tx_hash NOT NULL constraint blocks user-submitted pending
-- requests (they may not have a hash yet). Make it nullable; admin sets
-- it on approval.
alter table public.user_deposits
  alter column tx_hash drop not null;
