import { describe, it, expect, beforeEach } from 'vitest';
import {
  loadSettings,
  saveSettings,
} from '../../src/services/settings/settings-storage-service';
import { DEFAULT_SETTINGS } from '../../src/domain/settings/model';

// jsdom provides localStorage; clear it before each test to avoid cross-test leakage.

beforeEach(() => {
  localStorage.clear();
});

describe('loadSettings', () => {
  it('returns DEFAULT_SETTINGS when nothing is stored', () => {
    const settings = loadSettings();
    expect(settings).toEqual(DEFAULT_SETTINGS);
  });

  it('merges persisted values over defaults', () => {
    saveSettings({ theme: 'dark', language: 'en', compactMode: true });
    const settings = loadSettings();
    expect(settings.theme).toBe('dark');
    expect(settings.language).toBe('en');
    expect(settings.compactMode).toBe(true);
  });

  it('returns defaults when stored JSON is corrupted', () => {
    localStorage.setItem('bookmark-dashboard-settings', 'not-valid-json{{');
    const settings = loadSettings();
    expect(settings).toEqual(DEFAULT_SETTINGS);
  });
});

describe('saveSettings then loadSettings round-trip', () => {
  it('persists theme across a reload (simulated by calling loadSettings again)', () => {
    saveSettings({ ...DEFAULT_SETTINGS, theme: 'dark' });
    const loaded = loadSettings();
    expect(loaded.theme).toBe('dark');
  });

  it('persists language across a reload', () => {
    saveSettings({ ...DEFAULT_SETTINGS, language: 'en' });
    const loaded = loadSettings();
    expect(loaded.language).toBe('en');
  });

  it('persists compactMode across a reload', () => {
    saveSettings({ ...DEFAULT_SETTINGS, compactMode: true });
    const loaded = loadSettings();
    expect(loaded.compactMode).toBe(true);
  });
});
