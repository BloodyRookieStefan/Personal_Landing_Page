## REQ-001: Dashboard

### Description
The dashboard shall provide a navigational overview of all categories and weblinks.

The dashboard shall support both light mode and dark mode.

The dashboard shall support German and English translations.

The user shall be able to switch the active language and the active visual theme.

The dashboard shall provide a compact view mode in which the weblinks are displayed like a list from left to right.

All user settings, including the selected theme, language, and display mode, shall be stored in the browser.

The dashboard layout shall display the category list in a sidebar on the left and the weblink tiles on the right.

Each weblink tile shall display the weblink name, the assigned category, and an optional comment when one is available.

### Requirement
The system shall provide a dashboard with a left-hand category bar and a right-hand tile area for displaying weblinks.

The system shall allow the user to switch between light mode and dark mode.

The system shall allow the user to switch the user interface language between German and English.

The system shall provide a compact display mode that presents weblinks in a list-like layout from left to right.

The system shall persist all user interface settings in the browser so that the selected preferences are restored when the application is reopened in the same browser.

The system shall display each weblink as a modern tile containing the weblink name, its category, and an optional comment if a comment has been provided.

### Acceptance Criteria
1. The dashboard displays a category bar on the left side of the screen.
2. The dashboard displays the weblink tiles on the right side of the screen.
3. The user can switch the dashboard between light mode and dark mode.
4. The selected visual theme remains active after the browser is reloaded.
5. The user can switch the user interface language between German and English.
6. The selected language remains active after the browser is reloaded.
7. The system stores user interface settings in the browser.
8. The user can enable a compact display mode.
9. In compact display mode, the weblinks are shown in a list-like layout from left to right.
10. The selected display mode remains active after the browser is reloaded.
11. Each weblink tile displays the weblink name.
12. Each weblink tile displays the assigned category.
13. Each weblink tile displays a comment when a comment is available.
14. Each weblink tile omits the comment area when no comment is available.


