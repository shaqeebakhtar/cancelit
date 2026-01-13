// Transaction types and category definitions

export type TransactionType = 'debit' | 'credit';

export type TransactionCategory =
  // Recurring Payments
  | 'Subscription'
  | 'Bill & Utility'
  | 'Rent'
  | 'EMI & Loan'
  | 'Insurance'
  // Daily Spending
  | 'Food & Dining'
  | 'Groceries'
  | 'Shopping'
  | 'Transportation'
  | 'Fuel'
  | 'Entertainment'
  | 'Healthcare'
  | 'Education'
  | 'Travel'
  | 'Personal Care'
  // Income & Credits
  | 'Salary'
  | 'Freelance Income'
  | 'Refund'
  | 'Cashback'
  | 'Investment Return'
  | 'Interest'
  // Transfers
  | 'Transfer Out'
  | 'Transfer In'
  | 'ATM Withdrawal'
  | 'UPI Payment'
  // Catch-all
  | 'Other';

// Categories that represent spending (debits)
export const SPENDING_CATEGORIES: TransactionCategory[] = [
  'Subscription',
  'Bill & Utility',
  'Rent',
  'EMI & Loan',
  'Insurance',
  'Food & Dining',
  'Groceries',
  'Shopping',
  'Transportation',
  'Fuel',
  'Entertainment',
  'Healthcare',
  'Education',
  'Travel',
  'Personal Care',
  'Transfer Out',
  'ATM Withdrawal',
  'UPI Payment',
  'Other',
];

// Categories that represent income (credits)
export const INCOME_CATEGORIES: TransactionCategory[] = [
  'Salary',
  'Freelance Income',
  'Refund',
  'Cashback',
  'Investment Return',
  'Interest',
  'Transfer In',
];

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: TransactionCategory;
  isRecurring: boolean;
  merchantName?: string;
  confidence: number; // AI confidence 0-1
}
