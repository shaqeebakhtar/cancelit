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
  // Credits (refunds, cashback on credit card statements)
  | 'Refund'
  | 'Cashback'
  // Payments & Transfers
  | 'Payment'
  // Catch-all
  | 'Other';

// Categories that represent spending (debits/charges)
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
  'Other',
];

// Categories that represent credits (refunds, cashback)
export const CREDIT_CATEGORIES: TransactionCategory[] = [
  'Refund',
  'Cashback',
  'Payment',
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
