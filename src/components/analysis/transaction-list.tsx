'use client';

import { useState, useMemo } from 'react';
import type { Transaction, TransactionCategory } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';

interface TransactionListProps {
  transactions: Transaction[];
  type: 'debit' | 'credit' | 'all';
  currency?: string;
}

function formatDate(dateString: string): string {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

const ITEMS_PER_PAGE = 20;

export default function TransactionList({
  transactions,
  type,
  currency = 'INR',
}: TransactionListProps) {
  const [selectedCategory, setSelectedCategory] = useState<
    TransactionCategory | 'all'
  >('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Filter by type
  const typeFiltered = useMemo(() => {
    if (type === 'all') return transactions;
    return transactions.filter((t) => t.type === type);
  }, [transactions, type]);

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set(typeFiltered.map((t) => t.category));
    return Array.from(cats).sort();
  }, [typeFiltered]);

  // Filter and sort
  const filteredTransactions = useMemo(() => {
    let result = typeFiltered;

    // Filter by category
    if (selectedCategory !== 'all') {
      result = result.filter((t) => t.category === selectedCategory);
    }

    // Sort
    result = [...result].sort((a, b) => {
      if (sortBy === 'date') {
        const dateA = new Date(a.date).getTime() || 0;
        const dateB = new Date(b.date).getTime() || 0;
        return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
      } else {
        return sortOrder === 'desc' ? b.amount - a.amount : a.amount - b.amount;
      }
    });

    return result;
  }, [typeFiltered, selectedCategory, sortBy, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE);
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Reset page when filter changes
  const handleCategoryChange = (cat: TransactionCategory | 'all') => {
    setSelectedCategory(cat);
    setCurrentPage(1);
  };

  const toggleSort = (field: 'date' | 'amount') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  if (typeFiltered.length === 0) {
    return (
      <div className="card p-8 text-center">
        <p className="text-[#525252]">No transactions to display</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        {/* Category Filter */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-[#525252]">Category:</span>
          <select
            value={selectedCategory}
            onChange={(e) =>
              handleCategoryChange(
                e.target.value as TransactionCategory | 'all'
              )
            }
            className="border-2 border-[#0A0A0A] px-3 py-2 text-sm bg-white"
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Sort Controls */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-[#525252]">Sort by:</span>
          <button
            onClick={() => toggleSort('date')}
            className={`px-3 py-2 text-sm border-2 transition-colors ${
              sortBy === 'date'
                ? 'border-[#0A0A0A] bg-[#0A0A0A] text-white'
                : 'border-[#E5E5E5] hover:border-[#0A0A0A]'
            }`}
          >
            Date {sortBy === 'date' && (sortOrder === 'desc' ? '↓' : '↑')}
          </button>
          <button
            onClick={() => toggleSort('amount')}
            className={`px-3 py-2 text-sm border-2 transition-colors ${
              sortBy === 'amount'
                ? 'border-[#0A0A0A] bg-[#0A0A0A] text-white'
                : 'border-[#E5E5E5] hover:border-[#0A0A0A]'
            }`}
          >
            Amount {sortBy === 'amount' && (sortOrder === 'desc' ? '↓' : '↑')}
          </button>
        </div>

        {/* Count */}
        <span className="text-sm text-[#525252] ml-auto">
          {filteredTransactions.length} transaction
          {filteredTransactions.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Transaction List */}
      <div className="space-y-2">
        {paginatedTransactions.map((txn, index) => (
          <div
            key={txn.id}
            className="card p-4 animate-fade-in"
            style={{
              animationDelay: `${index * 0.02}s`,
              animationFillMode: 'forwards',
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                {/* Description & Merchant */}
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium truncate">
                    {txn.merchantName || txn.description}
                  </p>
                  {txn.isRecurring && (
                    <span className="text-xs px-2 py-0.5 bg-[#E5E5E5] text-[#525252]">
                      RECURRING
                    </span>
                  )}
                </div>

                {/* Meta */}
                <div className="flex items-center gap-3 text-sm text-[#525252]">
                  <span>{formatDate(txn.date)}</span>
                  <span className="px-2 py-0.5 bg-[#FAFAFA] text-xs">
                    {txn.category}
                  </span>
                </div>
              </div>

              {/* Amount */}
              <div className="text-right ml-4">
                <p
                  className={`font-mono-data text-lg font-bold ${
                    txn.type === 'credit' ? 'text-[#16A34A]' : 'text-[#0A0A0A]'
                  }`}
                >
                  {txn.type === 'credit' ? '+' : '-'}
                  {formatCurrency(txn.amount, currency)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 border-2 border-[#0A0A0A] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#0A0A0A] hover:text-white transition-colors"
          >
            ← Prev
          </button>
          <span className="px-4 py-2 text-sm">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 border-2 border-[#0A0A0A] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#0A0A0A] hover:text-white transition-colors"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
