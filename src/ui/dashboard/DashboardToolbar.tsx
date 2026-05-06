import React, { useState } from 'react';
import { Sun, Moon, Languages, LayoutGrid, Plus, Upload } from 'lucide-react';
import { useAppState } from '../../app/state/store';
import { saveSettings } from '../../services/settings/settings-storage-service';
import { setLanguage, t } from '../../services/i18n/i18n-service';
import type { Language, Theme } from '../../domain/settings/model';
import { WeblinkForm } from '../weblinks/WeblinkForm';
import { CategoryForm } from '../categories/CategoryForm';
import { ImportBookmarksAction } from '../import/ImportBookmarksAction';
import styles from './DashboardToolbar.module.css';

export function DashboardToolbar() {
  const { state, dispatch } = useAppState();
  const [showWeblinkForm, setShowWeblinkForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showImport, setShowImport] = useState(false);

  function toggleTheme() {
    const next: Theme = state.settings.theme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    const updated = { ...state.settings, theme: next };
    dispatch({ type: 'UPDATE_SETTINGS', payload: { theme: next } });
    saveSettings(updated);
  }

  function toggleLanguage() {
    const next: Language = state.settings.language === 'de' ? 'en' : 'de';
    setLanguage(next);
    const updated = { ...state.settings, language: next };
    dispatch({ type: 'UPDATE_SETTINGS', payload: { language: next } });
    saveSettings(updated);
  }

  function toggleCompact() {
    const next = !state.settings.compactMode;
    const updated = { ...state.settings, compactMode: next };
    dispatch({ type: 'UPDATE_SETTINGS', payload: { compactMode: next } });
    saveSettings(updated);
  }

  return (
    <>
      <header className={styles.toolbar} role="banner">
        <div className={styles.left}>
          <h1 className={styles.appTitle}>{t('app.title')}</h1>
        </div>
        <div className={styles.right}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setShowWeblinkForm(true)}
            aria-label={t('toolbar.addWeblink')}
            title={t('toolbar.addWeblink')}
          >
            <Plus size={16} />
            <span className={styles.btnLabel}>{t('toolbar.addWeblink')}</span>
          </button>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setShowCategoryForm(true)}
            aria-label={t('toolbar.addCategory')}
            title={t('toolbar.addCategory')}
          >
            <Plus size={16} />
            <span className={styles.btnLabel}>{t('toolbar.addCategory')}</span>
          </button>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setShowImport(true)}
            aria-label={t('toolbar.import')}
            title={t('toolbar.import')}
            data-testid="import-firefox-btn"
          >
            <Upload size={16} />
            <span className={styles.btnLabel}>{t('toolbar.import')}</span>
          </button>

          <div className={styles.divider} />

          <button
            type="button"
            className={`btn btn-ghost ${styles.iconBtn}`}
            onClick={toggleCompact}
            aria-label={t('toolbar.compactMode')}
            title={t('toolbar.compactMode')}
            aria-pressed={state.settings.compactMode}
          >
            <LayoutGrid size={18} />
          </button>

          <button
            type="button"
            className={`btn btn-ghost ${styles.iconBtn}`}
            onClick={toggleTheme}
            aria-label={
              state.settings.theme === 'light'
                ? t('toolbar.themeDark')
                : t('toolbar.themeLight')
            }
            title={
              state.settings.theme === 'light'
                ? t('toolbar.themeDark')
                : t('toolbar.themeLight')
            }
            data-testid="theme-toggle"
          >
            {state.settings.theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>

          <button
            type="button"
            className={`btn btn-ghost ${styles.langBtn}`}
            onClick={toggleLanguage}
            aria-label={t('toolbar.language')}
            title={t('toolbar.language')}
            data-testid="language-toggle"
          >
            <Languages size={16} />
            <span>{state.settings.language.toUpperCase()}</span>
          </button>
        </div>
      </header>

      {showWeblinkForm && <WeblinkForm onClose={() => setShowWeblinkForm(false)} />}
      {showCategoryForm && <CategoryForm onClose={() => setShowCategoryForm(false)} />}
      {showImport && <ImportBookmarksAction onClose={() => setShowImport(false)} />}
    </>
  );
}
