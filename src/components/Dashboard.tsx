import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, TrendingDown, Download, Calendar, Search, PieChart, Plus, Loader2, ChevronDown, ChevronUp, Clock, Eye, EyeOff, Wallet, Target } from "lucide-react";
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

// Utility for formatting amounts
const formatAmount = (amount: number) => amount.toLocaleString('en-IN', { minimumFractionDigits: 2 });

// Format expense date with relative labels
const formatExpenseDate = (dateStr: string) => {
  const date = new Date(dateStr);
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  const now = new Date();
  const daysDiff = differenceInDays(now, date);
  if (daysDiff < 7) return format(date, 'EEEE'); // Day name for this week
  if (date.getFullYear() === now.getFullYear()) return format(date, 'MMM d');
  return format(date, 'MMM d, yyyy');
};

// Format day group header
const formatDayHeader = (dayStr: string) => {
  const date = new Date(dayStr);
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  const now = new Date();
  if (date.getFullYear() === now.getFullYear()) return format(date, 'EEEE, MMM d');
  return format(date, 'EEEE, MMM d, yyyy');
};

// Get greeting based on time of day
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
};

export const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { accounts, expenses, categories, budgets, loading, createBudget, updateBudget, addExpense, updateExpense, deleteExpense } = useFinanceData();
  const [balanceVisible, setBalanceVisible] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Budget modal state
  const [budgetModalOpen, setBudgetModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [budgetForm, setBudgetForm] = useState({
    name: '',
    amount: '',
    period: 'monthly',
    start_date: '',
    end_date: '',
    category_id: ''
  });

  // Month selector state
  const [selectedMonth, setSelectedMonth] = useState(() => format(new Date(), 'yyyy-MM'));

  // Expense edit modal state
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [expenseForm, setExpenseForm] = useState({
    title: '',
    amount: '',
    date: '',
    account_id: '',
    category_id: '',
    description: ''
  });

  // Expense detail modal state
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const openExpenseDetail = (expense) => {
    setSelectedExpense(expense);
    setExpenseForm({
      title: expense.title,
      amount: expense.amount.toString(),
      date: expense.date,
      account_id: expense.account_id,
      category_id: expense.category_id,
      description: expense.description || ''
    });
    setDetailModalOpen(true);
  };

  // Delete expense state
  const [deleting, setDeleting] = useState(false);

  // Auto-fill dates when period changes to monthly
  const handlePeriodChange = (value: string) => {
    setBudgetForm(prev => {
      if (value === 'monthly') {
        const now = new Date();
        return {
          ...prev,
          period: value,
          start_date: format(startOfMonth(now), 'yyyy-MM-dd'),
          end_date: format(endOfMonth(now), 'yyyy-MM-dd')
        };
      }
      if (value === 'weekly') {
        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        return {
          ...prev,
          period: value,
          start_date: format(startOfWeek, 'yyyy-MM-dd'),
          end_date: format(endOfWeek, 'yyyy-MM-dd')
        };
      }
      return { ...prev, period: value };
    });
  };

  const openCreateBudget = () => {
    setEditingBudget(null);
    const now = new Date();
    setBudgetForm({
      name: '',
      amount: '',
      period: 'monthly',
      start_date: format(startOfMonth(now), 'yyyy-MM-dd'),
      end_date: format(endOfMonth(now), 'yyyy-MM-dd'),
      category_id: ''
    });
    setBudgetModalOpen(true);
  };

  const openEditBudget = (budget) => {
    setEditingBudget(budget);
    setBudgetForm({
      name: budget.name,
      amount: budget.amount.toString(),
      period: budget.period || 'monthly',
      start_date: budget.start_date,
      end_date: budget.end_date,
      category_id: budget.category_id || ''
    });
    setBudgetModalOpen(true);
  };

  const handleBudgetFormChange = (e) => {
    setBudgetForm({ ...budgetForm, [e.target.name]: e.target.value });
  };
  const handleBudgetSelectChange = (name, value) => {
    setBudgetForm({ ...budgetForm, [name]: value });
  };
  const handleBudgetSubmit = async (e) => {
    e.preventDefault();
    if (!budgetForm.name || !budgetForm.amount || !budgetForm.start_date || !budgetForm.end_date || !budgetForm.category_id) return;
    const data = {
      name: budgetForm.name,
      amount: parseFloat(budgetForm.amount),
      period: budgetForm.period,
      start_date: budgetForm.start_date,
      end_date: budgetForm.end_date,
      category_id: budgetForm.category_id
    };
    if (editingBudget) {
      await updateBudget(editingBudget.id, data);
    } else {
      await createBudget(data);
    }
    setBudgetModalOpen(false);
  };

  const handleExpenseFormChange = (e) => {
    setExpenseForm({ ...expenseForm, [e.target.name]: e.target.value });
  };
  const handleExpenseSelectChange = (name, value) => {
    setExpenseForm({ ...expenseForm, [name]: value });
  };
  const handleExpenseSubmit = async (e) => {
    e.preventDefault();
    if (!expenseForm.title || !expenseForm.amount || !expenseForm.account_id || !expenseForm.category_id) return;
    const data = {
      title: expenseForm.title,
      amount: parseFloat(expenseForm.amount),
      date: expenseForm.date,
      account_id: expenseForm.account_id,
      category_id: expenseForm.category_id,
      description: expenseForm.description
    };
    await updateExpense(editingExpense.id, data);
    setExpenseModalOpen(false);
  };

  // Calculate current month expenses
  const currentDate = new Date();
  const currentMonthStart = startOfMonth(currentDate);
  const currentMonthEnd = endOfMonth(currentDate);
  const currentMonthExpenses = expenses.filter(expense =>
    new Date(expense.date) >= currentMonthStart
  );
  const totalExpenses = currentMonthExpenses.reduce((sum, expense) => sum + (typeof expense.amount === 'number' ? expense.amount : parseFloat(expense.amount)), 0);

  // Previous month comparison
  const prevMonthStart = startOfMonth(subMonths(currentDate, 1));
  const prevMonthEnd = endOfMonth(subMonths(currentDate, 1));
  const prevMonthExpenses = expenses.filter(expense => {
    const d = new Date(expense.date);
    return d >= prevMonthStart && d <= prevMonthEnd;
  });
  const prevMonthTotal = prevMonthExpenses.reduce((sum, e) => sum + (typeof e.amount === 'number' ? e.amount : parseFloat(e.amount)), 0);
  const monthTrend = prevMonthTotal > 0 ? ((totalExpenses - prevMonthTotal) / prevMonthTotal) * 100 : 0;

  // Only include accounts that are set to show in dashboard
  const dashboardAccounts = accounts.filter(account => account.include_in_dashboard !== false);
  const totalBalance = dashboardAccounts.reduce((sum, account) => sum + (typeof account.balance === 'number' ? account.balance : parseFloat(account.balance)), 0);

  // Get all months with expenses
  const monthsWithExpenses = Array.from(new Set(expenses.map(e => format(new Date(e.date), 'yyyy-MM')))).sort((a, b) => b.localeCompare(a));

  // Filter expenses by selected month
  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || expense.category_id === selectedCategory;
    const matchesMonth = format(new Date(expense.date), 'yyyy-MM') === selectedMonth;
    return matchesSearch && matchesCategory && matchesMonth;
  });

  const safeExpenses = Array.isArray(filteredExpenses) ? filteredExpenses : [];
  const safeCategories = Array.isArray(categories) ? categories : [];

  // Group expenses by day
  const grouped = useMemo(() => {
    return (safeExpenses || []).reduce((acc, expense) => {
      if (!expense || !expense.date) return acc;
      const day = format(new Date(expense.date), 'yyyy-MM-dd');
      if (!acc[day]) acc[day] = [];
      acc[day].push(expense);
      return acc;
    }, {});
  }, [safeExpenses]);

  const allDays = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  // Load More state for days
  const [visibleDayCount, setVisibleDayCount] = useState(5);
  const visibleDays = allDays.slice(0, visibleDayCount);

  // Quick expense state
  const [quickExpense, setQuickExpense] = useState({
    title: '',
    amount: '',
    date: new Date().toISOString().slice(0, 10),
    account_id: accounts[0]?.id || '',
    category_id: categories[0]?.id || '',
    description: ''
  });
  const [quickLoading, setQuickLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setQuickExpense(prev => ({
      ...prev,
      account_id: prev.account_id || accounts[0]?.id || '',
      category_id: prev.category_id || categories[0]?.id || ''
    }));
  }, [accounts, categories]);

  useEffect(() => {
    setBudgetModalOpen(false);
    setDetailModalOpen(false);
    setExpenseModalOpen(false);
  }, [location]);

  // Dynamic date range for current selected month
  const selectedMonthDate = new Date(selectedMonth + '-01');
  const selectedMonthLabel = format(selectedMonthDate, 'MMMM yyyy');
  const selectedMonthStartDate = format(startOfMonth(selectedMonthDate), 'MMM dd');
  const selectedMonthEndDate = format(endOfMonth(selectedMonthDate), 'MMM dd, yyyy');

  // Category breakdown for selected month
  const categoryBreakdown = useMemo(() => {
    return safeCategories
      .map(category => {
        const catExpenses = safeExpenses.filter(e => e.category_id === category.id);
        const total = catExpenses.reduce((sum, e) => sum + e.amount, 0);
        const selectedTotal = safeExpenses.reduce((s, e) => s + e.amount, 0);
        const pct = selectedTotal > 0 ? (total / selectedTotal) * 100 : 0;
        return { ...category, total, pct };
      })
      .filter(c => c.total > 0)
      .sort((a, b) => b.total - a.total);
  }, [safeExpenses, safeCategories]);

  // Budget calculations with proper monthly reset
  const budgetItems = useMemo(() => {
    return budgets
      .filter(budget => {
        const now = new Date();
        const budgetEnd = new Date(budget.end_date);

        // Monthly budgets: always show (they auto-renew)
        if (budget.period === 'monthly') {
          // Hide only if expired more than 3 months ago
          if (budgetEnd < now) {
            const monthsDiff = (now.getFullYear() - budgetEnd.getFullYear()) * 12 +
                             (now.getMonth() - budgetEnd.getMonth());
            return monthsDiff <= 3;
          }
          return true;
        }

        // Non-monthly: show if still active
        return budgetEnd >= now;
      })
      .map(budget => {
        const now = new Date();
        const budgetEnd = new Date(budget.end_date);

        // For monthly budgets, always use current month window
        let effectiveStart, effectiveEnd;
        let isAutoRenewed = false;

        if (budget.period === 'monthly') {
          const originalStart = new Date(budget.start_date);
          const currentMonthBudgetStart = startOfMonth(now);
          const currentMonthBudgetEnd = endOfMonth(now);

          if (budgetEnd < now || originalStart < currentMonthBudgetStart) {
            // Budget period has passed or started before this month - use current month
            effectiveStart = currentMonthBudgetStart;
            effectiveEnd = currentMonthBudgetEnd;
            isAutoRenewed = true;
          } else {
            effectiveStart = originalStart;
            effectiveEnd = budgetEnd;
          }
        } else {
          effectiveStart = new Date(budget.start_date);
          effectiveEnd = budgetEnd;
        }

        const expensesForBudget = expenses.filter(e =>
          e.category_id === budget.category_id &&
          new Date(e.date) >= effectiveStart &&
          new Date(e.date) <= effectiveEnd
        );

        const spent = expensesForBudget.reduce((sum, e) => sum + e.amount, 0);
        const remaining = budget.amount - spent;
        const percent = budget.amount > 0 ? spent / budget.amount : 0;
        const daysLeft = Math.max(0, differenceInDays(effectiveEnd, now));

        return {
          ...budget,
          spent,
          remaining,
          percent,
          effectiveStart,
          effectiveEnd,
          isAutoRenewed,
          daysLeft
        };
      });
  }, [budgets, expenses]);

  return (
    <>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 pt-safe">
        {/* Main Panel */}
        <div className="xl:col-span-2 space-y-5">
          <FloatingAddExpenseButton />
          <div className="h-2 sm:h-0 w-full" />

          {/* Greeting & Date Header */}
          <div className="px-4 sm:px-0 sm:mt-14">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">{getGreeting()}</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {format(currentDate, 'EEEE, MMMM d, yyyy')} &middot; {format(currentDate, 'h:mm a')}
            </p>
          </div>

          {/* Summary Cards - Mobile */}
          <div className="grid grid-cols-2 gap-3 px-4 sm:hidden">
            <Card className="bg-card-gradient shadow-card border-border/50">
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground mb-1">This Month</div>
                <div className="text-lg font-bold text-primary">₹{formatAmount(totalExpenses)}</div>
                {prevMonthTotal > 0 && (
                  <div className={`text-xs flex items-center gap-1 mt-1 ${monthTrend > 0 ? 'text-red-400' : 'text-green-400'}`}>
                    {monthTrend > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {Math.abs(monthTrend).toFixed(0)}% vs last month
                  </div>
                )}
              </CardContent>
            </Card>
            <Card className="bg-card-gradient shadow-card border-border/50">
              <CardContent className="p-4">
                <div className="text-xs text-muted-foreground mb-1">Balance</div>
                <button onClick={() => setBalanceVisible(!balanceVisible)} className="text-lg font-bold text-foreground flex items-center gap-1.5">
                  {balanceVisible ? <>₹{formatAmount(totalBalance)}</> : <span className="tracking-wider">₹*****</span>}
                  {balanceVisible ? <EyeOff className="h-3.5 w-3.5 text-muted-foreground" /> : <Eye className="h-3.5 w-3.5 text-muted-foreground" />}
                </button>
                <div className="text-xs text-muted-foreground mt-1">{dashboardAccounts.length} account{dashboardAccounts.length !== 1 ? 's' : ''}</div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          {/* Mobile filter row */}
          <div className="flex flex-row items-center gap-3 px-4 w-full sm:hidden">
            <div className="flex-1 min-w-0 max-w-[120px]">
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="h-9 px-2 text-xs">
                  {format(new Date(selectedMonth + '-01'), 'MMM yyyy')}
                </SelectTrigger>
                <SelectContent>
                  {monthsWithExpenses.map(month => (
                    <SelectItem key={month} value={month}>{format(new Date(month + '-01'), 'MMM yyyy')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-0">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input placeholder="Search..." className="h-9 pl-7 pr-2 text-xs w-full bg-transparent border rounded" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
              </div>
            </div>
            <div className="flex-shrink-0 w-[50px]">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="h-9 px-2 text-xs">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 4a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v2a1 1 0 0 1-.293.707l-7 7V21a1 1 0 0 1-2 0v-7.293l-7-7A1 1 0 0 1 3 6V4z" /></svg>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      <span className="text-base">{category.icon || '💰'}</span> {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Desktop filter row */}
          <div className="hidden sm:flex flex-row flex-wrap gap-3 items-end mt-2 mb-4 w-full justify-center mx-auto px-0">
            <div className="flex-1 min-w-[140px]">
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="h-9 px-3 text-sm rounded-md shadow-none"><SelectValue placeholder="Select month" /></SelectTrigger>
                <SelectContent>
                  {monthsWithExpenses.map(month => (
                    <SelectItem key={month} value={month}>{format(new Date(month + '-01'), 'MMMM yyyy')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[180px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search expenses..." className="h-9 pl-9 pr-3 text-sm rounded-md shadow-none" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
              </div>
            </div>
            <div className="flex-1 min-w-[160px]">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="h-9 px-3 text-sm rounded-md shadow-none"><SelectValue placeholder="Category" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      <div className="flex items-center space-x-2">
                        <span className="text-base">{category.icon || '💰'}</span>
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: category.color }} />
                        <span className="text-sm">{category.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-shrink-0">
              <Button variant="outline" size="icon" className="h-9 w-9 p-0 rounded-md shadow-none" aria-label="Export">
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Recent Expenses List - Grouped by Day */}
          <div>
            <Card className="bg-card-gradient shadow-card border-border/50">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-semibold text-foreground">Expenses</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {safeExpenses.length} transaction{safeExpenses.length !== 1 ? 's' : ''} in {selectedMonthLabel}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-destructive">
                      -₹{formatAmount(safeExpenses.reduce((s, e) => s + e.amount, 0))}
                    </div>
                    <div className="text-xs text-muted-foreground">total</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                    <p>Loading expenses...</p>
                  </div>
                ) : safeExpenses.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground flex flex-col items-center">
                    <Wallet className="h-12 w-12 mb-3 opacity-30" />
                    <p className="text-base font-medium">No expenses found</p>
                    <p className="text-sm mt-1 mb-3">Start tracking your spending</p>
                    <Button size="sm" onClick={() => window.dispatchEvent(new CustomEvent('open-quick-modal'))}>
                      <Plus className="h-4 w-4 mr-1.5" />
                      Add Expense
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {visibleDays.map(day => (
                      <div key={day}>
                        {/* Day header */}
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                              {formatDayHeader(day)}
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            -₹{formatAmount(grouped[day].reduce((s, e) => s + e.amount, 0))}
                          </span>
                        </div>
                        {/* Day expenses */}
                        <div className="space-y-2">
                          {grouped[day].map((expense) => {
                            const category = categories.find(c => c.id === expense.category_id);
                            const account = accounts.find(a => a.id === expense.account_id);
                            return (
                              <div
                                key={expense.id}
                                className="flex items-center justify-between p-3 sm:p-4 rounded-xl bg-background/80 border border-border/50 hover:border-border hover:shadow-md transition-all group cursor-pointer"
                                onClick={() => openExpenseDetail(expense)}
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-lg" style={{ backgroundColor: `${category?.color}15` || '#88888815' }}>
                                    {category?.icon || '💰'}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="font-medium text-foreground text-sm sm:text-base truncate">{expense.title}</div>
                                    <div className="flex items-center gap-x-2 flex-wrap text-muted-foreground text-xs mt-0.5">
                                      <span className="flex items-center gap-x-1">
                                        <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ backgroundColor: category?.color || '#888' }} />
                                        {category?.name}
                                      </span>
                                      {account?.account_name && (
                                        <span className="px-1.5 py-0 rounded-md text-[10px] font-medium bg-muted/60 text-muted-foreground">
                                          {account.account_name}
                                        </span>
                                      )}
                                      <span className="flex items-center gap-0.5">
                                        <Clock className="h-3 w-3" />
                                        {format(new Date(expense.date), 'h:mm a')}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right flex-shrink-0 ml-2">
                                  <div className="font-bold text-destructive text-base sm:text-lg">-₹{formatAmount(expense.amount)}</div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                    {/* Load more */}
                    {allDays.length > visibleDayCount && (
                      <button
                        className="w-full py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1.5 rounded-lg hover:bg-muted/30"
                        onClick={() => setVisibleDayCount(prev => prev + 5)}
                      >
                        <ChevronDown className="h-4 w-4" />
                        Show more ({allDays.length - visibleDayCount} more days)
                      </button>
                    )}
                    {visibleDayCount > 5 && (
                      <button
                        className="w-full py-2 text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1"
                        onClick={() => setVisibleDayCount(5)}
                      >
                        <ChevronUp className="h-3.5 w-3.5" />
                        Show less
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
              <DialogContent className="max-w-md w-full">
                {selectedExpense && (
                  <>
                    <DialogHeader>
                      <DialogTitle className="text-lg font-bold">Edit Expense</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={async (e) => {
                      e.preventDefault();
                      setDeleting(true);
                      await updateExpense(selectedExpense.id, { ...expenseForm, amount: parseFloat(expenseForm.amount) });
                      setDeleting(false);
                      setDetailModalOpen(false);
                    }}>
                      <div className="space-y-3 mt-2">
                        <div className="flex flex-col gap-1">
                          <Label htmlFor="expense-title">Title</Label>
                          <Input id="expense-title" name="title" value={expenseForm.title} onChange={handleExpenseFormChange} required />
                        </div>
                        <div className="flex flex-col gap-1">
                          <Label htmlFor="expense-amount">Amount</Label>
                          <Input id="expense-amount" name="amount" type="number" min="0" value={expenseForm.amount} onChange={handleExpenseFormChange} required />
                        </div>
                        <div className="flex flex-col gap-1">
                          <Label htmlFor="expense-category">Category</Label>
                          <Select value={expenseForm.category_id} onValueChange={val => handleExpenseSelectChange('category_id', val)}>
                            <SelectTrigger id="expense-category"><SelectValue placeholder="Select category" /></SelectTrigger>
                            <SelectContent>
                              {categories.map((category) => (
                                <SelectItem key={category.id} value={category.id}>
                                  <div className="flex items-center space-x-2">
                                    <span className="text-base">{category.icon || '💰'}</span>
                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: category.color }} />
                                    <span className="text-sm">{category.name}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex flex-col gap-1">
                          <Label htmlFor="expense-account">Account</Label>
                          <Select value={expenseForm.account_id} onValueChange={val => handleExpenseSelectChange('account_id', val)}>
                            <SelectTrigger id="expense-account"><SelectValue placeholder="Select account" /></SelectTrigger>
                            <SelectContent>
                              {accounts.map((account) => (
                                <SelectItem key={account.id} value={account.id}>{account.account_name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex flex-col gap-1">
                          <Label htmlFor="expense-date">Date</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <button type="button" className="w-full h-10 px-3 py-2 border rounded-md bg-background text-left flex items-center gap-2">
                                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                                <span>{expenseForm.date ? format(new Date(expenseForm.date), 'MMM d, yyyy') : 'Pick a date'}</span>
                              </button>
                            </PopoverTrigger>
                            <PopoverContent align="start" className="p-0">
                              <DatePicker selected={expenseForm.date ? new Date(expenseForm.date) : undefined} onSelect={date => handleExpenseFormChange({ target: { name: 'date', value: date ? date.toISOString().slice(0, 10) : '' } })} />
                            </PopoverContent>
                          </Popover>
                        </div>
                        <div className="flex flex-col gap-1">
                          <Label htmlFor="expense-description">Description</Label>
                          <Input id="expense-description" name="description" value={expenseForm.description} onChange={handleExpenseFormChange} />
                        </div>
                      </div>
                      <DialogFooter className="flex flex-row gap-2 justify-end mt-4">
                        <Button type="submit" disabled={deleting}>
                          {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
                        </Button>
                        <Button variant="destructive" onClick={async (e) => { e.preventDefault(); if(window.confirm('Delete this expense?')) { setDeleting(true); await deleteExpense(selectedExpense.id); setDeleting(false); setDetailModalOpen(false); } }} disabled={deleting}>
                          {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Delete'}
                        </Button>
                      </DialogFooter>
                    </form>
                  </>
                )}
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Statistics Sidebar */}
        <div className="space-y-5">
          {/* Statistics Card */}
          <Card className="bg-card-gradient shadow-card border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-semibold text-foreground">Statistics</CardTitle>
              <Button variant="outline" size="sm" className="gap-2 h-8">
                <Download className="h-3.5 w-3.5" />
                Export
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Dynamic date range */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>{selectedMonthStartDate} - {selectedMonthEndDate}</span>
              </div>

              {/* Total Expenses */}
              <div className="bg-secondary/30 p-5 rounded-xl border border-border/30">
                <div className="text-xs text-muted-foreground mb-1.5 uppercase tracking-wide">Total Expenses</div>
                <div className="text-2xl sm:text-3xl font-bold text-primary">₹{formatAmount(totalExpenses)}</div>
                <div className="flex items-center gap-1.5 mt-1.5">
                  {prevMonthTotal > 0 ? (
                    <span className={`text-xs flex items-center gap-1 ${monthTrend > 0 ? 'text-red-400' : 'text-green-400'}`}>
                      {monthTrend > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {Math.abs(monthTrend).toFixed(1)}% vs {format(subMonths(currentDate, 1), 'MMM')}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">Current month</span>
                  )}
                </div>
              </div>

              {/* Total Balance */}
              <div className="bg-secondary/30 p-5 rounded-xl border border-border/30">
                <div className="text-xs text-muted-foreground mb-1.5 uppercase tracking-wide">Total Balance</div>
                <button
                  onClick={() => setBalanceVisible(!balanceVisible)}
                  className="text-2xl sm:text-3xl font-bold text-success flex items-center gap-2 hover:text-success/80 transition-colors"
                >
                  {balanceVisible ? <>₹{formatAmount(totalBalance)}</> : <span className="tracking-wider">₹*****</span>}
                  {balanceVisible ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                </button>
                <div className="text-xs text-muted-foreground mt-1">
                  {dashboardAccounts.length} account{dashboardAccounts.length !== 1 ? 's' : ''}
                </div>
              </div>

              {/* Category Breakdown */}
              <div className="bg-secondary/30 p-5 rounded-xl border border-border/30">
                <div className="text-xs text-muted-foreground mb-3 uppercase tracking-wide">By Category</div>
                {categoryBreakdown.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <PieChart className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p className="text-xs">No data for this month</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {categoryBreakdown.map((cat) => (
                      <div key={cat.id}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{cat.icon || '💰'}</span>
                            <span className="text-sm text-foreground">{cat.name}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-medium text-foreground">₹{formatAmount(cat.total)}</span>
                          </div>
                        </div>
                        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-1.5 rounded-full transition-all duration-300" style={{ width: `${cat.pct}%`, backgroundColor: cat.color }} />
                        </div>
                        <div className="text-right text-xs text-muted-foreground mt-0.5">{cat.pct.toFixed(1)}%</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Budget Overview Card */}
          <Card className="bg-card-gradient shadow-card border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Budgets
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">Track your spending limits</p>
              </div>
              <Button size="icon" variant="outline" onClick={openCreateBudget} aria-label="Create Budget" className="h-8 w-8">
                <Plus className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {budgetItems.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Target className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm mb-1">No budgets yet</p>
                    <p className="text-xs">Create a budget to track spending</p>
                  </div>
                ) : (
                  budgetItems.map(budget => {
                    let barColor = 'bg-green-500';
                    if (budget.percent >= 0.9) barColor = 'bg-red-500';
                    else if (budget.percent >= 0.7) barColor = 'bg-orange-400';

                    return (
                      <div key={budget.id} className="p-3 border border-border/50 rounded-xl bg-background/80 hover:border-border transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-base">{budget.category?.icon || '💰'}</span>
                            <div>
                              <div className="font-medium text-foreground text-sm">
                                {budget.category?.name || budget.name}
                              </div>
                              <div className="text-xs text-muted-foreground flex items-center gap-1">
                                {budget.isAutoRenewed && (
                                  <span className="text-[10px] bg-primary/15 text-primary px-1.5 py-0.5 rounded-full font-medium">
                                    Auto-renewed
                                  </span>
                                )}
                                <span>{format(budget.effectiveStart, 'MMM d')} - {format(budget.effectiveEnd, 'MMM d')}</span>
                                {budget.daysLeft > 0 && (
                                  <span className="text-muted-foreground/70">&middot; {budget.daysLeft}d left</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => openEditBudget(budget)}>Edit</Button>
                        </div>
                        {/* Progress bar */}
                        <div className="w-full h-2 bg-muted rounded-full overflow-hidden mb-1.5">
                          <div className={`h-2 rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${Math.min(budget.percent * 100, 100)}%` }} />
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>₹{formatAmount(budget.spent)} / ₹{formatAmount(budget.amount)}</span>
                          <span style={{ color: budget.percent >= 0.9 ? '#ef4444' : budget.percent >= 0.7 ? '#f59e42' : '#22c55e' }}>
                            {budget.remaining >= 0
                              ? `₹${formatAmount(budget.remaining)} left`
                              : `₹${formatAmount(Math.abs(budget.remaining))} over`}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Budget Modal Dialog */}
        <Dialog open={budgetModalOpen} onOpenChange={setBudgetModalOpen}>
          <DialogContent className="max-w-md w-full">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold">{editingBudget ? 'Edit Budget' : 'Create Budget'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleBudgetSubmit} className="space-y-4">
              <div className="flex flex-col gap-1">
                <Label htmlFor="budget-name">Name</Label>
                <Input id="budget-name" name="name" value={budgetForm.name} onChange={handleBudgetFormChange} placeholder="e.g. Food Budget" required />
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor="budget-amount">Amount (₹)</Label>
                <Input id="budget-amount" name="amount" type="number" min="0" value={budgetForm.amount} onChange={handleBudgetFormChange} placeholder="5000" required />
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor="budget-category">Category</Label>
                <Select value={budgetForm.category_id} onValueChange={v => handleBudgetSelectChange('category_id', v)}>
                  <SelectTrigger id="budget-category"><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        <div className="flex items-center space-x-2">
                          <span className="text-base">{category.icon || '💰'}</span>
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: category.color }} />
                          <span className="text-sm">{category.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* Period selector */}
              <div className="flex flex-col gap-1">
                <Label>Period</Label>
                <Select value={budgetForm.period} onValueChange={handlePeriodChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly (auto-resets each month)</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="custom">Custom range</SelectItem>
                  </SelectContent>
                </Select>
                {budgetForm.period === 'monthly' && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Budget automatically resets on the 1st of each month
                  </p>
                )}
              </div>
              {/* Start and End Date */}
              <div className="flex gap-2">
                <div className="flex-1 flex flex-col gap-1">
                  <Label htmlFor="budget-start">Start Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button type="button" className="w-full h-10 px-3 py-2 border rounded-md bg-background text-left flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{budgetForm.start_date ? format(new Date(budgetForm.start_date), 'MMM d, yyyy') : 'Pick a date'}</span>
                      </button>
                    </PopoverTrigger>
                    <PopoverContent align="start" className="p-0">
                      <DatePicker selected={budgetForm.start_date ? new Date(budgetForm.start_date) : undefined} onSelect={date => setBudgetForm({ ...budgetForm, start_date: date ? date.toISOString().slice(0, 10) : '' })} />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="flex-1 flex flex-col gap-1">
                  <Label htmlFor="budget-end">End Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button type="button" className="w-full h-10 px-3 py-2 border rounded-md bg-background text-left flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{budgetForm.end_date ? format(new Date(budgetForm.end_date), 'MMM d, yyyy') : 'Pick a date'}</span>
                      </button>
                    </PopoverTrigger>
                    <PopoverContent align="start" className="p-0">
                      <DatePicker selected={budgetForm.end_date ? new Date(budgetForm.end_date) : undefined} onSelect={date => setBudgetForm({ ...budgetForm, end_date: date ? date.toISOString().slice(0, 10) : '' })} />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <DialogFooter className="flex flex-row gap-2 justify-end mt-4">
                <Button type="submit" variant="default">{editingBudget ? 'Save' : 'Create'}</Button>
                <Button type="button" variant="outline" onClick={() => setBudgetModalOpen(false)}>Cancel</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
};
