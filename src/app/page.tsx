'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { AppState } from '@/lib/types';
import type { UserError } from '@/lib/errors';
import type { JobStatusResponse } from '@/lib/types/jobs';
import { parseCSV, quickValidateFile } from '@/lib/parsers/csv-parser';
import { isAppError } from '@/lib/errors';
import { FileUpload } from '@/components/upload';
import { PrivacyBadge } from '@/components/ui';
import { AnalysisLoader } from '@/components/analysis';
import { ErrorView } from '@/components/error';

const STORAGE_KEY = 'cancelit_analysis_result';
const STORAGE_TIME_KEY = 'cancelit_analysis_time';
const POLLING_INTERVAL = 10000; // Poll every 10 seconds

export default function Home() {
  const router = useRouter();
  const [state, setState] = useState<AppState>({ status: 'idle' });
  const startTimeRef = useRef<number | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  // Poll for job status
  const pollJobStatus = useCallback(
    async (jobId: string) => {
      try {
        const response = await fetch(`/api/analyze/status/${jobId}`, {
          signal: abortControllerRef.current?.signal,
        });

        if (!response.ok) {
          if (response.status === 404) {
            // Job not found or expired
            setState({
              status: 'error',
              error: {
                code: 'JOB_EXPIRED',
                title: 'Analysis Expired',
                message: 'Your analysis session has expired.',
                suggestion:
                  'Please upload your file again to start a new analysis.',
              },
            });
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
            }
            return;
          }
          throw new Error(`Status check failed: ${response.status}`);
        }

        const result: JobStatusResponse = await response.json();

        // Update state with progress
        setState((prev) => ({
          ...prev,
          progress: result.progress,
          step: result.step,
        }));

        // Handle completion
        if (result.status === 'complete' && result.data) {
          // Stop polling
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
          }

          // Calculate analysis time
          const analysisTime = startTimeRef.current
            ? Math.round((Date.now() - startTimeRef.current) / 1000)
            : 0;

          // Store in sessionStorage
          try {
            sessionStorage.setItem(STORAGE_KEY, JSON.stringify(result.data));
            sessionStorage.setItem(STORAGE_TIME_KEY, String(analysisTime));
          } catch (storageError) {
            console.error('Failed to store results:', storageError);
          }

          // Clean up job from Redis (fire and forget)
          fetch(`/api/analyze/cleanup/${jobId}`, { method: 'DELETE' }).catch(
            (err) => console.error('Failed to cleanup job:', err)
          );

          // Navigate to results
          router.push('/results');
        }

        // Handle failure
        if (result.status === 'failed' && result.error) {
          // Stop polling
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
          }

          // Clean up failed job from Redis (fire and forget)
          fetch(`/api/analyze/cleanup/${jobId}`, { method: 'DELETE' }).catch(
            (err) => console.error('Failed to cleanup job:', err)
          );

          setState({
            status: 'error',
            error: result.error,
          });
        }

        // Handle cancellation (user cancelled from another tab or server-side)
        if (result.status === 'cancelled') {
          // Stop polling
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
          }

          // Clean up cancelled job from Redis (fire and forget)
          fetch(`/api/analyze/cleanup/${jobId}`, { method: 'DELETE' }).catch(
            (err) => console.error('Failed to cleanup job:', err)
          );

          setState({ status: 'idle' });
        }
      } catch (error) {
        // Ignore abort errors
        if (error instanceof Error && error.name === 'AbortError') {
          return;
        }

        console.error('Polling error:', error);

        // Don't stop polling on transient errors, just log them
        // The next poll might succeed
      }
    },
    [router]
  );

  const handleFileSelect = useCallback(
    async (file: File) => {
      // Quick validation before starting
      const quickCheck = quickValidateFile(file);
      if (!quickCheck.valid) {
        setState({
          status: 'error',
          error: {
            code: 'INVALID_FORMAT',
            title: 'Invalid File',
            message: quickCheck.error || 'File validation failed',
            suggestion: 'Please upload a valid CSV or PDF file.',
          },
        });
        return;
      }

      // Set initial analyzing state
      setState({
        status: 'analyzing',
        fileName: file.name,
        fileType: quickCheck.fileType as 'csv' | 'pdf',
        progress: 0,
        step: 'Uploading file...',
      });

      // Create new AbortController for this request
      abortControllerRef.current = new AbortController();
      const { signal } = abortControllerRef.current;

      // Use ref for start time to avoid stale closure issues
      startTimeRef.current = Date.now();

      try {
        let response: Response;

        // Handle CSV files - parse client-side, send as JSON
        if (quickCheck.fileType === 'csv') {
          const csvContent = await parseCSV(file);
          response = await fetch('/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              csvContent,
              fileType: 'csv',
              fileName: file.name,
            }),
            signal,
          });
        } else {
          // PDF files - send as FormData for server-side processing
          const formData = new FormData();
          formData.append('file', file);
          formData.append('fileType', 'pdf');

          response = await fetch('/api/analyze', {
            method: 'POST',
            body: formData,
            signal,
          });
        }

        const result = await response.json();

        if (!response.ok || !result.success) {
          // Handle structured error from API
          const error: UserError = result.error || {
            code: 'AI_ERROR',
            title: 'Analysis Failed',
            message: 'Failed to start your analysis.',
            suggestion: 'Please try again with a different file.',
          };
          setState({ status: 'error', error });
          return;
        }

        // Success! Got a jobId - start polling
        const { jobId } = result;

        setState((prev) => ({
          ...prev,
          jobId,
          progress: 5,
          step: 'Analysis queued...',
        }));

        // Start polling for status
        pollingIntervalRef.current = setInterval(() => {
          pollJobStatus(jobId);
        }, POLLING_INTERVAL);

        // Do an immediate first poll
        pollJobStatus(jobId);
      } catch (error) {
        // Handle abort - user cancelled, just return silently
        if (error instanceof Error && error.name === 'AbortError') {
          console.log('Analysis cancelled by user');
          return;
        }

        console.error('File processing error:', error);

        // Handle AppError
        if (isAppError(error)) {
          setState({ status: 'error', error: error.userError });
          return;
        }

        // Handle network errors
        if (error instanceof TypeError && error.message.includes('fetch')) {
          setState({
            status: 'error',
            error: {
              code: 'NETWORK_ERROR',
              title: 'Connection Error',
              message: "We couldn't connect to our analysis service.",
              suggestion: 'Check your internet connection and try again.',
            },
          });
          return;
        }

        // Generic error
        const message =
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred';
        setState({
          status: 'error',
          error: {
            code: 'AI_ERROR',
            title: 'Something Went Wrong',
            message,
            suggestion:
              'Please try again. If the issue persists, try a different file.',
          },
        });
      }
    },
    [pollJobStatus]
  );

  const handleCancel = useCallback(async () => {
    // Get jobId before resetting state
    const jobId = state.jobId;

    // Stop polling
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }

    // Abort any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    // Cancel the job on the server, then cleanup (fire and forget)
    if (jobId) {
      fetch(`/api/analyze/cancel/${jobId}`, { method: 'POST' })
        .then(() =>
          fetch(`/api/analyze/cleanup/${jobId}`, { method: 'DELETE' })
        )
        .catch((err) => console.error('Failed to cancel/cleanup job:', err));
    }

    startTimeRef.current = null;
    setState({ status: 'idle' });
  }, [state.jobId]);

  const handleReset = useCallback(() => {
    // Stop polling if any
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }

    startTimeRef.current = null;
    setState({ status: 'idle' });
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b-2 border-[#0A0A0A]">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="heading-display text-2xl md:text-3xl tracking-wider">
              CANCELIT
            </h1>
          </div>
          {state.status === 'idle' && (
            <a
              href="#how-it-works"
              className="text-sm text-[#525252] hover:text-[#0A0A0A] transition-colors"
            >
              How it works
            </a>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-12">
        {/* Idle State - Upload View */}
        {state.status === 'idle' && (
          <div className="animate-fade-in">
            {/* Hero Text */}
            <div className="mb-10 max-w-2xl">
              <h2 className="heading-display text-5xl md:text-7xl leading-none mb-4">
                STOP PAYING
                <br />
                FOR NOTHING
              </h2>
              <p className="text-lg text-[#525252] mt-4">
                Upload your credit card statement and find every recurring
                charge draining your account — with step-by-step cancel
                instructions.
              </p>
              <div className="w-32 h-1 bg-[#0A0A0A] mt-4" />
            </div>

            {/* File Upload */}
            <FileUpload onFileSelect={handleFileSelect} />

            {/* Privacy Badge */}
            <PrivacyBadge />

            {/* What You Get Section */}
            <section className="mt-16 pt-12 border-t-2 border-[#E5E5E5]">
              <h3 className="heading-section text-2xl mb-8">WHAT YOU GET</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="card p-6">
                  <div className="w-10 h-10 border-2 border-[#0A0A0A] flex items-center justify-center mb-4">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                  <h4 className="heading-section text-lg mb-2">
                    FIND HIDDEN CHARGES
                  </h4>
                  <p className="text-sm text-[#525252]">
                    AI scans every transaction to surface subscriptions you
                    forgot about — streaming services, apps, memberships, and
                    sneaky auto-renewals.
                  </p>
                </div>

                <div className="card p-6">
                  <div className="w-10 h-10 border-2 border-[#0A0A0A] flex items-center justify-center mb-4">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <h4 className="heading-section text-lg mb-2">
                    SEE THE TRUE COST
                  </h4>
                  <p className="text-sm text-[#525252]">
                    Get the total monthly and yearly cost of all your
                    subscriptions. See exactly how much you can save by
                    cancelling what you don&apos;t use.
                  </p>
                </div>

                <div className="card p-6">
                  <div className="w-10 h-10 border-2 border-[#0A0A0A] flex items-center justify-center mb-4">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </div>
                  <h4 className="heading-section text-lg mb-2">
                    CANCEL INSTRUCTIONS
                  </h4>
                  <p className="text-sm text-[#525252]">
                    No more hunting through settings. Get clear, step-by-step
                    instructions to cancel each subscription — Netflix, Spotify,
                    gym, you name it.
                  </p>
                </div>

                <div className="card p-6">
                  <div className="w-10 h-10 border-2 border-[#0A0A0A] flex items-center justify-center mb-4">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                  </div>
                  <h4 className="heading-section text-lg mb-2">
                    DETECT PATTERNS
                  </h4>
                  <p className="text-sm text-[#525252]">
                    Spot recurring charges you didn&apos;t know existed. Our AI
                    identifies weekly, monthly, quarterly, and yearly billing
                    patterns automatically.
                  </p>
                </div>
              </div>
            </section>

            {/* How It Works Section */}
            <section
              id="how-it-works"
              className="mt-16 pt-12 border-t-2 border-[#E5E5E5]"
            >
              <h3 className="heading-section text-2xl mb-8">HOW IT WORKS</h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-3">
                  <div className="w-10 h-10 border-2 border-[#0A0A0A] flex items-center justify-center">
                    <span className="font-mono-data font-bold">1</span>
                  </div>
                  <h4 className="heading-section text-lg">UPLOAD STATEMENT</h4>
                  <p className="text-sm text-[#525252]">
                    Drop your credit card statement CSV or PDF. Works with any
                    provider. Your data stays private.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="w-10 h-10 border-2 border-[#0A0A0A] flex items-center justify-center">
                    <span className="font-mono-data font-bold">2</span>
                  </div>
                  <h4 className="heading-section text-lg">AI SCANS</h4>
                  <p className="text-sm text-[#525252]">
                    Our AI analyzes every transaction to find recurring charges
                    and forgotten subscriptions in seconds.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="w-10 h-10 border-2 border-[#0A0A0A] flex items-center justify-center">
                    <span className="font-mono-data font-bold">3</span>
                  </div>
                  <h4 className="heading-section text-lg">START CANCELLING</h4>
                  <p className="text-sm text-[#525252]">
                    Review your subscriptions and use our cancel instructions to
                    stop paying for what you don&apos;t use.
                  </p>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* Analyzing State - Loader */}
        {state.status === 'analyzing' && state.fileName && (
          <AnalysisLoader
            fileName={state.fileName}
            progress={state.progress}
            step={state.step}
            onCancel={handleCancel}
          />
        )}

        {/* Error State */}
        {state.status === 'error' && state.error && (
          <ErrorView error={state.error} onRetry={handleReset} />
        )}
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
