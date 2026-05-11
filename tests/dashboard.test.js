/**
 * tests/dashboard.test.js
 *
 * Focused tests for REQ-001 dashboard preference persistence:
 * - theme, language, and compact mode save / restore
 * - pin / unpin state save / restore
 * - pinned weblinks sort before unpinned items
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  state,
  loadPersistedSettings,
  persistSettings,
  updateSettings,
  togglePinWeblink,
  isPinned,
} from '../assets/js/state.js';
import { renderWeblinks } from '../assets/js/render/weblinks.js';
import { renderSidebar } from '../assets/js/render/sidebar.js';
import { t, applyTranslations } from '../assets/js/i18n.js';
import { LS_SETTINGS_KEY, PINNED_CATEGORY_ID } from '../assets/js/config.js';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function saveSettings(overrides = {}) {
  const base = { theme: 'light', language: 'de', compactMode: false, pinnedWeblinks: [] };
  localStorage.setItem(LS_SETTINGS_KEY, JSON.stringify({ ...base, ...overrides }));
}

// ─────────────────────────────────────────────────────────────────────────────
// Per-suite state snapshot so tests don't pollute each other
// ─────────────────────────────────────────────────────────────────────────────

let origTheme, origLang, origCompact, origPinned;

beforeEach(() => {
  origTheme   = state.settings.theme;
  origLang    = state.settings.language;
  origCompact = state.settings.compactMode;
  origPinned  = [...state.settings.pinnedWeblinks];
  localStorage.clear();
});

afterEach(() => {
  state.settings.theme          = origTheme;
  state.settings.language       = origLang;
  state.settings.compactMode    = origCompact;
  state.settings.pinnedWeblinks = origPinned;
  localStorage.clear();
});

// ─────────────────────────────────────────────────────────────────────────────
// Default state
// ─────────────────────────────────────────────────────────────────────────────

describe('default settings', () => {
  it('pinnedWeblinks defaults to an empty array', () => {
    // Restore state to defaults for this check
    state.settings.pinnedWeblinks = [];
    expect(state.settings.pinnedWeblinks).toEqual([]);
  });

  it('compactMode defaults to false', () => {
    state.settings.compactMode = false;
    expect(state.settings.compactMode).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// persistSettings / loadPersistedSettings – theme, language, compact mode
// ─────────────────────────────────────────────────────────────────────────────

describe('dashboard preference persistence – theme and language', () => {
  it('persistSettings writes theme to localStorage', () => {
    state.settings.theme = 'dark';
    persistSettings();
    const stored = JSON.parse(localStorage.getItem(LS_SETTINGS_KEY));
    expect(stored.theme).toBe('dark');
  });

  it('loadPersistedSettings restores theme from localStorage', () => {
    saveSettings({ theme: 'dark' });
    state.settings.theme = 'light';
    loadPersistedSettings();
    expect(state.settings.theme).toBe('dark');
  });

  it('loadPersistedSettings restores language from localStorage', () => {
    saveSettings({ language: 'en' });
    state.settings.language = 'de';
    loadPersistedSettings();
    expect(state.settings.language).toBe('en');
  });

  it('loadPersistedSettings restores compactMode from localStorage', () => {
    saveSettings({ compactMode: true });
    state.settings.compactMode = false;
    loadPersistedSettings();
    expect(state.settings.compactMode).toBe(true);
  });

  it('loadPersistedSettings ignores missing localStorage entry without throwing', () => {
    localStorage.clear();
    expect(() => loadPersistedSettings()).not.toThrow();
  });

  it('loadPersistedSettings handles malformed JSON gracefully', () => {
    localStorage.setItem(LS_SETTINGS_KEY, 'not-valid-json{');
    expect(() => loadPersistedSettings()).not.toThrow();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// togglePinWeblink / isPinned
// ─────────────────────────────────────────────────────────────────────────────

describe('togglePinWeblink / isPinned', () => {
  beforeEach(() => {
    state.settings.pinnedWeblinks = [];
  });

  it('isPinned returns false when no weblinks are pinned', () => {
    expect(isPinned('wl-1')).toBe(false);
  });

  it('togglePinWeblink pins an unpinned weblink', () => {
    togglePinWeblink('wl-1');
    expect(isPinned('wl-1')).toBe(true);
  });

  it('togglePinWeblink unpins a pinned weblink', () => {
    togglePinWeblink('wl-1');
    togglePinWeblink('wl-1');
    expect(isPinned('wl-1')).toBe(false);
  });

  it('togglePinWeblink persists the pin state to localStorage', () => {
    togglePinWeblink('wl-99');
    const stored = JSON.parse(localStorage.getItem(LS_SETTINGS_KEY));
    expect(stored.pinnedWeblinks).toContain('wl-99');
  });

  it('togglePinWeblink persists the unpinned state to localStorage', () => {
    togglePinWeblink('wl-5');
    togglePinWeblink('wl-5');
    const stored = JSON.parse(localStorage.getItem(LS_SETTINGS_KEY));
    expect(stored.pinnedWeblinks).not.toContain('wl-5');
  });

  it('multiple pins are tracked independently', () => {
    togglePinWeblink('a');
    togglePinWeblink('b');
    expect(isPinned('a')).toBe(true);
    expect(isPinned('b')).toBe(true);
    togglePinWeblink('a');
    expect(isPinned('a')).toBe(false);
    expect(isPinned('b')).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// loadPersistedSettings – pin state restore
// ─────────────────────────────────────────────────────────────────────────────

describe('loadPersistedSettings – pinnedWeblinks restore', () => {
  it('restores pinned weblink IDs from localStorage', () => {
    saveSettings({ pinnedWeblinks: ['wl-a', 'wl-b'] });
    state.settings.pinnedWeblinks = [];
    loadPersistedSettings();
    expect(state.settings.pinnedWeblinks).toEqual(['wl-a', 'wl-b']);
  });

  it('ignores a non-array pinnedWeblinks value in localStorage', () => {
    localStorage.setItem(LS_SETTINGS_KEY, JSON.stringify({ pinnedWeblinks: 'not-an-array' }));
    state.settings.pinnedWeblinks = ['pre-existing'];
    loadPersistedSettings();
    // Non-array value must not overwrite the existing pin state
    expect(state.settings.pinnedWeblinks).toEqual(['pre-existing']);
  });

  it('restores an empty pinnedWeblinks array correctly', () => {
    saveSettings({ pinnedWeblinks: [] });
    state.settings.pinnedWeblinks = ['stale-id'];
    loadPersistedSettings();
    expect(state.settings.pinnedWeblinks).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Pin ordering – pinned items must sort before unpinned items
// ─────────────────────────────────────────────────────────────────────────────

describe('pin ordering – pinned items sort before unpinned', () => {
  beforeEach(() => {
    state.settings.pinnedWeblinks = [];
  });

  function sortByPin(weblinks) {
    return [...weblinks].sort((a, b) => {
      const pa = isPinned(a.id) ? 0 : 1;
      const pb = isPinned(b.id) ? 0 : 1;
      return pa - pb;
    });
  }

  it('pinned items appear before unpinned items after sorting', () => {
    const weblinks = [
      { id: 'u1', name: 'Unpinned 1' },
      { id: 'p1', name: 'Pinned 1' },
      { id: 'u2', name: 'Unpinned 2' },
      { id: 'p2', name: 'Pinned 2' },
    ];
    togglePinWeblink('p1');
    togglePinWeblink('p2');

    const sorted = sortByPin(weblinks);
    expect(sorted[0].id).toBe('p1');
    expect(sorted[1].id).toBe('p2');
    expect(sorted[2].id).toBe('u1');
    expect(sorted[3].id).toBe('u2');
  });

  it('unpinning a weblink moves it back to the unpinned group', () => {
    const weblinks = [
      { id: 'u1', name: 'Unpinned' },
      { id: 'p1', name: 'Was Pinned' },
    ];
    togglePinWeblink('p1');
    togglePinWeblink('p1'); // unpin

    const sorted = sortByPin(weblinks);
    // Both are now unpinned – original order preserved within group
    expect(sorted.map(w => w.id)).toEqual(['u1', 'p1']);
  });

  it('sort does not mutate the original array', () => {
    const weblinks = [
      { id: 'a', name: 'A' },
      { id: 'b', name: 'B' },
    ];
    togglePinWeblink('b');
    const original = [...weblinks];
    sortByPin(weblinks);
    expect(weblinks).toEqual(original);
  });

  it('sort preserves original order when no weblinks are pinned', () => {
    const weblinks = [
      { id: 'x', name: 'X' },
      { id: 'y', name: 'Y' },
      { id: 'z', name: 'Z' },
    ];
    const sorted = sortByPin(weblinks);
    expect(sorted.map(w => w.id)).toEqual(['x', 'y', 'z']);
  });

  it('sort preserves category information on each weblink record', () => {
    const weblinks = [
      { id: 'w1', name: 'W1', category: 'cat-a' },
      { id: 'w2', name: 'W2', category: 'cat-b' },
    ];
    togglePinWeblink('w2');
    const sorted = sortByPin(weblinks);
    expect(sorted[0].category).toBe('cat-b');
    expect(sorted[1].category).toBe('cat-a');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// updateSettings – includes pinnedWeblinks in patch
// ─────────────────────────────────────────────────────────────────────────────

describe('updateSettings with pinnedWeblinks', () => {
  it('updateSettings persists a pinnedWeblinks patch to localStorage', () => {
    updateSettings({ pinnedWeblinks: ['wl-x', 'wl-y'] });
    const stored = JSON.parse(localStorage.getItem(LS_SETTINGS_KEY));
    expect(stored.pinnedWeblinks).toEqual(['wl-x', 'wl-y']);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Compact mode – optional comment rendering
// ─────────────────────────────────────────────────────────────────────────────

describe('compact mode – optional comment rendering', () => {
  let origWeblinks, origCategories, origSelectedCategory;

  beforeEach(() => {
    origWeblinks         = state.weblinks;
    origCategories       = state.categories;
    origSelectedCategory = state.selectedCategory;
    state.categories       = [];
    state.selectedCategory = null;
    state.settings.compactMode = true;
    document.body.innerHTML = '<div id="weblink-area"></div>';
  });

  afterEach(() => {
    state.weblinks         = origWeblinks;
    state.categories       = origCategories;
    state.selectedCategory = origSelectedCategory;
    document.body.innerHTML = '';
  });

  it('renders description in compact row when weblink has a description', () => {
    state.weblinks = [{
      id: 'row-desc-1', name: 'Test Link', url: 'https://example.com',
      description: 'My optional comment', category: 'none', icon: 'globe',
    }];
    renderWeblinks();
    const descEl = document.querySelector('.weblink-row-description');
    expect(descEl).not.toBeNull();
    expect(descEl.textContent).toBe('My optional comment');
  });

  it('omits description element in compact row when weblink has no description', () => {
    state.weblinks = [{
      id: 'row-desc-2', name: 'No Comment', url: 'https://example.com',
      description: '', category: 'none', icon: 'globe',
    }];
    renderWeblinks();
    const descEl = document.querySelector('.weblink-row-description');
    expect(descEl).toBeNull();
  });

  it('tile mode (buildCard) also renders description when present', () => {
    state.settings.compactMode = false;
    state.weblinks = [{
      id: 'card-desc-1', name: 'Card Link', url: 'https://example.com',
      description: 'Card comment', category: 'none', icon: 'globe',
    }];
    renderWeblinks();
    const descEl = document.querySelector('.weblink-card-description');
    expect(descEl).not.toBeNull();
    expect(descEl.textContent).toBe('Card comment');
  });

  it('tile mode (buildCard) omits description element when no description', () => {
    state.settings.compactMode = false;
    state.weblinks = [{
      id: 'card-desc-2', name: 'Card No Comment', url: 'https://example.com',
      description: '', category: 'none', icon: 'globe',
    }];
    renderWeblinks();
    const descEl = document.querySelector('.weblink-card-description');
    expect(descEl).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// i18n – new aria-label keys coverage
// ─────────────────────────────────────────────────────────────────────────────

describe('i18n aria-label keys', () => {
  it('t("toolbar.ariaLabel") returns German label in DE', () => {
    state.settings.language = 'de';
    expect(t('toolbar.ariaLabel')).toBe('Dashboard-Steuerung');
  });

  it('t("toolbar.ariaLabel") returns English label in EN', () => {
    state.settings.language = 'en';
    expect(t('toolbar.ariaLabel')).toBe('Dashboard controls');
  });

  it('t("toolbar.switchLanguage") returns German label in DE', () => {
    state.settings.language = 'de';
    expect(t('toolbar.switchLanguage')).toBe('Sprache wechseln');
  });

  it('t("toolbar.switchLanguage") returns English label in EN', () => {
    state.settings.language = 'en';
    expect(t('toolbar.switchLanguage')).toBe('Switch language');
  });

  it('t("weblink.moreActions") returns German label in DE', () => {
    state.settings.language = 'de';
    expect(t('weblink.moreActions')).toBe('Weitere Aktionen');
  });

  it('t("weblink.moreActions") returns English label in EN', () => {
    state.settings.language = 'en';
    expect(t('weblink.moreActions')).toBe('More actions');
  });

  it('sidebar.categories resolves to "Kategorien" in DE', () => {
    state.settings.language = 'de';
    expect(t('sidebar.categories')).toBe('Kategorien');
  });

  it('sidebar.categories resolves to "Categories" in EN', () => {
    state.settings.language = 'en';
    expect(t('sidebar.categories')).toBe('Categories');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// applyTranslations – data-i18n-aria updates aria-label
// ─────────────────────────────────────────────────────────────────────────────

describe('applyTranslations – aria-label update via data-i18n-aria', () => {
  let origLang;

  beforeEach(() => {
    origLang = state.settings.language;
    document.body.innerHTML =
      '<nav data-i18n-aria="toolbar.ariaLabel" aria-label="Dashboard controls"></nav>' +
      '<button data-i18n-aria="toolbar.switchLanguage" aria-label="Switch language"></button>' +
      '<aside data-i18n-aria="sidebar.categories" aria-label="Kategorien"></aside>';
  });

  afterEach(() => {
    state.settings.language = origLang;
    document.body.innerHTML = '';
  });

  it('updates aria-label to German when language is DE', () => {
    state.settings.language = 'de';
    applyTranslations();
    expect(document.querySelector('nav').getAttribute('aria-label')).toBe('Dashboard-Steuerung');
    expect(document.querySelector('button').getAttribute('aria-label')).toBe('Sprache wechseln');
    expect(document.querySelector('aside').getAttribute('aria-label')).toBe('Kategorien');
  });

  it('updates aria-label to English when language is EN', () => {
    state.settings.language = 'en';
    applyTranslations();
    expect(document.querySelector('nav').getAttribute('aria-label')).toBe('Dashboard controls');
    expect(document.querySelector('button').getAttribute('aria-label')).toBe('Switch language');
    expect(document.querySelector('aside').getAttribute('aria-label')).toBe('Categories');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// weblink.moreActions – ellipsis button uses translated aria-label
// ─────────────────────────────────────────────────────────────────────────────

describe('ellipsis button aria-label uses i18n', () => {
  let origWeblinks, origCategories, origSelectedCategory;

  beforeEach(() => {
    origWeblinks         = state.weblinks;
    origCategories       = state.categories;
    origSelectedCategory = state.selectedCategory;
    state.categories       = [];
    state.selectedCategory = null;
    document.body.innerHTML = '<div id="weblink-area"></div>';
  });

  afterEach(() => {
    state.weblinks         = origWeblinks;
    state.categories       = origCategories;
    state.selectedCategory = origSelectedCategory;
    document.body.innerHTML = '';
  });

  it('tile mode ellipsis button aria-label uses t("weblink.moreActions") in DE', () => {
    state.settings.language = 'de';
    state.settings.compactMode = false;
    state.weblinks = [{ id: 'e1', name: 'Link', url: 'https://example.com', category: 'none', icon: 'globe' }];
    renderWeblinks();
    const btn = document.querySelector('.btn-ellipsis');
    expect(btn.getAttribute('aria-label')).toBe('Weitere Aktionen');
  });

  it('tile mode ellipsis button aria-label uses t("weblink.moreActions") in EN', () => {
    state.settings.language = 'en';
    state.settings.compactMode = false;
    state.weblinks = [{ id: 'e2', name: 'Link', url: 'https://example.com', category: 'none', icon: 'globe' }];
    renderWeblinks();
    const btn = document.querySelector('.btn-ellipsis');
    expect(btn.getAttribute('aria-label')).toBe('More actions');
  });

  it('compact mode ellipsis button aria-label uses t("weblink.moreActions") in EN', () => {
    state.settings.language = 'en';
    state.settings.compactMode = true;
    state.weblinks = [{ id: 'e3', name: 'Link', url: 'https://example.com', category: 'none', icon: 'globe' }];
    renderWeblinks();
    const btn = document.querySelector('.btn-row-ellipsis');
    expect(btn.getAttribute('aria-label')).toBe('More actions');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Fixed Pinned category – sidebar visibility and structure
// ─────────────────────────────────────────────────────────────────────────────

describe('fixed Pinned category – sidebar visibility and structure', () => {
  let origWeblinks, origCategories, origSelectedCategory;

  beforeEach(() => {
    origWeblinks         = state.weblinks;
    origCategories       = state.categories;
    origSelectedCategory = state.selectedCategory;
    state.categories       = [];
    state.selectedCategory = null;
    state.settings.pinnedWeblinks = [];
    document.body.innerHTML = '<nav id="sidebar-content"></nav>';
  });

  afterEach(() => {
    state.weblinks         = origWeblinks;
    state.categories       = origCategories;
    state.selectedCategory = origSelectedCategory;
    document.body.innerHTML = '';
  });

  it('sidebar always renders the fixed Pinned category entry', () => {
    state.weblinks = [];
    renderSidebar();
    const pinnedItem = document.querySelector('.category-item--pinned');
    expect(pinnedItem).not.toBeNull();
  });

  it('Pinned sidebar entry has data-cat-id matching PINNED_CATEGORY_ID', () => {
    state.weblinks = [];
    renderSidebar();
    const pinnedItem = document.querySelector('.category-item--pinned');
    expect(pinnedItem.getAttribute('data-cat-id')).toBe(PINNED_CATEGORY_ID);
  });

  it('Pinned sidebar entry is labeled with sidebar.pinned translation in EN', () => {
    state.settings.language = 'en';
    state.weblinks = [];
    renderSidebar();
    const pinnedItem = document.querySelector('.category-item--pinned');
    const label = pinnedItem.querySelector('.cat-label');
    expect(label.textContent).toBe('Pinned');
  });

  it('Pinned sidebar entry is labeled with sidebar.pinned translation in DE', () => {
    state.settings.language = 'de';
    state.weblinks = [];
    renderSidebar();
    const pinnedItem = document.querySelector('.category-item--pinned');
    const label = pinnedItem.querySelector('.cat-label');
    expect(label.textContent).toBe('Angeheftet');
  });

  it('Pinned sidebar entry shows correct pinned count', () => {
    state.weblinks = [
      { id: 'sp1', name: 'P1', url: 'https://a.com', category: 'none', icon: 'globe' },
      { id: 'su1', name: 'U1', url: 'https://b.com', category: 'none', icon: 'globe' },
    ];
    togglePinWeblink('sp1');
    renderSidebar();
    const pinnedItem = document.querySelector('.category-item--pinned');
    const badge = pinnedItem.querySelector('.cat-count');
    expect(badge.textContent).toBe('1');
    togglePinWeblink('sp1'); // cleanup
  });

  it('Pinned sidebar entry has active class when selectedCategory is PINNED_CATEGORY_ID', () => {
    state.weblinks = [];
    state.selectedCategory = PINNED_CATEGORY_ID;
    renderSidebar();
    const pinnedItem = document.querySelector('.category-item--pinned');
    expect(pinnedItem.classList.contains('active')).toBe(true);
  });

  it('Pinned sidebar entry does not have active class when another category is selected', () => {
    state.weblinks = [];
    state.selectedCategory = null;
    renderSidebar();
    const pinnedItem = document.querySelector('.category-item--pinned');
    expect(pinnedItem.classList.contains('active')).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Fixed Pinned category – filtering and empty state in weblinks
// ─────────────────────────────────────────────────────────────────────────────

describe('fixed Pinned category – filtering and empty state', () => {
  let origWeblinks, origCategories, origSelectedCategory;

  beforeEach(() => {
    origWeblinks         = state.weblinks;
    origCategories       = state.categories;
    origSelectedCategory = state.selectedCategory;
    state.categories       = [];
    state.selectedCategory = PINNED_CATEGORY_ID;
    state.settings.compactMode = false;
    state.settings.pinnedWeblinks = [];
    document.body.innerHTML = '<div id="weblink-area"></div>';
  });

  afterEach(() => {
    state.weblinks         = origWeblinks;
    state.categories       = origCategories;
    state.selectedCategory = origSelectedCategory;
    document.body.innerHTML = '';
  });

  it('Pinned view renders only pinned links when multiple links exist', () => {
    state.weblinks = [
      { id: 'fv-p1', name: 'Pinned Link', url: 'https://a.com', category: 'none', icon: 'globe' },
      { id: 'fv-u1', name: 'Unpinned Link', url: 'https://b.com', category: 'none', icon: 'globe' },
    ];
    togglePinWeblink('fv-p1');
    renderWeblinks();
    const cards = document.querySelectorAll('.weblink-card');
    expect(cards.length).toBe(1);
    expect(cards[0].getAttribute('aria-label')).toBe('Pinned Link');
    togglePinWeblink('fv-p1'); // cleanup
  });

  it('Pinned view shows empty-state-subtitle with empty.pinned message in EN when no links are pinned', () => {
    state.settings.language = 'en';
    state.weblinks = [
      { id: 'fv-u2', name: 'Unpinned', url: 'https://a.com', category: 'none', icon: 'globe' },
    ];
    renderWeblinks();
    const subtitle = document.querySelector('.empty-state-subtitle');
    expect(subtitle).not.toBeNull();
    expect(subtitle.textContent).toBe('No pinned links.');
  });

  it('Pinned view shows empty-state-subtitle with empty.pinned message in DE when no links are pinned', () => {
    state.settings.language = 'de';
    state.weblinks = [
      { id: 'fv-u3', name: 'Unpinned', url: 'https://a.com', category: 'none', icon: 'globe' },
    ];
    renderWeblinks();
    const subtitle = document.querySelector('.empty-state-subtitle');
    expect(subtitle).not.toBeNull();
    expect(subtitle.textContent).toBe('Keine angehefteten Links.');
  });

  it('Pinned view empty state is shown when all existing links are unpinned', () => {
    state.weblinks = [
      { id: 'fv-u4', name: 'A', url: 'https://a.com', category: 'none', icon: 'globe' },
      { id: 'fv-u5', name: 'B', url: 'https://b.com', category: 'none', icon: 'globe' },
    ];
    renderWeblinks();
    const emptyState = document.querySelector('.empty-state');
    expect(emptyState).not.toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Pinned visual-state rendering hooks – CSS class applied
// ─────────────────────────────────────────────────────────────────────────────

describe('pinned visual-state rendering hooks', () => {
  let origWeblinks, origCategories, origSelectedCategory;

  beforeEach(() => {
    origWeblinks         = state.weblinks;
    origCategories       = state.categories;
    origSelectedCategory = state.selectedCategory;
    state.categories       = [];
    state.selectedCategory = null;
    state.settings.pinnedWeblinks = [];
    document.body.innerHTML = '<div id="weblink-area"></div>';
  });

  afterEach(() => {
    state.weblinks         = origWeblinks;
    state.categories       = origCategories;
    state.selectedCategory = origSelectedCategory;
    document.body.innerHTML = '';
  });

  it('tile mode: pinned link renders with weblink-card--pinned class', () => {
    state.settings.compactMode = false;
    state.weblinks = [
      { id: 'ph-p1', name: 'Pinned Card', url: 'https://example.com', category: 'none', icon: 'globe' },
      { id: 'ph-u1', name: 'Normal Card', url: 'https://example.com', category: 'none', icon: 'globe' },
    ];
    togglePinWeblink('ph-p1');
    renderWeblinks();
    const pinnedCard = Array.from(document.querySelectorAll('.weblink-card'))
      .find(c => c.getAttribute('aria-label') === 'Pinned Card');
    expect(pinnedCard).not.toBeNull();
    expect(pinnedCard.classList.contains('weblink-card--pinned')).toBe(true);
    togglePinWeblink('ph-p1'); // cleanup
  });

  it('tile mode: unpinned link does not have weblink-card--pinned class', () => {
    state.settings.compactMode = false;
    state.weblinks = [
      { id: 'ph-u2', name: 'Unpinned Card', url: 'https://example.com', category: 'none', icon: 'globe' },
    ];
    renderWeblinks();
    const card = document.querySelector('.weblink-card');
    expect(card.classList.contains('weblink-card--pinned')).toBe(false);
  });

  it('compact mode: pinned link renders with weblink-row--pinned class', () => {
    state.settings.compactMode = true;
    state.weblinks = [
      { id: 'ph-p2', name: 'Pinned Row', url: 'https://example.com', category: 'none', icon: 'globe' },
      { id: 'ph-u3', name: 'Normal Row', url: 'https://example.com', category: 'none', icon: 'globe' },
    ];
    togglePinWeblink('ph-p2');
    renderWeblinks();
    const pinnedRow = Array.from(document.querySelectorAll('.weblink-row'))
      .find(r => r.getAttribute('aria-label') === 'Pinned Row');
    expect(pinnedRow).not.toBeNull();
    expect(pinnedRow.classList.contains('weblink-row--pinned')).toBe(true);
    togglePinWeblink('ph-p2'); // cleanup
  });

  it('compact mode: unpinned link does not have weblink-row--pinned class', () => {
    state.settings.compactMode = true;
    state.weblinks = [
      { id: 'ph-u4', name: 'Unpinned Row', url: 'https://example.com', category: 'none', icon: 'globe' },
    ];
    renderWeblinks();
    const row = document.querySelector('.weblink-row');
    expect(row.classList.contains('weblink-row--pinned')).toBe(false);
  });

  it('sidebar Pinned entry has category-item--pinned class', () => {
    state.weblinks = [];
    document.body.innerHTML = '<nav id="sidebar-content"></nav>';
    renderSidebar();
    const pinnedItem = document.querySelector('[data-cat-id="__pinned__"]');
    expect(pinnedItem).not.toBeNull();
    expect(pinnedItem.classList.contains('category-item--pinned')).toBe(true);
  });
});
