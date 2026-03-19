# FreelanceFlow — Full Build Task Checklist

## Backend — New Models
- [ ] `server/models/Project.js` — client ref, title, status, budget, deadline
- [ ] `server/models/Task.js` — project ref, title, status, dueDate, priority
- [ ] `server/models/TimeLog.js` — task/project ref, startTime, endTime, duration, billed
- [ ] `server/models/Invoice.js` — client ref, items[], total, status, invoiceNumber, dueDate

## Backend — Controllers & Routes
- [ ] `server/controllers/projectController.js` (CRUD)
- [ ] `server/routes/projectRoutes.js`
- [ ] `server/controllers/taskController.js` (CRUD)
- [ ] `server/routes/taskRoutes.js`
- [ ] `server/controllers/timeLogController.js` (start/stop/manual/list)
- [ ] `server/routes/timeLogRoutes.js`
- [ ] `server/controllers/invoiceController.js` (CRUD + generate from time logs + mark paid)
- [ ] `server/routes/invoiceRoutes.js`
- [ ] `server/controllers/dashboardController.js` (aggregate stats)
- [ ] `server/routes/dashboardRoutes.js`
- [ ] `server/controllers/sampleDataController.js` (seed endpoint)
- [ ] `server/routes/sampleDataRoutes.js`
- [x] Register all new routes in [server/server.js](file:///C:/Users/KHfar/Desktop/FreelanceFlow/server/server.js)

## Backend — Install New Packages
- [ ] `npm install pdfkit` (PDF invoice generation)

## Frontend — Install New Packages
- [ ] `npm install recharts @heroicons/react` (charts + icons)

## Frontend — New Pages
- [ ] `client/src/pages/Projects.jsx` — list, add, edit, delete; status badge
- [ ] `client/src/pages/ProjectDetail.jsx` — tasks list + time logs for a project
- [ ] `client/src/pages/Tasks.jsx` — all tasks across projects with filter
- [ ] `client/src/pages/TimeTracker.jsx` — stopwatch + manual entry + log list
- [ ] `client/src/pages/Invoices.jsx` — list, create from time logs, mark paid, download PDF
- [ ] `client/src/pages/Analytics.jsx` — revenue charts, outstanding payments

## Frontend — Component Updates
- [ ] [client/src/pages/Dashboard.jsx](file:///C:/Users/KHfar/Desktop/FreelanceFlow/client/src/pages/Dashboard.jsx) — real stats from API (revenue, active projects, pending invoices)
- [ ] [client/src/components/Layout.jsx](file:///c:/Users/KHfar/Desktop/FreelanceFlow/client/src/components/Layout.jsx) — add Projects, Tasks, Time Tracker, Invoices, Analytics links
- [ ] [client/src/App.jsx](file:///C:/Users/KHfar/Desktop/FreelanceFlow/client/src/App.jsx) — add all new routes

## Frontend — Utility
- [ ] [client/src/lib/api.js](file:///c:/Users/KHfar/Desktop/FreelanceFlow/client/src/lib/api.js) — already exists, no change needed
- [ ] [client/src/store/authStore.js](file:///c:/Users/KHfar/Desktop/FreelanceFlow/client/src/store/authStore.js) — already exists, no change needed
