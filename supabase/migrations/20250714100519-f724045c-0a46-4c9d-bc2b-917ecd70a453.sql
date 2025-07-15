-- Add icon field to expense_categories
ALTER TABLE expense_categories ADD COLUMN icon TEXT DEFAULT '💰';

-- Update existing categories with appropriate emojis
UPDATE expense_categories SET icon = '🍽️' WHERE name = 'Food & Dining';
UPDATE expense_categories SET icon = '🚗' WHERE name = 'Transportation';
UPDATE expense_categories SET icon = '🛍️' WHERE name = 'Shopping';
UPDATE expense_categories SET icon = '🎬' WHERE name = 'Entertainment';
UPDATE expense_categories SET icon = '💡' WHERE name = 'Bills & Utilities';
UPDATE expense_categories SET icon = '🏥' WHERE name = 'Healthcare';
UPDATE expense_categories SET icon = '📚' WHERE name = 'Education';
UPDATE expense_categories SET icon = '✈️' WHERE name = 'Travel';
UPDATE expense_categories SET icon = '💅' WHERE name = 'Personal Care';
UPDATE expense_categories SET icon = '📦' WHERE name = 'Other';