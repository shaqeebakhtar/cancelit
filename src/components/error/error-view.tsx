import type { UserError } from '@/lib/errors';
import type { ReactNode } from 'react';

interface ErrorViewProps {
  error: UserError | string;
  onRetry: () => void;
}

// SVG Icon Components
function FileIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

function ChartIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}

function PdfIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <path d="M9 15v-2h2a1 1 0 1 1 0 2H9z" />
      <path d="M9 15v2" />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function GlobeIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

function WarningIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function XCircleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  );
}

function LightbulbIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="9" y1="18" x2="15" y2="18" />
      <line x1="10" y1="22" x2="14" y2="22" />
      <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14" />
    </svg>
  );
}

// Default error for string messages
function normalizeError(error: UserError | string): UserError {
  if (typeof error === 'string') {
    return {
      code: 'UNKNOWN',
      title: 'Something Went Wrong',
      message: error,
      suggestion:
        'Please try again. If the issue persists, try a different file.',
    };
  }
  return error;
}

// Icons for different error types
function getErrorIcon(code: string): ReactNode {
  const iconClass = 'w-10 h-10 text-[#DC2626]';

  switch (code) {
    case 'FILE_EMPTY':
    case 'FILE_TOO_LARGE':
    case 'INVALID_FORMAT':
    case 'INVALID_EXTENSION':
      return <FileIcon className={iconClass} />;
    case 'NO_TRANSACTIONS':
    case 'NO_DATE_COLUMN':
    case 'NO_AMOUNT_COLUMN':
    case 'INSUFFICIENT_COLUMNS':
    case 'INSUFFICIENT_ROWS':
      return <ChartIcon className={iconClass} />;
    case 'PDF_PROTECTED':
    case 'PDF_SCANNED':
    case 'PDF_NO_TABLES':
      return <PdfIcon className={iconClass} />;
    case 'RATE_LIMITED':
      return <ClockIcon className={iconClass} />;
    case 'NETWORK_ERROR':
      return <GlobeIcon className={iconClass} />;
    case 'PARSE_ERROR':
    case 'CONTENT_SUSPICIOUS':
      return <WarningIcon className={iconClass} />;
    case 'AI_ERROR':
    default:
      return <XCircleIcon className={iconClass} />;
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
          {icon}
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
        <div className="flex items-center gap-3 text-left">
          <LightbulbIcon className="w-5 h-5 text-[#F59E0B] shrink-0" />
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
