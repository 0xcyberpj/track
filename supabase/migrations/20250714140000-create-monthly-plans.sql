-- Monthly budget planner table
-- Stores the entire monthly plan as a document with JSONB columns
CREATE TABLE public.monthly_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month DATE NOT NULL, -- first day of the month (e.g. 2025-02-01)
  income DECIMAL(12,2) NOT NULL DEFAULT 0,
  income_label TEXT DEFAULT 'Salary',

  -- Fixed allocations: [{title, amount, completed}]
  allocations JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Balance distribution across accounts: [{account, amount}]
  balance_distribution JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Spending trackers: [{name, budget, entries: [{date, description, amount}]}]
  trackers JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Investments: [{name, amount, description}]
  investments JSONB NOT NULL DEFAULT '[]'::jsonb,

  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),

  -- One plan per user per month
  UNIQUE(user_id, month)
);

-- Enable RLS
ALTER TABLE public.monthly_plans ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own plans" ON public.monthly_plans
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own plans" ON public.monthly_plans
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own plans" ON public.monthly_plans
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own plans" ON public.monthly_plans
  FOR DELETE USING (auth.uid() = user_id);

-- Auto-update timestamp
CREATE TRIGGER update_monthly_plans_updated_at
  BEFORE UPDATE ON public.monthly_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
