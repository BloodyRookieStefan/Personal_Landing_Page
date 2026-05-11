import { state, updateSettings } from '../state.js';
import { t, applyTranslations } from '../i18n.js';
import { byId, setVisible } from '../utils/dom.js';

// Forward declarations – set by app.js after all modules are loaded
let _onAddWeblink       = null;
let _onManageCategories = null;
let _onImportBookmarks  = null;
let _onReconnectFile    = null;
let _onSaveFile         = null;
let _onRenderSidebar    = null;
let _onRenderWeblinks   = null;

export function setLayoutCallbacks({
  onAddWeblink,
  onManageCategories,
  onImportBookmarks,
  onReconnectFile,
  onSaveFile,
  onRenderSidebar,
  onRenderWeblinks,
}) {
  _onAddWeblink       = onAddWeblink;
  _onManageCategories = onManageCategories;
  _onImportBookmarks  = onImportBookmarks;
  _onReconnectFile    = onReconnectFile;
  _onSaveFile         = onSaveFile;
  _onRenderSidebar    = onRenderSidebar;
  _onRenderWeblinks   = onRenderWeblinks;
}

// ─────────────────────────────────────────────────────────────────────────────
// Apply theme
// ─────────────────────────────────────────────────────────────────────────────

export function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const iconLight = byId('icon-theme-light');
  const iconDark  = byId('icon-theme-dark');
  if (iconLight && iconDark) {
    setVisible(iconLight, theme === 'light');
    setVisible(iconDark,  theme === 'dark');
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Apply compact mode UI
// ─────────────────────────────────────────────────────────────────────────────

export function applyCompactMode(compact) {
  const btn       = byId('btn-compact');
  const iconOff   = byId('icon-compact-off');
  const iconOn    = byId('icon-compact-on');
  if (btn) btn.setAttribute('aria-pressed', String(compact));
  if (iconOff) setVisible(iconOff, !compact);
  if (iconOn)  setVisible(iconOn,   compact);
}

// ─────────────────────────────────────────────────────────────────────────────
// Update language label
// ─────────────────────────────────────────────────────────────────────────────

export function updateLanguageLabel() {
  const label = byId('lang-label');
  if (label) {
    // Show the OTHER language as the toggle label (clicking switches to that lang)
    label.textContent = state.settings.language === 'de' ? 'EN' : 'DE';
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Show / hide storage reconnect warning button
// ─────────────────────────────────────────────────────────────────────────────

export function setReconnectVisible(visible) {
  const btn = byId('btn-reconnect-file');
  if (btn) {
    setVisible(btn, visible);
    btn.title = visible ? t('storage.accessDenied') : '';
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Show / hide unsaved-changes save button (manual / Firefox mode)
// ─────────────────────────────────────────────────────────────────────────────

export function setUnsavedVisible(visible) {
  const btn = byId('btn-save-file');
  if (btn) {
    setVisible(btn, visible);
    btn.title = visible ? t('storage.unsavedChanges') : '';
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Attach toolbar event listeners (idempotent – safe to call once)
// ─────────────────────────────────────────────────────────────────────────────

export function initToolbar() {
  byId('btn-theme')?.addEventListener('click', () => {
    const next = state.settings.theme === 'light' ? 'dark' : 'light';
    updateSettings({ theme: next });
    applyTheme(next);
  });

  byId('btn-language')?.addEventListener('click', () => {
    const next = state.settings.language === 'de' ? 'en' : 'de';
    updateSettings({ language: next });
    updateLanguageLabel();
    applyTranslations();
    // Trigger a full re-render of dynamic text
    _onRenderSidebar?.();
    _onRenderWeblinks?.();
  });

  byId('btn-compact')?.addEventListener('click', () => {
    const next = !state.settings.compactMode;
    updateSettings({ compactMode: next });
    applyCompactMode(next);
    _onRenderWeblinks?.();
  });

  byId('btn-add-weblink')?.addEventListener('click', () => {
    _onAddWeblink?.();
  });

  byId('btn-manage-categories')?.addEventListener('click', () => {
    _onManageCategories?.();
  });

  byId('btn-import-bookmarks')?.addEventListener('click', () => {
    _onImportBookmarks?.();
  });

  byId('btn-reconnect-file')?.addEventListener('click', () => {
    _onReconnectFile?.();
  });

  byId('btn-save-file')?.addEventListener('click', () => {
    _onSaveFile?.();
  });

  const searchInput = byId('input-search');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      state.searchQuery = searchInput.value;
      _onRenderWeblinks?.();
    });
  }
}
