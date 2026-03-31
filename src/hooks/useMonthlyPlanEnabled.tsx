import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'monthly_plan_enabled';

export function useMonthlyPlanEnabled() {
  const [enabled, setEnabledState] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === null ? true : stored === 'true';
  });

  const setEnabled = useCallback((value: boolean) => {
    setEnabledState(value);
    localStorage.setItem(STORAGE_KEY, String(value));
    // Notify other components
    window.dispatchEvent(new CustomEvent('monthly-plan-toggle', { detail: value }));
  }, []);

  // Listen for changes from other tabs/components
  useEffect(() => {
    const handler = (e: Event) => {
      setEnabledState((e as CustomEvent).detail);
    };
    window.addEventListener('monthly-plan-toggle', handler);
    return () => window.removeEventListener('monthly-plan-toggle', handler);
  }, []);

  return { enabled, setEnabled };
}
