import type { Subscription, SubscriptionCategory } from '@/lib/types';
import SubscriptionCard from './subscription-card';

interface CategorySectionProps {
  category: SubscriptionCategory;
  subscriptions: Subscription[];
  totalMonthly: number;
  index: number;
}

function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}

const categoryIcons: Record<SubscriptionCategory, string> = {
  Streaming: '▶',
  Music: '♪',
  'Cloud Storage': '☁',
  Productivity: '✎',
  Gaming: '◆',
  'News & Reading': '▤',
  Fitness: '♥',
  Finance: '₹',
  Shopping: '◎',
  'Food & Delivery': '⬡',
  Transportation: '→',
  Other: '•',
};

export default function CategorySection({
  category,
  subscriptions,
  totalMonthly,
  index,
}: CategorySectionProps) {
  return (
    <section
      className="animate-slide-up opacity-0"
      style={{
        animationDelay: `${0.3 + index * 0.1}s`,
        animationFillMode: 'forwards',
      }}
    >
      {/* Category Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{categoryIcons[category]}</span>
          <h3 className="heading-section text-xl md:text-2xl">{category}</h3>
        </div>
        <p className="font-mono-data text-lg text-[#525252]">
          {formatCurrency(totalMonthly)}/mo
        </p>
      </div>

      {/* Divider */}
      <div className="brutalist-divider mb-6" />

      {/* Subscription Cards */}
      <div className="space-y-4">
        {subscriptions.map((subscription) => (
          <SubscriptionCard key={subscription.id} subscription={subscription} />
        ))}
      </div>
    </section>
  );
}
