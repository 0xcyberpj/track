import { useState } from 'react';
import { Header } from '@/components/Header';
import { useMonthlyPlan, Tracker } from '@/hooks/useMonthlyPlan';
import { toast } from '@/hooks/use-toast';
import {
  ChevronLeft, ChevronRight, Plus, Trash2, Check, X,
  Loader2, CalendarDays, IndianRupee, TrendingUp, Wallet,
  Target, PiggyBank, StickyNote, Save
} from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth } from 'date-fns';

const MonthlyPlan = () => {
  const [selectedMonth, setSelectedMonth] = useState(() =>
    format(startOfMonth(new Date()), 'yyyy-MM-dd')
  );

  const {
    plan, loading, saving, createPlan, savePlan, deletePlan,
    addAllocation, toggleAllocation, removeAllocation,
    addBalanceItem, removeBalanceItem,
    addTracker, removeTracker, addTrackerEntry, removeTrackerEntry,
    addInvestment, removeInvestment,
    totalAllocations, totalBalance, totalBalanceDistributed,
    totalTrackerBudgets, totalTrackerSpent, totalInvested,
  } = useMonthlyPlan(selectedMonth);

  const prevMonth = () => setSelectedMonth(format(subMonths(new Date(selectedMonth), 1), 'yyyy-MM-dd'));
  const nextMonth = () => setSelectedMonth(format(addMonths(new Date(selectedMonth), 1), 'yyyy-MM-dd'));
  const monthLabel = format(new Date(selectedMonth), 'MMMM yyyy');

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
                  onChange={e => savePlan({ income_label: e.target.value })}
                  className="flex-1 min-w-0 bg-transparent text-sm font-medium text-foreground border-b border-border/50 focus:border-primary/50 outline-none py-1 transition-colors"
                  placeholder="Income source"
                />
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground">₹</span>
                  <input
                    type="number"
                    value={plan.income || ''}
                    onChange={e => savePlan({ income: Number(e.target.value) || 0 })}
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
                onRemove={removeAllocation}
              />
              <AddItemRow
                placeholder="Allocation name"
                onAdd={(title, amount) => addAllocation(title, amount)}
              />
              {/* Remaining after allocations */}
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
                <div key={b.id} className="flex items-center justify-between py-1.5 group">
                  <span className="text-sm text-foreground">{b.account}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">₹{b.amount.toLocaleString('en-IN')}</span>
                    <button onClick={() => removeBalanceItem(b.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-500 transition-all p-0.5">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
              <AddItemRow
                placeholder="Account name"
                onAdd={(name, amount) => addBalanceItem(name, amount)}
              />
            </Section>

            {/* ─── Spending Trackers ─── */}
            <Section icon={PiggyBank} title="Spending Trackers" color="text-orange-500"
              subtitle={`₹${totalTrackerSpent.toLocaleString('en-IN')} of ₹${totalTrackerBudgets.toLocaleString('en-IN')} budget`}
            >
              {plan.trackers.map(tracker => (
                <TrackerCard
                  key={tracker.id}
                  tracker={tracker}
                  onAddEntry={(date, desc, amt) => addTrackerEntry(tracker.id, date, desc, amt)}
                  onRemoveEntry={(entryId) => removeTrackerEntry(tracker.id, entryId)}
                  onRemove={() => removeTracker(tracker.id)}
                />
              ))}
              <AddItemRow
                placeholder="Category name"
                amountPlaceholder="Budget"
                onAdd={(name, budget) => addTracker(name, budget)}
              />
            </Section>

            {/* ─── Investments ─── */}
            <Section icon={TrendingUp} title="Investments" color="text-emerald-500"
              subtitle={`₹${totalInvested.toLocaleString('en-IN')} invested`}
            >
              {plan.investments.map(inv => (
                <div key={inv.id} className="flex items-center justify-between py-1.5 group">
                  <div className="min-w-0 flex-1">
                    <span className="text-sm text-foreground">{inv.name}</span>
                    {inv.description && <span className="text-xs text-muted-foreground ml-2">— {inv.description}</span>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm font-semibold text-emerald-500">₹{inv.amount.toLocaleString('en-IN')}</span>
                    <button onClick={() => removeInvestment(inv.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-500 transition-all p-0.5">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
              <AddInvestmentRow onAdd={(name, amount, desc) => addInvestment(name, amount, desc)} />
            </Section>

            {/* ─── Notes ─── */}
            <Section icon={StickyNote} title="Notes" color="text-yellow-500">
              <textarea
                value={plan.notes}
                onChange={e => savePlan({ notes: e.target.value })}
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
   Allocation List
   ═══════════════════════════════════════════════ */
function AllocationList({
  allocations, onToggle, onRemove
}: {
  allocations: { id: string; title: string; amount: number; completed: boolean }[];
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
}) {
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
          <span className={`flex-1 text-sm ${a.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
            {a.title}
          </span>
          <span className={`text-sm font-semibold ${a.completed ? 'text-muted-foreground' : 'text-foreground'}`}>
            ₹{a.amount.toLocaleString('en-IN')}
          </span>
          <button onClick={() => onRemove(a.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-500 transition-all p-0.5">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Tracker Card (category + entries table)
   ═══════════════════════════════════════════════ */
function TrackerCard({
  tracker, onAddEntry, onRemoveEntry, onRemove
}: {
  tracker: Tracker;
  onAddEntry: (date: string, desc: string, amount: number) => void;
  onRemoveEntry: (entryId: string) => void;
  onRemove: () => void;
}) {
  const [open, setOpen] = useState(false);
  const spent = tracker.entries.reduce((s, e) => s + e.amount, 0);
  const pct = tracker.budget > 0 ? Math.min((spent / tracker.budget) * 100, 100) : 0;
  const over = spent > tracker.budget;

  return (
    <div className="border border-border/30 rounded-xl mb-2 overflow-hidden">
      {/* Header */}
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

      {/* Entries */}
      {open && (
        <div className="px-3 pb-3 space-y-1 animate-fade-in">
          {tracker.entries.length > 0 && (
            <div className="grid grid-cols-[auto_1fr_auto_auto] gap-x-3 gap-y-1 text-xs">
              <span className="text-muted-foreground font-medium">Date</span>
              <span className="text-muted-foreground font-medium">Description</span>
              <span className="text-muted-foreground font-medium text-right">Amount</span>
              <span />
              {tracker.entries.map(e => (
                <div key={e.id} className="contents group">
                  <span className="text-muted-foreground py-0.5">{e.date}</span>
                  <span className="text-foreground py-0.5 truncate">{e.description}</span>
                  <span className="text-foreground font-medium text-right py-0.5">₹{e.amount.toLocaleString('en-IN')}</span>
                  <button onClick={() => onRemoveEntry(e.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-500 p-0.5 transition-all">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <AddEntryRow onAdd={onAddEntry} />
          <div className="flex justify-between items-center pt-2 border-t border-border/20">
            <span className="text-[11px] text-muted-foreground">
              {over ? `Over by ₹${(spent - tracker.budget).toLocaleString('en-IN')}` : `₹${(tracker.budget - spent).toLocaleString('en-IN')} left`}
            </span>
            <button onClick={onRemove} className="text-[11px] text-muted-foreground hover:text-red-500 transition-colors">
              Remove tracker
            </button>
          </div>
        </div>
      )}
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
      <input
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder={placeholder}
        onKeyDown={e => e.key === 'Enter' && submit()}
        className="flex-1 min-w-0 h-8 px-2.5 rounded-lg bg-muted/30 border border-border/30 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all"
      />
      <input
        value={amount}
        onChange={e => setAmount(e.target.value)}
        placeholder={amountPlaceholder}
        type="number"
        onKeyDown={e => e.key === 'Enter' && submit()}
        className="w-20 sm:w-24 h-8 px-2.5 rounded-lg bg-muted/30 border border-border/30 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/30 text-right transition-all"
      />
      <button onClick={submit} className="h-8 w-8 shrink-0 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 flex items-center justify-center transition-all active:scale-95">
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function AddEntryRow({ onAdd }: { onAdd: (date: string, desc: string, amount: number) => void }) {
  const [date, setDate] = useState('');
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');

  const submit = () => {
    if (!desc.trim() || !amount) return;
    onAdd(date || format(new Date(), 'dd/MM'), desc.trim(), Number(amount));
    setDate('');
    setDesc('');
    setAmount('');
  };

  return (
    <div className="flex items-center gap-1.5 pt-1.5">
      <input value={date} onChange={e => setDate(e.target.value)} placeholder="Date" onKeyDown={e => e.key === 'Enter' && submit()}
        className="w-14 sm:w-16 h-7 px-1.5 rounded-md bg-muted/30 border border-border/30 text-[11px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all" />
      <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Description" onKeyDown={e => e.key === 'Enter' && submit()}
        className="flex-1 min-w-0 h-7 px-1.5 rounded-md bg-muted/30 border border-border/30 text-[11px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all" />
      <input value={amount} onChange={e => setAmount(e.target.value)} placeholder="₹" type="number" onKeyDown={e => e.key === 'Enter' && submit()}
        className="w-16 h-7 px-1.5 rounded-md bg-muted/30 border border-border/30 text-[11px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/30 text-right transition-all" />
      <button onClick={submit} className="h-7 w-7 shrink-0 rounded-md bg-primary/10 text-primary hover:bg-primary/20 flex items-center justify-center transition-all active:scale-95">
        <Plus className="h-3 w-3" />
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
    setName('');
    setAmount('');
    setDesc('');
  };

  return (
    <div className="flex items-center gap-1.5 pt-2 flex-wrap sm:flex-nowrap">
      <input value={name} onChange={e => setName(e.target.value)} placeholder="Name (e.g. Gold ETF)" onKeyDown={e => e.key === 'Enter' && submit()}
        className="flex-1 min-w-[100px] h-8 px-2.5 rounded-lg bg-muted/30 border border-border/30 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all" />
      <input value={amount} onChange={e => setAmount(e.target.value)} placeholder="₹ Amount" type="number" onKeyDown={e => e.key === 'Enter' && submit()}
        className="w-20 sm:w-24 h-8 px-2.5 rounded-lg bg-muted/30 border border-border/30 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/30 text-right transition-all" />
      <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Note" onKeyDown={e => e.key === 'Enter' && submit()}
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
