// Subscription types for recurring payments

export type SubscriptionCategory =
  | 'Streaming'
  | 'Music'
  | 'Cloud Storage'
  | 'Productivity'
  | 'Gaming'
  | 'News & Reading'
  | 'Fitness'
  | 'Finance'
  | 'Shopping'
  | 'Food & Delivery'
  | 'Transportation'
  | 'Other';

export type SubscriptionFrequency =
  | 'weekly'
  | 'monthly'
  | 'quarterly'
  | 'yearly';

export interface Subscription {
  id: string;
  name: string;
  amount: number;
  currency: string;
  frequency: SubscriptionFrequency;
  category: SubscriptionCategory;
  firstSeen: string;
  lastSeen: string;
  occurrences: number;
  totalSpent: number;
  cancelInstructions: string[];
  merchantPattern?: string;
}

export interface CategorySummary {
  category: SubscriptionCategory;
  totalMonthly: number;
  count: number;
}
