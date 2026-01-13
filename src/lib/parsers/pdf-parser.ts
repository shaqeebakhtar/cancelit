// PDF text extraction using pdf2json with pdf-parse fallback

import { AppError } from '../errors';
import { sanitizePDFText } from '../utils/sanitizer';
import { extractTransactionsFromPDF } from '../ai/gemini-client';

// PDF magic bytes
const PDF_MAGIC = '%PDF-';

// Minimum text length to consider PDF valid
const MIN_TEXT_LENGTH = 100;

// Timeout for PDF parsing
const PDF_PARSE_TIMEOUT = 30000;

/**
 * Safely decode URI-encoded text from PDF
 * Some PDFs contain malformed URI encoding, so we handle errors gracefully
 */
function safeDecodeURIComponent(text: string): string {
  if (!text) return '';

  try {
    // First try standard decoding
    return decodeURIComponent(text);
  } catch {
    // If that fails, try to fix common issues and decode again
    try {
      // Replace standalone % signs that aren't part of valid encoding
      const fixed = text.replace(/%(?![0-9A-Fa-f]{2})/g, '%25');
      return decodeURIComponent(fixed);
    } catch {
      // If all else fails, return the original text with basic cleanup
      // Replace %20 with space manually for common cases
      return text
        .replace(/%20/g, ' ')
        .replace(/%2F/gi, '/')
        .replace(/%2C/gi, ',')
        .replace(/%2E/gi, '.')
        .replace(/%3A/gi, ':')
        .replace(/%2D/gi, '-')
        .replace(/%0A/gi, '\n')
        .replace(/%0D/gi, '\r');
    }
  }
}

/**
 * Extract text from PDF using pdf-parse (fallback parser)
 * This is more reliable for simple PDFs
 */
async function extractTextWithPdfParse(buffer: Buffer): Promise<string> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require('pdf-parse');

    const data = await pdfParse(buffer, {
      // Limit pages to prevent timeouts on large PDFs
      max: 50,
    });

    if (!data.text || data.text.trim().length === 0) {
      throw new AppError(
        'PDF_SCANNED',
        'PDF contains no extractable text - may be scanned'
      );
    }

    if (data.text.trim().length < MIN_TEXT_LENGTH) {
      throw new AppError(
        'PDF_SCANNED',
        `PDF text too short (${data.text.length} chars) - may be scanned or image-based`
      );
    }

    return data.text;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new AppError('PARSE_ERROR', `pdf-parse failed: ${message}`);
  }
}

/**
 * Extract text from PDF using pdf2json
 * This runs on the server-side only
 */
async function extractTextWithPdf2json(buffer: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    let isSettled = false;
    let timeoutId: NodeJS.Timeout | null = null;

    const safeResolve = (value: string) => {
      if (isSettled) return;
      isSettled = true;
      if (timeoutId) clearTimeout(timeoutId);
      resolve(value);
    };

    const safeReject = (error: AppError) => {
      if (isSettled) return;
      isSettled = true;
      if (timeoutId) clearTimeout(timeoutId);
      reject(error);
    };

    try {
      // Dynamic import for pdf2json
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const PDFParser = require('pdf2json');

      const pdfParser = new PDFParser(null, true); // true = don't combine text items

      // Add timeout to prevent hanging on problematic PDFs
      timeoutId = setTimeout(() => {
        safeReject(
          new AppError(
            'PARSE_ERROR',
            'PDF parsing timed out - file may be too complex or corrupted'
          )
        );
      }, PDF_PARSE_TIMEOUT);

      pdfParser.on(
        'pdfParser_dataError',
        (errData: { parserError?: Error } | Error | string) => {
          // Handle various error formats from pdf2json
          let message = 'Unknown PDF error';

          if (typeof errData === 'string') {
            message = errData;
          } else if (errData instanceof Error) {
            message = errData.message;
          } else if (errData && typeof errData === 'object') {
            if ('parserError' in errData && errData.parserError) {
              message = errData.parserError.message || 'PDF parsing failed';
            } else if ('message' in errData) {
              message = String((errData as { message: unknown }).message);
            }
          }

          if (
            message.includes('password') ||
            message.includes('encrypted') ||
            message.includes('decrypt')
          ) {
            safeReject(new AppError('PDF_PROTECTED', message));
          } else if (
            message.includes('Invalid') ||
            message.includes('corrupt') ||
            message.includes('malformed')
          ) {
            safeReject(
              new AppError(
                'INVALID_FORMAT',
                'PDF file appears to be corrupted or invalid'
              )
            );
          } else {
            safeReject(
              new AppError('PARSE_ERROR', `Failed to parse PDF: ${message}`)
            );
          }
        }
      );

      pdfParser.on(
        'pdfParser_dataReady',
        (pdfData: {
          Pages: Array<{
            Texts: Array<{
              R: Array<{ T: string }>;
            }>;
          }>;
        }) => {
          try {
            // Extract text from all pages
            const textContent: string[] = [];

            for (const page of pdfData.Pages || []) {
              const pageTexts: string[] = [];

              for (const textItem of page.Texts || []) {
                for (const run of textItem.R || []) {
                  if (run.T) {
                    // Safely decode URI-encoded text
                    const decodedText = safeDecodeURIComponent(run.T);
                    if (decodedText) {
                      pageTexts.push(decodedText);
                    }
                  }
                }
              }

              // Join text items with spaces, add newline between pages
              textContent.push(pageTexts.join(' '));
            }

            const fullText = textContent.join('\n');

            if (!fullText || fullText.trim().length === 0) {
              safeReject(
                new AppError(
                  'PDF_SCANNED',
                  'PDF contains no extractable text - may be scanned'
                )
              );
              return;
            }

            if (fullText.trim().length < MIN_TEXT_LENGTH) {
              safeReject(
                new AppError(
                  'PDF_SCANNED',
                  `PDF text too short (${fullText.length} chars) - may be scanned or image-based`
                )
              );
              return;
            }

            safeResolve(fullText);
          } catch (error) {
            const message =
              error instanceof Error ? error.message : 'Unknown error';
            safeReject(
              new AppError(
                'PARSE_ERROR',
                `Failed to process PDF data: ${message}`
              )
            );
          }
        }
      );

      // Parse the buffer
      try {
        pdfParser.parseBuffer(buffer);
      } catch (parseError) {
        const message =
          parseError instanceof Error ? parseError.message : 'Unknown error';
        safeReject(
          new AppError(
            'PARSE_ERROR',
            `Failed to initialize PDF parsing: ${message}`
          )
        );
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      safeReject(
        new AppError('PARSE_ERROR', `Failed to parse PDF: ${message}`)
      );
    }
  });
}

/**
 * Extract text from PDF using multiple parsers with fallback
 * Tries pdf2json first, then falls back to pdf-parse
 */
export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  const errors: string[] = [];

  // Try pdf2json first (better at preserving layout)
  try {
    console.log('Attempting PDF extraction with pdf2json...');
    const text = await extractTextWithPdf2json(buffer);
    console.log('pdf2json extraction successful');
    return text;
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.log('pdf2json failed:', msg);
    errors.push(`pdf2json: ${msg}`);

    // If it's a protected PDF or scanned, don't try fallback
    if (error instanceof AppError) {
      if (
        error.userError.code === 'PDF_PROTECTED' ||
        error.userError.code === 'PDF_SCANNED'
      ) {
        throw error;
      }
    }
  }

  // Fallback to pdf-parse
  try {
    console.log('Attempting PDF extraction with pdf-parse fallback...');
    const text = await extractTextWithPdfParse(buffer);
    console.log('pdf-parse extraction successful');
    return text;
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.log('pdf-parse failed:', msg);
    errors.push(`pdf-parse: ${msg}`);

    // If it's a specific error type from fallback, throw it
    if (error instanceof AppError) {
      if (
        error.userError.code === 'PDF_PROTECTED' ||
        error.userError.code === 'PDF_SCANNED'
      ) {
        throw error;
      }
    }
  }

  // Both parsers failed
  throw new AppError(
    'PARSE_ERROR',
    `Unable to parse PDF. Tried multiple parsers: ${errors.join('; ')}`
  );
}

/**
 * Process PDF file and extract transaction data
 * Returns CSV-formatted string ready for analysis
 */
export async function processPDF(buffer: Buffer): Promise<string> {
  // Validate PDF magic bytes first
  const header = buffer.slice(0, 5).toString('ascii');
  if (!header.startsWith(PDF_MAGIC)) {
    throw new AppError('INVALID_FORMAT', 'File is not a valid PDF');
  }

  // Step 1: Extract raw text from PDF
  const rawText = await extractTextFromPDF(buffer);

  // Step 2: Sanitize the extracted text
  const sanitizedText = sanitizePDFText(rawText);

  // Step 3: Check if text contains transaction-like content
  const hasTransactionMarkers = checkForTransactionContent(sanitizedText);

  if (!hasTransactionMarkers) {
    throw new AppError(
      'PDF_NO_TABLES',
      'PDF does not appear to contain transaction data'
    );
  }

  // Step 4: Use AI to extract structured transaction data
  const csvContent = await extractTransactionsFromPDF(sanitizedText);

  // Step 5: Validate the extracted CSV
  if (!csvContent || csvContent.split('\n').length < 3) {
    throw new AppError(
      'PDF_NO_TABLES',
      'Could not extract enough transaction data from PDF'
    );
  }

  return csvContent;
}

/**
 * Check if PDF text contains transaction-like content
 */
function checkForTransactionContent(text: string): boolean {
  const lowerText = text.toLowerCase();

  // Look for common transaction-related terms
  const transactionMarkers = [
    'date',
    'amount',
    'balance',
    'debit',
    'credit',
    'transaction',
    'withdrawal',
    'deposit',
    'transfer',
    'payment',
    'statement',
  ];

  const matchCount = transactionMarkers.filter((marker) =>
    lowerText.includes(marker)
  ).length;

  // Need at least 3 markers to consider it a transaction document
  return matchCount >= 3;
}

/**
 * Convert File to Buffer (for server-side processing)
 */
export async function fileToBuffer(file: File): Promise<Buffer> {
  const arrayBuffer = await file.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Client-side PDF validation (basic checks only)
 */
export async function validatePDFClient(file: File): Promise<{
  valid: boolean;
  error?: string;
}> {
  try {
    // Check file size
    if (file.size > 10 * 1024 * 1024) {
      return { valid: false, error: 'PDF file too large (max 10MB)' };
    }

    // Check magic bytes
    const header = await file.slice(0, 5).text();
    if (header !== PDF_MAGIC) {
      return { valid: false, error: 'File is not a valid PDF' };
    }

    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Failed to validate PDF',
    };
  }
}
