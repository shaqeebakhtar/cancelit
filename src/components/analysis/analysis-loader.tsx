'use client';

import { useState, useEffect } from 'react';

interface AnalysisLoaderProps {
  fileName: string;
  progress?: number;
  step?: string;
  onCancel?: () => void;
}

// Format seconds into MM:SS display
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Progress steps for visual display
const PROGRESS_MILESTONES = [
  { threshold: 2, text: 'Parsing document' },
  { threshold: 8, text: 'Queuing analysis' },
  { threshold: 20, text: 'Reading transaction data' },
  { threshold: 35, text: 'Detecting transaction patterns' },
  { threshold: 50, text: 'Categorizing transactions' },
  { threshold: 70, text: 'Identifying recurring subscriptions' },
  { threshold: 85, text: 'Generating financial insights' },
  { threshold: 95, text: 'Finalizing analysis' },
];

export default function AnalysisLoader({
  fileName,
  progress = 0,
  step,
  onCancel,
}: AnalysisLoaderProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Track elapsed time
  useEffect(() => {
    const timeInterval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timeInterval);
  }, []);

  // Clamp progress to 0-100
  const displayProgress = Math.min(100, Math.max(0, progress));

  return (
    <div className="w-full max-w-2xl mx-auto text-center py-12 animate-fade-in">
      {/* Progress Bar with Percentage */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-mono text-[#525252]">PROCESSING</span>
          <span className="text-xs font-mono text-[#525252]">
            {displayProgress}%
          </span>
        </div>
        <div className="w-full h-2 bg-[#E5E5E5] border border-[#0A0A0A] relative overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-[#0A0A0A] transition-all duration-500 ease-out"
            style={{ width: `${displayProgress}%` }}
          />
        </div>
      </div>

      {/* Loading Text */}
      <h3 className="heading-section text-2xl md:text-3xl mb-2">
        ANALYZING YOUR TRANSACTIONS
      </h3>

      {/* File Name */}
      <p className="text-[#525252] text-sm font-mono mb-8">{fileName}</p>

      {/* Progress Steps */}
      <div className="space-y-3 text-left max-w-sm mx-auto">
        {PROGRESS_MILESTONES.map((milestone) => {
          const isComplete = displayProgress >= milestone.threshold;
          const isActive =
            displayProgress >= milestone.threshold - 14 &&
            displayProgress < milestone.threshold + 15;

          return (
            <LoadingStep
              key={milestone.threshold}
              text={milestone.text}
              isActive={isActive && !isComplete}
              isComplete={isComplete}
            />
          );
        })}
      </div>

      {/* Time Info & Cancel Button */}
      <div className="mt-10 flex flex-col items-center gap-4">
        {/* Elapsed Time Display */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-2xl font-mono text-[#0A0A0A] font-medium">
            {formatTime(elapsedSeconds)}
          </span>
          <span className="text-xs text-[#525252]">elapsed</span>
        </div>

        {/* Duration Notice */}
        <p className="text-sm text-[#525252] max-w-xs text-center">
          This analysis typically takes{' '}
          <span className="font-medium text-[#0A0A0A]">3-5 minutes</span>{' '}
          depending on your statement size.
        </p>

        {onCancel && (
          <button
            onClick={onCancel}
            className="px-6 py-2 border-2 border-[#E5E5E5] text-[#525252] text-sm hover:border-[#DC2626] hover:text-[#DC2626] transition-colors"
          >
            CANCEL ANALYSIS
          </button>
        )}
      </div>
    </div>
  );
}

function LoadingStep({
  text,
  isActive,
  isComplete,
}: {
  text: string;
  isActive: boolean;
  isComplete: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`w-3 h-3 border-2 transition-all duration-300 ${
          isComplete
            ? 'bg-[#16A34A] border-[#16A34A]'
            : isActive
            ? 'bg-[#0A0A0A] border-[#0A0A0A] animate-pulse'
            : 'bg-transparent border-[#E5E5E5]'
        }`}
      />
      <span
        className={`text-sm transition-colors duration-300 ${
          isComplete
            ? 'text-[#16A34A]'
            : isActive
            ? 'text-[#0A0A0A] font-medium'
            : 'text-[#525252]'
        }`}
      >
        {text}
        {isComplete && ' ✓'}
      </span>
    </div>
  );
}
