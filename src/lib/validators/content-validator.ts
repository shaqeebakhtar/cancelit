// CSV structure and content validation

import { AppError } from '../errors';
import {
  validateFile as validateFileBase,
  type ValidationResult,
} from './file-validator';

// Configuration
const MIN_COLUMNS = 3;
const MIN_DATA_ROWS = 5;
const MAX_CELL_LENGTH = 500;

// Re-export file validation
export { validateFile } from './file-validator';
export type { ValidationResult };

/**
 * Validates CSV structure (columns, rows)
 */
export function validateCSVStructure(content: string): void {
  const lines = content.trim().split(/\r?\n/);

  if (lines.length === 0) {
    throw new AppError('FILE_EMPTY');
  }

  // Check header row
  const headerLine = lines[0];
  const columns = parseCSVLine(headerLine);

  if (columns.length < MIN_COLUMNS) {
    throw new AppError(
      'INSUFFICIENT_COLUMNS',
      `Found ${columns.length} columns, need at least ${MIN_COLUMNS}`
    );
  }

  // Check data rows (excluding header)
  const dataRows = lines.slice(1).filter((line) => line.trim().length > 0);

  if (dataRows.length < MIN_DATA_ROWS) {
    throw new AppError(
      'INSUFFICIENT_ROWS',
      `Found ${dataRows.length} data rows, need at least ${MIN_DATA_ROWS}`
    );
  }

  // Check for oversized cells
  for (let i = 0; i < Math.min(dataRows.length, 100); i++) {
    const cells = parseCSVLine(dataRows[i]);
    for (const cell of cells) {
      if (cell.length > MAX_CELL_LENGTH) {
        throw new AppError(
          'CONTENT_SUSPICIOUS',
          `Cell exceeds ${MAX_CELL_LENGTH} characters`
        );
      }
    }
  }
}

/**
 * Parse a single CSV line handling quoted fields
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++; // Skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

/**
 * Server-side content validation
 */
export function validateContent(
  content: string,
  fileType: 'csv' | 'pdf'
): void {
  if (fileType === 'csv') {
    validateCSVStructure(content);
  }
  // PDF validation happens in pdf-parser.ts
}
