'use client';

import type { ResultsTab } from '@/lib/types';

interface TabViewProps {
  activeTab: ResultsTab;
  onTabChange: (tab: ResultsTab) => void;
  subscriptionCount: number;
  spendingCount: number;
}

const tabs: { id: ResultsTab; label: string }[] = [
  { id: 'subscriptions', label: 'SUBSCRIPTIONS' },
  { id: 'spending', label: 'ALL SPENDING' },
];

export default function TabView({
  activeTab,
  onTabChange,
  subscriptionCount,
  spendingCount,
}: TabViewProps) {
  const getCounts = (tab: ResultsTab): number => {
    switch (tab) {
      case 'subscriptions':
        return subscriptionCount;
      case 'spending':
        return spendingCount;
      default:
        return 0;
    }
  };

  return (
    <div className="flex flex-wrap gap-2 mb-8">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const count = getCounts(tab.id);

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              px-4 py-3 
              border-2 
              transition-all duration-150
              heading-section text-sm
              flex items-center gap-2
              ${
                isActive
                  ? 'bg-[#0A0A0A] text-white border-[#0A0A0A]'
                  : 'bg-transparent text-[#0A0A0A] border-[#E5E5E5] hover:border-[#0A0A0A]'
              }
            `}
          >
            <span>{tab.label}</span>
            <span
              className={`
                font-mono-data text-xs px-2 py-0.5
                ${isActive ? 'bg-white text-[#0A0A0A]' : 'bg-[#E5E5E5] text-[#525252]'}
              `}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
