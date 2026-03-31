import { useState, useMemo } from 'react';
import { Header } from '@/components/Header';
import { useMonthlyPlan, Tracker, DEFAULT_BUDGETS } from '@/hooks/useMonthlyPlan';
import { useFinanceData, Expense, ExpenseCategory } from '@/hooks/useFinanceData';
import {
  ChevronLeft, ChevronRight, Plus, Trash2, Check, X, Pencil,
  Loader2, CalendarDays, IndianRupee, TrendingUp, Wallet,
  Target, PiggyBank, StickyNote, Save
} from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, parseISO } from 'date-fns';

const MonthlyPlan = () => {
  const [selectedMonth, setSelectedMonth] = useState(() =>
    format(startOfMonth(new Date()), 'yyyy-MM-dd')
  );

  const { expenses, categories } = useFinanceData();

  const {
    plan, loading, saving, createPlan, savePlan, savePlanDebounced, deletePlan,
    addAllocation, editAllocation, toggleAllocation, removeAllocation,
    addBalanceItem, editBalanceItem, removeBalanceItem,
    addTracker, editTracker, removeTracker,
    addInvestment, editInvestment, removeInvestment,
    totalAllocations, totalBalance, totalBalanceDistributed,
    totalTrackerBudgets, totalInvested,
  } = useMonthlyPlan(selectedMonth, categories);

  // Filter expenses for the selected month
  const monthStart = startOfMonth(new Date(selectedMonth));
  const monthEnd = endOfMonth(new Date(selectedMonth));

  const monthExpenses = useMemo(() =>
    expenses.filter(e => {
      const d = parseISO(e.date);
      return d >= monthStart && d <= monthEnd;
    }),
    [expenses, selectedMonth]
  );

  // Group expenses by category_id → { [category_id]: Expense[] }
  const expensesByCategory = useMemo(() => {
    const map: Record<string, Expense[]> = {};
    monthExpenses.forEach(e => {
      if (!map[e.category_id]) map[e.category_id] = [];
      map[e.category_id].push(e);
    });
    return map;
  }, [monthExpenses]);

  // Total spent across all trackers (from real expenses)
  const totalTrackerSpent = useMemo(() => {
    if (!plan) return 0;
    return plan.trackers.reduce((sum, t) => {
      if (!t.category_id) return sum;
      const catExpenses = expensesByCategory[t.category_id] || [];
      return sum + catExpenses.reduce((s, e) => s + e.amount, 0);
    }, 0);
  }, [plan?.trackers, expensesByCategory]);

  const prevMonth = () => setSelectedMonth(format(subMonths(new Date(selectedMonth), 1), 'yyyy-MM-dd'));
  const nextMonth = () => setSelectedMonth(format(addMonths(new Date(selectedMonth), 1), 'yyyy-MM-dd'));
  const monthLabel = format(new Date(selectedMonth), 'MMMM yyyy');

  // Categories not yet added as trackers
  const availableCategories = useMemo(() => {
    if (!plan) return categories;
    const usedIds = new Set(plan.trackers.map(t => t.category_id).filter(Boolean));
    return categories.filter(c => !usedIds.has(c.id));
  }, [categories, plan?.trackers]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8">
      <Header />
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-3xl">
        {/* Month Selector */}
        <div className="flex items-center justify-between mb-5">
          <button onClick={prevMonth} className="p-2 rounded-xl hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-all active:scale-95">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            <h2 className="text-lg sm:text-xl font-bold text-foreground">{monthLabel}</h2>
          </div>
          <button onClick={nextMonth} className="p-2 rounded-xl hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-all active:scale-95">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* No plan yet */}
        {!plan ? (
          <div className="rounded-2xl border border-border bg-card p-8 sm:p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <CalendarDays className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No plan for {monthLabel}</h3>
            <p className="text-sm text-muted-foreground mb-6">Create a monthly budget to track income, expenses, and investments.</p>
            <button
              onClick={createPlan}
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Create Plan
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* ─── Income ─── */}
            <Section icon={IndianRupee} title="Income" color="text-green-500">
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={plan.income_label}
                  onChange={e => savePlanDebounced({ income_label: e.target.value })}
                  className="flex-1 min-w-0 bg-transparent text-sm font-medium text-foreground border-b border-border/50 focus:border-primary/50 outline-none py-1 transition-colors"
                  placeholder="Income source"
                />
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground">₹</span>
                  <input
                    type="number"
                    value={plan.income || ''}
                    onChange={e => savePlanDebounced({ income: Number(e.target.value) || 0 })}
                    className="w-28 bg-transparent text-sm font-bold text-green-500 text-right border-b border-border/50 focus:border-primary/50 outline-none py-1 transition-colors"
                    placeholder="0"
                  />
                </div>
              </div>
            </Section>

            {/* ─── Fixed Allocations ─── */}
            <Section icon={Target} title="Allocations" color="text-blue-500"
              subtitle={`₹${totalAllocations.toLocaleString('en-IN')} of ₹${plan.income.toLocaleString('en-IN')}`}
            >
              <AllocationList
                allocations={plan.allocations}
                onToggle={toggleAllocation}
                onEdit={editAllocation}
                onRemove={removeAllocation}
              />
              <AddItemRow
                placeholder="Allocation name"
                onAdd={(title, amount) => addAllocation(title, amount)}
              />
              <div className="pt-3 mt-3 border-t border-border/30 flex justify-between text-sm">
                <span className="text-muted-foreground">Remaining Balance</span>
                <span className={`font-bold ${totalBalance >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  ₹{totalBalance.toLocaleString('en-IN')}
                </span>
              </div>
            </Section>

            {/* ─── Balance Distribution ─── */}
            <Section icon={Wallet} title="Balance Distribution" color="text-purple-500"
              subtitle={`₹${totalBalanceDistributed.toLocaleString('en-IN')} distributed`}
            >
              {plan.balance_distribution.map(b => (
                <EditableRow
                  key={b.id}
                  label={b.account}
                  amount={b.amount}
                  onSave={(label, amount) => editBalanceItem(b.id, { account: label, amount })}
                  onRemove={() => removeBalanceItem(b.id)}
                />
              ))}
              <AddItemRow
                placeholder="Account name"
                onAdd={(name, amount) => addBalanceItem(name, amount)}
              />
            </Section>

            {/* ─── Spending Trackers ─── */}
            <SpendingTrackersSection
              trackers={plan.trackers}
              totalBudgets={totalTrackerBudgets}
              totalSpent={totalTrackerSpent}
              expensesByCategory={expensesByCategory}
              categories={categories}
              availableCategories={availableCategories}
              onAddTracker={addTracker}
              onEditTracker={editTracker}
              onRemoveTracker={removeTracker}
            />

            {/* ─── Investments ─── */}
            <Section icon={TrendingUp} title="Investments" color="text-emerald-500"
              subtitle={`₹${totalInvested.toLocaleString('en-IN')} invested`}
            >
              {plan.investments.map(inv => (
                <EditableRow
                  key={inv.id}
                  label={inv.name}
                  amount={inv.amount}
                  subtitle={inv.description}
                  amountColor="text-emerald-500"
                  onSave={(name, amount) => editInvestment(inv.id, { name, amount })}
                  onRemove={() => removeInvestment(inv.id)}
                />
              ))}
              <AddInvestmentRow onAdd={(name, amount, desc) => addInvestment(name, amount, desc)} />
            </Section>

            {/* ─── Notes ─── */}
            <Section icon={StickyNote} title="Notes" color="text-yellow-500">
              <textarea
                value={plan.notes}
                onChange={e => savePlanDebounced({ notes: e.target.value })}
                rows={3}
                className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 border border-border/30 rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-primary/30 resize-none transition-all"
                placeholder="Any notes for this month..."
              />
            </Section>

            {/* ─── Summary ─── */}
            <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
              <h3 className="text-sm font-semibold text-foreground mb-3">Monthly Summary</h3>
              <div className="space-y-2 text-sm">
                <SummaryRow label="Income" value={plan.income} color="text-green-500" />
                <SummaryRow label="Allocations" value={-totalAllocations} color="text-red-400" />
                <SummaryRow label="Remaining" value={totalBalance} color={totalBalance >= 0 ? 'text-green-500' : 'text-red-500'} bold />
                <div className="border-t border-border/30 pt-2 mt-2" />
                <SummaryRow label="Tracker Budget" value={totalTrackerBudgets} color="text-orange-400" />
                <SummaryRow label="Tracker Spent" value={-totalTrackerSpent} color="text-red-400" />
                <SummaryRow label="Investments" value={totalInvested} color="text-emerald-500" />
              </div>
            </div>

            {/* Save indicator + Delete */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                {saving ? (
                  <><Loader2 className="h-3 w-3 animate-spin" /> Saving...</>
                ) : (
                  <><Save className="h-3 w-3" /> Auto-saved</>
                )}
              </div>
              <button
                onClick={() => {
                  if (confirm('Delete this monthly plan? This cannot be undone.')) deletePlan();
                }}
                className="text-xs text-muted-foreground hover:text-red-500 transition-colors flex items-center gap-1"
              >
                <Trash2 className="h-3 w-3" /> Delete plan
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════
   Spending Trackers — pulls real expense data
   ═══════════════════════════════════════════════ */
function SpendingTrackersSection({
  trackers, totalBudgets, totalSpent, expensesByCategory,
  categories, availableCategories,
  onAddTracker, onEditTracker, onRemoveTracker,
}: {
  trackers: Tracker[];
  totalBudgets: number;
  totalSpent: number;
  expensesByCategory: Record<string, Expense[]>;
  categories: ExpenseCategory[];
  availableCategories: ExpenseCategory[];
  onAddTracker: (name: string, budget: number, categoryId?: string) => void;
  onEditTracker: (id: string, updates: Partial<Omit<Tracker, 'id'>>) => void;
  onRemoveTracker: (id: string) => void;
}) {
  const [view, setView] = useState<'monthly' | 'weekly'>('monthly');
  const [addingNew, setAddingNew] = useState(false);
  const [newBudget, setNewBudget] = useState('');
  const [selectedCatId, setSelectedCatId] = useState('');

  const handleAddTracker = () => {
    if (!selectedCatId || !newBudget) return;
    const cat = categories.find(c => c.id === selectedCatId);
    if (!cat) return;
    onAddTracker(cat.name, Number(newBudget), cat.id);
    setSelectedCatId('');
    setNewBudget('');
    setAddingNew(false);
  };

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="px-4 sm:px-5 pt-4 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PiggyBank className="h-4 w-4 text-orange-500" />
          <h3 className="text-sm font-semibold text-foreground">Spending Trackers</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-muted-foreground">
            ₹{totalSpent.toLocaleString('en-IN')} of ₹{totalBudgets.toLocaleString('en-IN')}
          </span>
          <div className="flex rounded-lg bg-muted/40 p-0.5">
            <button
              onClick={() => setView('monthly')}
              className={`px-2 py-0.5 rounded-md text-[10px] font-medium transition-all ${view === 'monthly' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >M</button>
            <button
              onClick={() => setView('weekly')}
              className={`px-2 py-0.5 rounded-md text-[10px] font-medium transition-all ${view === 'weekly' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >W</button>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-5 pb-4">
        {view === 'weekly' ? (
          <div className="space-y-1">
            {trackers.map(t => {
              const spent = t.category_id ? (expensesByCategory[t.category_id] || []).reduce((s, e) => s + e.amount, 0) : 0;
              return (
                <div key={t.id} className="flex items-center justify-between py-1.5">
                  <span className="text-sm text-foreground">{t.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">
                      ~₹{Math.round(spent / 4).toLocaleString('en-IN')} spent
                    </span>
                    <span className="text-sm font-semibold text-foreground w-20 text-right">
                      ₹{Math.round(t.budget / 4).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              );
            })}
            <div className="pt-2 mt-2 border-t border-border/30 flex justify-between text-sm">
              <span className="text-muted-foreground font-medium">Total / week</span>
              <span className="font-bold text-orange-500">
                ~₹{Math.round(totalBudgets / 4).toLocaleString('en-IN')} / week
              </span>
            </div>
          </div>
        ) : (
          <>
            {trackers.map(tracker => (
              <TrackerCard
                key={tracker.id}
                tracker={tracker}
                expenses={tracker.category_id ? (expensesByCategory[tracker.category_id] || []) : []}
                onEdit={(updates) => onEditTracker(tracker.id, updates)}
                onRemove={() => onRemoveTracker(tracker.id)}
              />
            ))}

            {/* Add tracker from categories */}
            {addingNew ? (
              <div className="flex items-center gap-2 pt-2">
                <select
                  value={selectedCatId}
                  onChange={e => {
                    setSelectedCatId(e.target.value);
                    const cat = categories.find(c => c.id === e.target.value);
                    if (cat) {
                      const defaultBudget = DEFAULT_BUDGETS[cat.name.toLowerCase()];
                      if (defaultBudget) setNewBudget(String(defaultBudget));
                    }
                  }}
                  className="flex-1 min-w-0 h-8 px-2 rounded-lg bg-muted/30 border border-border/30 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30"
                >
                  <option value="">Select category</option>
                  {availableCategories.map(c => (
                    <option key={c.id} value={c.id}>{c.icon ? `${c.icon} ` : ''}{c.name}</option>
                  ))}
                </select>
                <input
                  value={newBudget}
                  onChange={e => setNewBudget(e.target.value)}
                  placeholder="Budget"
                  type="number"
                  onKeyDown={e => e.key === 'Enter' && handleAddTracker()}
                  className="w-20 sm:w-24 h-8 px-2.5 rounded-lg bg-muted/30 border border-border/30 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/30 text-right transition-all"
                />
                <button onClick={handleAddTracker} className="h-8 w-8 shrink-0 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 flex items-center justify-center transition-all active:scale-95">
                  <Plus className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => { setAddingNew(false); setSelectedCatId(''); setNewBudget(''); }} className="h-8 w-8 shrink-0 rounded-lg bg-muted/30 text-muted-foreground hover:text-foreground flex items-center justify-center transition-all">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setAddingNew(true)}
                className="flex items-center gap-1.5 pt-2 text-xs text-primary hover:text-primary/80 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" /> Add category tracker
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Tracker Card — shows real expenses
   ═══════════════════════════════════════════════ */
function TrackerCard({
  tracker, expenses, onEdit, onRemove,
}: {
  tracker: Tracker;
  expenses: Expense[];
  onEdit: (updates: Partial<Omit<Tracker, 'id'>>) => void;
  onRemove: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editBudget, setEditBudget] = useState(String(tracker.budget));

  const spent = expenses.reduce((s, e) => s + e.amount, 0);
  const pct = tracker.budget > 0 ? Math.min((spent / tracker.budget) * 100, 100) : 0;
  const over = spent > tracker.budget;

  const saveBudget = () => {
    const val = Number(editBudget);
    if (val > 0 && val !== tracker.budget) onEdit({ budget: val });
    setEditing(false);
  };

  return (
    <div className="border border-border/30 rounded-xl mb-2 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-3 hover:bg-muted/20 transition-colors"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-medium text-foreground truncate">{tracker.name}</span>
          <span className="text-[11px] text-muted-foreground shrink-0">
            ₹{spent.toLocaleString('en-IN')} / ₹{tracker.budget.toLocaleString('en-IN')}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-16 h-1.5 rounded-full bg-muted/50 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${over ? 'bg-red-500' : 'bg-primary'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${open ? 'rotate-90' : ''}`} />
        </div>
      </button>

      {open && (
        <div className="px-3 pb-3 space-y-1 animate-fade-in">
          {/* Budget edit */}
          <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-border/20">
            {editing ? (
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-muted-foreground">Budget: ₹</span>
                <input
                  autoFocus
                  value={editBudget}
                  onChange={e => setEditBudget(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') saveBudget(); if (e.key === 'Escape') setEditing(false); }}
                  onBlur={saveBudget}
                  type="number"
                  className="w-20 h-6 px-1.5 rounded bg-muted/30 border border-border/30 text-xs text-foreground text-right focus:outline-none focus:ring-1 focus:ring-primary/30"
                />
              </div>
            ) : (
              <button onClick={(e) => { e.stopPropagation(); setEditing(true); setEditBudget(String(tracker.budget)); }} className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary transition-colors">
                <Pencil className="h-2.5 w-2.5" /> Budget: ₹{tracker.budget.toLocaleString('en-IN')}
              </button>
            )}
            <button onClick={onRemove} className="text-[11px] text-muted-foreground hover:text-red-500 transition-colors">
              Remove
            </button>
          </div>

          {/* Real expenses from dashboard */}
          {expenses.length > 0 ? (
            <div className="grid grid-cols-[auto_1fr_auto] gap-x-3 gap-y-1 text-xs">
              <span className="text-muted-foreground font-medium">Date</span>
              <span className="text-muted-foreground font-medium">Description</span>
              <span className="text-muted-foreground font-medium text-right">Amount</span>
              {expenses.map(e => (
                <div key={e.id} className="contents">
                  <span className="text-muted-foreground py-0.5">{format(parseISO(e.date), 'dd/MM')}</span>
                  <span className="text-foreground py-0.5 truncate">{e.title}</span>
                  <span className="text-foreground font-medium text-right py-0.5">₹{e.amount.toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-muted-foreground py-2">No expenses logged in this category yet.</p>
          )}

          <div className="flex justify-between items-center pt-2 border-t border-border/20">
            <span className="text-[11px] text-muted-foreground">
              {over ? `Over by ₹${(spent - tracker.budget).toLocaleString('en-IN')}` : `₹${(tracker.budget - spent).toLocaleString('en-IN')} left`}
            </span>
            <span className="text-[11px] text-muted-foreground">{expenses.length} expense{expenses.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Section wrapper
   ═══════════════════════════════════════════════ */
function Section({
  icon: Icon, title, color, subtitle, children
}: {
  icon: any; title: string; color: string; subtitle?: string; children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="px-4 sm:px-5 pt-4 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className={`h-4 w-4 ${color}`} />
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        </div>
        {subtitle && <span className="text-[11px] text-muted-foreground">{subtitle}</span>}
      </div>
      <div className="px-4 sm:px-5 pb-4">{children}</div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Allocation List (with inline edit)
   ═══════════════════════════════════════════════ */
function AllocationList({
  allocations, onToggle, onEdit, onRemove
}: {
  allocations: { id: string; title: string; amount: number; completed: boolean }[];
  onToggle: (id: string) => void;
  onEdit: (id: string, updates: { title?: string; amount?: number }) => void;
  onRemove: (id: string) => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editAmount, setEditAmount] = useState('');

  const startEdit = (a: typeof allocations[0]) => {
    setEditingId(a.id);
    setEditTitle(a.title);
    setEditAmount(String(a.amount));
  };

  const saveEdit = () => {
    if (editingId && editTitle.trim()) {
      onEdit(editingId, { title: editTitle.trim(), amount: Number(editAmount) || 0 });
    }
    setEditingId(null);
  };

  return (
    <div className="space-y-0.5">
      {allocations.map(a => (
        <div key={a.id} className="flex items-center gap-2.5 py-1.5 group">
          <button
            onClick={() => onToggle(a.id)}
            className={`w-5 h-5 shrink-0 rounded-md border-2 flex items-center justify-center transition-all ${
              a.completed ? 'bg-primary border-primary' : 'border-border hover:border-primary/50'
            }`}
          >
            {a.completed && <Check className="h-3 w-3 text-primary-foreground" />}
          </button>
          {editingId === a.id ? (
            <>
              <input autoFocus value={editTitle} onChange={e => setEditTitle(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') setEditingId(null); }}
                className="flex-1 min-w-0 h-7 px-1.5 rounded bg-muted/30 border border-border/30 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30" />
              <input value={editAmount} onChange={e => setEditAmount(e.target.value)} type="number"
                onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') setEditingId(null); }}
                onBlur={saveEdit}
                className="w-20 h-7 px-1.5 rounded bg-muted/30 border border-border/30 text-xs text-foreground text-right focus:outline-none focus:ring-1 focus:ring-primary/30" />
            </>
          ) : (
            <>
              <span
                onClick={() => !a.completed && startEdit(a)}
                className={`flex-1 text-sm cursor-pointer ${a.completed ? 'line-through text-muted-foreground' : 'text-foreground hover:text-primary'}`}
              >
                {a.title}
              </span>
              <span
                onClick={() => !a.completed && startEdit(a)}
                className={`text-sm font-semibold cursor-pointer ${a.completed ? 'text-muted-foreground' : 'text-foreground hover:text-primary'}`}
              >
                ₹{a.amount.toLocaleString('en-IN')}
              </span>
            </>
          )}
          <button onClick={() => onRemove(a.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-500 transition-all p-0.5">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Editable Row (for balance distribution, investments)
   ═══════════════════════════════════════════════ */
function EditableRow({
  label, amount, subtitle, amountColor = 'text-foreground', onSave, onRemove,
}: {
  label: string; amount: number; subtitle?: string; amountColor?: string;
  onSave: (label: string, amount: number) => void;
  onRemove: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editLabel, setEditLabel] = useState(label);
  const [editAmount, setEditAmount] = useState(String(amount));

  const save = () => {
    if (editLabel.trim()) onSave(editLabel.trim(), Number(editAmount) || 0);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex items-center gap-2 py-1.5">
        <input autoFocus value={editLabel} onChange={e => setEditLabel(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false); }}
          className="flex-1 min-w-0 h-7 px-1.5 rounded bg-muted/30 border border-border/30 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/30" />
        <input value={editAmount} onChange={e => setEditAmount(e.target.value)} type="number"
          onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false); }}
          onBlur={save}
          className="w-24 h-7 px-1.5 rounded bg-muted/30 border border-border/30 text-xs text-foreground text-right focus:outline-none focus:ring-1 focus:ring-primary/30" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between py-1.5 group">
      <div className="min-w-0 flex-1 cursor-pointer" onClick={() => setEditing(true)}>
        <span className="text-sm text-foreground hover:text-primary transition-colors">{label}</span>
        {subtitle && <span className="text-xs text-muted-foreground ml-2">— {subtitle}</span>}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span onClick={() => setEditing(true)} className={`text-sm font-semibold cursor-pointer hover:text-primary transition-colors ${amountColor}`}>
          ₹{amount.toLocaleString('en-IN')}
        </span>
        <button onClick={onRemove} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-500 transition-all p-0.5">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Add rows
   ═══════════════════════════════════════════════ */
function AddItemRow({
  placeholder, amountPlaceholder = 'Amount', onAdd
}: {
  placeholder: string; amountPlaceholder?: string; onAdd: (name: string, amount: number) => void;
}) {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');

  const submit = () => {
    if (!name.trim() || !amount) return;
    onAdd(name.trim(), Number(amount));
    setName('');
    setAmount('');
  };

  return (
    <div className="flex items-center gap-2 pt-2">
      <input value={name} onChange={e => setName(e.target.value)} placeholder={placeholder}
        onKeyDown={e => e.key === 'Enter' && submit()}
        className="flex-1 min-w-0 h-8 px-2.5 rounded-lg bg-muted/30 border border-border/30 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all" />
      <input value={amount} onChange={e => setAmount(e.target.value)} placeholder={amountPlaceholder} type="number"
        onKeyDown={e => e.key === 'Enter' && submit()}
        className="w-20 sm:w-24 h-8 px-2.5 rounded-lg bg-muted/30 border border-border/30 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/30 text-right transition-all" />
      <button onClick={submit} className="h-8 w-8 shrink-0 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 flex items-center justify-center transition-all active:scale-95">
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function AddInvestmentRow({ onAdd }: { onAdd: (name: string, amount: number, desc: string) => void }) {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');

  const submit = () => {
    if (!name.trim() || !amount) return;
    onAdd(name.trim(), Number(amount), desc.trim());
    setName(''); setAmount(''); setDesc('');
  };

  return (
    <div className="flex items-center gap-1.5 pt-2 flex-wrap sm:flex-nowrap">
      <input value={name} onChange={e => setName(e.target.value)} placeholder="Name (e.g. Gold ETF)"
        onKeyDown={e => e.key === 'Enter' && submit()}
        className="flex-1 min-w-[100px] h-8 px-2.5 rounded-lg bg-muted/30 border border-border/30 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all" />
      <input value={amount} onChange={e => setAmount(e.target.value)} placeholder="₹ Amount" type="number"
        onKeyDown={e => e.key === 'Enter' && submit()}
        className="w-20 sm:w-24 h-8 px-2.5 rounded-lg bg-muted/30 border border-border/30 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/30 text-right transition-all" />
      <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Note"
        onKeyDown={e => e.key === 'Enter' && submit()}
        className="w-20 sm:flex-1 h-8 px-2.5 rounded-lg bg-muted/30 border border-border/30 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all" />
      <button onClick={submit} className="h-8 w-8 shrink-0 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 flex items-center justify-center transition-all active:scale-95">
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Summary row
   ═══════════════════════════════════════════════ */
function SummaryRow({ label, value, color, bold }: { label: string; value: number; color: string; bold?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={`${color} ${bold ? 'font-bold' : 'font-medium'}`}>
        {value < 0 ? '−' : ''}₹{Math.abs(value).toLocaleString('en-IN')}
      </span>
    </div>
  );
}

export default MonthlyPlan;
