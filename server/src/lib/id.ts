import { nanoid } from 'nanoid';

// 26-char ULID-like nanoid — lexicographically sortable-ish, URL safe
const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

export function generateId(): string {
  return nanoid(26);
}

export function generateApiKey(): { key: string; prefix: string } {
  const secret = nanoid(40);
  const prefix = `obp_${secret.slice(0, 8)}`;
  const key = `${prefix}_${secret.slice(8)}`;
  return { key, prefix };
}

export function generateWebhookSecret(): string {
  return nanoid(48);
}
