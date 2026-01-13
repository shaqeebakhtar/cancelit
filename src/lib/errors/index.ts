// Centralized error definitions with user-friendly messages

export interface UserError {
  code: string;
  title: string;
  message: string;
  suggestion: string;
  technical?: string;
}

export const ERROR_CATALOG: Record<string, UserError> = {
  FILE_EMPTY: {
    code: 'FILE_EMPTY',
    title: 'Empty File',
    message: 'The file you uploaded contains no data.',
    suggestion: 'Please upload a credit card statement with transaction data.',
  },
  FILE_TOO_LARGE: {
    code: 'FILE_TOO_LARGE',
    title: 'File Too Large',
    message: 'The file exceeds the 10MB limit.',
    suggestion:
      'Try exporting a shorter date range from your credit card provider, or remove unnecessary columns.',
  },
  INVALID_FORMAT: {
    code: 'INVALID_FORMAT',
    title: 'Invalid File Format',
    message: "This doesn't appear to be a valid CSV or PDF file.",
    suggestion:
      'Please upload your credit card statement in CSV or PDF format.',
  },
  INVALID_EXTENSION: {
    code: 'INVALID_EXTENSION',
    title: 'Unsupported File Type',
    message: 'Only CSV and PDF files are supported.',
    suggestion:
      'Please export your credit card statement as a CSV or PDF file and try again.',
  },
  NO_TRANSACTIONS: {
    code: 'NO_TRANSACTIONS',
    title: 'No Transactions Found',
    message: "We couldn't find any transaction data in this file.",
    suggestion:
      'Ensure your statement includes Date, Description, and Amount columns.',
  },
  NO_DATE_COLUMN: {
    code: 'NO_DATE_COLUMN',
    title: 'Missing Dates',
    message: "We couldn't identify a date column in your statement.",
    suggestion: 'Your CSV should have a column with transaction dates.',
  },
  NO_AMOUNT_COLUMN: {
    code: 'NO_AMOUNT_COLUMN',
    title: 'Missing Amounts',
    message: "We couldn't identify an amount column in your statement.",
    suggestion: 'Your CSV should have a column with transaction amounts.',
  },
  INSUFFICIENT_COLUMNS: {
    code: 'INSUFFICIENT_COLUMNS',
    title: 'Missing Columns',
    message: 'The file needs at least 3 columns (Date, Description, Amount).',
    suggestion:
      'Please ensure your credit card statement export includes all transaction details.',
  },
  INSUFFICIENT_ROWS: {
    code: 'INSUFFICIENT_ROWS',
    title: 'Not Enough Data',
    message: 'The file needs at least 5 transactions to analyze.',
    suggestion:
      'Try exporting a longer date range from your credit card provider.',
  },
  PARSE_ERROR: {
    code: 'PARSE_ERROR',
    title: 'Unable to Read File',
    message: 'We could not read this PDF file.',
    suggestion:
      'Try exporting your statement as CSV instead, or download a fresh copy from your credit card provider.',
  },
  PDF_PROTECTED: {
    code: 'PDF_PROTECTED',
    title: 'Protected PDF',
    message: 'This PDF is password protected and cannot be read.',
    suggestion: 'Please remove the password or export as CSV instead.',
  },
  PDF_SCANNED: {
    code: 'PDF_SCANNED',
    title: 'Scanned PDF',
    message: 'This appears to be a scanned document without searchable text.',
    suggestion: 'Please use the digital/text version of your statement.',
  },
  PDF_NO_TABLES: {
    code: 'PDF_NO_TABLES',
    title: 'No Transactions Found',
    message: "We couldn't find transaction data in this PDF.",
    suggestion:
      'Ensure this is a credit card statement with transactions, or try exporting as CSV for better results.',
  },
  RATE_LIMITED: {
    code: 'RATE_LIMITED',
    title: 'Too Many Requests',
    message: "You've made too many requests. Please wait a moment.",
    suggestion: 'Try again in 1 minute.',
  },
  AI_ERROR: {
    code: 'AI_ERROR',
    title: 'Analysis Failed',
    message: 'We encountered an error while analyzing your transactions.',
    suggestion: 'Please try again. If the issue persists, try a smaller file.',
  },
  NETWORK_ERROR: {
    code: 'NETWORK_ERROR',
    title: 'Connection Error',
    message: "We couldn't connect to our analysis service.",
    suggestion: 'Check your internet connection and try again.',
  },
  CONTENT_SUSPICIOUS: {
    code: 'CONTENT_SUSPICIOUS',
    title: 'Invalid Content',
    message: 'The file contains unexpected content that cannot be processed.',
    suggestion: 'Please upload a valid credit card statement export.',
  },
  ENCODING_ERROR: {
    code: 'ENCODING_ERROR',
    title: 'Encoding Issue',
    message: 'The file uses an unsupported text encoding.',
    suggestion:
      'Try saving the file as UTF-8 encoded CSV, or export again from your credit card provider.',
  },
};

export class AppError extends Error {
  public readonly userError: UserError;
  public readonly technical?: string;

  constructor(code: keyof typeof ERROR_CATALOG, technical?: string) {
    const error = ERROR_CATALOG[code] || ERROR_CATALOG.PARSE_ERROR;
    super(error.message);
    this.name = 'AppError';
    this.userError = { ...error, technical };
    this.technical = technical;
  }

  toJSON(): UserError {
    return this.userError;
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export function getErrorResponse(error: unknown): UserError {
  if (isAppError(error)) {
    return error.toJSON();
  }

  if (error instanceof Error) {
    return {
      ...ERROR_CATALOG.AI_ERROR,
      technical: error.message,
    };
  }

  return ERROR_CATALOG.AI_ERROR;
}
