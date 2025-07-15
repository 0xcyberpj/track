import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFinanceData } from '@/hooks/useFinanceData';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, Loader2, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { Header } from '@/components/Header';
import FloatingAddExpenseButton from '../components/FloatingAddExpenseButton';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar as DatePicker } from '@/components/ui/calendar';
import { Calendar as CalendarIcon } from 'lucide-react';

const AddExpense = () => {
  const navigate = useNavigate();
  const { accounts, categories, addExpense, loading } = useFinanceData();
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    amount: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    account_id: '',
    category_id: ''
  });
  const [quickModalOpen, setQuickModalOpen] = useState(false);

  useEffect(() => {
    const handler = () => setQuickModalOpen(true);
    window.addEventListener('open-quick-modal', handler);
    return () => window.removeEventListener('open-quick-modal', handler);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.amount || !formData.account_id || !formData.category_id) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid amount",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);
    
    try {
      await addExpense({
        title: formData.title,
        description: formData.description,
        amount,
        date: formData.date,
        account_id: formData.account_id,
        category_id: formData.category_id
      });
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        amount: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        account_id: '',
        category_id: ''
      });
      
      // Navigate back with success animation
      setTimeout(() => {
        navigate('/');
      }, 1500);
      
    } catch (error) {
      // Error is handled in useFinanceData
    } finally {
      setSubmitting(false);
    }
  };

  const selectedAccount = accounts.find(acc => acc.id === formData.account_id);

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
      <FloatingAddExpenseButton />
      <div className="container mx-auto px-3 py-4 max-w-2xl space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Add New Expense</h1>
            <p className="text-muted-foreground text-sm sm:text-base">Track your spending quickly and easily</p>
          </div>
        </div>

        {/* Quick Amount Buttons */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg">Quick Amounts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-2">
              {[5, 10, 25, 50, 100, 200, 500, 1000].map((amount) => (
                <Button
                  key={amount}
                  variant="outline"
                  size="sm"
                  onClick={() => setFormData({ ...formData, amount: amount.toString() })}
                  className="hover:scale-105 transition-transform text-xs sm:text-sm"
                >
                  ₹{amount}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Main Form */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg">Expense Details</CardTitle>
            <CardDescription className="text-sm">Fill in the details of your expense</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm font-medium">Title *</Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="e.g., Grocery shopping, Gas, Coffee"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  className="text-sm sm:text-base"
                />
              </div>

              {/* Amount */}
              <div className="space-y-2">
                <Label htmlFor="amount" className="text-sm font-medium">Amount *</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="amount"
                    name="amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={handleInputChange}
                    className="pl-9 text-sm sm:text-base"
                    required
                  />
                </div>
              </div>

              {/* Account Selection */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Deduct from Account *</Label>
                <Select value={formData.account_id} onValueChange={(value) => handleSelectChange('account_id', value)}>
                  <SelectTrigger className="text-sm sm:text-base">
                    <SelectValue placeholder="Select an account" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        <div className="flex items-center justify-between w-full">
                          <span className="text-sm sm:text-base">{account.account_name}</span>
                          <span className="text-xs sm:text-sm text-muted-foreground ml-2">
                            ₹{account.balance.toFixed(2)}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedAccount && (
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Available balance: ₹{selectedAccount.balance.toFixed(2)}
                  </p>
                )}
                {accounts.length === 0 && (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground mb-2 text-sm">No accounts found</p>
                    <Button variant="outline" onClick={() => navigate('/accounts')} size="sm">
                      Add Your First Account
                    </Button>
                  </div>
                )}
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Category *</Label>
                <Select value={formData.category_id} onValueChange={(value) => handleSelectChange('category_id', value)}>
                  <SelectTrigger className="text-sm sm:text-base">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        <div className="flex items-center space-x-2">
                          <span className="text-base">{category.icon || '💰'}</span>
                          <div 
                            className="w-2.5 h-2.5 rounded-full" 
                            style={{ backgroundColor: category.color }}
                          />
                          <span className="text-sm sm:text-base">{category.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date */}
              <div className="space-y-2">
                <Label htmlFor="date" className="text-sm font-medium">Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="w-full h-10 px-3 py-2 border rounded-md bg-background text-left flex items-center gap-2"
                    >
                      <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                      <span>{formData.date ? new Date(formData.date).toLocaleDateString() : 'Pick a date'}</span>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="p-0">
                    <DatePicker
                      mode="single"
                      selected={formData.date ? new Date(formData.date) : undefined}
                      onSelect={date => setFormData({ ...formData, date: date ? date.toISOString().slice(0, 10) : '' })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium">Description (Optional)</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Add any additional notes..."
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="text-sm sm:text-base resize-none"
                />
              </div>

              {/* Submit Button */}
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 pt-4">
                <Button type="submit" disabled={submitting || accounts.length === 0} className="flex-1 h-11">
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Add Expense
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate('/')} className="h-11">
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default AddExpense;