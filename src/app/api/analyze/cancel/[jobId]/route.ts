// Job cancellation endpoint

import { NextRequest, NextResponse } from 'next/server';
import { cancelJob, getJob } from '@/lib/redis/jobs';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
): Promise<NextResponse> {
  try {
    const { jobId } = await params;

    // Validate jobId format
    if (!jobId || typeof jobId !== 'string' || jobId.length < 10) {
      return NextResponse.json(
        { success: false, error: 'Invalid job ID' },
        { status: 400 }
      );
    }

    // Check if job exists
    const job = await getJob(jobId);
    if (!job) {
      return NextResponse.json(
        { success: false, error: 'Job not found' },
        { status: 404 }
      );
    }

    // Cancel the job
    const cancelled = await cancelJob(jobId);

    if (!cancelled) {
      return NextResponse.json(
        {
          success: false,
          error: 'Job cannot be cancelled (already complete or failed)',
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: true, message: 'Job cancelled' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Cancel error:', error);

    return NextResponse.json(
      { success: false, error: 'Failed to cancel job' },
      { status: 500 }
    );
  }
}
