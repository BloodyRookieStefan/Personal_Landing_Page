## REQ-005: Import Old Firefox Bookmarks

### Description
The user shall be able to import existing bookmarks from Firefox through the dashboard.

Imported bookmarks shall be created as weblinks in the system.

All imported bookmarks shall automatically receive the default category "Imported".

### Requirement
The system shall provide an import function in the dashboard that allows the user to import old bookmarks from Firefox.

The system shall create a weblink entry for each imported Firefox bookmark.

The system shall assign the category "Imported" to every bookmark that is imported from Firefox.

### Acceptance Criteria
1. The dashboard provides a visible action for importing bookmarks from Firefox.
2. The user can start the Firefox bookmark import from the dashboard.
3. The system imports existing Firefox bookmarks into the application.
4. For each imported Firefox bookmark, the system creates a weblink entry.
5. Every imported Firefox bookmark is assigned to the category "Imported".
6. The import does not assign the category "Not defined" to imported Firefox bookmarks.


