# Personal Landing Page

![React 18.3.1](https://img.shields.io/badge/React-18.3.1-20232A?logo=react)
![Vite 5.2.0](https://img.shields.io/badge/Vite-5.2.0-646CFF?logo=vite)
![TypeScript 5.4.5](https://img.shields.io/badge/TypeScript-5.4.5-3178C6?logo=typescript&logoColor=white)
![Vitest 1.4.0](https://img.shields.io/badge/Vitest-1.4.0-6E9F18?logo=vitest&logoColor=white)
![Playwright 1.42.0](https://img.shields.io/badge/Playwright-1.42.0-2EAD33?logo=playwright&logoColor=white)

A React and TypeScript bookmark dashboard for managing categorized weblinks with file-based persistence, Firefox bookmark import, localization, and theme support.

## Features

- Category sidebar on the left and weblink tiles on the right
- Light and dark theme switching
- English and German UI
- Compact list-like display mode
- Create, edit, and organize weblinks by category
- Protected default categories: `Imported` and `Not defined`
- File-based JSON storage with synchronization prompt on external changes
- Firefox bookmark HTML import
- Unit, integration, and UI test coverage with Vitest and Playwright

## Tech Stack

- React 18
- Vite 5
- TypeScript 5
- idb-keyval for browser-side preference and sync metadata persistence
- File System Access API for primary file storage
- Vitest and Testing Library for unit and integration tests
- Playwright for browser UI tests

## Getting Started

### Prerequisites

- Node.js 18 or newer
- npm

### Install

```bash
npm install
```

### Run the app

```bash
npm run dev
```

Open the application at `http://localhost:5173`.

Do not open `index.html` directly in the browser. The project is a Vite application and must run through the dev server.

## Available Scripts

```bash
npm run dev
npm run build
npm run preview
npm test
npm run test:watch
npm run test:ui
```

## Storage Model

The application stores bookmark data in a structured JSON file instead of using browser storage as the primary data source.

- Main storage file: `storage/weblinks.json`
- Browser storage is only used for UI preferences and synchronization metadata
- On startup, the app checks whether the underlying file changed since the last synchronized state
- If a change is detected, the user is asked whether the updated file should be synchronized into the current app state

Current storage container example:

```json
{
  "version": 1,
  "weblinks": [],
  "categories": []
}
```

Persisted weblink records are written using the user-facing schema:

```json
{
  "URL": "https://example.com",
  "Name": "Example",
  "Icon": "Globe",
  "Description": "Optional note",
  "Category": "Imported"
}
```

## Testing

Run the automated checks with:

```bash
npm test
npm run test:ui
```

If Playwright browsers are not installed yet, install them with:

```bash
npx playwright install
```

## Project Structure

```text
src/
  app/          Application bootstrap and state
  domain/       Business rules, models, defaults, validation
  services/     Storage, import, i18n, and settings services
  styles/       Global styles and theme tokens
  ui/           Dashboard and form components
tests/
  integration/  Integration tests
  ui/           Playwright UI tests
  unit/         Unit tests
storage/
  weblinks.json Example storage file
requirements/   Functional requirements
architectural/  Planning, implementation, and review notes
```

## Functional Scope

This project covers the following areas:

- Dashboard rendering for categorized weblinks
- Weblink creation and editing
- Category management
- File-backed persistence and sync detection
- Firefox bookmark import
- Localization and persisted UI preferences

## License

This project currently has no license file in the repository.