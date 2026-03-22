# 💼 FreelanceFlow

<p align="center">
  <img src="https://img.shields.io/badge/Version-3.0.0-6c63ff?style=for-the-badge" alt="Version">
  <img src="https://img.shields.io/badge/React-19-61dafb?style=for-the-badge&logo=react" alt="React">
  <img src="https://img.shields.io/badge/Node.js-20+-339933?style=for-the-badge&logo=node.js" alt="Node">
  <img src="https://img.shields.io/badge/MongoDB-Latest-47A248?style=for-the-badge&logo=mongodb" alt="MongoDB">
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="License">
</p>

<p align="center">
  <img src="https://img.shields.io/badge/AI-Powered-ff6584?style=for-the-badge" alt="AI">
  <img src="https://img.shields.io/badge/India-GST-00d97e?style=for-the-badge" alt="GST">
  <img src="https://img.shields.io/badge/Built-For-Indian%20Freelancers-f59e0b?style=for-the-badge" alt="India">
</p>

---

<div align="center">

![FreelanceFlow Banner](https://via.placeholder.com/1200x400/111118/6c63ff?text=💼+FreelanceFlow+-+AI-Powered+Freelance+OS)

### 🚀 The Ultimate Freelance Management Platform for Indian Developers & Designers

*[Manage clients. Track time. Generate GST invoices. Grow your business.]*

**[Live Demo](https://freelanceflow-gules.vercel.app)** • **[Documentation](#-features)** • **[Get Started](#-quick-start)**

</div>

---

## ✨ What's New in v3.0

<p align="center">
  <img src="https://img.shields.io/badge/🤖-AI-Assistant-6c63ff?style=flat-square">
  <img src="https://img.shields.io/badge/📊-Analytics-00d97e?style=flat-square">
  <img src="https://img.shields.io/badge/🧾-GST-Invoices-ffb800?style=flat-square">
  <img src="https://img.shields.io/badge/⚡-Automation-ff6584?style=flat-square">
  <img src="https://img.shields.io/badge/🎯-Pro-Analytics-6c63ff?style=flat-square">
</p>

---

## 🎯 Why FreelanceFlow?

<div align="center">

| Traditional Tools | FreelanceFlow |
|------------------|---------------|
| ❌ Complex setup | ✅ Ready in 2 minutes |
| ❌ English-first | ✅ Built for India 🇮🇳 |
| ❌ Basic invoicing | ✅ GST-compliant + AI |
| ❌ Manual tracking | ✅ Automated insights |
| ❌ Expensive | ✅ Free to start |

</div>

---

## ⚡ Features

### 🤖 AI-Powered
- [x] **Natural Language → Invoice** - Type "create invoice for ₹50,000" and it's done
- [x] **Smart Pricing** - AI suggests rates based on your history
- [x] **Payment Predictions** - Know which clients might pay late
- [x] **Weekly Insights** - AI-powered business recommendations

### 📊 Dashboard
- [x] Real-time revenue tracking
- [x] Client summary cards
- [x] Recent activity feed
- [x] Quick action buttons

### 👥 Client Management
- [x] Full client profiles with GSTIN
- [x] Contact history
- [x] Payment tracking
- [x] Client profitability analysis

### 🧾 Invoice Generation
- [x] **GST-compliant invoices** (CGST/SGST)
- [x] Auto-calculation with tax
- [x] PDF export
- [x] Share via WhatsApp/Email
- [x] Invoice card for social sharing
- [x] UPI payment tracking

### 🚀 Project Management
- [x] **Kanban Board** - Drag & drop
- [x] Status tracking (Planning → Active → Completed)
- [x] Budget management
- [x] Deadline tracking
- [x] Client association

### ✅ Task Management
- [x] Full CRUD operations
- [x] **Kanban view** with drag & drop
- [x] Priority levels (Low/Medium/High/Urgent)
- [x] Due date tracking
- [x] Project association

### ⏱️ Time Tracking
- [x] Start/Stop timer
- [x] Manual time entry
- [x] Project & task association
- [x] Billable hours tracking

### 📈 Reports & Analytics
- [x] Revenue vs Expenses charts
- [x] Client-wise breakdown
- [x] Expense categories
- [x] **CSV Export** for accountants
- [x] Monthly/Yearly views

### 🔍 Global Search
- [x] Press `Cmd+K` or `Ctrl+K`
- [x] Search across all data
- [x] Quick navigation
- [x] Recent searches

### 💳 Payments & Expenses
- [x] Track all payments
- [x] **TDS calculation support**
- [x] UPI/Bank transfer tracking
- [x] Category-wise expenses

### 🔔 Automation Engine
- [x] Auto-overdue detection
- [x] Payment reminders (email)
- [x] Recurring invoices (Pro)
- [x] Smart follow-ups

---

## 🏗️ Tech Stack

<div align="center">

### Frontend
![React](https://img.shields.io/badge/React-19-61dafb?style=flat&logo=react)
![Vite](https://img.shields.io/badge/Vite-8.0-646CFF?style=flat&logo=vite)
![React Router](https://img.shields.io/badge/React_Router-7-CA4245?style=flat&logo=react-router)
![Zustand](https://img.shields.io/badge/Zustand-5-brightgreen?style=flat)
![Recharts](https://img.shields.io/badge/Recharts-3.8.0-red?style=flat)
![Framer Motion](https://img.shields.io/badge/Framer_Motion-12-purple?style=flat)

### Backend
![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=flat&logo=node.js)
![Express](https://img.shields.io/badge/Express-5-000000?style=flat&logo=express)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=flat&logo=mongodb)
![JWT](https://img.shields.io/badge/JWT-Auth-red?style=flat)
![Nodemailer](https://img.shields.io/badge/Nodemailer-6.9.0-green?style=flat)

</div>

---

## 📁 Project Structure

```
freelanceflow/
├── client/                      # React Frontend
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   │   ├── AIChatbot.jsx       # 🤖 AI Assistant
│   │   │   ├── GlobalSearch.jsx    # 🔍 Cmd+K Search
│   │   │   ├── Layout.jsx          # 📱 App Layout
│   │   │   ├── ProGate.jsx        # 💎 Pro Feature Gating
│   │   │   └── Skeleton.jsx       # ⏳ Loading States
│   │   ├── pages/            # Page components
│   │   │   ├── Dashboard.jsx       # 📊 Dashboard
│   │   │   ├── Clients.jsx        # 👥 Client Management
│   │   │   ├── Invoices.jsx        # 🧾 Invoice Generation
│   │   │   ├── Projects.jsx        # 🚀 Project Kanban
│   │   │   ├── Tasks.jsx          # ✅ Task Management
│   │   │   ├── Reports.jsx         # 📈 Analytics
│   │   │   └── Settings.jsx       # ⚙️ Business Settings
│   │   ├── services/         # API services
│   │   ├── store/           # Zustand stores
│   │   └── App.jsx          # Main app
│   └── package.json
│
├── server/                      # Node.js Backend
│   ├── controllers/           # Route handlers
│   │   ├── authController.js       # 🔐 Authentication
│   │   ├── clientController.js    # 👥 Clients
│   │   ├── invoiceController.js    # 🧾 Invoices
│   │   └── ...
│   ├── services/              # Business logic
│   │   ├── aiService.js          # 🤖 AI Features
│   │   ├── automationService.js   # ⚡ Automation
│   │   ├── searchService.js      # 🔍 Global Search
│   │   └── invoiceService.js     # 🧾 Invoice Logic
│   ├── models/               # MongoDB schemas
│   │   ├── User.js
│   │   ├── Client.js
│   │   ├── Project.js
│   │   ├── Invoice.js
│   │   ├── Task.js
│   │   └── ...
│   ├── routes/                # API routes
│   ├── middleware/           # Auth & validation
│   ├── config/               # DB & email config
│   └── server.js             # Express app
│
├── .github/workflows/        # CI/CD
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- npm or yarn

### 1. Clone the Repository

```bash
git clone https://github.com/farhankh8/freelanceflow.git
cd freelanceflow
```

### 2. Setup Backend

```bash
cd server

# Copy environment file
cp .env.example .env

# Edit .env with your credentials
# - MONGO_URI (MongoDB Atlas connection string)
# - JWT_ACCESS_SECRET (generate random string)
# - JWT_REFRESH_SECRET (generate random string)
# - GMAIL_USER & GMAIL_PASS (for emails)

# Install dependencies
npm install

# Start development server
npm run dev
```

### 3. Setup Frontend

```bash
cd client

# Copy environment file
cp .env.example .env

# Install dependencies
npm install

# Start development server
npm run dev
```

### 4. Open the App

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:5000

---

## 🔐 Environment Variables

### Server (.env)

```env
# Server
PORT=5000
NODE_ENV=development

# MongoDB
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/freelanceflow

# JWT (use strong random strings)
JWT_ACCESS_SECRET=your_very_long_random_access_secret_key_here
JWT_REFRESH_SECRET=your_very_long_random_refresh_secret_key_here

# Email (for sending notifications)
GMAIL_USER=your-email@gmail.com
GMAIL_PASS=your-app-password

# AI (optional - for Claude integration)
ANTHROPIC_API_KEY=sk-ant-xxxxx
```

### Client (.env)

```env
# API URL (empty for localhost)
VITE_API_URL=

# AI Features
VITE_ANTHROPIC_API_KEY=
```

---

## 📊 Database Schema

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│    User     │────▶│   Client    │────▶│   Project   │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │                    │
       │                   │                    │
       ▼                   ▼                    ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Invoice   │◀────│   Payment   │     │    Task     │
└─────────────┘     └─────────────┘     └─────────────┘
       │
       ▼
┌─────────────┐
│  TimeLog   │
└─────────────┘
```

---

## 🎨 Design System

### Color Palette

| Color | Hex | Usage |
|-------|-----|-------|
| Primary | `#6c63ff` | Buttons, links, accents |
| Secondary | `#ff6584` | Gradients, highlights |
| Success | `#00d97e` | Positive actions, money |
| Warning | `#ffb800` | Pending states |
| Danger | `#ff4d6d` | Errors, delete actions |

### Typography

- **Font:** Inter (Google Fonts)
- **Headings:** 800 weight
- **Body:** 400-500 weight
- **Monospace:** JetBrains Mono

---

## 💎 Plans & Pricing

### Free Plan
- ✅ Up to 2 clients
- ✅ Basic invoicing
- ✅ Time tracking
- ✅ Project management
- ✅ 5 team members
- 📵 AI features (locked)

### Pro Plan - ₹999/month
- ✅ **Everything in Free**
- ✅ **Unlimited clients**
- ✅ **GST-compliant invoices**
- ✅ **AI-powered insights**
- ✅ **Advanced analytics**
- ✅ **Recurring invoices**
- ✅ **Auto payment reminders**
- ✅ **Custom branding**
- ✅ **Priority support**

---

## 🔒 Security

- ✅ JWT-based authentication
- ✅ Refresh token rotation
- ✅ Password hashing (bcrypt 12 rounds)
- ✅ Rate limiting (200 req/min)
- ✅ Strict CORS policy
- ✅ Helmet security headers
- ✅ Input validation
- ✅ Environment secrets

---

## 🚢 Deployment

### Vercel (Frontend)

1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repo
3. Set environment variables
4. Deploy!

### Railway/Render (Backend)

1. Connect your GitHub repo
2. Set root directory to `server`
3. Add environment variables
4. Deploy!

### MongoDB Atlas

1. Create free cluster
2. Get connection string
3. Add to backend environment

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📧 Support

- **Email:** mohammadfarhan@gmail.com
- **Issues:** [GitHub Issues](https://github.com/farhankh8/freelanceflow/issues)

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">

### Built with ❤️ for Indian Freelancers 🇮🇳

**[FreelanceFlow](https://freelanceflow-gules.vercel.app)** - Your AI-Powered Freelance Operating System

*"Stop managing chaos. Start building empires."*

</div>

---

## 📈 Stats

![GitHub stars](https://img.shields.io/github/stars/farhankh8/freelanceflow?style=for-the-badge)
![GitHub forks](https://img.shields.io/github/forks/farhankh8/freelanceflow?style=for-the-badge)
![GitHub issues](https://img.shields.io/github/issues/farhankh8/freelanceflow?style=for-the-badge)

---

<p align="center">
  <a href="https://vercel.com/?utm_source=freelanceflow">
    <img src="https://img.shields.io/badge/Powered_by-Vercel-000000?style=for-the-badge&logo=vercel" alt="Powered by Vercel">
  </a>
</p>
" " 
" " 
