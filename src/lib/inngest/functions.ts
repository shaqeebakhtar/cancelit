// Inngest background functions for analysis processing

import { inngest } from './client';
import { analyzeTransactions } from '../ai/gemini-client';
import {
  updateJobProgress,
  completeJob,
  failJob,
  isJobCancelled,
  getJob,
} from '../redis/jobs';
import { getErrorResponse } from '../errors';

// Progress steps with percentages
const PROGRESS_STEPS = {
  STARTING: { progress: 5, step: 'Starting analysis...' },
  READING: { progress: 15, step: 'Reading transaction data...' },
  DETECTING: { progress: 30, step: 'Detecting transaction patterns...' },
  CATEGORIZING: { progress: 50, step: 'Categorizing transactions...' },
  SUBSCRIPTIONS: { progress: 70, step: 'Identifying recurring subscriptions...' },
  INSIGHTS: { progress: 85, step: 'Generating financial insights...' },
  FINALIZING: { progress: 95, step: 'Finalizing analysis...' },
} as const;

// Custom error for cancelled jobs
class JobCancelledError extends Error {
  constructor(jobId: string) {
    super(`Job ${jobId} was cancelled by user`);
    this.name = 'JobCancelledError';
  }
}

/**
 * Check if job is cancelled and throw if so
 */
async function checkCancellation(jobId: string): Promise<void> {
  const cancelled = await isJobCancelled(jobId);
  if (cancelled) {
    throw new JobCancelledError(jobId);
  }
}

/**
 * Background function to analyze transactions
 * This runs outside of Vercel's request timeout limits
 */
export const analyzeFunction = inngest.createFunction(
  {
    id: 'analyze-transactions',
    retries: 1, // Reduce retries since analysis is expensive
  },
  { event: 'analyze.requested' },
  async ({ event, step }) => {
    const { jobId, csvContent, fileName } = event.data;

    try {
      // Step 1: Check cancellation and mark as starting
      await step.run('check-and-start', async () => {
        await checkCancellation(jobId);
        await updateJobProgress(
          jobId,
          PROGRESS_STEPS.STARTING.progress,
          PROGRESS_STEPS.STARTING.step
        );
      });

      // Step 2: Reading data
      await step.run('update-progress-reading', async () => {
        await checkCancellation(jobId);
        await updateJobProgress(
          jobId,
          PROGRESS_STEPS.READING.progress,
          PROGRESS_STEPS.READING.step
        );
      });

      // Step 3: Detecting patterns
      await step.run('update-progress-detecting', async () => {
        await checkCancellation(jobId);
        await updateJobProgress(
          jobId,
          PROGRESS_STEPS.DETECTING.progress,
          PROGRESS_STEPS.DETECTING.step
        );
      });

      // Step 4: Start the actual AI analysis
      await step.run('update-progress-categorizing', async () => {
        await checkCancellation(jobId);
        await updateJobProgress(
          jobId,
          PROGRESS_STEPS.CATEGORIZING.progress,
          PROGRESS_STEPS.CATEGORIZING.step
        );
      });

      // Run the AI analysis - this is the long-running part
      const result = await step.run('analyze-with-ai', async () => {
        // Check cancellation before starting expensive AI call
        await checkCancellation(jobId);
        
        try {
          const analysisResult = await analyzeTransactions(csvContent);
          return analysisResult;
        } catch (aiError) {
          // Log detailed AI error for debugging
          console.error('AI Analysis Error:', {
            jobId,
            error: aiError instanceof Error ? aiError.message : 'Unknown error',
            stack: aiError instanceof Error ? aiError.stack : undefined,
          });
          throw aiError;
        }
      });

      // Step 5: Check cancellation after AI completes
      await step.run('update-progress-subscriptions', async () => {
        await checkCancellation(jobId);
        await updateJobProgress(
          jobId,
          PROGRESS_STEPS.SUBSCRIPTIONS.progress,
          PROGRESS_STEPS.SUBSCRIPTIONS.step
        );
      });

      await step.run('update-progress-insights', async () => {
        await checkCancellation(jobId);
        await updateJobProgress(
          jobId,
          PROGRESS_STEPS.INSIGHTS.progress,
          PROGRESS_STEPS.INSIGHTS.step
        );
      });

      await step.run('update-progress-finalizing', async () => {
        await checkCancellation(jobId);
        await updateJobProgress(
          jobId,
          PROGRESS_STEPS.FINALIZING.progress,
          PROGRESS_STEPS.FINALIZING.step
        );
      });

      // Step 6: Complete the job with results
      await step.run('complete-job', async () => {
        // Final cancellation check
        await checkCancellation(jobId);
        await completeJob(jobId, result);
      });

      return {
        success: true,
        jobId,
        fileName,
        transactionCount: result.summary?.transactionCount ?? 0,
      };
    } catch (error) {
      // Handle cancellation - don't mark as failed, just exit gracefully
      if (error instanceof JobCancelledError) {
        console.log(`Job ${jobId} was cancelled, stopping gracefully`);
        return {
          success: false,
          jobId,
          cancelled: true,
        };
      }

      // Handle other errors and update job status
      console.error(`Analysis failed for job ${jobId}:`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });

      // Try to update the job as failed
      try {
        const userError = getErrorResponse(error);
        await failJob(jobId, userError);
      } catch (failError) {
        console.error(`Failed to mark job ${jobId} as failed:`, failError);
      }

      // Re-throw to mark the Inngest function as failed
      throw error;
    }
  }
);
