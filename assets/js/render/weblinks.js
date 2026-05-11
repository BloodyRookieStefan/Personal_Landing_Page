import { state, togglePinWeblink, isPinned } from '../state.js';
import { t } from '../i18n.js';
import { getIcon } from '../icons.js';
import { findCategory, getCategoryLabel } from '../schema.js';
import { byId, clearChildren } from '../utils/dom.js';
import { PINNED_CATEGORY_ID } from '../config.js';

// Callbacks set by app.js
let _onEditWeblink     = null;
let _onOpenUrl         = null;
let _onPinToggle       = null;

export function setWeblinkCallbacks({ onEditWeblink, onPinToggle }) {
  _onEditWeblink = onEditWeblink;
  _onPinToggle   = onPinToggle || null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Render
// ─────────────────────────────────────────────────────────────────────────────

export function renderWeblinks() {
  const area = byId('weblink-area');
  if (!area) return;
  clearChildren(area);

  // Filter by selected category
  const isPinnedView = state.selectedCategory === PINNED_CATEGORY_ID;
  const byCategory = state.selectedCategory === null
    ? state.weblinks
    : isPinnedView
      ? state.weblinks.filter(w => isPinned(w.id))
      : state.weblinks.filter(w => w.category === state.selectedCategory);

  // Filter by search query
  const query = state.searchQuery.trim().toLowerCase();
  const filtered = query
    ? byCategory.filter(w =>
        w.name.toLowerCase().includes(query) ||
        w.url.toLowerCase().includes(query) ||
        (w.description || '').toLowerCase().includes(query)
      )
    : byCategory;

  if (state.weblinks.length === 0) {
    area.appendChild(buildEmptyState('empty'));
    return;
  }

  if (filtered.length === 0) {
    area.appendChild(buildEmptyState(isPinnedView && !query ? 'pinned' : 'filtered'));
    return;
  }

  // Pinned weblinks sort before unpinned within the current filtered result
  const sorted = [...filtered].sort((a, b) => {
    const pa = isPinned(a.id) ? 0 : 1;
    const pb = isPinned(b.id) ? 0 : 1;
    return pa - pb;
  });

  if (state.settings.compactMode) {
    renderCompact(area, sorted);
  } else {
    renderGrid(area, sorted);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Grid (normal) mode
// ─────────────────────────────────────────────────────────────────────────────

function renderGrid(container, weblinks) {
  const grid = document.createElement('div');
  grid.className = 'weblink-grid';

  for (const wl of weblinks) {
    grid.appendChild(buildCard(wl));
  }

  container.appendChild(grid);
}

function buildCard(wl) {
  const card = document.createElement('div');
  const pinned = isPinned(wl.id);
  card.className = 'weblink-card' + (pinned ? ' weblink-card--pinned' : '');
  card.setAttribute('tabindex', '0');
  card.setAttribute('role', 'link');
  card.setAttribute('aria-label', wl.name);
  card.dataset.weblinkId = wl.id;

  // Header row: icon + meta + ellipsis
  const header = document.createElement('div');
  header.className = 'weblink-card-header';

  // Icon
  const iconBox = document.createElement('div');
  iconBox.className = 'weblink-card-icon';
  iconBox.innerHTML = getIcon(wl.icon);
  header.appendChild(iconBox);

  // Meta: name + category
  const meta = document.createElement('div');
  meta.className = 'weblink-card-meta';

  const nameEl = document.createElement('div');
  nameEl.className   = 'weblink-card-name';
  nameEl.textContent = wl.name;
  meta.appendChild(nameEl);

  const cat = findCategory(state.categories, wl.category);
  if (cat) {
    const catEl = document.createElement('span');
    catEl.className   = 'weblink-card-category';
    catEl.textContent = getCategoryLabel(cat, t);
    meta.appendChild(catEl);
  }

  header.appendChild(meta);
  card.appendChild(header);

  // Description (only if present)
  if (wl.description) {
    const desc = document.createElement('div');
    desc.className   = 'weblink-card-description';
    desc.textContent = wl.description;
    card.appendChild(desc);
  }

  // Ellipsis button
  const actions = document.createElement('div');
  actions.className = 'weblink-card-actions';
  const ellipsis = buildEllipsisBtn('btn-ellipsis', wl.id);
  actions.appendChild(ellipsis);
  card.appendChild(actions);

  // Click: navigate to URL (not on ellipsis)
  card.addEventListener('click', (e) => {
    if (e.target.closest('.weblink-card-actions')) return;
    window.open(wl.url, '_blank', 'noopener,noreferrer');
  });

  card.addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && !e.target.closest('.weblink-card-actions')) {
      e.preventDefault();
      window.open(wl.url, '_blank', 'noopener,noreferrer');
    }
  });

  return card;
}

// ─────────────────────────────────────────────────────────────────────────────
// Compact mode
// ─────────────────────────────────────────────────────────────────────────────

function renderCompact(container, weblinks) {
  const wrap = document.createElement('div');
  wrap.className = 'weblink-compact';

  for (const wl of weblinks) {
    wrap.appendChild(buildRow(wl));
  }

  container.appendChild(wrap);
}

function buildRow(wl) {
  const row = document.createElement('div');
  const pinned = isPinned(wl.id);
  row.className = 'weblink-row' + (pinned ? ' weblink-row--pinned' : '');
  row.setAttribute('tabindex', '0');
  row.setAttribute('role', 'link');
  row.setAttribute('aria-label', wl.name);
  row.dataset.weblinkId = wl.id;

  // Icon
  const iconBox = document.createElement('span');
  iconBox.className = 'weblink-row-icon';
  iconBox.innerHTML = getIcon(wl.icon);
  row.appendChild(iconBox);

  // Name
  const nameEl = document.createElement('span');
  nameEl.className   = 'weblink-row-name';
  nameEl.textContent = wl.name;
  row.appendChild(nameEl);

  // Category
  const cat = findCategory(state.categories, wl.category);
  if (cat) {
    const catEl = document.createElement('span');
    catEl.className   = 'weblink-row-cat';
    catEl.textContent = getCategoryLabel(cat, t);
    row.appendChild(catEl);
  }

  // Description (only if present)
  if (wl.description) {
    const descEl = document.createElement('span');
    descEl.className   = 'weblink-row-description';
    descEl.textContent = wl.description;
    row.appendChild(descEl);
  }

  // Ellipsis
  const actWrap = document.createElement('span');
  actWrap.className = 'weblink-row-actions';
  const ellipsis = buildEllipsisBtn('btn-row-ellipsis', wl.id);
  actWrap.appendChild(ellipsis);
  row.appendChild(actWrap);

  // Click: navigate
  row.addEventListener('click', (e) => {
    if (e.target.closest('.weblink-row-actions')) return;
    window.open(wl.url, '_blank', 'noopener,noreferrer');
  });

  row.addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && !e.target.closest('.weblink-row-actions')) {
      e.preventDefault();
      window.open(wl.url, '_blank', 'noopener,noreferrer');
    }
  });

  return row;
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared ellipsis button
// ─────────────────────────────────────────────────────────────────────────────

function buildEllipsisBtn(className, weblinkId) {
  const btn = document.createElement('button');
  btn.className = `btn ${className}`;
  btn.type      = 'button';
  btn.setAttribute('aria-label', t('weblink.moreActions'));
  btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>`;

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    showContextMenu(e, weblinkId);
  });

  return btn;
}

// ─────────────────────────────────────────────────────────────────────────────
// Context menu
// ─────────────────────────────────────────────────────────────────────────────

let _activeMenu = null;

function closeContextMenu() {
  if (_activeMenu) {
    _activeMenu.remove();
    _activeMenu = null;
  }
}

function showContextMenu(e, weblinkId) {
  closeContextMenu();

  const menu = document.createElement('div');
  menu.className = 'context-menu';
  menu.setAttribute('role', 'menu');

  const editItem = document.createElement('button');
  editItem.className = 'context-menu-item';
  editItem.type      = 'button';
  editItem.setAttribute('role', 'menuitem');
  editItem.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`;
  editItem.appendChild(document.createTextNode(t('weblink.edit')));
  editItem.addEventListener('click', () => {
    closeContextMenu();
    _onEditWeblink?.(weblinkId);
  });

  // Pin / unpin item
  const pinItem = document.createElement('button');
  pinItem.className = 'context-menu-item';
  pinItem.type      = 'button';
  pinItem.setAttribute('role', 'menuitem');
  const pinned = isPinned(weblinkId);
  pinItem.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V17z"/></svg>`;
  pinItem.appendChild(document.createTextNode(pinned ? t('weblink.unpin') : t('weblink.pin')));
  pinItem.addEventListener('click', () => {
    closeContextMenu();
    _onPinToggle?.(weblinkId);
  });

  menu.appendChild(editItem);
  menu.appendChild(pinItem);
  document.body.appendChild(menu);
  _activeMenu = menu;

  // Position menu near the button
  const rect = e.currentTarget.getBoundingClientRect();
  let top  = rect.bottom + window.scrollY + 4;
  let left = rect.left   + window.scrollX;

  // Keep inside viewport
  const menuWidth  = 160;
  // Use the rendered menu height so the overflow check accounts for all items.
  // Falls back to 96 (two-item estimate) in environments where layout is unavailable.
  const menuHeight = menu.getBoundingClientRect().height || 96;
  if (left + menuWidth > window.innerWidth) {
    left = rect.right + window.scrollX - menuWidth;
  }
  if (top + menuHeight > window.innerHeight + window.scrollY) {
    top = rect.top + window.scrollY - menuHeight - 4;
  }

  menu.style.top  = `${top}px`;
  menu.style.left = `${left}px`;

  // Close on outside click
  const handler = (ev) => {
    if (!menu.contains(ev.target)) {
      closeContextMenu();
      document.removeEventListener('click', handler, true);
    }
  };
  // Use rAF to avoid the current click triggering the outside-click handler
  requestAnimationFrame(() => {
    document.addEventListener('click', handler, true);
  });

  // Close on Escape
  const keyHandler = (ev) => {
    if (ev.key === 'Escape') {
      closeContextMenu();
      document.removeEventListener('keydown', keyHandler);
    }
  };
  document.addEventListener('keydown', keyHandler);

  // Focus first item
  editItem.focus();
}

// ─────────────────────────────────────────────────────────────────────────────
// Empty state
// ─────────────────────────────────────────────────────────────────────────────

function buildEmptyState(mode) {
  const wrap = document.createElement('div');
  wrap.className = 'empty-state';

  const icon = document.createElement('div');
  icon.className = 'empty-state-icon';
  icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`;
  wrap.appendChild(icon);

  const title = document.createElement('div');
  title.className   = 'empty-state-title';
  title.textContent = t('empty.title');
  wrap.appendChild(title);

  const subtitle = document.createElement('div');
  subtitle.className   = 'empty-state-subtitle';
  subtitle.textContent = mode === 'pinned' ? t('empty.pinned')
    : mode === 'filtered' ? t('empty.filtered')
    : t('empty.subtitle');
  wrap.appendChild(subtitle);

  return wrap;
}
