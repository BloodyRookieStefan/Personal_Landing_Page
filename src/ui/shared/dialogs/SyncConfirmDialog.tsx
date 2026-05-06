import React from 'react';
import { useAppState } from '../../../app/state/store';
import {
  getStoredFileHandle,
  writeFileHandle,
} from '../../../services/storage/file-storage-service';
import { saveSyncFingerprint } from '../../../services/storage/sync-service';
import { t } from '../../../services/i18n/i18n-service';

export function SyncConfirmDialog() {
  const { state, dispatch } = useAppState();

  if (!state.syncPrompt) return null;

  async function handleConfirm() {
    if (!state.syncPrompt) return;
    const { incomingData } = state.syncPrompt;

    dispatch({
      type: 'SYNC_ACCEPT',
      payload: {
        weblinks: incomingData.weblinks,
        categories: incomingData.categories,
      },
    });

    const handle = await getStoredFileHandle();
    if (handle) {
      try {
        const fingerprint = await writeFileHandle(handle, incomingData);
        saveSyncFingerprint(fingerprint);
      } catch {
        // Non-fatal: sync prompt dismissed, fingerprint update failed
      }
    }
  }

  function handleDecline() {
    dispatch({ type: 'SET_SYNC_PROMPT', payload: null });
  }

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sync-dialog-title"
    >
      <div className="modal-dialog">
        <div className="modal-header">
          <h2 className="modal-title" id="sync-dialog-title">
            {t('sync.changed')}
          </h2>
        </div>
        <div className="modal-body">
          <p style={{ color: 'var(--color-text-secondary)' }}>{t('sync.message')}</p>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={handleDecline}>
            {t('sync.decline')}
          </button>
          <button type="button" className="btn btn-primary" onClick={handleConfirm}>
            {t('sync.confirm')}
          </button>
        </div>
      </div>
    </div>
  );
}
