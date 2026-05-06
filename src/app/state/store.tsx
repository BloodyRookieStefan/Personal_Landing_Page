import React, { createContext, useContext, useReducer, type Dispatch } from 'react';
import type { Weblink } from '../../domain/weblinks/model';
import type { Category } from '../../domain/categories/model';
import type { Settings } from '../../domain/settings/model';
import { DEFAULT_SETTINGS } from '../../domain/settings/model';
import type { StorageData } from '../../services/storage/serializers';

export type StorageStatus = 'uninitialized' | 'setup-required' | 'ready' | 'fallback' | 'error';

export interface SyncPromptData {
  incomingData: StorageData;
}

export interface AppState {
  weblinks: Weblink[];
  categories: Category[];
  settings: Settings;
  storageStatus: StorageStatus;
  storageError?: string;
  syncPrompt: SyncPromptData | null;
  selectedCategoryId: string | null;
}

export type AppAction =
  | {
      type: 'INIT';
      payload: {
        weblinks: Weblink[];
        categories: Category[];
        settings: Settings;
        storageStatus: StorageStatus;
      };
    }
  | { type: 'SET_STORAGE_STATUS'; payload: { status: StorageStatus; error?: string } }
  | { type: 'SET_SYNC_PROMPT'; payload: SyncPromptData | null }
  | { type: 'SYNC_ACCEPT'; payload: { weblinks: Weblink[]; categories: Category[] } }
  | { type: 'ADD_WEBLINK'; payload: Weblink }
  | { type: 'UPDATE_WEBLINK'; payload: Weblink }
  | { type: 'ADD_WEBLINKS'; payload: Weblink[] }
  | { type: 'ADD_CATEGORY'; payload: Category }
  | { type: 'DELETE_CATEGORY'; payload: { categoryId: string; fallbackCategoryId: string } }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<Settings> }
  | { type: 'SELECT_CATEGORY'; payload: string | null };

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'INIT':
      return { ...state, ...action.payload };

    case 'SET_STORAGE_STATUS':
      return { ...state, storageStatus: action.payload.status, storageError: action.payload.error };

    case 'SET_SYNC_PROMPT':
      return { ...state, syncPrompt: action.payload };

    case 'SYNC_ACCEPT':
      return {
        ...state,
        weblinks: action.payload.weblinks,
        categories: action.payload.categories,
        syncPrompt: null,
      };

    case 'ADD_WEBLINK':
      return { ...state, weblinks: [...state.weblinks, action.payload] };

    case 'UPDATE_WEBLINK':
      return {
        ...state,
        weblinks: state.weblinks.map(weblink =>
          weblink.id === action.payload.id ? action.payload : weblink
        ),
      };

    case 'ADD_WEBLINKS':
      return { ...state, weblinks: [...state.weblinks, ...action.payload] };

    case 'ADD_CATEGORY':
      return { ...state, categories: [...state.categories, action.payload] };

    case 'DELETE_CATEGORY': {
      const { categoryId, fallbackCategoryId } = action.payload;
      return {
        ...state,
        categories: state.categories.filter(c => c.id !== categoryId),
        weblinks: state.weblinks.map(w =>
          w.categoryId === categoryId ? { ...w, categoryId: fallbackCategoryId } : w
        ),
        selectedCategoryId:
          state.selectedCategoryId === categoryId ? null : state.selectedCategoryId,
      };
    }

    case 'UPDATE_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.payload } };

    case 'SELECT_CATEGORY':
      return { ...state, selectedCategoryId: action.payload };

    default:
      return state;
  }
}

const initialState: AppState = {
  weblinks: [],
  categories: [],
  settings: DEFAULT_SETTINGS,
  storageStatus: 'uninitialized',
  syncPrompt: null,
  selectedCategoryId: null,
};

interface AppContextValue {
  state: AppState;
  dispatch: Dispatch<AppAction>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>;
}

export function useAppState(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppState must be used within AppProvider');
  return ctx;
}
