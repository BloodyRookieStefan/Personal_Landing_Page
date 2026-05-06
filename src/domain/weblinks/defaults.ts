import type { Weblink } from './model';
import { CATEGORY_NOT_DEFINED_ID } from '../categories/defaults';
import { ICON_PALETTE } from '../icons/palette';

export function createDefaultWeblink(overrides: Partial<Weblink> = {}): Weblink {
  return {
    id: crypto.randomUUID(),
    url: '',
    name: '',
    icon: ICON_PALETTE[0].id,
    description: '',
    categoryId: CATEGORY_NOT_DEFINED_ID,
    createdAt: Date.now(),
    ...overrides,
  };
}
