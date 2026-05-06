import React, { useState } from 'react';
import { useAppState } from '../../app/state/store';
import { validateCategory } from '../../domain/categories/validation';
import { IconPicker } from '../shared/icons/IconPicker';
import { t } from '../../services/i18n/i18n-service';
import {
  getStoredFileHandle,
  writeFileHandle,
  downloadJsonFallback,
} from '../../services/storage/file-storage-service';
import { saveSyncFingerprint } from '../../services/storage/sync-service';
import type { Category } from '../../domain/categories/model';

interface CategoryFormProps {
  onClose: () => void;
}

export function CategoryForm({ onClose }: CategoryFormProps) {
  const { state, dispatch } = useAppState();
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('folder');
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const partial: Partial<Category> = { name: name.trim(), icon };
    const validation = validateCategory(partial, state.categories);
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }
    const newCategory: Category = {
      id: crypto.randomUUID(),
      name: name.trim(),
      icon,
      isDefault: false,
    };
    setSaving(true);
    dispatch({ type: 'ADD_CATEGORY', payload: newCategory });
    try {
      const handle = await getStoredFileHandle();
      const updatedData = {
        version: 1 as const,
        weblinks: state.weblinks,
        categories: [...state.categories, newCategory],
      };
      if (handle) {
        const fingerprint = await writeFileHandle(handle, updatedData);
        saveSyncFingerprint(fingerprint);
      } else if (state.storageStatus === 'fallback') {
        downloadJsonFallback(updatedData);
      }
    } catch {
      // Non-fatal: in-memory state updated; file write failure is non-blocking.
    }
    setSaving(false);
    onClose();
  }

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="category-form-title"
    >
      <div className="modal-dialog">
        <div className="modal-header">
          <h2 className="modal-title" id="category-form-title">
            {t('categories.create')}
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
              <label className="form-label" htmlFor="cat-name">
                {t('categories.name')}
              </label>
              <input
                id="cat-name"
                className="form-input"
                type="text"
                placeholder={t('categories.namePlaceholder')}
                value={name}
                onChange={ev => {
                  setName(ev.target.value);
                  setErrors([]);
                }}
                required
                autoFocus
                data-testid="category-name-input"
              />
            </div>

            <div className="form-field">
              <label className="form-label">{t('categories.icon')}</label>
              <IconPicker value={icon} onChange={setIcon} />
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
              data-testid="category-save-btn"
            >
              {t('common.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
