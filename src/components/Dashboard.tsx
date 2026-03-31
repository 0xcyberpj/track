import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, TrendingDown, Download, Calendar, Search, PieChart, Plus, Loader2, ChevronDown, ChevronUp, Clock, Eye, EyeOff, Wallet, Target, ArrowRight, RefreshCw } from "lucide-react";
import { useFinanceData } from "@/hooks/useFinanceData";
import { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { format, isToday, isYesterday, startOfMonth, endOfMonth, subMonths, differenceInDays } from 'date-fns';
import FloatingAddExpenseButton from './FloatingAddExpenseButton';
import { useToast } from "@/components/ui/use-toast";
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar as DatePicker } from '@/components/ui/calendar';
import { Calendar as CalendarIcon } from 'lucide-react';

const formatAmount = (amount: number) => amount.toLocaleString('en-IN', { minimumFractionDigits: 2 });

const exportToCSV = (expenses: any[], categories: any[], accounts: any[], monthLabel: string) => {
  const header = 'Date,Title,Amount,Category,Account,Description';
  const rows = expenses.map(e => {
    const cat = categories.find(c => c.id === e.category_id);
    const acc = accounts.find(a => a.id === e.account_id);
    const escape = (s: string) => `"${(s || '').replace(/"/g, '""')}"`;
    return `${e.date},${escape(e.title)},${e.amount},${escape(cat?.name || '')},${escape(acc?.account_name || '')},${escape(e.description || '')}`;
  });
  const csv = [header, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `expenses-${monthLabel}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

const formatDayHeader = (dayStr: string) => {
  const date = new Date(dayStr);
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  const now = new Date();
  if (date.getFullYear() === now.getFullYear()) return format(date, 'EEE, MMM d');
  return format(date, 'EEE, MMM d, yyyy');
};

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
};

export const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { accounts, expenses, categories, budgets, loading, createBudget, updateBudget, deleteBudget, addExpense, updateExpense, deleteExpense } = useFinanceData();
  const [balanceVisible, setBalanceVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const [budgetModalOpen, setBudgetModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [budgetForm, setBudgetForm] = useState({
    name: '', amount: '', period: 'monthly', start_date: format(startOfMonth(new Date()), 'yyyy-MM-dd'), end_date: format(endOfMonth(new Date()), 'yyyy-MM-dd'), category_id: ''
  });

  const [selectedMonth, setSelectedMonth] = useState(() => format(new Date(), 'yyyy-MM'));

  const [expenseForm, setExpenseForm] = useState({
    title: '', amount: '', date: '', account_id: '', category_id: '', description: ''
  });

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [editingExpense, setEditingExpense] = useState(null);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const openExpenseDetail = (expense) => {
    setSelectedExpense(expense);
    setExpenseForm({
      title: expense.title, amount: expense.amount.toString(), date: expense.date,
      account_id: expense.account_id, category_id: expense.category_id, description: expense.description || ''
    });
    setDetailModalOpen(true);
  };

  const [deleting, setDeleting] = useState(false);

  const handlePeriodChange = (value: string) => {
    setBudgetForm(prev => {
      if (value === 'monthly') {
        const now = new Date();
        return { ...prev, period: value, start_date: format(startOfMonth(now), 'yyyy-MM-dd'), end_date: format(endOfMonth(now), 'yyyy-MM-dd') };
      }
      if (value === 'weekly') {
        const now = new Date();
        const start = new Date(now); start.setDate(now.getDate() - now.getDay());
        const end = new Date(start); end.setDate(start.getDate() + 6);
        return { ...prev, period: value, start_date: format(start, 'yyyy-MM-dd'), end_date: format(end, 'yyyy-MM-dd') };
      }
      return { ...prev, period: value };
    });
  };

  const openCreateBudget = () => {
    setEditingBudget(null);
    const now = new Date();
    setBudgetForm({ name: '', amount: '', period: 'monthly', start_date: format(startOfMonth(now), 'yyyy-MM-dd'), end_date: format(endOfMonth(now), 'yyyy-MM-dd'), category_id: '' });
    setBudgetModalOpen(true);
  };

  const openEditBudget = (budget) => {
    setEditingBudget(budget);
    setBudgetForm({ name: budget.name, amount: budget.amount.toString(), period: budget.period || 'monthly', start_date: budget.start_date, end_date: budget.end_date, category_id: budget.category_id || '' });
    setBudgetModalOpen(true);
  };

  const handleBudgetFormChange = (e) => setBudgetForm({ ...budgetForm, [e.target.name]: e.target.value });
  const handleBudgetSelectChange = (name, value) => setBudgetForm({ ...budgetForm, [name]: value });

  const handleBudgetSubmit = async (e) => {
    e.preventDefault();
    if (!budgetForm.name || !budgetForm.amount || !budgetForm.start_date || !budgetForm.end_date || !budgetForm.category_id) return;
    const data = { name: budgetForm.name, amount: parseFloat(budgetForm.amount), period: budgetForm.period, start_date: budgetForm.start_date, end_date: budgetForm.end_date, category_id: budgetForm.category_id };
    if (editingBudget) await updateBudget(editingBudget.id, data);
    else await createBudget(data);
    setBudgetModalOpen(false);
  };

  const handleExpenseFormChange = (e) => setExpenseForm({ ...expenseForm, [e.target.name]: e.target.value });
  const handleExpenseSelectChange = (name, value) => setExpenseForm({ ...expenseForm, [name]: value });

  // Calculations - all based on selectedMonth for consistency
  const currentDate = new Date();
  const selectedMonthDate_ = new Date(selectedMonth + '-01');
  const selectedMonthStart = startOfMonth(selectedMonthDate_);
  const selectedMonthEnd = endOfMonth(selectedMonthDate_);
  const selectedMonthExpenses = expenses.filter(e => { const d = new Date(e.date); return d >= selectedMonthStart && d <= selectedMonthEnd; });
  const totalExpenses = selectedMonthExpenses.reduce((sum, e) => sum + (typeof e.amount === 'number' ? e.amount : parseFloat(e.amount)), 0);

  const prevMonthStart = startOfMonth(subMonths(selectedMonthDate_, 1));
  const prevMonthEnd = endOfMonth(subMonths(selectedMonthDate_, 1));
  const prevMonthTotal = expenses.filter(e => { const d = new Date(e.date); return d >= prevMonthStart && d <= prevMonthEnd; }).reduce((sum, e) => sum + e.amount, 0);
  const monthTrend = prevMonthTotal > 0 ? ((totalExpenses - prevMonthTotal) / prevMonthTotal) * 100 : 0;
  const isCurrentMonth = selectedMonth === format(currentDate, 'yyyy-MM');

  const dashboardAccounts = accounts.filter(a => a.include_in_dashboard !== false);
  const totalBalance = dashboardAccounts.reduce((sum, a) => sum + (typeof a.balance === 'number' ? a.balance : parseFloat(a.balance)), 0);

  const monthsWithExpenses = Array.from(new Set(expenses.map(e => format(new Date(e.date), 'yyyy-MM')))).sort((a, b) => b.localeCompare(a));

  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.title.toLowerCase().includes(searchTerm.toLowerCase()) || expense.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || expense.category_id === selectedCategory;
    const matchesMonth = format(new Date(expense.date), 'yyyy-MM') === selectedMonth;
    return matchesSearch && matchesCategory && matchesMonth;
  });

  const safeExpenses = Array.isArray(filteredExpenses) ? filteredExpenses : [];

  const grouped = useMemo(() => {
    return safeExpenses.reduce((acc, expense) => {
      if (!expense?.date) return acc;
      const day = format(new Date(expense.date), 'yyyy-MM-dd');
      if (!acc[day]) acc[day] = [];
      acc[day].push(expense);
      return acc;
    }, {});
  }, [safeExpenses]);

  const allDays = Object.keys(grouped).sort((a, b) => b.localeCompare(a));
  const [visibleDayCount, setVisibleDayCount] = useState(5);
  const visibleDays = allDays.slice(0, visibleDayCount);

  const { toast } = useToast();

  useEffect(() => { setBudgetModalOpen(false); setDetailModalOpen(false); setExpenseModalOpen(false); }, [location]);

  const selectedMonthLabel = format(selectedMonthDate_, 'MMMM yyyy');
  const selectedMonthStartDate = format(selectedMonthStart, 'MMM dd');
  const selectedMonthEndDate = format(selectedMonthEnd, 'MMM dd, yyyy');
  const selectedMonthTotal = safeExpenses.reduce((s, e) => s + e.amount, 0);

  // Category breakdown - FIXED: percentages based on selected month total
  const categoryBreakdown = useMemo(() => {
    const monthTotal = safeExpenses.reduce((s, e) => s + e.amount, 0);
    return categories
      .map(cat => {
        const total = safeExpenses.filter(e => e.category_id === cat.id).reduce((s, e) => s + e.amount, 0);
        const pct = monthTotal > 0 ? (total / monthTotal) * 100 : 0;
        return { ...cat, total, pct };
      })
      .filter(c => c.total > 0)
      .sort((a, b) => b.total - a.total);
  }, [safeExpenses, categories]);

  // Budget items with proper monthly reset
  const budgetItems = useMemo(() => {
    return budgets
      .filter(budget => {
        const now = new Date();
        const budgetEnd = new Date(budget.end_date);
        if (budget.period === 'monthly') {
          if (budgetEnd < now) {
            const diff = (now.getFullYear() - budgetEnd.getFullYear()) * 12 + (now.getMonth() - budgetEnd.getMonth());
            return diff <= 3;
          }
          return true;
        }
        return budgetEnd >= now;
      })
      .map(budget => {
        const now = new Date();
        const budgetEnd = new Date(budget.end_date);
        let effectiveStart, effectiveEnd;
        let isAutoRenewed = false;

        if (budget.period === 'monthly') {
          const currentStart = startOfMonth(now);
          const currentEnd = endOfMonth(now);
          if (budgetEnd < now || new Date(budget.start_date) < currentStart) {
            effectiveStart = currentStart;
            effectiveEnd = currentEnd;
            isAutoRenewed = true;
          } else {
            effectiveStart = new Date(budget.start_date);
            effectiveEnd = budgetEnd;
          }
        } else {
          effectiveStart = new Date(budget.start_date);
          effectiveEnd = budgetEnd;
        }

        const spent = expenses.filter(e => e.category_id === budget.category_id && new Date(e.date) >= effectiveStart && new Date(e.date) <= effectiveEnd).reduce((s, e) => s + e.amount, 0);
        const remaining = budget.amount - spent;
        const percent = budget.amount > 0 ? spent / budget.amount : 0;
        const daysLeft = Math.max(0, differenceInDays(effectiveEnd, now));

        return { ...budget, spent, remaining, percent, effectiveStart, effectiveEnd, isAutoRenewed, daysLeft };
      });
  }, [budgets, expenses]);

  const totalDaysInMonth = differenceInDays(selectedMonthEnd, selectedMonthStart) + 1;
  const dayOfMonth = isCurrentMonth ? currentDate.getDate() : totalDaysInMonth;
  const monthProgress = isCurrentMonth ? (dayOfMonth / totalDaysInMonth) * 100 : 100;

  return (
    <>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 pt-safe xl:min-h-[calc(100dvh-4rem)]">
        {/* Main Panel */}
        <div className="xl:col-span-2 space-y-5">
          <FloatingAddExpenseButton />
          <div className="h-2 sm:h-0 w-full" />

          {/* Greeting */}
          <div className="px-4 sm:px-0 sm:mt-2 animate-fade-in">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">{getGreeting()}</h2>
            <p className="text-sm sm:text-base text-muted-foreground mt-0.5">
              {format(currentDate, 'EEEE, MMMM d, yyyy')}
            </p>
          </div>

          {/* Summary Cards - Mobile */}
          <div className="grid grid-cols-2 gap-3 px-4 sm:hidden animate-slide-up">
            <div className="glass rounded-2xl p-4 glow-primary">
              <div className="text-[11px] text-muted-foreground uppercase tracking-widest mb-1">Spent</div>
              <div className="text-2xl font-bold text-primary">₹{formatAmount(totalExpenses)}</div>
              {prevMonthTotal > 0 && (
                <div className={`text-xs flex items-center gap-1 mt-1.5 ${monthTrend > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {monthTrend > 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                  {Math.abs(monthTrend).toFixed(0)}% vs last month
                </div>
              )}
            </div>
            <div className="glass rounded-2xl p-4">
              <div className="text-[11px] text-muted-foreground uppercase tracking-widest mb-1">Balance</div>
              <button onClick={() => setBalanceVisible(!balanceVisible)} className="text-2xl font-bold text-foreground flex items-center gap-1.5">
                {balanceVisible ? <>₹{formatAmount(totalBalance)}</> : <span className="tracking-widest">₹*****</span>}
              </button>
              <div className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                {balanceVisible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                {dashboardAccounts.length} account{dashboardAccounts.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>

          {/* Filters - Mobile */}
          <div className="flex flex-row items-center gap-2 px-4 w-full sm:hidden">
            <div className="flex-1 min-w-0 max-w-[110px]">
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="h-9 px-2.5 text-xs rounded-xl glass border-0">{format(new Date(selectedMonth + '-01'), 'MMM yyyy')}</SelectTrigger>
                <SelectContent>
                  {monthsWithExpenses.map(m => <SelectItem key={m} value={m}>{format(new Date(m + '-01'), 'MMM yyyy')}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-0">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                <Input placeholder="Search..." className="h-9 pl-7 pr-2 text-xs w-full rounded-xl glass border-0" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
              </div>
            </div>
            <div className="flex-shrink-0 w-[44px]">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="h-8 px-2 text-xs rounded-xl glass border-0">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 4a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v2a1 1 0 0 1-.293.707l-7 7V21a1 1 0 0 1-2 0v-7.293l-7-7A1 1 0 0 1 3 6V4z" /></svg>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {categories.map(c => <SelectItem key={c.id} value={c.id}><span>{c.icon || '💰'}</span> {c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Filters - Desktop */}
          <div className="hidden sm:flex flex-row flex-wrap gap-3 items-end mt-2 mb-4 w-full">
            <div className="flex-1 min-w-[140px]">
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="h-9 px-3 text-sm rounded-xl"><SelectValue placeholder="Select month" /></SelectTrigger>
                <SelectContent>
                  {monthsWithExpenses.map(m => <SelectItem key={m} value={m}>{format(new Date(m + '-01'), 'MMMM yyyy')}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[180px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search expenses..." className="h-9 pl-9 pr-3 text-sm rounded-xl" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
              </div>
            </div>
            <div className="flex-1 min-w-[160px]">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="h-9 px-3 text-sm rounded-xl"><SelectValue placeholder="Category" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      <div className="flex items-center space-x-2">
                        <span>{c.icon || '💰'}</span>
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
                        <span className="text-sm">{c.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl" aria-label="Export" onClick={() => exportToCSV(safeExpenses, categories, accounts, selectedMonth)}>
              <Download className="h-4 w-4" />
            </Button>
          </div>

          {/* Expenses List */}
          <div className="animate-slide-up">
            <Card className="glass rounded-2xl border-0 shadow-card overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-semibold text-foreground">Expenses</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {safeExpenses.length} transaction{safeExpenses.length !== 1 ? 's' : ''} &middot; {selectedMonthLabel}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-destructive">-₹{formatAmount(selectedMonthTotal)}</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-16 text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
                    <p className="text-sm">Loading...</p>
                  </div>
                ) : safeExpenses.length === 0 ? (
                  <div className="text-center py-16 text-muted-foreground flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mb-4">
                      <Wallet className="h-7 w-7 opacity-40" />
                    </div>
                    <p className="text-sm font-medium">No expenses found</p>
                    <p className="text-xs mt-1 mb-4">Start tracking your spending</p>
                    <Button size="sm" className="rounded-xl gap-1.5" onClick={() => window.dispatchEvent(new CustomEvent('open-quick-modal'))}>
                      <Plus className="h-3.5 w-3.5" /> Add Expense
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {visibleDays.map((day, dayIdx) => (
                      <div key={day} className="animate-fade-in" style={{ animationDelay: `${dayIdx * 50}ms` }}>
                        <div className="flex items-center justify-between mb-2 px-1">
                          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            {formatDayHeader(day)}
                          </span>
                          <span className="text-xs font-medium text-muted-foreground">
                            -₹{formatAmount(grouped[day].reduce((s, e) => s + e.amount, 0))}
                          </span>
                        </div>
                        <div className="space-y-1.5">
                          {grouped[day].map((expense) => {
                            const category = categories.find(c => c.id === expense.category_id);
                            const account = accounts.find(a => a.id === expense.account_id);
                            return (
                              <div
                                key={expense.id}
                                className="flex items-center justify-between p-3 rounded-xl bg-secondary/40 hover:bg-secondary/60 transition-all cursor-pointer group"
                                onClick={() => openExpenseDetail(expense)}
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-lg" style={{ backgroundColor: `${category?.color || '#888'}18` }}>
                                    {category?.icon || '💰'}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="font-medium text-foreground text-[15px] truncate">{expense.title}</div>
                                    <div className="flex items-center gap-1.5 text-muted-foreground text-xs mt-0.5">
                                      <span className="flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: category?.color || '#888' }} />
                                        {category?.name}
                                      </span>
                                      {category?.icon && <span className="text-sm">{category.icon}</span>}
                                      {account?.account_name && (
                                        <span className="px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-muted/80 text-muted-foreground uppercase tracking-wide">
                                          {account.account_name}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right flex-shrink-0 ml-2">
                                  <div className="font-bold text-destructive text-base tabular-nums">-₹{formatAmount(expense.amount)}</div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                    {allDays.length > visibleDayCount && (
                      <button
                        className="w-full py-2.5 text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1.5 rounded-xl hover:bg-secondary/30"
                        onClick={() => setVisibleDayCount(prev => prev + 5)}
                      >
                        <ChevronDown className="h-3.5 w-3.5" />
                        Show more ({allDays.length - visibleDayCount} days)
                      </button>
                    )}
                    {visibleDayCount > 5 && (
                      <button className="w-full py-2 text-[11px] text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1" onClick={() => setVisibleDayCount(5)}>
                        <ChevronUp className="h-3 w-3" /> Show less
                      </button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Expense Detail/Edit Modal */}
          {detailModalOpen && (
            <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
              <DialogContent className="max-w-md w-full rounded-2xl">
                {selectedExpense && (
                  <>
                    <DialogHeader>
                      <DialogTitle className="text-lg font-bold">Edit Expense</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={async (e) => { e.preventDefault(); setDeleting(true); await updateExpense(selectedExpense.id, { ...expenseForm, amount: parseFloat(expenseForm.amount) }); setDeleting(false); setDetailModalOpen(false); }}>
                      <div className="space-y-3 mt-2">
                        <div className="flex flex-col gap-1">
                          <Label>Title</Label>
                          <Input name="title" value={expenseForm.title} onChange={handleExpenseFormChange} required className="rounded-xl" />
                        </div>
                        <div className="flex flex-col gap-1">
                          <Label>Amount (₹)</Label>
                          <Input name="amount" type="number" min="0" value={expenseForm.amount} onChange={handleExpenseFormChange} required className="rounded-xl" />
                        </div>
                        <div className="flex flex-col gap-1">
                          <Label>Category</Label>
                          <Select value={expenseForm.category_id} onValueChange={val => handleExpenseSelectChange('category_id', val)}>
                            <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select" /></SelectTrigger>
                            <SelectContent>
                              {categories.map(c => (
                                <SelectItem key={c.id} value={c.id}>
                                  <div className="flex items-center gap-2"><span>{c.icon || '💰'}</span><span>{c.name}</span></div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex flex-col gap-1">
                          <Label>Account</Label>
                          <Select value={expenseForm.account_id} onValueChange={val => handleExpenseSelectChange('account_id', val)}>
                            <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select" /></SelectTrigger>
                            <SelectContent>
                              {accounts.map(a => <SelectItem key={a.id} value={a.id}>{a.account_name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex flex-col gap-1">
                          <Label>Date</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <button type="button" className="w-full h-10 px-3 py-2 border rounded-xl bg-background text-left flex items-center gap-2 text-sm">
                                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                                {expenseForm.date ? format(new Date(expenseForm.date), 'MMM d, yyyy') : 'Pick a date'}
                              </button>
                            </PopoverTrigger>
                            <PopoverContent align="start" className="p-0">
                              <DatePicker selected={expenseForm.date ? new Date(expenseForm.date) : undefined} onSelect={date => handleExpenseFormChange({ target: { name: 'date', value: date ? date.toISOString().slice(0, 10) : '' } })} />
                            </PopoverContent>
                          </Popover>
                        </div>
                        <div className="flex flex-col gap-1">
                          <Label>Description</Label>
                          <Input name="description" value={expenseForm.description} onChange={handleExpenseFormChange} className="rounded-xl" />
                        </div>
                      </div>
                      <DialogFooter className="flex flex-row gap-2 justify-end mt-4">
                        <Button type="submit" className="rounded-xl" disabled={deleting}>{deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}</Button>
                        <Button variant="destructive" className="rounded-xl" onClick={async (e) => { e.preventDefault(); if(window.confirm('Delete this expense?')) { setDeleting(true); await deleteExpense(selectedExpense.id); setDeleting(false); setDetailModalOpen(false); } }} disabled={deleting}>
                          {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Delete'}
                        </Button>
                      </DialogFooter>
                    </form>
                  </>
                )}
              </DialogContent>
            </Dialog>
          )}

          {/* Budget Overview */}
          <Card className="glass rounded-2xl border-0 shadow-card animate-slide-up mb-20 sm:mb-0" style={{ animationDelay: '100ms' }}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" />
                  Budgets
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {format(currentDate, 'MMMM yyyy')} &middot; Spent resets monthly
                </p>
              </div>
              <Button size="icon" variant="ghost" onClick={openCreateBudget} className="h-8 w-8 rounded-xl hover:bg-primary/10 text-primary">
                <Plus className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {budgetItems.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground">
                    <div className="w-14 h-14 rounded-full bg-muted/20 flex items-center justify-center mx-auto mb-3">
                      <Target className="h-6 w-6 opacity-30" />
                    </div>
                    <p className="text-xs font-medium mb-1">No budgets yet</p>
                    <p className="text-[10px] text-muted-foreground/70">Set limits to control spending</p>
                  </div>
                ) : (
                  budgetItems.map(budget => {
                    const isOver = budget.percent >= 1;
                    const isWarning = budget.percent >= 0.7 && budget.percent < 0.9;
                    const isDanger = budget.percent >= 0.9;
                    const barColor = isDanger ? '#ef4444' : isWarning ? '#f59e0b' : (budget.category?.color || '#22c55e');

                    return (
                      <div key={budget.id} className="rounded-xl bg-secondary/40 p-3 hover:bg-secondary/60 transition-colors">
                        <div className="flex items-center justify-between mb-1">
                          <div className="font-medium text-foreground text-[15px] truncate">
                            {budget.category?.name || budget.name}
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                            <button className="text-xs text-muted-foreground hover:text-foreground px-1.5 py-0.5 rounded-md hover:bg-muted/50 transition-colors" onClick={() => openEditBudget(budget)}>
                              Edit
                            </button>
                            <button className="text-xs text-muted-foreground hover:text-red-500 px-1.5 py-0.5 rounded-md hover:bg-red-500/10 transition-colors" onClick={() => { if (confirm('Delete this budget?')) deleteBudget(budget.id); }}>
                              Delete
                            </button>
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1.5 mb-2">
                          {budget.isAutoRenewed && (
                            <span className="inline-flex items-center gap-0.5 text-primary font-medium">
                              <RefreshCw className="h-3 w-3" /> Reset
                            </span>
                          )}
                          <span>{format(budget.effectiveStart, 'MMM d')} - {format(budget.effectiveEnd, 'MMM d')}</span>
                          <span className="text-muted-foreground/60">&middot; {budget.daysLeft}d left</span>
                        </div>
                        <div className="w-full h-2 bg-muted rounded-full overflow-hidden mb-1.5">
                          <div className="h-2 rounded-full transition-all duration-700 ease-out" style={{ width: `${Math.min(budget.percent * 100, 100)}%`, backgroundColor: barColor }} />
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground tabular-nums">
                            ₹{formatAmount(budget.spent)} / ₹{formatAmount(budget.amount)}
                          </span>
                          <span className="font-semibold tabular-nums" style={{ color: barColor }}>
                            {isOver ? `₹${formatAmount(Math.abs(budget.remaining))} over` : `₹${formatAmount(budget.remaining)} left`}
                          </span>
                        </div>
                        <div className="text-right text-[11px] text-muted-foreground/50 mt-0.5 tabular-nums">
                          {Math.round(budget.percent * 100)}% used
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - desktop only (mobile has inline summary cards) */}
        <div className="hidden xl:block space-y-5">
          {/* Statistics */}
          <Card className="glass rounded-2xl border-0 shadow-card animate-slide-up">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-semibold text-foreground">Statistics</CardTitle>
              <Button variant="ghost" size="sm" className="gap-1.5 h-8 text-xs text-muted-foreground hover:text-foreground rounded-lg" onClick={() => exportToCSV(safeExpenses, categories, accounts, selectedMonth)}>
                <Download className="h-3.5 w-3.5" /> Export
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Date range */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                {selectedMonthStartDate} - {selectedMonthEndDate}
              </div>

              {/* Month progress bar */}
              <div>
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>{isCurrentMonth ? format(currentDate, 'MMM d') : format(selectedMonthDate_, 'MMM yyyy')}</span>
                  <span>{isCurrentMonth ? `Day ${dayOfMonth} of ${totalDaysInMonth}` : 'Completed'}</span>
                </div>
                <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                  <div className="h-1 rounded-full bg-primary/50 transition-all duration-500" style={{ width: `${monthProgress}%` }} />
                </div>
              </div>

              {/* Total Expenses */}
              <div className="rounded-2xl bg-secondary/40 p-5 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
                <div className="relative">
                  <div className="text-xs text-muted-foreground uppercase tracking-widest mb-1.5">Total Expenses</div>
                  <div className="text-2xl sm:text-3xl font-bold text-primary tabular-nums">₹{formatAmount(totalExpenses)}</div>
                  {prevMonthTotal > 0 && (
                    <div className={`text-xs flex items-center gap-1 mt-2 ${monthTrend > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                      {monthTrend > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {Math.abs(monthTrend).toFixed(1)}% vs {format(subMonths(selectedMonthDate_, 1), 'MMM')}
                    </div>
                  )}
                </div>
              </div>

              {/* Balance */}
              <div className="rounded-2xl bg-secondary/40 p-5">
                <div className="text-xs text-muted-foreground uppercase tracking-widest mb-1.5">Total Balance</div>
                <button onClick={() => setBalanceVisible(!balanceVisible)} className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2 hover:opacity-80 transition-opacity tabular-nums">
                  {balanceVisible ? <>₹{formatAmount(totalBalance)}</> : <span className="tracking-widest">₹*****</span>}
                  {balanceVisible ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                </button>
                <div className="text-xs text-muted-foreground mt-1.5">{dashboardAccounts.length} account{dashboardAccounts.length !== 1 ? 's' : ''}</div>
              </div>

              {/* Category Breakdown - FIXED PERCENTAGES */}
              <div className="rounded-2xl bg-secondary/40 p-5">
                <div className="text-xs text-muted-foreground uppercase tracking-widest mb-3">By Category</div>
                {categoryBreakdown.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <PieChart className="h-6 w-6 mx-auto mb-2 opacity-30" />
                    <p className="text-xs">No data for this month</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {categoryBreakdown.map((cat) => (
                      <div key={cat.id} className="group">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm" style={{ backgroundColor: `${cat.color}18` }}>
                              {cat.icon || '💰'}
                            </div>
                            <span className="text-sm font-medium text-foreground">{cat.name}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-semibold text-foreground tabular-nums">₹{formatAmount(cat.total)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div className="h-1.5 rounded-full transition-all duration-500" style={{ width: `${cat.pct}%`, backgroundColor: cat.color }} />
                          </div>
                          <span className="text-xs text-muted-foreground w-10 text-right tabular-nums">{cat.pct.toFixed(1)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

        </div>
      </div>

      {/* Budget Modal - outside grid to avoid layout issues */}
      <Dialog open={budgetModalOpen} onOpenChange={setBudgetModalOpen}>
        <DialogContent className="max-w-md w-full rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold">{editingBudget ? 'Edit Budget' : 'Create Budget'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleBudgetSubmit} className="space-y-4">
              <div className="flex flex-col gap-1">
                <Label>Name</Label>
                <Input name="name" value={budgetForm.name} onChange={handleBudgetFormChange} placeholder="e.g. Food Budget" required className="rounded-xl" />
              </div>
              <div className="flex flex-col gap-1">
                <Label>Amount (₹)</Label>
                <Input name="amount" type="number" min="0" value={budgetForm.amount} onChange={handleBudgetFormChange} placeholder="5000" required className="rounded-xl" />
              </div>
              <div className="flex flex-col gap-1">
                <Label>Category</Label>
                <Select value={budgetForm.category_id} onValueChange={v => handleBudgetSelectChange('category_id', v)}>
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {categories.map(c => (
                      <SelectItem key={c.id} value={c.id}>
                        <div className="flex items-center gap-2"><span>{c.icon || '💰'}</span><div className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} /><span className="text-sm">{c.name}</span></div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1">
                <Label>Period</Label>
                <Select value={budgetForm.period} onValueChange={handlePeriodChange}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly (auto-resets)</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="custom">Custom range</SelectItem>
                  </SelectContent>
                </Select>
                {budgetForm.period === 'monthly' && (
                  <p className="text-[10px] text-primary flex items-center gap-1 mt-1">
                    <RefreshCw className="h-3 w-3" /> Resets automatically on the 1st of each month
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <div className="flex-1 flex flex-col gap-1">
                  <Label>Start</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button type="button" className="w-full h-10 px-3 py-2 border rounded-xl bg-background text-left flex items-center gap-2 text-sm">
                        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                        {budgetForm.start_date ? format(new Date(budgetForm.start_date), 'MMM d, yyyy') : 'Pick date'}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent align="start" className="p-0">
                      <DatePicker selected={budgetForm.start_date ? new Date(budgetForm.start_date) : undefined} onSelect={date => setBudgetForm({ ...budgetForm, start_date: date ? date.toISOString().slice(0, 10) : '' })} />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="flex-1 flex flex-col gap-1">
                  <Label>End</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button type="button" className="w-full h-10 px-3 py-2 border rounded-xl bg-background text-left flex items-center gap-2 text-sm">
                        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                        {budgetForm.end_date ? format(new Date(budgetForm.end_date), 'MMM d, yyyy') : 'Pick date'}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent align="start" className="p-0">
                      <DatePicker selected={budgetForm.end_date ? new Date(budgetForm.end_date) : undefined} onSelect={date => setBudgetForm({ ...budgetForm, end_date: date ? date.toISOString().slice(0, 10) : '' })} />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <DialogFooter className="flex flex-row gap-2 justify-end mt-4">
                <Button type="submit" className="rounded-xl">{editingBudget ? 'Save' : 'Create'}</Button>
                <Button type="button" variant="outline" className="rounded-xl" onClick={() => setBudgetModalOpen(false)}>Cancel</Button>
              </DialogFooter>
            </form>
          </DialogContent>
      </Dialog>
    </>
  );
};
