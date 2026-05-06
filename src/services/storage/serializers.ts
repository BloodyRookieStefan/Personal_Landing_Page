import type { Weblink } from '../../domain/weblinks/model';
import type { Category } from '../../domain/categories/model';
import { CATEGORY_NOT_DEFINED_ID, ensureDefaultCategories } from '../../domain/categories/defaults';

export interface StorageData {
  version: number;
  weblinks: Weblink[];
  categories: Category[];
}

interface PersistedWeblinkRecord {
  URL: string;
  Name: string;
  Icon: string;
  Description: string;
  Category: string;
}

interface PersistedCategoryRecord {
  id: string;
  name: string;
  icon: string;
  isDefault: boolean;
}

interface PersistedStorageData {
  version: number;
  weblinks: PersistedWeblinkRecord[];
  categories: PersistedCategoryRecord[];
}

export function serializeStorageData(data: StorageData): string {
  const categories = data.categories.map(category => ({
    id: category.id,
    name: category.name,
    icon: category.icon,
    isDefault: category.isDefault,
  }));

  const serialized: PersistedStorageData = {
    version: data.version,
    categories,
    weblinks: data.weblinks.map(weblink => ({
      URL: weblink.url,
      Name: weblink.name,
      Icon: weblink.icon,
      Description: weblink.description,
      Category: data.categories.find(category => category.id === weblink.categoryId)?.name ?? '',
    })),
  };

  return JSON.stringify(serialized, null, 2);
}

export function deserializeStorageData(raw: string): StorageData {
  const parsed = JSON.parse(raw) as PersistedStorageData | StorageData;
  if (typeof parsed.version !== 'number') {
    throw new Error('Invalid storage format: missing version field');
  }
  if (!Array.isArray(parsed.weblinks)) {
    throw new Error('Invalid storage format: weblinks must be an array');
  }
  if (!Array.isArray(parsed.categories)) {
    throw new Error('Invalid storage format: categories must be an array');
  }

  const categories = ensureDefaultCategories(parsed.categories.map(parseCategoryRecord));

  return {
    version: parsed.version,
    categories,
    weblinks: parsed.weblinks.map((record, index) => parseWeblinkRecord(record, categories, index)),
  };
}

export function createEmptyStorageData(): StorageData {
  return { version: 1, weblinks: [], categories: [] };
}

function parseCategoryRecord(record: unknown): Category {
  if (!record || typeof record !== 'object') {
    throw new Error('Invalid storage format: category record must be an object');
  }

  const legacyRecord = record as Partial<Category>;
  const persistedRecord = record as Partial<PersistedCategoryRecord>;

  const id = typeof persistedRecord.id === 'string' ? persistedRecord.id : legacyRecord.id;
  const name = typeof persistedRecord.name === 'string' ? persistedRecord.name : legacyRecord.name;
  const icon = typeof persistedRecord.icon === 'string' ? persistedRecord.icon : legacyRecord.icon;
  const isDefault =
    typeof persistedRecord.isDefault === 'boolean'
      ? persistedRecord.isDefault
      : Boolean(legacyRecord.isDefault);

  if (!id || !name || !icon) {
    throw new Error('Invalid storage format: category record is incomplete');
  }

  return { id, name, icon, isDefault };
}

function parseWeblinkRecord(
  record: unknown,
  categories: Category[],
  index: number
): Weblink {
  if (!record || typeof record !== 'object') {
    throw new Error('Invalid storage format: weblink record must be an object');
  }

  const persistedRecord = record as Partial<PersistedWeblinkRecord>;
  if ('URL' in persistedRecord || 'Name' in persistedRecord || 'Category' in persistedRecord) {
    const url = requireString(persistedRecord.URL, 'Invalid storage format: URL is required');
    const name = requireString(persistedRecord.Name, 'Invalid storage format: Name is required');
    const icon = requireString(persistedRecord.Icon, 'Invalid storage format: Icon is required');
    const description = optionalString(
      persistedRecord.Description,
      'Invalid storage format: Description must be a string'
    );
    const categoryName = requireString(
      persistedRecord.Category,
      'Invalid storage format: Category is required'
    );
    const matchedCategory = categories.find(category => category.name === categoryName);

    return {
      id: `weblink-${index + 1}`,
      url,
      name,
      icon,
      description,
      categoryId: matchedCategory?.id ?? CATEGORY_NOT_DEFINED_ID,
      createdAt: 0,
    };
  }

  const legacyRecord = record as Partial<Weblink>;
  return {
    id: requireString(legacyRecord.id, 'Invalid storage format: weblink id is required'),
    url: requireString(legacyRecord.url, 'Invalid storage format: weblink url is required'),
    name: requireString(legacyRecord.name, 'Invalid storage format: weblink name is required'),
    icon: requireString(legacyRecord.icon, 'Invalid storage format: weblink icon is required'),
    description: optionalString(
      legacyRecord.description,
      'Invalid storage format: weblink description must be a string'
    ),
    categoryId: requireString(
      legacyRecord.categoryId,
      'Invalid storage format: weblink categoryId is required'
    ),
    createdAt:
      typeof legacyRecord.createdAt === 'number' ? legacyRecord.createdAt : 0,
  };
}

function requireString(value: unknown, message: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(message);
  }

  return value;
}

function optionalString(value: unknown, message: string): string {
  if (typeof value === 'undefined') {
    return '';
  }

  if (typeof value !== 'string') {
    throw new Error(message);
  }

  return value;
}
