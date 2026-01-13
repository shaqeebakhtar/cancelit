// Gemini AI client for transaction analysis

import { generateText } from 'ai';
import { google } from '@ai-sdk/google';
import { AppError } from '../errors';
import type { FullAnalysisResult } from '../types';
import { buildAnalysisPrompt, buildPDFExtractionPrompt } from './prompts';
import {
  cleanJsonResponse,
  cleanCsvResponse,
  sanitizeFullAnalysisResult,
} from './response-sanitizer';

/**
 * Analyze transactions using Gemini AI
 */
export async function analyzeTransactions(
  csvContent: string
): Promise<FullAnalysisResult> {
  const prompt = buildAnalysisPrompt(csvContent);

  try {
    const { text } = await generateText({
      model: google('gemini-2.5-flash'),
      prompt: prompt,
      temperature: 0.1,
    });

    // Clean the response
    const jsonString = cleanJsonResponse(text);

    let parsed: FullAnalysisResult;
    try {
      parsed = JSON.parse(jsonString) as FullAnalysisResult;
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Raw response:', text.substring(0, 500));
      throw new AppError('AI_ERROR', 'Failed to parse AI response as JSON');
    }

    // Validate and sanitize the response
    return sanitizeFullAnalysisResult(parsed);
  } catch (error) {
    console.error('Gemini API error:', error);

    if (error instanceof AppError) {
      throw error;
    }

    if (error instanceof SyntaxError) {
      throw new AppError('AI_ERROR', 'Invalid JSON response from AI');
    }

    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new AppError('AI_ERROR', message);
  }
}

/**
 * Extract transaction data from PDF text using AI
 */
export async function extractTransactionsFromPDF(
  pdfText: string
): Promise<string> {
  const prompt = buildPDFExtractionPrompt(pdfText);

  try {
    const { text } = await generateText({
      model: google('gemini-2.5-flash'),
      prompt: prompt,
      temperature: 0.1,
    });

    // Clean the response
    const csvContent = cleanCsvResponse(text);

    // Validate we got something usable
    if (!csvContent || csvContent.trim().length === 0) {
      console.error('AI returned empty response for PDF extraction');
      throw new AppError(
        'PDF_NO_TABLES',
        'AI could not identify transaction data in the PDF'
      );
    }

    // Check if the response looks like CSV (has at least a header and one data row)
    const lines = csvContent.split('\n').filter((line) => line.trim());
    if (lines.length < 2) {
      console.error('AI response has insufficient rows:', lines.length);
      throw new AppError(
        'PDF_NO_TABLES',
        'AI could not extract enough transaction rows from PDF'
      );
    }

    // Validate the header looks like transaction data
    const header = lines[0].toLowerCase();
    if (
      !header.includes('date') &&
      !header.includes('amount') &&
      !header.includes('description')
    ) {
      console.error('AI response does not have expected CSV headers:', header);
      throw new AppError(
        'PDF_NO_TABLES',
        'AI response does not contain valid transaction structure'
      );
    }

    return csvContent;
  } catch (error) {
    // Re-throw AppErrors
    if (error instanceof AppError) {
      throw error;
    }

    console.error('PDF extraction error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';

    // Check for specific API errors
    if (message.includes('rate') || message.includes('quota')) {
      throw new AppError('RATE_LIMITED', 'AI API rate limit exceeded');
    }
    if (message.includes('timeout') || message.includes('DEADLINE')) {
      throw new AppError(
        'AI_ERROR',
        'AI request timed out - PDF may be too large'
      );
    }

    throw new AppError(
      'PDF_NO_TABLES',
      `Failed to extract transactions from PDF: ${message}`
    );
  }
}
