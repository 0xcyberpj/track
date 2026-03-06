import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFinanceData } from '@/hooks/useFinanceData';
import { toast } from '@/hooks/use-toast';
import { Plus, Wallet, DollarSign, Loader2, ArrowUpRight, ArrowDownLeft, Pencil, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import FloatingAddExpenseButton from '../components/FloatingAddExpenseButton';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar as DatePicker } from '@/components/ui/calendar';
import { Calendar as CalendarIcon } from 'lucide-react';

// Utility for formatting amounts
const formatAmount = (amount: number) => amount.toLocaleString('en-IN', { minimumFractionDigits: 2 });

const Accounts = () => {
  const navigate = useNavigate();
  const { accounts, createAccount, loading, categories, budgets, createBudget, updateAccountBalance, addAccountTransaction, accountTransactions, toggleAccountDashboardVisibility } = useFinanceData();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [transactionType, setTransactionType] = useState<'add' | 'deduct'>('add');
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    account_name: '',
    balance: ''
  });
  const [transactionData, setTransactionData] = useState({
    amount: '',
    description: ''
  });
  const [quickModalOpen, setQuickModalOpen] = useState(false);
  const [budgetModalOpen, setBudgetModalOpen] = useState(false);
  const [budgetForm, setBudgetForm] = useState({
    name: '',
    amount: '',
    period: 'monthly',
    start_date: '',
    end_date: '',
    category_id: ''
  });
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<any>(null);
  const [editBalance, setEditBalance] = useState('');
  const [editNote, setEditNote] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);

  useEffect(() => {
    const handler = () => setQuickModalOpen(true);
    window.addEventListener('open-quick-modal', handler);
    return () => window.removeEventListener('open-quick-modal', handler);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleTransactionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTransactionData({ ...transactionData, [e.target.name]: e.target.value });
  };

  const handleBudgetFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBudgetForm({ ...budgetForm, [e.target.name]: e.target.value });
  };
  const handleBudgetSelectChange = (name: string, value: string) => {
    setBudgetForm({ ...budgetForm, [name]: value });
  };
  const handleBudgetSubmit = async (e: React.FormEvent) => {
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
    await createBudget(data);
    setBudgetModalOpen(false);
    setBudgetForm({ name: '', amount: '', period: 'monthly', start_date: '', end_date: '', category_id: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.account_name) {
      toast({
        title: "Error",
        description: "Please enter an account name",
        variant: "destructive"
      });
      return;
    }

    const balance = parseFloat(formData.balance) || 0;
    if (balance < 0) {
      toast({
        title: "Error",
        description: "Balance cannot be negative",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);
    
    try {
      await createAccount(formData.account_name, balance);
      
      // Reset form and close dialog
      setFormData({ account_name: '', balance: '' });
      setIsDialogOpen(false);
      
    } catch (error) {
      // Error is handled in useFinanceData
    } finally {
      setSubmitting(false);
    }
  };

  const handleTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!transactionData.amount || !selectedAccount) {
      toast({
        title: "Error",
        description: "Please enter an amount",
        variant: "destructive"
      });
      return;
    }

    const amount = parseFloat(transactionData.amount);
    if (amount <= 0) {
      toast({
        title: "Error",
        description: "Amount must be greater than 0",
        variant: "destructive"
      });
      return;
    }

    if (transactionType === 'deduct' && amount > selectedAccount.balance) {
      toast({
        title: "Error",
        description: "Insufficient balance",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);
    
    try {
      const newBalance = transactionType === 'add' 
        ? selectedAccount.balance + amount 
        : selectedAccount.balance - amount;
      await updateAccountBalance(selectedAccount.id, newBalance);
      await addAccountTransaction({
        account_id: selectedAccount.id,
        type: transactionType === 'add' ? 'income' : 'deduction',
        amount,
        description: transactionData.description
      });
      toast({
        title: "Success",
        description: `₹${amount.toFixed(2)} ${transactionType === 'add' ? 'added to' : 'deducted from'} ${selectedAccount.account_name}`,
        variant: "default"
      });
      
      // Reset form and close dialog
      setTransactionData({ amount: '', description: '' });
      setIsTransactionDialogOpen(false);
      setSelectedAccount(null);
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update account balance",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const openTransactionDialog = (account: any, type: 'add' | 'deduct') => {
    setSelectedAccount(account);
    setTransactionType(type);
    setIsTransactionDialogOpen(true);
  };

  const openEditModal = (account: any) => {
    setEditingAccount(account);
    setEditBalance(account.balance.toString());
    setEditNote('');
    setEditModalOpen(true);
  };
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAccount) return;
    const newBalance = parseFloat(editBalance);
    if (isNaN(newBalance)) {
      toast({ title: 'Error', description: 'Enter a valid amount', variant: 'destructive' });
      return;
    }
    setEditSubmitting(true);
    try {
      await updateAccountBalance(editingAccount.id, newBalance);
      toast({ title: 'Success', description: `Balance updated for ${editingAccount.account_name}` });
      setEditModalOpen(false);
      setEditingAccount(null);
      setEditBalance('');
      setEditNote('');
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update balance', variant: 'destructive' });
    } finally {
      setEditSubmitting(false);
    }
  };

  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

  if (loading) {
    return (
      <>
        <Header />
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-center min-h-[50vh]">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </div>
      </>
    );
  }

  // Savings goal calculation
  const monthlyChange = accountTransactions
    .filter(t => {
      const d = new Date(t.created_at);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount), 0);

  const totalTransactions = accountTransactions.length;

  return (
    <>
      <Header />
      <div className="block sm:hidden mb-2" />
      <FloatingAddExpenseButton />
      <div className="container mx-auto px-3 py-4 space-y-5 max-w-7xl pt-safe sm:mt-0 pb-24 sm:pb-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 animate-fade-in">
          <div className="px-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">Savings</h1>
            <p className="text-muted-foreground text-sm mt-0.5">Manage accounts and track your wealth</p>
          </div>
          <div className="flex gap-2">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="rounded-xl gap-1.5">
                  <Plus className="h-4 w-4" />
                  Add Account
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[95vw] max-w-md">
                <DialogHeader>
                  <DialogTitle>Create New Savings Account</DialogTitle>
                  <DialogDescription>
                    Add a new account to track your savings and expenses
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="account_name">Account Name</Label>
                    <Input
                      id="account_name"
                      name="account_name"
                      placeholder="e.g., Main Savings, Emergency Fund"
                      value={formData.account_name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="balance">Initial Balance</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground">₹</span>
                      <Input
                        id="balance"
                        name="balance"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={formData.balance}
                        onChange={handleInputChange}
                        className="pl-9"
                      />
                    </div>
                  </div>
                  
                  <div className="flex space-x-3 pt-4">
                    <Button type="submit" disabled={submitting} className="flex-1">
                      {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Create Account
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
            <Button variant="outline" onClick={() => setBudgetModalOpen(true)} className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Add Budget
            </Button>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 animate-slide-up">
          <Card className="glass rounded-2xl border-0 shadow-card glow-primary sm:col-span-2">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-widest mb-1">Net Worth</p>
                  <p className="text-3xl sm:text-4xl font-bold text-primary tabular-nums">₹{formatAmount(totalBalance)}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {accounts.length} account{accounts.length !== 1 ? 's' : ''} &middot; {totalTransactions} transactions
                  </p>
                </div>
                <div className="h-14 w-14 bg-primary/10 rounded-2xl flex items-center justify-center">
                  <Wallet className="h-7 w-7 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass rounded-2xl border-0 shadow-card">
            <CardContent className="p-5">
              <p className="text-[11px] text-muted-foreground uppercase tracking-widest mb-1">This Month</p>
              <p className={`text-2xl font-bold tabular-nums ${monthlyChange >= 0 ? 'text-emerald-500' : 'text-red-400'}`}>
                {monthlyChange >= 0 ? '+' : '-'}₹{formatAmount(Math.abs(monthlyChange))}
              </p>
              <p className="text-xs text-muted-foreground mt-2">{monthlyChange >= 0 ? 'Net added' : 'Net spent'}</p>
            </CardContent>
          </Card>
        </div>

        {/* Accounts Grid */}
        {accounts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {accounts.map((account, index) => {
              const acctTxns = accountTransactions.filter(t => t.account_id === account.id);
              const recentTxns = acctTxns.slice(0, 4);
              return (
                <Card
                  key={account.id}
                  className="glass rounded-2xl border-0 shadow-card hover:shadow-elegant transition-all duration-300 animate-slide-up overflow-hidden"
                  style={{ animationDelay: `${index * 80}ms` }}
                >
                  <CardContent className="p-5 space-y-4">
                    {/* Account header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center">
                          <DollarSign className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground truncate">{account.account_name}</h3>
                          <p className="text-[11px] text-muted-foreground">Created {new Date(account.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <button
                        className="p-2 rounded-lg hover:bg-muted/40 transition-colors"
                        onClick={() => openEditModal(account)}
                      >
                        <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                    </div>

                    {/* Balance */}
                    <div className="rounded-xl bg-secondary/40 p-4">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Balance</p>
                      <p className="text-2xl font-bold text-primary tabular-nums">₹{formatAmount(account.balance)}</p>
                    </div>

                    {/* Quick actions */}
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        className="flex flex-col items-center gap-1 py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors"
                        onClick={() => openTransactionDialog(account, 'add')}
                      >
                        <ArrowUpRight className="h-4 w-4 text-emerald-500" />
                        <span className="text-[10px] font-medium text-emerald-500">Add</span>
                      </button>
                      <button
                        className="flex flex-col items-center gap-1 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 transition-colors"
                        onClick={() => openTransactionDialog(account, 'deduct')}
                      >
                        <ArrowDownLeft className="h-4 w-4 text-red-400" />
                        <span className="text-[10px] font-medium text-red-400">Deduct</span>
                      </button>
                      <button
                        className="flex flex-col items-center gap-1 py-2.5 rounded-xl bg-primary/10 hover:bg-primary/20 transition-colors"
                        onClick={() => navigate('/add-expense', { state: { selectedAccount: account.id } })}
                      >
                        <Plus className="h-4 w-4 text-primary" />
                        <span className="text-[10px] font-medium text-primary">Expense</span>
                      </button>
                    </div>

                    {/* Dashboard visibility */}
                    <div className="flex items-center justify-between py-2 border-t border-border">
                      <span className="text-xs text-muted-foreground">Dashboard</span>
                      <button
                        onClick={() => toggleAccountDashboardVisibility(account.id, !account.include_in_dashboard)}
                        className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg transition-colors ${account.include_in_dashboard !== false ? 'bg-emerald-500/10 text-emerald-500' : 'bg-muted/40 text-muted-foreground'}`}
                      >
                        {account.include_in_dashboard !== false ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                        {account.include_in_dashboard !== false ? 'Visible' : 'Hidden'}
                      </button>
                    </div>

                    {/* Transaction Log */}
                    <div>
                      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Recent</div>
                      {recentTxns.length === 0 ? (
                        <p className="text-xs text-muted-foreground/60 py-3 text-center">No transactions yet</p>
                      ) : (
                        <div className="space-y-1.5">
                          {recentTxns.map(txn => (
                            <div key={txn.id} className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-lg bg-secondary/30">
                              <div className="flex items-center gap-2">
                                <div className={`w-1.5 h-1.5 rounded-full ${txn.type === 'income' ? 'bg-emerald-500' : 'bg-red-400'}`} />
                                <span className="text-foreground font-medium truncate max-w-[100px]">{txn.description || (txn.type === 'income' ? 'Deposit' : 'Withdrawal')}</span>
                              </div>
                              <span className={`font-semibold tabular-nums ${txn.type === 'income' ? 'text-emerald-500' : 'text-red-400'}`}>
                                {txn.type === 'income' ? '+' : '-'}₹{formatAmount(txn.amount)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8 sm:py-12">
                <Wallet className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Accounts Yet</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto text-sm sm:text-base">
                  Create your first savings account to start tracking your expenses and managing your finances effectively.
                </p>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="lg" className="w-full sm:w-auto">
                      <Plus className="h-5 w-5 mr-2" />
                      Create Your First Account
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="w-[95vw] max-w-md">
                    <DialogHeader>
                      <DialogTitle>Create New Savings Account</DialogTitle>
                      <DialogDescription>
                        Add a new account to track your savings and expenses
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="account_name">Account Name</Label>
                        <Input
                          id="account_name"
                          name="account_name"
                          placeholder="e.g., Main Savings, Emergency Fund"
                          value={formData.account_name}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="balance">Initial Balance</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground">₹</span>
                          <Input
                            id="balance"
                            name="balance"
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={formData.balance}
                            onChange={handleInputChange}
                            className="pl-9"
                          />
                        </div>
                      </div>
                      
                      <div className="flex space-x-3 pt-4">
                        <Button type="submit" disabled={submitting} className="flex-1">
                          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Create Account
                        </Button>
                        <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Transaction Dialog */}
        <Dialog open={isTransactionDialogOpen} onOpenChange={setIsTransactionDialogOpen}>
          <DialogContent className="w-[95vw] max-w-md">
            <DialogHeader>
              <DialogTitle>
                {transactionType === 'add' ? 'Add Money' : 'Deduct Money'}
              </DialogTitle>
              <DialogDescription>
                {transactionType === 'add' 
                  ? `Add money to ${selectedAccount?.account_name}` 
                  : `Deduct money from ${selectedAccount?.account_name}`
                }
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleTransaction} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground">₹</span>
                  <Input
                    id="amount"
                    name="amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={transactionData.amount}
                    onChange={handleTransactionChange}
                    className="pl-9"
                    required
                  />
                </div>
                {transactionType === 'deduct' && selectedAccount && (
                  <p className="text-sm text-muted-foreground">
                    Available balance: ₹{formatAmount(selectedAccount.balance)}
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Input
                  id="description"
                  name="description"
                  placeholder="e.g., Salary deposit, Emergency withdrawal"
                  value={transactionData.description}
                  onChange={handleTransactionChange}
                />
              </div>
              
              <div className="flex space-x-3 pt-4">
                <Button 
                  type="submit" 
                  disabled={submitting} 
                  className="flex-1"
                  variant={transactionType === 'add' ? 'default' : 'destructive'}
                >
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {transactionType === 'add' ? 'Add Money' : 'Deduct Money'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsTransactionDialogOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Budget Dialog */}
        <Dialog open={budgetModalOpen} onOpenChange={setBudgetModalOpen}>
          <DialogContent className="max-w-md w-full">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold">Create Budget</DialogTitle>
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
              <div className="flex flex-col gap-1">
                <Label htmlFor="budget-start">Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="w-full h-10 px-3 py-2 border rounded-md bg-background text-left flex items-center gap-2"
                    >
                      <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                      <span>{budgetForm.start_date ? new Date(budgetForm.start_date).toLocaleDateString() : 'Pick a date'}</span>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="p-0">
                    <DatePicker
                      mode="single"
                      selected={budgetForm.start_date ? new Date(budgetForm.start_date) : undefined}
                      onSelect={date => setBudgetForm({ ...budgetForm, start_date: date ? date.toISOString().slice(0, 10) : '' })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor="budget-end">End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="w-full h-10 px-3 py-2 border rounded-md bg-background text-left flex items-center gap-2"
                    >
                      <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                      <span>{budgetForm.end_date ? new Date(budgetForm.end_date).toLocaleDateString() : 'Pick a date'}</span>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="p-0">
                    <DatePicker
                      mode="single"
                      selected={budgetForm.end_date ? new Date(budgetForm.end_date) : undefined}
                      onSelect={date => setBudgetForm({ ...budgetForm, end_date: date ? date.toISOString().slice(0, 10) : '' })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="flex flex-row gap-2 justify-end mt-4">
                <Button type="submit" variant="default">Create</Button>
                <Button type="button" variant="outline" onClick={() => setBudgetModalOpen(false)}>Cancel</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Balance Modal */}
        <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
          <DialogContent className="w-[95vw] max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Account Balance</DialogTitle>
              <DialogDescription>
                Update the balance for <b>{editingAccount?.account_name}</b>
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-balance">New Balance</Label>
                <Input
                  id="edit-balance"
                  name="edit-balance"
                  type="number"
                  step="0.01"
                  value={editBalance}
                  onChange={e => setEditBalance(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-note">Note (optional)</Label>
                <Input
                  id="edit-note"
                  name="edit-note"
                  placeholder="Reason for change"
                  value={editNote}
                  onChange={e => setEditNote(e.target.value)}
                />
              </div>
              <div className="flex space-x-3 pt-4">
                <Button type="submit" disabled={editSubmitting} className="flex-1">
                  {editSubmitting ? 'Saving...' : 'Save'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setEditModalOpen(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
};

export default Accounts;