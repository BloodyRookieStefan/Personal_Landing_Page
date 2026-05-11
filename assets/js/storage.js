import {
  IDB_DB_NAME,
  IDB_STORE_NAME,
  IDB_HANDLE_KEY,
  IDB_DATA_KEY,
  DEFAULT_STORAGE_FILE_NAME,
  STORAGE_VERSION,
} from './config.js';
import { normalizeData } from './schema.js';
import { hashString } from './utils/hash.js';
import { state, storeLastSyncHash } from './state.js';

// ─────────────────────────────────────────────────────────────────────────────
// Browser capability detection
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns true when the browser supports the File System Access API for
 * direct file read/write (Chrome 86+, Edge 86+).
 * Firefox does not support showSaveFilePicker, so it uses the manual path.
 */
export function canDirectWrite() {
  return typeof window !== 'undefined' &&
    typeof window.showOpenFilePicker === 'function' &&
    typeof window.showSaveFilePicker === 'function';
}

// ─────────────────────────────────────────────────────────────────────────────
// Unsaved-changes callback (manual / Firefox mode)
// ─────────────────────────────────────────────────────────────────────────────

let _onUnsavedChange = null;

/** Register a callback that is called with (true|false) when unsaved state changes. */
export function setOnUnsavedChange(cb) {
  _onUnsavedChange = cb;
}

// ─────────────────────────────────────────────────────────────────────────────
// IndexedDB – file handle persistence (direct mode only)
// ─────────────────────────────────────────────────────────────────────────────

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_DB_NAME, 1);
    req.onupgradeneeded = (e) => {
      e.target.result.createObjectStore(IDB_STORE_NAME);
    };
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror   = ()  => reject(new Error('Could not open IndexedDB'));
  });
}

async function idbPut(value) {
  try {
    const db = await openDB();
    const tx = db.transaction(IDB_STORE_NAME, 'readwrite');
    tx.objectStore(IDB_STORE_NAME).put(value, IDB_HANDLE_KEY);
    return new Promise((resolve) => { tx.oncomplete = resolve; });
  } catch {
    // Non-fatal: handle persistence is best-effort
  }
}

async function idbGet() {
  try {
    const db  = await openDB();
    const tx  = db.transaction(IDB_STORE_NAME, 'readonly');
    const req = tx.objectStore(IDB_STORE_NAME).get(IDB_HANDLE_KEY);
    return new Promise((resolve) => {
      req.onsuccess = () => resolve(req.result || null);
      req.onerror   = () => resolve(null);
    });
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// IndexedDB – bookmark data cache (both modes)
// ─────────────────────────────────────────────────────────────────────────────

/** Persist categories + weblinks to IndexedDB so they survive page reloads. */
export async function saveDataCache(categories, weblinks) {
  try {
    const db = await openDB();
    const tx = db.transaction(IDB_STORE_NAME, 'readwrite');
    tx.objectStore(IDB_STORE_NAME).put({ categories, weblinks }, IDB_DATA_KEY);
    return new Promise((resolve) => { tx.oncomplete = resolve; });
  } catch {
    // Non-fatal: cache is best-effort
  }
}

/**
 * Load the cached bookmark data from IndexedDB.
 * Returns { categories, weblinks } or null if no cache exists.
 */
export async function loadDataCache() {
  try {
    const db  = await openDB();
    const tx  = db.transaction(IDB_STORE_NAME, 'readonly');
    const req = tx.objectStore(IDB_STORE_NAME).get(IDB_DATA_KEY);
    return new Promise((resolve) => {
      req.onsuccess = () => resolve(req.result || null);
      req.onerror   = () => resolve(null);
    });
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Direct-mode (Chrome/Edge) file-handle API
// ─────────────────────────────────────────────────────────────────────────────

/** Retrieve the previously stored file handle (may still need permission). */
export async function getStoredHandle() {
  return idbGet();
}

/**
 * Verify – and if necessary request – readwrite permission for a handle.
 * Returns true if permission is granted.
 */
export async function verifyPermission(handle) {
  const opts = { mode: 'readwrite' };
  if ((await handle.queryPermission(opts)) === 'granted') return true;
  if ((await handle.requestPermission(opts)) === 'granted') return true;
  return false;
}

/**
 * Open the system file picker so the user can choose an existing JSON file.
 * Stores the chosen handle in IndexedDB and returns it, or null on cancel/error.
 */
export async function pickExistingFile() {
  if (!canDirectWrite()) return null;
  try {
    const [handle] = await window.showOpenFilePicker({
      types:    [{ description: 'JSON', accept: { 'application/json': ['.json'] } }],
      multiple: false,
    });
    await idbPut(handle);
    return handle;
  } catch {
    return null;
  }
}

/**
 * Open the system save-file picker so the user can create a new JSON file.
 * Stores the chosen handle in IndexedDB and returns it, or null on cancel/error.
 */
export async function createNewFile() {
  if (!canDirectWrite()) return null;
  try {
    const handle = await window.showSaveFilePicker({
      suggestedName: DEFAULT_STORAGE_FILE_NAME,
      types:         [{ description: 'JSON', accept: { 'application/json': ['.json'] } }],
    });
    const text = serializePayload([], []);
    await writeRaw(handle, text);
    const hash = await hashString(text);
    storeLastSyncHash(hash);
    await idbPut(handle);
    return handle;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Manual-mode (Firefox) file import / export
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Open a file-input picker so the user can select an existing JSON file.
 * Returns { data, hash, rawText, fileName, error } or null if canceled.
 * 'error' is 'invalid-json' when the file cannot be parsed.
 */
export function importFromFileInput() {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type   = 'file';
    input.accept = '.json,application/json';
    input.style.display = 'none';
    document.body.appendChild(input);

    const cleanup = () => {
      try { document.body.removeChild(input); } catch { /* already removed */ }
    };

    input.addEventListener('cancel', () => {
      cleanup();
      resolve(null);
    });

    input.addEventListener('change', async () => {
      const file = input.files?.[0];
      cleanup();
      if (!file) { resolve(null); return; }
      try {
        const rawText = await file.text();
        let parsed;
        try {
          parsed = JSON.parse(rawText);
        } catch {
          resolve({ error: 'invalid-json', data: null, hash: null, rawText: null, fileName: file.name });
          return;
        }
        const data      = normalizeData(parsed);
        const canonical = serializePayload(data.categories, data.weblinks);
        const hash      = await hashString(canonical);
        resolve({ error: null, data, hash, rawText, fileName: file.name, fileSize: file.size, fileLastModified: file.lastModified });
      } catch {
        cleanup();
        resolve(null);
      }
    });

    input.click();
  });
}

/**
 * Serialize current categories and weblinks to a JSON string and trigger a
 * browser download.  Updates the last-sync hash and clears unsaved state.
 * Returns the hash of the exported content.
 */
export async function exportToFile(categories, weblinks, fileName) {
  const text = serializePayload(categories, weblinks);
  const blob = new Blob([text], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = fileName || DEFAULT_STORAGE_FILE_NAME;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  const hash = await hashString(text);
  storeLastSyncHash(hash);
  state.unsavedChanges = false;
  _onUnsavedChange?.(false);
  return hash;
}

// ─────────────────────────────────────────────────────────────────────────────
// Unified persist helper
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Persist the current bookmark state through the active storage path.
 * - Direct mode (Chrome/Edge): writes to the file handle immediately.
 * - Manual mode (Firefox): marks state as unsaved and notifies the UI.
 * Returns the sync hash in direct mode, or null in manual mode.
 */
export async function persistData() {
  if (state.storageMode === 'direct' && state.fileHandle) {
    const hash = await saveToHandle(state.fileHandle, state.categories, state.weblinks);
    await saveDataCache(state.categories, state.weblinks);
    return hash;
  }
  if (state.storageMode === 'manual') {
    state.unsavedChanges = true;
    _onUnsavedChange?.(true);
    await saveDataCache(state.categories, state.weblinks);
    return null;
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Read / write (direct mode internals)
// ─────────────────────────────────────────────────────────────────────────────

async function readRaw(handle) {
  const file = await handle.getFile();
  return file.text();
}

async function writeRaw(handle, text) {
  const writable = await handle.createWritable();
  await writable.write(text);
  await writable.close();
}

/**
 * Load data from the file handle.
 * Returns { data, hash, rawText } or throws on parse/permission errors.
 * The hash is computed from the canonical normalized payload so it is
 * format-independent and directly comparable to hashes produced by
 * saveToHandle() and exportToFile().
 */
export async function loadFromHandle(handle) {
  const rawText = await readRaw(handle);

  let parsed;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    throw new Error('Invalid JSON in storage file.');
  }

  const data      = normalizeData(parsed);
  const canonical = serializePayload(data.categories, data.weblinks);
  const hash      = await hashString(canonical);
  return { data, hash, rawText };
}

/**
 * Serialize the current state and write it to the file handle.
 * Only custom categories (non-default) are stored in the file.
 * Updates the last-sync hash in state and localStorage.
 */
export async function saveToHandle(handle, categories, weblinks) {
  const text = serializePayload(categories, weblinks);
  await writeRaw(handle, text);
  const hash = await hashString(text);
  storeLastSyncHash(hash);
  return hash;
}

// ─────────────────────────────────────────────────────────────────────────────
// Serialization
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Produce a deterministic JSON string for the given bookmark state.
 * Default categories are never stored in the file.
 */
export function serializePayload(categories, weblinks) {
  const payload = {
    version:    STORAGE_VERSION,
    categories: categories.filter(c => !c.isDefault),
    weblinks,
  };
  return JSON.stringify(payload, null, 2);
}
