import type { AnalysisSummary } from '@/lib/types';

interface SummaryStatsProps {
  summary: AnalysisSummary;
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

export default function SummaryStats({ summary }: SummaryStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
      {/* Monthly Total */}
      <div className="stat-box animate-slide-up stagger-1 opacity-0">
        <p className="font-mono-data text-3xl md:text-4xl font-bold mb-1">
          {formatCurrency(summary.totalMonthly, summary.currency)}
        </p>
        <p className="heading-section text-sm text-[#525252]">PER MONTH</p>
      </div>

      {/* Subscription Count */}
      <div className="stat-box animate-slide-up stagger-2 opacity-0">
        <p className="font-mono-data text-3xl md:text-4xl font-bold mb-1">
          {summary.subscriptionCount}
        </p>
        <p className="heading-section text-sm text-[#525252]">
          SUBSCRIPTION{summary.subscriptionCount !== 1 ? 'S' : ''}
        </p>
      </div>

      {/* Yearly Total */}
      <div className="stat-box animate-slide-up stagger-3 opacity-0">
        <p className="font-mono-data text-3xl md:text-4xl font-bold mb-1">
          {formatCurrency(summary.totalYearly, summary.currency)}
        </p>
        <p className="heading-section text-sm text-[#525252]">PER YEAR</p>
      </div>
    </div>
  );
}
