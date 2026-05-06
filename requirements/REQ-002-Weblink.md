## REQ-002: Weblink

### Description
A weblink shall consist of the following attributes:

- URL
- Name
- Icon
- Description
- Category

Weblinks shall remain editable after they have been created.

### Requirement
The system shall store and display each weblink as a structured item containing a URL, a name, an icon, a description, and a category.

The system shall allow the user to edit an existing weblink after it has been created.

The system shall provide an ellipsis (`...`) action in the top-right corner of each weblink item that opens a context menu containing an `Edit` action.


### Acceptance Criteria
1. A weblink record contains exactly the following properties: URL, Name, Icon, Description, and Category.
2. The URL identifies the target address of the weblink.
3. The Name provides a human-readable title for the weblink.
4. The Icon provides a visual identifier for the weblink.
5. The Description provides additional explanatory text for the weblink.
6. The Category assigns the weblink to a logical grouping.
7. The system provides a predefined standard icon palette for icon selection.
8. The standard icon palette contains at least the following icons: Globe, Star, Bookmark, Folder, Home, Briefcase, Graduation Cap, Code, Shopping Cart, Heart, Camera, Music Note, Video, Newspaper, Message Circle, Wrench, Shield, Cloud, Calendar, and Link.
9. The user can edit an existing weblink after it has been created.
10. Each weblink item displays an ellipsis (`...`) action in its top-right corner.
11. Activating the ellipsis action opens a context menu that contains an `Edit` action.


