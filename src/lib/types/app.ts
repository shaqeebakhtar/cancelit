// App state and API types

import type { UserError } from '../errors';
import type { FullAnalysisResult } from './analysis';

export type AppStatus = 'idle' | 'analyzing' | 'results' | 'error';

export type ResultsTab = 'subscriptions' | 'spending';

export interface AppState {
  status: AppStatus;
  fileName?: string;
  fileType?: 'csv' | 'pdf';
  jobId?: string;
  progress?: number;
  step?: string;
  data?: FullAnalysisResult;
  error?: UserError;
  activeTab?: ResultsTab;
}

export interface FileValidationResult {
  valid: boolean;
  error?: UserError;
  fileType: 'csv' | 'pdf' | 'unknown';
}

export interface AnalyzeRequest {
  csvContent: string;
  fileType: 'csv' | 'pdf';
  fileName?: string;
}

export interface AnalyzeResponse {
  success: boolean;
  jobId?: string;
  data?: FullAnalysisResult;
  error?: UserError;
}
