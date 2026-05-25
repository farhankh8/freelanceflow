<div align="center">
  <h1>🚀 FreelanceFlow</h1>
  <p><strong>Enterprise-Grade Freelance Management System</strong></p>

  ![Version](https://img.shields.io/badge/version-3.0.0-00D9FF?style=for-the-badge)
  ![Build](https://img.shields.io/badge/build-passing-00FF9D?style=for-the-badge)
  ![Node](https://img.shields.io/badge/node-%3E%3D18-339933?style=for-the-badge&logo=nodedotjs)
  ![React](https://img.shields.io/badge/react-19-61DAFB?style=for-the-badge&logo=react)
  ![MongoDB](https://img.shields.io/badge/mongodb-atlas-47A248?style=for-the-badge&logo=mongodb)
  ![License](https://img.shields.io/badge/license-MIT-FF6B6B?style=for-the-badge)

  <br/>

  [![Live App](https://img.shields.io/badge/🌐_Live_App-000?style=for-the-badge)](https://freelanceflow-blue-delta.vercel.app)
  [![API](https://img.shields.io/badge/⚡_API_Server-000?style=for-the-badge)](https://freelanceflow-api-80zc.onrender.com)
  [![GitHub](https://img.shields.io/badge/💻_Source_Code-000?style=for-the-badge)](https://github.com/farhankh8/FreelanceFlow)

</div>

---

## 📋 Overview

FreelanceFlow is a **full-stack, production-ready** freelance business management platform. It empowers freelancers and agencies to manage clients, projects, invoices, payments, time tracking, leads, workers, and more — all from a single, intuitive dashboard.

Built with the **MERN stack** (MongoDB, Express, React, Node.js) and deployed on **Vercel** + **Render**, it features **role-based access control**, **2FA authentication**, **real-time analytics**, **AI-powered assistant**, and **Razorpay payment integration**.

---

## ✨ Features

### Core Business Operations

| Module | Capabilities |
|--------|-------------|
| **👥 Client Management** | Full CRUD, advanced search & filtering, client portal access |
| **📁 Project Tracking** | Status workflows, budget tracking, deadlines, task breakdowns |
| **📄 Invoicing** | Auto-calculated invoices, GST support, PDF export via jsPDF |
| **💳 Payments** | Razorpay integration, payment history, receipt generation |
| **⏱️ Time Tracking** | Start/stop timer, manual entry, earnings calculation |
| **💰 Financial Dashboard** | Revenue charts, expense tracking, profit analysis |
| **👔 Lead Management** | Pipeline tracking, proposals, conversion analytics |

### Advanced Features

| Feature | Details |
|---------|---------|
| **🧠 AI Assistant** | Built-in AI chatbot for business insights and automation |
| **👥 Manager-Worker System** | Assign workers, track work sessions, manage worker payments |
| **📋 Contracts & Proposals** | Create, send, and manage contracts with e-signatures |
| **📞 Contact Management** | Centralized contact directory with groups |
| **📅 Calendar & Meetings** | Schedule management, meeting links, reminders |
| **📊 Reports** | Custom reports, exportable data, visual analytics |
| **🔐 Role-Based Access** | Manager, Worker, Admin, Viewer roles with granular permissions |

### Security & Infrastructure

| Feature | Implementation |
|---------|---------------|
| **Authentication** | JWT + bcrypt, Google OAuth (Passport), refresh tokens |
| **Two-Factor Auth** | TOTP via speakeasy, QR code setup |
| **Rate Limiting** | Global, auth-specific, and endpoint-level rate limits |
| **Input Validation** | Zod schemas + express-validator |
| **Security Headers** | Helmet.js with custom CSP |
| **Sanitization** | HTML sanitization on user inputs |
| **Account Lockout** | Auto-lock after failed login attempts |
| **Audit Logging** | Full audit trail for sensitive operations |

---

## 🛠️ Tech Stack

<div align="center">

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 19 + Vite 8 | UI framework & build tool |
| **State** | Zustand + TanStack Query | Client state & server state management |
| **Routing** | React Router v7 | Client-side routing |
| **UI/UX** | Framer Motion + Lucide React | Animations & icons |
| **Charts** | Recharts | Interactive data visualization |
| **Forms** | React Hook Form | Performant form handling |
| **PDF** | jsPDF + autoTable | Invoice PDF generation |
| **Backend** | Node.js + Express 5 | REST API server |
| **Database** | MongoDB + Mongoose 9 | NoSQL data storage |
| **Auth** | JWT + bcrypt + Passport | Authentication & authorization |
| **2FA** | Speakeasy + QRCode | Two-factor authentication |
| **Payments** | Razorpay | Payment gateway integration |
| **Email** | Nodemailer + EmailJS | Transactional emails |
| **AI** | Custom AI service | Intelligent assistant & automation |
| **Logging** | Pino + Morgan | Structured logging |
| **Deploy** | Vercel (FE) + Render (BE) | Cloud deployment |

</div>

---

## 🏗️ Architecture

```
                    ┌─────────────────────┐
                    │    Vercel (CDN)      │
                    │  React SPA (Vite)    │
                    │  client/             │
                    └─────────┬───────────┘
                              │ HTTPS
                    ┌─────────▼───────────┐
                    │  Render (Node.js)    │
                    │  Express API Server  │
                    │  server/             │
                    └─────────┬───────────┘
                              │
                    ┌─────────▼───────────┐
                    │  MongoDB Atlas       │
                    │  (Cloud Database)    │
                    └─────────────────────┘
```

### Security Layers

```
Request → Helmet → CORS → Rate Limiter → Auth Middleware → Validation → Route Handler
                                                                              │
                                                                       ┌──────▼──────┐
                                                                       │  MongoDB    │
                                                                       └─────────────┘
```

---

## 📁 Project Structure

```
FreelanceFlow/
├── client/                       # React Frontend (Vite)
│   ├── src/
│   │   ├── components/           # Reusable UI components
│   │   │   ├── AIChatbot.jsx     # AI assistant chatbot
│   │   │   ├── GlobalSearch.jsx  # Global search bar
│   │   │   ├── Layout.jsx        # App shell layout
│   │   │   ├── ProGate.jsx       # Pro plan gate
│   │   │   ├── ShareInvoice.jsx  # Invoice sharing
│   │   │   ├── Skeleton.jsx      # Loading skeletons
│   │   │   ├── Splash.jsx        # Splash screen
│   │   │   ├── UpgradeModal.jsx  # Plan upgrade modal
│   │   │   └── ErrorBoundary.jsx # Error boundary
│   │   ├── pages/                # Route pages
│   │   │   ├── Dashboard.jsx     # Analytics dashboard
│   │   │   ├── Clients.jsx       # Client management
│   │   │   ├── Projects.jsx      # Project tracking
│   │   │   ├── Tasks.jsx         # Task management
│   │   │   ├── Invoices.jsx      # Invoice generation
│   │   │   ├── Payments.jsx      # Payment tracking
│   │   │   ├── Expenses.jsx      # Expense tracking
│   │   │   ├── TimeLogs.jsx      # Time tracking
│   │   │   ├── Leads.jsx         # Lead pipeline
│   │   │   ├── Proposals.jsx     # Proposal management
│   │   │   ├── Contracts.jsx     # Contract management
│   │   │   ├── Contacts.jsx      # Contact directory
│   │   │   ├── Calendar.jsx      # Calendar & meetings
│   │   │   ├── Meetings.jsx      # Meeting scheduler
│   │   │   ├── Workers.jsx       # Worker management
│   │   │   ├── WorkerPayments.jsx# Worker payments
│   │   │   ├── Reports.jsx       # Custom reports
│   │   │   ├── Billing.jsx       # Subscription billing
│   │   │   ├── Settings.jsx      # User settings
│   │   │   ├── Help.jsx          # Help & support
│   │   │   ├── ClientPortal.jsx  # Client self-service
│   │   │   ├── Landing.jsx       # Marketing landing
│   │   │   ├── Login.jsx         # Authentication
│   │   │   ├── Register.jsx      # Registration
│   │   │   ├── ForgotPassword.jsx# Password recovery
│   │   │   ├── ResetPassword.jsx # Password reset
│   │   │   └── GoogleAuth.jsx    # OAuth callback
│   │   ├── store/                # Zustand state stores
│   │   │   ├── authStore.js      # Auth state
│   │   │   ├── timerStore.js     # Timer state
│   │   │   └── notificationStore.js# Notification state
│   │   ├── lib/                  # Utilities & config
│   │   │   ├── api.js            # Axios instance
│   │   │   ├── firebase.js       # Firebase config
│   │   │   └── queryClient.js    # TanStack Query config
│   │   ├── hooks/                # Custom React hooks
│   │   ├── assets/               # Static assets
│   │   ├── App.jsx               # Root component
│   │   ├── main.jsx              # Entry point
│   │   └── index.css             # Global styles
│   └── public/                   # Public assets
│
├── server/                       # Express Backend
│   ├── config/                   # Server configuration
│   │   ├── db.js                 # MongoDB connection
│   │   ├── email.js              # Email transporter
│   │   ├── logger.js             # Pino logger setup
│   │   └── passport.js           # Google OAuth strategy
│   ├── middleware/               # Express middleware
│   │   ├── auth.js               # JWT verification
│   │   ├── roleAuth.js           # Role-based access
│   │   ├── checkPlanLimit.js     # Plan quota checks
│   │   └── asyncHandler.js       # Async error wrapper
│   ├── models/                   # Mongoose schemas
│   │   ├── User.js               # User accounts
│   │   ├── Client.js             # Clients
│   │   ├── Project.js            # Projects
│   │   ├── Task.js               # Tasks
│   │   ├── Invoice.js            # Invoices
│   │   ├── Payment.js            # Payments
│   │   ├── Expense.js            # Expenses
│   │   ├── TimeLog.js            # Time entries
│   │   ├── Lead.js               # Sales leads
│   │   ├── Proposal.js           # Proposals
│   │   ├── Contract.js           # Contracts
│   │   ├── Contact.js            # Contacts
│   │   ├── WorkSession.js        # Worker sessions
│   │   ├── WorkerPayment.js      # Worker payouts
│   │   ├── Order.js              # Orders
│   │   ├── SupportMessage.js     # Support tickets
│   │   └── AuditLog.js           # Audit trail
│   ├── routes/                   # API route handlers
│   │   ├── authRoutes.js         # Auth endpoints
│   │   ├── clientRoutes.js       # Client CRUD
│   │   ├── projectRoutes.js      # Project CRUD
│   │   ├── taskRoutes.js         # Task CRUD
│   │   ├── invoiceRoutes.js      # Invoice CRUD
│   │   ├── timeLogRoutes.js      # Time log CRUD
│   │   ├── leadRoutes.js         # Lead pipeline
│   │   ├── proposalRoutes.js     # Proposal CRUD
│   │   ├── contractRoutes.js     # Contract CRUD
│   │   ├── expenseRoutes.js      # Expense tracking
│   │   ├── paymentRoutes.js      # Payment processing
│   │   ├── dashboardRoutes.js    # Analytics data
│   │   ├── workerRoutes.js       # Worker management
│   │   ├── workSessionRoutes.js  # Session tracking
│   │   ├── workerPaymentRoutes.js# Worker payouts
│   │   ├── searchRoutes.js       # Global search
│   │   ├── aiRoutes.js           # AI assistant
│   │   ├── adminRoutes.js        # Admin panel
│   │   ├── subscribeRoutes.js    # Subscriptions
│   │   └── supportRoutes.js      # Support tickets
│   ├── services/                 # Business logic
│   │   ├── aiService.js          # AI & automation
│   │   ├── invoiceService.js     # Invoice generation
│   │   ├── searchService.js      # Search indexing
│   │   └── automationService.js  # Workflow automation
│   ├── server.js                 # Express entry point
│   └── .env.example              # Environment template
│
├── .env.local                    # Environment variables
├── .gitignore
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** >= 18.x
- **npm** or **yarn**
- **MongoDB Atlas** account (or local MongoDB instance)
- **Razorpay** account (for payments)
- **Google Cloud Console** credentials (for OAuth)

### Installation

```bash
# Clone the repository
git clone https://github.com/farhankh8/FreelanceFlow.git
cd FreelanceFlow

# Install backend dependencies
cd server && npm install

# Install frontend dependencies
cd ../client && npm install
```

### Environment Setup

Create a `.env` file in `server/`:

```env
# Server
PORT=5000
NODE_ENV=development

# MongoDB
MONGODB_URI=your_mongodb_atlas_connection_string

# JWT
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/v1/auth/google/callback

# Razorpay
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# Email (Nodemailer)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email
EMAIL_PASS=your_app_password

# Frontend URL
CLIENT_URL=http://localhost:5173
```

### Run Locally

Start the backend and frontend in separate terminals:

```bash
# Terminal 1 — Backend
cd server && npm run dev

# Terminal 2 — Frontend
cd client && npm run dev
```

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:5000
- **Health Check:** http://localhost:5000/api/health

---

## 📡 API Overview

| Method | Endpoint | Description | Auth |
|:------:|----------|-------------|:----:|
| **Authentication** |
| POST | `/api/v1/auth/register` | Create account | ❌ |
| POST | `/api/v1/auth/login` | Sign in | ❌ |
| POST | `/api/v1/auth/logout` | Sign out | ✅ |
| POST | `/api/v1/auth/refresh` | Refresh token | ❌ |
| GET | `/api/v1/auth/google` | Google OAuth | ❌ |
| POST | `/api/v1/auth/2fa/setup` | Setup 2FA | ✅ |
| POST | `/api/v1/auth/2fa/verify` | Verify 2FA | ✅ |
| **Clients** |
| GET | `/api/v1/clients` | List clients | ✅ |
| POST | `/api/v1/clients` | Create client | ✅ |
| GET | `/api/v1/clients/:id` | Get client | ✅ |
| PUT | `/api/v1/clients/:id` | Update client | ✅ |
| DELETE | `/api/v1/clients/:id` | Delete client | ✅ |
| **Projects** |
| GET | `/api/v1/projects` | List projects | ✅ |
| POST | `/api/v1/projects` | Create project | ✅ |
| PUT | `/api/v1/projects/:id` | Update project | ✅ |
| DELETE | `/api/v1/projects/:id` | Delete project | ✅ |
| **Tasks** | | |
| GET | `/api/v1/tasks` | List tasks | ✅ |
| POST | `/api/v1/tasks` | Create task | ✅ |
| **Invoices** |
| GET | `/api/v1/invoices` | List invoices | ✅ |
| POST | `/api/v1/invoices` | Generate invoice | ✅ |
| GET | `/api/v1/invoices/:id/pdf` | Download PDF | ✅ |
| **Time Logs** |
| GET | `/api/v1/timelogs` | List time logs | ✅ |
| POST | `/api/v1/timelogs` | Log time | ✅ |
| **Payments** |
| GET | `/api/v1/payments` | List payments | ✅ |
| POST | `/api/v1/payments` | Record payment | ✅ |
| **Leads** |
| GET | `/api/v1/leads` | List leads | ✅ |
| POST | `/api/v1/leads` | Create lead | ✅ |
| **Dashboard** |
| GET | `/api/v1/dashboard/stats` | Get statistics | ✅ |
| GET | `/api/v1/dashboard/revenue` | Revenue data | ✅ |
| **AI** |
| POST | `/api/v1/ai/chat` | AI assistant chat | ✅ |
| **Search** |
| GET | `/api/v1/search?q=` | Global search | ✅ |
| **Health** |
| GET | `/api/health` | Server status | ❌ |

---

## 👥 Role-Based Access

| Role | Permissions |
|------|------------|
| **Manager** | Full access — manage clients, projects, invoices, team, finances |
| **Worker** | Assigned tasks, time tracking, work sessions, limited project view |
| **Admin** | All manager permissions + system settings, user management, audit logs |
| **Viewer** | Read-only access to dashboards and reports |

### Manager-Worker System

Managers can create worker accounts, assign projects/tasks, track work sessions via start/stop timer, and process worker payments — all within the platform.

---

## 🔒 Security Features

- **Helmet.js** — HTTP security headers with custom CSP
- **CORS** — Strict origin whitelist for production
- **Rate Limiting** — Tiered limits (global: 500/15min, auth: 20/hr)
- **JWT** — Access + refresh token rotation
- **Password Policy** — Minimum 12 characters, bcrypt hashing
- **Account Lockout** — Auto-lock after configurable failed attempts
- **2FA** — TOTP-based two-factor authentication
- **Input Validation** — Zod + express-validator双重验证
- **Sanitization** — HTML stripping on all user inputs
- **Audit Trail** — All sensitive operations logged
- **Error Handling** — Centralized error handler, no stack leaks in production

---

## 🚢 Deployment

### Frontend (Vercel)

```bash
cd client
npm run build
# Deploy the dist/ folder to Vercel
```

### Backend (Render)

```bash
cd server
npm start
# Set NODE_ENV=production and configure env vars in Render dashboard
```

---

## 📊 Dashboard Preview

The dashboard provides real-time business intelligence:

- **Revenue Overview** — Monthly income chart with trends
- **Active Projects** — Current project status distribution
- **Pending Invoices** — Outstanding invoice amounts
- **Time Analytics** — Tracked hours breakdown
- **Lead Pipeline** — Conversion funnel metrics
- **Expense Summary** — Categorized spending
- **Quick Actions** — Create invoice, log time, add project

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

## 👨‍💻 Developer

<div align="center">

| | |
|---|---|
| **Name** | K H Mohammad Farhan |
| **Course** | BCA (AI, Cloud Computing & DevOps with TCS) |
| **Reg No** | 23BCAICD182 |
| **Institute** | Yenepoya Institute of Arts, Science, Commerce and Management |
| **Guide** | Ms. Aysha Dilshad |
| **Organization** | Persevex Education Consultancy LLP |
| **GitHub** | [@farhankh8](https://github.com/farhankh8) |

</div>

---

<div align="center">

**FreelanceFlow © 2026 — Built with ❤️ using the MERN Stack**

[![Star](https://img.shields.io/github/stars/farhankh8/FreelanceFlow?style=social)](https://github.com/farhankh8/FreelanceFlow/stargazers)
[![Fork](https://img.shields.io/github/forks/farhankh8/FreelanceFlow?style=social)](https://github.com/farhankh8/FreelanceFlow/fork)
[![Issues](https://img.shields.io/github/issues/farhankh8/FreelanceFlow?style=social)](https://github.com/farhankh8/FreelanceFlow/issues)

</div>
