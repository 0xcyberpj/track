import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFinanceData } from "@/hooks/useFinanceData";
import { Chart } from "@/components/ui/chart";
import { Header } from "@/components/Header";
import FloatingAddExpenseButton from '../components/FloatingAddExpenseButton';
import type { Expense } from '@/hooks/useFinanceData';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';

const Insights = () => {
  const { expenses, categories, loading, budgets, accountTransactions } = useFinanceData();
  const [quickModalOpen, setQuickModalOpen] = useState(false);
  // --- Date Range State ---
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({ from: startOfMonth, to: endOfMonth });
  const [popoverOpen, setPopoverOpen] = useState(false);

  // --- Filtered Expenses/Transactions by Range ---
  const filteredExpenses = expenses.filter(e => {
    const d = new Date(e.date);
    return dateRange.from && dateRange.to && d >= dateRange.from && d <= dateRange.to;
  });
  const filteredTransactions = accountTransactions.filter(t => {
    const d = new Date(t.created_at);
    return dateRange.from && dateRange.to && d >= dateRange.from && d <= dateRange.to;
  });

  useEffect(() => {
    const handler = () => setQuickModalOpen(true);
    window.addEventListener('open-quick-modal', handler);
    return () => window.removeEventListener('open-quick-modal', handler);
  }, []);

  // Expenses by category
  const categoryData = categories.map(category => {
    const total = filteredExpenses.filter(e => e.category_id === category.id).reduce((sum, e) => sum + e.amount, 0);
    return {
      label: category.name,
      value: total,
      color: category.color || '#888',
    };
  }).filter(d => d.value > 0);

  // Expenses over time (by month)
  const expensesByMonth = filteredExpenses.reduce((acc, expense) => {
    const month = new Date(expense.date).toLocaleString('default', { month: 'short', year: '2-digit' });
    acc[month] = (acc[month] || 0) + expense.amount;
    return acc;
  }, {} as Record<string, number>);
  const monthLabels = Object.keys(expensesByMonth);
  const monthValues = Object.values(expensesByMonth);

  // Top categories
  const topCategories = [...categoryData].sort((a, b) => b.value - a.value).slice(0, 5);

  // --- At a Glance Metrics ---
  // Total spent this month
  const nowDate = new Date();
  const thisMonth = nowDate.getMonth();
  const thisYear = nowDate.getFullYear();
  const expensesThisMonth = filteredExpenses.filter(e => {
    const d = new Date(e.date);
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
  });
  const totalSpentThisMonth = expensesThisMonth.reduce((sum, e) => sum + e.amount, 0);
  // Highest single expense
  const highestExpense = filteredExpenses.length > 0 ? filteredExpenses.reduce((max, e) => e.amount > max.amount ? e : max, filteredExpenses[0]) : null;
  // Most used account
  const accountCounts = filteredExpenses.reduce((acc, e) => {
    acc[e.account_id] = (acc[e.account_id] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const mostUsedAccountId = Object.keys(accountCounts).reduce((a, b) => accountCounts[a] > accountCounts[b] ? a : b, '');
  const mostUsedAccount = mostUsedAccountId && filteredExpenses.find(e => e.account_id === mostUsedAccountId);
  // Average daily spend (this month)
  const daysThisMonth = new Date(thisYear, thisMonth + 1, 0).getDate();
  const avgDailySpend = daysThisMonth ? totalSpentThisMonth / daysThisMonth : 0;

  // --- Trends: Spending vs Last Month ---
  const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
  const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;
  const expensesLastMonth = filteredExpenses.filter(e => {
    const d = new Date(e.date);
    return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear;
  });
  const totalSpentLastMonth = expensesLastMonth.reduce((sum, e) => sum + e.amount, 0);
  const trendDiff = totalSpentThisMonth - totalSpentLastMonth;
  const trendPct = totalSpentLastMonth > 0 ? (trendDiff / totalSpentLastMonth) * 100 : 0;
  const trendUp = trendDiff > 0;

  // --- Budgets: Progress and Alerts ---
  const activeBudgets = budgets.filter(b => {
    const nowDate = new Date();
    return new Date(b.start_date) <= nowDate && new Date(b.end_date) >= nowDate;
  });
  const budgetProgress = activeBudgets.map(budget => {
    const spent = filteredExpenses.filter(e => e.category_id === budget.category_id && new Date(e.date) >= new Date(budget.start_date) && new Date(e.date) <= new Date(budget.end_date)).reduce((sum, e) => sum + e.amount, 0);
    const percent = budget.amount > 0 ? spent / budget.amount : 0;
    return { ...budget, spent, percent };
  });

  // --- Net Savings: Income vs Expenses (This Month) ---
  const incomeThisMonth = filteredTransactions.filter(t => t.type === 'income' && new Date(t.created_at).getMonth() === thisMonth && new Date(t.created_at).getFullYear() === thisYear).reduce((sum, t) => sum + t.amount, 0);
  const netSavings = incomeThisMonth - totalSpentThisMonth;

  // --- Recurring Expenses: Top Recurring by Title ---
  const recurringMap: Record<string, Expense[]> = {};
  filteredExpenses.forEach(e => {
    if (!recurringMap[e.title]) recurringMap[e.title] = [];
    recurringMap[e.title].push(e);
  });
  const recurringExpenses = Object.entries(recurringMap)
    .filter(([_, arr]) => (arr as Expense[]).length > 2)
    .map(([title, arr]) => {
      const arrTyped = arr as Expense[];
      return {
        title,
        count: arrTyped.length,
        total: arrTyped.reduce((sum, e) => sum + e.amount, 0),
        avg: arrTyped.reduce((sum, e) => sum + e.amount, 0) / arrTyped.length
      };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // --- Spending by Account ---
  const accounts = Array.from(new Set(filteredExpenses.map(e => e.account_id)));
  const accountData = accounts.map(accountId => {
    const total = filteredExpenses.filter(e => e.account_id === accountId).reduce((sum, e) => sum + e.amount, 0);
    const name = filteredExpenses.find(e => e.account_id === accountId)?.account?.account_name || 'Account';
    return { label: name, value: total };
  }).filter(d => d.value > 0);

  // --- Recent Big Expenses ---
  const bigExpenses = [...filteredExpenses].sort((a, b) => b.amount - a.amount).slice(0, 5);

  return (
    <>
      <Header />
      <FloatingAddExpenseButton />
      <div className="container mx-auto px-3 py-4 max-w-7xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold">Insights & Analytics</h1>
          {/* Date Range Picker */}
          <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
            <PopoverTrigger asChild>
              <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-black/40 border border-white/10 shadow text-white hover:bg-black/60 transition" aria-label="Select date range">
                <CalendarIcon className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">
                  {dateRange.from && dateRange.to
                    ? `${format(dateRange.from, 'MMM d, yyyy')} - ${format(dateRange.to, 'MMM d, yyyy')}`
                    : 'Select range'}
                </span>
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-auto p-0 bg-black/80 border border-white/10">
              <Calendar
                mode="range"
                selected={dateRange}
                onSelect={(range) => {
                  if (range?.from && range?.to) {
                    setDateRange({ from: range.from, to: range.to });
                  }
                }}
                numberOfMonths={2}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        {/* At a Glance Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="py-4 flex flex-col items-center">
              <div className="text-xs text-muted-foreground mb-1">Spent This Month</div>
              <div className="text-xl font-bold text-primary">₹{totalSpentThisMonth.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 flex flex-col items-center">
              <div className="text-xs text-muted-foreground mb-1">Highest Expense</div>
              <div className="text-xl font-bold text-destructive">{highestExpense ? `₹${highestExpense.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '--'}</div>
              <div className="text-xs text-muted-foreground truncate w-full text-center">{highestExpense?.title || ''}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 flex flex-col items-center">
              <div className="text-xs text-muted-foreground mb-1">Most Used Account</div>
              <div className="text-base font-bold text-foreground">{mostUsedAccount?.account?.account_name || '--'}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 flex flex-col items-center">
              <div className="text-xs text-muted-foreground mb-1">Avg Daily Spend</div>
              <div className="text-xl font-bold text-primary">₹{avgDailySpend.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
            </CardContent>
          </Card>
        </div>
        {/* --- New Enhanced Insights Section --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {/* Trends Card */}
          <Card className="bg-black/40 backdrop-blur-lg border border-white/10 shadow-xl rounded-3xl p-6">
            <CardHeader className="flex flex-row items-center gap-2 pb-2">
              <span className="text-blue-400"><svg width="24" height="24" fill="none" viewBox="0 0 24 24"><path d="M12 19V5M5 12l7-7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></span>
              <CardTitle className="text-white text-lg font-semibold">Spending Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <span className={`text-2xl ${trendUp ? 'text-red-400' : 'text-green-400'}`}>{trendUp ? '▲' : '▼'}</span>
                <span className="text-2xl font-bold text-white">{Math.abs(trendPct).toFixed(1)}%</span>
                <span className="text-gray-300">{trendUp ? 'more' : 'less'} than last month</span>
              </div>
              <div className="text-xs text-gray-300 mt-1">₹{totalSpentThisMonth.toLocaleString('en-IN', { minimumFractionDigits: 2 })} vs ₹{totalSpentLastMonth.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
            </CardContent>
          </Card>
          {/* Net Savings Card */}
          <Card className="bg-black/40 backdrop-blur-lg border border-white/10 shadow-xl rounded-3xl p-6">
            <CardHeader className="flex flex-row items-center gap-2 pb-2">
              <span className="text-green-400"><svg width="24" height="24" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/><path d="M8 12h8M12 8v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg></span>
              <CardTitle className="text-white text-lg font-semibold">Net Savings (This Month)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${netSavings >= 0 ? 'text-green-400' : 'text-red-400'}`}>₹{netSavings.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
              <div className="text-xs text-gray-300 mt-1">Income: ₹{incomeThisMonth.toLocaleString('en-IN', { minimumFractionDigits: 2 })} | Expenses: ₹{totalSpentThisMonth.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
            </CardContent>
          </Card>
          {/* Budgets Card */}
          <Card className="bg-black/40 backdrop-blur-lg border border-white/10 shadow-xl rounded-3xl p-6 md:col-span-2">
            <CardHeader className="flex flex-row items-center gap-2 pb-2">
              <span className="text-yellow-400"><svg width="24" height="24" fill="none" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/><path d="M3 9h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg></span>
              <CardTitle className="text-white text-lg font-semibold">Budgets</CardTitle>
            </CardHeader>
            <CardContent>
              {budgetProgress.length === 0 ? (
                <div className="text-gray-300">No active budgets.</div>
              ) : (
                <ul className="space-y-3">
                  {budgetProgress.map(b => (
                    <li key={b.id} className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: b.category?.color || '#FFD600' }}></span>
                        <span className="font-medium text-white">{b.category?.name || b.name}</span>
                        <span className="ml-auto text-xs text-gray-300">{Math.round(b.percent * 100)}% used</span>
                        {b.percent >= 1 && <span className="ml-2 px-2 py-0.5 rounded bg-red-700/60 text-red-200 text-xs font-semibold">Over!</span>}
                      </div>
                      <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                        <div className={`h-2 rounded-full transition-all duration-300`} style={{ width: `${Math.min(b.percent * 100, 100)}%`, backgroundColor: b.category?.color || '#FFD600' }} />
                      </div>
                      <div className="flex justify-between text-xs text-gray-300">
                        <span>Budget: ₹{b.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        <span>Spent: ₹{b.spent.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        <span>Left: ₹{(b.amount - b.spent).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
          {/* Recurring Expenses Card */}
          <Card className="bg-black/40 backdrop-blur-lg border border-white/10 shadow-xl rounded-3xl p-6 md:col-span-2">
            <CardHeader className="flex flex-row items-center gap-2 pb-2">
              <span className="text-purple-400"><svg width="24" height="24" fill="none" viewBox="0 0 24 24"><path d="M12 8v4l3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/></svg></span>
              <CardTitle className="text-white text-lg font-semibold">Top Recurring Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              {recurringExpenses.length === 0 ? (
                <div className="text-gray-300">No recurring expenses found.</div>
              ) : (
                <ul className="space-y-2">
                  {recurringExpenses.map(r => (
                    <li key={r.title} className="flex items-center gap-2">
                      <span className="font-medium text-white truncate max-w-[120px]">{r.title}</span>
                      <span className="text-xs text-gray-300">{r.count}x</span>
                      <span className="ml-auto text-xs text-gray-300">Avg: ₹{r.avg.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      <span className="text-xs text-gray-300">Total: ₹{r.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading insights...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Expenses by Category */}
            <Card>
              <CardHeader>
                <CardTitle>Expenses by Category</CardTitle>
              </CardHeader>
              <CardContent>
                {categoryData.length === 0 ? (
                  <div className="text-muted-foreground">No expense data available.</div>
                ) : (
                  <Chart
                    type="pie"
                    data={categoryData.map(d => ({ label: d.label, value: d.value, color: d.color }))}
                  />
                )}
              </CardContent>
            </Card>
            {/* Expenses Over Time */}
            <Card>
              <CardHeader>
                <CardTitle>Expenses Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                {monthLabels.length === 0 ? (
                  <div className="text-muted-foreground">No expense data available.</div>
                ) : (
                  <Chart
                    type="bar"
                    data={monthLabels.map((label, i) => ({ label, value: monthValues[i] }))}
                  />
                )}
              </CardContent>
            </Card>
            {/* Top Categories */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Top Categories</CardTitle>
              </CardHeader>
              <CardContent>
                {topCategories.length === 0 ? (
                  <div className="text-muted-foreground">No expense data available.</div>
                ) : (
                  <ul className="space-y-2">
                    {topCategories.map((cat, i) => (
                      <li key={cat.label} className="flex items-center gap-3">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }}></span>
                        <span className="font-medium">{cat.label}</span>
                        <span className="ml-auto">₹{cat.value.toFixed(2)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </>
  );
};

export default Insights; 