# 🚀 FreelanceFlow
### An Intelligent Freelance Management System

![Version](https://img.shields.io/badge/version-2.0.0-00D9FF?style=for-the-badge)
![Build](https://img.shields.io/badge/build-passing-00FF9D?style=for-the-badge)
![License](https://img.shields.io/badge/license-MIT-FF6B6B?style=for-the-badge)
![Stars](https://komarev.com/gits/stars/farhankh8/FreelanceFlow?color=00D9FF&style=for-the-badge)
![Forks](https://komarev.com/gits/forks/farhankh8/FreelanceFlow?color=00FF9D&style=for-the-badge)
![Views](https://komarev.com/gits/hits/farhankh8/FreelanceFlow?color=FF6B6B&style=for-the-badge)

---

<p align="center">
  <a href="https://freelanceflow-blue-delta.vercel.app">
    <img src="https://img.shields.io/badge/LIVE_WEB_APP-00D9FF?style=for-the-badge&logo=vercel&logoColor=white" />
  </a>
  <a href="https://freelanceflow-api-80zc.onrender.com">
    <img src="https://img.shields.io/badge/API_SERVER-00FF9D?style=for-the-badge&logo=render&logoColor=white" />
  </a>
  <a href="https://github.com/farhankh8/FreelanceFlow">
    <img src="https://img.shields.io/badge/GITHUB-FFFFFF?style=for-the-badge&logo=github&logoColor=black" />
  </a>
</p>

---

## ✨ Key Features

| # | Feature | Description | Tech |
|:--:|---------|-------------|:---:|
| 1 | 👥 Client Management | Full CRUD, search, filter | React |
| 2 | 📁 Project Tracking | Status, budgets, deadlines | React |
| 3 | 📄 Invoice Generation | Auto-calculate, GST, PDF | jsPDF |
| 4 | ⏱️ Time Tracking | Stopwatch, earnings | React |
| 5 | 💰 Financial Dashboard | Revenue charts | Recharts |
| 6 | 🤝 Lead Management | Pipeline, proposals | React |
| 7 | 🔐 Authentication | JWT + bcrypt | JWT |
| 8 | 📱 Responsive UI | Dark theme | CSS3 |

---

## 🛠️ Tech Stack

| Frontend | Backend | Database | Deployment |
|:---:|:---:|:---:|:---:|
| <img width="40" src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg"/><br>React.js | <img width="40" src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg"/><br>Node.js | <img width="40" src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mongodb/mongodb-original.svg"/><br>MongoDB | <img width="40" src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vercel/vercel-original.svg"/><br>Vercel |
| <img width="40" src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vite/vite-original.svg"/><br>Vite | <img width="40" src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/express/express-original.svg"/><br>Express | <img width="40" src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/amazonwebservices/amazonwebservices-original.svg"/><br>Atlas | <img width="40" src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/render/render-original.svg"/><br>Render |

---

## 📁 Project Structure

```
FreelanceFlow/
├── 📄 package.json          # Root config
├── 📁 client/             # React Frontend
│   ├── 📄 vite.config.js
│   └── 📁 src/
│       ├── 📄 App.jsx
│       ├── 📄 main.jsx
│       ├── 📁 components/
│       ├── 📁 pages/
│       ├── 📁 store/
│       └── 📁 styles/
├── 📄 server/             # Express Backend
│   ├── 📄 server.js
│   ├── 📁 config/
│   ├── 📁 middleware/
│   ├── 📁 models/
│   ├── 📁 routes/
│   ├── 📁 services/
│   └── 📁 utils/
└── 📁 FINAL_SUBMISSION/   # Academic Reports
    ├── 📄 FREELANCEFLOW_PROJECT_REPORT.md
    ├── 📄 FREELANCEFLOW_SYNOPSIS.md
    └── 📄 FREELANCEFLOW_PRESENTATION.md
```

---

## 🏃‍♂️ Quick Start

```bash
# Clone the repository
git clone https://github.com/farhankh8/FreelanceFlow.git
cd FreelanceFlow

# Install dependencies
cd client && npm install
cd ../server && npm install

# Run development
# Terminal 1: Backend
cd server && npm run dev

# Terminal 2: Frontend
cd client && npm run dev
```

---

## 🔧 Environment Variables

```env
# Server (.env)
PORT=5000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your_jwt_secret
NODE_ENV=development

# Client (.env)
VITE_API_URL=http://localhost:5000
VITE_APP_NAME=FreelanceFlow
```

---

## 📡 API Endpoints

| Method | Endpoint | Description | Auth |
|:------:|----------|-------------|:---:|
| POST | `/api/auth/register` | Register new user | ❌ |
| POST | `/api/auth/login` | Login user | ❌ |
| GET/POST | `/api/clients` | Get/Create clients | ✅ |
| PUT/DELETE | `/api/clients/:id` | Update/Delete client | ✅ |
| GET/POST | `/api/projects` | Get/Create projects | ✅ |
| GET/POST | `/api/invoices` | Get/Create invoices | ✅ |
| GET/POST | `/api/timelogs` | Get/Create time logs | ✅ |
| GET/POST | `/api/expenses` | Get/Create expenses | ✅ |
| GET/POST | `/api/leads` | Get/Create leads | ✅ |

---

## 🌐 Live Demo

<p align="center">
  <a href="https://freelanceflow-blue-delta.vercel.app" target="_blank">
    <img src="https://img.shields.io/badge/🌐_Live_Web_App-00D9FF?style=for-the-badge&logo=vercel&logoColor=white" alt="Live App" />
  </a>
</p>

| Platform | URL | Status |
|----------|------|:---:|
| 🌐 Web App | [freelanceflow-blue-delta.vercel.app](https://freelanceflow-blue-delta.vercel.app) | ✅ |
| ⚡ API | [freelanceflow-api-80zc.onrender.com](https://freelanceflow-api-80zc.onrender.com) | ✅ |
| 💻 GitHub | [github.com/farhankh8/FreelanceFlow](https://github.com/farhankh8/FreelanceFlow) | ✅ |

---

## 🤝 Contributing

```bash
# Fork the repository
# Create your feature branch
git checkout -b feature/AmazingFeature
# Commit your changes
git commit -m 'Add some AmazingFeature'
# Push to the branch
git push origin feature/AmazingFeature
# Open a Pull Request
```

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Developer

| Detail | Value |
|--------|-------|
| **Name** | K H Mohammad Farhan |
| **Register No** | 23BCAICD182 |
| **Course** | BCA (AI CC & DevOps with TCS) |
| **Institute** | Yenepoya Institute of Arts, Science, Commerce and Management |
| **Internal Guide** | Ms. Aysha Dilshad |
| **Organization** | Persevex Education Consultancy LLP |

---

## ⭐ Show Your Support

<p align="center">
  <a href="https://github.com/farhankh8/FreelanceFlow/fork">
    <img src="https://img.shields.io/badge/Fork-00D9FF?style=for-the-badge&logo=github&logoColor=white" alt="Fork" />
  </a>
  <a href="https://github.com/farhankh8/FreelanceFlow/stargazers">
    <img src="https://img.shields.io/badge/Star-FF6B6B?style=for-the-badge&logo=github&logoColor=white" alt="Star" />
  </a>
  <a href="https://github.com/farhankh8/FreelanceFlow/issues">
    <img src="https://img.shields.io/badge/Issues-00FF9D?style=for-the-badge&logo=github&logoColor=black" alt="Issues" />
  </a>
</p>

---

<p align="center">
  <strong>FreelanceFlow © 2026 | Built with ❤️ using MERN Stack</strong>
  <br>
  <sub>Last updated: April 2026</sub>
</p>