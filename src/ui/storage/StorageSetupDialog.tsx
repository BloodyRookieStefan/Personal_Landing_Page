import React, { useState } from 'react';
import { useAppState } from '../../app/state/store';
import {
  requestNewFileHandle,
  openExistingFileHandle,
  storeFileHandle,
  readFileHandle,
  isFileSystemAccessSupported,
} from '../../services/storage/file-storage-service';
import { ensureDefaultCategories } from '../../domain/categories/defaults';
import { saveSyncFingerprint } from '../../services/storage/sync-service';
import { createEmptyStorageData } from '../../services/storage/serializers';
import { t } from '../../services/i18n/i18n-service';
import { FolderOpen, FilePlus, AlertCircle } from 'lucide-react';
import styles from './StorageSetupDialog.module.css';

export function StorageSetupDialog() {
  const { dispatch } = useAppState();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleNewFile() {
    setLoading(true);
    setError(null);
    try {
      const handle = await requestNewFileHandle();
      if (!handle) {
        setLoading(false);
        return;
      }
      const { writeFileHandle } = await import('../../services/storage/file-storage-service');
      const emptyData = createEmptyStorageData();
      const fingerprint = await writeFileHandle(handle, emptyData);
      await storeFileHandle(handle);
      saveSyncFingerprint(fingerprint);
      dispatch({
        type: 'SET_STORAGE_STATUS',
        payload: { status: 'ready' },
      });
      dispatch({
        type: 'INIT',
        payload: {
          weblinks: [],
          categories: ensureDefaultCategories([]),
          settings: (await import('../../services/settings/settings-storage-service')).loadSettings(),
          storageStatus: 'ready',
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create file');
    } finally {
      setLoading(false);
    }
  }

  async function handleOpenFile() {
    setLoading(true);
    setError(null);
    try {
      const handle = await openExistingFileHandle();
      if (!handle) {
        setLoading(false);
        return;
      }
      const { data, fingerprint } = await readFileHandle(handle);
      await storeFileHandle(handle);
      saveSyncFingerprint(fingerprint);
      const { loadSettings } = await import('../../services/settings/settings-storage-service');
      dispatch({
        type: 'INIT',
        payload: {
          weblinks: data.weblinks,
          categories: ensureDefaultCategories(data.categories),
          settings: loadSettings(),
          storageStatus: 'ready',
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to open file');
    } finally {
      setLoading(false);
    }
  }

  async function handleFallback() {
    const { loadSettings } = await import('../../services/settings/settings-storage-service');
    dispatch({
      type: 'INIT',
      payload: {
        weblinks: [],
        categories: ensureDefaultCategories([]),
        settings: loadSettings(),
        storageStatus: 'fallback',
      },
    });
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>{t('storage.setupTitle')}</h1>
        <p className={styles.description}>{t('storage.setupDescription')}</p>

        {error && (
          <div className={styles.error}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {isFileSystemAccessSupported() ? (
          <div className={styles.actions}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleNewFile}
              disabled={loading}
            >
              <FilePlus size={18} />
              {t('storage.newFile')}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleOpenFile}
              disabled={loading}
            >
              <FolderOpen size={18} />
              {t('storage.openFile')}
            </button>
          </div>
        ) : (
          <div className={styles.fallbackSection}>
            <p className={styles.fallbackDescription}>{t('storage.fallbackDescription')}</p>
          </div>
        )}

        <button
          type="button"
          className={styles.fallbackLink}
          onClick={handleFallback}
          disabled={loading}
        >
          {t('storage.useFallback')}
        </button>
      </div>
    </div>
  );
}
