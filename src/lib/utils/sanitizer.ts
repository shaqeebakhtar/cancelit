// Content sanitization to prevent XSS and handle malformed data

const MAX_CELL_LENGTH = 500;
const MAX_ROWS_TO_PROCESS = 1000;

/**
 * Remove null bytes from content
 */
function removeNullBytes(content: string): string {
  return content.replace(/\0/g, '');
}

/**
 * Strip HTML and script tags from content
 */
function stripHTML(content: string): string {
  // Remove script tags and their content
  let cleaned = content.replace(
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    ''
  );

  // Remove style tags and their content
  cleaned = cleaned.replace(
    /<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi,
    ''
  );

  // Remove all other HTML tags
  cleaned = cleaned.replace(/<[^>]*>/g, '');

  // Decode HTML entities
  cleaned = cleaned
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');

  return cleaned;
}

/**
 * Remove control characters (except newlines and tabs)
 */
function removeControlChars(content: string): string {
  // Keep: tab (0x09), newline (0x0a), carriage return (0x0d)
  // Remove: other control characters (0x00-0x08, 0x0b-0x0c, 0x0e-0x1f)
  return content.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, '');
}

/**
 * Normalize line endings to \n
 */
function normalizeLineEndings(content: string): string {
  return content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

/**
 * Truncate oversized cells in CSV
 */
function truncateCells(content: string): string {
  const lines = content.split('\n');
  const processedLines: string[] = [];

  for (const line of lines) {
    const cells = parseCSVLine(line);
    const truncatedCells = cells.map((cell) => {
      if (cell.length > MAX_CELL_LENGTH) {
        return cell.substring(0, MAX_CELL_LENGTH) + '...';
      }
      return cell;
    });

    // Rebuild the line, properly escaping cells with commas or quotes
    const rebuiltLine = truncatedCells
      .map((cell) => {
        if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
          return `"${cell.replace(/"/g, '""')}"`;
        }
        return cell;
      })
      .join(',');

    processedLines.push(rebuiltLine);
  }

  return processedLines.join('\n');
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
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
}

/**
 * Limit number of rows to prevent abuse
 */
function limitRows(content: string): string {
  const lines = content.split('\n');

  if (lines.length <= MAX_ROWS_TO_PROCESS + 1) {
    return content;
  }

  // Keep header + MAX_ROWS_TO_PROCESS data rows
  const header = lines[0];
  const dataRows = lines.slice(1, MAX_ROWS_TO_PROCESS + 1);

  return [header, ...dataRows].join('\n');
}

/**
 * Remove potentially dangerous patterns
 */
function removeDangerousPatterns(content: string): string {
  // Remove javascript: URLs
  let cleaned = content.replace(/javascript:/gi, '');

  // Remove data: URLs (except for legitimate data which wouldn't be in bank statements)
  cleaned = cleaned.replace(/data:[^,]*,/gi, '');

  // Remove vbscript: URLs
  cleaned = cleaned.replace(/vbscript:/gi, '');

  // Remove on* event handlers
  cleaned = cleaned.replace(/\bon\w+\s*=/gi, '');

  return cleaned;
}

/**
 * Main sanitization function for CSV content
 */
export function sanitizeCSVContent(content: string): string {
  let sanitized = content;

  // Step 1: Remove null bytes
  sanitized = removeNullBytes(sanitized);

  // Step 2: Normalize line endings
  sanitized = normalizeLineEndings(sanitized);

  // Step 3: Remove control characters
  sanitized = removeControlChars(sanitized);

  // Step 4: Strip HTML/script tags
  sanitized = stripHTML(sanitized);

  // Step 5: Remove dangerous patterns
  sanitized = removeDangerousPatterns(sanitized);

  // Step 6: Truncate oversized cells
  sanitized = truncateCells(sanitized);

  // Step 7: Limit rows
  sanitized = limitRows(sanitized);

  return sanitized.trim();
}

/**
 * Sanitize extracted PDF text
 */
export function sanitizePDFText(text: string): string {
  let sanitized = text;

  // Step 1: Remove null bytes
  sanitized = removeNullBytes(sanitized);

  // Step 2: Normalize line endings
  sanitized = normalizeLineEndings(sanitized);

  // Step 3: Remove control characters
  sanitized = removeControlChars(sanitized);

  // Step 4: Remove dangerous patterns
  sanitized = removeDangerousPatterns(sanitized);

  // Step 5: Collapse multiple spaces
  sanitized = sanitized.replace(/[ \t]+/g, ' ');

  // Step 6: Collapse multiple newlines
  sanitized = sanitized.replace(/\n{3,}/g, '\n\n');

  return sanitized.trim();
}

/**
 * Sanitize a single value (for display)
 */
export function sanitizeDisplayValue(value: string): string {
  let sanitized = stripHTML(value);
  sanitized = removeControlChars(sanitized);
  sanitized = removeDangerousPatterns(sanitized);

  if (sanitized.length > MAX_CELL_LENGTH) {
    sanitized = sanitized.substring(0, MAX_CELL_LENGTH) + '...';
  }

  return sanitized;
}
