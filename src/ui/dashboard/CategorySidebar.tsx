import React, { useState } from 'react';
import { Trash2, Lock } from 'lucide-react';
import { useAppState } from '../../app/state/store';
import { t } from '../../services/i18n/i18n-service';
import { isDefaultCategory, CATEGORY_NOT_DEFINED_ID } from '../../domain/categories/defaults';
import { IconDisplay } from '../shared/icons/IconDisplay';
import { DeleteCategoryDialog } from '../categories/DeleteCategoryDialog';
import {
  getStoredFileHandle,
  writeFileHandle,
  downloadJsonFallback,
} from '../../services/storage/file-storage-service';
import { saveSyncFingerprint } from '../../services/storage/sync-service';
import styles from './CategorySidebar.module.css';

export function CategorySidebar() {
  const { state, dispatch } = useAppState();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const allCount = state.weblinks.length;

  function getCategoryCount(categoryId: string) {
    return state.weblinks.filter(w => w.categoryId === categoryId).length;
  }

  const deletingCategory = deletingId
    ? state.categories.find(c => c.id === deletingId)
    : null;

  return (
    <>
      <nav
        className={styles.sidebar}
        aria-label={t('categories.title')}
        data-testid="category-sidebar"
      >
        <div className={styles.sectionTitle}>{t('categories.title')}</div>

        <ul className={styles.list} role="list">
          <li>
            <button
              type="button"
              className={`${styles.item} ${state.selectedCategoryId === null ? styles.active : ''}`}
              onClick={() => dispatch({ type: 'SELECT_CATEGORY', payload: null })}
              aria-current={state.selectedCategoryId === null ? 'page' : undefined}
            >
              <span className={styles.itemContent}>
                <span className={styles.itemName}>{t('categories.all')}</span>
                <span className={styles.count}>{allCount}</span>
              </span>
            </button>
          </li>

          {state.categories.map(cat => (
            <li key={cat.id}>
              <button
                type="button"
                className={`${styles.item} ${state.selectedCategoryId === cat.id ? styles.active : ''}`}
                onClick={() => dispatch({ type: 'SELECT_CATEGORY', payload: cat.id })}
                aria-current={state.selectedCategoryId === cat.id ? 'page' : undefined}
              >
                <span className={styles.itemContent}>
                  <span className={styles.iconWrap}>
                    <IconDisplay iconId={cat.icon} size={15} />
                  </span>
                  <span className={styles.itemName}>{cat.name}</span>
                  <span className={styles.count}>{getCategoryCount(cat.id)}</span>
                </span>
                {!isDefaultCategory(cat.id) && (
                  <button
                    type="button"
                    className={styles.deleteBtn}
                    aria-label={`${t('categories.delete')} ${cat.name}`}
                    onClick={e => {
                      e.stopPropagation();
                      setDeletingId(cat.id);
                    }}
                  >
                    <Trash2 size={13} />
                  </button>
                )}
                {isDefaultCategory(cat.id) && (
                  <span className={styles.lockIcon} title={t('categories.reserved')}>
                    <Lock size={11} />
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {deletingCategory && (
        <DeleteCategoryDialog
          category={deletingCategory}
          onClose={() => setDeletingId(null)}
          onConfirm={async () => {
            const updatedCategories = state.categories.filter(c => c.id !== deletingCategory.id);
            const updatedWeblinks = state.weblinks.map(w =>
              w.categoryId === deletingCategory.id ? { ...w, categoryId: CATEGORY_NOT_DEFINED_ID } : w
            );
            dispatch({
              type: 'DELETE_CATEGORY',
              payload: { categoryId: deletingCategory.id, fallbackCategoryId: CATEGORY_NOT_DEFINED_ID },
            });
            setDeletingId(null);
            try {
              const handle = await getStoredFileHandle();
              const updatedData = {
                version: 1 as const,
                weblinks: updatedWeblinks,
                categories: updatedCategories,
              };
              if (handle) {
                const fingerprint = await writeFileHandle(handle, updatedData);
                saveSyncFingerprint(fingerprint);
              } else if (state.storageStatus === 'fallback') {
                downloadJsonFallback(updatedData);
              }
            } catch {
              // Non-fatal: in-memory state already updated.
            }
          }}
        />
      )}
    </>
  );
}
