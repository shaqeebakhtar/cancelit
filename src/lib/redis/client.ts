// Upstash Redis client for job storage

import { Redis } from '@upstash/redis';

// Lazy-initialize Redis client to avoid build-time errors
let _redis: Redis | null = null;

export function getRedis(): Redis {
  if (_redis) {
    return _redis;
  }

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    throw new Error(
      'Missing Redis configuration. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN environment variables.'
    );
  }

  _redis = new Redis({ url, token });
  return _redis;
}

// For backwards compatibility, export redis as a getter
export const redis = new Proxy({} as Redis, {
  get(_, prop) {
    const client = getRedis();
    const value = client[prop as keyof Redis];
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  },
});
