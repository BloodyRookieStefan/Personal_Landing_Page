import type { FirefoxBookmark } from '../../domain/imports/model';

export function parseFirefoxBookmarksHtml(html: string): FirefoxBookmark[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const anchors = doc.querySelectorAll('a[href]');
  const bookmarks: FirefoxBookmark[] = [];

  anchors.forEach(a => {
    const href = a.getAttribute('href');
    if (!href || href.startsWith('javascript:') || href.startsWith('place:')) {
      return;
    }
    try {
      new URL(href);
    } catch {
      return;
    }
    const addDateAttr = a.getAttribute('add_date');
    bookmarks.push({
      url: href,
      name: a.textContent?.trim() || href,
      addDate: addDateAttr ? parseInt(addDateAttr, 10) * 1000 : undefined,
    });
  });

  return bookmarks;
}
