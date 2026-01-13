'use client';

import { useState, useEffect } from 'react';

interface AnalysisLoaderProps {
  fileName: string;
  onCancel?: () => void;
}

// Estimated time in seconds (based on typical analysis duration)
const ESTIMATED_TIME = 45;

const PROGRESS_STEPS = [
  { text: 'Reading file structure', duration: 2000 },
  { text: 'Detecting transaction patterns', duration: 3000 },
  { text: 'Identifying recurring payments', duration: 4000 },
  { text: 'Categorizing subscriptions', duration: 5000 },
  { text: 'Analyzing spending habits', duration: 6000 },
  { text: 'Generating insights', duration: 8000 },
];

export default function AnalysisLoader({
  fileName,
  onCancel,
}: AnalysisLoaderProps) {
  const [elapsedTime, setElapsedTime] = useState(0);

  const elapsedSeconds = Math.floor(elapsedTime / 1000);

  // Derive current step from elapsed time
  const stepIndex = PROGRESS_STEPS.findIndex(
    (step) => elapsedTime < step.duration
  );
  const currentStep = stepIndex === -1 ? PROGRESS_STEPS.length - 1 : stepIndex;

  // Track elapsed time
  useEffect(() => {
    const timeInterval = setInterval(() => {
      setElapsedTime((prev) => prev + 1000);
    }, 1000);

    return () => clearInterval(timeInterval);
  }, []);

  // Calculate progress percentage (cap at 95% until done)
  const maxDuration = PROGRESS_STEPS[PROGRESS_STEPS.length - 1].duration;
  const progress = Math.min(95, Math.round((elapsedTime / maxDuration) * 100));

  return (
    <div className="w-full max-w-2xl mx-auto text-center py-12 animate-fade-in">
      {/* Progress Bar with Percentage */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-mono text-[#525252]">PROCESSING</span>
          <span className="text-xs font-mono text-[#525252]">{progress}%</span>
        </div>
        <div className="w-full h-2 bg-[#E5E5E5] border border-[#0A0A0A] relative overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-[#0A0A0A] transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
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
        {PROGRESS_STEPS.map((step, index) => (
          <LoadingStep
            key={step.text}
            text={step.text}
            isActive={index === currentStep}
            isComplete={index < currentStep}
            delay={index * 0.1}
          />
        ))}
      </div>

      {/* Time & Cancel Button */}
      <div className="mt-10 flex flex-col items-center gap-4">
        <span className="text-xs font-mono text-[#525252]">
          {elapsedSeconds}s / ~{ESTIMATED_TIME}s
        </span>

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
  delay,
}: {
  text: string;
  isActive: boolean;
  isComplete: boolean;
  delay: number;
}) {
  return (
    <div
      className="flex items-center gap-3 opacity-0 animate-fade-in"
      style={{
        animationDelay: `${delay}s`,
        animationFillMode: 'forwards',
      }}
    >
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
