import { describe, it, expect } from 'vitest';
import { validateWeblink } from '../../src/domain/weblinks/validation';
import {
  validateCategory,
  canDeleteCategory,
} from '../../src/domain/categories/validation';
import {
  ensureDefaultCategories,
  isDefaultCategory,
  CATEGORY_IMPORTED_ID,
  CATEGORY_NOT_DEFINED_ID,
  DEFAULT_CATEGORIES,
  RESERVED_CATEGORY_NAMES,
} from '../../src/domain/categories/defaults';
import { mapFirefoxBookmarkToWeblink } from '../../src/domain/imports/mapping';
import { ICON_PALETTE, getIconById } from '../../src/domain/icons/palette';
import { createDefaultWeblink } from '../../src/domain/weblinks/defaults';
import type { Category } from '../../src/domain/categories/model';

// ──────────────────────────────────────────────
// validateWeblink
// ──────────────────────────────────────────────

describe('validateWeblink', () => {
  it('requires a URL', () => {
    const result = validateWeblink({ name: 'Test', categoryId: 'cat-1' });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('URL is required');
  });

  it('rejects an invalid URL', () => {
    const result = validateWeblink({ url: 'not-a-url', name: 'Test', categoryId: 'cat-1' });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('URL must be a valid URL');
  });

  it('requires a name', () => {
    const result = validateWeblink({ url: 'https://example.com', categoryId: 'cat-1' });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Name is required');
  });

  it('requires a category', () => {
    const result = validateWeblink({ url: 'https://example.com', name: 'Test' });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Category is required');
  });

  it('passes with all valid fields', () => {
    const result = validateWeblink({
      url: 'https://example.com',
      name: 'Test',
      categoryId: 'cat-1',
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});

// ──────────────────────────────────────────────
// validateCategory
// ──────────────────────────────────────────────

describe('validateCategory', () => {
  const existing: Category[] = [
    { id: 'cat-1', name: 'Existing', icon: 'globe', isDefault: false },
  ];

  it('rejects reserved name "Imported"', () => {
    const result = validateCategory({ name: 'Imported', icon: 'bookmark' }, existing);
    expect(result.valid).toBe(false);
  });

  it('rejects reserved name "Not defined" (case-insensitive)', () => {
    const result = validateCategory({ name: 'not defined', icon: 'folder' }, existing);
    expect(result.valid).toBe(false);
  });

  it('rejects duplicate category names', () => {
    const result = validateCategory({ name: 'Existing', icon: 'globe' }, existing);
    expect(result.valid).toBe(false);
  });

  it('requires a name', () => {
    const result = validateCategory({ icon: 'globe' }, existing);
    expect(result.valid).toBe(false);
  });

  it('requires an icon', () => {
    const result = validateCategory({ name: 'NewCat' }, existing);
    expect(result.valid).toBe(false);
  });

  it('passes with a valid unique name and icon', () => {
    const result = validateCategory({ name: 'NewCat', icon: 'globe' }, existing);
    expect(result.valid).toBe(true);
  });
});

// ──────────────────────────────────────────────
// canDeleteCategory
// ──────────────────────────────────────────────

describe('canDeleteCategory', () => {
  it('blocks deletion of default categories', () => {
    const result = canDeleteCategory(true);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('allows deletion of custom categories', () => {
    const result = canDeleteCategory(false);
    expect(result.valid).toBe(true);
  });
});

// ──────────────────────────────────────────────
// ensureDefaultCategories
// ──────────────────────────────────────────────

describe('ensureDefaultCategories', () => {
  it('always includes "Imported" and "Not defined"', () => {
    const result = ensureDefaultCategories([]);
    const ids = result.map(c => c.id);
    expect(ids).toContain(CATEGORY_IMPORTED_ID);
    expect(ids).toContain(CATEGORY_NOT_DEFINED_ID);
  });

  it('prepends defaults before custom categories', () => {
    const custom: Category[] = [
      { id: 'custom', name: 'Custom', icon: 'star', isDefault: false },
    ];
    const result = ensureDefaultCategories(custom);
    expect(result[0].id).toBe(CATEGORY_IMPORTED_ID);
    expect(result[1].id).toBe(CATEGORY_NOT_DEFINED_ID);
    expect(result[2].id).toBe('custom');
  });

  it('does not duplicate default categories when already present', () => {
    const result = ensureDefaultCategories([...DEFAULT_CATEGORIES]);
    const importedCount = result.filter(c => c.id === CATEGORY_IMPORTED_ID).length;
    expect(importedCount).toBe(1);
  });
});

// ──────────────────────────────────────────────
// isDefaultCategory
// ──────────────────────────────────────────────

describe('isDefaultCategory', () => {
  it('returns true for CATEGORY_IMPORTED_ID', () => {
    expect(isDefaultCategory(CATEGORY_IMPORTED_ID)).toBe(true);
  });

  it('returns true for CATEGORY_NOT_DEFINED_ID', () => {
    expect(isDefaultCategory(CATEGORY_NOT_DEFINED_ID)).toBe(true);
  });

  it('returns false for a custom category id', () => {
    expect(isDefaultCategory('my-custom-cat')).toBe(false);
  });
});

// ──────────────────────────────────────────────
// RESERVED_CATEGORY_NAMES
// ──────────────────────────────────────────────

describe('RESERVED_CATEGORY_NAMES', () => {
  it('contains "Imported"', () => {
    expect(RESERVED_CATEGORY_NAMES).toContain('Imported');
  });

  it('contains "Not defined"', () => {
    expect(RESERVED_CATEGORY_NAMES).toContain('Not defined');
  });
});

// ──────────────────────────────────────────────
// mapFirefoxBookmarkToWeblink – import mapping
// ──────────────────────────────────────────────

describe('mapFirefoxBookmarkToWeblink', () => {
  it('always assigns the "Imported" category', () => {
    const weblink = mapFirefoxBookmarkToWeblink({ url: 'https://example.com', name: 'Test' });
    expect(weblink.categoryId).toBe(CATEGORY_IMPORTED_ID);
  });

  it('never assigns the "Not defined" category', () => {
    const weblink = mapFirefoxBookmarkToWeblink({ url: 'https://example.com', name: 'Test' });
    expect(weblink.categoryId).not.toBe(CATEGORY_NOT_DEFINED_ID);
  });

  it('uses the bookmark name when provided', () => {
    const weblink = mapFirefoxBookmarkToWeblink({ url: 'https://example.com', name: 'My Link' });
    expect(weblink.name).toBe('My Link');
  });

  it('falls back to URL when name is empty', () => {
    const weblink = mapFirefoxBookmarkToWeblink({ url: 'https://example.com', name: '' });
    expect(weblink.name).toBe('https://example.com');
  });

  it('uses addDate as createdAt when provided', () => {
    const addDate = 1_700_000_000_000;
    const weblink = mapFirefoxBookmarkToWeblink({
      url: 'https://example.com',
      name: 'Test',
      addDate,
    });
    expect(weblink.createdAt).toBe(addDate);
  });

  it('assigns a valid icon from the palette', () => {
    const weblink = mapFirefoxBookmarkToWeblink({ url: 'https://example.com', name: 'Test' });
    expect(ICON_PALETTE.some(i => i.id === weblink.icon)).toBe(true);
  });
});

// ──────────────────────────────────────────────
// ICON_PALETTE availability
// ──────────────────────────────────────────────

describe('ICON_PALETTE', () => {
  const REQUIRED_ICONS = [
    'globe', 'star', 'bookmark', 'folder', 'home', 'briefcase',
    'graduation-cap', 'code', 'shopping-cart', 'heart', 'camera',
    'music-note', 'video', 'newspaper', 'message-circle', 'wrench',
    'shield', 'cloud', 'calendar', 'link',
  ];

  it('contains at least 20 icons', () => {
    expect(ICON_PALETTE.length).toBeGreaterThanOrEqual(20);
  });

  it.each(REQUIRED_ICONS)('includes required icon "%s"', id => {
    expect(ICON_PALETTE.some(i => i.id === id)).toBe(true);
  });

  it('can look up icons by id via getIconById', () => {
    const globe = getIconById('globe');
    expect(globe).toBeDefined();
    expect(globe?.id).toBe('globe');
  });

  it('returns undefined for an unknown icon id', () => {
    expect(getIconById('does-not-exist')).toBeUndefined();
  });
});

// ──────────────────────────────────────────────
// createDefaultWeblink – default category fallback
// ──────────────────────────────────────────────

describe('createDefaultWeblink', () => {
  it('defaults categoryId to CATEGORY_NOT_DEFINED_ID', () => {
    const weblink = createDefaultWeblink();
    expect(weblink.categoryId).toBe(CATEGORY_NOT_DEFINED_ID);
  });

  it('applies overrides correctly', () => {
    const weblink = createDefaultWeblink({ name: 'Override', url: 'https://x.com' });
    expect(weblink.name).toBe('Override');
    expect(weblink.url).toBe('https://x.com');
  });

  it('generates a unique id each time', () => {
    const a = createDefaultWeblink();
    const b = createDefaultWeblink();
    expect(a.id).not.toBe(b.id);
  });
});
