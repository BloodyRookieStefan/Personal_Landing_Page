import React, { useMemo, useState } from 'react';
import { MoreHorizontal, Pencil } from 'lucide-react';
import { useAppState } from '../../app/state/store';
import { t } from '../../services/i18n/i18n-service';
import { IconDisplay } from '../shared/icons/IconDisplay';
import { WeblinkForm } from '../weblinks/WeblinkForm';
import type { Weblink } from '../../domain/weblinks/model';
import styles from './WeblinkGrid.module.css';

export function WeblinkGrid() {
  const { state } = useAppState();
  const { weblinks, categories, selectedCategoryId, settings } = state;
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [editingWeblinkId, setEditingWeblinkId] = useState<string | null>(null);

  const filtered =
    selectedCategoryId === null
      ? weblinks
      : weblinks.filter(w => w.categoryId === selectedCategoryId);

  const editingWeblink = useMemo(
    () => weblinks.find(weblink => weblink.id === editingWeblinkId) ?? null,
    [editingWeblinkId, weblinks]
  );

  function getCategoryName(categoryId: string): string {
    const cat = categories.find(c => c.id === categoryId);
    return cat?.name ?? '';
  }

  function openEditDialog(weblink: Weblink) {
    setOpenMenuId(null);
    setEditingWeblinkId(weblink.id);
  }

  const isEmpty = filtered.length === 0;

  return (
    <>
      <section className={styles.section} aria-label={t('weblinks.title')}>
        {isEmpty ? (
          <div className={styles.empty} data-testid="weblinks-empty">
            {selectedCategoryId === null
              ? t('weblinks.empty')
              : t('weblinks.emptyCategory')}
          </div>
        ) : (
          <ul
            className={styles.grid}
            data-compact={settings.compactMode ? 'true' : 'false'}
            data-testid="weblink-grid"
            role="list"
          >
            {filtered.map(weblink => (
              <li key={weblink.id} className={styles.listItem}>
                <article className={styles.tile} data-testid={`weblink-tile-${weblink.id}`}>
                  <div className={styles.tileHeader}>
                    <a
                      href={weblink.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.tileLink}
                      title={weblink.url}
                    >
                      <span className={styles.tileIcon}>
                        <IconDisplay iconId={weblink.icon} size={24} />
                      </span>
                      <span className={styles.tileName}>{weblink.name}</span>
                    </a>

                    <div className={styles.actions}>
                      <button
                        type="button"
                        className={styles.menuButton}
                        aria-label={t('weblinks.actions')}
                        aria-expanded={openMenuId === weblink.id}
                        onClick={() =>
                          setOpenMenuId(current => (current === weblink.id ? null : weblink.id))
                        }
                        data-testid={`weblink-menu-button-${weblink.id}`}
                      >
                        <MoreHorizontal size={18} />
                      </button>

                      {openMenuId === weblink.id && (
                        <div className={styles.menu} role="menu">
                          <button
                            type="button"
                            className={styles.menuItem}
                            role="menuitem"
                            onClick={() => openEditDialog(weblink)}
                            data-testid={`weblink-edit-button-${weblink.id}`}
                          >
                            <Pencil size={14} />
                            <span>{t('weblinks.editAction')}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <span className={styles.tileCategory}>{getCategoryName(weblink.categoryId)}</span>
                  {weblink.description && (
                    <span className={styles.tileDescription}>{weblink.description}</span>
                  )}
                </article>
              </li>
            ))}
          </ul>
        )}
      </section>

      {editingWeblink && (
        <WeblinkForm
          initialWeblink={editingWeblink}
          onClose={() => {
            setEditingWeblinkId(null);
            setOpenMenuId(null);
          }}
        />
      )}
    </>
  );
}
