import type { Category } from './model';
import { RESERVED_CATEGORY_NAMES } from './defaults';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateCategory(
  category: Partial<Category>,
  existingCategories: Category[]
): ValidationResult {
  const errors: string[] = [];

  if (!category.name || category.name.trim() === '') {
    errors.push('Category name is required');
  } else {
    const normalized = category.name.trim();

    const isReserved = RESERVED_CATEGORY_NAMES.some(
      r => r.toLowerCase() === normalized.toLowerCase()
    );
    if (isReserved) {
      errors.push(`"${normalized}" is a reserved category name and cannot be used`);
    }

    const duplicate = existingCategories.find(
      c => c.name.toLowerCase() === normalized.toLowerCase() && c.id !== category.id
    );
    if (duplicate) {
      errors.push(`A category named "${normalized}" already exists`);
    }
  }

  if (!category.icon || category.icon.trim() === '') {
    errors.push('Category icon is required');
  }

  return { valid: errors.length === 0, errors };
}

export function canDeleteCategory(isDefault: boolean): ValidationResult {
  if (isDefault) {
    return { valid: false, errors: ['Default categories cannot be deleted'] };
  }
  return { valid: true, errors: [] };
}
