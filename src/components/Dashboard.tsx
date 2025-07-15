import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, Download, Calendar, Search, DollarSign, PieChart, CreditCard, Plus, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { useFinanceData } from "@/hooks/useFinanceData";
import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { format } from 'date-fns';
import FloatingAddExpenseButton from './FloatingAddExpenseButton';
import { useToast } from "@/components/ui/use-toast";
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar as DatePicker } from '@/components/ui/calendar';
import { Calendar as CalendarIcon } from 'lucide-react';
// Utility for formatting amounts
const formatAmount = (amount: number) => amount.toLocaleString('en-IN', { minimumFractionDigits: 2 });

export const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { accounts, expenses, categories, budgets, loading, createBudget, updateBudget, addExpense, updateExpense, deleteExpense } = useFinanceData();
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
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return format(now, 'yyyy-MM');
  });

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
  const handleDeleteExpense = async () => {
    if (!selectedExpense) return;
    if (!window.confirm('Are you sure you want to delete this expense?')) return;
    setDeleting(true);
    try {
      await deleteExpense(selectedExpense.id);
      setDetailModalOpen(false);
    } finally {
      setDeleting(false);
    }
  };

  const openCreateBudget = () => {
    console.log('openCreateBudget called');
    setEditingBudget(null);
    setBudgetForm({ name: '', amount: '', period: 'monthly', start_date: '', end_date: '', category_id: '' });
    setBudgetModalOpen(true);
  };
  const openEditBudget = (budget) => {
    console.log('openEditBudget called', budget);
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

  const openEditExpense = (expense) => {
    setEditingExpense(expense);
    setExpenseForm({
      title: expense.title,
      amount: expense.amount.toString(),
      date: expense.date,
      account_id: expense.account_id,
      category_id: expense.category_id,
      description: expense.description || ''
    });
    setExpenseModalOpen(true);
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

  // Calculate total balance across all accounts
  const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);
  
  // Calculate total expenses
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  // Filter recent expenses (last 5)
  const recentExpenses = expenses
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

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

  // Defensive: ensure arrays are always defined
  const safeExpenses = Array.isArray(filteredExpenses) ? filteredExpenses : [];
  const safeCategories = Array.isArray(categories) ? categories : [];
  const safeAccounts = Array.isArray(accounts) ? accounts : [];

  // --- Grouping logic for Recent Expenses ---
  function groupExpensesByDay(expenses) {
    return (expenses || []).reduce((acc, expense) => {
      if (!expense || !expense.date) return acc;
      const day = format(new Date(expense.date), 'yyyy-MM-dd');
      if (!acc[day]) acc[day] = [];
      acc[day].push(expense);
      return acc;
    }, {});
  }
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const yesterdayStr = format(new Date(Date.now() - 86400000), 'yyyy-MM-dd');
  const grouped = groupExpensesByDay(safeExpenses);
  const allDays = Object.keys(grouped).sort((a, b) => b.localeCompare(a));
  const todayExpenses = grouped[todayStr] || [];
  const yesterdayExpenses = grouped[yesterdayStr] || [];
  const earlierDays = allDays.filter(day => day !== todayStr && day !== yesterdayStr);

  // Load More state for earlier days
  const [earlierVisibleCount, setEarlierVisibleCount] = useState(1);
  const visibleEarlierDays = earlierDays.slice(0, earlierVisibleCount);
  const [showYesterday, setShowYesterday] = useState(true);
  const [showEarlier, setShowEarlier] = useState(true);

  useEffect(() => {
    const handler = () => {
      // This effect is now redundant as the FAB handles the modal open
      // Keeping it for now, but it might be removed if the FAB is the only way to open it.
    };
    window.addEventListener('open-quick-modal', handler);
    return () => window.removeEventListener('open-quick-modal', handler);
  }, []);

  useEffect(() => {
    setBudgetModalOpen(false);
    setDetailModalOpen(false);
    setExpenseModalOpen(false);
  }, [location]);

  useEffect(() => {
    const handler = (e) => {
      // Log the tag and class of the clicked element
      console.log('Clicked element:', e.target.tagName, e.target.className, e.target);
    };
    document.addEventListener('click', handler, true);
    return () => document.removeEventListener('click', handler, true);
  }, []);

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

  // Ensure quickExpense always has a valid account_id and category_id when data loads
  useEffect(() => {
    setQuickExpense(prev => ({
      ...prev,
      account_id: prev.account_id || accounts[0]?.id || '',
      category_id: prev.category_id || categories[0]?.id || ''
    }));
  }, [accounts, categories]);

  console.log('budgetModalOpen', budgetModalOpen);
  // Add this debug button at the top of the return statement
  // It will forcibly close all modals when clicked
  return (
    <>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mt-6 top-1">
        {/* Main Panel: Recent Expenses, Budget Overview (Quick Add Expense Widget removed) */}
        <div className="xl:col-span-2 space-y-6">
          {/* Quick Add Expense Widget removed. FAB now shows on all screens. */}
          {/* Floating Add Expense Button (FAB) - now on all screens */}
          <FloatingAddExpenseButton />
          {/* Spacer for fixed nav bar */}
          <div className="h-2 sm:h-0 w-full" />
          {/* Month Selector, Search, Filter, Export - single line */}
          {/* Mobile: compact filter row */}
          <div className="flex flex-row items-center gap-4 mt-12 mb-2 px-4 w-full justify-center sm:hidden mx-auto">
            <div className="flex-1 min-w-0 max-w-[110px]">
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="h-9 px-2 text-xs">{selectedMonth}</SelectTrigger>
                <SelectContent>
                  {monthsWithExpenses.map(month => (
                    <SelectItem key={month} value={month}>{format(new Date(month + '-01'), 'yyyy-MM')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-0 max-w-[120px]">
              <Input placeholder="Search expenses..." className="h-9 px-2 text-xs w-full bg-transparent border rounded" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} aria-label="Search expenses" />
            </div>
            <div className="flex-1 min-w-0 max-w-[60px]">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="h-9 px-2 text-xs flex items-center justify-center" aria-label="Filter by category">
                  <span className="sr-only">Category</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 4a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v2a1 1 0 0 1-.293.707l-7 7V21a1 1 0 0 1-2 0v-7.293l-7-7A1 1 0 0 1 3 6V4z" /></svg>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      <span className="text-base">{category.icon || '💰'}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <button className="w-9 h-9 flex items-center justify-center rounded bg-muted hover:bg-muted/70 transition" aria-label="Export">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 5v14m7-7H5" /></svg>
            </button>
          </div>
          {/* Mobile: add space below bar */}
          <div className="block sm:hidden mt-4" />
          {/* Desktop: full filter row (inlined controls) */}
          <div className="hidden sm:flex flex-row flex-wrap gap-3 items-end mt-16 mb-8 w-full justify-center mx-auto px-0">
            {/* Month Selector */}
            <div className="flex-1 min-w-[120px]">
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="flex-1 min-w-[120px] h-9 px-3 text-sm rounded-md shadow-none"><SelectValue placeholder="Select month" /></SelectTrigger>
                <SelectContent>
                  {monthsWithExpenses.map(month => (
                    <SelectItem key={month} value={month}>{format(new Date(month + '-01'), 'MMMM yyyy')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Search Input */}
            <div className="flex-1 min-w-[160px]">
              <Input placeholder="Search expenses..." className="flex-1 min-w-[160px] h-9 px-3 text-sm rounded-md shadow-none" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} aria-label="Search expenses" />
            </div>
            {/* Category Filter */}
            <div className="flex-1 min-w-[140px]">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="flex-1 min-w-[140px] h-9 px-3 text-sm rounded-md shadow-none"><SelectValue placeholder="Category" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      <div className="flex items-center space-x-2">
                        <span className="text-base">{category.icon || '💰'}</span>
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: category.color }} />
                        <span className="text-sm sm:text-base">{category.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Export Button */}
            <div className="flex-shrink-0">
              <Button variant="outline" size="icon" className="h-9 w-9 p-0 rounded-md shadow-none" aria-label="Export">
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
          {/* Recent Expenses List */}
          {/* Extra space for desktop after bar */}
          <div className="hidden sm:block mt-8" />
          <div>
            <Card className="bg-card-gradient shadow-card border-border/50">
              <CardHeader className="pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle className="text-xl font-semibold text-foreground">Recent Expenses</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">Your latest spending records</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                    <p>Loading expenses...</p>
                  </div>
                ) : filteredExpenses.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground flex flex-col items-center">
                    <span className="text-6xl mb-4">🦄</span>
                    <p className="text-lg font-medium">No expenses found.</p>
                    <p className="text-sm mb-2">Add your first expense to start tracking!</p>
                    <Button className="mt-2" onClick={() => window.innerWidth < 768 ? window.dispatchEvent(new CustomEvent('open-quick-modal')) : null}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Expense
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredExpenses.map((expense) => {
                      const category = categories.find(c => c.id === expense.category_id);
                      const account = accounts.find(a => a.id === expense.account_id);
                      return (
                        <div key={expense.id} className="flex items-center justify-between p-4 rounded-xl bg-background/80 border border-border/50 shadow-sm hover:shadow-lg transition-shadow group cursor-pointer" onClick={() => openExpenseDetail(expense)}>
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="text-2xl" style={{ color: category?.color || '#888' }}>{category?.icon || '💰'}</span>
                            <div className="min-w-0">
                              <div className="font-semibold text-foreground text-base truncate group-hover:underline">{expense.title}</div>
                              <div className="flex items-center gap-x-2 flex-wrap text-muted-foreground text-xs">
                                {/* Category */}
                                <span className="flex items-center gap-x-1">
                                  <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: category?.color || '#888' }} />
                                  {category?.name}
                                </span>
                                {/* Account badge */}
                                {account?.account_name === 'SBI' ? (
                                  <span className="ml-0 sm:ml-1 px-1 py-0 rounded text-[10px] font-semibold bg-blue-400/20 text-blue-200 sm:px-2 sm:py-0.5 sm:rounded-full sm:text-xs sm:bg-blue-800 sm:text-blue-100">SBI</span>
                                ) : account?.account_name === 'CAN' ? (
                                  <span className="ml-0 sm:ml-1 px-1 py-0 rounded text-[10px] font-semibold bg-green-900/40 text-green-400 sm:px-2 sm:py-0.5 sm:rounded-full sm:text-xs">CAN</span>
                                ) : account?.account_name ? (
                                  <span className="ml-0 sm:ml-1 px-1 py-0 rounded text-[10px] font-semibold bg-muted/40 text-muted-foreground sm:px-2 sm:py-0.5 sm:rounded-full sm:text-xs">{account.account_name}</span>
                                ) : null}
                                {/* Date */}
                                <span>{expense.date ? new Date(expense.date).toLocaleDateString() : ''}</span>
                              </div>
                              {expense.description && (
                                <div className="text-xs text-muted-foreground mt-1 truncate">{expense.description}</div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-right flex-shrink-0 ml-2">
                              <div className="font-bold text-destructive text-lg sm:text-xl group-hover:scale-110 transition-transform">-₹{formatAmount(expense.amount)}</div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          {/* Expense Detail Modal */}
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
                      <div className="space-y-2 mt-2">
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
                                    <span className="text-sm sm:text-base">{category.name}</span>
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
                          <DatePicker selected={expenseForm.date ? new Date(expenseForm.date) : undefined} onSelect={date => handleExpenseFormChange({ target: { name: 'date', value: date ? date.toISOString().slice(0, 10) : '' } })} />
                        </div>
                        <div className="flex flex-col gap-1">
                          <Label htmlFor="expense-description">Description</Label>
                          <Input id="expense-description" name="description" value={expenseForm.description} onChange={handleExpenseFormChange} />
                        </div>
                      </div>
                      <DialogFooter className="flex flex-row gap-2 justify-end mt-4">
                        <Button type="submit" variant="outline" disabled={deleting}>
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
        <div className="space-y-6">
          {/* Total Expenses Card */}
          <Card className="bg-card-gradient shadow-card border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-semibold text-foreground">STATISTICS</CardTitle>
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="h-4 w-4" />
                Export
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-sm text-muted-foreground">
                Overview of your expenses
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Jul 01 - Jul 31, 25</span>
              </div>
              <div className="bg-secondary/30 p-6 rounded-lg border border-border/30">
                <div className="text-sm text-muted-foreground mb-2">TOTAL EXPENSES</div>
                <div className="text-3xl font-bold text-primary mb-1">₹{formatAmount(totalExpenses)}</div>
                <div className="text-sm text-muted-foreground">All time</div>
              </div>
              <div className="bg-secondary/30 p-6 rounded-lg border border-border/30">
                <div className="text-sm text-muted-foreground mb-2">TOTAL BALANCE</div>
                <div className="text-3xl font-bold text-success mb-1">₹{formatAmount(totalBalance)}</div>
                <div className="text-sm text-muted-foreground">{accounts.length} account{accounts.length !== 1 ? 's' : ''}</div>
              </div>
              <div className="bg-secondary/30 p-6 rounded-lg border border-border/30">
                <div className="text-sm text-muted-foreground mb-2">BY CATEGORY</div>
                {expenses.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <PieChart className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No category data available</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {categories.map((category) => {
                      const categoryExpenses = expenses.filter(e => e.category_id === category.id);
                      const categoryTotal = categoryExpenses.reduce((sum, e) => sum + e.amount, 0);
                      const percentage = totalExpenses > 0 ? (categoryTotal / totalExpenses) * 100 : 0;
                      if (categoryTotal === 0) return null;
                      return (
                        <div key={category.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-base">{category.icon || '💰'}</span>
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: category.color }} />
                            <span className="text-sm text-foreground">{category.name}</span>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium text-foreground">₹{formatAmount(categoryTotal)}</div>
                            <div className="text-xs text-muted-foreground">{percentage.toFixed(1)}%</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          {/* Budget Overview Card (moved below Statistics) */}
          <Card className="mb-4">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-lg font-semibold text-foreground">Budget Overview</CardTitle>
                <p className="text-sm text-muted-foreground">Set and track your spending limits</p>
              </div>
              <Button size="icon" variant="outline" onClick={openCreateBudget} aria-label="Create Budget" className="ml-2">
                <Plus className="h-5 w-5" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {budgets.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="text-sm mb-4">No budgets created yet</p>
                    <p className="text-xs">Create your first budget to start tracking your spending</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {budgets.map(budget => {
                      // Calculate spent/remaining for this budget's category and month
                      const budgetStart = new Date(budget.start_date);
                      const budgetEnd = new Date(budget.end_date);
                      const expensesForBudget = expenses.filter(e =>
                        e.category_id === budget.category_id &&
                        new Date(e.date) >= budgetStart &&
                        new Date(e.date) <= budgetEnd
                      );
                      const spent = expensesForBudget.reduce((sum, e) => sum + e.amount, 0);
                      const remaining = budget.amount - spent;
                      const percent = budget.amount > 0 ? spent / budget.amount : 0;
                      let barColor = 'bg-green-500';
                      if (percent >= 0.9) barColor = 'bg-red-500';
                      else if (percent >= 0.7) barColor = 'bg-orange-400';
                      return (
                        <div key={budget.id} className="p-3 border border-border/50 rounded-lg bg-background/80">
                          <div className="flex items-center justify-between mb-1">
                            <div className="font-semibold text-foreground">{categories.find(c => c.id === budget.category_id)?.name || budget.name}</div>
                            <Button size="sm" variant="outline" onClick={() => openEditBudget(budget)}>Edit</Button>
                          </div>
                          <div className="flex justify-between text-xs text-muted-foreground mb-1">
                            <span>Budget: ₹{budget.amount.toFixed(2)}</span>
                            <span>Spent: ₹{spent.toFixed(2)}</span>
                            <span>Left: ₹{remaining.toFixed(2)}</span>
                          </div>
                          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                            <div className={`h-2 rounded-full transition-all duration-300 ${barColor}`} style={{ width: `${Math.min(percent * 100, 100)}%` }} />
                          </div>
                          <div className="text-right text-xs mt-1" style={{ color: percent >= 0.9 ? '#ef4444' : percent >= 0.7 ? '#f59e42' : '#22c55e' }}>
                            {Math.round(percent * 100)}% used
                          </div>
                        </div>
                      );
                    })}
                  </div>
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
                <Input id="budget-name" name="name" value={budgetForm.name} onChange={handleBudgetFormChange} required />
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor="budget-amount">Amount</Label>
                <Input id="budget-amount" name="amount" type="number" min="0" value={budgetForm.amount} onChange={handleBudgetFormChange} required />
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
                          <span className="text-sm sm:text-base">{category.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* Start and End Date on the same row, each with a popover calendar */}
              <div className="flex gap-2">
                <div className="flex-1 flex flex-col gap-1">
                  <Label htmlFor="budget-start">Start Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button type="button" className="w-full h-10 px-3 py-2 border rounded-md bg-background text-left flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                        <span>{budgetForm.start_date ? new Date(budgetForm.start_date).toLocaleDateString() : 'Pick a date'}</span>
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
                        <span>{budgetForm.end_date ? new Date(budgetForm.end_date).toLocaleDateString() : 'Pick a date'}</span>
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

  // Helper to render expense card (keeps styling consistent)
  function renderExpenseCard(expense) {
    if (!expense) return null;
    const category = safeCategories.find(c => c.id === expense.category_id) || {};
    const account = safeAccounts.find(a => a.id === expense.account_id) || {};
    return (
      <div key={expense.id} className="flex items-center justify-between p-4 rounded-xl bg-background/80 border border-border/50 shadow-sm hover:shadow-lg transition-shadow group cursor-pointer" onClick={() => openExpenseDetail(expense)}>
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-2xl" style={{ color: category.color || '#888' }}>{category.icon || '💰'}</span>
          <div className="min-w-0">
            <div className="font-semibold text-foreground text-base truncate group-hover:underline">{expense.title}</div>
            <div className="flex items-center gap-x-2 flex-wrap text-muted-foreground text-xs">
              <span className="truncate flex items-center gap-x-1">
                <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: category.color || '#888' }} />
                {category.name || 'Unknown'}
              </span>
              <span className="hidden sm:inline">•</span>
              <span>{account.account_name || 'Unknown'}</span>
              <span className="hidden sm:inline">•</span>
              <span>{expense.date ? new Date(expense.date).toLocaleDateString() : ''}</span>
            </div>
            {expense.description && (
              <div className="text-xs text-muted-foreground mt-1 truncate">{expense.description}</div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right flex-shrink-0 ml-2">
            <div className="font-bold text-destructive text-lg sm:text-xl group-hover:scale-110 transition-transform">-₹{formatAmount(expense.amount)}</div>
          </div>
        </div>
      </div>
    );
  }