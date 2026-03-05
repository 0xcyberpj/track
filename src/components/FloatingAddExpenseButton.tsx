import { Plus } from 'lucide-react';

const FloatingAddExpenseButton = () => (
  <button
    className="fixed right-5 bottom-[72px] z-40 bg-primary text-primary-foreground rounded-2xl shadow-lg p-3.5 flex items-center justify-center hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary active:scale-95 transition-transform"
    style={{ boxShadow: '0 4px 20px 0 hsl(152 70% 42% / 0.3)' }}
    onClick={() => window.dispatchEvent(new CustomEvent('open-quick-modal'))}
    aria-label="Add Expense"
  >
    <Plus width={22} height={22} />
  </button>
);

export default FloatingAddExpenseButton;
