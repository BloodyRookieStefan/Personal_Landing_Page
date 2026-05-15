// bookmark-import.js

// ─────────────────────────────────────────────────────────────────────────────
// Open import dialog
// ─────────────────────────────────────────────────────────────────────────────

function openBookmarkImportDialog() {
  const body = buildImportBody();
  openModal({ title: t('import.title'), body });
}

// ─────────────────────────────────────────────────────────────────────────────
// Build import dialog body
// ─────────────────────────────────────────────────────────────────────────────

function buildImportBody() {
  const wrap = document.createElement('div');
  wrap.style.display       = 'flex';
  wrap.style.flexDirection = 'column';
  wrap.style.gap           = '16px';

  // Description
  const desc = document.createElement('p');
  desc.className   = 'import-description';
  desc.textContent = t('import.description');
  wrap.appendChild(desc);

  // Status message area
  const statusEl = document.createElement('div');
  statusEl.style.fontSize = '0.875rem';
  wrap.appendChild(statusEl);

  // Drop area / file trigger
  const dropArea = document.createElement('div');
  dropArea.className = 'import-drop-area';
  dropArea.setAttribute('role',     'button');
  dropArea.setAttribute('tabindex', '0');
  dropArea.setAttribute('aria-label', t('import.chooseFile'));

  const dropIcon = document.createElement('div');
  dropIcon.className = 'import-drop-icon';
  dropIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>`;
  dropArea.appendChild(dropIcon);

  const dropLabel = document.createElement('div');
  dropLabel.textContent = t('import.drop');
  dropArea.appendChild(dropLabel);

  const fileInput = document.createElement('input');
  fileInput.type   = 'file';
  fileInput.accept = '.json,application/json';
  fileInput.style.display = 'none';
  dropArea.appendChild(fileInput);

  dropArea.addEventListener('click', () => fileInput.click());
  dropArea.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInput.click(); }
  });

  // Drag-and-drop
  dropArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropArea.classList.add('drag-over');
  });
  dropArea.addEventListener('dragleave', () => dropArea.classList.remove('drag-over'));
  dropArea.addEventListener('drop', (e) => {
    e.preventDefault();
    dropArea.classList.remove('drag-over');
    const file = e.dataTransfer?.files?.[0];
    if (file) processFile(file, statusEl);
  });

  fileInput.addEventListener('change', () => {
    const file = fileInput.files?.[0];
    if (file) processFile(file, statusEl);
  });

  wrap.appendChild(dropArea);
  return wrap;
}

// ─────────────────────────────────────────────────────────────────────────────
// Process the selected JSON file
// ─────────────────────────────────────────────────────────────────────────────

async function processFile(file, statusEl) {
  let raw;
  try {
    raw = await file.text();
  } catch {
    statusEl.textContent = t('import.error');
    statusEl.style.color = 'var(--color-danger)';
    return;
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    statusEl.textContent = t('import.error');
    statusEl.style.color = 'var(--color-danger)';
    return;
  }

  const bookmarks  = extractBookmarks(parsed);
  const existingUrls = new Set(state.weblinks.map(w => w.url));

  if (bookmarks.length === 0) {
    statusEl.textContent = t('import.noValid');
    statusEl.style.color = 'var(--color-warning)';
    return;
  }

  let imported    = 0;
  let duplicates  = 0;

  for (const bm of bookmarks) {
    if (existingUrls.has(bm.url)) {
      duplicates++;
      continue;
    }
    const wl = createWeblink({
      url:         bm.url,
      name:        bm.name || bm.url,
      icon:        'bookmark',
      description: bm.description || '',
      category:    DEFAULT_CATEGORY_IDS.IMPORTED,
    });
    state.weblinks.push(wl);
    existingUrls.add(bm.url);
    imported++;
  }

  // Status text
  let message = t('import.success', { n: imported });
  if (duplicates > 0) message += ' ' + t('import.duplicateSkipped', { n: duplicates });
  statusEl.textContent = message;
  statusEl.style.color = imported > 0 ? 'var(--color-success)' : 'var(--color-warning)';

  // Persist and re-render
  if (imported > 0) {
    try {
      await persistData();
    } catch {
      showToast(t('storage.saveError'), 'error');
    }
    closeModal();
    showToast(t('toast.imported') + ` (${imported})`, 'success');
    renderSidebar();
    renderWeblinks();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Firefox bookmark JSON parser
//
// Firefox exports bookmarks as a nested JSON tree.  The root object has a
// "type" of "text/x-moz-place-container" and contains "children" arrays.
// Leaf nodes with type "text/x-moz-place" carry the actual URL in "uri".
//
// Supported export shape (Firefox → Bookmarks → Back Up):
// {
//   "title": "...",
//   "type": "text/x-moz-place-container",
//   "children": [
//     {
//       "title": "My Link",
//       "type": "text/x-moz-place",
//       "uri": "https://..."
//     },
//     { "type": "text/x-moz-place-container", "children": [...] }
//   ]
// }
// ─────────────────────────────────────────────────────────────────────────────

function extractBookmarks(node) {
  const results = [];

  function traverse(n) {
    if (!n || typeof n !== 'object') return;

    // Leaf bookmark entry
    if (n.type === 'text/x-moz-place' && typeof n.uri === 'string') {
      const url = sanitizeString(n.uri);
      if (url && (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('ftp://'))) {
        results.push({
          url,
          name:        sanitizeString(n.title || ''),
          description: '',
        });
      }
      return;
    }

    // Container – recurse into children
    if (Array.isArray(n.children)) {
      for (const child of n.children) traverse(child);
    }

    // Some exports have root as an array
    if (Array.isArray(n)) {
      for (const child of n) traverse(child);
    }
  }

  traverse(node);
  return results;
}
