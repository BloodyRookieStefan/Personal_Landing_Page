import type { Weblink } from '../../domain/weblinks/model';
import type { ImportResult } from '../../domain/imports/model';
import { mapFirefoxBookmarkToWeblink } from '../../domain/imports/mapping';
import { parseFirefoxBookmarksHtml } from './firefox-parser';
import { validateWeblink } from '../../domain/weblinks/validation';

export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target?.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file, 'UTF-8');
  });
}

export function importFirefoxBookmarks(html: string): {
  weblinks: Weblink[];
  result: ImportResult;
} {
  const bookmarks = parseFirefoxBookmarksHtml(html);
  const weblinks: Weblink[] = [];
  const errors: string[] = [];

  for (const bookmark of bookmarks) {
    const weblink = mapFirefoxBookmarkToWeblink(bookmark);
    const validation = validateWeblink(weblink);
    if (validation.valid) {
      weblinks.push(weblink);
    } else {
      errors.push(`Failed to import "${bookmark.name}": ${validation.errors.join(', ')}`);
    }
  }

  return {
    weblinks,
    result: { imported: weblinks.length, failed: errors.length, errors },
  };
}
