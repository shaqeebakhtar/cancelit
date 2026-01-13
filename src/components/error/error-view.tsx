import type { UserError } from '@/lib/errors';

interface ErrorViewProps {
  error: UserError | string;
  onRetry: () => void;
}

// Default error for string messages
function normalizeError(error: UserError | string): UserError {
  if (typeof error === 'string') {
    return {
      code: 'UNKNOWN',
      title: 'Something Went Wrong',
      message: error,
      suggestion: 'Please try again. If the issue persists, try a different file.',
    };
  }
  return error;
}

// Icons for different error types
function getErrorIcon(code: string): string {
  switch (code) {
    case 'FILE_EMPTY':
    case 'FILE_TOO_LARGE':
    case 'INVALID_FORMAT':
    case 'INVALID_EXTENSION':
      return '📄';
    case 'NO_TRANSACTIONS':
    case 'NO_DATE_COLUMN':
    case 'NO_AMOUNT_COLUMN':
    case 'INSUFFICIENT_COLUMNS':
    case 'INSUFFICIENT_ROWS':
      return '📊';
    case 'PDF_PROTECTED':
    case 'PDF_SCANNED':
    case 'PDF_NO_TABLES':
      return '📑';
    case 'RATE_LIMITED':
      return '⏱️';
    case 'NETWORK_ERROR':
      return '🌐';
    case 'PARSE_ERROR':
    case 'CONTENT_SUSPICIOUS':
      return '⚠️';
    case 'AI_ERROR':
    default:
      return '❌';
  }
}

export default function ErrorView({ error, onRetry }: ErrorViewProps) {
  const normalizedError = normalizeError(error);
  const icon = getErrorIcon(normalizedError.code);

  return (
    <div className="w-full max-w-xl mx-auto text-center py-16 animate-fade-in">
      {/* Error Icon */}
      <div className="mb-6">
        <div className="w-20 h-20 border-2 border-[#DC2626] flex items-center justify-center mx-auto">
          <span className="text-4xl">{icon}</span>
        </div>
      </div>

      {/* Error Title */}
      <h3 className="heading-section text-2xl md:text-3xl mb-2 text-[#DC2626]">
        {normalizedError.title.toUpperCase()}
      </h3>

      {/* Divider */}
      <div className="w-24 h-[2px] bg-[#DC2626] mx-auto mb-6" />

      {/* Error Message */}
      <p className="text-[#0A0A0A] mb-4 max-w-md mx-auto text-lg">
        {normalizedError.message}
      </p>

      {/* Suggestion */}
      <div className="bg-[#FAFAFA] border-2 border-[#E5E5E5] p-4 mb-8 max-w-md mx-auto">
        <div className="flex items-start gap-3 text-left">
          <span className="text-xl">💡</span>
          <p className="text-sm text-[#525252]">{normalizedError.suggestion}</p>
        </div>
      </div>

      {/* Technical Details (if available) */}
      {normalizedError.technical && (
        <details className="mb-8 text-left max-w-md mx-auto">
          <summary className="text-xs text-[#525252] cursor-pointer hover:text-[#0A0A0A]">
            Technical details
          </summary>
          <pre className="mt-2 p-3 bg-[#FAFAFA] border border-[#E5E5E5] text-xs text-[#525252] overflow-x-auto">
            {normalizedError.technical}
          </pre>
        </details>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <button onClick={onRetry} className="btn-primary">
          TRY AGAIN
        </button>
        {normalizedError.code === 'PDF_SCANNED' && (
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              onRetry();
            }}
            className="btn-secondary"
          >
            USE CSV INSTEAD
          </a>
        )}
      </div>

      {/* Error Code */}
      <p className="mt-8 text-xs text-[#9CA3AF]">
        Error code: {normalizedError.code}
      </p>
    </div>
  );
}
