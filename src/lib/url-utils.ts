const URL_PROTOCOL_RE = /^https?:\/\//i;

const DOMAIN_RE = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}(?:\/\S*)?$/i;

/**
 * Check if a string is a valid URL with http(s) protocol.
 */
export function isValidUrl(text: string): boolean {
  if (!URL_PROTOCOL_RE.test(text)) return false;
  try {
    new URL(text);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if a string looks like a domain without protocol (e.g. "example.com/path").
 */
export function isPassiveUrl(text: string): boolean {
  if (URL_PROTOCOL_RE.test(text)) return false;
  return DOMAIN_RE.test(text);
}

/**
 * Normalize a URL: add https:// if missing protocol.
 */
export function normalizeUrl(text: string): string {
  if (URL_PROTOCOL_RE.test(text)) return text;
  return `https://${text}`;
}

/**
 * Check if text is any kind of URL (with or without protocol).
 */
export function isAnyUrl(text: string): boolean {
  return isValidUrl(text) || isPassiveUrl(text);
}

/**
 * Extract the short code from a spoo.me URL.
 * e.g. "https://spoo.me/abc123" → "abc123"
 */
export function extractShortCode(shortUrl: string): string | null {
  try {
    const url = new URL(shortUrl);
    if (url.hostname !== "spoo.me") return null;
    const code = url.pathname.slice(1);
    return code || null;
  } catch {
    return null;
  }
}
