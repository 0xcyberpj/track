import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

// ─── Types ───
export interface Allocation {
  id: string;
  title: string;
  amount: number;
  completed: boolean;
}

export interface BalanceItem {
  id: string;
  account: string;
  amount: number;
}

export interface TrackerEntry {
  id: string;
  date: string;
  description: string;
  amount: number;
}

export interface Tracker {
  id: string;
  name: string;
  budget: number;
  entries: TrackerEntry[];
}

export interface Investment {
  id: string;
  name: string;
  amount: number;
  description: string;
}

export interface MonthlyPlan {
  id: string;
  month: string;
  income: number;
  income_label: string;
  allocations: Allocation[];
  balance_distribution: BalanceItem[];
  trackers: Tracker[];
  investments: Investment[];
  notes: string;
}

const uid = () => crypto.randomUUID();

const emptyPlan = (month: string): Omit<MonthlyPlan, 'id'> => ({
  month,
  income: 0,
  income_label: 'Salary',
  allocations: [],
  balance_distribution: [],
  trackers: [],
  investments: [],
  notes: '',
});

export function useMonthlyPlan(month: string) {
  const { user } = useAuth();
  const [plan, setPlan] = useState<MonthlyPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fetch plan for the given month
  const fetchPlan = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const { data, error } = await supabase
      .from('monthly_plans')
      .select('*')
      .eq('user_id', user.id)
      .eq('month', month)
      .maybeSingle();

    if (error) {
      toast({ title: 'Error', description: 'Failed to load plan', variant: 'destructive' });
      setLoading(false);
      return;
    }

    if (data) {
      setPlan({
        id: data.id,
        month: data.month,
        income: Number(data.income),
        income_label: data.income_label || 'Salary',
        allocations: (data.allocations as Allocation[]) || [],
        balance_distribution: (data.balance_distribution as BalanceItem[]) || [],
        trackers: (data.trackers as Tracker[]) || [],
        investments: (data.investments as Investment[]) || [],
        notes: data.notes || '',
      });
    } else {
      setPlan(null);
    }
    setLoading(false);
  }, [user, month]);

  useEffect(() => {
    fetchPlan();
  }, [fetchPlan]);

  // Create a new plan for this month
  const createPlan = async () => {
    if (!user) return;
    setSaving(true);
    const defaults = emptyPlan(month);

    const { data, error } = await supabase
      .from('monthly_plans')
      .insert({
        user_id: user.id,
        month,
        income: defaults.income,
        income_label: defaults.income_label,
        allocations: defaults.allocations as any,
        balance_distribution: defaults.balance_distribution as any,
        trackers: defaults.trackers as any,
        investments: defaults.investments as any,
        notes: defaults.notes,
      })
      .select()
      .single();

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else if (data) {
      setPlan({
        id: data.id,
        month: data.month,
        income: Number(data.income),
        income_label: data.income_label || 'Salary',
        allocations: [],
        balance_distribution: [],
        trackers: [],
        investments: [],
        notes: '',
      });
      toast({ title: 'Plan created', description: `Monthly plan ready.` });
    }
    setSaving(false);
  };

  // Save the current plan state to DB
  const savePlan = async (updated: Partial<MonthlyPlan>) => {
    if (!plan) return;
    setSaving(true);

    const merged = { ...plan, ...updated };
    setPlan(merged);

    const { error } = await supabase
      .from('monthly_plans')
      .update({
        income: merged.income,
        income_label: merged.income_label,
        allocations: merged.allocations as any,
        balance_distribution: merged.balance_distribution as any,
        trackers: merged.trackers as any,
        investments: merged.investments as any,
        notes: merged.notes,
      })
      .eq('id', plan.id);

    if (error) {
      toast({ title: 'Error', description: 'Failed to save', variant: 'destructive' });
    }
    setSaving(false);
  };

  // Delete plan
  const deletePlan = async () => {
    if (!plan) return;
    const { error } = await supabase
      .from('monthly_plans')
      .delete()
      .eq('id', plan.id);

    if (error) {
      toast({ title: 'Error', description: 'Failed to delete plan', variant: 'destructive' });
    } else {
      setPlan(null);
      toast({ title: 'Deleted', description: 'Monthly plan removed.' });
    }
  };

  // ─── Helper methods ───

  // Allocations
  const addAllocation = (title: string, amount: number) => {
    const allocs = [...(plan?.allocations || []), { id: uid(), title, amount, completed: false }];
    savePlan({ allocations: allocs });
  };

  const toggleAllocation = (id: string) => {
    const allocs = (plan?.allocations || []).map(a =>
      a.id === id ? { ...a, completed: !a.completed } : a
    );
    savePlan({ allocations: allocs });
  };

  const removeAllocation = (id: string) => {
    savePlan({ allocations: (plan?.allocations || []).filter(a => a.id !== id) });
  };

  // Balance distribution
  const addBalanceItem = (account: string, amount: number) => {
    const items = [...(plan?.balance_distribution || []), { id: uid(), account, amount }];
    savePlan({ balance_distribution: items });
  };

  const removeBalanceItem = (id: string) => {
    savePlan({ balance_distribution: (plan?.balance_distribution || []).filter(b => b.id !== id) });
  };

  // Trackers
  const addTracker = (name: string, budget: number) => {
    const trackers = [...(plan?.trackers || []), { id: uid(), name, budget, entries: [] }];
    savePlan({ trackers });
  };

  const removeTracker = (id: string) => {
    savePlan({ trackers: (plan?.trackers || []).filter(t => t.id !== id) });
  };

  const addTrackerEntry = (trackerId: string, date: string, description: string, amount: number) => {
    const trackers = (plan?.trackers || []).map(t => {
      if (t.id !== trackerId) return t;
      return { ...t, entries: [...t.entries, { id: uid(), date, description, amount }] };
    });
    savePlan({ trackers });
  };

  const removeTrackerEntry = (trackerId: string, entryId: string) => {
    const trackers = (plan?.trackers || []).map(t => {
      if (t.id !== trackerId) return t;
      return { ...t, entries: t.entries.filter(e => e.id !== entryId) };
    });
    savePlan({ trackers });
  };

  // Investments
  const addInvestment = (name: string, amount: number, description: string) => {
    const inv = [...(plan?.investments || []), { id: uid(), name, amount, description }];
    savePlan({ investments: inv });
  };

  const removeInvestment = (id: string) => {
    savePlan({ investments: (plan?.investments || []).filter(i => i.id !== id) });
  };

  // Computed values
  const totalAllocations = (plan?.allocations || []).reduce((s, a) => s + a.amount, 0);
  const completedAllocations = (plan?.allocations || []).filter(a => a.completed).reduce((s, a) => s + a.amount, 0);
  const totalBalance = (plan?.income || 0) - totalAllocations;
  const totalBalanceDistributed = (plan?.balance_distribution || []).reduce((s, b) => s + b.amount, 0);
  const totalTrackerBudgets = (plan?.trackers || []).reduce((s, t) => s + t.budget, 0);
  const totalTrackerSpent = (plan?.trackers || []).reduce((s, t) => s + t.entries.reduce((es, e) => es + e.amount, 0), 0);
  const totalInvested = (plan?.investments || []).reduce((s, i) => s + i.amount, 0);

  return {
    plan,
    loading,
    saving,
    createPlan,
    savePlan,
    deletePlan,
    // Allocations
    addAllocation,
    toggleAllocation,
    removeAllocation,
    // Balance
    addBalanceItem,
    removeBalanceItem,
    // Trackers
    addTracker,
    removeTracker,
    addTrackerEntry,
    removeTrackerEntry,
    // Investments
    addInvestment,
    removeInvestment,
    // Computed
    totalAllocations,
    completedAllocations,
    totalBalance,
    totalBalanceDistributed,
    totalTrackerBudgets,
    totalTrackerSpent,
    totalInvested,
  };
}
