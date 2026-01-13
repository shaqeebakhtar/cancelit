// File validation with magic bytes, extension, and size checks

import { AppError } from '../errors';

// Configuration
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_EXTENSIONS = ['.csv', '.pdf'];
const ALLOWED_MIME_TYPES = [
  'text/csv',
  'text/plain',
  'application/csv',
  'application/pdf',
  'application/vnd.ms-excel', // Some systems use this for CSV
];

// Magic bytes for file type detection
const MAGIC_BYTES = {
  PDF: [0x25, 0x50, 0x44, 0x46], // %PDF
};

export interface ValidationResult {
  valid: boolean;
  fileType: 'csv' | 'pdf';
  error?: AppError;
}

/**
 * Validates file extension
 */
export function validateExtension(fileName: string): 'csv' | 'pdf' {
  const extension = fileName.toLowerCase().slice(fileName.lastIndexOf('.'));

  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    throw new AppError('INVALID_EXTENSION', `Extension: ${extension}`);
  }

  return extension === '.pdf' ? 'pdf' : 'csv';
}

/**
 * Validates file size
 */
export function validateFileSize(size: number): void {
  if (size === 0) {
    throw new AppError('FILE_EMPTY');
  }

  if (size > MAX_FILE_SIZE) {
    throw new AppError(
      'FILE_TOO_LARGE',
      `Size: ${(size / 1024 / 1024).toFixed(2)}MB, Max: 10MB`
    );
  }
}

/**
 * Validates MIME type
 */
export function validateMimeType(mimeType: string): void {
  if (!ALLOWED_MIME_TYPES.includes(mimeType.toLowerCase())) {
    throw new AppError('INVALID_FORMAT', `MIME type: ${mimeType}`);
  }
}

/**
 * Validates file using magic bytes (file signature)
 */
export async function validateMagicBytes(
  file: File
): Promise<'csv' | 'pdf'> {
  const buffer = await file.slice(0, 8).arrayBuffer();
  const bytes = new Uint8Array(buffer);

  // Check for PDF magic bytes (%PDF)
  const isPDF = MAGIC_BYTES.PDF.every((byte, index) => bytes[index] === byte);

  if (isPDF) {
    return 'pdf';
  }

  // For CSV, check if it starts with printable ASCII characters
  // CSV files should start with text (headers)
  const isTextBased = bytes.every(
    (byte) =>
      (byte >= 0x20 && byte <= 0x7e) || // Printable ASCII
      byte === 0x0a || // LF
      byte === 0x0d || // CR
      byte === 0x09 || // Tab
      byte >= 0xc0 // UTF-8 multibyte start
  );

  if (!isTextBased) {
    throw new AppError(
      'INVALID_FORMAT',
      'File does not appear to be text-based'
    );
  }

  return 'csv';
}

/**
 * Full client-side validation pipeline
 */
export async function validateFile(file: File): Promise<ValidationResult> {
  try {
    // Step 1: Extension check
    const extensionType = validateExtension(file.name);

    // Step 2: Size check
    validateFileSize(file.size);

    // Step 3: MIME type check
    validateMimeType(file.type || 'application/octet-stream');

    // Step 4: Magic bytes check
    const magicType = await validateMagicBytes(file);

    // Ensure extension matches magic bytes
    if (extensionType !== magicType) {
      throw new AppError(
        'INVALID_FORMAT',
        `Extension says ${extensionType}, but content is ${magicType}`
      );
    }

    return {
      valid: true,
      fileType: magicType,
    };
  } catch (error) {
    if (error instanceof AppError) {
      return {
        valid: false,
        fileType: 'csv',
        error,
      };
    }
    throw error;
  }
}
