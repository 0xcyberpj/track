import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

export interface SavingsAccount {
  id: string;
  account_name: string;
  balance: number;
  created_at: string;
  updated_at?: string;
  is_default?: boolean;
  include_in_dashboard?: boolean;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  color: string;
  icon?: string;
}

export interface Expense {
  id: string;
  title: string;
  description: string;
  amount: number;
  date: string;
  account_id: string;
  category_id: string;
  category?: ExpenseCategory;
  account?: SavingsAccount;
}

export interface Budget {
  id: string;
  name: string;
  amount: number;
  period: string;
  start_date: string;
  end_date: string;
  category_id: string;
  category?: ExpenseCategory;
}

export interface AccountTransaction {
  id: string;
  user_id: string;
  account_id: string;
  type: 'income' | 'deduction';
  amount: number;
  description?: string;
  created_at: string;
}

export const useFinanceData = () => {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<SavingsAccount[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [accountTransactions, setAccountTransactions] = useState<AccountTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Toggle account dashboard visibility
  const toggleAccountDashboardVisibility = async (accountId: string, includeInDashboard: boolean) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('savings_accounts')
        .update({ include_in_dashboard: includeInDashboard } as any)
        .eq('id', accountId);

      if (error) throw error;

      setAccounts(prev => prev.map(acc => 
        acc.id === accountId ? { ...acc, include_in_dashboard: includeInDashboard } as any : acc
      ));

      toast({
        title: "Updated!",
        description: `Account ${includeInDashboard ? 'shown in' : 'hidden from'} dashboard`,
      });
    } catch (error) {
      console.error('Error updating account visibility:', error);
      toast({
        title: "Error",
        description: "Failed to update account visibility",
        variant: "destructive"
      });
    }
  };

  // Fetch all data
  const fetchData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const [accountsRes, categoriesRes, expensesRes, budgetsRes, transactionsRes] = await Promise.all([
        supabase.from('savings_accounts').select('*, include_in_dashboard').order('created_at', { ascending: false }),
        supabase.from('expense_categories').select('*').order('name'),
        supabase.from('expenses').select(`
          *,
          category:expense_categories(id, name, color, icon),
          account:savings_accounts(id, account_name, balance, created_at)
        `).order('date', { ascending: false }),
        supabase.from('budgets').select(`
          *,
          category:expense_categories(id, name, color, icon)
        `).order('created_at', { ascending: false }),
        supabase.from('account_transactions').select('*').order('created_at', { ascending: false })
      ]);

      if (accountsRes.error) throw accountsRes.error;
      if (categoriesRes.error) throw categoriesRes.error;
      if (expensesRes.error) throw expensesRes.error;
      if (budgetsRes.error) throw budgetsRes.error;
      if (transactionsRes.error) throw transactionsRes.error;

      setAccounts((accountsRes.data || []) as unknown as SavingsAccount[]);
      setCategories(categoriesRes.data || []);
      setExpenses(expensesRes.data || []);
      setBudgets(budgetsRes.data || []);
      setAccountTransactions(transactionsRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Create savings account
  const createAccount = async (accountName: string, initialBalance: number = 0) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('savings_accounts')
        .insert([{
          user_id: user.id,
          account_name: accountName,
          balance: initialBalance
        }])
        .select()
        .single();

      if (error) throw error;

      setAccounts(prev => [data, ...prev]);
      toast({
        title: "Success!",
        description: "Savings account created successfully",
      });
      
      return data;
    } catch (error) {
      console.error('Error creating account:', error);
      toast({
        title: "Error",
        description: "Failed to create account",
        variant: "destructive"
      });
    }
  };

  // Update account balance
  const updateAccountBalance = async (accountId: string, newBalance: number) => {
    try {
      const { error } = await supabase
        .from('savings_accounts')
        .update({ balance: newBalance })
        .eq('id', accountId);

      if (error) throw error;

      setAccounts(prev => prev.map(acc => 
        acc.id === accountId ? { ...acc, balance: newBalance } : acc
      ));
    } catch (error) {
      console.error('Error updating account balance:', error);
      throw error;
    }
  };

  // Add expense
  const addExpense = async (expenseData: {
    title: string;
    description?: string;
    amount: number;
    date: string;
    account_id: string;
    category_id: string;
  }) => {
    if (!user) return;

    try {
      // Get current account balance
      const account = accounts.find(acc => acc.id === expenseData.account_id);
      if (!account) throw new Error('Account not found');
      
      if (account.balance < expenseData.amount) {
        throw new Error('Insufficient funds in selected account');
      }

      // Add expense
      const { data: expense, error: expenseError } = await supabase
        .from('expenses')
        .insert([{
          user_id: user.id,
          ...expenseData
        }])
        .select(`
          *,
          category:expense_categories(id, name, color),
          account:savings_accounts(id, account_name, balance, created_at)
        `)
        .single();

      if (expenseError) throw expenseError;

      // Update account balance
      await updateAccountBalance(expenseData.account_id, account.balance - expenseData.amount);

      setExpenses(prev => [expense, ...prev]);
      
      toast({
        title: "Success!",
        description: `Expense added and deducted from ${account.account_name}`,
      });

      return expense;
    } catch (error: any) {
      console.error('Error adding expense:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add expense",
        variant: "destructive"
      });
      throw error;
    }
  };

  // Add account transaction (income/deduction)
  const addAccountTransaction = async ({ account_id, type, amount, description }: { account_id: string; type: 'income' | 'deduction'; amount: number; description?: string }) => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('account_transactions')
        .insert([{
          user_id: user.id,
          account_id,
          type,
          amount,
          description
        }])
        .select()
        .single();
      if (error) throw error;
      setAccountTransactions(prev => [data, ...prev]);
      return data;
    } catch (error) {
      console.error('Error adding account transaction:', error);
      toast({
        title: "Error",
        description: "Failed to log transaction",
        variant: "destructive"
      });
      throw error;
    }
  };

  // Create budget
  const createBudget = async (budgetData: {
    name: string;
    amount: number;
    period: string;
    start_date: string;
    end_date: string;
    category_id: string;
  }) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('budgets')
        .insert([{
          user_id: user.id,
          ...budgetData
        }])
        .select(`
          *,
          category:expense_categories(id, name, color)
        `)
        .single();

      if (error) throw error;

      setBudgets(prev => [data, ...prev]);
      toast({
        title: "Success!",
        description: "Budget created successfully",
      });
      
      return data;
    } catch (error) {
      console.error('Error creating budget:', error);
      toast({
        title: "Error",
        description: "Failed to create budget",
        variant: "destructive"
      });
    }
  };

  // Update budget
  const updateBudget = async (budgetId: string, budgetData: Partial<Budget>) => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('budgets')
        .update(budgetData)
        .eq('id', budgetId)
        .select(`
          *,
          category:expense_categories(id, name, color)
        `)
        .single();
      if (error) throw error;
      setBudgets(prev => prev.map(b => b.id === budgetId ? data : b));
      toast({
        title: "Success!",
        description: "Budget updated successfully",
      });
      return data;
    } catch (error) {
      console.error('Error updating budget:', error);
      toast({
        title: "Error",
        description: "Failed to update budget",
        variant: "destructive"
      });
      throw error;
    }
  };

  // Update expense
  const updateExpense = async (expenseId: string, expenseData: Partial<Expense>) => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('expenses')
        .update(expenseData)
        .eq('id', expenseId)
        .select(`
          *,
          category:expense_categories(id, name, color, icon),
          account:savings_accounts(id, account_name, balance, created_at)
        `)
        .single();
      if (error) throw error;
      setExpenses(prev => prev.map(e => e.id === expenseId ? data : e));
      toast({
        title: "Success!",
        description: "Expense updated successfully",
      });
      return data;
    } catch (error) {
      console.error('Error updating expense:', error);
      toast({
        title: "Error",
        description: "Failed to update expense",
        variant: "destructive"
      });
      throw error;
    }
  };

  // Delete expense
  const deleteExpense = async (expenseId: string) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', expenseId);
      if (error) throw error;
      setExpenses(prev => prev.filter(e => e.id !== expenseId));
      toast({
        title: "Deleted!",
        description: "Expense deleted successfully",
        variant: "default"
      });
    } catch (error) {
      console.error('Error deleting expense:', error);
      toast({
        title: "Error",
        description: "Failed to delete expense",
        variant: "destructive"
      });
      throw error;
    }
  };

  // Set default account
  const setDefaultAccount = async (accountId: string) => {
    if (!user) return;
    try {
      // Set all accounts to is_default=false, then set the chosen one to true
      const { error: clearError } = await supabase
        .from('savings_accounts')
        .update({ account_name: accounts.find(a => a.id !== accountId)?.account_name })
        .eq('user_id', user.id);
      if (clearError) throw clearError;
      const { error: setError } = await supabase
        .from('savings_accounts')
        .update({ account_name: accounts.find(a => a.id === accountId)?.account_name })
        .eq('id', accountId);
      if (setError) throw setError;
      await fetchData();
      toast({ title: 'Default account set!', description: 'This account will be preselected for new expenses.' });
    } catch (error) {
      console.error('Error setting default account:', error);
      toast({ title: 'Error', description: 'Failed to set default account', variant: 'destructive' });
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  return {
    accounts,
    categories,
    expenses,
    budgets,
    loading,
    createAccount,
    updateAccountBalance,
    addAccountTransaction,
    addExpense,
    createBudget,
    updateBudget,
    updateExpense,
    deleteExpense, // <-- export deleteExpense
    accountTransactions,
    refreshData: fetchData,
    setDefaultAccount,
    toggleAccountDashboardVisibility,
  };
};