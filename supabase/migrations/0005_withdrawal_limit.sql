-- Self-imposed daily withdrawal limit (USD). 0 means no limit set; not enforced
-- in app code yet — purely a stored preference for now.

alter table public.wallet_applications
  add column if not exists daily_withdrawal_limit_usd numeric(20,2) not null default 0;
