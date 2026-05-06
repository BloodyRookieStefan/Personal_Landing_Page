import type { Category } from './model';

export const CATEGORY_IMPORTED_ID = 'default-imported';
export const CATEGORY_NOT_DEFINED_ID = 'default-not-defined';

export const RESERVED_CATEGORY_NAMES = ['Imported', 'Not defined'];

export const DEFAULT_CATEGORIES: Category[] = [
  {
    id: CATEGORY_IMPORTED_ID,
    name: 'Imported',
    icon: 'bookmark',
    isDefault: true,
  },
  {
    id: CATEGORY_NOT_DEFINED_ID,
    name: 'Not defined',
    icon: 'folder',
    isDefault: true,
  },
];

export function ensureDefaultCategories(categories: Category[]): Category[] {
  const result = [...categories.filter(c => !c.isDefault)];
  return [...DEFAULT_CATEGORIES, ...result];
}

export function isDefaultCategory(categoryId: string): boolean {
  return categoryId === CATEGORY_IMPORTED_ID || categoryId === CATEGORY_NOT_DEFINED_ID;
}
