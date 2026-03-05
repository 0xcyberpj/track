import { Plus } from 'lucide-react';

const FloatingAddExpenseButton = () => (
  <button
    className="fixed right-5 bottom-[72px] z-40 bg-primary text-white rounded-2xl p-3 flex items-center justify-center hover:bg-primary/90 focus:outline-none active:scale-90 transition-all"
    style={{ boxShadow: '0 4px 24px -4px hsl(152 72% 40% / 0.35), 0 0 0 1px hsl(152 72% 40% / 0.1)' }}
    onClick={() => window.dispatchEvent(new CustomEvent('open-quick-modal'))}
    aria-label="Add Expense"
  >
    <Plus width={20} height={20} strokeWidth={2.5} />
  </button>
);

export default FloatingAddExpenseButton;
