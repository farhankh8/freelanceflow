# 💼 FreelanceFlow

<p align="center">
  <img src="https://img.shields.io/badge/Version-3.0.0-6c63ff?style=for-the-badge" alt="Version">
  <img src="https://img.shields.io/badge/React-19-61dafb?style=for-the-badge&logo=react" alt="React">
  <img src="https://img.shields.io/badge/Node.js-20+-339933?style=for-the-badge&logo=node.js" alt="Node">
  <img src="https://img.shields.io/badge/MongoDB-Latest-47A248?style=for-the-badge&logo=mongodb" alt="MongoDB">
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="License">
</p>

<p align="center">
  <img src="https://img.shields.io/badge/India-GST-00d97e?style=for-the-badge" alt="GST">
  <img src="https://img.shields.io/badge/Built-For-Freelancers-f59e0b?style=for-the-badge" alt="Freelancers">
</p>

---

## 🎓 Academic Project

**Student:** K H Mohammad Farhan  
**Register No:** 23BCAICD182  
**Course:** BCA Final Year (6th Sem) - AI CC & DevOps with TCS  
**Institute:** Yenepoya Institute of Arts, Science, Commerce and Management  
**Guide:** Ms. Aysha Dilshad (Internal Guide)  
**Internship:** Persevex Education Consultancy LLP, Bengaluru

---

## ✨ Features

### 📊 Dashboard
- Real-time revenue tracking
- Client summary cards
- Recent activity feed
- Quick action buttons

### 👥 Client Management
- Full client profiles
- Contact information
- Status tracking (Active/Inactive/Prospect)
- Industry categorization

### 🧾 Invoice Generation
- GST-compliant invoices
- Auto-calculation with tax
- PDF export
- Professional format

### 🚀 Project Management
- Status tracking (Planning → Active → Completed)
- Budget management
- Deadline tracking
- Client association

### ⏱️ Time Tracking
- Start/Stop timer
- Manual time entry
- Project association
- Earnings calculation

### 📈 Reports & Analytics
- Revenue vs Expenses charts
- Client-wise breakdown
- Expense categories
- Monthly/Yearly views

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React.js 18 + Vite |
| State Management | Zustand |
| Backend | Node.js + Express.js |
| Database | MongoDB Atlas |
| Authentication | JWT + bcrypt |
| Charts | Recharts |
| PDF | jsPDF |
| Deployment | Vercel + Render |

---

## 📁 Project Structure

```
freelanceflow/
├── client/                      # React Frontend
│   ├── src/
│   │   ├── components/        # UI components
│   │   ├── pages/            # Page components
│   │   ├── services/         # API services
│   │   ├── store/           # Zustand stores
│   │   └── App.jsx          # Main app
│   └── package.json
│
├── server/                      # Node.js Backend
│   ├── controllers/           # Route handlers
│   ├── models/               # MongoDB schemas
│   ├── routes/                # API routes
│   ├── middleware/           # Auth middleware
│   └── server.js             # Express app
│
├── FREELANCEFLOW_SYNOPSIS.md      # Project Synopsis
├── FREELANCEFLOW_PROJECT_REPORT.md # Full Project Report
├── FREELANCEFLOW_PRESENTATION.md  # Presentation Content
├── Project_Presentation.html      # Interactive HTML Presentation
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
git clone https://github.com/farhankh8/FreelanceFlow.git
cd FreelanceFlow
```

### 2. Setup Backend

```bash
cd server
npm install
npm run dev
```

### 3. Setup Frontend

```bash
cd client
npm install
npm run dev
```

### 4. Open the App

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:5000

---

## 🔐 Environment Variables

### Server (.env)
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/freelanceflow
JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
```

### Client (.env)
```env
VITE_API_URL=
```

---

## 🔒 Security

- ✅ JWT-based authentication
- ✅ Password hashing (bcrypt)
- ✅ Strict data isolation (user-specific)
- ✅ Protected API routes
- ✅ CORS configuration

---

## 🚢 Deployment

### Live URLs
- **Frontend:** https://freelanceflow-blue-delta.vercel.app
- **Backend API:** https://freelanceflow-api-80zc.onrender.com

---

## 📧 Contact

**Developer:** K H Mohammad Farhan  
**Email:** mohammadfarhan008800@gmail.com  
**Phone:** 9108386969

---

## 📄 License

This project is licensed under the MIT License.

---

<div align="center">

### Built with ❤️ for Freelancers

**FreelanceFlow** - An Intelligent Freelance Management System

</div>
