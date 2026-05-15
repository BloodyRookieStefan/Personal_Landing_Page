// i18n.js

// ─────────────────────────────────────────────────────────────────────────────
// Translation dictionaries
// ─────────────────────────────────────────────────────────────────────────────

const translations = {
  de: {
    'app.title':                  'Personal Dashboard',

    // Toolbar
    'toolbar.addWeblink':         'Link hinzufügen',
    'toolbar.manageCategories':   'Kategorien',
    'toolbar.importBookmarks':    'Firefox importieren',
    'toolbar.searchPlaceholder':  'Weblinks suchen…',
    'toolbar.compact':            'Kompakt',
    'toolbar.theme':              'Theme',
    'toolbar.ariaLabel':          'Dashboard-Steuerung',
    'toolbar.switchLanguage':     'Sprache wechseln',

    // Sidebar
    'sidebar.all':                'Alle',
    'sidebar.pinned':             'Angeheftet',
    'sidebar.categories':         'Kategorien',

    // Weblink actions
    'weblink.edit':               'Bearbeiten',
    'weblink.pin':                'Anheften',
    'weblink.unpin':              'Lösen',
    'weblink.delete':             'Löschen',
    'weblink.moreActions':        'Weitere Aktionen',

    // Forms – shared
    'form.save':                  'Speichern',
    'form.cancel':                'Abbrechen',

    // Weblink form
    'form.url':                   'URL',
    'form.name':                  'Name',
    'form.icon':                  'Symbol',
    'form.description':           'Beschreibung (optional)',
    'form.category':              'Kategorie',
    'form.selectIcon':            'Symbol auswählen',

    // Dialog titles
    'dialog.addWeblink':          'Link hinzufügen',
    'dialog.editWeblink':         'Link bearbeiten',
    'dialog.manageCategories':    'Kategorien verwalten',
    'dialog.confirmDelete':       'Löschen bestätigen',

    // Category manager
    'category.add':               'Kategorie hinzufügen',
    'category.name':              'Kategoriename',
    'category.icon':              'Symbol',
    'category.delete':            'Löschen',
    'category.rename':            'Umbenennen',
    'category.moveUp':            'Nach oben',
    'category.moveDown':          'Nach unten',
    'category.createLabel':       'Neue Kategorie',
    'category.protected':         'Geschützte Kategorie – kann nicht gelöscht werden.',
    'category.defaultBadge':      'Standard',
    'category.notDefined':        'Nicht definiert',
    'category.imported':          'Importiert',

    // Empty states
    'empty.title':                'Noch keine Links',
    'empty.subtitle':             'Füge deinen ersten Link über die Schaltfläche oben hinzu.',
    'empty.filtered':             'Keine Links in dieser Kategorie.',
    'empty.pinned':               'Keine angehefteten Links.',

    // Storage
    'storage.setupTitle':         'Speicherdatei verbinden',
    'storage.setupDescription':   'Wähle deine Speicherdatei aus oder erstelle eine neue, um deine Links dauerhaft zu speichern.',
    'storage.reconnectTitle':     'Verbindung wiederherstellen',
    'storage.reconnectDescription': 'Zuletzt verbundene Datei: {name}. Wähle die Datei erneut aus, um externe Änderungen zu prüfen.',
    'storage.reconnectFile':      'Datei erneut auswählen',
    'storage.selectFile':         'Datei auswählen',
    'storage.createFile':         'Neue Datei erstellen',
    'storage.importFile':         'JSON-Datei importieren',
    'storage.startFresh':         'Neu starten',
    'storage.saveFile':           'Datei speichern',
    'storage.exportJson':         'JSON exportieren',
    'storage.unsavedChanges':     'Ungespeicherte Änderungen – klicken zum Exportieren',
    'storage.reconnect':          'Datei neu verbinden',
    'storage.connected':          'Speicherdatei verbunden.',
    'storage.accessDenied':       'Dateizugriff verweigert. Verbinde die Speicherdatei erneut.',
    'storage.saveError':          'Fehler beim Speichern.',
    'storage.pickFileHint':        'Bitte wähle einmalig deine weblinks.json aus, damit sie automatisch geladen werden kann.',
    'storage.fileProtocolWarning': 'weblinks.json konnte nicht geladen werden. Öffne die Seite über einen lokalen HTTP-Server (z. B. VS Code Live Server), kein file://-Protokoll.',
    'sync.title':                 'Datei geändert',
    'sync.message':               'Die Speicherdatei wurde seit der letzten Synchronisierung extern geändert. Möchtest du die aktualisierten Daten importieren?',
    'sync.confirm':               'Importieren',
    'sync.cancel':                'Aktuelle behalten',
    'sync.updated':               'Datei aktualisiert – Ansicht aktualisiert.',

    // Import
    'import.title':               'Firefox importieren',
    'import.description':         'Exportiere deine Firefox-Lesezeichen unter Lesezeichen → Alle Lesezeichen verwalten → Importieren und Sichern → Lesezeichen in JSON sichern und wähle die Datei hier aus.',
    'import.chooseFile':          'JSON-Datei auswählen',
    'import.drop':                'Datei hierher ziehen oder klicken',
    'import.success':             '{n} Lesezeichen erfolgreich importiert.',
    'import.noValid':             'Keine gültigen Lesezeichen in der Datei gefunden.',
    'import.error':               'Fehler beim Lesen der Lesezeichen-Datei.',
    'import.duplicateSkipped':    '{n} Duplikate wurden übersprungen.',

    // Validation
    'validation.urlRequired':     'URL ist erforderlich.',
    'validation.nameRequired':    'Name ist erforderlich.',
    'validation.urlInvalid':      'Bitte gib eine gültige URL ein.',
    'validation.categoryReserved': 'Die Namen „Importiert" und „Nicht definiert" sind reserviert.',
    'validation.categoryDuplicate': 'Eine Kategorie mit diesem Namen existiert bereits.',

    // Confirm dialog
    'confirm.deleteCategory':     'Kategorie „{name}" löschen? Alle zugehörigen Links werden nach „Nicht definiert" verschoben.',
    'confirm.yes':                'Ja, löschen',
    'confirm.no':                 'Abbrechen',

    // Toast
    'toast.saved':                'Gespeichert',
    'toast.imported':             'Import erfolgreich',
    'toast.deleted':              'Gelöscht',
  },

  en: {
    'app.title':                  'Personal Dashboard',

    'toolbar.addWeblink':         'Add Weblink',
    'toolbar.manageCategories':   'Categories',
    'toolbar.importBookmarks':    'Import Firefox',
    'toolbar.searchPlaceholder':  'Search weblinks…',
    'toolbar.compact':            'Compact',
    'toolbar.theme':              'Theme',
    'toolbar.ariaLabel':          'Dashboard controls',
    'toolbar.switchLanguage':     'Switch language',

    'sidebar.all':                'All',
    'sidebar.pinned':             'Pinned',
    'sidebar.categories':         'Categories',

    'weblink.edit':               'Edit',
    'weblink.pin':                'Pin',
    'weblink.unpin':              'Unpin',
    'weblink.delete':             'Delete',
    'weblink.moreActions':        'More actions',

    'form.save':                  'Save',
    'form.cancel':                'Cancel',

    'form.url':                   'URL',
    'form.name':                  'Name',
    'form.icon':                  'Icon',
    'form.description':           'Description (optional)',
    'form.category':              'Category',
    'form.selectIcon':            'Select icon',

    'dialog.addWeblink':          'Add Weblink',
    'dialog.editWeblink':         'Edit Weblink',
    'dialog.manageCategories':    'Manage Categories',
    'dialog.confirmDelete':       'Confirm Delete',

    'category.add':               'Add Category',
    'category.name':              'Category Name',
    'category.icon':              'Icon',
    'category.delete':            'Delete',
    'category.rename':            'Rename',
    'category.moveUp':            'Move up',
    'category.moveDown':          'Move down',
    'category.createLabel':       'New Category',
    'category.protected':         'Protected category – cannot be deleted.',
    'category.defaultBadge':      'Default',
    'category.notDefined':        'Not defined',
    'category.imported':          'Imported',

    'empty.title':                'No weblinks yet',
    'empty.subtitle':             'Add your first weblink using the button above.',
    'empty.filtered':             'No weblinks in this category.',
    'empty.pinned':               'No pinned links.',

    'storage.setupTitle':         'Connect Storage File',
    'storage.setupDescription':   'Choose your storage file or create a new one to persist your weblinks.',
    'storage.reconnectTitle':     'Reconnect Storage File',
    'storage.reconnectDescription': 'Last connected file: {name}. Please reselect the file to check for external changes.',
    'storage.reconnectFile':      'Reselect File',
    'storage.selectFile':         'Select File',
    'storage.createFile':         'Create New File',
    'storage.importFile':         'Import JSON File',
    'storage.startFresh':         'Start Fresh',
    'storage.saveFile':           'Save File',
    'storage.exportJson':         'Export JSON',
    'storage.unsavedChanges':     'Unsaved changes – click to export',
    'storage.reconnect':          'Reconnect File',
    'storage.connected':          'Storage file connected.',
    'storage.accessDenied':       'File access was denied. Please reconnect the storage file.',
    'storage.saveError':          'Failed to save changes to the file.',
    'storage.pickFileHint':        'Please select your weblinks.json once so it can be loaded automatically.',
    'storage.fileProtocolWarning': 'Could not load weblinks.json. Open the page via a local HTTP server (e.g. VS Code Live Server) – file:// protocol is not supported.',

    'sync.title':                 'File Changed',
    'sync.message':               'The storage file has changed since the last sync. Do you want to import the updated data?',
    'sync.confirm':               'Import',
    'sync.cancel':                'Keep current',
    'sync.updated':               'File updated – view refreshed.',

    'import.title':               'Import Firefox',
    'import.description':         'Export your Firefox bookmarks via Bookmarks → Manage All Bookmarks → Import and Backup → Back Up to JSON and select the file here.',
    'import.chooseFile':          'Select JSON File',
    'import.drop':                'Drag file here or click to select',
    'import.success':             'Successfully imported {n} bookmarks.',
    'import.noValid':             'No valid bookmarks found in the file.',
    'import.error':               'Failed to parse the bookmark file.',
    'import.duplicateSkipped':    '{n} duplicates were skipped.',

    'validation.urlRequired':     'URL is required.',
    'validation.nameRequired':    'Name is required.',
    'validation.urlInvalid':      'Please enter a valid URL.',
    'validation.categoryReserved': 'The names "Imported" and "Not defined" are reserved.',
    'validation.categoryDuplicate': 'A category with this name already exists.',

    'confirm.deleteCategory':     'Delete category "{name}"? All weblinks in this category will be moved to "Not defined".',
    'confirm.yes':                'Yes, delete',
    'confirm.no':                 'Cancel',

    'toast.saved':                'Saved',
    'toast.imported':             'Import successful',
    'toast.deleted':              'Deleted',
  },
};

/**
 * Translate a key into the current locale.
 * Supports simple template vars like {n} and {name}.
 */
function t(key, vars) {
  const locale = state.settings.language || 'de';
  const dict   = translations[locale] || translations['de'];
  let text     = dict[key] ?? translations['de'][key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
    }
  }
  return text;
}

/**
 * Apply translations to all elements with [data-i18n] attributes.
 * Runs on language switch to update static HTML text nodes.
 */
function applyTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    el.textContent = t(key);
  });
  document.querySelectorAll('[data-i18n-aria]').forEach(el => {
    const key = el.getAttribute('data-i18n-aria');
    el.setAttribute('aria-label', t(key));
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    el.placeholder = t(key);
  });
  // Update the lang attribute on <html>
  document.documentElement.lang = state.settings.language;
}

// translations is a global const defined above
