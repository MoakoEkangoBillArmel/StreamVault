/**
 * Utility to sanitize headers before exposing them to the client.
 * Only safe, public headers are allowed through.
 * NEVER expose tokens, credentials, cookies, or API keys.
 */

const ALLOWED_PUBLIC_HEADERS = new Set([
  'referer',
  'origin',
  'accept',
  'accept-language',
]);

export function sanitizeHeaders(
  headers: Record<string, string> | undefined
): Record<string, string> | undefined {
  if (!headers) return undefined;

  const sanitized: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    if (ALLOWED_PUBLIC_HEADERS.has(key.toLowerCase())) {
      sanitized[key] = value;
    }
  }

  return Object.keys(sanitized).length > 0 ? sanitized : undefined;
}
