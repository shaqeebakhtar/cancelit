// Job cleanup endpoint - deletes job data from Redis after completion

import { NextRequest, NextResponse } from 'next/server';
import { deleteJob, getJob } from '@/lib/redis/jobs';

export async function DELETE(
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

    // Check if job exists and is complete or failed
    const job = await getJob(jobId);
    if (!job) {
      // Job already deleted or expired - that's fine
      return NextResponse.json(
        { success: true, message: 'Job already cleaned up' },
        { status: 200 }
      );
    }

    // Only allow cleanup of completed, failed, or cancelled jobs
    if (!['complete', 'failed', 'cancelled'].includes(job.status)) {
      return NextResponse.json(
        { success: false, error: 'Cannot cleanup active job' },
        { status: 400 }
      );
    }

    // Delete the job from Redis
    await deleteJob(jobId);

    return NextResponse.json(
      { success: true, message: 'Job cleaned up' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Cleanup error:', error);

    return NextResponse.json(
      { success: false, error: 'Failed to cleanup job' },
      { status: 500 }
    );
  }
}
