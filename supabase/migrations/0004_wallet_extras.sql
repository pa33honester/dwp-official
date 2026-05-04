-- Extra portfolio figures admins can set per user.

alter table public.wallet_applications
  add column if not exists locked_balance_usd numeric(20,2) not null default 0,
  add column if not exists return_earnings_usd numeric(20,2) not null default 0;
