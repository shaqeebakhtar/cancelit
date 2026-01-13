// App state and API types

import type { UserError } from '../errors';
import type { FullAnalysisResult } from './analysis';

export type AppStatus = 'idle' | 'analyzing' | 'results' | 'error';

export type ResultsTab = 'subscriptions' | 'spending' | 'income';

export interface AppState {
  status: AppStatus;
  fileName?: string;
  fileType?: 'csv' | 'pdf';
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
}

export interface AnalyzeResponse {
  success: boolean;
  data?: FullAnalysisResult;
  error?: UserError;
}
