# FreelanceFlow - Freelancer Management SaaS Application

## 🎯 Project Overview

**FreelanceFlow** is a comprehensive B2B SaaS application designed for freelancers to manage their business operations efficiently. It consolidates client management, project tracking, time logging, invoicing, and financial reporting into a single dashboard.

**Domain:** Web Development

---

## 🔗 Live Demo Links

- **Frontend (Vercel):** https://freelanceflow-blue-delta.vercel.app
- **Backend API (Render):** https://freelanceflow-api-80zc.onrender.com

---

## 📋 Key Features Implemented

### Phase 1: Client & Project CRM ✅
- [x] **Client Management** - Full CRUD operations with contact info, industry, hourly rate
- [x] **Project Management** - Linked to clients with status (Active, Planning, Completed)
- [x] **Task Management** - Tasks linked to projects with priority and due dates
- [x] **Dashboard UI** - Clean, data-dense interface showing Active Projects, Pending Invoices, Upcoming Deadlines

### Phase 2: Time Tracking Engine ✅
- [x] **Real-time Stopwatch** - Persistent timer that tracks work sessions
- [x] **Manual Time Entry** - Log hours worked on specific dates
- [x] **Time Logs** - Store StartTime, EndTime, Duration
- [x] **Project Budget Tracking** - Track burn rate against project budget

### Phase 3: Financials & Invoicing ✅
- [x] **Invoice Generator** - Create professional invoices with line items
- [x] **PDF Download** - Generate professional PDF invoices (client-side)
- [x] **Financial Dashboard** - Charts showing Revenue, Expenses, Profit/Loss
- [x] **Payment Tracking** - Track payment status (Pending, Completed)

### Phase 4: Multi-Tenancy & Security ✅
- [x] **Data Isolation** - Every query scoped to req.user.id (User A never sees User B's data)
- [x] **JWT Authentication** - Secure access token + refresh token mechanism
- [x] **Tiered Access** - Free plan (2 clients max), Pro plan (unlimited)

---

## 🛠️ Technology Stack

### Frontend
- **React.js 18** - UI library
- **React Router** - Client-side routing
- **Zustand** - State management
- **Recharts** - Data visualization/charts
- **jsPDF** - PDF invoice generation
- **Vite** - Build tool
- **CSS Variables** - Custom design system

### Backend
- **Node.js** - Runtime
- **Express.js** - REST API framework
- **MongoDB** - Database (Mongoose ODM)
- **JWT** - Authentication tokens
- **Bcrypt** - Password hashing

### Deployment
- **Frontend:** Vercel
- **Backend:** Render
- **Database:** MongoDB Atlas

---

## 📁 Project Structure

```
FreelanceFlow/
├── client/                    # React Frontend
│   ├── src/
│   │   ├── pages/            # All page components
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Clients.jsx
│   │   │   ├── Projects.jsx
│   │   │   ├── Invoices.jsx
│   │   │   ├── TimeLogs.jsx
│   │   │   ├── Reports.jsx
│   │   │   └── ... (15+ pages)
│   │   ├── components/      # Reusable components
│   │   ├── store/           # Zustand stores
│   │   └── lib/             # API client
│   └── package.json
│
├── server/                    # Node.js Backend
│   ├── controllers/          # Route handlers
│   ├── models/              # Mongoose schemas
│   ├── routes/              # API routes
│   ├── middleware/          # Auth, error handling
│   ├── config/              # Database config
│   └── server.js            # Entry point
│
├── README.md
└── DEPLOYMENT_GUIDE.md
```

---

## 📊 Database Schema (Key Models)

### User
```javascript
{
  name, email, password,
  plan: "free" | "pro",
  createdAt, updatedAt
}
```

### Client
```javascript
{
  user, name, email, phone,
  company, industry, hourlyRate,
  status: "active" | "inactive" | "prospect"
}
```

### Project
```javascript
{
  user, client, title, description,
  status: "active" | "planning" | "completed" | "on-hold",
  budget, deadline, hourlyRate
}
```

### TimeLog
```javascript
{
  user, project, task,
  description, duration,
  startTime, endTime,
  type: "timer" | "manual",
  billed: boolean
}
```

### Invoice
```javascript
{
  user, client, project,
  invoiceNumber, items: [{ description, hours, rate, amount }],
  subtotal, taxRate, taxAmount, total,
  status: "draft" | "sent" | "paid" | "overdue",
  dueDate
}
```

---

## 🔐 Security Features

1. **Data Isolation:** All database queries include `user: req.user.id`
2. **JWT Tokens:** Access tokens (15min) + Refresh tokens (7 days)
3. **Password Hashing:** bcrypt with 12 salt rounds
4. **CORS Protection:** Configured for production
5. **Rate Limiting:** Prevents brute force attacks

---

## 📈 Mathematical Logic

### Invoice Calculation
```
Total = Subtotal + Tax Amount
Tax Amount = Subtotal × (Tax Rate / 100)
```

### Time × Rate = Amount
```
Invoice Amount = Σ (Time Log Duration × Hourly Rate)
```

### Project Burn Rate
```
Burn Rate = Total Hours Logged × Hourly Rate
Budget Remaining = Budget - Burn Rate
```

---

## 🚀 How to Run Locally

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- npm or yarn

### Backend Setup
```bash
cd server
cp .env.example .env
# Edit .env with your MongoDB URI
npm install
npm run dev
```

### Frontend Setup
```bash
cd client
npm install
npm run dev
```

---

## 📱 Screenshots

1. **Dashboard** - Overview with stats, charts, recent activity
2. **Clients Page** - Grid/List view of all clients
3. **Invoice Creation** - Line items, calculations, PDF download
4. **Reports Page** - Revenue charts, expense breakdown
5. **Time Tracking** - Stopwatch, manual entry

---

## 👨‍💻 Developer

**Name:** Mohammad Farhan KH  
**Email:** mohammadfarhankh.08@gmail.com  
**Domain:** Web Development

---

## 🎓 Learning Outcomes

1. Full-stack MERN development
2. REST API design and implementation
3. Database schema design with MongoDB
4. Authentication & authorization
5. PDF generation (client-side)
6. Data visualization with charts
7. Deployment to cloud platforms (Vercel + Render)
8. Git version control workflow

---

## 📝 Future Enhancements

- [ ] Email notifications for invoice reminders
- [ ] Stripe payment integration
- [ ] Client portal for clients to view invoices
- [ ] Mobile app (React Native)
- [ ] Advanced reporting with date filters
- [ ] Export data to CSV/Excel

---

## 📄 License

This project is for educational purposes as part of an internship program.

---

**Built with ❤️ for freelancers everywhere**
