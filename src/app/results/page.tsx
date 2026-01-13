'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { FullAnalysisResult } from '@/lib/types';
import { ResultsView } from '@/components/analysis';

const STORAGE_KEY = 'cancelit_analysis_result';
const STORAGE_TIME_KEY = 'cancelit_analysis_time';

export default function ResultsPage() {
  const router = useRouter();
  const [data, setData] = useState<FullAnalysisResult | null>(null);
  const [analysisTime, setAnalysisTime] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Try to load data from sessionStorage
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as FullAnalysisResult;
        setData(parsed);
      }
      const storedTime = sessionStorage.getItem(STORAGE_TIME_KEY);
      if (storedTime) {
        setAnalysisTime(parseInt(storedTime, 10));
      }
    } catch (error) {
      console.error('Failed to load analysis data:', error);
    }
    setIsLoading(false);
  }, []);

  const handleReset = () => {
    // Clear stored data
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear stored data:', error);
    }
    // Navigate back to home
    router.push('/');
  };

  // Show loading state briefly
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#0A0A0A] animate-spin mx-auto mb-4" />
          <p className="text-[#525252]">Loading results...</p>
        </div>
      </div>
    );
  }

  // No data - redirect to home
  if (!data) {
    return (
      <div className="min-h-screen flex flex-col">
        <header className="border-b-2 border-[#0A0A0A]">
          <div className="max-w-5xl mx-auto px-6 py-4">
            <h1 className="heading-display text-2xl md:text-3xl tracking-wider">
              CANCELIT
            </h1>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md px-6">
            <div className="w-16 h-16 border-2 border-[#0A0A0A] flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl">?</span>
            </div>
            <h2 className="heading-section text-2xl mb-4">NO ANALYSIS FOUND</h2>
            <p className="text-[#525252] mb-8">
              It looks like you haven&apos;t analyzed a statement yet, or the
              results have expired.
            </p>
            <button onClick={() => router.push('/')} className="btn-primary">
              ANALYZE A STATEMENT
            </button>
          </div>
        </main>

        <footer className="border-t-2 border-[#E5E5E5]">
          <div className="max-w-5xl mx-auto px-6 py-6">
            <p className="text-sm text-[#525252] text-center">
              © {new Date().getFullYear()} Cancelit — Built for people tired of
              forgotten subscriptions
            </p>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b-2 border-[#0A0A0A]">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => router.push('/')}
            className="hover:opacity-70 transition-opacity"
          >
            <h1 className="heading-display text-2xl md:text-3xl tracking-wider">
              CANCELIT
            </h1>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl mx-auto px-6 py-8 w-full">
        <ResultsView
          data={data}
          onReset={handleReset}
          analysisTime={analysisTime}
        />
      </main>

      {/* Footer */}
      <footer className="border-t-2 border-[#E5E5E5]">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <p className="text-sm text-[#525252] text-center">
            © {new Date().getFullYear()} Cancelit — Built for people tired of
            forgotten subscriptions
          </p>
        </div>
      </footer>
    </div>
  );
}

// Export storage key for use in main page
export { STORAGE_KEY };
