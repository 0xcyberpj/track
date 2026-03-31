import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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

// Default budget categories (monthly)
export const DEFAULT_TRACKERS: Omit<Tracker, 'id'>[] = [
  { name: 'Movie', budget: 500, entries: [] },
  { name: 'Spotify', budget: 100, entries: [] },
  { name: 'Travel', budget: 1000, entries: [] },
  { name: 'Petrol', budget: 500, entries: [] },
  { name: 'Eggs', budget: 500, entries: [] },
  { name: 'Chicken', budget: 1000, entries: [] },
  { name: 'Milk', budget: 600, entries: [] },
  { name: 'Weekend Food', budget: 2000, entries: [] },
  { name: 'Weekday Food', budget: 1000, entries: [] },
  { name: 'Misc', budget: 400, entries: [] },
  { name: 'Snacks', budget: 200, entries: [] },
];

const defaultPlan = (month: string): Omit<MonthlyPlan, 'id'> => ({
  month,
  income: 0,
  income_label: 'Salary',
  allocations: [],
  balance_distribution: [],
  trackers: DEFAULT_TRACKERS.map(t => ({ ...t, id: uid() })),
  investments: [],
  notes: '',
});

export function useMonthlyPlan(month: string) {
  const { user } = useAuth();
  const [plan, setPlan] = useState<MonthlyPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestPlanRef = useRef<MonthlyPlan | null>(null);

  // Keep ref in sync
  useEffect(() => {
    latestPlanRef.current = plan;
  }, [plan]);

  // Flush pending save on unmount or month change
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
        // Fire final save synchronously
        const p = latestPlanRef.current;
        if (p) {
          supabase
            .from('monthly_plans')
            .update({
              income: p.income,
              income_label: p.income_label,
              allocations: p.allocations as any,
              balance_distribution: p.balance_distribution as any,
              trackers: p.trackers as any,
              investments: p.investments as any,
              notes: p.notes,
            })
            .eq('id', p.id)
            .then();
        }
      }
    };
  }, [month]);

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
  const createPlan = useCallback(async () => {
    if (!user) return;
    setSaving(true);
    const defaults = defaultPlan(month);

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
        allocations: (data.allocations as Allocation[]) || [],
        balance_distribution: (data.balance_distribution as BalanceItem[]) || [],
        trackers: (data.trackers as Tracker[]) || [],
        investments: (data.investments as Investment[]) || [],
        notes: '',
      });
      toast({ title: 'Plan created', description: `Monthly plan ready.` });
    }
    setSaving(false);
  }, [user, month]);

  // Persist to DB (internal)
  const persistToDB = useCallback(async (merged: MonthlyPlan) => {
    setSaving(true);
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
      .eq('id', merged.id);

    if (error) {
      toast({ title: 'Error', description: 'Failed to save', variant: 'destructive' });
    }
    setSaving(false);
  }, []);

  // Save immediately (for discrete actions like add/remove/toggle)
  const savePlanNow = useCallback((updated: Partial<MonthlyPlan>) => {
    setPlan(prev => {
      if (!prev) return prev;
      const merged = { ...prev, ...updated };
      // Clear any pending debounce
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
      persistToDB(merged);
      return merged;
    });
  }, [persistToDB]);

  // Save with debounce (for text inputs like income, income_label, notes)
  const savePlanDebounced = useCallback((updated: Partial<MonthlyPlan>) => {
    setPlan(prev => {
      if (!prev) return prev;
      const merged = { ...prev, ...updated };
      // Debounce the DB write
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        saveTimerRef.current = null;
        persistToDB(merged);
      }, 600);
      return merged;
    });
  }, [persistToDB]);

  // Delete plan
  const deletePlan = useCallback(async () => {
    if (!plan) return;
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
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
  }, [plan]);

  // ─── Helper methods (all use savePlanNow for instant feedback) ───

  const addAllocation = useCallback((title: string, amount: number) => {
    setPlan(prev => {
      if (!prev) return prev;
      const merged = { ...prev, allocations: [...prev.allocations, { id: uid(), title, amount, completed: false }] };
      persistToDB(merged);
      return merged;
    });
  }, [persistToDB]);

  const toggleAllocation = useCallback((id: string) => {
    setPlan(prev => {
      if (!prev) return prev;
      const merged = { ...prev, allocations: prev.allocations.map(a => a.id === id ? { ...a, completed: !a.completed } : a) };
      persistToDB(merged);
      return merged;
    });
  }, [persistToDB]);

  const removeAllocation = useCallback((id: string) => {
    setPlan(prev => {
      if (!prev) return prev;
      const merged = { ...prev, allocations: prev.allocations.filter(a => a.id !== id) };
      persistToDB(merged);
      return merged;
    });
  }, [persistToDB]);

  const addBalanceItem = useCallback((account: string, amount: number) => {
    setPlan(prev => {
      if (!prev) return prev;
      const merged = { ...prev, balance_distribution: [...prev.balance_distribution, { id: uid(), account, amount }] };
      persistToDB(merged);
      return merged;
    });
  }, [persistToDB]);

  const removeBalanceItem = useCallback((id: string) => {
    setPlan(prev => {
      if (!prev) return prev;
      const merged = { ...prev, balance_distribution: prev.balance_distribution.filter(b => b.id !== id) };
      persistToDB(merged);
      return merged;
    });
  }, [persistToDB]);

  const addTracker = useCallback((name: string, budget: number) => {
    setPlan(prev => {
      if (!prev) return prev;
      const merged = { ...prev, trackers: [...prev.trackers, { id: uid(), name, budget, entries: [] }] };
      persistToDB(merged);
      return merged;
    });
  }, [persistToDB]);

  const removeTracker = useCallback((id: string) => {
    setPlan(prev => {
      if (!prev) return prev;
      const merged = { ...prev, trackers: prev.trackers.filter(t => t.id !== id) };
      persistToDB(merged);
      return merged;
    });
  }, [persistToDB]);

  const addTrackerEntry = useCallback((trackerId: string, date: string, description: string, amount: number) => {
    setPlan(prev => {
      if (!prev) return prev;
      const merged = {
        ...prev,
        trackers: prev.trackers.map(t =>
          t.id !== trackerId ? t : { ...t, entries: [...t.entries, { id: uid(), date, description, amount }] }
        ),
      };
      persistToDB(merged);
      return merged;
    });
  }, [persistToDB]);

  const removeTrackerEntry = useCallback((trackerId: string, entryId: string) => {
    setPlan(prev => {
      if (!prev) return prev;
      const merged = {
        ...prev,
        trackers: prev.trackers.map(t =>
          t.id !== trackerId ? t : { ...t, entries: t.entries.filter(e => e.id !== entryId) }
        ),
      };
      persistToDB(merged);
      return merged;
    });
  }, [persistToDB]);

  const addInvestment = useCallback((name: string, amount: number, description: string) => {
    setPlan(prev => {
      if (!prev) return prev;
      const merged = { ...prev, investments: [...prev.investments, { id: uid(), name, amount, description }] };
      persistToDB(merged);
      return merged;
    });
  }, [persistToDB]);

  const removeInvestment = useCallback((id: string) => {
    setPlan(prev => {
      if (!prev) return prev;
      const merged = { ...prev, investments: prev.investments.filter(i => i.id !== id) };
      persistToDB(merged);
      return merged;
    });
  }, [persistToDB]);

  // Computed values (memoized)
  const totalAllocations = useMemo(() => (plan?.allocations || []).reduce((s, a) => s + a.amount, 0), [plan?.allocations]);
  const completedAllocations = useMemo(() => (plan?.allocations || []).filter(a => a.completed).reduce((s, a) => s + a.amount, 0), [plan?.allocations]);
  const totalBalance = useMemo(() => (plan?.income || 0) - totalAllocations, [plan?.income, totalAllocations]);
  const totalBalanceDistributed = useMemo(() => (plan?.balance_distribution || []).reduce((s, b) => s + b.amount, 0), [plan?.balance_distribution]);
  const totalTrackerBudgets = useMemo(() => (plan?.trackers || []).reduce((s, t) => s + t.budget, 0), [plan?.trackers]);
  const totalTrackerSpent = useMemo(() => (plan?.trackers || []).reduce((s, t) => s + t.entries.reduce((es, e) => es + e.amount, 0), 0), [plan?.trackers]);
  const totalInvested = useMemo(() => (plan?.investments || []).reduce((s, i) => s + i.amount, 0), [plan?.investments]);

  return {
    plan,
    loading,
    saving,
    createPlan,
    savePlan: savePlanNow,
    savePlanDebounced,
    deletePlan,
    addAllocation,
    toggleAllocation,
    removeAllocation,
    addBalanceItem,
    removeBalanceItem,
    addTracker,
    removeTracker,
    addTrackerEntry,
    removeTrackerEntry,
    addInvestment,
    removeInvestment,
    totalAllocations,
    completedAllocations,
    totalBalance,
    totalBalanceDistributed,
    totalTrackerBudgets,
    totalTrackerSpent,
    totalInvested,
  };
}
