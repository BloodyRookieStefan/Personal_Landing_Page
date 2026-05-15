# Personal Dashboard

A fully static personal dashboard for managing categorized weblinks.
Opens directly from an HTML file — no server required.

---

## Quick Start

Open `index.html` directly in your browser (Chrome or Edge recommended for full
file-system write support):

- **Windows:** double-click `index.html`, or drag it into your browser
- **macOS / Linux:** `open index.html` or `xdg-open index.html`

No dev server or build step is needed.

---

## Storage File Location

**`weblinks.js` must be placed in the same folder as `index.html`.**

When the dashboard is opened directly from the file system (`file://`), it reads
data from `weblinks.js`, which sets `window.__WEBLINKS_DATA__` via a `<script>`
tag — no server or network request needed. If `weblinks.js` is missing or in a
different directory, the dashboard starts empty. After making changes, use the
export button to download an updated `weblinks.js` and place it back next to
`index.html`.

---

## Loading Behavior

On startup the dashboard picks the best available storage method automatically:

| Environment | Behavior |
|-------------|----------|
| `file://` + `weblinks.js` present | Data read directly from the script tag; always works |
| `file://` + Chrome / Edge | Prompts to pick a file once; handle stored in IndexedDB for auto-reload |
| `file://` + Firefox | Prompts to pick a file; handle stored in IndexedDB; saves via browser download |
| HTTP(S) | Fetches `./weblinks.json` and polls for changes every 15 s |

> **Browser support:** The dashboard works in **Chrome 86+**, **Edge 86+**, and **Firefox 111+**.
>
> Chrome and Edge support the [File System Access API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API)
> with full read/write access. Firefox 111+ supports read-only file picks;
> saves are done via a browser download of an updated `weblinks.js`.

---

## Page-Load Change Detection

Every time the page reloads, the dashboard computes a content hash of the loaded
data and compares it to the hash stored from the last successful sync (persisted
in `localStorage`).

- **No change / first load** – the file loads silently and the new hash is stored.
- **Change detected** – a dialog asks whether to import the updated contents.
  - **Import** – replaces the in-memory state with the file data and records the new hash.
  - **Keep current** – leaves the current state unchanged; the next reload will prompt again.
- **Different file selected** – detected via file name, size, and `lastModified`; loads silently without prompting and establishes a new sync baseline.

---

## Storage File Format

### `weblinks.js` (used on `file://`)

```js
window.__WEBLINKS_DATA__ = {
  "version": 1,
  "categories": [
    { "id": "...", "name": "Work", "icon": "briefcase", "isDefault": false }
  ],
  "weblinks": [
    {
      "id": "...",
      "url": "https://example.com",
      "name": "Example",
      "icon": "globe",
      "description": "An example site",
      "category": "..."
    }
  ]
};
```

### `weblinks.json` (used on HTTP(S))

```json
{
  "version": 1,
  "categories": [
    { "id": "...", "name": "Work", "icon": "briefcase", "isDefault": false }
  ],
  "weblinks": [
    {
      "id": "...",
      "url": "https://example.com",
      "name": "Example",
      "icon": "globe",
      "description": "An example site",
      "category": "..."
    }
  ]
}
```

The two protected categories **"Not defined"** (`not-defined`) and
**"Imported"** (`imported`) are not stored in the file — they are always
injected at runtime with fixed IDs.

User settings (theme, language, compact mode, pinned weblinks) are persisted
separately in `localStorage` and are never written to the storage file.

---

## Firefox Bookmark Import

1. In Firefox: **Bookmarks → Manage All Bookmarks → Import and Backup → Back Up to JSON**
2. Save the `.json` file anywhere on your machine.
3. In the dashboard click **"Import Firefox Bookmarks"** in the toolbar.
4. Select the exported file or drag-and-drop it into the dialog.

Every imported bookmark is automatically assigned to the **"Imported"** category.
Duplicate URLs (already present in the dashboard) are skipped.

### Expected Firefox JSON shape

Firefox exports a single root object of type `text/x-moz-place-container`
with nested `children` arrays. Bookmark leaves have type `text/x-moz-place`
and carry the URL in the `uri` field:

```json
{
  "title": "Bookmarks Menu",
  "type": "text/x-moz-place-container",
  "children": [
    {
      "title": "My Site",
      "type": "text/x-moz-place",
      "uri": "https://mysite.com"
    }
  ]
}
```

The parser handles arbitrarily nested folder structures recursively.

---

## Features

| Feature | Details |
|---------|---------|
| **Categories** | Create and delete custom categories; assign any built-in icon |
| **Protected categories** | "Not defined" and "Imported" are always present and cannot be deleted |
| **Weblinks** | Add and edit weblinks; each has a URL, name, icon, optional description, and a category |
| **Pinned weblinks** | Pin any weblink; a dedicated **Pinned** view in the sidebar lists all pinned links |
| **Search** | Toolbar search filters the visible weblinks in real time |
| **Icons** | 21 built-in Feather-style SVG icons: Globe, Star, Bookmark, Folder, Home, Briefcase, Graduation Cap, Code, Shopping Cart, Heart, Camera, Music Note, Video, Newspaper, Message Circle, Wrench, Shield, Cloud, Calendar, Link, Pin |
| **Themes** | Light and dark mode; persisted in `localStorage` |
| **Languages** | German (DE) and English (EN); persisted in `localStorage` |
| **Compact mode** | Weblinks rendered as a horizontal flow of small rows instead of card tiles; persisted in `localStorage` |
| **Sync detection** | On every page load the file hash is compared to the stored hash; if the file changed externally the user is prompted before importing |
| **IndexedDB cache** | The last loaded data is cached in IndexedDB so the dashboard can display content even before file permission is re-granted |
| **Firefox import** | Recursive parser handles arbitrarily nested bookmark folder structures |
| **Offline / no-server** | Fully static — no backend, no runtime build step |
