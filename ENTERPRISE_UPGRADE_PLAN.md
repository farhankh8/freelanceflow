# FreelanceFlow Enterprise Upgrade Plan

**Project:** FreelanceFlow  
**Date:** April 15, 2026  
**Objective:** Transform from C+ (75%) to A-Grade Enterprise SaaS (95%+)  
**Approach:** MNC Production Standards  

---

## Executive Summary

This document outlines a comprehensive enterprise-grade transformation plan to elevate FreelanceFlow to production-ready status suitable for:
- MNC code review standards
- Scaling to 10,000+ users
- Top-tier portfolio demonstration
- Deployment without rework

### Current State: 5.6/10 (C+)  
### Target State: 9.0/10 (A-)

---

## Phase 1: Security Hardening (P0 - Critical)

### 1.1 Password Policy Upgrade

**Current:** minlength: 6  
**Target:** 12+ characters, complexity rules

```javascript
// server/models/User.js
password: {
  type: String,
  required: true,
  minlength: 12,
  // Schema validator for complexity
  validate: {
    validator: function(password) {
      return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/.test(password);
    },
    message: 'Password must be at least 12 characters with uppercase, lowercase, number, and special character'
  }
}
```

**Backend Validation (Zod):**
```javascript
// server/utils/validators.js
import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string()
    .min(12, 'Password must be at least 12 characters')
    .regex(/[A-Z]/, 'Password must contain an uppercase letter')
    .regex(/[a-z]/, 'Password must contain a lowercase letter')
    .regex(/[0-9]/, 'Password must contain a number')
    .regex(/[@$!%*?&]/, 'Password must contain a special character (@$!%*?&)')
});
```

### 1.2 Input Validation Layer (Zod)

Add Zod to all API endpoints:

| Endpoint | Schema | Priority |
|----------|--------|----------|
| POST /auth/register | registerSchema | P0 |
| POST /auth/login | loginSchema | P0 |
| POST /clients | clientSchema | P1 |
| POST /invoices | invoiceSchema | P1 |
| POST /projects | projectSchema | P1 |
| PUT /users/:id | updateProfileSchema | P1 |

### 1.3 HttpOnly Secure Cookies

**Implementation Strategy (Phase 1 - Dual Support):**

1. Keep LocalStorage for backward compatibility during transition
2. Add HttpOnly cookies as enhanced security option
3. Cookie configuration:
```javascript
// server/controllers/authController.js
const setAuthCookies = (res, accessToken, refreshToken) => {
  const isProduction = process.env.NODE_ENV === 'production';
  const cookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  };
  
  res.cookie('accessToken', accessToken, {
    ...cookieOptions,
    maxAge: 15 * 60 * 1000 // 15 minutes
  });
  
  res.cookie('refreshToken', refreshToken, cookieOptions);
};
```

### 1.4 CORS Whitelist

**Current:** `origin: true` (allows all)  
**Target:** Production domain whitelist

```javascript
// server/server.js
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(',') || [
  'https://freelanceflow.vercel.app',
  'http://localhost:5173'
];

app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ALLOWED_ORIGINS 
    : true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400
}));
```

### 1.5 Rate Limiting Per User + IP

```javascript
// server/server.js
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  keyGenerator: (req) => req.ip + ':' + (req.user?.id || 'anon')
});

const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10, // 10 login attempts per hour
  message: { error: 'Too many login attempts. Please try again later.' },
  keyGenerator: (req) => req.ip + ':auth'
});
```

### 1.6 Account Lockout + Login Tracking

```javascript
// server/models/User.js
const userSchema = new mongoose.Schema({
  // ... existing fields
  failedLoginAttempts: { type: Number, default: 0 },
  lockedUntil: { type: Date, default: null },
  lastLoginAt: { type: Date },
  lastLoginIP: { type: String },
  loginHistory: [{
    timestamp: Date,
    ip: String,
    userAgent: String,
    success: Boolean
  }]
});

// Lock account after 5 failed attempts
userSchema.methods.checkLocked = function() {
  if (this.lockedUntil && this.lockedUntil > new Date()) {
    return true; // Account is locked
  }
  if (this.failedLoginAttempts >= 5) {
    this.lockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 min lockout
    this.save();
    return true;
  }
  return false;
};
```

### 1.7 Audit Logging

```javascript
// server/models/AuditLog.js
const auditLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  action: {
    type: String,
    enum: ['LOGIN', 'LOGOUT', 'REGISTER', 'PASSWORD_CHANGE', 
           'INVOICE_CREATE', 'INVOICE_UPDATE', 'INVOICE_DELETE',
           'PAYMENT_CREATE', 'CONTRACT_SIGN', 'PROFILE_UPDATE']
  },
  resource: { type: String },
  resourceId: { type: mongoose.Schema.Types.ObjectId },
  ip: String,
  userAgent: String,
  metadata: mongoose.Schema.Types.Mixed,
  timestamp: { type: Date, default: Date.now }
});

auditLogSchema.index({ userId: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });
```

---

## Phase 2: Backend Architecture (P0)

### 2.1 Standardized API Response Format

**Current:** Inconsistent `{ success, data, error }`  
**Target:** Uniform response wrapper

```javascript
// server/utils/apiResponse.js
class ApiResponse {
  static success(res, data, message = 'Success', statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString()
    });
  }

  static error(res, message, statusCode = 500, errors = null) {
    return res.status(statusCode).json({
      success: false,
      message,
      error: errors,
      timestamp: new Date().toISOString()
    });
  }

  static paginated(res, data, pagination, message = 'Success') {
    return res.status(200).json({
      success: true,
      message,
      data,
      pagination,
      timestamp: new Date().toISOString()
    });
  }
}

// Middleware wrapper
const asyncHandler = (fn) => (req, res, next) => 
  Promise.resolve(fn(req, res, next)).catch(next);

// Usage in controllers
const getClients = asyncHandler(async (req, res) => {
  const clients = await Client.find({ user: req.user.id }).lean();
  return ApiResponse.success(res, clients);
});
```

### 2.2 Complete generateFromTimeLogs

```javascript
// server/controllers/invoiceController.js
const generateFromTimeLogs = async (req, res) => {
  try {
    const { clientId, projectId, startDate, endDate, taxRate, dueDate } = req.body;
    
    // Validate required fields
    if (!clientId) {
      return ApiResponse.error(res, 'Client is required', 400);
    }

    // Fetch time logs for the period
    const timeLogFilter = {
      user: req.user.id,
      client: clientId,
      ...(projectId && { project: projectId }),
      ...(startDate && endDate && {
        date: { $gte: new Date(startDate), $lte: new Date(endDate) }
      })
    };

    const timeLogs = await TimeLog.find(timeLogFilter).populate('project', 'title');
    
    if (timeLogs.length === 0) {
      return ApiResponse.error(res, 'No time logs found for the selected period', 404);
    }

    // Group by project and calculate totals
    const items = [];
    const projectTotals = {};

    timeLogs.forEach(log => {
      const projectId = log.project?._id?.toString() || 'unassigned';
      if (!projectTotals[projectId]) {
        projectTotals[projectId] = {
          description: log.project?.title || 'Unassigned Project',
          hours: 0,
          rate: log.rate || req.user.settings?.defaultRate || 500,
          amount: 0
        };
      }
      projectTotals[projectId].hours += log.duration || 0;
      projectTotals[projectId].amount += (log.duration || 0) * projectTotals[projectId].rate;
    });

    Object.values(projectTotals).forEach(item => {
      items.push({
        description: item.description,
        hours: Math.round(item.hours * 100) / 100,
        rate: item.rate,
        amount: Math.round(item.amount * 100) / 100
      });
    });

    // Create invoice
    const invoice = await Invoice.create({
      user: req.user.id,
      client: clientId,
      project: projectId || null,
      items,
      taxRate: Number(taxRate) || 0,
      dueDate: dueDate ? new Date(dueDate) : null,
      sourceTimeLogs: timeLogs.map(l => l._id)
    });

    const populated = await invoice.populate([
      { path: 'client', select: 'name email company phone' },
      { path: 'project', select: 'title' }
    ]);

    return ApiResponse.success(res, populated, 'Invoice generated from time logs', 201);
  } catch (error) {
    console.error('GENERATE FROM TIMELOGS ERROR:', error);
    return ApiResponse.error(res, 'Failed to generate invoice', 500);
  }
};
```

### 2.3 Pagination, Filtering, Sorting

```javascript
// server/utils/pagination.js
const paginate = (model) => async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  // Build filter from query params
  const filter = { user: req.user.id };
  
  if (req.query.status) filter.status = req.query.status;
  if (req.query.clientId) filter.client = req.query.clientId;
  if (req.query.search) {
    filter.$or = [
      { name: { $regex: req.query.search, $options: 'i' } },
      { email: { $regex: req.query.search, $options: 'i' } }
    ];
  }

  // Build sort
  const sort = {};
  sort[req.query.sortBy || 'createdAt'] = req.query.sortOrder === 'asc' ? 1 : -1;

  const [data, total] = await Promise.all([
    model.find(filter).sort(sort).skip(skip).limit(limit).lean(),
    model.countDocuments(filter)
  ]);

  res.paginated = {
    data,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1
    }
  };

  next();
};

// Usage
router.get('/clients', auth, paginate(Client), (req, res) => {
  return ApiResponse.paginated(res, res.paginated.data, res.paginated.pagination);
});
```

### 2.4 Centralized Error Handling

```javascript
// server/middleware/errorHandler.js
class AppError extends Error {
  constructor(message, statusCode, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.isOperational ? err.message : 'Internal Server Error';

  // Log error details (not message to user in production)
  if (!err.isOperational) {
    console.error('PRODUCTION ERROR:', {
      message: err.message,
      stack: err.stack,
      url: req.originalUrl,
      method: req.method,
      ip: req.ip
    });
  }

  // Don't expose error details in production
  const response = {
    success: false,
    message: process.env.NODE_ENV === 'production' && !err.isOperational 
      ? 'Something went wrong' 
      : message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  };

  res.status(statusCode).json(response);
};

module.exports = { AppError, errorHandler };
```

### 2.5 Structured Logging (Pino)

```javascript
// server/config/logger.js
const pino = require('pino');

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV !== 'production' 
    ? { target: 'pino-pretty' }
    : undefined,
  formatters: {
    level: (label) => ({ level: label })
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  base: {
    service: 'freelanceflow',
    environment: process.env.NODE_ENV || 'development'
  }
});

module.exports = logger;

// Usage: logger.info({ userId: req.user.id }, 'User performed action');
```

---

## Phase 3: Database & Performance (P1)

### 3.1 MongoDB Indexing

```javascript
// server/models/Client.js
clientSchema.index({ user: 1, email: 1 }, { unique: true });
clientSchema.index({ user: 1, createdAt: -1 });
clientSchema.index({ user: 1, status: 1 });

// server/models/Invoice.js
invoiceSchema.index({ user: 1, status: 1 });
invoiceSchema.index({ user: 1, createdAt: -1 });
invoiceSchema.index({ client: 1, status: 1 });

// server/models/Project.js
projectSchema.index({ user: 1, status: 1 });
projectSchema.index({ user: 1, createdAt: -1 });

// server/models/Contract.js
contractSchema.index({ user: 1, status: 1 });
contractSchema.index({ user: 1, createdAt: -1 });

// server/models/TimeLog.js
timeLogSchema.index({ user: 1, date: -1 });
timeLogSchema.index({ user: 1, project: 1, date: -1 });
```

### 3.2 Query Optimization

```javascript
// Use .lean() for read-only queries
const clients = await Client.find({ user: req.user.id })
  .select('-__v')
  .lean();

// Use .exec() for explicit promise chain
const client = await Client.findById(id).lean().exec();

// Aggregate for complex queries
const pipeline = [
  { $match: { user: req.user.id } },
  { $group: { _id: '$status', total: { $sum: 1 } } }
];
const stats = await Client.aggregate(pipeline);
```

### 3.3 Dashboard Summary Endpoint

```javascript
// server/controllers/dashboardController.js
const getSummary = async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [clients, projects, invoices, leads, payments, expenses, timelogs] = 
      await Promise.all([
        Client.countDocuments({ user: userId }),
        Project.countDocuments({ user: userId, status: 'active' }),
        Invoice.find({ user: userId }),
        Lead.countDocuments({ user: userId }),
        Payment.find({ user: userId }),
        Expense.find({ user: userId }),
        TimeLog.aggregate([
          { $match: { user: userId } },
          { $group: { _id: null, total: { $sum: '$duration' } } }
        ])
      ]);

    const totalRevenue = payments
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

    const monthlyRevenue = payments
      .filter(p => p.status === 'completed' && new Date(p.createdAt) >= startOfMonth)
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    const outstandingInvoices = invoices
      .filter(i => i.status === 'pending')
      .reduce((sum, i) => sum + (i.total || 0), 0);

    const stats = {
      totalClients: clients,
      activeProjects: projects,
      totalInvoices: invoices.length,
      totalLeads: leads,
      totalRevenue,
      monthlyRevenue,
      netProfit: totalRevenue - totalExpenses,
      outstandingAmount: outstandingInvoices,
      totalTimeLogged: timelogs[0]?.total || 0
    };

    return ApiResponse.success(res, stats);
  } catch (error) {
    console.error('DASHBOARD SUMMARY ERROR:', error);
    return ApiResponse.error(res, 'Failed to fetch dashboard');
  }
};
```

---

## Phase 4: Frontend Engineering (P1)

### 4.1 Design System Architecture

```
client/src/
├── components/
│   ├── atoms/           # Buttons, Inputs, Labels
│   ├── molecules/      # FormField, Card, Avatar
│   ├── organisms/      # Navbar, Sidebar, DataTable
│   └── templates/      # DashboardLayout, AuthLayout
├── styles/
│   ├── variables.css  # Design tokens
│   ├── base.css       # Reset + base
│   └── components.css # Reusable component classes
└── hooks/
    └── usePagination.js
```

### 4.2 Design Tokens (CSS Variables)

```css
/* client/src/styles/variables.css */
:root {
  /* Colors */
  --color-primary: #6c63ff;
  --color-primary-hover: #7b75ff;
  --color-secondary: #ff6584;
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-danger: #ef4444;
  
  /* Typography */
  --font-family: 'Inter', sans-serif;
  --font-size-xs: 0.75rem;
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
  --font-size-xl: 1.25rem;
  --font-size-2xl: 1.5rem;
  
  /* Spacing */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-12: 3rem;
  
  /* Border Radius */
  --radius-sm: 0.375rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;
  --radius-full: 9999px;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.4);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.5);
  --shadow-glow: 0 0 20px rgba(108, 99, 255, 0.3);
  
  /* Transitions */
  --transition-fast: 150ms ease;
  --transition-base: 200ms ease;
  --transition-slow: 300ms ease;
}
```

### 4.3 Reusable Components

```javascript
// client/src/components/atoms/Button.jsx
import styles from './Button.module.css';

export function Button({ 
  children, 
  variant = 'primary', 
  size = 'md',
  loading = false,
  disabled = false,
  ...props 
}) {
  const className = [
    styles.button,
    styles[variant],
    styles[size],
    loading && styles.loading
  ].filter(Boolean).join(' ');

  return (
    <button 
      className={className} 
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <span className={styles.spinner} /> : children}
    </button>
  );
}

// Button.module.css
.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-weight: 600;
  border-radius: var(--radius-md);
  transition: all var(--transition-base);
  cursor: pointer;
}

.button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.primary {
  background: var(--color-primary);
  color: white;
}

.primary:hover:not(:disabled) {
  background: var(--color-primary-hover);
}
```

### 4.4 React Query Optimization

```javascript
// client/src/lib/queryClient.js
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (was cacheTime)
      refetchOnWindowFocus: false,
      retry: 1,
      refetchOnMount: false
    },
    mutations: {
      retry: 0,
      onError: (error) => {
        toast.error(error.response?.data?.message || 'An error occurred');
      }
    }
  }
});

// Usage in components
const { data, isLoading, error } = useQuery({
  queryKey: ['clients', page],
  queryFn: () => api.get(`/clients?page=${page}&limit=20`),
  staleTime: 5 * 60 * 1000
});
```

### 4.5 Loading Skeletons

```javascript
// client/src/components/molecules/Skeleton.jsx
export function Skeleton({ width, height, borderRadius = 'var(--radius-md)' }) {
  return (
    <div 
      style={{ 
        width: width || '100%', 
        height, 
        borderRadius,
        background: 'linear-gradient(90deg, var(--surface2) 25%, var(--surface-overlay) 50%, var(--surface2) 75%)',
        backgroundSize: '200% 100%',
        animation: 'skeleton-loading 1.5s ease-in-out infinite'
      }} 
    />
  );
}
```

---

## Phase 5: DevOps & Production (P1)

### 5.1 Environment Separation

```bash
# .env.local (Development - DON'T COMMIT)
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/freelanceflow
API_URL=http://localhost:5000

# .env.staging
NODE_ENV=staging
MONGO_URI=mongodb+srv://...staging...
ALLOWED_ORIGINS=https://staging.freelanceflow.vercel.app

# .env.production
NODE_ENV=production
MONGO_URI=mongodb+srv://...production...
ALLOWED_ORIGINS=https://freelanceflow.vercel.app,https://freelanceflow.com
```

### 5.2 CI/CD Pipeline

```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  NODE_ENV: test

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies (Frontend)
        working-directory: ./client
        run: npm ci
      
      - name: Install dependencies (Backend)
        working-directory: ./server
        run: npm ci
      
      - name: Lint Frontend
        working-directory: ./client
        run: npm run lint
      
      - name: Build Frontend
        working-directory: ./client
        run: npm run build
        env:
          VITE_API_URL: http://localhost:5000

  deploy-staging:
    if: github.ref == 'refs/heads/main'
    needs: lint-and-test
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to Render (Staging)
        run: |
          echo "Deploying to staging..."
          # Add render deploy trigger API call

  deploy-production:
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    needs: deploy-staging
    runs-on: ubuntu-latest
    environment: production
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to Production
        run: |
          echo "Deploying to production..."
```

### 5.3 Monitoring Structure

```javascript
// server/middleware/monitoring.js
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info({
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration,
      ip: req.ip,
      userAgent: req.get('user-agent')
    }, 'HTTP Request');
  });
  
  next();
};

// Add to routes
app.use(requestLogger);
```

---

## Phase 6: Documentation (P2)

### 6.1 Professional README.md Structure

```markdown
# FreelanceFlow

<div align="center">
  <img src="https://img.shields.io/badge/Status-Production%20Ready-brightgreen" alt="Status">
  <img src="https://img.shields.io/badge/Stack-React%20%2B%20Node%20%2B%20MongoDB-blue" alt="Stack">
  <img src="https://img.shields.io/badge/License-MIT-green" alt="License">
</div>

## 🚀 Enterprise-Grade Freelancer Management Platform

> A comprehensive SaaS platform for freelancers to manage clients, projects, invoices, contracts, and business operations with AI-powered insights.

## ✨ Features

| Feature | Description |
|---------|------------|
| Client Management | Full CRUD with contact details, company info |
| Project Tracking | Status management, time tracking |
| Invoice Generation | PDF invoices, GST support |
| AI Insights | Business health analytics |
| Contract Management | Status workflow |
| Lead Pipeline | Kanban-style management |

## 🏗️ Architecture

```
FreelanceFlow/
├── client/          # React 19 + Vite
│   ├── src/
│   │   ├── components/   # UI Components
│   │   ├── pages/       # Route Pages
│   │   ├── hooks/      # Custom Hooks
│   │   └── lib/        # Utilities
│   └── package.json
│
└── server/         # Express 5
    ├── controllers/ # Route Handlers
    ├── models/     # Mongoose Models
    ├── routes/     # Express Routes
    ├── services/   # Business Logic
    └── package.json
```

## 📋 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/v1/auth/register | Register new user |
| POST | /api/v1/auth/login | Login |
| POST | /api/v1/auth/refresh | Refresh token |
| GET | /api/v1/auth/me | Get current user |

### Resources
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | /api/v1/clients | List/Create clients |
| GET/PUT/DELETE | /api/v1/clients/:id | Client operations |
| GET/POST | /api/v1/invoices | List/Create invoices |
| GET | /api/v1/invoices/:id/pdf | Download PDF |

## 🚦 Quick Start

```bash
# Clone
git clone https://github.com/yourusername/freelanceflow.git
cd freelanceflow

# Frontend
cd client
cp .env.example .env.local
npm install
npm run dev

# Backend (new terminal)
cd server
cp .env.example .env.local
npm install
npm run dev
```

## 🔧 Environment Variables

### Client (.env.local)
```env
VITE_API_URL=http://localhost:5000/api/v1
VITE_ANTHROPIC_API_KEY=sk-...
```

### Server (.env.local)
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/freelanceflow
JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
GMAIL_USER=your-email@gmail.com
GMAIL_PASS=your_app_password
```

## 📱 UI Preview

[Include screenshots]

## 🛡️ Security Features

- JWT with refresh token rotation
- Rate limiting per IP/user
- Input validation (Zod)
- Audit logging
- HTTPS enforced in production
- CORS whitelist

## 📈 Performance

- MongoDB indexing for fast queries
- React Query caching
- Optimized dashboard (single aggregation endpoint)
- Pagination on all list endpoints
- PDF streaming for large invoices

## 🤝 Contributing

1. Fork the repo
2. Create feature branch
3. Make changes
4. Submit PR

## 📄 License

MIT License - See LICENSE file

---

## 🙏 Acknowledgments

- Anthropic (Claude AI)
- MongoDB Atlas
- Vercel
- Render
```

---

## Phase 7: Advanced Features (P2)

### 7.1 Role-Based Access Control (RBAC)

```javascript
// server/middleware/rbac.js
const ROLES = {
  ADMIN: 'admin',
  USER: 'user',
  VIEWER: 'viewer'
};

const PERMISSIONS = {
  [ROLES.ADMIN]: ['*'],
  [ROLES.USER]: [
    'clients:read', 'clients:write', 'clients:delete',
    'invoices:read', 'invoices:write', 'invoices:delete',
    'projects:read', 'projects:write',
    'reports:read'
  ],
  [ROLES.VIEWER]: [
    'clients:read',
    'invoices:read',
    'reports:read'
  ]
};

const requirePermission = (permission) => (req, res, next) => {
  const userRole = req.user?.role || ROLES.USER;
  const permissions = PERMISSIONS[userRole];
  
  if (permissions.includes('*') || permissions.includes(permission)) {
    return next();
  }
  
  return ApiResponse.error(res, 'Insufficient permissions', 403);
};

// Usage
router.delete('/clients/:id', auth, requirePermission('clients:delete'), deleteClient);
```

### 7.2 Notification System

```javascript
// server/models/Notification.js
const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: ['INVOICE_CREATED', 'PAYMENT_RECEIVED', 'CONTRACT_EXPIRING', 'LEAD_UPDATED', 'SYSTEM'],
    required: true
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  data: mongoose.Schema.Types.Mixed,
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });
```

---

## Implementation Order

### Phase 1 (Week 1-2): Security
- [ ] 1.1 Upgrade password policy
- [ ] 1.2 Add Zod validation
- [ ] 1.3 HttpOnly cookies
- [ ] 1.4 CORS whitelist
- [ ] 1.5 Rate limiting
- [ ] 1.6 Account lockout
- [ ] 1.7 Audit logging

### Phase 2 (Week 2-3): Backend
- [ ] 2.1 API response format
- [ ] 2.2 Complete generateFromTimeLogs
- [ ] 2.3 Pagination
- [ ] 2.4 Error handling
- [ ] 2.5 Structured logging

### Phase 3 (Week 3-4): Database & Performance
- [ ] 3.1 Add indexes
- [ ] 3.2 Query optimization
- [ ] 3.3 Dashboard summary

### Phase 4 (Week 4-6): Frontend
- [ ] 4.1 Design system
- [ ] 4.2 Components
- [ ] 4.3 React Query optimization

### Phase 5 (Week 6-7): DevOps
- [ ] 5.1 Environment separation
- [ ] 5.2 CI/CD pipeline

### Phase 6 (Week 7-8): Documentation
- [ ] 6.1 README.md
- [ ] 6.2 API docs

### Phase 7 (Week 8+): Advanced
- [ ] 7.1 RBAC
- [ ] 7.2 Notifications
- [ ] 7.3 Activity logs

---

*Document prepared for enterprise transformation.*
*Target: A-Grade Production SaaS*