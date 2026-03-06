import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFinanceData } from "@/hooks/useFinanceData";
import { Chart } from "@/components/ui/chart";
import { Header } from "@/components/Header";
import FloatingAddExpenseButton from '../components/FloatingAddExpenseButton';
import type { Expense } from '@/hooks/useFinanceData';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, subDays, differenceInDays, isSameDay } from 'date-fns';
import { Calendar as CalendarIcon, TrendingUp, TrendingDown, Flame, Zap, AlertTriangle, ArrowUpRight, ArrowDownRight } from 'lucide-react';

const formatINR = (n: number) => n.toLocaleString('en-IN', { minimumFractionDigits: 2 });

const Insights = () => {
  const { expenses, categories, loading, budgets, accountTransactions, accounts } = useFinanceData();
  const [quickModalOpen, setQuickModalOpen] = useState(false);
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({ from: monthStart, to: monthEnd });
  const [popoverOpen, setPopoverOpen] = useState(false);

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

  // Category data
  const categoryData = categories.map(category => {
    const total = filteredExpenses.filter(e => e.category_id === category.id).reduce((sum, e) => sum + e.amount, 0);
    return { label: category.name, value: total, color: category.color || '#888', icon: category.icon };
  }).filter(d => d.value > 0);

  // By month
  const expensesByMonth = filteredExpenses.reduce((acc, expense) => {
    const month = new Date(expense.date).toLocaleString('default', { month: 'short', year: '2-digit' });
    acc[month] = (acc[month] || 0) + expense.amount;
    return acc;
  }, {} as Record<string, number>);
  const monthLabels = Object.keys(expensesByMonth);
  const monthValues = Object.values(expensesByMonth);

  const topCategories = [...categoryData].sort((a, b) => b.value - a.value).slice(0, 5);
  const totalFiltered = filteredExpenses.reduce((s, e) => s + e.amount, 0);

  // At a Glance
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();
  const expensesThisMonth = filteredExpenses.filter(e => { const d = new Date(e.date); return d.getMonth() === thisMonth && d.getFullYear() === thisYear; });
  const totalSpentThisMonth = expensesThisMonth.reduce((sum, e) => sum + e.amount, 0);
  const highestExpense = filteredExpenses.length > 0 ? filteredExpenses.reduce((max, e) => e.amount > max.amount ? e : max, filteredExpenses[0]) : null;
  const daysInMonth = new Date(thisYear, thisMonth + 1, 0).getDate();
  const avgDailySpend = daysInMonth ? totalSpentThisMonth / daysInMonth : 0;

  // Most used account
  const accountCounts = filteredExpenses.reduce((acc, e) => { acc[e.account_id] = (acc[e.account_id] || 0) + 1; return acc; }, {} as Record<string, number>);
  const mostUsedAccountId = Object.keys(accountCounts).reduce((a, b) => accountCounts[a] > accountCounts[b] ? a : b, '');
  const mostUsedAccount = accounts?.find(a => a.id === mostUsedAccountId);

  // Trend vs last month
  const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
  const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;
  const expensesLastMonth = expenses.filter(e => { const d = new Date(e.date); return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear; });
  const totalSpentLastMonth = expensesLastMonth.reduce((sum, e) => sum + e.amount, 0);
  const trendDiff = totalSpentThisMonth - totalSpentLastMonth;
  const trendPct = totalSpentLastMonth > 0 ? (trendDiff / totalSpentLastMonth) * 100 : 0;
  const trendUp = trendDiff > 0;

  // Net savings
  const incomeThisMonth = filteredTransactions.filter(t => t.type === 'income' && new Date(t.created_at).getMonth() === thisMonth && new Date(t.created_at).getFullYear() === thisYear).reduce((sum, t) => sum + t.amount, 0);
  const netSavings = incomeThisMonth - totalSpentThisMonth;

  // Budgets
  const activeBudgets = budgets.filter(b => new Date(b.start_date) <= now && new Date(b.end_date) >= now);
  const budgetProgress = activeBudgets.map(budget => {
    const spent = filteredExpenses.filter(e => e.category_id === budget.category_id && new Date(e.date) >= new Date(budget.start_date) && new Date(e.date) <= new Date(budget.end_date)).reduce((sum, e) => sum + e.amount, 0);
    const percent = budget.amount > 0 ? spent / budget.amount : 0;
    return { ...budget, spent, percent };
  });

  // Recurring
  const recurringMap: Record<string, Expense[]> = {};
  filteredExpenses.forEach(e => { if (!recurringMap[e.title]) recurringMap[e.title] = []; recurringMap[e.title].push(e); });
  const recurringExpenses = Object.entries(recurringMap)
    .filter(([_, arr]) => arr.length > 2)
    .map(([title, arr]) => ({ title, count: arr.length, total: arr.reduce((s, e) => s + e.amount, 0), avg: arr.reduce((s, e) => s + e.amount, 0) / arr.length }))
    .sort((a, b) => b.count - a.count).slice(0, 5);

  // Big expenses
  const bigExpenses = [...filteredExpenses].sort((a, b) => b.amount - a.amount).slice(0, 5);

  // ===== NEW FEATURES =====

  // 1. Daily Spending Heatmap (last 30 days)
  const last30Days = useMemo(() => {
    const days = eachDayOfInterval({ start: subDays(now, 29), end: now });
    return days.map(day => {
      const dayTotal = expenses.filter(e => isSameDay(new Date(e.date), day)).reduce((s, e) => s + e.amount, 0);
      return { date: day, total: dayTotal };
    });
  }, [expenses]);
  const maxDaySpend = Math.max(...last30Days.map(d => d.total), 1);

  // 2. Spending Streak (consecutive days with expenses)
  const spendingStreak = useMemo(() => {
    let streak = 0;
    let d = new Date(now);
    while (true) {
      const hasExpense = expenses.some(e => isSameDay(new Date(e.date), d));
      if (hasExpense) { streak++; d = subDays(d, 1); }
      else break;
    }
    return streak;
  }, [expenses]);

  // 3. No-spend days this month
  const noSpendDays = useMemo(() => {
    const daysInCurrentMonth = eachDayOfInterval({ start: monthStart, end: now > monthEnd ? monthEnd : now });
    return daysInCurrentMonth.filter(day => !expenses.some(e => isSameDay(new Date(e.date), day))).length;
  }, [expenses]);

  // 4. Weekly breakdown (current month, by week)
  const weeklyBreakdown = useMemo(() => {
    const weeks: { label: string; total: number }[] = [];
    let weekStart = monthStart;
    let weekNum = 1;
    while (weekStart <= monthEnd) {
      const wEnd = new Date(Math.min(endOfWeek(weekStart, { weekStartsOn: 1 }).getTime(), monthEnd.getTime()));
      const total = filteredExpenses.filter(e => { const d = new Date(e.date); return d >= weekStart && d <= wEnd; }).reduce((s, e) => s + e.amount, 0);
      weeks.push({ label: `W${weekNum}`, total });
      weekStart = new Date(wEnd.getTime() + 86400000);
      weekNum++;
    }
    return weeks;
  }, [filteredExpenses]);
  const maxWeekSpend = Math.max(...weeklyBreakdown.map(w => w.total), 1);

  // 5. Spending by Day of Week
  const dayOfWeekData = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const totals = [0, 0, 0, 0, 0, 0, 0];
    const counts = [0, 0, 0, 0, 0, 0, 0];
    filteredExpenses.forEach(e => {
      const dow = new Date(e.date).getDay();
      totals[dow] += e.amount;
      counts[dow]++;
    });
    return days.map((label, i) => ({ label, total: totals[i], count: counts[i], avg: counts[i] > 0 ? totals[i] / counts[i] : 0 }));
  }, [filteredExpenses]);
  const peakDay = dayOfWeekData.reduce((a, b) => a.total > b.total ? a : b, dayOfWeekData[0]);

  // 6. Top expense of the month
  const topExpense = bigExpenses[0] || null;
  const topExpenseCategory = topExpense ? categories.find(c => c.id === topExpense.category_id) : null;

  return (
    <>
      <Header />
      <FloatingAddExpenseButton />
      <div className="container mx-auto px-3 py-4 max-w-7xl pb-24 sm:pb-8">
        {/* Title + Date Picker */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Insights</h1>
          <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
            <PopoverTrigger asChild>
              <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl glass text-foreground hover:bg-muted/30 transition" aria-label="Select date range">
                <CalendarIcon className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">
                  {dateRange.from && dateRange.to ? `${format(dateRange.from, 'MMM d')} - ${format(dateRange.to, 'MMM d, yyyy')}` : 'Select range'}
                </span>
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-auto p-0">
              <Calendar mode="range" selected={dateRange} onSelect={(range) => { if (range?.from && range?.to) setDateRange({ from: range.from, to: range.to }); }} numberOfMonths={2} initialFocus />
            </PopoverContent>
          </Popover>
        </div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <Card className="glass border-0 rounded-2xl">
            <CardContent className="py-4 px-4">
              <div className="text-xs text-muted-foreground mb-1">Total Spent</div>
              <div className="text-xl font-bold text-primary tabular-nums">₹{formatINR(totalSpentThisMonth)}</div>
            </CardContent>
          </Card>
          <Card className="glass border-0 rounded-2xl">
            <CardContent className="py-4 px-4">
              <div className="text-xs text-muted-foreground mb-1">Biggest Expense</div>
              <div className="text-xl font-bold text-destructive tabular-nums">{highestExpense ? `₹${formatINR(highestExpense.amount)}` : '--'}</div>
              <div className="text-xs text-muted-foreground truncate">{highestExpense?.title || ''}</div>
            </CardContent>
          </Card>
          <Card className="glass border-0 rounded-2xl">
            <CardContent className="py-4 px-4">
              <div className="text-xs text-muted-foreground mb-1">Daily Average</div>
              <div className="text-xl font-bold text-foreground tabular-nums">₹{formatINR(avgDailySpend)}</div>
            </CardContent>
          </Card>
          <Card className="glass border-0 rounded-2xl">
            <CardContent className="py-4 px-4">
              <div className="text-xs text-muted-foreground mb-1">Transactions</div>
              <div className="text-xl font-bold text-foreground">{filteredExpenses.length}</div>
              <div className="text-xs text-muted-foreground">{mostUsedAccount?.account_name || '--'}</div>
            </CardContent>
          </Card>
        </div>

        {/* Streak + No-Spend + Trend Row */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Card className="glass border-0 rounded-2xl">
            <CardContent className="py-4 px-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'hsl(152 72% 40% / 0.12)' }}>
                <Flame className="h-5 w-5 text-orange-400" />
              </div>
              <div>
                <div className="text-lg font-bold text-foreground">{spendingStreak}</div>
                <div className="text-xs text-muted-foreground">Day streak</div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass border-0 rounded-2xl">
            <CardContent className="py-4 px-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'hsl(152 72% 40% / 0.12)' }}>
                <Zap className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <div className="text-lg font-bold text-foreground">{noSpendDays}</div>
                <div className="text-xs text-muted-foreground">No-spend days</div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass border-0 rounded-2xl">
            <CardContent className="py-4 px-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: trendUp ? 'hsl(0 72% 50% / 0.12)' : 'hsl(152 72% 40% / 0.12)' }}>
                {trendUp ? <ArrowUpRight className="h-5 w-5 text-red-400" /> : <ArrowDownRight className="h-5 w-5 text-emerald-400" />}
              </div>
              <div>
                <div className={`text-lg font-bold ${trendUp ? 'text-red-400' : 'text-emerald-400'}`}>{Math.abs(trendPct).toFixed(0)}%</div>
                <div className="text-xs text-muted-foreground">{trendUp ? 'More' : 'Less'} vs last mo</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Spending Trend */}
          <Card className="glass border-0 rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                {trendUp ? <TrendingUp className="h-4 w-4 text-red-400" /> : <TrendingDown className="h-4 w-4 text-emerald-400" />}
                Monthly Comparison
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-3 mb-3">
                <div>
                  <div className="text-xs text-muted-foreground">This Month</div>
                  <div className="text-2xl font-bold text-foreground tabular-nums">₹{formatINR(totalSpentThisMonth)}</div>
                </div>
                <div className="text-muted-foreground/40 text-lg">vs</div>
                <div>
                  <div className="text-xs text-muted-foreground">Last Month</div>
                  <div className="text-2xl font-bold text-muted-foreground tabular-nums">₹{formatINR(totalSpentLastMonth)}</div>
                </div>
              </div>
              <div className="space-y-2">
                <div>
                  <div className="flex justify-between text-xs text-muted-foreground mb-1"><span>This month</span><span>₹{formatINR(totalSpentThisMonth)}</span></div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden"><div className="h-2 rounded-full bg-primary transition-all" style={{ width: `${Math.min((totalSpentThisMonth / Math.max(totalSpentThisMonth, totalSpentLastMonth)) * 100, 100)}%` }} /></div>
                </div>
                <div>
                  <div className="flex justify-between text-xs text-muted-foreground mb-1"><span>Last month</span><span>₹{formatINR(totalSpentLastMonth)}</span></div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden"><div className="h-2 rounded-full bg-muted-foreground/40 transition-all" style={{ width: `${Math.min((totalSpentLastMonth / Math.max(totalSpentThisMonth, totalSpentLastMonth)) * 100, 100)}%` }} /></div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Net Savings */}
          <Card className="glass border-0 rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Net Savings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold mb-2 tabular-nums ${netSavings >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {netSavings >= 0 ? '+' : '-'}₹{formatINR(Math.abs(netSavings))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-secondary/40 p-3">
                  <div className="text-xs text-muted-foreground">Income</div>
                  <div className="text-base font-semibold text-emerald-400 tabular-nums">₹{formatINR(incomeThisMonth)}</div>
                </div>
                <div className="rounded-xl bg-secondary/40 p-3">
                  <div className="text-xs text-muted-foreground">Expenses</div>
                  <div className="text-base font-semibold text-red-400 tabular-nums">₹{formatINR(totalSpentThisMonth)}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Daily Heatmap + Weekly Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Daily Heatmap */}
          <Card className="glass border-0 rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Daily Spending (30 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-10 gap-1">
                {last30Days.map((day, i) => {
                  const intensity = day.total / maxDaySpend;
                  const opacity = day.total > 0 ? Math.max(0.15, intensity) : 0.04;
                  return (
                    <div key={i} className="relative group">
                      <div
                        className="aspect-square rounded-md transition-all hover:scale-110 cursor-default"
                        style={{ backgroundColor: day.total > 0 ? `hsl(152 72% 40% / ${opacity})` : 'hsl(0 0% 100% / 0.03)' }}
                      />
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 rounded-lg text-[10px] bg-card border border-border shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                        <div className="font-medium">{format(day.date, 'MMM d')}</div>
                        <div className="text-primary tabular-nums">₹{formatINR(day.total)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                <span>Less</span>
                <div className="flex gap-1">
                  {[0.04, 0.15, 0.35, 0.6, 0.9].map((o, i) => (
                    <div key={i} className="w-3 h-3 rounded-sm" style={{ backgroundColor: `hsl(152 72% 40% / ${o})` }} />
                  ))}
                </div>
                <span>More</span>
              </div>
            </CardContent>
          </Card>

          {/* Weekly Breakdown */}
          <Card className="glass border-0 rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Weekly Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {weeklyBreakdown.map((week, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground font-medium">{week.label}</span>
                      <span className="text-foreground font-semibold tabular-nums">₹{formatINR(week.total)}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-2 rounded-full bg-primary/70 transition-all" style={{ width: `${(week.total / maxWeekSpend) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Spending by Day of Week */}
        <Card className="glass border-0 rounded-2xl mb-6">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Spending by Day of Week</CardTitle>
              {peakDay && <span className="text-xs text-muted-foreground">Peak: <span className="text-primary font-medium">{peakDay.label}</span></span>}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-2">
              {dayOfWeekData.map((d, i) => {
                const maxTotal = Math.max(...dayOfWeekData.map(x => x.total), 1);
                const barH = (d.total / maxTotal) * 100;
                const isPeak = d === peakDay;
                return (
                  <div key={i} className="flex flex-col items-center">
                    <div className="w-full h-20 flex items-end justify-center mb-1.5">
                      <div
                        className={`w-full max-w-[28px] rounded-t-lg transition-all ${isPeak ? 'bg-primary' : 'bg-primary/30'}`}
                        style={{ height: `${Math.max(barH, 4)}%` }}
                      />
                    </div>
                    <span className={`text-xs font-medium ${isPeak ? 'text-primary' : 'text-muted-foreground'}`}>{d.label}</span>
                    <span className="text-[10px] text-muted-foreground tabular-nums mt-0.5">₹{d.total > 1000 ? `${(d.total/1000).toFixed(1)}k` : Math.round(d.total)}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Budgets */}
        {budgetProgress.length > 0 && (
          <Card className="glass border-0 rounded-2xl mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-400" /> Budget Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {budgetProgress.map(b => {
                  const color = b.percent >= 1 ? '#ef4444' : b.percent >= 0.7 ? '#f59e0b' : (b.category?.color || '#22c55e');
                  return (
                    <div key={b.id}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                          <span className="text-sm font-medium text-foreground">{b.category?.name || b.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold tabular-nums" style={{ color }}>{Math.round(b.percent * 100)}%</span>
                          {b.percent >= 1 && <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-red-500/20 text-red-400">Over</span>}
                        </div>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-2 rounded-full transition-all" style={{ width: `${Math.min(b.percent * 100, 100)}%`, backgroundColor: color }} />
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground mt-1 tabular-nums">
                        <span>₹{formatINR(b.spent)} spent</span>
                        <span>₹{formatINR(b.amount)} budget</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recurring + Big Expenses */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Recurring */}
          <Card className="glass border-0 rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Recurring Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              {recurringExpenses.length === 0 ? (
                <div className="text-sm text-muted-foreground py-6 text-center">No recurring expenses found</div>
              ) : (
                <div className="space-y-3">
                  {recurringExpenses.map(r => (
                    <div key={r.title} className="flex items-center justify-between">
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-foreground truncate">{r.title}</div>
                        <div className="text-xs text-muted-foreground">{r.count} times &middot; Avg ₹{formatINR(r.avg)}</div>
                      </div>
                      <div className="text-sm font-semibold text-foreground tabular-nums ml-3">₹{formatINR(r.total)}</div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Expenses */}
          <Card className="glass border-0 rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Top Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              {bigExpenses.length === 0 ? (
                <div className="text-sm text-muted-foreground py-6 text-center">No expenses found</div>
              ) : (
                <div className="space-y-3">
                  {bigExpenses.map((e, i) => {
                    const cat = categories.find(c => c.id === e.category_id);
                    return (
                      <div key={e.id} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm" style={{ backgroundColor: `${cat?.color || '#888'}18` }}>
                          {cat?.icon || '💰'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-foreground truncate">{e.title}</div>
                          <div className="text-xs text-muted-foreground">{format(new Date(e.date), 'MMM d')} &middot; {cat?.name}</div>
                        </div>
                        <div className="text-sm font-bold text-destructive tabular-nums">-₹{formatINR(e.amount)}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Card className="glass border-0 rounded-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">By Category</CardTitle>
              </CardHeader>
              <CardContent>
                {categoryData.length === 0 ? (
                  <div className="text-sm text-muted-foreground py-6 text-center">No data</div>
                ) : (
                  <Chart type="pie" data={categoryData.map(d => ({ label: d.label, value: d.value, color: d.color }))} />
                )}
              </CardContent>
            </Card>
            <Card className="glass border-0 rounded-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Monthly Trend</CardTitle>
              </CardHeader>
              <CardContent>
                {monthLabels.length === 0 ? (
                  <div className="text-sm text-muted-foreground py-6 text-center">No data</div>
                ) : (
                  <Chart type="bar" data={monthLabels.map((label, i) => ({ label, value: monthValues[i] }))} />
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Top Categories */}
        {topCategories.length > 0 && (
          <Card className="glass border-0 rounded-2xl mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Category Ranking</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topCategories.map((cat, i) => {
                  const pct = totalFiltered > 0 ? (cat.value / totalFiltered) * 100 : 0;
                  return (
                    <div key={cat.label}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{cat.icon || '💰'}</span>
                          <span className="text-sm font-medium text-foreground">{cat.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-foreground tabular-nums">₹{formatINR(cat.value)}</span>
                          <span className="text-xs text-muted-foreground tabular-nums">{pct.toFixed(1)}%</span>
                        </div>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: cat.color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
};

export default Insights;
