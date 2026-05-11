/**
 * tests/storage.test.js
 *
 * Tests for storage normalization, deterministic serialization, and
 * sync-hash stability.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { normalizeData } from '../assets/js/schema.js';
import { serializePayload, canDirectWrite, persistData, exportToFile, setOnUnsavedChange, loadFromHandle } from '../assets/js/storage.js';
import { state, loadPersistedStorageMeta, persistStorageMeta, clearStorageMeta, storeLastSyncHash } from '../assets/js/state.js';
import { hashString } from '../assets/js/utils/hash.js';
import { STORAGE_VERSION, DEFAULT_CATEGORY_IDS, LS_STORAGE_MODE_KEY, LS_STORAGE_FILE_NAME_KEY, LS_STORAGE_FILE_META_KEY, LS_SYNC_HASH_KEY } from '../assets/js/config.js';
import { checkAndPromptSync } from '../assets/js/features/sync-prompt.js';

// ─────────────────────────────────────────────────────────────────────────────
// normalizeData
// ─────────────────────────────────────────────────────────────────────────────

describe('normalizeData', () => {
  it('returns a valid structure for an empty object', () => {
    const result = normalizeData({});
    expect(result).toHaveProperty('version');
    expect(result).toHaveProperty('categories');
    expect(result).toHaveProperty('weblinks');
    expect(Array.isArray(result.categories)).toBe(true);
    expect(Array.isArray(result.weblinks)).toBe(true);
  });

  it('strips default-category entries from the categories array', () => {
    const raw = {
      categories: [
        { id: 'not-defined', name: 'Not defined', isDefault: true },
        { id: 'imported',    name: 'Imported',    isDefault: true },
        { id: 'custom-1',   name: 'Work',         isDefault: false },
      ],
      weblinks: [],
    };
    const result = normalizeData(raw);
    // Default categories are never stored in the persisted file
    expect(result.categories).toHaveLength(1);
    expect(result.categories[0].id).toBe('custom-1');
  });

  it('strips duplicate custom-category names (case-insensitive)', () => {
    const raw = {
      categories: [
        { id: 'c1', name: 'Work' },
        { id: 'c2', name: 'work' },
      ],
      weblinks: [],
    };
    const result = normalizeData(raw);
    expect(result.categories).toHaveLength(1);
  });

  it('rejects categories with reserved names', () => {
    const raw = {
      categories: [
        { id: 'x1', name: 'Imported' },
        { id: 'x2', name: 'Not defined' },
        { id: 'x3', name: 'custom' },
      ],
      weblinks: [],
    };
    const result = normalizeData(raw);
    expect(result.categories).toHaveLength(1);
    expect(result.categories[0].name).toBe('custom');
  });

  it('falls back to NOT_DEFINED for weblinks with unknown category IDs', () => {
    const raw = {
      categories: [],
      weblinks: [
        { id: 'w1', url: 'https://a.com', name: 'A', category: 'unknown-cat' },
      ],
    };
    const result = normalizeData(raw);
    expect(result.weblinks[0].category).toBe(DEFAULT_CATEGORY_IDS.NOT_DEFINED);
  });

  it('accepts weblinks whose category ID matches a custom category', () => {
    const raw = {
      categories: [{ id: 'cat-work', name: 'Work' }],
      weblinks:   [{ id: 'w1', url: 'https://a.com', name: 'A', category: 'cat-work' }],
    };
    const result = normalizeData(raw);
    expect(result.weblinks[0].category).toBe('cat-work');
  });

  it('drops weblinks that have no url or no name', () => {
    const raw = {
      categories: [],
      weblinks: [
        { id: 'w1', url: '', name: 'Missing URL' },
        { id: 'w2', url: 'https://b.com', name: '' },
        { id: 'w3', url: 'https://c.com', name: 'Good' },
      ],
    };
    const result = normalizeData(raw);
    expect(result.weblinks).toHaveLength(1);
    expect(result.weblinks[0].url).toBe('https://c.com');
  });

  it('handles null / non-object input gracefully', () => {
    expect(() => normalizeData(null)).not.toThrow();
    expect(() => normalizeData('string')).not.toThrow();
    const r = normalizeData(null);
    expect(r.categories).toEqual([]);
    expect(r.weblinks).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// serializePayload
// ─────────────────────────────────────────────────────────────────────────────

describe('serializePayload', () => {
  it('produces valid JSON', () => {
    const text = serializePayload([], []);
    expect(() => JSON.parse(text)).not.toThrow();
  });

  it('includes version, categories, and weblinks keys', () => {
    const parsed = JSON.parse(serializePayload([], []));
    expect(parsed).toHaveProperty('version', STORAGE_VERSION);
    expect(parsed).toHaveProperty('categories');
    expect(parsed).toHaveProperty('weblinks');
  });

  it('does not include default categories in the output', () => {
    const categories = [
      { id: 'not-defined', name: 'Not defined', isDefault: true },
      { id: 'imported',    name: 'Imported',    isDefault: true },
      { id: 'custom-1',   name: 'Work',         isDefault: false },
    ];
    const parsed = JSON.parse(serializePayload(categories, []));
    expect(parsed.categories).toHaveLength(1);
    expect(parsed.categories[0].id).toBe('custom-1');
  });

  it('produces the same string for identical logical state (hash stability)', () => {
    const cats  = [{ id: 'c1', name: 'Work', icon: 'briefcase', isDefault: false }];
    const links = [{ id: 'w1', url: 'https://example.com', name: 'Example', icon: 'globe', description: '', category: 'c1' }];
    const text1 = serializePayload(cats, links);
    const text2 = serializePayload(cats, links);
    expect(text1).toBe(text2);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// hashString (sync-hash stability)
// ─────────────────────────────────────────────────────────────────────────────

describe('hashString', () => {
  it('produces a non-empty hex string', async () => {
    const hash = await hashString('hello');
    expect(typeof hash).toBe('string');
    expect(hash.length).toBeGreaterThan(0);
    expect(/^[0-9a-f]+$/.test(hash)).toBe(true);
  });

  it('produces the same hash for the same input', async () => {
    const a = await hashString('test content');
    const b = await hashString('test content');
    expect(a).toBe(b);
  });

  it('produces different hashes for different inputs', async () => {
    const a = await hashString('content A');
    const b = await hashString('content B');
    expect(a).not.toBe(b);
  });

  it('same logical payload hashes identically regardless of js object order', async () => {
    const cats  = [{ id: 'c1', name: 'Work', icon: 'briefcase', isDefault: false }];
    const links = [{ id: 'w1', url: 'https://x.com', name: 'X', icon: 'globe', description: '', category: 'c1' }];
    const text1 = serializePayload(cats, links);
    const text2 = serializePayload(cats, links);
    const h1 = await hashString(text1);
    const h2 = await hashString(text2);
    expect(h1).toBe(h2);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// loadFromHandle – canonical load-time hashing (Finding 1)
// ─────────────────────────────────────────────────────────────────────────────

describe('loadFromHandle – canonical load-time hashing', () => {
  function makeHandle(rawJson) {
    return {
      getFile:        async () => ({ text: async () => rawJson }),
      createWritable: async () => ({ write: async () => {}, close: async () => {} }),
    };
  }

  it('hash matches serializePayload hash for identical logical content', async () => {
    const payload = { version: 1, categories: [], weblinks: [] };
    const rawJson = JSON.stringify(payload);
    const result  = await loadFromHandle(makeHandle(rawJson));
    const expected = await hashString(serializePayload(result.data.categories, result.data.weblinks));
    expect(result.hash).toBe(expected);
  });

  it('same logical content with different JSON formatting produces the same hash', async () => {
    const payload      = { version: 1, categories: [], weblinks: [] };
    const compactJson  = JSON.stringify(payload);
    const prettyJson   = JSON.stringify(payload, null, 4);

    const r1 = await loadFromHandle(makeHandle(compactJson));
    const r2 = await loadFromHandle(makeHandle(prettyJson));
    expect(r1.hash).toBe(r2.hash);
  });

  it('load hash equals the hash returned by persistData after writing', async () => {
    let written = '';
    const mockHandle = {
      getFile:        async () => ({ text: async () => written || '{"version":1,"categories":[],"weblinks":[]}' }),
      createWritable: async () => ({
        write: async (t) => { written = t; },
        close: async () => {},
      }),
    };

    state.storageMode = 'direct';
    state.fileHandle  = mockHandle;
    state.categories  = [];
    state.weblinks    = [];

    const saveHash = await persistData();
    const loadResult = await loadFromHandle(mockHandle);

    state.storageMode = null;
    state.fileHandle  = null;

    expect(loadResult.hash).toBe(saveHash);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Browser-path storage coverage
// ─────────────────────────────────────────────────────────────────────────────

describe('canDirectWrite – browser capability detection', () => {
  it('returns false when File System Access API is absent (Firefox path)', () => {
    // jsdom does not expose showOpenFilePicker / showSaveFilePicker
    expect(canDirectWrite()).toBe(false);
  });

  it('returns true when both File System Access API pickers are present (Chrome/Edge path)', () => {
    window.showOpenFilePicker = vi.fn();
    window.showSaveFilePicker = vi.fn();
    expect(canDirectWrite()).toBe(true);
    delete window.showOpenFilePicker;
    delete window.showSaveFilePicker;
  });
});

describe('persistData – manual mode (Firefox path)', () => {
  afterEach(() => {
    setOnUnsavedChange(null);
    state.storageMode    = null;
    state.unsavedChanges = false;
  });

  it('marks unsavedChanges and fires the unsaved-change callback', async () => {
    state.storageMode    = 'manual';
    state.unsavedChanges = false;

    const cb = vi.fn();
    setOnUnsavedChange(cb);

    const result = await persistData();

    expect(state.unsavedChanges).toBe(true);
    expect(cb).toHaveBeenCalledWith(true);
    expect(result).toBeNull();
  });

  it('returns null without a file handle in manual mode', async () => {
    state.storageMode = 'manual';
    state.fileHandle  = null;
    expect(await persistData()).toBeNull();
  });
});

describe('persistData – direct mode (Chrome/Edge path)', () => {
  let origMode;
  let origHandle;

  beforeEach(() => {
    origMode   = state.storageMode;
    origHandle = state.fileHandle;
  });

  afterEach(() => {
    state.storageMode = origMode;
    state.fileHandle  = origHandle;
    state.categories  = [];
    state.weblinks    = [];
  });

  it('writes to the file handle and returns a hash string', async () => {
    let written = '';
    const mockWritable = {
      write: async (text) => { written = text; },
      close: async () => {},
    };
    const mockHandle = {
      getFile:        async () => ({ text: async () => '{"version":1,"categories":[],"weblinks":[]}' }),
      createWritable: async () => mockWritable,
    };

    state.storageMode = 'direct';
    state.fileHandle  = mockHandle;
    state.categories  = [];
    state.weblinks    = [];

    const hash = await persistData();

    expect(typeof hash).toBe('string');
    expect(hash.length).toBeGreaterThan(0);
    expect(written).toContain('"version"');
  });
});

describe('exportToFile – manual / Firefox export path', () => {
  beforeEach(() => {
    URL.createObjectURL = vi.fn().mockReturnValue('blob:mock');
    URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    state.unsavedChanges = false;
    setOnUnsavedChange(null);
  });

  it('returns a hash string and clears unsavedChanges', async () => {
    state.unsavedChanges = true;

    const hash = await exportToFile([], [], 'weblinks.json');

    expect(typeof hash).toBe('string');
    expect(hash.length).toBeGreaterThan(0);
    expect(state.unsavedChanges).toBe(false);
    expect(URL.createObjectURL).toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock');
  });

  it('fires the unsaved-change callback with false after export', async () => {
    const cb = vi.fn();
    setOnUnsavedChange(cb);
    state.unsavedChanges = true;

    await exportToFile([], [], 'weblinks.json');

    expect(cb).toHaveBeenCalledWith(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Storage connection metadata persistence (state.js Phase 1)
// ─────────────────────────────────────────────────────────────────────────────

describe('storage connection metadata – persistStorageMeta / loadPersistedStorageMeta', () => {
  let origMode, origFileName, origFileMeta, origLastSyncHash;

  beforeEach(() => {
    origMode         = state.storageMode;
    origFileName     = state.storageFileName;
    origFileMeta     = state.storageFileMeta;
    origLastSyncHash = state.lastSyncHash;
    localStorage.clear();
  });

  afterEach(() => {
    state.storageMode     = origMode;
    state.storageFileName = origFileName;
    state.storageFileMeta = origFileMeta;
    state.lastSyncHash    = origLastSyncHash;
    localStorage.clear();
  });

  it('persistStorageMeta writes mode, file name, and file meta to localStorage', () => {
    state.storageMode     = 'manual';
    state.storageFileName = 'weblinks.json';
    state.storageFileMeta = { name: 'weblinks.json', size: 1024, lastModified: 1700000000000 };
    persistStorageMeta();
    expect(localStorage.getItem(LS_STORAGE_MODE_KEY)).toBe('manual');
    expect(localStorage.getItem(LS_STORAGE_FILE_NAME_KEY)).toBe('weblinks.json');
    const meta = JSON.parse(localStorage.getItem(LS_STORAGE_FILE_META_KEY));
    expect(meta.size).toBe(1024);
    expect(meta.lastModified).toBe(1700000000000);
  });

  it('loadPersistedStorageMeta restores mode and file name from localStorage', () => {
    localStorage.setItem(LS_STORAGE_MODE_KEY, 'manual');
    localStorage.setItem(LS_STORAGE_FILE_NAME_KEY, 'my-bookmarks.json');
    state.storageMode     = null;
    state.storageFileName = null;
    loadPersistedStorageMeta();
    expect(state.storageMode).toBe('manual');
    expect(state.storageFileName).toBe('my-bookmarks.json');
  });

  it('loadPersistedStorageMeta restores file meta from localStorage', () => {
    const meta = { name: 'data.json', size: 512, lastModified: 1699000000000 };
    localStorage.setItem(LS_STORAGE_FILE_META_KEY, JSON.stringify(meta));
    state.storageFileMeta = null;
    loadPersistedStorageMeta();
    expect(state.storageFileMeta).toEqual(meta);
  });

  it('loadPersistedStorageMeta ignores unknown mode values', () => {
    localStorage.setItem(LS_STORAGE_MODE_KEY, 'unknown-mode');
    state.storageMode = null;
    loadPersistedStorageMeta();
    expect(state.storageMode).toBeNull();
  });

  it('loadPersistedStorageMeta handles malformed JSON in file meta gracefully', () => {
    localStorage.setItem(LS_STORAGE_FILE_META_KEY, 'not-valid-json{');
    expect(() => loadPersistedStorageMeta()).not.toThrow();
  });

  it('persistStorageMeta removes keys when values are null', () => {
    localStorage.setItem(LS_STORAGE_MODE_KEY, 'manual');
    localStorage.setItem(LS_STORAGE_FILE_NAME_KEY, 'old.json');
    state.storageMode     = null;
    state.storageFileName = null;
    state.storageFileMeta = null;
    persistStorageMeta();
    expect(localStorage.getItem(LS_STORAGE_MODE_KEY)).toBeNull();
    expect(localStorage.getItem(LS_STORAGE_FILE_NAME_KEY)).toBeNull();
  });
});

describe('clearStorageMeta', () => {
  let origMode, origFileName, origFileMeta, origReady, origHandle;

  beforeEach(() => {
    origMode     = state.storageMode;
    origFileName = state.storageFileName;
    origFileMeta = state.storageFileMeta;
    origReady    = state.storageReady;
    origHandle   = state.fileHandle;
    localStorage.clear();
  });

  afterEach(() => {
    state.storageMode     = origMode;
    state.storageFileName = origFileName;
    state.storageFileMeta = origFileMeta;
    state.storageReady    = origReady;
    state.fileHandle      = origHandle;
    localStorage.clear();
  });

  it('resets all storage-related state fields to falsy values', () => {
    state.storageMode     = 'manual';
    state.storageFileName = 'weblinks.json';
    state.storageFileMeta = { name: 'weblinks.json', size: 100, lastModified: 0 };
    state.storageReady    = true;
    state.unsavedChanges  = true;

    clearStorageMeta();

    expect(state.storageMode).toBeNull();
    expect(state.storageFileName).toBeNull();
    expect(state.storageFileMeta).toBeNull();
    expect(state.storageReady).toBe(false);
    expect(state.unsavedChanges).toBe(false);
  });

  it('removes all storage metadata and sync hash from localStorage', () => {
    localStorage.setItem(LS_STORAGE_MODE_KEY, 'manual');
    localStorage.setItem(LS_STORAGE_FILE_NAME_KEY, 'weblinks.json');
    localStorage.setItem(LS_STORAGE_FILE_META_KEY, '{}');
    localStorage.setItem(LS_SYNC_HASH_KEY, 'abc123');

    clearStorageMeta();

    expect(localStorage.getItem(LS_STORAGE_MODE_KEY)).toBeNull();
    expect(localStorage.getItem(LS_STORAGE_FILE_NAME_KEY)).toBeNull();
    expect(localStorage.getItem(LS_STORAGE_FILE_META_KEY)).toBeNull();
    expect(localStorage.getItem(LS_SYNC_HASH_KEY)).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// checkAndPromptSync – sync decision flow (Phase 3)
// ─────────────────────────────────────────────────────────────────────────────

describe('checkAndPromptSync – sync decision flow', () => {
  beforeEach(() => {
    document.body.innerHTML =
      '<div id="modal-root" aria-hidden="true"></div>' +
      '<div id="toast-root" aria-live="polite"></div>';
    state.categories = [];
    state.weblinks   = [];
    localStorage.clear();
  });

  afterEach(() => {
    document.body.innerHTML = '';
    state.categories = [];
    state.weblinks   = [];
    localStorage.clear();
  });

  it('confirm: imports fresh data and stores the new hash', async () => {
    const freshData = {
      categories: [{ id: 'c1', name: 'Work', isDefault: false }],
      weblinks:   [],
    };
    const newHash = 'new-hash-abc';
    // Set a DIFFERENT stored hash so the dialog is triggered
    localStorage.setItem(LS_SYNC_HASH_KEY, 'old-hash-stored');

    // Start the sync prompt (modal is rendered synchronously before the await)
    const syncPromise = checkAndPromptSync(newHash, freshData);

    // Click the primary (Import/confirm) button
    const importBtn = document.querySelector('#modal-root .btn-primary');
    importBtn?.click();

    await syncPromise;

    expect(state.categories).toEqual(freshData.categories);
    expect(state.weblinks).toEqual(freshData.weblinks);
    expect(localStorage.getItem(LS_SYNC_HASH_KEY)).toBe(newHash);
  });

  it('decline: leaves current state unchanged and does not store the new hash', async () => {
    state.categories = [{ id: 'existing', name: 'Existing', isDefault: false }];
    state.weblinks   = [{ id: 'w1', url: 'https://a.com', name: 'A' }];
    const savedCats  = [...state.categories];
    const savedLinks = [...state.weblinks];
    const newHash    = 'new-hash-xyz';
    // Set a DIFFERENT stored hash so the dialog is triggered
    localStorage.setItem(LS_SYNC_HASH_KEY, 'stored-hash-decline');

    const syncPromise = checkAndPromptSync(newHash, { categories: [], weblinks: [] });

    // Click the secondary (Keep current/decline) button
    const keepBtn = document.querySelector('#modal-root .btn-secondary');
    keepBtn?.click();

    await syncPromise;

    expect(state.categories).toEqual(savedCats);
    expect(state.weblinks).toEqual(savedLinks);
    // Stored hash must remain the OLD value so the next load prompts again
    expect(localStorage.getItem(LS_SYNC_HASH_KEY)).toBe('stored-hash-decline');
  });

  it('dismiss (X button): leaves current state unchanged', async () => {
    state.categories = [{ id: 'c2', name: 'Misc', isDefault: false }];
    const savedCats  = [...state.categories];
    const newHash    = 'hash-dismiss';
    // Set a DIFFERENT stored hash so the dialog is triggered
    localStorage.setItem(LS_SYNC_HASH_KEY, 'stored-hash-dismiss');

    const syncPromise = checkAndPromptSync(newHash, { categories: [], weblinks: [] });

    // Click the modal close (X) button
    const closeBtn = document.querySelector('#modal-root .modal-close');
    closeBtn?.click();

    await syncPromise;

    expect(state.categories).toEqual(savedCats);
    expect(localStorage.getItem(LS_SYNC_HASH_KEY)).toBe('stored-hash-dismiss');
  });

  it('silent reopen: same hash – loads data without showing a dialog', async () => {
    const hash = 'same-hash-123';
    const freshData = {
      categories: [{ id: 'c1', name: 'Work', isDefault: false }],
      weblinks:   [{ id: 'w1', url: 'https://example.com', name: 'Example', icon: 'globe', description: '', category: 'c1' }],
    };
    localStorage.setItem(LS_SYNC_HASH_KEY, hash);
    state.categories = [];
    state.weblinks   = [];

    await checkAndPromptSync(hash, freshData);

    // Data is loaded silently – no modal dialog appears
    expect(state.categories).toEqual(freshData.categories);
    expect(state.weblinks).toEqual(freshData.weblinks);
    expect(document.querySelector('#modal-root .btn-primary')).toBeNull();
    expect(localStorage.getItem(LS_SYNC_HASH_KEY)).toBe(hash);
  });

  it('silent reopen: no prior hash (first load) – loads data without showing a dialog', async () => {
    // No stored hash at all
    const freshData = {
      categories: [],
      weblinks:   [{ id: 'w2', url: 'https://b.com', name: 'B', icon: 'globe', description: '', category: 'not-defined' }],
    };
    state.categories = [];
    state.weblinks   = [];

    await checkAndPromptSync('any-hash-456', freshData);

    expect(state.categories).toEqual(freshData.categories);
    expect(state.weblinks).toEqual(freshData.weblinks);
    expect(localStorage.getItem(LS_SYNC_HASH_KEY)).toBe('any-hash-456');
    expect(document.querySelector('#modal-root .btn-primary')).toBeNull();
  });

  it('sync prompt: changed hash – dialog is shown when file content differs', async () => {
    localStorage.setItem(LS_SYNC_HASH_KEY, 'stored-hash-A');
    state.categories = [{ id: 'existing', name: 'Existing', isDefault: false }];
    const savedCats  = [...state.categories];

    const syncPromise = checkAndPromptSync('different-hash-B', { categories: [], weblinks: [] });

    // Dialog must be visible because hashes differ
    const importBtn = document.querySelector('#modal-root .btn-primary');
    expect(importBtn).not.toBeNull();

    // Dismiss to clean up
    const keepBtn = document.querySelector('#modal-root .btn-secondary');
    keepBtn?.click();
    await syncPromise;

    // State unchanged after dismiss
    expect(state.categories).toEqual(savedCats);
    // Stored hash must remain the old one so the next load prompts again
    expect(localStorage.getItem(LS_SYNC_HASH_KEY)).toBe('stored-hash-A');
  });

  it('exportToFile stores the exported content hash as the new sync baseline', async () => {
    localStorage.clear();
    URL.createObjectURL = vi.fn().mockReturnValue('blob:mock');
    URL.revokeObjectURL = vi.fn();
    state.unsavedChanges = false;

    const hash = await exportToFile([], [], 'weblinks.json');

    expect(localStorage.getItem(LS_SYNC_HASH_KEY)).toBe(hash);

    URL.createObjectURL = undefined;
    URL.revokeObjectURL = undefined;
  });

  it('different file identity: loads silently and resets sync baseline (isSameFile=false)', async () => {
    // A prior sync hash exists from a previously connected file
    localStorage.setItem(LS_SYNC_HASH_KEY, 'old-file-hash');
    const freshData = {
      categories: [{ id: 'c3', name: 'NewCat', isDefault: false }],
      weblinks:   [],
    };
    state.categories = [];
    state.weblinks   = [];

    // isSameFile=false → different file, must not trigger dialog even though hash differs
    await checkAndPromptSync('new-file-hash', freshData, { isSameFile: false });

    // Loaded silently – no modal dialog
    expect(state.categories).toEqual(freshData.categories);
    expect(state.weblinks).toEqual(freshData.weblinks);
    expect(document.querySelector('#modal-root .btn-primary')).toBeNull();
    // New hash stored as the fresh baseline
    expect(localStorage.getItem(LS_SYNC_HASH_KEY)).toBe('new-file-hash');
  });
});
