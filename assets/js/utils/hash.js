/**
 * Compute a SHA-256 hex digest for the given string.
 * Uses the Web Crypto API (available in all modern browsers).
 */
async function hashString(str) {
  const buffer    = new TextEncoder().encode(str);
  const hashBuf   = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuf));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
