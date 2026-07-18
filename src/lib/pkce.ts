/**
 * PKCE (RFC 7636) helpers for the device authorization flow.
 *
 * Mirrors the S256 approach used by spoo-cli and spoo-raycast: a 32-byte
 * random verifier encoded as unpadded base64url (43 chars), with an
 * S256 challenge of BASE64URL(SHA-256(verifier)).
 */

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Generate a PKCE code verifier: 32 random bytes as unpadded base64url (43 chars). */
export function generateCodeVerifier(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return base64UrlEncode(bytes);
}

/** Derive the S256 challenge for a verifier: BASE64URL(SHA-256(verifier)), unpadded. */
export async function deriveCodeChallenge(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  return base64UrlEncode(new Uint8Array(digest));
}
