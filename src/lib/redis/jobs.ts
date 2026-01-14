// Job storage helpers for Redis

import { redis } from './client';
import type { AnalysisJob } from '../types/jobs';
import type { FullAnalysisResult } from '../types';
import type { UserError } from '../errors';

const JOB_PREFIX = 'job:';
const JOB_TTL_SECONDS = 3600; // 1 hour TTL for job data

function getJobKey(jobId: string): string {
  return `${JOB_PREFIX}${jobId}`;
}

/**
 * Create a new job in Redis with pending status
 */
export async function createJob(
  jobId: string,
  fileName: string,
  fileType: 'csv' | 'pdf'
): Promise<AnalysisJob> {
  const now = Date.now();
  const job: AnalysisJob = {
    id: jobId,
    status: 'pending',
    fileName,
    fileType,
    progress: 0,
    step: 'Queued for processing',
    createdAt: now,
    updatedAt: now,
  };

  await redis.set(getJobKey(jobId), JSON.stringify(job), {
    ex: JOB_TTL_SECONDS,
  });

  return job;
}

/**
 * Update job progress during analysis
 */
export async function updateJobProgress(
  jobId: string,
  progress: number,
  step: string
): Promise<void> {
  const job = await getJob(jobId);
  if (!job) {
    throw new Error(`Job ${jobId} not found`);
  }

  const updatedJob: AnalysisJob = {
    ...job,
    status: 'processing',
    progress,
    step,
    updatedAt: Date.now(),
  };

  await redis.set(getJobKey(jobId), JSON.stringify(updatedJob), {
    ex: JOB_TTL_SECONDS,
  });
}

/**
 * Mark job as complete with result
 */
export async function completeJob(
  jobId: string,
  result: FullAnalysisResult
): Promise<void> {
  const job = await getJob(jobId);
  if (!job) {
    throw new Error(`Job ${jobId} not found`);
  }

  const updatedJob: AnalysisJob = {
    ...job,
    status: 'complete',
    progress: 100,
    step: 'Analysis complete',
    result,
    updatedAt: Date.now(),
  };

  await redis.set(getJobKey(jobId), JSON.stringify(updatedJob), {
    ex: JOB_TTL_SECONDS,
  });
}

/**
 * Mark job as failed with error
 */
export async function failJob(jobId: string, error: UserError): Promise<void> {
  const job = await getJob(jobId);
  if (!job) {
    throw new Error(`Job ${jobId} not found`);
  }

  const updatedJob: AnalysisJob = {
    ...job,
    status: 'failed',
    error,
    updatedAt: Date.now(),
  };

  await redis.set(getJobKey(jobId), JSON.stringify(updatedJob), {
    ex: JOB_TTL_SECONDS,
  });
}

/**
 * Get job by ID
 */
export async function getJob(jobId: string): Promise<AnalysisJob | null> {
  const data = await redis.get<string>(getJobKey(jobId));
  if (!data) {
    return null;
  }

  // Handle case where Redis returns already parsed object
  if (typeof data === 'object') {
    return data as unknown as AnalysisJob;
  }

  return JSON.parse(data) as AnalysisJob;
}

/**
 * Check if a job exists
 */
export async function jobExists(jobId: string): Promise<boolean> {
  const exists = await redis.exists(getJobKey(jobId));
  return exists === 1;
}

/**
 * Delete a job (for cleanup or cancellation)
 */
export async function deleteJob(jobId: string): Promise<void> {
  await redis.del(getJobKey(jobId));
}

/**
 * Cancel a job - marks it as cancelled so Inngest function can stop
 */
export async function cancelJob(jobId: string): Promise<boolean> {
  const job = await getJob(jobId);
  if (!job) {
    return false;
  }

  // Only cancel if not already complete or failed
  if (job.status === 'complete' || job.status === 'failed') {
    return false;
  }

  const updatedJob: AnalysisJob = {
    ...job,
    status: 'cancelled',
    step: 'Cancelled by user',
    updatedAt: Date.now(),
  };

  await redis.set(getJobKey(jobId), JSON.stringify(updatedJob), {
    ex: JOB_TTL_SECONDS,
  });

  return true;
}

/**
 * Check if a job is cancelled
 */
export async function isJobCancelled(jobId: string): Promise<boolean> {
  const job = await getJob(jobId);
  return job?.status === 'cancelled';
}
