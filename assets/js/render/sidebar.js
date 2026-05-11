import { state } from '../state.js';
import { t } from '../i18n.js';
import { getIcon } from '../icons.js';
import { getFullCategories, getCategoryLabel } from '../schema.js';
import { byId, clearChildren } from '../utils/dom.js';
import { isPinned } from '../state.js';
import { PINNED_CATEGORY_ID } from '../config.js';

// Callback set by app.js
let _onSelectCategory = null;

export function setSidebarCallbacks({ onSelectCategory }) {
  _onSelectCategory = onSelectCategory;
}

// ─────────────────────────────────────────────────────────────────────────────
// Render
// ─────────────────────────────────────────────────────────────────────────────

export function renderSidebar() {
  const container = byId('sidebar-content');
  if (!container) return;
  clearChildren(container);

  const allCategories  = getFullCategories(state.categories);
  const totalCount     = state.weblinks.length;
  const selectedId     = state.selectedCategory;

  // "All" entry
  container.appendChild(buildItem({
    id:       null,
    icon:     'globe',
    label:    t('sidebar.all'),
    count:    totalCount,
    active:   selectedId === null,
  }));

  // Fixed "Pinned" entry
  const pinnedCount = state.weblinks.filter(w => isPinned(w.id)).length;
  container.appendChild(buildItem({
    id:       PINNED_CATEGORY_ID,
    icon:     'pin',
    label:    t('sidebar.pinned'),
    count:    pinnedCount,
    active:   selectedId === PINNED_CATEGORY_ID,
    pinned:   true,
  }));

  // Divider
  const divider = document.createElement('div');
  divider.className = 'sidebar-divider';
  container.appendChild(divider);

  // Section label
  const sectionLabel = document.createElement('div');
  sectionLabel.className = 'sidebar-section-label';
  sectionLabel.textContent = t('sidebar.categories');
  container.appendChild(sectionLabel);

  // Category entries
  for (const cat of allCategories) {
    const count = state.weblinks.filter(w => w.category === cat.id).length;
    container.appendChild(buildItem({
      id:     cat.id,
      icon:   cat.icon,
      label:  getCategoryLabel(cat, t),
      count,
      active: selectedId === cat.id,
    }));
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Build a single category sidebar item
// ─────────────────────────────────────────────────────────────────────────────

function buildItem({ id, icon, label, count, active, pinned = false }) {
  const item = document.createElement('div');
  item.className   = 'category-item' + (active ? ' active' : '') + (pinned ? ' category-item--pinned' : '');
  item.setAttribute('role', 'button');
  item.setAttribute('tabindex', '0');
  item.setAttribute('aria-pressed', String(active));
  item.setAttribute('data-cat-id', id === null ? '__all__' : id);

  // Icon
  const iconWrapper = document.createElement('span');
  iconWrapper.className = 'cat-icon';
  iconWrapper.innerHTML = getIcon(icon);
  item.appendChild(iconWrapper);

  // Label
  const labelEl = document.createElement('span');
  labelEl.className   = 'cat-label';
  labelEl.textContent = label;
  item.appendChild(labelEl);

  // Count badge
  const countEl = document.createElement('span');
  countEl.className   = 'cat-count';
  countEl.textContent = String(count);
  item.appendChild(countEl);

  // Click / keyboard
  const handleSelect = () => {
    _onSelectCategory?.(id);
  };

  item.addEventListener('click', handleSelect);
  item.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleSelect();
    }
  });

  return item;
}
