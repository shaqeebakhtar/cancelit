// Sanitize and validate AI responses

import type {
  FullAnalysisResult,
  Subscription,
  SubscriptionCategory,
  Transaction,
  TransactionCategory,
  CategoryBreakdown,
  MerchantSummary,
} from '../types';

// Valid category constants for validation
export const VALID_SUBSCRIPTION_CATEGORIES: SubscriptionCategory[] = [
  'Streaming',
  'Music',
  'Cloud Storage',
  'Productivity',
  'Gaming',
  'News & Reading',
  'Fitness',
  'Finance',
  'Shopping',
  'Food & Delivery',
  'Transportation',
  'Other',
];

export const VALID_TRANSACTION_CATEGORIES: TransactionCategory[] = [
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
  'Refund',
  'Cashback',
  'Payment',
  'Other',
];

/**
 * Clean JSON response string from AI (remove markdown code blocks)
 */
export function cleanJsonResponse(text: string): string {
  let jsonString = text.trim();
  
  if (jsonString.startsWith('```json')) {
    jsonString = jsonString.slice(7);
  }
  if (jsonString.startsWith('```')) {
    jsonString = jsonString.slice(3);
  }
  if (jsonString.endsWith('```')) {
    jsonString = jsonString.slice(0, -3);
  }
  
  return jsonString.trim();
}

/**
 * Clean CSV response string from AI (remove markdown code blocks)
 */
export function cleanCsvResponse(text: string): string {
  let csvString = text.trim();
  
  if (csvString.startsWith('```csv')) {
    csvString = csvString.slice(6);
  }
  if (csvString.startsWith('```')) {
    csvString = csvString.slice(3);
  }
  if (csvString.endsWith('```')) {
    csvString = csvString.slice(0, -3);
  }
  
  return csvString.trim();
}

/**
 * Sanitize and validate the full analysis result from AI
 */
export function sanitizeFullAnalysisResult(
  result: FullAnalysisResult
): FullAnalysisResult {
  // Sanitize subscriptions
  const sanitizedSubscriptions: Subscription[] = (
    result.subscriptions || []
  ).map((sub, index) => ({
    id: sub.id || `sub-${index}`,
    name: sub.name || 'Unknown Service',
    amount: Math.abs(Number(sub.amount) || 0),
    currency: sub.currency || 'INR',
    frequency: sub.frequency || 'monthly',
    category: VALID_SUBSCRIPTION_CATEGORIES.includes(sub.category)
      ? sub.category
      : 'Other',
    firstSeen: sub.firstSeen || '',
    lastSeen: sub.lastSeen || '',
    occurrences: Number(sub.occurrences) || 1,
    totalSpent: Math.abs(Number(sub.totalSpent) || 0),
    cancelInstructions: Array.isArray(sub.cancelInstructions)
      ? sub.cancelInstructions
      : ['Contact the service provider to cancel'],
    merchantPattern: sub.merchantPattern,
  }));

  // Sanitize transactions
  const sanitizedTransactions: Transaction[] = (result.transactions || []).map(
    (txn, index) => ({
      id: txn.id || `txn-${index}`,
      date: txn.date || '',
      description: txn.description || 'Unknown',
      amount: Math.abs(Number(txn.amount) || 0),
      type: txn.type === 'credit' ? 'credit' : 'debit',
      category: VALID_TRANSACTION_CATEGORIES.includes(txn.category)
        ? txn.category
        : 'Other',
      isRecurring: Boolean(txn.isRecurring),
      merchantName: txn.merchantName,
      confidence: Math.min(1, Math.max(0, Number(txn.confidence) || 0.5)),
    })
  );

  // Calculate totals from transactions
  const totalSpending = sanitizedTransactions
    .filter((t) => t.type === 'debit')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalCredits = sanitizedTransactions
    .filter((t) => t.type === 'credit')
    .reduce((sum, t) => sum + t.amount, 0);

  // Calculate subscription total
  const subscriptionMonthlyTotal = sanitizedSubscriptions.reduce((sum, sub) => {
    const monthlyAmount =
      sub.frequency === 'yearly'
        ? sub.amount / 12
        : sub.frequency === 'quarterly'
        ? sub.amount / 3
        : sub.frequency === 'weekly'
        ? sub.amount * 4
        : sub.amount;
    return sum + monthlyAmount;
  }, 0);

  // Build spending by category
  const spendingMap = new Map<
    TransactionCategory,
    { amount: number; count: number }
  >();
  sanitizedTransactions
    .filter((t) => t.type === 'debit')
    .forEach((t) => {
      const current = spendingMap.get(t.category) || { amount: 0, count: 0 };
      spendingMap.set(t.category, {
        amount: current.amount + t.amount,
        count: current.count + 1,
      });
    });

  const spendingByCategory: CategoryBreakdown[] = Array.from(
    spendingMap.entries()
  )
    .map(([category, data]) => ({
      category,
      totalAmount: Math.round(data.amount),
      count: data.count,
      percentage:
        totalSpending > 0 ? Math.round((data.amount / totalSpending) * 100) : 0,
    }))
    .sort((a, b) => b.totalAmount - a.totalAmount);

  // Build top merchants (from spending)
  const merchantMap = new Map<string, MerchantSummary>();
  sanitizedTransactions
    .filter((t) => t.type === 'debit' && t.merchantName)
    .forEach((t) => {
      const name = t.merchantName!;
      const current = merchantMap.get(name);
      if (current) {
        current.totalSpent += t.amount;
        current.count += 1;
      } else {
        merchantMap.set(name, {
          name,
          totalSpent: t.amount,
          count: 1,
          category: t.category,
        });
      }
    });

  const topMerchants: MerchantSummary[] = Array.from(merchantMap.values())
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, 10);

  // Detect currency from data or default
  const currency = result.summary?.currency || 'INR';

  return {
    summary: {
      totalSpending: Math.round(
        totalSpending || result.summary?.totalSpending || 0
      ),
      totalCredits: Math.round(
        totalCredits || result.summary?.totalCredits || 0
      ),
      subscriptionTotal: Math.round(subscriptionMonthlyTotal),
      currency,
      transactionCount:
        sanitizedTransactions.length || result.summary?.transactionCount || 0,
    },
    subscriptions: sanitizedSubscriptions,
    transactions: sanitizedTransactions,
    spendingByCategory,
    topMerchants,
    dateRange: result.dateRange || { from: '', to: '' },
    analyzedRows: result.analyzedRows || sanitizedTransactions.length,
  };
}
