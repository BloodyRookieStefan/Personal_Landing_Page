import React, { useState, useRef } from 'react';
import { useAppState } from '../../app/state/store';
import {
  importFirefoxBookmarks,
  readFileAsText,
} from '../../services/import/firefox-import-service';
import { t } from '../../services/i18n/i18n-service';
import {
  getStoredFileHandle,
  writeFileHandle,
  downloadJsonFallback,
} from '../../services/storage/file-storage-service';
import { saveSyncFingerprint } from '../../services/storage/sync-service';

interface ImportBookmarksActionProps {
  onClose: () => void;
}

export function ImportBookmarksAction({ onClose }: ImportBookmarksActionProps) {
  const { state, dispatch } = useAppState();
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [resultMessage, setResultMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatus('loading');
    try {
      const html = await readFileAsText(file);
      const { weblinks, result } = importFirefoxBookmarks(html);

      if (weblinks.length === 0 && result.failed === 0) {
        setResultMessage(t('import.noBookmarks'));
        setStatus('done');
        return;
      }

      if (weblinks.length > 0) {
        dispatch({ type: 'ADD_WEBLINKS', payload: weblinks });
        try {
          const handle = await getStoredFileHandle();
          const updatedData = {
            version: 1 as const,
            weblinks: [...state.weblinks, ...weblinks],
            categories: state.categories,
          };
          if (handle) {
            const fingerprint = await writeFileHandle(handle, updatedData);
            saveSyncFingerprint(fingerprint);
          } else if (state.storageStatus === 'fallback') {
            downloadJsonFallback(updatedData);
          }
        } catch {
          // Non-fatal: state updated; file write failure is non-blocking.
        }
      }

      const parts: string[] = [];
      if (result.imported > 0) {
        parts.push(t('import.success', { count: result.imported }));
      }
      if (result.failed > 0) {
        parts.push(t('import.failed', { count: result.failed }));
      }
      setResultMessage(parts.join(' · '));
      setStatus('done');
    } catch {
      setResultMessage(t('import.error'));
      setStatus('error');
    }
  }

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="import-dialog-title"
    >
      <div className="modal-dialog">
        <div className="modal-header">
          <h2 className="modal-title" id="import-dialog-title">
            {t('import.title')}
          </h2>
        </div>
        <div className="modal-body">
          <p style={{ color: 'var(--color-text-secondary)' }}>{t('import.description')}</p>

          {status === 'idle' && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept=".html"
                style={{ display: 'none' }}
                onChange={handleFileChange}
                data-testid="import-file-input"
              />
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => fileInputRef.current?.click()}
                data-testid="import-select-file-btn"
              >
                {t('import.button')}
              </button>
            </>
          )}

          {status === 'loading' && (
            <p style={{ color: 'var(--color-text-secondary)' }}>{t('common.loading')}</p>
          )}

          {(status === 'done' || status === 'error') && (
            <p
              style={{
                color:
                  status === 'error' ? 'var(--color-danger)' : 'var(--color-success)',
              }}
              data-testid="import-result"
            >
              {resultMessage}
            </p>
          )}
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  );
}
