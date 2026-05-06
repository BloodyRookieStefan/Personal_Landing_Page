import type { FirefoxBookmark } from './model';
import type { Weblink } from '../weblinks/model';
import { CATEGORY_IMPORTED_ID } from '../categories/defaults';
import { ICON_PALETTE } from '../icons/palette';

export function mapFirefoxBookmarkToWeblink(bookmark: FirefoxBookmark): Weblink {
  return {
    id: crypto.randomUUID(),
    url: bookmark.url,
    name: bookmark.name || bookmark.url,
    icon: ICON_PALETTE[0].id,
    description: '',
    categoryId: CATEGORY_IMPORTED_ID,
    createdAt: bookmark.addDate ?? Date.now(),
  };
}
