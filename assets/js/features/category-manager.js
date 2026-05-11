import { state } from '../state.js';
import { t } from '../i18n.js';
import { createCategory, getFullCategories, getCategoryLabel } from '../schema.js';
import { validateCategory, sanitizeString } from '../utils/validation.js';
import { persistData } from '../storage.js';
import { openModal, closeModal, buildIconPicker, showToast, showConfirm } from '../render/dialogs.js';
import { renderSidebar } from '../render/sidebar.js';
import { renderWeblinks } from '../render/weblinks.js';
import { getIcon } from '../icons.js';
import { DEFAULT_CATEGORY_IDS } from '../config.js';

// ─────────────────────────────────────────────────────────────────────────────
// Open category manager dialog
// ─────────────────────────────────────────────────────────────────────────────

export function openCategoryManager() {
  const body   = buildManagerBody();
  const modal  = openModal({ title: t('dialog.manageCategories'), body });
}

// ─────────────────────────────────────────────────────────────────────────────
// Build the manager body (category list + add-category form)
// ─────────────────────────────────────────────────────────────────────────────

function buildManagerBody() {
  const wrap = document.createElement('div');
  wrap.style.display       = 'flex';
  wrap.style.flexDirection = 'column';
  wrap.style.gap           = '20px';

  // Category list section
  const listSection = document.createElement('div');
  listSection.style.display       = 'flex';
  listSection.style.flexDirection = 'column';
  listSection.style.gap           = '8px';
  wrap.appendChild(listSection);

  const refreshList = () => {
    while (listSection.firstChild) listSection.removeChild(listSection.firstChild);
    const all = getFullCategories(state.categories);
    for (const cat of all) {
      listSection.appendChild(buildCategoryRow(cat, refreshList));
    }
  };

  refreshList();

  // ── Add new category ───────────────────────────────────────────────────────
  const divider = document.createElement('div');
  divider.style.height     = '1px';
  divider.style.background = 'var(--color-border)';
  wrap.appendChild(divider);

  const addSection = document.createElement('div');
  addSection.style.display       = 'flex';
  addSection.style.flexDirection = 'column';
  addSection.style.gap           = '12px';

  const addTitle = document.createElement('div');
  addTitle.className   = 'form-label';
  addTitle.textContent = t('category.createLabel');
  addSection.appendChild(addTitle);

  // Name input
  const nameGroup  = document.createElement('div');
  nameGroup.className = 'form-group';
  const nameLabel  = document.createElement('label');
  nameLabel.className   = 'form-label';
  nameLabel.htmlFor     = 'cat-new-name';
  nameLabel.textContent = t('category.name');
  const nameInput  = document.createElement('input');
  nameInput.className   = 'form-control';
  nameInput.type        = 'text';
  nameInput.id          = 'cat-new-name';
  nameInput.placeholder = t('category.name');
  const nameError  = document.createElement('div');
  nameError.className = 'form-error';
  nameInput.addEventListener('input', () => {
    nameError.textContent = '';
    nameInput.classList.remove('is-invalid');
  });
  nameGroup.appendChild(nameLabel);
  nameGroup.appendChild(nameInput);
  nameGroup.appendChild(nameError);
  addSection.appendChild(nameGroup);

  // Icon picker
  let selectedIcon = 'folder';
  const iconGroup = document.createElement('div');
  iconGroup.className = 'form-group';
  const iconLabel = document.createElement('label');
  iconLabel.className   = 'form-label';
  iconLabel.textContent = t('category.icon');
  const picker = buildIconPicker(selectedIcon, (key) => { selectedIcon = key; });
  iconGroup.appendChild(iconLabel);
  iconGroup.appendChild(picker);
  addSection.appendChild(iconGroup);

  // Add button
  const addBtn = document.createElement('button');
  addBtn.className   = 'btn btn-primary';
  addBtn.type        = 'button';
  addBtn.textContent = t('category.add');
  addBtn.addEventListener('click', async () => {
    const name = sanitizeString(nameInput.value);
    const errors = validateCategory({ name }, state.categories);
    if (errors.name) {
      nameError.textContent = t(errors.name);
      nameInput.classList.add('is-invalid');
      return;
    }

    const cat = createCategory({ name, icon: selectedIcon });
    state.categories.push(cat);
    nameInput.value       = '';
    nameError.textContent = '';
    nameInput.classList.remove('is-invalid');

    // Persist
    try {
      await persistData();
      showToast(t('toast.saved'), 'success');
    } catch {
      showToast(t('storage.saveError'), 'error');
    }

    refreshList();
    renderSidebar();
  });
  addSection.appendChild(addBtn);

  wrap.appendChild(addSection);
  return wrap;
}

// ─────────────────────────────────────────────────────────────────────────────
// Single category row in the manager list
// ─────────────────────────────────────────────────────────────────────────────

function buildCategoryRow(cat, onRefresh) {
  const row = document.createElement('div');
  row.className = 'category-manage-item' + (cat.isDefault ? ' is-default' : '');

  // Icon
  const iconEl = document.createElement('div');
  iconEl.className = 'category-manage-icon';
  iconEl.innerHTML = getIcon(cat.icon);
  row.appendChild(iconEl);

  // Name
  const nameEl = document.createElement('div');
  nameEl.className   = 'category-manage-name';
  nameEl.textContent = getCategoryLabel(cat, t);
  row.appendChild(nameEl);

  if (cat.isDefault) {
    const badge = document.createElement('span');
    badge.className   = 'category-manage-badge';
    badge.textContent = t('category.defaultBadge');
    badge.title       = t('category.protected');
    row.appendChild(badge);
  } else {
    const delBtn = document.createElement('button');
    delBtn.className   = 'btn btn-ghost';
    delBtn.type        = 'button';
    delBtn.title       = t('category.delete');
    delBtn.innerHTML   = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:15px;height:15px" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>`;

    delBtn.addEventListener('click', async () => {
      const message = t('confirm.deleteCategory', { name: cat.name });
      const confirmed = await showConfirm(message);

      if (!confirmed) {
        // User cancelled – reopen the manager
        openCategoryManager();
        return;
      }

      // Reassign weblinks to 'not-defined'
      state.weblinks = state.weblinks.map(w =>
        w.category === cat.id ? { ...w, category: DEFAULT_CATEGORY_IDS.NOT_DEFINED } : w
      );

      // Remove category
      state.categories = state.categories.filter(c => c.id !== cat.id);

      // Persist
      try {
        await persistData();
        showToast(t('toast.deleted'), 'success');
      } catch {
        showToast(t('storage.saveError'), 'error');
      }

      renderSidebar();
      renderWeblinks();

      // Reopen the manager with fresh state
      openCategoryManager();
    });

    row.appendChild(delBtn);
  }

  return row;
}
