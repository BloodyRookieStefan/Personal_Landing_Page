const SYNC_FINGERPRINT_KEY = 'bookmark-dashboard-sync-fingerprint';

export interface SyncFingerprint {
  lastModified: number;
  contentHash: string;
}

export function loadSyncFingerprint(): SyncFingerprint | null {
  const raw = localStorage.getItem(SYNC_FINGERPRINT_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SyncFingerprint;
  } catch {
    return null;
  }
}

export function saveSyncFingerprint(fingerprint: SyncFingerprint): void {
  localStorage.setItem(SYNC_FINGERPRINT_KEY, JSON.stringify(fingerprint));
}

export function clearSyncFingerprint(): void {
  localStorage.removeItem(SYNC_FINGERPRINT_KEY);
}

export async function computeContentHash(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function hasFileChanged(
  current: SyncFingerprint,
  stored: SyncFingerprint | null
): boolean {
  if (!stored) return false;
  return current.lastModified !== stored.lastModified || current.contentHash !== stored.contentHash;
}
