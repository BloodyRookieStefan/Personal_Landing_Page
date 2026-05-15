// weblink-form.js

// ─────────────────────────────────────────────────────────────────────────────
// Add weblink
// ─────────────────────────────────────────────────────────────────────────────

function openAddWeblinkDialog() {
  openWeblinkDialog(null);
}

// ─────────────────────────────────────────────────────────────────────────────
// Edit weblink
// ─────────────────────────────────────────────────────────────────────────────

function openEditWeblinkDialog(weblinkId) {
  const existing = state.weblinks.find(w => w.id === weblinkId);
  if (!existing) return;
  openWeblinkDialog(existing);
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared dialog builder
// ─────────────────────────────────────────────────────────────────────────────

function openWeblinkDialog(existing) {
  const isEdit = !!existing;

  let selectedIcon = existing?.icon || 'globe';
  const formData   = {
    url:         existing?.url         || '',
    name:        existing?.name        || '',
    icon:        existing?.icon        || 'globe',
    description: existing?.description || '',
    category:    existing?.category    || DEFAULT_CATEGORY_IDS.NOT_DEFINED,
  };

  // ── Body ──────────────────────────────────────────────────────────────────
  const body = document.createElement('div');
  body.style.display       = 'flex';
  body.style.flexDirection = 'column';
  body.style.gap           = '16px';

  // URL
  const urlGroup   = buildFormGroup('url', t('form.url'), 'url', formData.url, 'https://example.com', false);
  const urlInput   = urlGroup.querySelector('input');
  const urlError   = urlGroup.querySelector('.form-error');
  body.appendChild(urlGroup);

  // Name
  const nameGroup  = buildFormGroup('name', t('form.name'), 'text', formData.name, '', false);
  const nameInput  = nameGroup.querySelector('input');
  const nameError  = nameGroup.querySelector('.form-error');
  body.appendChild(nameGroup);

  // Icon picker
  const iconGroup  = document.createElement('div');
  iconGroup.className = 'form-group';
  const iconLabel  = document.createElement('label');
  iconLabel.className   = 'form-label';
  iconLabel.textContent = t('form.icon');
  iconGroup.appendChild(iconLabel);
  const picker = buildIconPicker(selectedIcon, (key) => {
    selectedIcon = key;
    formData.icon = key;
  });
  iconGroup.appendChild(picker);
  body.appendChild(iconGroup);

  // Description
  const descGroup  = document.createElement('div');
  descGroup.className = 'form-group';
  const descLabel  = document.createElement('label');
  descLabel.className   = 'form-label';
  descLabel.htmlFor     = 'wl-description';
  descLabel.textContent = t('form.description');
  const descInput  = document.createElement('textarea');
  descInput.className   = 'form-control';
  descInput.id          = 'wl-description';
  descInput.rows        = 3;
  descInput.value       = formData.description;
  descGroup.appendChild(descLabel);
  descGroup.appendChild(descInput);
  body.appendChild(descGroup);

  // Category select
  const catGroup   = document.createElement('div');
  catGroup.className = 'form-group';
  const catLabel   = document.createElement('label');
  catLabel.className   = 'form-label';
  catLabel.htmlFor     = 'wl-category';
  catLabel.textContent = t('form.category');
  const catSelect  = document.createElement('select');
  catSelect.className  = 'form-control';
  catSelect.id         = 'wl-category';
  const allCats    = getFullCategories(state.categories);
  for (const cat of allCats) {
    const opt = document.createElement('option');
    opt.value       = cat.id;
    opt.textContent = getCategoryLabel(cat, t);
    if (cat.id === formData.category) opt.selected = true;
    catSelect.appendChild(opt);
  }
  catGroup.appendChild(catLabel);
  catGroup.appendChild(catSelect);
  body.appendChild(catGroup);

  // ── Footer ─────────────────────────────────────────────────────────────────
  const footer = document.createElement('div');
  footer.style.display = 'flex';
  footer.style.gap     = '8px';

  const cancelBtn = document.createElement('button');
  cancelBtn.className   = 'btn btn-secondary';
  cancelBtn.type        = 'button';
  cancelBtn.textContent = t('form.cancel');
  cancelBtn.addEventListener('click', closeModal);
  footer.appendChild(cancelBtn);

  const saveBtn = document.createElement('button');
  saveBtn.className   = 'btn btn-primary';
  saveBtn.type        = 'button';
  saveBtn.textContent = t('form.save');
  saveBtn.addEventListener('click', async () => {
    const data = {
      url:         sanitizeString(urlInput.value),
      name:        sanitizeString(nameInput.value),
      icon:        selectedIcon,
      description: sanitizeString(descInput.value),
      category:    catSelect.value,
    };

    // Validate
    const errors = validateWeblink(data);
    showFieldError(urlInput,  urlError,  errors.url  ? t(errors.url)  : '');
    showFieldError(nameInput, nameError, errors.name ? t(errors.name) : '');
    if (Object.keys(errors).length) return;

    if (isEdit) {
      // Update existing
      const idx = state.weblinks.findIndex(w => w.id === existing.id);
      if (idx !== -1) {
        state.weblinks[idx] = { ...state.weblinks[idx], ...data };
      }
    } else {
      // Create new
      const wl = createWeblink(data);
      state.weblinks.push(wl);
    }

    closeModal();

    // Persist
    try {
      await persistData();
      showToast(t('toast.saved'), 'success');
    } catch {
      showToast(t('storage.saveError'), 'error');
    }

    renderSidebar();
    renderWeblinks();
  });
  footer.appendChild(saveBtn);

  openModal({
    title: isEdit ? t('dialog.editWeblink') : t('dialog.addWeblink'),
    body,
    footer,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function buildFormGroup(id, label, type, value, placeholder, required) {
  const group = document.createElement('div');
  group.className = 'form-group';

  const labelEl = document.createElement('label');
  labelEl.className   = 'form-label';
  labelEl.htmlFor     = `wl-${id}`;
  labelEl.textContent = label + (required ? ` *` : '');
  group.appendChild(labelEl);

  const input = document.createElement('input');
  input.className   = 'form-control';
  input.type        = type;
  input.id          = `wl-${id}`;
  input.value       = value;
  input.placeholder = placeholder || '';
  if (required) input.required = true;
  group.appendChild(input);

  const error = document.createElement('div');
  error.className = 'form-error';
  group.appendChild(error);

  // Clear error on input
  input.addEventListener('input', () => {
    error.textContent = '';
    input.classList.remove('is-invalid');
  });

  return group;
}

function showFieldError(input, errorEl, message) {
  errorEl.textContent = message;
  input.classList.toggle('is-invalid', !!message);
}
