// state.js

/**
 * Central application state.
 * All fields are mutated directly; consumers should call render functions
 * after mutations to reflect changes in the UI.
 */
const _state = {
  /** UI preferences – persisted in localStorage */
  settings: {
    theme:          'light',
    language:       'de',
    compactMode:    false,
    pinnedWeblinks: [],
  },

  /** Custom categories loaded from the storage file */
  categories: [],

  /** Weblinks loaded from the storage file */
  weblinks: [],

  /** Currently selected category ID for filtering; null = show all */
  selectedCategory: null,

  /** Current search query string; empty = no filter */
  searchQuery: '',

  /** FileSystemFileHandle for the connected storage file (direct mode only) */
  fileHandle: null,

  /** SHA-256 hash of the last successfully synced file content */
  lastSyncHash: null,

  /** Whether the storage file is connected and data is loaded */
  storageReady: false,

  /** Active storage mode: 'direct' (File System Access API) | 'manual' (import/export) | null */
  storageMode: null,

  /** Last-used file name for manual mode (for download filename suggestion) */
  storageFileName: null,

  /** Lightweight file identity for manual mode: { name, size, lastModified } */
  storageFileMeta: null,

  /** True when in-memory state has mutations not yet exported to disk (manual mode) */
  unsavedChanges: false,
};

const state = _state;

// ─────────────────────────────────────────────────────────────────────────────
// Settings persistence
// ─────────────────────────────────────────────────────────────────────────────

/** Load persisted settings from localStorage into state */
function loadPersistedSettings() {
  try {
    const raw = localStorage.getItem(LS_SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        if (parsed.theme === 'light' || parsed.theme === 'dark') _state.settings.theme = parsed.theme;
        if (parsed.language === 'de' || parsed.language === 'en') _state.settings.language = parsed.language;
        if (parsed.compactMode !== undefined) _state.settings.compactMode = !!parsed.compactMode;
        if (Array.isArray(parsed.pinnedWeblinks)) _state.settings.pinnedWeblinks = parsed.pinnedWeblinks;
      }
    }
  } catch {
    // ignore malformed data
  }
}

/** Persist current settings to localStorage */
function persistSettings() {
  const { theme, language, compactMode, pinnedWeblinks } = _state.settings;
  try {
    localStorage.setItem(LS_SETTINGS_KEY, JSON.stringify({ theme, language, compactMode, pinnedWeblinks }));
  } catch {
    // ignore quota errors
  }
}

/** Toggle the pinned state of a weblink and persist. */
function togglePinWeblink(id) {
  const pins = _state.settings.pinnedWeblinks;
  const idx  = pins.indexOf(id);
  if (idx === -1) {
    pins.push(id);
  } else {
    pins.splice(idx, 1);
  }
  persistSettings();
}

/** Return true when the given weblink ID is currently pinned. */
function isPinned(id) {
  return _state.settings.pinnedWeblinks.includes(id);
}

/** Update one or more settings fields and persist */
function updateSettings(patch) {
  Object.assign(_state.settings, patch);
  persistSettings();
}

// ─────────────────────────────────────────────────────────────────────────────
// Sync hash persistence
// ─────────────────────────────────────────────────────────────────────────────

function getStoredSyncHash() {
  return localStorage.getItem(LS_SYNC_HASH_KEY) || null;
}

function storeLastSyncHash(hash) {
  _state.lastSyncHash = hash;
  try {
    localStorage.setItem(LS_SYNC_HASH_KEY, hash);
  } catch {
    // ignore
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Storage connection metadata persistence
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Load persisted storage connection metadata from localStorage into state.
 * Only the mode, file name, and file identity fields are restored;
 * bookmark data itself is never stored in localStorage.
 */
function loadPersistedStorageMeta() {
  try {
    const mode = localStorage.getItem(LS_STORAGE_MODE_KEY);
    if (mode === 'direct' || mode === 'manual') _state.storageMode = mode;
    const fileName = localStorage.getItem(LS_STORAGE_FILE_NAME_KEY);
    if (fileName) _state.storageFileName = fileName;
    const metaRaw = localStorage.getItem(LS_STORAGE_FILE_META_KEY);
    if (metaRaw) {
      const parsed = JSON.parse(metaRaw);
      if (parsed && typeof parsed === 'object') _state.storageFileMeta = parsed;
    }
  } catch {
    // ignore malformed data
  }
}

/** Persist current storage connection metadata to localStorage. */
function persistStorageMeta() {
  try {
    if (_state.storageMode) {
      localStorage.setItem(LS_STORAGE_MODE_KEY, _state.storageMode);
    } else {
      localStorage.removeItem(LS_STORAGE_MODE_KEY);
    }
    if (_state.storageFileName) {
      localStorage.setItem(LS_STORAGE_FILE_NAME_KEY, _state.storageFileName);
    } else {
      localStorage.removeItem(LS_STORAGE_FILE_NAME_KEY);
    }
    if (_state.storageFileMeta) {
      localStorage.setItem(LS_STORAGE_FILE_META_KEY, JSON.stringify(_state.storageFileMeta));
    } else {
      localStorage.removeItem(LS_STORAGE_FILE_META_KEY);
    }
  } catch {
    // ignore quota errors
  }
}

/**
 * Clear all storage connection metadata from state and localStorage.
 * Call on disconnect, permission denial, or malformed stored state.
 */
function clearStorageMeta() {
  _state.storageMode     = null;
  _state.storageFileName = null;
  _state.storageFileMeta = null;
  _state.storageReady    = false;
  _state.lastSyncHash    = null;
  _state.fileHandle      = null;
  _state.unsavedChanges  = false;
  try {
    localStorage.removeItem(LS_STORAGE_MODE_KEY);
    localStorage.removeItem(LS_STORAGE_FILE_NAME_KEY);
    localStorage.removeItem(LS_STORAGE_FILE_META_KEY);
    localStorage.removeItem(LS_SYNC_HASH_KEY);
  } catch {
    // ignore
  }
}
