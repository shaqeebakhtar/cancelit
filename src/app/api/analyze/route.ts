// Analysis API route - triggers background job via Inngest

import { NextRequest, NextResponse } from 'next/server';
import { truncateForAnalysis } from '@/lib/parsers/csv-parser';
import { sanitizeCSVContent } from '@/lib/utils/sanitizer';
import { validateCSVStructure } from '@/lib/validators/content-validator';
import { processPDF } from '@/lib/parsers/pdf-parser';
import {
  checkRateLimit,
  getClientIP,
  getRateLimitHeaders,
} from '@/lib/utils/rate-limiter';
import { AppError, isAppError, getErrorResponse } from '@/lib/errors';
import { inngest } from '@/lib/inngest';
import { createJob } from '@/lib/redis/jobs';

export const maxDuration = 60; // Fast response - actual work done by Inngest

export async function POST(request: NextRequest) {
  const clientIP = getClientIP(request);

  try {
    // Step 1: Rate limiting
    checkRateLimit(clientIP);

    // Determine content type
    const contentType = request.headers.get('content-type') || '';
    let csvContent: string;
    let fileType: 'csv' | 'pdf' = 'csv';
    let fileName = 'statement';

    // Step 2: Parse request based on content type
    if (contentType.includes('multipart/form-data')) {
      // Handle PDF file upload via FormData
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      fileType = (formData.get('fileType') as string) === 'pdf' ? 'pdf' : 'csv';

      if (!file) {
        throw new AppError('FILE_EMPTY', 'No file provided in request');
      }

      if (file.size > 10 * 1024 * 1024) {
        throw new AppError('FILE_TOO_LARGE', 'File exceeds 10MB limit');
      }

      fileName = file.name;

      if (fileType === 'pdf') {
        // Process PDF using pdf2json and extract transactions
        const buffer = Buffer.from(await file.arrayBuffer());
        csvContent = await processPDF(buffer);
      } else {
        // Read CSV content from file
        csvContent = await file.text();
      }
    } else {
      // Handle JSON request (CSV content already parsed client-side)
      let body;
      try {
        body = await request.json();
      } catch {
        throw new AppError('PARSE_ERROR', 'Invalid JSON in request body');
      }

      csvContent = body.csvContent;
      fileType = body.fileType === 'pdf' ? 'pdf' : 'csv';
      fileName = body.fileName || 'statement.csv';

      if (!csvContent || typeof csvContent !== 'string') {
        throw new AppError('FILE_EMPTY', 'No content provided in request');
      }
    }

    // Step 3: Validate content length
    if (csvContent.length < 50) {
      throw new AppError(
        'NO_TRANSACTIONS',
        'Content too short to contain transactions'
      );
    }

    // Step 4: Sanitize content
    const sanitizedContent = sanitizeCSVContent(csvContent);

    // Step 5: Validate structure
    try {
      validateCSVStructure(sanitizedContent);
    } catch (error) {
      if (isAppError(error)) {
        throw error;
      }
      throw new AppError('PARSE_ERROR', 'Failed to validate content structure');
    }

    // Step 6: Truncate large content
    const truncatedContent = truncateForAnalysis(sanitizedContent, 1000);

    // Step 7: Create job and trigger Inngest
    const jobId = crypto.randomUUID();

    // Create job in Redis with pending status
    await createJob(jobId, fileName, fileType);

    // Send event to Inngest for background processing
    await inngest.send({
      name: 'analyze.requested',
      data: {
        jobId,
        csvContent: truncatedContent,
        fileType,
        fileName,
      },
    });

    // Return jobId immediately (~100ms response time)
    const headers = getRateLimitHeaders(clientIP);

    return NextResponse.json(
      {
        success: true,
        jobId,
        message: 'Analysis started',
      },
      {
        status: 202, // Accepted - processing asynchronously
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Analysis error:', error);

    // Get user-friendly error
    const userError = getErrorResponse(error);

    // Determine status code
    let statusCode = 500;
    if (isAppError(error)) {
      switch (error.userError.code) {
        case 'RATE_LIMITED':
          statusCode = 429;
          break;
        case 'FILE_EMPTY':
        case 'FILE_TOO_LARGE':
        case 'INVALID_FORMAT':
        case 'INVALID_EXTENSION':
        case 'NO_TRANSACTIONS':
        case 'INSUFFICIENT_COLUMNS':
        case 'INSUFFICIENT_ROWS':
        case 'PARSE_ERROR':
        case 'PDF_SCANNED':
        case 'PDF_PROTECTED':
        case 'PDF_NO_TABLES':
          statusCode = 400;
          break;
        case 'AI_ERROR':
        case 'NETWORK_ERROR':
        default:
          statusCode = 500;
      }
    }

    // Get rate limit headers even for errors
    const headers = getRateLimitHeaders(clientIP);

    return NextResponse.json(
      { success: false, error: userError },
      {
        status: statusCode,
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
      }
    );
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    mode: 'background-processing',
    limits: {
      maxFileSize: '10MB',
      maxRows: 1000,
      rateLimit: '5 requests per minute',
    },
  });
}
