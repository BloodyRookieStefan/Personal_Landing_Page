// dialogs.js

// ─────────────────────────────────────────────────────────────────────────────
// Modal system
// ─────────────────────────────────────────────────────────────────────────────

let _cleanupFocusTrap = null;
let _previouslyFocused = null;
let _currentKeyHandler = null;

function getModalRoot() {
  return byId('modal-root');
}

/**
 * Open a modal dialog.
 * @param {{ title: string, body: HTMLElement, footer?: HTMLElement, onDismiss?: () => void }} config
 * @returns {{ close: () => void }}
 */
function openModal({ title, body, footer, onDismiss }) {
  closeModal(); // ensure no stacked modals

  _previouslyFocused = document.activeElement;

  const root = getModalRoot();
  root.setAttribute('aria-hidden', 'false');

  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.setAttribute('role', 'dialog');
  backdrop.setAttribute('aria-modal', 'true');
  backdrop.setAttribute('aria-label', title);

  const card = document.createElement('div');
  card.className = 'modal-card';

  // Header
  const header = document.createElement('div');
  header.className = 'modal-header';

  const titleEl = document.createElement('h2');
  titleEl.className   = 'modal-title';
  titleEl.textContent = title;
  header.appendChild(titleEl);

  const closeBtn = document.createElement('button');
  closeBtn.className = 'modal-close';
  closeBtn.type      = 'button';
  closeBtn.setAttribute('aria-label', t('form.cancel'));
  closeBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;

  // Idempotent dismiss: calls closeModal once and fires onDismiss once.
  // Used by all non-button dismissal paths (X button, backdrop, Escape).
  let _dismissed = false;
  const dismiss = () => {
    if (_dismissed) return;
    _dismissed = true;
    closeModal();
    if (typeof onDismiss === 'function') onDismiss();
  };

  closeBtn.addEventListener('click', dismiss);
  header.appendChild(closeBtn);

  card.appendChild(header);

  // Body
  const bodyWrapper = document.createElement('div');
  bodyWrapper.className = 'modal-body';
  bodyWrapper.appendChild(body);
  card.appendChild(bodyWrapper);

  // Footer (optional)
  if (footer) {
    const footerWrapper = document.createElement('div');
    footerWrapper.className = 'modal-footer';
    footerWrapper.appendChild(footer);
    card.appendChild(footerWrapper);
  }

  backdrop.appendChild(card);
  root.appendChild(backdrop);

  // Close on backdrop click
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) dismiss();
  });

  // Trap focus
  _cleanupFocusTrap = trapFocus(card);

  // Close on Escape – store the handler so closeModal() can always remove it
  const keyHandler = (e) => {
    if (e.key === 'Escape') {
      dismiss();
    }
  };
  _currentKeyHandler = keyHandler;
  document.addEventListener('keydown', keyHandler);

  return { close: closeModal };
}

function closeModal() {
  // Always remove the current Escape handler before clearing the modal DOM
  if (_currentKeyHandler) {
    document.removeEventListener('keydown', _currentKeyHandler);
    _currentKeyHandler = null;
  }

  const root = getModalRoot();
  while (root.firstChild) root.removeChild(root.firstChild);
  root.setAttribute('aria-hidden', 'true');

  if (_cleanupFocusTrap) {
    _cleanupFocusTrap();
    _cleanupFocusTrap = null;
  }

  if (_previouslyFocused && typeof _previouslyFocused.focus === 'function') {
    _previouslyFocused.focus();
    _previouslyFocused = null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Confirm dialog
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Show a confirm dialog. Returns a Promise<boolean>.
 */
function showConfirm(message) {
  return new Promise((resolve) => {
    const body = document.createElement('p');
    body.style.lineHeight = '1.6';
    body.style.color      = 'var(--color-text-muted)';
    body.style.fontSize   = '0.9rem';
    body.textContent      = message;

    const footer = document.createElement('div');
    footer.style.display = 'flex';
    footer.style.gap     = '8px';

    const cancelBtn = document.createElement('button');
    cancelBtn.className   = 'btn btn-secondary';
    cancelBtn.type        = 'button';
    cancelBtn.textContent = t('confirm.no');
    cancelBtn.addEventListener('click', () => {
      closeModal();
      resolve(false);
    });

    const confirmBtn = document.createElement('button');
    confirmBtn.className   = 'btn btn-danger';
    confirmBtn.type        = 'button';
    confirmBtn.textContent = t('confirm.yes');
    confirmBtn.addEventListener('click', () => {
      closeModal();
      resolve(true);
    });

    footer.appendChild(cancelBtn);
    footer.appendChild(confirmBtn);

    openModal({ title: t('dialog.confirmDelete'), body, footer, onDismiss: () => resolve(false) });
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Toast notifications
// ─────────────────────────────────────────────────────────────────────────────

const ICON_SVG = {
  success: `<svg class="toast-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>`,
  error:   `<svg class="toast-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
  info:    `<svg class="toast-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
};

/**
 * Show a toast notification.
 * @param {string} message - Text to display
 * @param {'success'|'error'|'info'} type
 * @param {number} duration - ms before auto-dismiss (default 3000)
 */
function showToast(message, type = 'success', duration = 3000) {
  const root = byId('toast-root');
  if (!root) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.setAttribute('role', 'status');
  toast.innerHTML  = ICON_SVG[type] || ICON_SVG.info;
  const text = document.createTextNode(message);
  toast.appendChild(text);

  root.appendChild(toast);

  const dismiss = () => {
    toast.classList.add('toast-out');
    toast.addEventListener('animationend', () => toast.remove(), { once: true });
    // Fallback removal if animation doesn't fire
    setTimeout(() => toast.remove(), 300);
  };

  setTimeout(dismiss, duration);
}

// ─────────────────────────────────────────────────────────────────────────────
// Icon picker control
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build an icon picker control and return its container element.
 * @param {string} selectedIcon - currently selected icon key
 * @param {(iconKey: string) => void} onChange - called when selection changes
 */
function buildIconPicker(selectedIcon, onChange) {
  const wrapper = document.createElement('div');

  // Preview row
  const preview = document.createElement('div');
  preview.className = 'icon-preview';
  preview.innerHTML = getIcon(selectedIcon);
  const previewLabel = document.createElement('span');
  previewLabel.textContent = ICON_LABELS[selectedIcon] || selectedIcon;
  preview.appendChild(previewLabel);
  wrapper.appendChild(preview);

  // Grid
  const grid = document.createElement('div');
  grid.className = 'icon-picker';
  grid.setAttribute('role', 'listbox');
  grid.setAttribute('aria-label', t('form.selectIcon'));

  let currentSelected = selectedIcon;

  for (const key of ICON_KEYS) {
    const item = document.createElement('button');
    item.className = 'icon-picker-item' + (key === selectedIcon ? ' selected' : '');
    item.type      = 'button';
    item.setAttribute('role',        'option');
    item.setAttribute('aria-selected', String(key === selectedIcon));
    item.setAttribute('title',       ICON_LABELS[key] || key);
    item.innerHTML = getIcon(key);
    item.dataset.iconKey = key;

    item.addEventListener('click', () => {
      // Update selection
      grid.querySelectorAll('.icon-picker-item').forEach(el => {
        el.classList.remove('selected');
        el.setAttribute('aria-selected', 'false');
      });
      item.classList.add('selected');
      item.setAttribute('aria-selected', 'true');
      currentSelected = key;

      // Update preview
      preview.innerHTML = getIcon(key);
      const lbl = document.createElement('span');
      lbl.textContent = ICON_LABELS[key] || key;
      preview.appendChild(lbl);

      onChange(key);
    });

    grid.appendChild(item);
  }

  wrapper.appendChild(grid);
  return wrapper;
}
