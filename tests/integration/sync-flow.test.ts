import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  CATEGORY_IMPORTED_ID,
  CATEGORY_NOT_DEFINED_ID,
  ensureDefaultCategories,
} from '../../src/domain/categories/defaults';
import type { AppAction, AppState } from '../../src/app/state/store';
import type { Weblink } from '../../src/domain/weblinks/model';
import type { Category } from '../../src/domain/categories/model';
import { DEFAULT_SETTINGS } from '../../src/domain/settings/model';

// ──────────────────────────────────────────────────────────────────────────────
// Inline reducer extracted from store.ts so we can test it in isolation
// without mounting a React tree.
// ──────────────────────────────────────────────────────────────────────────────

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'INIT':
      return { ...state, ...action.payload };
    case 'SET_STORAGE_STATUS':
      return { ...state, storageStatus: action.payload.status, storageError: action.payload.error };
    case 'SET_SYNC_PROMPT':
      return { ...state, syncPrompt: action.payload };
    case 'SYNC_ACCEPT':
      return {
        ...state,
        weblinks: action.payload.weblinks,
        categories: action.payload.categories,
        syncPrompt: null,
      };
    case 'ADD_WEBLINK':
      return { ...state, weblinks: [...state.weblinks, action.payload] };
    case 'UPDATE_WEBLINK':
      return {
        ...state,
        weblinks: state.weblinks.map(weblink =>
          weblink.id === action.payload.id ? action.payload : weblink
        ),
      };
    case 'ADD_WEBLINKS':
      return { ...state, weblinks: [...state.weblinks, ...action.payload] };
    case 'ADD_CATEGORY':
      return { ...state, categories: [...state.categories, action.payload] };
    case 'DELETE_CATEGORY': {
      const { categoryId, fallbackCategoryId } = action.payload;
      return {
        ...state,
        categories: state.categories.filter(c => c.id !== categoryId),
        weblinks: state.weblinks.map(w =>
          w.categoryId === categoryId ? { ...w, categoryId: fallbackCategoryId } : w
        ),
        selectedCategoryId:
          state.selectedCategoryId === categoryId ? null : state.selectedCategoryId,
      };
    }
    case 'UPDATE_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.payload } };
    case 'SELECT_CATEGORY':
      return { ...state, selectedCategoryId: action.payload };
    default:
      return state;
  }
}

function makeInitialState(overrides: Partial<AppState> = {}): AppState {
  return {
    weblinks: [],
    categories: ensureDefaultCategories([]),
    settings: { ...DEFAULT_SETTINGS },
    storageStatus: 'ready',
    syncPrompt: null,
    selectedCategoryId: null,
    ...overrides,
  };
}

const SAMPLE_WEBLINK: Weblink = {
  id: 'wl-1',
  url: 'https://example.com',
  name: 'Example',
  icon: 'globe',
  description: '',
  categoryId: CATEGORY_NOT_DEFINED_ID,
  createdAt: 0,
};

const INCOMING_WEBLINK: Weblink = {
  id: 'wl-incoming',
  url: 'https://incoming.com',
  name: 'Incoming',
  icon: 'star',
  description: '',
  categoryId: CATEGORY_NOT_DEFINED_ID,
  createdAt: 1,
};

const INCOMING_CATEGORIES: Category[] = ensureDefaultCategories([
  { id: 'custom-incoming', name: 'IncomingCat', icon: 'folder', isDefault: false },
]);

// ──────────────────────────────────────────────
// Sync decline flow (REQ-003 AC-6)
// ──────────────────────────────────────────────

describe('sync decline flow', () => {
  it('shows sync prompt without changing weblinks or categories', () => {
    let state = makeInitialState({ weblinks: [SAMPLE_WEBLINK] });

    state = appReducer(state, {
      type: 'SET_SYNC_PROMPT',
      payload: {
        incomingData: {
          version: 1,
          weblinks: [INCOMING_WEBLINK],
          categories: INCOMING_CATEGORIES,
        },
      },
    });

    // Prompt is visible but weblinks are unchanged
    expect(state.syncPrompt).not.toBeNull();
    expect(state.weblinks).toHaveLength(1);
    expect(state.weblinks[0].id).toBe('wl-1');
  });

  it('clears sync prompt on decline without modifying data', () => {
    let state = makeInitialState({ weblinks: [SAMPLE_WEBLINK] });

    // Simulate the bootstrap dispatching the sync prompt after detecting a change
    state = appReducer(state, {
      type: 'SET_SYNC_PROMPT',
      payload: {
        incomingData: {
          version: 1,
          weblinks: [INCOMING_WEBLINK],
          categories: INCOMING_CATEGORIES,
        },
      },
    });

    // User declines: dialog calls dispatch({ type: 'SET_SYNC_PROMPT', payload: null })
    state = appReducer(state, { type: 'SET_SYNC_PROMPT', payload: null });

    expect(state.syncPrompt).toBeNull();
    // Original weblinks must be preserved
    expect(state.weblinks).toHaveLength(1);
    expect(state.weblinks[0].id).toBe('wl-1');
    // Original categories must be preserved (only defaults, no incoming custom)
    expect(state.categories.some(c => c.id === 'custom-incoming')).toBe(false);
  });
});

// ──────────────────────────────────────────────
// Sync accept flow
// ──────────────────────────────────────────────

describe('sync accept flow', () => {
  it('replaces state with incoming data on SYNC_ACCEPT', () => {
    let state = makeInitialState({ weblinks: [SAMPLE_WEBLINK] });

    state = appReducer(state, {
      type: 'SET_SYNC_PROMPT',
      payload: {
        incomingData: {
          version: 1,
          weblinks: [INCOMING_WEBLINK],
          categories: INCOMING_CATEGORIES,
        },
      },
    });

    state = appReducer(state, {
      type: 'SYNC_ACCEPT',
      payload: { weblinks: [INCOMING_WEBLINK], categories: INCOMING_CATEGORIES },
    });

    expect(state.syncPrompt).toBeNull();
    expect(state.weblinks).toHaveLength(1);
    expect(state.weblinks[0].id).toBe('wl-incoming');
    expect(state.categories.some(c => c.id === 'custom-incoming')).toBe(true);
  });
});

// ──────────────────────────────────────────────
// Write-through: ADD_WEBLINK updates state
// ──────────────────────────────────────────────

describe('weblink write-through state update', () => {
  it('appends a new weblink to in-memory state', () => {
    let state = makeInitialState();

    state = appReducer(state, { type: 'ADD_WEBLINK', payload: SAMPLE_WEBLINK });

    expect(state.weblinks).toHaveLength(1);
    expect(state.weblinks[0].id).toBe('wl-1');
  });

  it('replaces an existing weblink during edit', () => {
    let state = makeInitialState({ weblinks: [SAMPLE_WEBLINK] });

    state = appReducer(state, {
      type: 'UPDATE_WEBLINK',
      payload: { ...SAMPLE_WEBLINK, name: 'Updated Example', description: 'Updated description' },
    });

    expect(state.weblinks).toHaveLength(1);
    expect(state.weblinks[0].name).toBe('Updated Example');
    expect(state.weblinks[0].description).toBe('Updated description');
  });
});

describe('storage serializers', () => {
  it('persists weblinks with the required public field names', async () => {
    const { serializeStorageData } = await import('../../src/services/storage/serializers');
    const raw = serializeStorageData({
      version: 1,
      categories: ensureDefaultCategories([]),
      weblinks: [SAMPLE_WEBLINK],
    });

    expect(raw).toContain('"URL"');
    expect(raw).toContain('"Name"');
    expect(raw).toContain('"Description"');
    expect(raw).toContain('"Category"');
    expect(raw).not.toContain('"categoryId"');
  });

  it('maps persisted weblink records back into internal state', async () => {
    const { deserializeStorageData } = await import('../../src/services/storage/serializers');
    const data = deserializeStorageData(JSON.stringify({
      version: 1,
      categories: ensureDefaultCategories([]),
      weblinks: [
        {
          URL: 'https://example.com',
          Name: 'Example',
          Icon: 'globe',
          Description: 'Example description',
          Category: 'Not defined',
        },
      ],
    }));

    expect(data.weblinks).toHaveLength(1);
    expect(data.weblinks[0].url).toBe('https://example.com');
    expect(data.weblinks[0].categoryId).toBe(CATEGORY_NOT_DEFINED_ID);
  });
});

// ──────────────────────────────────────────────
// Category deletion reassigns weblinks
// ──────────────────────────────────────────────

describe('DELETE_CATEGORY', () => {
  it('reassigns weblinks to the fallback category', () => {
    const customCat: Category = { id: 'custom', name: 'Custom', icon: 'star', isDefault: false };
    const wl: Weblink = { ...SAMPLE_WEBLINK, categoryId: 'custom' };

    let state = makeInitialState({
      categories: [...ensureDefaultCategories([]), customCat],
      weblinks: [wl],
    });

    state = appReducer(state, {
      type: 'DELETE_CATEGORY',
      payload: { categoryId: 'custom', fallbackCategoryId: CATEGORY_NOT_DEFINED_ID },
    });

    expect(state.categories.some(c => c.id === 'custom')).toBe(false);
    expect(state.weblinks[0].categoryId).toBe(CATEGORY_NOT_DEFINED_ID);
  });

  it('clears selectedCategoryId when the selected category is deleted', () => {
    const customCat: Category = { id: 'custom', name: 'Custom', icon: 'star', isDefault: false };

    let state = makeInitialState({
      categories: [...ensureDefaultCategories([]), customCat],
      selectedCategoryId: 'custom',
    });

    state = appReducer(state, {
      type: 'DELETE_CATEGORY',
      payload: { categoryId: 'custom', fallbackCategoryId: CATEGORY_NOT_DEFINED_ID },
    });

    expect(state.selectedCategoryId).toBeNull();
  });
});

// ──────────────────────────────────────────────
// file change detection: hasFileChanged utility
// ──────────────────────────────────────────────

describe('hasFileChanged', () => {
  it('returns false when no stored fingerprint exists', async () => {
    const { hasFileChanged } = await import('../../src/services/storage/sync-service');
    expect(hasFileChanged({ lastModified: 100, contentHash: 'abc' }, null)).toBe(false);
  });

  it('returns true when fingerprints differ', async () => {
    const { hasFileChanged } = await import('../../src/services/storage/sync-service');
    const stored = { lastModified: 100, contentHash: 'old' };
    const current = { lastModified: 200, contentHash: 'new' };
    expect(hasFileChanged(current, stored)).toBe(true);
  });

  it('returns false when fingerprints are equal', async () => {
    const { hasFileChanged } = await import('../../src/services/storage/sync-service');
    const fp = { lastModified: 100, contentHash: 'abc' };
    expect(hasFileChanged(fp, fp)).toBe(false);
  });
});
