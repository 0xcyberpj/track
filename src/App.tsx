import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import AddExpense from "./pages/AddExpense";
import Accounts from "./pages/Accounts";
import NotFound from "./pages/NotFound";
import Insights from "./pages/Insights";
import Settings from "./pages/Settings";
import MonthlyPlan from "./pages/MonthlyPlan";
import { ThemeProvider } from "@/hooks/useTheme";
import { useFinanceData } from "@/hooks/useFinanceData";
import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar as DatePicker } from '@/components/ui/calendar';
import { Calendar as CalendarIcon } from 'lucide-react';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppWithFinanceData />
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </AuthProvider>
  </QueryClientProvider>
);

function AppWithFinanceData() {
  const { accounts, categories, addExpense } = useFinanceData();
  const [quickModalOpen, setQuickModalOpen] = useState(false);
  const [quickExpense, setQuickExpense] = useState({
    title: '',
    amount: '',
    date: new Date().toISOString().slice(0, 10),
    account_id: accounts[0]?.id || '',
    category_id: categories[0]?.id || '',
    description: ''
  });
  const [quickLoading, setQuickLoading] = useState(false);
  const amountInputRef = useRef(null);
  useEffect(() => {
    if (quickModalOpen && amountInputRef.current) {
      amountInputRef.current.focus();
    }
  }, [quickModalOpen]);
  useEffect(() => {
    const handler = () => setQuickModalOpen(true);
    window.addEventListener('open-quick-modal', handler);
    return () => window.removeEventListener('open-quick-modal', handler);
  }, []);

  // When opening quick add modal, preselect default account
  useEffect(() => {
    if (quickModalOpen && accounts.length > 0) {
      const defaultAccount = accounts.find(a => a.is_default);
      setQuickExpense(q => ({
        ...q,
        account_id: defaultAccount ? defaultAccount.id : accounts[0].id
      }));
    }
  }, [quickModalOpen, accounts]);
  const handleQuickExpenseChange = (e) => {
    setQuickExpense({ ...quickExpense, [e.target.name]: e.target.value });
  };
  const handleQuickSelectChange = (name, value) => {
    setQuickExpense({ ...quickExpense, [name]: value });
  };
  const handleQuickAddExpense = async (e) => {
    e.preventDefault();
    if (!quickExpense.title || !quickExpense.amount || !quickExpense.account_id || !quickExpense.category_id) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }
    setQuickLoading(true);
    try {
      await addExpense({
        title: quickExpense.title,
        amount: parseFloat(quickExpense.amount),
        date: quickExpense.date,
        account_id: quickExpense.account_id,
        category_id: quickExpense.category_id,
        description: quickExpense.description
      });
      setQuickExpense({
        title: '',
        amount: '',
        date: new Date().toISOString().slice(0, 10),
        account_id: accounts[0]?.id || '',
        category_id: categories[0]?.id || '',
        description: ''
      });
      setQuickModalOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to add expense",
        variant: "destructive"
      });
    } finally {
      setQuickLoading(false);
    }
  };
  const location = useLocation();
  useEffect(() => {
    setQuickModalOpen(false);
  }, [location]);
  return (
    <>
      {(accounts.length > 0 && categories.length > 0) && (
        <Dialog open={quickModalOpen} onOpenChange={setQuickModalOpen}>
          {quickModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <DialogContent className="w-full max-w-sm rounded-2xl shadow-xl bg-background p-6 md:p-8 border-none outline-none flex flex-col gap-4 max-h-[95dvh] overflow-y-auto">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-lg font-semibold">Add Expense</span>
                  <button onClick={() => setQuickModalOpen(false)} className="text-muted-foreground hover:text-primary text-xl px-2 py-1 rounded-full focus:outline-none">×</button>
                </div>
                <form id="quick-add-form" className="flex flex-col gap-5" onSubmit={handleQuickAddExpense} autoComplete="off">
                  <div className="flex items-center gap-2 border-b border-border pb-2">
                    <span className="text-2xl font-bold">₹</span>
                    <Input ref={amountInputRef} name="amount" type="number" placeholder="0.00" value={quickExpense.amount} onChange={handleQuickExpenseChange} required className="h-12 text-2xl font-bold flex-1 bg-transparent border-none focus:ring-0 p-0 px-3 py-2" style={{ boxShadow: 'none' }} />
                    <Input name="title" type="text" placeholder="Expense Name" value={quickExpense.title} onChange={handleQuickExpenseChange} required className="h-12 text-base flex-1 bg-transparent border-none focus:ring-0 p-0 px-3 py-2" style={{ boxShadow: 'none' }} />
                  </div>
                  <Select value={quickExpense.category_id} onValueChange={v => handleQuickSelectChange('category_id', v)}>
                    <SelectTrigger className="w-full h-11 text-base bg-transparent border-b border-border focus:ring-0 p-0 px-3 py-2">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select value={quickExpense.account_id} onValueChange={v => handleQuickSelectChange('account_id', v)}>
                    <SelectTrigger className="w-full h-11 text-base bg-transparent border-b border-border focus:ring-0 p-0 px-3 py-2">
                      <SelectValue placeholder="Account" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map(acc => <SelectItem key={acc.id} value={acc.id}>{acc.account_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {/* Date Picker (mini popover) */}
                  <div className="space-y-2">
                    <label htmlFor="quick-date" className="text-sm font-medium">Date</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          className="w-full h-11 text-base bg-transparent border-b border-border focus:ring-0 p-0 px-3 py-2 flex items-center justify-between rounded-md"
                        >
                          <span>
                            {quickExpense.date ?
                              new Date(quickExpense.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) :
                              'Pick a date'}
                          </span>
                          <CalendarIcon className="ml-2 h-4 w-4 opacity-50" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="p-0 w-auto bg-background border-border">
                        <DatePicker
                          mode="single"
                          selected={quickExpense.date ? new Date(quickExpense.date) : undefined}
                          onSelect={date => {
                            if (date) {
                              setQuickExpense({ ...quickExpense, date: date.toISOString().slice(0, 10) });
                            }
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <Input name="description" placeholder="Notes (optional)" value={quickExpense.description || ''} onChange={handleQuickExpenseChange} className="w-full h-11 text-base bg-transparent border-b border-border focus:ring-0 p-0 px-3 py-2" style={{ boxShadow: 'none' }} />
                  <div className="flex gap-3 mt-2">
                    <button type="button" onClick={() => setQuickModalOpen(false)} className="flex-1 py-3 rounded-xl bg-muted text-foreground font-medium text-base">Cancel</button>
                    <button type="submit" disabled={quickLoading || !quickExpense.title || !quickExpense.amount || !quickExpense.account_id || !quickExpense.category_id} className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-base disabled:opacity-60">{quickLoading ? 'Adding...' : 'Add'}</button>
                  </div>
                </form>
              </DialogContent>
            </div>
          )}
        </Dialog>
      )}
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="/" element={
          <ProtectedRoute>
            <Index />
          </ProtectedRoute>
        } />
        <Route path="/add-expense" element={
          <ProtectedRoute>
            <AddExpense />
          </ProtectedRoute>
        } />
        <Route path="/accounts" element={
          <ProtectedRoute>
            <Accounts />
          </ProtectedRoute>
        } />
        <Route path="/insights" element={
          <ProtectedRoute>
            <Insights />
          </ProtectedRoute>
        } />
        <Route path="/monthly-plan" element={
          <ProtectedRoute>
            <MonthlyPlan />
          </ProtectedRoute>
        } />
        <Route path="/settings" element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        } />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

export default App;
