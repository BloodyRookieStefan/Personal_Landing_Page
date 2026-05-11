## REQ-000: General

### Description
The dashboard shall be runnable locally as a static application, comparable to opening an HTML file on a local machine.

The dashboard shall not depend on a server-side runtime, backend service, or permanent network connection for its core functionality.

The dashboard shall use a plain front-end stack consisting of HTML, CSS, and JavaScript without relying on a modern JavaScript framework.

The application entry point shall be a locally openable HTML file and shall not require starting a local development server.

### Requirement
The system shall be executable locally without server deployment and shall support use as a static client-side application.

The system shall be implemented using only HTML, CSS, and JavaScript and shall not require a modern JavaScript framework.

The system shall use an HTML file as its local entry point and shall be usable without starting a local server.

Keep the code clean. If unused code is detected. It shall be removed



### Acceptance Criteria
1. The dashboard can be started and used on a local machine without deploying it to a web server.
2. The core dashboard functionality does not require a backend service.
3. The core dashboard functionality does not require a permanent internet connection after the application files are available locally.
4. The application architecture is based on client-side execution only.
5. The application can be opened locally through its HTML entry file.
6. No local server needs to be started in order to use the dashboard.
7. The front end is implemented with HTML, CSS, and JavaScript only.
8. The implementation does not depend on a modern JavaScript framework.

