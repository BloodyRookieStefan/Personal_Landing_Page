## REQ-003: Storage

### Description
Weblinks shall be stored in a suitable file-based format instead of browser storage.

Whenever the page is loaded, the system shall detect whether the underlying file has changed since the last synchronized state.

If the file has changed, the system shall ask the user whether the updated file should be synchronized into the application.

When the user creates a new weblink through the website, the system shall write the new weblink to the file.

### Requirement
The system shall persist weblinks in a structured file-based format and shall not use browser storage as the primary storage location for weblink data.

The system shall check for changes in the weblink storage file whenever the page is loaded.

If the storage file has changed, the system shall prompt the user to confirm whether the updated file should be synchronized with the application state.

The system shall write every newly created weblink from the website back to the storage file.

### Acceptance Criteria
1. Weblink data is stored in a file and not exclusively in browser storage.
2. The file uses a structured format that allows the system to read and write weblink records reliably.
3. Each time the page is loaded, the system checks whether the storage file has changed since the last synchronization.
4. If the storage file has changed, the user is prompted to decide whether the updated file should be synchronized.
5. If the user confirms synchronization, the system imports the changed data from the file into the application.
6. If the user declines synchronization, the system keeps the current application state unchanged.
7. When the user adds a new weblink through the website, the new weblink is written to the storage file.
8. After a newly created weblink is written to the file, the stored file content reflects the new weblink data.


