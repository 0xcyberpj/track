import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFinanceData } from '@/hooks/useFinanceData';
import { toast } from '@/hooks/use-toast';
import { Plus, Wallet, DollarSign, Loader2, ArrowUpRight, ArrowDownLeft, Pencil } from 'lucide-react';
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
  const { accounts, createAccount, loading, categories, budgets, createBudget, updateAccountBalance, addAccountTransaction, accountTransactions } = useFinanceData();
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

  return (
    <>
      <Header />
      {/* Add space below header on mobile */}
      <div className="block sm:hidden mb-4" />
      <FloatingAddExpenseButton />
      <div className="container mx-auto px-3 py-4 space-y-6 max-w-7xl mt-20 sm:mt-0">
        {/* Header */}
        <div className="flex top-20 flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl  sm:text-2xl font-bold">Savings Accounts</h1>
            <p className="text-muted-foreground text-sm sm:text-base">Manage your accounts and balances</p>
          </div>
          <div className="flex gap-2">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
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

        {/* Total Balance Overview */}
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="pt-4 sm:pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Balance</p>
                <p className="text-2xl sm:text-3xl font-bold text-primary">₹{formatAmount(totalBalance)}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {accounts.length} account{accounts.length !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="h-12 w-12 sm:h-16 sm:w-16 bg-primary/10 rounded-full flex items-center justify-center">
                <Wallet className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Accounts Grid */}
        {accounts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {accounts.map((account, index) => (
              <Card 
                key={account.id} 
                className="hover:shadow-lg transition-all duration-300 animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base sm:text-lg truncate pr-2">{account.account_name}</CardTitle>
                    <div className="h-8 w-8 sm:h-10 sm:w-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl sm:text-2xl font-bold text-primary">
                        ₹{formatAmount(account.balance)}
                      </span>
                      <button
                        className="ml-2 p-1 rounded hover:bg-muted/30 focus:outline-none"
                        title="Edit Balance"
                        onClick={() => openEditModal(account)}
                      >
                        <Pencil className="h-4 w-4 text-muted-foreground" />
                      </button>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                      Created {new Date(account.created_at).toLocaleDateString()}
                    </p>
                    
                    {/* Account Actions */}
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="gap-1 text-xs sm:text-sm"
                          onClick={() => openTransactionDialog(account, 'add')}
                        >
                          <ArrowUpRight className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span className="hidden sm:inline">Add Income</span>
                          <span className="sm:hidden">➕</span>
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="gap-1 text-xs sm:text-sm"
                          onClick={() => openTransactionDialog(account, 'deduct')}
                        >
                          <ArrowDownLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span className="hidden sm:inline">Deduct Amount</span>
                          <span className="sm:hidden">➖</span>
                        </Button>
                      </div>
                      <Button 
                        variant="default" 
                        size="sm" 
                        className="w-full text-xs sm:text-sm"
                        onClick={() => navigate('/add-expense', { state: { selectedAccount: account.id } })}
                      >
                        Add Expense
                      </Button>
                    </div>
                    {/* Transaction Log */}
                    <div className="mt-4">
                      <div className="font-semibold text-sm mb-2">Recent Transactions</div>
                      <ul className="space-y-1">
                        {accountTransactions.filter(t => t.account_id === account.id).slice(0, 5).map(txn => (
                          <li key={txn.id} className="flex items-center justify-between text-xs bg-muted/30 rounded px-2 py-1">
                            <span className={txn.type === 'income' ? 'text-green-500' : 'text-red-500'}>
                              {txn.type === 'income' ? '➕' : '➖'} ₹{formatAmount(txn.amount)}
                            </span>
                            <span className="text-muted-foreground ml-2">{txn.description || (txn.type === 'income' ? 'Deposit' : 'Withdrawal')}</span>
                            <span className="ml-auto text-muted-foreground">{new Date(txn.created_at).toLocaleDateString()}</span>
                          </li>
                        ))}
                        {accountTransactions.filter(t => t.account_id === account.id).length === 0 && (
                          <li className="text-muted-foreground text-xs">No transactions yet.</li>
                        )}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
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