# 🚀 FreelanceFlow
## An Intelligent Freelance Management System

![Version](https://img.shields.io/badge/version-2.0.0-00D9FF)
![Build](https://img.shields.io/badge/build-passing-00FF9D)
![License](https://img.shields.io/badge/license-MIT-FF6B6B)
![Stars](https://komarev.com/gits/stars/farhankh8/FreelanceFlow?color=00D9FF)
![Forks](https://komarev.com/gits/forks/farhankh8/FreelanceFlow?color=00FF9D)

|[🌐 Live Web App](https://freelanceflow-blue-delta.vercel.app)|[⚡ API Server](https://freelanceflow-api-80zc.onrender.com)|[💻 GitHub](https://github.com/farhankh8/FreelanceFlow)|
|---|---|---|

---

## ✨ Features

| Feature | Description | Status |
|---------|-------------|:------:|
| 👥 Client Management | Full CRUD, search, filter | ✅ |
| 📁 Project Tracking | Status workflow, budgets | ✅ |
| 📄 Invoice Generation | Auto-calculate, GST, PDF | ✅ |
| ⏱️ Time Tracking | Stopwatch, earnings | ✅ |
| 💰 Financial Dashboard | Revenue charts | ✅ |
| 🤝 Lead Management | Pipeline, proposals | ✅ |
| 🔐 Authentication | JWT + bcrypt | ✅ |
| 📱 Responsive UI | Dark theme | ✅ |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React.js 18 + Vite |
| State | Zustand |
| Backend | Node.js + Express |
| Database | MongoDB Atlas |
| Auth | JWT + bcrypt |
| Charts | Recharts |
| PDF | jsPDF |
| Deploy | Vercel + Render |

---

## 📁 Project Structure

```
FreelanceFlow/
├── client/              # React Frontend
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── store/
│   │   └── styles/
│   └── public/
├── server/              # Express Backend
│   ├── config/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   └── utils/
```

---

## 🏃‍♂️ Quick Start

```bash
# Clone
git clone https://github.com/farhankh8/FreelanceFlow.git
cd FreelanceFlow

# Install
cd client && npm install
cd ../server && npm install

# Run (2 terminals)
cd server && npm run dev    # Backend
cd client && npm run dev   # Frontend
```

---

## 📡 API Endpoints

| Method | Endpoint | Description | Auth |
|:------:|----------|-------------|:---:|
| POST | `/api/auth/register` | Register | ❌ |
| POST | `/api/auth/login` | Login | ❌ |
| GET | `/api/clients` | Get clients | ✅ |
| POST | `/api/clients` | Create client | ✅ |
| GET | `/api/projects` | Get projects | ✅ |
| GET | `/api/invoices` | Get invoices | ✅ |
| GET | `/api/timelogs` | Get time logs | ✅ |
| GET | `/api/expenses` | Get expenses | ✅ |
| GET | `/api/leads` | Get leads | ✅ |

---

## 👨‍💻 Developer

| Field | Details |
|-------|---------|
| Name | K H Mohammad Farhan |
| Reg No | 23BCAICD182 |
| Course | BCA (AI CC & DevOps with TCS) |
| Institute | Yenepoya Institute of Arts, Science, Commerce and Management |
| Guide | Ms. Aysha Dilshad |
| Organization | Persevex Education Consultancy LLP |

---

## ⭐ Support

[Star](https://github.com/farhankh8/FreelanceFlow/stargazers) | [Fork](https://github.com/farhankh8/FreelanceFlow/fork) | [Issues](https://github.com/farhankh8/FreelanceFlow/issues)

---

**FreelanceFlow © 2026 | Built with ❤️ using MERN Stack**