// Job status types for background analysis processing

import type { FullAnalysisResult } from './analysis';
import type { UserError } from '../errors';

export type JobStatus = 'pending' | 'processing' | 'complete' | 'failed' | 'cancelled';

export interface AnalysisJob {
  id: string;
  status: JobStatus;
  fileName: string;
  fileType: 'csv' | 'pdf';
  progress?: number;
  step?: string;
  result?: FullAnalysisResult;
  error?: UserError;
  createdAt: number;
  updatedAt: number;
}

export interface JobStatusResponse {
  status: JobStatus;
  progress?: number;
  step?: string;
  data?: FullAnalysisResult;
  error?: UserError;
}
