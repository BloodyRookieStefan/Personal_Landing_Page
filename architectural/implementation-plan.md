# Implementation Plan

## Scoped Change Note — 2026-05-06
The current change request is limited to updated requirements in `REQ-001-Dashboard.md` and `REQ-002-Weblink.md`.

Scoped implementation goals:
- Update compact dashboard rendering so weblinks read more like a left-to-right list in compact mode.
- Add an ellipsis action on each weblink tile with an `Edit` action for existing weblinks.
- Support editing existing weblinks through the existing form flow and persist those edits immediately.
- Persist weblink records in the required user-facing schema (`URL`, `Name`, `Icon`, `Description`, `Category`) while still accepting legacy stored records during deserialization.

## Overview
Build a bookmark dashboard application that manages categorized weblinks, persists bookmark data in a structured file instead of browser storage, supports Firefox bookmark import, and provides a localized, theme-aware UI. The implementation prioritizes a stable domain model and file synchronization flow first, then layers dashboard interactions, category management, and import tooling on top.

## Stack
- React 18 + Vite 5 + TypeScript
- lucide-react (icon palette)
- idb-keyval (IndexedDB for file handle persistence)
- File System Access API (primary storage), fallback download/upload mode
- Vitest + @testing-library/react (unit/integration tests)
- Playwright (UI tests)

## Requirements Coverage
| ID | Title | Status |
|----|-------|--------|
| REQ-001 | Dashboard | Completed |
| REQ-002 | Weblink | Completed |
| REQ-003 | Storage | Completed* |
| REQ-004 | Category | Completed |
| REQ-005 | Import Old Firefox Bookmarks | Completed |

\* Open issues remain — see **Pending Remediation** below.

## Architecture
The application should be implemented as a client-first dashboard with a clear separation between UI state, domain state, and persistence adapters.

Use three layers:
1. Domain layer: typed models, validation, defaulting logic, icon palette definitions, translation keys, and business rules for categories, imports, and weblink creation.
2. Application layer: state management, commands for CRUD and synchronization, import workflow orchestration, and browser-persisted UI preferences.
3. Infrastructure/UI layer: dashboard layout, localized components, theme system, compact mode rendering, file read/write integration, and bookmark import entry points.

Recommended design decisions:
- Store bookmark data in a single structured file such as JSON to satisfy reliable read/write requirements and keep synchronization logic simple.
- Keep browser storage limited to UI preferences only: theme, language, compact mode, and optionally a file sync fingerprint or last synchronized hash/timestamp.
- Represent weblinks and categories with normalized identifiers internally, even if the persisted file stores them as flat records.
- Centralize the icon palette in one reusable module shared by both weblink and category forms to guarantee the same allowed icon set.
- Reserve and protect the default categories "Imported" and "Not defined" in domain logic, not only in the UI.
- Introduce a storage synchronization service responsible for comparing the current file state against the last synchronized fingerprint on page load.
- Expose Firefox import as an application command that transforms imported bookmarks into valid weblink records using the "Imported" category automatically.

Suggested module responsibilities:
- Models: weblink, category, settings, import payload, storage snapshot metadata.
- Services: storage service, sync detector, import parser/adapter, settings persistence, i18n service.
- UI: dashboard shell, category sidebar, tile grid, settings controls, dialogs/prompts, category management forms, weblink creation form, import action.

Dependency order:
- REQ-002 and REQ-004 define the core data model and rules.
- REQ-003 depends on the finalized weblink/category model and must be implemented before full dashboard workflows.
- REQ-001 depends on domain models, settings persistence, and storage-backed data retrieval.
- REQ-005 depends on category defaults, import mapping rules, and storage write support.

## Implementation Tasks

### Phase 1 – Foundation and Domain Modeling
- [x] Define the canonical weblink model with exactly these user-facing fields: URL, Name, Icon, Description, Category; add any internal IDs or metadata separately so REQ-002 remains satisfied.
- [x] Define the category model with a required name and exactly one icon assignment; include protected flags or constants for the default categories.
- [x] Create a shared standard icon palette module containing at least: Globe, Star, Bookmark, Folder, Home, Briefcase, Graduation Cap, Code, Shopping Cart, Heart, Camera, Music Note, Video, Newspaper, Message Circle, Wrench, Shield, Cloud, Calendar, and Link.
- [x] Implement domain validation utilities for weblinks and categories, including required category assignment for every weblink.
- [x] Implement default category seeding logic to always provide "Imported" and "Not defined" on startup.
- [x] Implement rules that prevent user creation or deletion of the reserved default categories and prevent duplicates with those names.
- [x] Define translation keys for all dashboard labels, settings labels, category actions, import actions, prompts, and empty states in German and English.

### Phase 2 – File Storage and Synchronization
- [x] Choose and document the storage file location and structured format: single JSON file (`storage/weblinks.json`) containing weblinks, categories, version, and sync metadata.
- [x] Implement a storage adapter for reading and writing the file reliably, including parsing, validation, and serialization of weblink/category records.
- [x] Implement a synchronization fingerprint strategy (content hash); persist the last synchronized fingerprint in browser storage via idb-keyval.
- [x] On application load, compare the current file fingerprint with the last synchronized fingerprint.
- [x] If the file changed, show a confirmation prompt asking whether the updated file should be synchronized into the current application state.
- [x] If the user confirms, import the file contents into the application state and update the stored sync fingerprint.
- [x] If the user declines, leave current in-memory state unchanged and do not overwrite the file automatically.
- [x] Implement write-through behavior so newly created weblinks are immediately written back to the storage file.
- [x] Ensure file writes preserve required data integrity for categories and imported records.
- [x] Add error handling for unreadable files, invalid file structure, write failures, and sync conflicts; surface actionable UI messages.

### Phase 3 – Settings and UI State Persistence
- [x] Implement settings state for theme, language, and compact mode.
- [x] Persist theme, language, and compact mode in browser storage and restore them on startup.
- [x] Add initialization logic that hydrates UI settings before the dashboard renders to avoid visible flicker or incorrect default state.
- [x] Implement a theme system with light mode and dark mode tokens/styles.
- [x] Implement an i18n layer with German and English resources and runtime language switching.

### Phase 4 – Dashboard Experience
- [x] Build the dashboard shell with a left sidebar for categories and a right content region for weblink tiles.
- [x] Implement category list rendering in the sidebar, including default and custom categories.
- [x] Implement tile grid rendering for weblinks filtered or grouped by category selection.
- [x] Design each weblink tile to display at minimum: weblink name, assigned category, and optional comment/description only when present.
- [x] Implement compact mode styling that measurably reduces tile footprint while preserving readability.
- [x] Add visible controls for theme switching, language switching, and compact mode toggling.
- [x] Ensure the dashboard layout and tile behavior work in both light and dark mode and in both supported languages.
- [x] Add empty states for no categories, no weblinks in a category, and no imported bookmarks.

### Phase 5 – Category Management and Weblink Creation
- [x] Implement a create-category workflow with name and icon selection from the shared icon palette.
- [x] Implement a delete-category workflow for custom categories only.
- [x] Reassign affected weblinks to "Not defined" before deletion of a custom category.
- [x] Block deletion actions for "Imported" and "Not defined" in both UI and domain logic.
- [x] Implement a create-weblink workflow that captures URL, Name, Icon, Description, and Category.
- [x] Default newly created weblinks to the "Not defined" category if no category is selected.
- [x] Ensure every new weblink creation updates application state and immediately persists to the storage file.

### Phase 6 – Firefox Bookmark Import
- [x] Add a visible import action to the dashboard UI.
- [x] Implement file-upload mechanism for exported Firefox bookmarks HTML file.
- [x] Implement a parser/adapter that converts imported Firefox bookmark data into internal weblink records.
- [x] Map each imported bookmark to a new weblink entry with the category forcibly set to "Imported".
- [x] Ensure imported bookmarks never receive the "Not defined" category.
- [x] Persist imported weblinks through the same storage write path used by manual weblink creation.
- [x] Provide user feedback summarizing how many bookmarks were imported and how many failed validation.

### Phase 7 – Validation and Acceptance Coverage
- [x] Add unit tests for domain rules: required category assignment, default category protection, duplicate reserved-name blocking, default category fallback, and import-to-Imported mapping.
- [x] Add tests for icon palette availability and shared usage between categories and weblinks.
- [x] Add integration tests for settings persistence across reload, file change detection prompt behavior, sync accept/decline flows, and new weblink write-through.
- [x] Add UI tests for dashboard layout, tile content rules, compact mode rendering, theme switch, language switch, category creation/deletion, and visible Firefox import action.
- [x] Verify each acceptance criterion explicitly against implemented behavior before completion.

## Pending Remediation
Issues identified by the last review cycle that are not yet resolved:

### Issue 1 – Storage error not surfaced in UI (REQ-003)
- **Files:** `src/main.tsx`, `src/app/state/store.ts`, `src/app/bootstrap/index.ts`
- **Problem:** `bootstrapApp` sets `storageStatus: 'error'` and writes to `storageError`, but `main.tsx` has no branch for `storageStatus === 'error'`. The error path falls through to the normal dashboard silently.
- **Required fix:** Add an `error` branch in `main.tsx` that renders a visible error explanation and recovery action instead of showing the dashboard.

### Issue 2 – Persisted storage format does not match required weblink schema (REQ-002 / REQ-003)
- **Files:** `src/services/storage/serializers.ts`, `src/services/storage/file-storage-service.ts`
- **Problem:** `serializeStorageData` writes raw internal state (fields `id`, `categoryId`, `createdAt`) instead of mapping to the required user-facing schema (`URL`, `Name`, `Icon`, `Description`, `Category`). `deserializeStorageData` accepts malformed per-record shapes without validation.
- **Required fix:** Add a serialization mapping layer that converts between internal model and the required persisted record shape, and add per-record validation on deserialization.

### Issue 3 – UI test selectors do not match actual DOM (Phase 7)
- **Files:** `tests/ui/dashboard.spec.ts`, `src/ui/dashboard/WeblinkGrid.tsx`
- **Problem:** Playwright spec asserts `[data-testid="weblink-grid"]` and `[data-testid="weblink-grid-empty"]`; component renders `[data-testid="weblinks-empty"]` in the empty branch and omits the grid list entirely.
- **Required fix:** Align selectors in `dashboard.spec.ts` with the actual `data-testid` values emitted by `WeblinkGrid.tsx`, or update the component to consistently emit both testids.

## File Structure
Actual structure after implementation:

```text
architectural/
  implementation-plan.md
  implementation-report.md
  review-findings.md
requirements/
  REQ-001-Dashboard.md
  REQ-002-Weblink.md
  REQ-003-Storage.md
  REQ-004-Category.md
  REQ-005-Import_old_bookmarks.md
src/
  main.tsx
  app/
    bootstrap/
      index.ts
    state/
      store.ts
  domain/
    weblinks/
      model.ts
      validation.ts
      defaults.ts
    categories/
      model.ts
      validation.ts
      defaults.ts
    icons/
      palette.ts
    settings/
      model.ts
    imports/
      model.ts
      mapping.ts
  services/
    storage/
      file-storage-service.ts
      sync-service.ts
      serializers.ts
    settings/
      settings-storage-service.ts
    import/
      firefox-import-service.ts
      firefox-parser.ts
    i18n/
      i18n-service.ts
      locales/
        de.ts
        en.ts
  ui/
    dashboard/
      DashboardShell.tsx + .module.css
      CategorySidebar.tsx + .module.css
      WeblinkGrid.tsx + .module.css
      DashboardToolbar.tsx + .module.css
    categories/
      CategoryForm.tsx
      DeleteCategoryDialog.tsx
    weblinks/
      WeblinkForm.tsx
    import/
      ImportBookmarksAction.tsx
    shared/
      dialogs/
        ConfirmDialog.tsx
        SyncConfirmDialog.tsx
      icons/
        IconDisplay.tsx
        IconPicker.tsx + .module.css
      storage/
        StorageSetupDialog.tsx + .module.css
  styles/
    theme-tokens.css
    globals.css
storage/
  weblinks.json
tests/
  setup.ts
  unit/
    domain-rules.test.ts
  integration/
    sync-flow.test.ts
    settings.test.ts
  ui/
    dashboard.spec.ts
```

## Constraints
- Always start the application via `npm run dev` and verify it at `http://localhost:5173`. Opening `index.html` directly produces a blank page because the browser cannot resolve the Vite module graph or transpile `.tsx` files without the dev server.
- File System Access API is used for primary storage. Browser storage (idb-keyval / localStorage) is limited to UI preferences and sync fingerprint only.
- The persisted file (`storage/weblinks.json`) must map to user-facing field names (`URL`, `Name`, `Icon`, `Description`, `Category`) — not internal model field names.
