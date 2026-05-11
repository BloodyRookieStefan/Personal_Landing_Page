# Personal Dashboard

A fully static personal dashboard for managing categorized weblinks.
Opens directly from an HTML file — no server required.

---

## Quick Start

### 1. Install build tools (one-time)

```bash
npm install
```

### 2. Build the JavaScript bundle

```bash
npm run build
```

### 3. Open the dashboard

Open `index.html` directly in your browser (Chrome or Edge recommended for full
file-system write support):

- **Windows:** double-click `index.html`, or drag it into your browser
- **macOS / Linux:** `open index.html` or `xdg-open index.html`

No dev server is needed.

---

## First-Run: Connecting the Storage File

On first launch the dashboard shows a **"Connect Storage File"** overlay.

| Action | Description |
|--------|-------------|
| **Select File** | Choose an existing `weblinks.json` from your machine |
| **Create New File** | Create a new empty `weblinks.json` via a system save dialog |

A pre-populated empty file is included at `weblinks.json` in the project root —
you can point the picker there to get started immediately.

> **Browser support:** The dashboard works in **Firefox**, **Chrome 86+**, and **Edge 86+**.
>
> Chrome and Edge support the [File System Access API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API):
> the file handle is stored in IndexedDB and the file reopens automatically on
> every page reload. If the handle permission has expired, the dashboard loads
> from its IndexedDB data cache and shows a **Reconnect** button in the toolbar.
>
> Firefox does not support the File System Access API and uses a manual
> import/export workflow: select a JSON file via the **Import JSON File** button
> on the connect screen, and use the **Save File** toolbar button to download
> the updated file back to disk after making changes.
> The last connected file name and its identity (name, size, last-modified) are
> remembered in `localStorage` so the reconnect screen can name the expected
> file on the next page load.

---

## Page-Load Change Detection

Every time the page reloads and reconnects to the storage file, the dashboard
computes a content hash of the file and compares it to the hash stored from the
last successful sync (persisted in `localStorage`).

- **No change / first load** – the file loads silently and the new hash is stored.
- **Change detected** – a dialog asks whether to import the updated contents.
  - **Import** – replaces the in-memory state with the file data and records the new hash.
  - **Keep current** – leaves the current state unchanged; the next reload will prompt again.
- **Different file selected** – detected via file name, size, and `lastModified`; loads silently without prompting and establishes a new sync baseline.

On Chrome/Edge the comparison runs automatically after the stored handle is
restored. On Firefox you must reselect the file on each page load; the
reconnect overlay names the last-used file to help you pick the right one.

---

## Storage File Format

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
separately in `localStorage` and are never written to the JSON file.

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

---

## Development

```bash
# Rebuild once
npm run build

# Watch mode (auto-rebuild on change)
npm run watch

# Run tests
npm test
```

Source files live in `assets/js/` as ES modules. The build entry point is
`assets/js/app.js`; output is `assets/js/bundle.js` (IIFE format, ES2020
target, bundled by [esbuild](https://esbuild.github.io/)).

Tests are located in `tests/` and run with [Vitest](https://vitest.dev/).
