'use client';

import { useState } from 'react';
import type { Subscription } from '@/lib/types';

interface SubscriptionCardProps {
  subscription: Subscription;
  currency: string;
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

function formatFrequency(frequency: string): string {
  const map: Record<string, string> = {
    weekly: '/week',
    monthly: '/mo',
    quarterly: '/qtr',
    yearly: '/year',
  };
  return map[frequency] || `/${frequency}`;
}

function formatDate(dateString: string): string {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

export default function SubscriptionCard({
  subscription,
  currency,
}: SubscriptionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="card">
      {/* Main Card Content */}
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          {/* Service Name */}
          <h4 className="heading-section text-lg md:text-xl">
            {subscription.name}
          </h4>

          {/* Amount */}
          <div className="text-right">
            <p className="font-mono-data text-lg font-bold">
              {formatCurrency(subscription.amount, currency)}
              <span className="text-[#525252] text-sm font-normal">
                {formatFrequency(subscription.frequency)}
              </span>
            </p>
          </div>
        </div>

        {/* Meta Info */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-[#525252]">
          {subscription.firstSeen && (
            <span>Since {formatDate(subscription.firstSeen)}</span>
          )}
          {subscription.totalSpent > 0 && (
            <span>
              Total: {formatCurrency(subscription.totalSpent, currency)}
            </span>
          )}
          {subscription.occurrences > 0 && (
            <span>{subscription.occurrences} payments</span>
          )}
        </div>
      </div>

      {/* Cancel Instructions Toggle */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full border-t-2 border-[#E5E5E5] p-4 flex items-center justify-between hover:bg-[#FAFAFA] transition-colors"
      >
        <span className="heading-section text-sm text-[#DC2626] flex items-center gap-2">
          <span
            className="transition-transform duration-200"
            style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
          >
            ▶
          </span>
          HOW TO CANCEL
        </span>
      </button>

      {/* Expandable Cancel Instructions */}
      {isExpanded && (
        <div className="border-t-2 border-[#E5E5E5] p-5 bg-[#FAFAFA] animate-fade-in">
          <ol className="space-y-3">
            {subscription.cancelInstructions.map((instruction, index) => (
              <li key={index} className="flex gap-3 text-sm">
                <span className="font-mono-data font-bold text-[#525252] shrink-0">
                  {index + 1}.
                </span>
                <span>{instruction}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
