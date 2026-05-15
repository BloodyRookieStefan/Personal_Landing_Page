// Application constants

/** Current storage schema version */
const STORAGE_VERSION = 1;

/** Name used for the storage file when creating a new one */
const DEFAULT_STORAGE_FILE_NAME = 'weblinks.json';

/** localStorage key for persisted UI settings */
const LS_SETTINGS_KEY = 'dashboard_settings';

/** localStorage key for persisted sync fingerprint */
const LS_SYNC_HASH_KEY = 'dashboard_sync_hash';

/** localStorage key for the active storage mode ('direct' | 'manual') */
const LS_STORAGE_MODE_KEY = 'dashboard_storage_mode';

/** localStorage key for the last connected JSON file name */
const LS_STORAGE_FILE_NAME_KEY = 'dashboard_storage_file_name';

/** localStorage key for manual-mode file identity metadata (name, size, lastModified) */
const LS_STORAGE_FILE_META_KEY = 'dashboard_storage_file_meta';

/** IndexedDB database name used to persist the file handle */
const IDB_DB_NAME = 'dashboard-storage';

/** IndexedDB object store name for the file handle */
const IDB_STORE_NAME = 'handles';

/** IndexedDB key used to store the main file handle */
const IDB_HANDLE_KEY = 'mainHandle';

/** IndexedDB key used to cache the last loaded bookmark data */
const IDB_DATA_KEY = 'cachedData';

/** IDs of the protected default categories */
const DEFAULT_CATEGORY_IDS = Object.freeze({
  NOT_DEFINED: 'not-defined',
  IMPORTED:    'imported',
});

/** Reserved category names (lowercase) that users may not create */
const RESERVED_CATEGORY_NAMES = Object.freeze([
  'not defined',
  'not-defined',
  'imported',
  'pinned',
]);

/** Fixed synthetic category ID for the Pinned view */
const PINNED_CATEGORY_ID = '__pinned__';
