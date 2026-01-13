// IP-based rate limiting for API protection

import { AppError } from '../errors';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store for rate limiting
// In production, use Redis or similar for distributed systems
const rateLimitStore = new Map<string, RateLimitEntry>();

// Configuration
const WINDOW_MS = 60 * 1000; // 1 minute window
const MAX_REQUESTS = 5; // 5 requests per window
const CLEANUP_INTERVAL = 5 * 60 * 1000; // Clean up every 5 minutes

/**
 * Clean up expired entries to prevent memory leaks
 */
function cleanupExpiredEntries(): void {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

// Run cleanup periodically (only in Node.js environment)
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupExpiredEntries, CLEANUP_INTERVAL);
}

/**
 * Get client IP from request headers
 */
export function getClientIP(request: Request): string {
  // Check various headers that might contain the real IP
  const headers = request.headers;

  // Vercel/Cloudflare headers
  const forwardedFor = headers.get('x-forwarded-for');
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwardedFor.split(',')[0].trim();
  }

  // Cloudflare specific
  const cfConnectingIP = headers.get('cf-connecting-ip');
  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  // Vercel specific
  const vercelForwardedFor = headers.get('x-vercel-forwarded-for');
  if (vercelForwardedFor) {
    return vercelForwardedFor.split(',')[0].trim();
  }

  // Real IP header (nginx)
  const realIP = headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  // Fallback to a generic identifier
  return 'unknown';
}

/**
 * Check if request is rate limited
 */
export function checkRateLimit(clientIP: string): void {
  const now = Date.now();
  const entry = rateLimitStore.get(clientIP);

  if (!entry) {
    // First request from this IP
    rateLimitStore.set(clientIP, {
      count: 1,
      resetTime: now + WINDOW_MS,
    });
    return;
  }

  // Check if window has expired
  if (now > entry.resetTime) {
    // Reset the window
    rateLimitStore.set(clientIP, {
      count: 1,
      resetTime: now + WINDOW_MS,
    });
    return;
  }

  // Increment count
  entry.count++;

  if (entry.count > MAX_REQUESTS) {
    const waitTime = Math.ceil((entry.resetTime - now) / 1000);
    throw new AppError(
      'RATE_LIMITED',
      `Try again in ${waitTime} seconds. IP: ${clientIP.substring(0, 8)}...`
    );
  }

  rateLimitStore.set(clientIP, entry);
}

/**
 * Get remaining requests for an IP
 */
export function getRemainingRequests(clientIP: string): number {
  const entry = rateLimitStore.get(clientIP);

  if (!entry) {
    return MAX_REQUESTS;
  }

  const now = Date.now();
  if (now > entry.resetTime) {
    return MAX_REQUESTS;
  }

  return Math.max(0, MAX_REQUESTS - entry.count);
}

/**
 * Get rate limit headers for response
 */
export function getRateLimitHeaders(clientIP: string): Record<string, string> {
  const entry = rateLimitStore.get(clientIP);
  const now = Date.now();

  if (!entry || now > entry.resetTime) {
    return {
      'X-RateLimit-Limit': String(MAX_REQUESTS),
      'X-RateLimit-Remaining': String(MAX_REQUESTS),
      'X-RateLimit-Reset': String(Math.ceil((now + WINDOW_MS) / 1000)),
    };
  }

  return {
    'X-RateLimit-Limit': String(MAX_REQUESTS),
    'X-RateLimit-Remaining': String(Math.max(0, MAX_REQUESTS - entry.count)),
    'X-RateLimit-Reset': String(Math.ceil(entry.resetTime / 1000)),
  };
}

/**
 * Rate limit middleware for API routes
 */
export function withRateLimit(
  handler: (request: Request) => Promise<Response>
): (request: Request) => Promise<Response> {
  return async (request: Request): Promise<Response> => {
    const clientIP = getClientIP(request);

    try {
      checkRateLimit(clientIP);
    } catch (error) {
      if (error instanceof AppError) {
        const headers = getRateLimitHeaders(clientIP);
        return new Response(
          JSON.stringify({
            error: error.userError,
          }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              ...headers,
            },
          }
        );
      }
      throw error;
    }

    // Add rate limit headers to successful responses
    const response = await handler(request);
    const headers = getRateLimitHeaders(clientIP);

    // Clone response and add headers
    const newHeaders = new Headers(response.headers);
    Object.entries(headers).forEach(([key, value]) => {
      newHeaders.set(key, value);
    });

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  };
}
