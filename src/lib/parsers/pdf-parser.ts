// PDF text extraction using pdf2json

import { AppError } from '../errors';
import { sanitizePDFText } from '../utils/sanitizer';
import { extractTransactionsFromPDF } from '../ai/gemini-client';

// PDF magic bytes
const PDF_MAGIC = '%PDF-';

// Minimum text length to consider PDF valid
const MIN_TEXT_LENGTH = 100;

/**
 * Extract text from PDF using pdf2json
 * This runs on the server-side only
 */
export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      // Dynamic import for pdf2json
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const PDFParser = require('pdf2json');

      const pdfParser = new PDFParser(null, true); // true = don't combine text items

      pdfParser.on('pdfParser_dataError', (errData: { parserError: Error }) => {
        const message = errData.parserError?.message || 'Unknown PDF error';

        if (
          message.includes('password') ||
          message.includes('encrypted') ||
          message.includes('decrypt')
        ) {
          reject(new AppError('PDF_PROTECTED', message));
        } else {
          reject(
            new AppError('PARSE_ERROR', `Failed to parse PDF: ${message}`)
          );
        }
      });

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
                    // Decode URI-encoded text
                    const decodedText = decodeURIComponent(run.T);
                    pageTexts.push(decodedText);
                  }
                }
              }

              // Join text items with spaces, add newline between pages
              textContent.push(pageTexts.join(' '));
            }

            const fullText = textContent.join('\n');

            if (!fullText || fullText.trim().length === 0) {
              reject(
                new AppError(
                  'PDF_SCANNED',
                  'PDF contains no extractable text - may be scanned'
                )
              );
              return;
            }

            if (fullText.trim().length < MIN_TEXT_LENGTH) {
              reject(
                new AppError(
                  'PDF_SCANNED',
                  `PDF text too short (${fullText.length} chars) - may be scanned or image-based`
                )
              );
              return;
            }

            resolve(fullText);
          } catch (error) {
            const message =
              error instanceof Error ? error.message : 'Unknown error';
            reject(
              new AppError(
                'PARSE_ERROR',
                `Failed to process PDF data: ${message}`
              )
            );
          }
        }
      );

      // Parse the buffer
      pdfParser.parseBuffer(buffer);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      reject(new AppError('PARSE_ERROR', `Failed to parse PDF: ${message}`));
    }
  });
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
