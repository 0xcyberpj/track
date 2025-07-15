import { Plus } from 'lucide-react';

const FloatingAddExpenseButton = () => (
  <button
    className="fixed right-6 bottom-[88px] z-50 bg-primary text-primary-foreground rounded-full shadow-lg p-4 flex items-center justify-center hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary"
    style={{ boxShadow: '0 4px 24px 0 rgba(0,0,0,0.15)' }}
    onClick={() => window.dispatchEvent(new CustomEvent('open-quick-modal'))}
    aria-label="Add Expense"
  >
    <Plus width={28} height={28} />
  </button>
);

export default FloatingAddExpenseButton; 