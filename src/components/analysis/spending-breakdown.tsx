'use client';

import type { CategoryBreakdown } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';

interface SpendingBreakdownProps {
  data: CategoryBreakdown[];
  total: number;
  title?: string;
  currency?: string;
}

// Category colors for visual distinction
const CATEGORY_COLORS: Record<string, string> = {
  'Food & Dining': '#DC2626',
  Groceries: '#EA580C',
  Shopping: '#D97706',
  Transportation: '#CA8A04',
  Fuel: '#65A30D',
  Entertainment: '#16A34A',
  Healthcare: '#059669',
  Education: '#0D9488',
  Travel: '#0891B2',
  'Personal Care': '#0284C7',
  Subscription: '#2563EB',
  'Bill & Utility': '#4F46E5',
  Rent: '#7C3AED',
  'EMI & Loan': '#9333EA',
  Insurance: '#C026D3',
  Refund: '#16A34A',
  Cashback: '#059669',
  Payment: '#6B7280',
  Other: '#9CA3AF',
};

function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[category] || '#9CA3AF';
}

export default function SpendingBreakdown({
  data,
  total,
  title = 'SPENDING BREAKDOWN',
  currency = 'INR',
}: SpendingBreakdownProps) {
  if (data.length === 0) {
    return (
      <div className="card p-6 text-center">
        <p className="text-[#525252]">No data to display</p>
      </div>
    );
  }

  const maxAmount = Math.max(...data.map((d) => d.totalAmount));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="heading-section text-xl">{title}</h3>
        <p className="font-mono-data text-lg">
          {formatCurrency(total, currency)}
        </p>
      </div>

      {/* Divider */}
      <div className="brutalist-divider" />

      {/* Category Bars */}
      <div className="space-y-4">
        {data.map((item, index) => {
          const percentage =
            maxAmount > 0 ? (item.totalAmount / maxAmount) * 100 : 0;
          const color = getCategoryColor(item.category as string);

          return (
            <div
              key={item.category}
              className="animate-slide-up opacity-0"
              style={{
                animationDelay: `${index * 0.05}s`,
                animationFillMode: 'forwards',
              }}
            >
              {/* Category Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3" style={{ backgroundColor: color }} />
                  <span className="text-sm font-medium">{item.category}</span>
                  <span className="text-xs text-[#525252]">
                    ({item.count} transaction{item.count !== 1 ? 's' : ''})
                  </span>
                </div>
                <span className="font-mono-data text-sm">
                  {formatCurrency(item.totalAmount, currency)}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="h-2 bg-[#E5E5E5] relative overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 transition-all duration-500 ease-out"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: color,
                  }}
                />
              </div>

              {/* Percentage */}
              {item.percentage !== undefined && (
                <div className="mt-1 text-right">
                  <span className="text-xs text-[#525252]">
                    {item.percentage}% of total
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
