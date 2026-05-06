import type { Dispatch } from 'react';
import type { AppAction } from '../state/store';
import { loadSettings } from '../../services/settings/settings-storage-service';
import { ensureDefaultCategories } from '../../domain/categories/defaults';
import { setLanguage } from '../../services/i18n/i18n-service';
import {
  getStoredFileHandle,
  verifyPermission,
  readFileHandle,
  isFileSystemAccessSupported,
} from '../../services/storage/file-storage-service';
import {
  loadSyncFingerprint,
  saveSyncFingerprint,
  hasFileChanged,
} from '../../services/storage/sync-service';

export async function bootstrapApp(dispatch: Dispatch<AppAction>): Promise<void> {
  const settings = loadSettings();
  setLanguage(settings.language);
  document.documentElement.setAttribute('data-theme', settings.theme);

  if (!isFileSystemAccessSupported()) {
    dispatch({
      type: 'INIT',
      payload: {
        weblinks: [],
        categories: ensureDefaultCategories([]),
        settings,
        storageStatus: 'fallback',
      },
    });
    return;
  }

  const storedHandle = await getStoredFileHandle();
  if (!storedHandle) {
    dispatch({
      type: 'INIT',
      payload: {
        weblinks: [],
        categories: ensureDefaultCategories([]),
        settings,
        storageStatus: 'setup-required',
      },
    });
    return;
  }

  const hasPermission = await verifyPermission(storedHandle);
  if (!hasPermission) {
    dispatch({
      type: 'INIT',
      payload: {
        weblinks: [],
        categories: ensureDefaultCategories([]),
        settings,
        storageStatus: 'setup-required',
      },
    });
    return;
  }

  try {
    const { data, fingerprint } = await readFileHandle(storedHandle);
    const storedFingerprint = loadSyncFingerprint();
    const normalizedCategories = ensureDefaultCategories(data.categories);

    if (hasFileChanged(fingerprint, storedFingerprint)) {
      // Do NOT load incoming file data into state before the user confirms.
      // Dispatch INIT with empty/default state so that declining the sync
      // prompt leaves the in-memory state unchanged (REQ-003 AC-6).
      dispatch({
        type: 'INIT',
        payload: {
          weblinks: [],
          categories: ensureDefaultCategories([]),
          settings,
          storageStatus: 'ready',
        },
      });
      dispatch({
        type: 'SET_SYNC_PROMPT',
        payload: { incomingData: { ...data, categories: normalizedCategories } },
      });
    } else {
      saveSyncFingerprint(fingerprint);
      dispatch({
        type: 'INIT',
        payload: {
          weblinks: data.weblinks,
          categories: normalizedCategories,
          settings,
          storageStatus: 'ready',
        },
      });
    }
  } catch (err) {
    dispatch({
      type: 'INIT',
      payload: {
        weblinks: [],
        categories: ensureDefaultCategories([]),
        settings,
        storageStatus: 'error',
      },
    });
    dispatch({
      type: 'SET_STORAGE_STATUS',
      payload: {
        status: 'error',
        error: err instanceof Error ? err.message : 'Unknown error reading storage file',
      },
    });
  }
}
