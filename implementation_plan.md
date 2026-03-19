# FreelanceFlow — Full SaaS Implementation Plan

## What's Already Built ✅
- Auth (JWT access + refresh tokens, register/login/logout)
- Clients CRUD with freemium (2-client limit on free plan)
- Dashboard with placeholder stats
- Dark theme sidebar layout

---

## Architecture

```
Client (Browser) ──► React + Zustand + Axios
                         │
                         ▼
                  Express REST API (port 5000)
                         │
                    JWT Auth Middleware
                         │
            ┌────────────┼────────────────┐
            ▼            ▼                ▼
         MongoDB      PDFKit          Recharts
        (Mongoose)   (server PDF)    (client charts)
```

**Data Hierarchy:**
```
User → Client → Project → Task → TimeLog → Invoice
```

---

## Phase 1 — CRM Backend (Projects + Tasks)

### Backend Models

#### [NEW] `server/models/Project.js`
```js
{ user, client(ref), title, description,
  status: ['planning','active','completed','cancelled'],
  budget, currency, deadline, timestamps }
```

#### [NEW] `server/models/Task.js`
```js
{ user, project(ref), client(ref), title, description,
  status: ['todo','in_progress','done'],
  priority: ['low','medium','high'],
  dueDate, estimatedHours, timestamps }
```

#### [NEW] `server/models/TimeLog.js`
```js
{ user, project(ref), task(ref, optional), description,
  startTime, endTime, duration(minutes),
  hourlyRate, amount, billed(bool), timestamps }
```

#### [NEW] `server/models/Invoice.js`
```js
{ user, client(ref), project(ref, optional),
  invoiceNumber(auto: FF-2024-001),
  items: [{ description, hours, rate, amount }],
  subtotal, taxRate, taxAmount, total,
  status: ['draft','sent','paid','overdue'],
  dueDate, notes, paidAt, timeLogs(refs), timestamps }
```

---

## Phase 2 — Time Tracking

**Timer persistence strategy:** Store `timerStart` timestamp in localStorage. When page refreshes, calculate elapsed time as `Date.now() - timerStart`. This makes the timer resilient to page refreshes.

**Backend endpoints:**
- `POST /api/v1/timelogs/start` — creates a log with `startTime = now`
- `PUT /api/v1/timelogs/:id/stop` — sets `endTime`, calculates `duration`
- `POST /api/v1/timelogs/manual` — creates a complete log with manual duration
- `GET /api/v1/timelogs?projectId=X` — fetch logs for a project

---

## Phase 3 — Invoice Generation

**Workflow:**
1. User selects a client + date range
2. Backend fetches all **unbilled** time logs for that client
3. Groups by project, calculates totals
4. Creates Invoice document, marks time logs as `billed: true`
5. Server generates PDF using **PDFKit** and streams it to the browser

**Why PDFKit on the server?** It runs in Node.js without a browser, creates professional PDFs, and avoids CORS issues. The frontend just downloads the binary stream.

**Invoice number format:** `FF-YYYY-NNN` (e.g., `FF-2024-001`) — auto-incremented per user.

---

## Phase 4 — Analytics Dashboard

**Charts (Recharts):**
- Monthly Revenue bar chart (last 6 months of paid invoices)
- Revenue by Client pie chart
- Outstanding payments (sent+overdue invoices total)
- Active projects count

**Backend:** Single `GET /api/v1/dashboard/stats` endpoint aggregates all data with MongoDB `$group` and `$match` pipelines for performance.

---

## Phase 5 — Polish & SaaS Tier

**Free Plan limits enforced server-side:**
- Max 2 clients
- No PDF download (return 403 with upgrade message)

**Sample Data Seeder:** `POST /api/v1/seed` — creates 3 clients, 5 projects, 10 tasks, 15 time logs, 3 invoices for the authenticated user. Frontend has a "Load Sample Data" button on the Dashboard.

---

## New Files Summary

| Layer | New Files |
|-------|-----------|
| Models | Project, Task, TimeLog, Invoice |
| Controllers | project, task, timeLog, invoice, dashboard, seed |
| Routes | project, task, timeLog, invoice, dashboard, seed |
| Pages | Projects, ProjectDetail, Tasks, TimeTracker, Invoices, Analytics |
| Modified | Dashboard, Layout, App |

---

## Verification Plan

1. **Full user flow**: Register → Add Client → Add Project → Add Task → Start/Stop Timer → Generate Invoice → Download PDF
2. **Freemium**: Try adding 3rd client on free plan → should be blocked
3. **Analytics**: Seed data → check Dashboard charts show correct numbers
4. **PDF**: Generate invoice → verify PDF downloads and has correct totals
5. **Security**: Log in as User B → try to GET User A's project ID → should return 404
