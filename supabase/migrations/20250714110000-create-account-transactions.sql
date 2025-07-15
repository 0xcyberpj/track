-- Migration: Create account_transactions table for logging income and deduction on savings accounts
create table if not exists account_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  account_id uuid references savings_accounts(id) not null,
  type text check (type in ('income', 'deduction')) not null,
  amount numeric not null,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
); 