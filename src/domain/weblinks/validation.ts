import type { Weblink } from './model';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateWeblink(weblink: Partial<Weblink>): ValidationResult {
  const errors: string[] = [];

  if (!weblink.url || weblink.url.trim() === '') {
    errors.push('URL is required');
  } else {
    try {
      new URL(weblink.url.trim());
    } catch {
      errors.push('URL must be a valid URL');
    }
  }

  if (!weblink.name || weblink.name.trim() === '') {
    errors.push('Name is required');
  }

  if (!weblink.categoryId || weblink.categoryId.trim() === '') {
    errors.push('Category is required');
  }

  return { valid: errors.length === 0, errors };
}
