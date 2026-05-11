import { RESERVED_CATEGORY_NAMES } from '../config.js';

/**
 * Sanitize a string: trim whitespace and collapse internal whitespace.
 */
export function sanitizeString(str) {
  if (typeof str !== 'string') return '';
  return str.trim().replace(/\s+/g, ' ');
}

/**
 * Validate a URL string.
 * Returns true if the URL is syntactically valid.
 */
export function isValidUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' || parsed.protocol === 'ftp:';
  } catch {
    return false;
  }
}

/**
 * Returns true if the category name is one of the reserved defaults.
 */
export function isReservedCategoryName(name) {
  if (typeof name !== 'string') return false;
  return RESERVED_CATEGORY_NAMES.includes(name.trim().toLowerCase());
}

/**
 * Validate weblink form data.
 * Returns an object of { fieldKey: errorKey } pairs (empty = valid).
 */
export function validateWeblink(data) {
  const errors = {};
  const url  = sanitizeString(data.url  || '');
  const name = sanitizeString(data.name || '');

  if (!url) {
    errors.url = 'validation.urlRequired';
  } else if (!isValidUrl(url)) {
    errors.url = 'validation.urlInvalid';
  }

  if (!name) {
    errors.name = 'validation.nameRequired';
  }

  return errors;
}

/**
 * Validate category form data.
 * Returns an object of { fieldKey: errorKey } pairs (empty = valid).
 */
export function validateCategory(data, existingCategories) {
  const errors = {};
  const name = sanitizeString(data.name || '');

  if (!name) {
    errors.name = 'validation.nameRequired';
  } else if (isReservedCategoryName(name)) {
    errors.name = 'validation.categoryReserved';
  } else if (existingCategories.some(c => c.name.toLowerCase() === name.toLowerCase())) {
    errors.name = 'validation.categoryDuplicate';
  }

  return errors;
}
