// sync-prompt.js

// ─────────────────────────────────────────────────────────────────────────────
// Sync-change detection
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Compare currentHash against the stored last-sync hash and act accordingly:
 * - No stored hash, hash matches, or different file identity: load freshData silently (no dialog).
 * - Same file identity and hash differs: show a confirmation dialog before importing the updated data.
 *
 * Callers are responsible for re-rendering after this resolves.
 *
 * @param {string} currentHash       – canonical hash of the file just read
 * @param {object} freshData         – normalizeData(parsed) from the file
 * @param {object} [options]
 * @param {boolean} [options.isSameFile=true] – false when a different file identity is detected;
 *   skips hash comparison and loads silently so the new file establishes its own baseline.
 */
async function checkAndPromptSync(currentHash, freshData, options = {}) {
  const { isSameFile = true } = options;
  const storedHash = getStoredSyncHash();

  // Silent reopen: first load, file content unchanged, or a different file was selected
  if (!isSameFile || !storedHash || currentHash === storedHash) {
    state.categories = freshData.categories;
    state.weblinks   = freshData.weblinks;
    storeLastSyncHash(currentHash);
    return;
  }

  // File content has changed: ask the user before importing
  const confirmed = await showSyncPrompt();

  if (confirmed) {
    state.categories = freshData.categories;
    state.weblinks   = freshData.weblinks;
    storeLastSyncHash(currentHash);
    showToast(t('sync.confirm'), 'info');
  }
  // On decline: do NOT update hash so the next load prompts again
}

// ─────────────────────────────────────────────────────────────────────────────
// Sync prompt dialog
// ─────────────────────────────────────────────────────────────────────────────

function showSyncPrompt() {
  return new Promise((resolve) => {
    const body = document.createElement('p');
    body.style.lineHeight = '1.6';
    body.style.color      = 'var(--color-text-muted)';
    body.style.fontSize   = '0.9rem';
    body.textContent      = t('sync.message');

    const footer = document.createElement('div');
    footer.style.display = 'flex';
    footer.style.gap     = '8px';

    const keepBtn = document.createElement('button');
    keepBtn.className   = 'btn btn-secondary';
    keepBtn.type        = 'button';
    keepBtn.textContent = t('sync.cancel');
    keepBtn.addEventListener('click', () => {
      closeModal();
      resolve(false);
    });

    const importBtn = document.createElement('button');
    importBtn.className   = 'btn btn-primary';
    importBtn.type        = 'button';
    importBtn.textContent = t('sync.confirm');
    importBtn.addEventListener('click', () => {
      closeModal();
      resolve(true);
    });

    footer.appendChild(keepBtn);
    footer.appendChild(importBtn);

    openModal({ title: t('sync.title'), body, footer, onDismiss: () => resolve(false) });
  });
}
