import { createHmac, createHash, timingSafeEqual } from 'crypto';
import { config } from '../config.js';

export function hashApiKey(key: string): string {
  return createHmac('sha256', config.API_KEY_SALT).update(key).digest('hex');
}

export function hashWebhookPayload(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload, 'utf8').digest('hex');
}

export function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return timingSafeEqual(bufA, bufB);
}

export function sha256(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}
