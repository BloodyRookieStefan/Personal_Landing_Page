import { get, set } from 'idb-keyval';
import {
  StorageData,
  serializeStorageData,
  deserializeStorageData,
} from './serializers';
import { SyncFingerprint, computeContentHash } from './sync-service';

const FILE_HANDLE_KEY = 'bookmark-dashboard-file-handle';

export interface FileReadResult {
  data: StorageData;
  fingerprint: SyncFingerprint;
}

export async function getStoredFileHandle(): Promise<FileSystemFileHandle | null> {
  try {
    const handle = await get<FileSystemFileHandle>(FILE_HANDLE_KEY);
    return handle ?? null;
  } catch {
    return null;
  }
}

export async function storeFileHandle(handle: FileSystemFileHandle): Promise<void> {
  await set(FILE_HANDLE_KEY, handle);
}

export async function requestNewFileHandle(): Promise<FileSystemFileHandle | null> {
  if (!isFileSystemAccessSupported()) return null;
  try {
    const handle = await (window as unknown as Window & {
      showSaveFilePicker: (opts: unknown) => Promise<FileSystemFileHandle>;
    }).showSaveFilePicker({
      suggestedName: 'weblinks.json',
      types: [{ description: 'JSON files', accept: { 'application/json': ['.json'] } }],
    });
    return handle;
  } catch (err) {
    if ((err as Error).name === 'AbortError') return null;
    throw err;
  }
}

export async function openExistingFileHandle(): Promise<FileSystemFileHandle | null> {
  if (!isFileSystemAccessSupported()) return null;
  try {
    const [handle] = await (window as unknown as Window & {
      showOpenFilePicker: (opts: unknown) => Promise<FileSystemFileHandle[]>;
    }).showOpenFilePicker({
      types: [{ description: 'JSON files', accept: { 'application/json': ['.json'] } }],
      multiple: false,
    });
    return handle;
  } catch (err) {
    if ((err as Error).name === 'AbortError') return null;
    throw err;
  }
}

export async function verifyPermission(handle: FileSystemFileHandle): Promise<boolean> {
  try {
    const opts = { mode: 'readwrite' };
    const perm = await (handle as unknown as {
      queryPermission: (o: unknown) => Promise<string>;
      requestPermission: (o: unknown) => Promise<string>;
    }).queryPermission(opts);
    if (perm === 'granted') return true;
    const requested = await (handle as unknown as {
      requestPermission: (o: unknown) => Promise<string>;
    }).requestPermission(opts);
    return requested === 'granted';
  } catch {
    return false;
  }
}

export async function readFileHandle(handle: FileSystemFileHandle): Promise<FileReadResult> {
  const file = await handle.getFile();
  const raw = await file.text();
  // Let deserializeStorageData throw on invalid structure so callers can
  // surface a proper error instead of silently returning empty data (REQ-003).
  const data = deserializeStorageData(raw);
  const contentHash = await computeContentHash(raw);
  return {
    data,
    fingerprint: { lastModified: file.lastModified, contentHash },
  };
}

export async function writeFileHandle(
  handle: FileSystemFileHandle,
  data: StorageData
): Promise<SyncFingerprint> {
  const raw = serializeStorageData(data);
  const writable = await (handle as unknown as {
    createWritable: () => Promise<{ write: (d: string) => Promise<void>; close: () => Promise<void> }>;
  }).createWritable();
  await writable.write(raw);
  await writable.close();
  const file = await handle.getFile();
  const contentHash = await computeContentHash(raw);
  return { lastModified: file.lastModified, contentHash };
}

export function isFileSystemAccessSupported(): boolean {
  return typeof window !== 'undefined' &&
    'showSaveFilePicker' in window &&
    'showOpenFilePicker' in window;
}

export function downloadJsonFallback(data: StorageData, filename = 'weblinks.json'): void {
  const raw = serializeStorageData(data);
  const blob = new Blob([raw], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
