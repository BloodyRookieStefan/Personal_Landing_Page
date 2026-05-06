## REQ-004: Category

### Description
A category shall represent a logical grouping for weblinks.

Users shall be able to create and delete custom categories.

Each category shall have an assigned icon.

Each weblink shall belong to exactly one category.

The system shall provide the default categories "Imported" and "Not defined".

The default categories shall not be created or deleted by the user.

The default category for a new weblink shall be "Not defined".

### Requirement
The system shall manage categories for organizing weblinks.

The system shall allow users to create and delete custom categories and assign an icon to each category.

The system shall require every weblink to be assigned to a category.

The system shall always provide the default categories "Imported" and "Not defined", and these categories shall be protected from user creation and deletion.

The system shall assign "Not defined" as the default category when no other category has been selected for a weblink.

The system shall provide a standard icon palette for categories.

### Standard Icon Palette
The following icons shall be available as predefined standard icons for a weblink:

- Globe
- Star
- Bookmark
- Folder
- Home
- Briefcase
- Graduation Cap
- Code
- Shopping Cart
- Heart
- Camera
- Music Note
- Video
- Newspaper
- Message Circle
- Wrench
- Shield
- Cloud
- Calendar
- Link

### Acceptance Criteria
1. Users can create a custom category.
2. Users can delete a custom category.
3. Users can assign an icon to a category.
4. Each category has exactly one assigned icon.
5. Each weblink is assigned to exactly one category.
6. A weblink cannot exist without a category assignment.
7. The system provides the default category "Imported".
8. The system provides the default category "Not defined".
9. Users cannot create an additional category named "Imported".
10. Users cannot create an additional category named "Not defined".
11. Users cannot delete the default category "Imported".
12. Users cannot delete the default category "Not defined".
13. The system assigns "Not defined" as the default category for a weblink when no category is explicitly selected.


