// category-manager.js

// ─────────────────────────────────────────────────────────────────────────────
// Open category manager dialog
// ─────────────────────────────────────────────────────────────────────────────

function openCategoryManager() {
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
    // ── Move up / down buttons ───────────────────────────────────────────────
    const idx        = state.categories.findIndex(c => c.id === cat.id);
    const isFirst    = idx === 0;
    const isLast     = idx === state.categories.length - 1;

    const moveUpBtn = document.createElement('button');
    moveUpBtn.className        = 'btn btn-ghost';
    moveUpBtn.type             = 'button';
    moveUpBtn.title            = t('category.moveUp');
    moveUpBtn.disabled         = isFirst;
    moveUpBtn.setAttribute('aria-label', t('category.moveUp'));
    moveUpBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:15px;height:15px" aria-hidden="true"><polyline points="18 15 12 9 6 15"/></svg>`;

    moveUpBtn.addEventListener('click', async () => {
      const i = state.categories.findIndex(c => c.id === cat.id);
      if (i <= 0) return;
      [state.categories[i - 1], state.categories[i]] = [state.categories[i], state.categories[i - 1]];
      try { await persistData(); } catch { showToast(t('storage.saveError'), 'error'); }
      onRefresh();
      renderSidebar();
    });

    const moveDownBtn = document.createElement('button');
    moveDownBtn.className        = 'btn btn-ghost';
    moveDownBtn.type             = 'button';
    moveDownBtn.title            = t('category.moveDown');
    moveDownBtn.disabled         = isLast;
    moveDownBtn.setAttribute('aria-label', t('category.moveDown'));
    moveDownBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:15px;height:15px" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>`;

    moveDownBtn.addEventListener('click', async () => {
      const i = state.categories.findIndex(c => c.id === cat.id);
      if (i < 0 || i >= state.categories.length - 1) return;
      [state.categories[i], state.categories[i + 1]] = [state.categories[i + 1], state.categories[i]];
      try { await persistData(); } catch { showToast(t('storage.saveError'), 'error'); }
      onRefresh();
      renderSidebar();
    });

    row.appendChild(moveUpBtn);
    row.appendChild(moveDownBtn);

    // ── Rename button ────────────────────────────────────────────────────────
    const renameBtn = document.createElement('button');
    renameBtn.className = 'btn btn-ghost';
    renameBtn.type      = 'button';
    renameBtn.title     = t('category.rename');
    renameBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:15px;height:15px" aria-hidden="true"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`;

    renameBtn.addEventListener('click', () => {
      // Switch to inline-edit mode
      nameEl.style.display      = 'none';
      renameBtn.style.display   = 'none';
      delBtn.style.display      = 'none';
      moveUpBtn.style.display   = 'none';
      moveDownBtn.style.display = 'none';

      const editWrap = document.createElement('div');
      editWrap.style.flex          = '1';
      editWrap.style.display       = 'flex';
      editWrap.style.flexDirection = 'column';
      editWrap.style.gap           = '4px';

      const nameInput = document.createElement('input');
      nameInput.className = 'form-control';
      nameInput.type      = 'text';
      nameInput.value     = cat.name;
      nameInput.addEventListener('input', () => {
        nameError.textContent = '';
        nameInput.classList.remove('is-invalid');
      });

      const nameError = document.createElement('div');
      nameError.className = 'form-error';

      editWrap.appendChild(nameInput);
      editWrap.appendChild(nameError);

      const saveBtn = document.createElement('button');
      saveBtn.className   = 'btn btn-primary';
      saveBtn.type        = 'button';
      saveBtn.textContent = t('form.save');

      const cancelBtn = document.createElement('button');
      cancelBtn.className   = 'btn btn-ghost';
      cancelBtn.type        = 'button';
      cancelBtn.textContent = t('form.cancel');

      row.appendChild(editWrap);
      row.appendChild(saveBtn);
      row.appendChild(cancelBtn);

      nameInput.focus();
      nameInput.select();

      const exitEditMode = () => {
        row.removeChild(editWrap);
        row.removeChild(saveBtn);
        row.removeChild(cancelBtn);
        nameEl.style.display      = '';
        renameBtn.style.display   = '';
        delBtn.style.display      = '';
        moveUpBtn.style.display   = '';
        moveDownBtn.style.display = '';
      };

      cancelBtn.addEventListener('click', exitEditMode);

      saveBtn.addEventListener('click', async () => {
        const newName = sanitizeString(nameInput.value);
        const otherCategories = state.categories.filter(c => c.id !== cat.id);
        const errors = validateCategory({ name: newName }, otherCategories);
        if (errors.name) {
          nameError.textContent = t(errors.name);
          nameInput.classList.add('is-invalid');
          return;
        }

        const idx = state.categories.findIndex(c => c.id === cat.id);
        if (idx !== -1) {
          state.categories[idx] = { ...state.categories[idx], name: newName };
        }

        try {
          await persistData();
          showToast(t('toast.saved'), 'success');
        } catch {
          showToast(t('storage.saveError'), 'error');
        }

        onRefresh();
        renderSidebar();
      });

      nameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter')  saveBtn.click();
        if (e.key === 'Escape') cancelBtn.click();
      });
    });

    row.appendChild(renameBtn);

    // ── Delete button ────────────────────────────────────────────────────────
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
