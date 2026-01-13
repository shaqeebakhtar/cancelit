'use client';

import { useState } from 'react';
import type {
  FullAnalysisResult,
  SubscriptionCategory,
  ResultsTab,
} from '@/lib/types';
import CategorySection from '../subscriptions/category-section';
import TabView from '../ui/tab-view';
import SpendingBreakdown from './spending-breakdown';
import TransactionList from './transaction-list';

interface ResultsViewProps {
  data: FullAnalysisResult;
  onReset: () => void;
  analysisTime?: number | null;
}

function formatCurrency(amount: number, currency: string): string {
  if (currency === 'INR') {
    return `₹${amount.toLocaleString('en-IN')}`;
  }
  if (currency === 'USD') {
    return `$${amount.toLocaleString('en-US')}`;
  }
  return `${currency} ${amount.toLocaleString()}`;
}

// Currency with smaller symbol for display
function CurrencyDisplay({
  amount,
  currency,
  className = '',
  colorClass = '',
}: {
  amount: number;
  currency: string;
  className?: string;
  colorClass?: string;
}) {
  const symbol = currency === 'INR' ? '₹' : currency === 'USD' ? '$' : currency;
  const formattedNumber =
    currency === 'INR'
      ? amount.toLocaleString('en-IN')
      : amount.toLocaleString('en-US');

  return (
    <span className={className}>
      <span className={`${colorClass}`}>{symbol}</span>
      <span className={colorClass}>{formattedNumber}</span>
    </span>
  );
}

export default function ResultsView({ data, onReset, analysisTime }: ResultsViewProps) {
  const [activeTab, setActiveTab] = useState<ResultsTab>('subscriptions');

  // Group subscriptions by category for the subscriptions tab
  const groupedSubscriptions = data.subscriptions.reduce(
    (acc, subscription) => {
      const category = subscription.category;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(subscription);
      return acc;
    },
    {} as Record<SubscriptionCategory, typeof data.subscriptions>
  );

  // Build category breakdown for subscriptions
  const subscriptionCategoryBreakdown = Object.entries(groupedSubscriptions)
    .map(([category, subs]) => ({
      category: category as SubscriptionCategory,
      totalMonthly: subs.reduce((sum, s) => {
        const monthly =
          s.frequency === 'yearly'
            ? s.amount / 12
            : s.frequency === 'quarterly'
            ? s.amount / 3
            : s.frequency === 'weekly'
            ? s.amount * 4
            : s.amount;
        return sum + monthly;
      }, 0),
      count: subs.length,
    }))
    .sort((a, b) => b.totalMonthly - a.totalMonthly);

  // Count transactions by type
  const debitTransactions = data.transactions.filter((t) => t.type === 'debit');

  return (
    <div className="w-full">
      {/* Header with Reset Button */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="heading-display text-4xl md:text-5xl mb-2">
            YOUR FINANCIAL SUMMARY
          </h2>
          <div className="w-48 h-[2px] bg-[#0A0A0A]" />
          {data.dateRange.from && data.dateRange.to && (
            <p className="text-sm text-[#525252] mt-2">
              {data.dateRange.from} to {data.dateRange.to}
            </p>
          )}
        </div>
        <button onClick={onReset} className="btn-secondary text-sm self-start">
          ↻ ANALYZE ANOTHER
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <div className="stat-box animate-slide-up stagger-1 opacity-0">
          <p className="font-mono-data text-2xl md:text-3xl font-bold mb-1">
            <CurrencyDisplay
              amount={data.summary.totalSpending}
              currency={data.summary.currency}
            />
          </p>
          <p className="heading-section text-xs text-[#525252]">TOTAL SPENT</p>
        </div>
        <div className="stat-box animate-slide-up stagger-2 opacity-0">
          <p className="font-mono-data text-2xl md:text-3xl font-bold mb-1">
            <CurrencyDisplay
              amount={data.summary.subscriptionTotal}
              currency={data.summary.currency}
              colorClass="text-[#DC2626]"
            />
            <span className="text-sm font-normal text-[#525252]">/mo</span>
          </p>
          <p className="heading-section text-xs text-[#525252]">
            SUBSCRIPTIONS
          </p>
        </div>
        <div className="stat-box animate-slide-up stagger-3 opacity-0">
          <p className="font-mono-data text-2xl md:text-3xl font-bold mb-1">
            <CurrencyDisplay
              amount={data.summary.totalCredits}
              currency={data.summary.currency}
              colorClass="text-[#16A34A]"
            />
          </p>
          <p className="heading-section text-xs text-[#525252]">
            REFUNDS/CREDITS
          </p>
        </div>
      </div>

      {/* Tabs */}
      <TabView
        activeTab={activeTab}
        onTabChange={setActiveTab}
        subscriptionCount={data.subscriptions.length}
        spendingCount={debitTransactions.length}
      />

      {/* Tab Content */}
      <div className="animate-fade-in">
        {/* Subscriptions Tab */}
        {activeTab === 'subscriptions' && (
          <div>
            {data.subscriptions.length === 0 ? (
              <div className="card p-8 text-center">
                <h3 className="heading-section text-xl mb-4">
                  NO SUBSCRIPTIONS DETECTED
                </h3>
                <p className="text-[#525252]">
                  We couldn&apos;t find any recurring subscription payments in
                  your statement. This could mean you&apos;re subscription-free,
                  or the statement doesn&apos;t contain enough data to detect
                  patterns.
                </p>
              </div>
            ) : (
              <div className="space-y-12">
                {subscriptionCategoryBreakdown.map((categoryData, index) => (
                  <CategorySection
                    key={categoryData.category}
                    category={categoryData.category}
                    subscriptions={
                      groupedSubscriptions[categoryData.category] || []
                    }
                    totalMonthly={Math.round(categoryData.totalMonthly)}
                    currency={data.summary.currency}
                    index={index}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Spending Tab */}
        {activeTab === 'spending' && (
          <div className="space-y-8">
            {/* Spending Breakdown Chart */}
            <SpendingBreakdown
              data={data.spendingByCategory}
              total={data.summary.totalSpending}
              currency={data.summary.currency}
              title="SPENDING BY CATEGORY"
            />

            {/* Top Merchants */}
            {data.topMerchants.length > 0 && (
              <div className="mt-8">
                <h3 className="heading-section text-xl mb-4">TOP MERCHANTS</h3>
                <div className="brutalist-divider mb-6" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {data.topMerchants.slice(0, 6).map((merchant, index) => (
                    <div
                      key={merchant.name}
                      className="card p-4 flex items-center justify-between animate-slide-up opacity-0"
                      style={{
                        animationDelay: `${index * 0.05}s`,
                        animationFillMode: 'forwards',
                      }}
                    >
                      <div>
                        <p className="font-medium">{merchant.name}</p>
                        <p className="text-sm text-[#525252]">
                          {merchant.count} transaction
                          {merchant.count !== 1 ? 's' : ''} •{' '}
                          {merchant.category}
                        </p>
                      </div>
                      <p className="font-mono-data font-bold">
                        {formatCurrency(
                          merchant.totalSpent,
                          data.summary.currency
                        )}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* All Spending Transactions */}
            <div className="mt-8">
              <h3 className="heading-section text-xl mb-4">ALL TRANSACTIONS</h3>
              <div className="brutalist-divider mb-6" />
              <TransactionList
                transactions={data.transactions}
                currency={data.summary.currency}
                type="debit"
              />
            </div>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="mt-12 pt-6 border-t-2 border-[#E5E5E5]">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <p className="text-sm text-[#525252]">
            Analysis based on {data.analyzedRows} transactions
            {data.dateRange.from &&
              data.dateRange.to &&
              ` from ${data.dateRange.from} to ${data.dateRange.to}`}
          </p>
          {analysisTime !== null && analysisTime !== undefined && (
            <p className="text-sm text-[#525252] flex items-center gap-2">
              <span className="inline-block w-2 h-2 bg-[#16A34A] rounded-full"></span>
              Analyzed in {analysisTime}s
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
