/**
 * app.js – Bootstrap entry point for the Personal Dashboard.
 *
 * Storage strategy:
 * - HTTP(S): fetch ./weblinks.json on every load; poll every 15 s.
 * - file://:  Firefox (and other browsers) block both fetch() and XHR for
 *   file:// URLs due to CORS (security.fileuri.strict_origin_policy).
 *   Instead, index.html loads <script src="weblinks.js"> which sets
 *   window.__WEBLINKS_DATA__ without any CORS check.  When saving, the
 *   dashboard downloads a weblinks.js file (JS wrapper) so the next reload
 *   picks up the new data automatically.
 *   For Chrome/Edge (which support the File System Access API), direct
 *   read/write to a file handle is used as a fallback when weblinks.js is
 *   absent.
 */

// app.js – all dependencies loaded as plain scripts via index.html

// ─────────────────────────────────────────────────────────────────────────────
// File-change handler (watcher callback)
// ─────────────────────────────────────────────────────────────────────────────

async function onFileChanged({ data, hash }) {
  state.categories = data.categories;
  state.weblinks   = data.weblinks;
  if (data.pinnedWeblinks !== null) {
    state.settings.pinnedWeblinks = data.pinnedWeblinks;
    persistSettings();
  }
  storeLastSyncHash(hash);
  await saveDataCache(state.categories, state.weblinks);
  renderSidebar();
  renderWeblinks();
  showToast(t('sync.updated'), 'success');
}

// ─────────────────────────────────────────────────────────────────────────────
// Bootstrap
// ─────────────────────────────────────────────────────────────────────────────

async function init() {
  // 1. Load persisted settings (theme, language, compact mode)
  loadPersistedSettings();

  // 2. Apply theme + language immediately to prevent FOUC
  applyTheme(state.settings.theme);
  applyTranslations();
  updateLanguageLabel();
  applyCompactMode(state.settings.compactMode);

  // 3. Wire unsaved-changes callback so storage.js can drive the save button
  setOnUnsavedChange((unsaved) => setUnsavedVisible(unsaved));

  // 4. Wire up toolbar + sidebar + weblink callbacks
  setLayoutCallbacks({
    onAddWeblink: () => {
      if (!state.storageReady) { showToast(t('storage.setupTitle'), 'error'); return; }
      openAddWeblinkDialog();
    },
    onManageCategories: () => {
      if (!state.storageReady) { showToast(t('storage.setupTitle'), 'error'); return; }
      openCategoryManager();
    },
    onImportBookmarks: () => {
      if (!state.storageReady) { showToast(t('storage.setupTitle'), 'error'); return; }
      openBookmarkImportDialog();
    },
    onSaveFile: async () => {
      await exportToFile(state.categories, state.weblinks, state.storageFileName);
      showToast(t('toast.saved'), 'success');
    },
    onExportJson: async () => {
      await exportToFile(state.categories, state.weblinks, state.storageFileName);
      showToast(t('toast.saved'), 'success');
    },
    onReconnectFile:  () => {},
    onRenderSidebar:  () => renderSidebar(),
    onRenderWeblinks: () => renderWeblinks(),
  });

  setSidebarCallbacks({
    onSelectCategory: (categoryId) => {
      state.selectedCategory = categoryId;
      renderSidebar();
      renderWeblinks();
    },
  });

  setWeblinkCallbacks({
    onEditWeblink: (weblinkId) => openEditWeblinkDialog(weblinkId),
    onPinToggle:   (weblinkId) => {
      togglePinWeblink(weblinkId);
      renderSidebar();
      renderWeblinks();
    },
    onDeleteWeblink: async (weblinkId) => {
      state.weblinks = state.weblinks.filter(w => w.id !== weblinkId);
      await persistData();
      renderSidebar();
      renderWeblinks();
      showToast(t('toast.deleted'), 'success');
    },
  });

  initToolbar();

  // 5. Restore cached data from IndexedDB so the UI is not empty on reload
  const cached = await loadDataCache();
  if (cached) {
    state.categories = cached.categories;
    state.weblinks   = cached.weblinks;
  }

  // If weblinks.js was loaded via <script src="weblinks.js">, apply its data.
  // This is the primary data source on file:// where fetch/XHR is blocked by CORS.
  // On HTTP(S) fetchStaticFile() below will override this with the authoritative source.
  if (window.__WEBLINKS_DATA__) {
    const wlData     = normalizeData(window.__WEBLINKS_DATA__);
    state.categories = wlData.categories;
    state.weblinks   = wlData.weblinks;
    if (wlData.pinnedWeblinks !== null) {
      state.settings.pinnedWeblinks = wlData.pinnedWeblinks;
      persistSettings();
    }
    const canonical  = serializePayload(wlData.categories, wlData.weblinks, wlData.pinnedWeblinks ?? []);
    const hash       = await hashString(canonical);
    storeLastSyncHash(hash);
    await saveDataCache(state.categories, state.weblinks);
  }

  state.storageMode     = 'static';
  state.storageReady    = true;
  state.storageFileName = DEFAULT_STORAGE_FILE_NAME;

  renderSidebar();
  renderWeblinks();

  // 6. Load data from storage.
  // - HTTP(S)              : fetch ./weblinks.json with cache-busting.
  // - file:// + Chrome/Edge: File System Access API, full read/write.
  // - file:// + Firefox    : File System Access API, read-only.
  //   Firefox 111+ supports showOpenFilePicker but not showSaveFilePicker.
  //   The user picks weblinks.json once; the handle is stored in IndexedDB
  //   and reused on every F5, so the page always reflects the current file.
  const fetchResult = await fetchStaticFile();
  if (fetchResult) {
    // HTTP(S): fetch succeeded.
    state.categories = fetchResult.data.categories;
    state.weblinks   = fetchResult.data.weblinks;
    if (fetchResult.data.pinnedWeblinks !== null) {
      state.settings.pinnedWeblinks = fetchResult.data.pinnedWeblinks;
      persistSettings();
    }
    storeLastSyncHash(fetchResult.hash);
    await saveDataCache(state.categories, state.weblinks);
    renderSidebar();
    renderWeblinks();
    startFetchWatcher(onFileChanged);
  } else if (canDirectWrite()) {
    // file:// + Chrome/Edge: full read/write via File System Access API.
    let handle = await getStoredHandle();

    // Check if stored handle still has read permission (expires on browser restart)
    if (handle) {
      const perm = await handle.queryPermission({ mode: 'read' });
      if (perm !== 'granted') handle = null; // will re-pick below
    }

    if (!handle) {
      // First visit or permission expired – ask the user to pick once
      showToast(t('storage.pickFileHint'), 'info');
      handle = await pickExistingFile();
    }

    if (handle) {
      try {
        const { data, hash } = await loadFromHandle(handle);
        state.categories  = data.categories;
        state.weblinks    = data.weblinks;
        if (data.pinnedWeblinks !== null) {
          state.settings.pinnedWeblinks = data.pinnedWeblinks;
          persistSettings();
        }
        state.fileHandle  = handle;
        state.storageMode = 'direct';
        storeLastSyncHash(hash);
        await saveDataCache(state.categories, state.weblinks);
        renderSidebar();
        renderWeblinks();
        startHandleWatcher(handle, onFileChanged);
      } catch {
        showToast(t('storage.accessDenied'), 'error');
      }
    }
  } else if (canDirectRead()) {
    // file:// + Firefox: read-only File System Access API.
    // showOpenFilePicker works; showSaveFilePicker does not → saves via download.
    let handle = await getStoredHandle();

    if (handle) {
      const perm = await handle.queryPermission({ mode: 'read' });
      if (perm !== 'granted') {
        try {
          const req = await handle.requestPermission({ mode: 'read' });
          if (req !== 'granted') handle = null;
        } catch {
          handle = null; // needs user gesture; will re-pick
        }
      }
    }

    if (!handle) {
      // First visit or permission expired – ask the user to pick weblinks.json.
      showToast(t('storage.pickFileHint'), 'info');
      handle = await pickExistingFile();
    }

    if (handle) {
      try {
        const { data, hash } = await loadFromHandle(handle);
        state.categories = data.categories;
        state.weblinks   = data.weblinks;
        if (data.pinnedWeblinks !== null) {
          state.settings.pinnedWeblinks = data.pinnedWeblinks;
          persistSettings();
        }
        storeLastSyncHash(hash);
        await saveDataCache(state.categories, state.weblinks);
        renderSidebar();
        renderWeblinks();
        startHandleWatcher(handle, onFileChanged);
      } catch {
        showToast(t('storage.accessDenied'), 'error');
      }
    }
  }
  // else: no supported storage API → only IndexedDB cache is shown
}

// ─────────────────────────────────────────────────────────────────────────────
// Entry
// ─────────────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', init);

