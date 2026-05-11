import { DEFAULT_CATEGORY_IDS, RESERVED_CATEGORY_NAMES, STORAGE_VERSION } from './config.js';
import { sanitizeString } from './utils/validation.js';

// ─────────────────────────────────────────────────────────────────────────────
// Default (protected) categories
// ─────────────────────────────────────────────────────────────────────────────

export const DEFAULT_CATEGORIES = [
  { id: DEFAULT_CATEGORY_IDS.NOT_DEFINED, name: 'Not defined', icon: 'folder',   isDefault: true },
  { id: DEFAULT_CATEGORY_IDS.IMPORTED,    name: 'Imported',    icon: 'bookmark', isDefault: true },
];

// ─────────────────────────────────────────────────────────────────────────────
// ID generation
// ─────────────────────────────────────────────────────────────────────────────

export function generateId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Factory functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create a new Weblink record.
 * All fields are sanitized; category defaults to 'not-defined'.
 */
export function createWeblink({ url, name, icon = 'globe', description = '', category = DEFAULT_CATEGORY_IDS.NOT_DEFINED } = {}) {
  return {
    id:          generateId(),
    url:         sanitizeString(url),
    name:        sanitizeString(name),
    icon:        typeof icon === 'string' && icon ? icon : 'globe',
    description: sanitizeString(description),
    category:    category || DEFAULT_CATEGORY_IDS.NOT_DEFINED,
  };
}

/**
 * Create a new custom Category record.
 */
export function createCategory({ name, icon = 'folder' } = {}) {
  return {
    id:        generateId(),
    name:      sanitizeString(name),
    icon:      typeof icon === 'string' && icon ? icon : 'folder',
    isDefault: false,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Data normalization
// ─────────────────────────────────────────────────────────────────────────────

const VALID_CATEGORY_IDS = new Set(DEFAULT_CATEGORIES.map(c => c.id));

/**
 * Normalize and validate raw JSON data from the storage file.
 * Returns a clean { version, categories, weblinks } object.
 * Default categories are injected at runtime (not stored in file).
 */
export function normalizeData(raw) {
  if (!raw || typeof raw !== 'object') {
    raw = {};
  }

  // Custom categories from file (must not have default names)
  const rawCats  = Array.isArray(raw.categories) ? raw.categories : [];
  const seenNames = new Set();
  const customCats = rawCats
    .filter(c => c && typeof c.name === 'string' && c.name.trim())
    .filter(c => !VALID_CATEGORY_IDS.has(c.id))
    .filter(c => !RESERVED_CATEGORY_NAMES.includes(sanitizeString(c.name).toLowerCase()))
    .filter(c => {
      const lower = sanitizeString(c.name).toLowerCase();
      if (seenNames.has(lower)) return false;
      seenNames.add(lower);
      return true;
    })
    .map(c => ({
      id:        c.id        || generateId(),
      name:      sanitizeString(c.name),
      icon:      typeof c.icon === 'string' && c.icon ? c.icon : 'folder',
      isDefault: false,
    }));

  // Build the full set of valid category IDs for weblink normalization
  const allCatIds = new Set([
    ...DEFAULT_CATEGORIES.map(c => c.id),
    ...customCats.map(c => c.id),
  ]);

  const rawLinks = Array.isArray(raw.weblinks) ? raw.weblinks : [];
  const weblinks = rawLinks
    .filter(w => w && typeof w.url === 'string' && w.url.trim() && typeof w.name === 'string' && w.name.trim())
    .map(w => ({
      id:          w.id && typeof w.id === 'string' ? w.id : generateId(),
      url:         sanitizeString(w.url),
      name:        sanitizeString(w.name),
      icon:        typeof w.icon === 'string' && w.icon ? w.icon : 'globe',
      description: typeof w.description === 'string' ? sanitizeString(w.description) : '',
      category:    allCatIds.has(w.category) ? w.category : DEFAULT_CATEGORY_IDS.NOT_DEFINED,
    }));

  return {
    version:    typeof raw.version === 'number' ? raw.version : STORAGE_VERSION,
    categories: customCats,
    weblinks,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Return the localized display label for a category.
 * Default categories use i18n keys; custom categories use their stored name.
 */
export function getCategoryLabel(cat, t) {
  if (!cat.isDefault) return cat.name;
  if (cat.id === DEFAULT_CATEGORY_IDS.NOT_DEFINED) return t('category.notDefined');
  if (cat.id === DEFAULT_CATEGORY_IDS.IMPORTED)    return t('category.imported');
  return cat.name;
}

/**
 * Return the full category list: defaults first, then custom.
 */
export function getFullCategories(customCategories) {
  return [...DEFAULT_CATEGORIES, ...customCategories];
}

/**
 * Find a category by ID across defaults + custom.
 */
export function findCategory(customCategories, id) {
  return getFullCategories(customCategories).find(c => c.id === id) || null;
}
