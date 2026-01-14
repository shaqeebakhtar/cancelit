// Job status polling endpoint

import { NextRequest, NextResponse } from 'next/server';
import { getJob } from '@/lib/redis/jobs';
import type { JobStatusResponse } from '@/lib/types/jobs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
): Promise<NextResponse> {
  try {
    const { jobId } = await params;

    // Validate jobId format
    if (!jobId || typeof jobId !== 'string' || jobId.length < 10) {
      return NextResponse.json(
        { error: 'Invalid job ID' },
        { status: 400 }
      );
    }

    const job = await getJob(jobId);

    if (!job) {
      return NextResponse.json(
        {
          error: 'Job not found or expired',
          suggestion: 'Please upload your file again to start a new analysis.',
        },
        { status: 404 }
      );
    }

    const response: JobStatusResponse = {
      status: job.status,
      progress: job.progress,
      step: job.step,
    };

    // Include result data only when complete
    if (job.status === 'complete' && job.result) {
      response.data = job.result;
    }

    // Include error only when failed
    if (job.status === 'failed' && job.error) {
      response.error = job.error;
    }

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    console.error('Status check error:', error);

    return NextResponse.json(
      {
        error: 'Failed to check job status',
        suggestion: 'Please try again.',
      },
      { status: 500 }
    );
  }
}
