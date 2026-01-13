// Analysis result types

import type { TransactionCategory } from './transactions';
import type { SubscriptionCategory, Subscription, CategorySummary } from './subscriptions';
import type { Transaction } from './transactions';

export interface CategoryBreakdown {
  category: TransactionCategory | SubscriptionCategory;
  totalAmount: number;
  count: number;
  percentage?: number;
}

export interface MerchantSummary {
  name: string;
  totalSpent: number;
  count: number;
  category: TransactionCategory;
}

// Legacy format (subscriptions only) - for backwards compatibility
export interface AnalysisSummary {
  totalMonthly: number;
  totalYearly: number;
  subscriptionCount: number;
  categoryBreakdown: CategorySummary[];
  currency: string;
}

export interface AnalysisResult {
  subscriptions: Subscription[];
  summary: AnalysisSummary;
  analyzedRows: number;
  dateRange: {
    from: string;
    to: string;
  };
}

// Full analysis format (all transactions)
export interface FullSummary {
  totalIncome: number;
  totalSpending: number;
  netFlow: number;
  subscriptionTotal: number;
  currency: string;
  transactionCount: number;
}

export interface FullAnalysisResult {
  // Overview
  summary: FullSummary;

  // Subscriptions (existing feature)
  subscriptions: Subscription[];

  // All transactions categorized
  transactions: Transaction[];

  // Breakdowns
  spendingByCategory: CategoryBreakdown[];
  incomeByCategory: CategoryBreakdown[];

  // Insights
  topMerchants: MerchantSummary[];

  // Metadata
  dateRange: { from: string; to: string };
  analyzedRows: number;
}
