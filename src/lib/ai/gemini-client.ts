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
    return cleanCsvResponse(text);
  } catch (error) {
    console.error('PDF extraction error:', error);
    throw new AppError(
      'PDF_NO_TABLES',
      'Failed to extract transactions from PDF'
    );
  }
}
