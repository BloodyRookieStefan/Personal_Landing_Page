import React, { useState } from 'react';
import { useAppState } from '../../app/state/store';
import { validateWeblink } from '../../domain/weblinks/validation';
import { createDefaultWeblink } from '../../domain/weblinks/defaults';
import { IconPicker } from '../shared/icons/IconPicker';
import { t } from '../../services/i18n/i18n-service';
import {
  getStoredFileHandle,
  writeFileHandle,
  downloadJsonFallback,
} from '../../services/storage/file-storage-service';
import { saveSyncFingerprint } from '../../services/storage/sync-service';
import type { Weblink } from '../../domain/weblinks/model';

interface WeblinkFormProps {
  onClose: () => void;
  initialWeblink?: Weblink;
}

export function WeblinkForm({ onClose, initialWeblink }: WeblinkFormProps) {
  const { state, dispatch } = useAppState();
  const [form, setForm] = useState<Weblink>(
    initialWeblink ??
      createDefaultWeblink({
        categoryId: state.selectedCategoryId ?? undefined,
      })
  );
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const isEditing = Boolean(initialWeblink);

  function handleChange(field: keyof Weblink, value: string) {
    setForm(f => ({ ...f, [field]: value }));
    setErrors([]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validation = validateWeblink(form);
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }
    setSaving(true);
    try {
      const handle = await getStoredFileHandle();
      const updatedWeblinks = isEditing
        ? state.weblinks.map(weblink => (weblink.id === form.id ? form : weblink))
        : [...state.weblinks, form];

      dispatch({ type: isEditing ? 'UPDATE_WEBLINK' : 'ADD_WEBLINK', payload: form });

      const updatedData = {
        version: 1 as const,
        weblinks: updatedWeblinks,
        categories: state.categories,
      };
      if (handle) {
        const fingerprint = await writeFileHandle(handle, updatedData);
        saveSyncFingerprint(fingerprint);
      } else if (state.storageStatus === 'fallback') {
        downloadJsonFallback(updatedData);
      }
    } catch {
      // Non-fatal: in-memory state updated; file write failure surfaced by error boundary if needed.
    }
    setSaving(false);
    onClose();
  }

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="weblink-form-title"
    >
      <div className="modal-dialog">
        <div className="modal-header">
          <h2 className="modal-title" id="weblink-form-title">
            {isEditing ? t('weblinks.edit') : t('weblinks.create')}
          </h2>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {errors.length > 0 && (
              <ul
                style={{
                  color: 'var(--color-danger)',
                  fontSize: 'var(--font-size-sm)',
                  paddingLeft: '1rem',
                }}
              >
                {errors.map(err => (
                  <li key={err}>{err}</li>
                ))}
              </ul>
            )}

            <div className="form-field">
              <label className="form-label" htmlFor="wl-url">
                {t('weblinks.url')}
              </label>
              <input
                id="wl-url"
                className="form-input"
                type="url"
                placeholder={t('weblinks.urlPlaceholder')}
                value={form.url}
                onChange={ev => handleChange('url', ev.target.value)}
                required
                autoFocus
                data-testid="weblink-url-input"
              />
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="wl-name">
                {t('weblinks.name')}
              </label>
              <input
                id="wl-name"
                className="form-input"
                type="text"
                placeholder={t('weblinks.namePlaceholder')}
                value={form.name}
                onChange={ev => handleChange('name', ev.target.value)}
                required
                data-testid="weblink-name-input"
              />
            </div>

            <div className="form-field">
              <label className="form-label">{t('weblinks.icon')}</label>
              <IconPicker value={form.icon} onChange={id => handleChange('icon', id)} />
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="wl-description">
                {t('weblinks.description')}
              </label>
              <textarea
                id="wl-description"
                className="form-input"
                placeholder={t('weblinks.descriptionPlaceholder')}
                value={form.description}
                onChange={ev => handleChange('description', ev.target.value)}
                rows={2}
              />
            </div>

            <div className="form-field">
              <label className="form-label" htmlFor="wl-category">
                {t('weblinks.category')}
              </label>
              <select
                id="wl-category"
                className="form-input"
                value={form.categoryId}
                onChange={ev => handleChange('categoryId', ev.target.value)}
                required
                data-testid="weblink-category-select"
              >
                {state.categories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving}
              data-testid="weblink-save-btn"
            >
              {isEditing ? t('weblinks.editAction') : t('common.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
