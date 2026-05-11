/**
 * app.js – Bootstrap entry point for the Personal Dashboard.
 *
 * Initialization order:
 *   1. Load persisted settings (theme, language, compact mode)
 *   2. Apply theme + language immediately to prevent FOUC
 *   3. Initialize toolbar event listeners
 *   4. Storage setup (browser-capability-based):
 *      - Chrome/Edge (direct): try stored handle → load data
 *      - Firefox (manual): show overlay for file import or fresh start
 *   5. Check for external file changes (sync prompt)
 *   6. Render sidebar + weblinks
 */

import { state, loadPersistedSettings, loadPersistedStorageMeta, persistStorageMeta, togglePinWeblink } from './state.js';
import { t, applyTranslations } from './i18n.js';
import {
  applyTheme,
  applyCompactMode,
  updateLanguageLabel,
  initToolbar,
  setLayoutCallbacks,
  setReconnectVisible,
  setUnsavedVisible,
} from './render/layout.js';
import { renderSidebar, setSidebarCallbacks } from './render/sidebar.js';
import { renderWeblinks, setWeblinkCallbacks } from './render/weblinks.js';
import { showToast } from './render/dialogs.js';
import {
  canDirectWrite,
  getStoredHandle,
  verifyPermission,
  pickExistingFile,
  createNewFile,
  loadFromHandle,
  saveToHandle,
  importFromFileInput,
  exportToFile,
  persistData,
  setOnUnsavedChange,
  saveDataCache,
  loadDataCache,
} from './storage.js';
import { checkAndPromptSync } from './features/sync-prompt.js';
import { openAddWeblinkDialog, openEditWeblinkDialog } from './features/weblink-form.js';
import { openCategoryManager } from './features/category-manager.js';
import { openBookmarkImportDialog } from './features/bookmark-import.js';
import { byId, setVisible } from './utils/dom.js';

// ─────────────────────────────────────────────────────────────────────────────
// Bootstrap
// ─────────────────────────────────────────────────────────────────────────────

async function init() {
  // 1. Load persisted settings before any render
  loadPersistedSettings();

  // 2. Load persisted storage connection metadata so storage mode and last
  //    file name are available when the storage setup flow begins
  loadPersistedStorageMeta();

  // 2. Apply theme + lang immediately
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
    onReconnectFile:  () => reconnectFile(),
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
  });

  initToolbar();

  // 5. Initial renders (empty state until file is loaded)
  renderSidebar();
  renderWeblinks();

  // 6. Storage setup – branch by browser capability
  if (canDirectWrite()) {
    // Chrome / Edge: try to restore a previously stored file handle
    const storedHandle = await getStoredHandle();
    if (storedHandle) {
      // Only query permission silently – requestPermission needs a user gesture
      let alreadyGranted = false;
      try {
        alreadyGranted = (await storedHandle.queryPermission({ mode: 'readwrite' })) === 'granted';
      } catch { /* ignore */ }

      if (alreadyGranted) {
        await connectAndLoad(storedHandle);
      } else {
        // Permission needs a user gesture – load from cache if available
        const cached = await loadDataCache();
        if (cached) {
          await loadFromDataCache(cached);
          setReconnectVisible(true); // reconnect button triggers permission prompt
        } else {
          // First run or cache lost – show setup overlay
          setReconnectVisible(true);
          showStorageSetup();
        }
      }
    } else {
      // No stored handle – check for orphaned cache (e.g. handle cleared by browser)
      const cached = await loadDataCache();
      if (cached) {
        await loadFromDataCache(cached);
        setReconnectVisible(true);
      } else {
        showStorageSetup();
      }
    }
  } else {
    // Firefox: direct file handle not available
    const cached = await loadDataCache();
    if (cached) {
      await loadFromDataCache(cached);
      setReconnectVisible(true); // allow user to re-import/export
    } else {
      showStorageSetupManual();
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Load from IndexedDB data cache (skips file dialog)
// ─────────────────────────────────────────────────────────────────────────────

async function loadFromDataCache({ categories, weblinks }) {
  state.categories   = categories || [];
  state.weblinks     = weblinks   || [];
  state.storageReady = true;
  // Keep storageMode/storageFileName from loadPersistedStorageMeta(); file
  // handle is not yet available – reconnect button lets the user re-grant it.
  renderSidebar();
  renderWeblinks();
}

// ─────────────────────────────────────────────────────────────────────────────
// Storage-setup overlay – Chrome/Edge (direct mode)
// ─────────────────────────────────────────────────────────────────────────────

function showStorageSetup() {
  const overlay = byId('storage-setup');
  if (!overlay) return;

  // Show the direct-mode actions, hide the manual-mode actions
  setVisible(byId('storage-direct-actions'), true);
  setVisible(byId('storage-manual-actions'), false);
  setVisible(overlay, true);

  byId('btn-pick-file')?.addEventListener('click', async () => {
    const handle = await pickExistingFile();
    if (handle) {
      setVisible(overlay, false);
      await connectAndLoad(handle);
    }
  });

  byId('btn-create-file')?.addEventListener('click', async () => {
    const handle = await createNewFile();
    if (handle) {
      setVisible(overlay, false);
      state.fileHandle      = handle;
      state.storageMode     = 'direct';
      state.storageFileName = handle.name || null;
      state.storageFileMeta = null;
      state.storageReady    = true;
      setReconnectVisible(false);
      persistStorageMeta();
      try {
        await saveToHandle(handle, state.categories, state.weblinks);
      } catch {
        showToast(t('storage.saveError'), 'error');
      }
      showToast(t('storage.connected'), 'success');
      renderSidebar();
      renderWeblinks();
    }
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Storage-setup overlay – Firefox (manual mode)
// ─────────────────────────────────────────────────────────────────────────────

function showStorageSetupManual() {
  const overlay = byId('storage-setup');
  if (!overlay) return;

  // Show the manual-mode actions, hide the direct-mode actions
  setVisible(byId('storage-direct-actions'), false);
  setVisible(byId('storage-manual-actions'), true);
  setVisible(overlay, true);

  // When a previous manual connection is remembered, update the overlay text
  // to name the last file and explain that the user must reselect it.
  const lastFileName = state.storageFileName;
  if (lastFileName) {
    const titleEl = byId('storage-setup-title');
    if (titleEl) titleEl.textContent = t('storage.reconnectTitle');
    const descEl = overlay.querySelector('[data-i18n="storage.setupDescription"]');
    if (descEl) descEl.textContent = t('storage.reconnectDescription', { name: lastFileName });
    const importBtnSpan = byId('btn-import-file-manual')?.querySelector('[data-i18n="storage.importFile"]');
    if (importBtnSpan) importBtnSpan.textContent = t('storage.reconnectFile');
  }

  byId('btn-import-file-manual')?.addEventListener('click', async () => {
    const result = await importFromFileInput();
    if (!result) return; // user cancelled
    if (result.error === 'invalid-json') {
      showToast(t('import.error'), 'error');
      return;
    }
    setVisible(overlay, false);
    await connectAndLoadManual(result);
  });

  byId('btn-start-fresh')?.addEventListener('click', async () => {
    setVisible(overlay, false);
    state.storageMode     = 'manual';
    state.storageReady    = true;
    state.categories      = [];
    state.weblinks        = [];
    state.storageFileName = null;
    state.storageFileMeta = null;
    state.unsavedChanges  = false;
    persistStorageMeta();
    await saveDataCache([], []);
    showToast(t('storage.connected'), 'success');
    renderSidebar();
    renderWeblinks();
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Connect to a direct file handle and load data (Chrome/Edge)
// ─────────────────────────────────────────────────────────────────────────────

async function connectAndLoad(handle) {
  try {
    const { data, hash } = await loadFromHandle(handle);

    state.fileHandle      = handle;
    state.storageMode     = 'direct';
    state.storageFileName = handle.name || null;
    state.storageFileMeta = null; // direct mode uses IndexedDB handle, not file identity
    state.storageReady    = true;
    persistStorageMeta();

    setReconnectVisible(false);
    showToast(t('storage.connected'), 'success');

    await checkAndPromptSync(hash, data);
    // Cache data after checkAndPromptSync has populated state.categories/weblinks
    await saveDataCache(state.categories, state.weblinks);
    renderSidebar();
    renderWeblinks();
  } catch {
    showToast(t('storage.accessDenied'), 'error');
    setReconnectVisible(true);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Connect from a manually imported file (Firefox)
// ─────────────────────────────────────────────────────────────────────────────

async function connectAndLoadManual({ data, hash, fileName, fileSize, fileLastModified }) {
  // Capture the remembered file identity BEFORE overwriting state so we can
  // determine whether the user reselected the same file or chose a different one.
  const rememberedMeta = state.storageFileMeta;
  const newMeta = (fileName && fileSize !== undefined)
    ? { name: fileName, size: fileSize, lastModified: fileLastModified }
    : null;

  // Two files are considered the same when name, byte-size, and last-modified
  // timestamp all match.  Any mismatch means a different file was selected and
  // the stored sync hash from the previous file must not trigger a dialog.
  const isSameFile = !!(rememberedMeta && newMeta &&
    rememberedMeta.name         === newMeta.name &&
    rememberedMeta.size         === newMeta.size &&
    rememberedMeta.lastModified === newMeta.lastModified);

  state.storageMode     = 'manual';
  state.storageReady    = true;
  state.storageFileName = fileName || null;
  state.storageFileMeta = newMeta;
  state.unsavedChanges  = false;
  persistStorageMeta();

  showToast(t('storage.connected'), 'success');

  await checkAndPromptSync(hash, data, { isSameFile });
  // Cache data after checkAndPromptSync has populated state.categories/weblinks
  await saveDataCache(state.categories, state.weblinks);
  renderSidebar();
  renderWeblinks();
}

// ─────────────────────────────────────────────────────────────────────────────
// Reconnect file (called by toolbar warning button – direct mode only)
// ─────────────────────────────────────────────────────────────────────────────

async function reconnectFile() {
  if (canDirectWrite()) {
    // First try the stored handle (avoids forcing the user to re-pick the file)
    const storedHandle = await getStoredHandle();
    let handle = null;
    if (storedHandle) {
      const granted = await verifyPermission(storedHandle);
      if (granted) handle = storedHandle;
    }
    if (!handle) {
      handle = await pickExistingFile();
    }
    if (handle) {
      setReconnectVisible(false);
      const overlay = byId('storage-setup');
      if (overlay) setVisible(overlay, false);
      await connectAndLoad(handle);
    }
  } else {
    // Firefox: re-import via file picker
    const result = await importFromFileInput();
    if (!result) return;
    if (result.error === 'invalid-json') { showToast(t('import.error'), 'error'); return; }
    const overlay = byId('storage-setup');
    if (overlay) setVisible(overlay, false);
    await connectAndLoadManual(result);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Entry
// ─────────────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', init);

