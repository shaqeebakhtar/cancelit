// CSV parsing and validation

import Papa from 'papaparse';
import type { FileValidationResult } from '../types';
import { AppError } from '../errors';
import {
  validateFile as validateFileMultiLayer,
  validateContent,
} from '../validators/content-validator';
import { sanitizeCSVContent } from '../utils/sanitizer';

// Re-export the multi-layer validation
export { validateFile as validateFileBasic } from '../validators/file-validator';

/**
 * Full client-side file validation with user-friendly errors
 */
export async function validateFile(file: File): Promise<FileValidationResult> {
  const result = await validateFileMultiLayer(file);

  if (!result.valid && result.error) {
    return {
      valid: false,
      error: result.error.userError,
      fileType: 'unknown',
    };
  }

  return {
    valid: true,
    fileType: result.fileType,
  };
}

/**
 * Parse CSV file and return sanitized content
 */
export async function parseCSV(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      complete: (results) => {
        // Check for critical parsing errors
        const criticalErrors = results.errors.filter(
          (e) => e.type === 'Quotes' || e.type === 'FieldMismatch'
        );

        if (criticalErrors.length > 0) {
          console.warn('CSV parsing errors:', criticalErrors);
        }

        if (!results.data || results.data.length === 0) {
          reject(new AppError('FILE_EMPTY'));
          return;
        }

        // Check minimum data rows
        if (results.data.length < 2) {
          reject(new AppError('NO_TRANSACTIONS'));
          return;
        }

        // Convert parsed data back to a clean CSV string
        const csvString = Papa.unparse(results.data as unknown[][]);

        // Sanitize the content
        const sanitized = sanitizeCSVContent(csvString);

        // Validate structure
        try {
          validateContent(sanitized, 'csv');
        } catch (error) {
          reject(error);
          return;
        }

        resolve(sanitized);
      },
      error: (error) => {
        console.error('CSV parse error:', error);
        reject(new AppError('PARSE_ERROR', error.message));
      },
      skipEmptyLines: true,
      dynamicTyping: false, // Keep everything as strings for consistent handling
    });
  });
}

/**
 * Extract and validate file content (CSV or PDF)
 */
export async function extractFileContent(file: File): Promise<{
  content: string;
  type: 'csv' | 'pdf';
}> {
  // Validate file first
  const validation = await validateFileMultiLayer(file);

  if (!validation.valid) {
    throw validation.error || new AppError('INVALID_FORMAT');
  }

  if (validation.fileType === 'pdf') {
    // PDF processing is handled separately in pdf-parser.ts
    throw new AppError('PDF_SCANNED', 'PDF support requires server-side processing');
  }

  // Parse and sanitize CSV
  const content = await parseCSV(file);
  return { content, type: 'csv' };
}

/**
 * Truncate large CSVs for API payload while preserving structure
 */
export function truncateForAnalysis(
  csvContent: string,
  maxRows: number = 1000
): string {
  const lines = csvContent.split('\n');

  if (lines.length <= maxRows + 1) {
    return csvContent;
  }

  // Keep header + maxRows of data
  const header = lines[0];
  const dataRows = lines.slice(1, maxRows + 1);

  return [header, ...dataRows].join('\n');
}

/**
 * Quick validation for file selection (before upload)
 */
export function quickValidateFile(file: File): {
  valid: boolean;
  fileType: 'csv' | 'pdf' | 'unknown';
  error?: string;
} {
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  const ALLOWED_EXTENSIONS = ['.csv', '.pdf'];

  // Check file size
  if (file.size === 0) {
    return {
      valid: false,
      fileType: 'unknown',
      error: 'The file is empty.',
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      fileType: 'unknown',
      error: 'File too large. Maximum size is 10MB.',
    };
  }

  // Check extension
  const extension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));

  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    return {
      valid: false,
      fileType: 'unknown',
      error: 'Please upload a CSV or PDF file.',
    };
  }

  return {
    valid: true,
    fileType: extension === '.pdf' ? 'pdf' : 'csv',
  };
}
