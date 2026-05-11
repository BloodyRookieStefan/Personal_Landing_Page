/**
 * tests/bookmark-import.test.js
 *
 * Tests for Firefox bookmark extraction, duplicate skipping, and forced
 * IMPORTED category assignment.
 */

import { describe, it, expect } from 'vitest';
import { extractBookmarks } from '../assets/js/features/bookmark-import.js';
import { DEFAULT_CATEGORY_IDS } from '../assets/js/config.js';
import { createWeblink } from '../assets/js/schema.js';
import { sanitizeString } from '../assets/js/utils/validation.js';

// ─────────────────────────────────────────────────────────────────────────────
// extractBookmarks – Firefox JSON tree parsing
// ─────────────────────────────────────────────────────────────────────────────

describe('extractBookmarks', () => {
  const container = (children) => ({
    type: 'text/x-moz-place-container',
    title: 'Root',
    children,
  });

  const leaf = (uri, title = 'My Link') => ({
    type: 'text/x-moz-place',
    uri,
    title,
  });

  it('extracts a single top-level bookmark', () => {
    const input = container([leaf('https://example.com', 'Example')]);
    const result = extractBookmarks(input);
    expect(result).toHaveLength(1);
    expect(result[0].url).toBe('https://example.com');
    expect(result[0].name).toBe('Example');
  });

  it('recursively extracts bookmarks from nested containers', () => {
    const nested = container([
      leaf('https://a.com', 'A'),
      container([
        leaf('https://b.com', 'B'),
        container([
          leaf('https://c.com', 'C'),
        ]),
      ]),
    ]);
    const result = extractBookmarks(nested);
    expect(result).toHaveLength(3);
    const urls = result.map(r => r.url);
    expect(urls).toContain('https://a.com');
    expect(urls).toContain('https://b.com');
    expect(urls).toContain('https://c.com');
  });

  it('accepts ftp:// URLs', () => {
    const input = container([leaf('ftp://files.example.com', 'FTP')]);
    const result = extractBookmarks(input);
    expect(result).toHaveLength(1);
  });

  it('rejects javascript:, data:, and other non-web URIs', () => {
    const input = container([
      leaf('javascript:void(0)', 'JS'),
      leaf('data:text/html,hi',   'Data'),
      leaf('about:blank',         'About'),
      leaf('https://ok.com',      'OK'),
    ]);
    const result = extractBookmarks(input);
    expect(result).toHaveLength(1);
    expect(result[0].url).toBe('https://ok.com');
  });

  it('returns an empty array for an empty container', () => {
    const input = container([]);
    expect(extractBookmarks(input)).toHaveLength(0);
  });

  it('returns an empty array for null / non-object input', () => {
    expect(extractBookmarks(null)).toHaveLength(0);
    expect(extractBookmarks(undefined)).toHaveLength(0);
    expect(extractBookmarks('string')).toHaveLength(0);
  });

  it('handles a root-level array of containers', () => {
    const input = [
      container([leaf('https://x.com', 'X')]),
      container([leaf('https://y.com', 'Y')]),
    ];
    const result = extractBookmarks(input);
    expect(result).toHaveLength(2);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Forced IMPORTED category assignment
// ─────────────────────────────────────────────────────────────────────────────

describe('imported weblink category', () => {
  it('createWeblink with IMPORTED category ID produces correct record', () => {
    const wl = createWeblink({
      url:      'https://example.com',
      name:     'Test',
      icon:     'bookmark',
      category: DEFAULT_CATEGORY_IDS.IMPORTED,
    });
    expect(wl.category).toBe(DEFAULT_CATEGORY_IDS.IMPORTED);
    expect(wl.category).toBe('imported');
  });

  it('category is never NOT_DEFINED when IMPORTED is explicitly set', () => {
    const wl = createWeblink({
      url:      'https://example.com',
      name:     'Test',
      category: DEFAULT_CATEGORY_IDS.IMPORTED,
    });
    expect(wl.category).not.toBe(DEFAULT_CATEGORY_IDS.NOT_DEFINED);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Duplicate skipping logic (mirrors processFile internals)
// ─────────────────────────────────────────────────────────────────────────────

describe('duplicate skipping', () => {
  it('skips bookmarks whose URL is already in the existing set', () => {
    const bookmarks = [
      { url: 'https://already.com', name: 'Already' },
      { url: 'https://new.com',     name: 'New' },
    ];
    const existingUrls = new Set(['https://already.com']);

    let imported   = 0;
    let duplicates = 0;
    const created = [];

    for (const bm of bookmarks) {
      if (existingUrls.has(bm.url)) {
        duplicates++;
        continue;
      }
      created.push(createWeblink({
        url:      bm.url,
        name:     bm.name,
        icon:     'bookmark',
        category: DEFAULT_CATEGORY_IDS.IMPORTED,
      }));
      existingUrls.add(bm.url);
      imported++;
    }

    expect(imported).toBe(1);
    expect(duplicates).toBe(1);
    expect(created[0].url).toBe('https://new.com');
    expect(created[0].category).toBe(DEFAULT_CATEGORY_IDS.IMPORTED);
  });

  it('does not create duplicate entries when the same URL appears twice in the import', () => {
    const bookmarks = [
      { url: 'https://dup.com', name: 'First' },
      { url: 'https://dup.com', name: 'Second' },
    ];
    const existingUrls = new Set();
    let imported = 0;
    let duplicates = 0;

    for (const bm of bookmarks) {
      if (existingUrls.has(bm.url)) { duplicates++; continue; }
      existingUrls.add(bm.url);
      imported++;
    }

    expect(imported).toBe(1);
    expect(duplicates).toBe(1);
  });
});
