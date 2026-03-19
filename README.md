# FreelanceFlow

> A production-ready, AI-powered SaaS application for freelancers to manage clients, projects, time tracking, invoicing, and finances.

![FreelanceFlow](https://img.shields.io/badge/version-3.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![React](https://img.shields.io/badge/React-19-61dafb.svg)
![Node.js](https://img.shields.io/badge/Node.js-20+-339933.svg)

## 🚀 Features

### Core Features
- **Client Management** - Track and manage freelance clients with GSTIN and contact details
- **Project Management** - Manage multiple projects with Kanban board view
- **Time Tracking** - Log work hours with start/stop timer
- **Invoice Generation** - Create professional GST-compliant invoices with PDF export
- **Lead/Contact Management** - Track potential clients and contacts
- **Financial Management** - Track expenses, payments, proposals, and contracts
- **Reports & Analytics** - Dashboard with revenue/expense charts and insights

### AI-Powered Features
- **Natural Language Commands** - Create invoices using natural language
- **Smart Insights** - Weekly AI-powered business insights
- **Payment Predictions** - Predict late payments with risk scoring
- **Pricing Recommendations** - Get personalized pricing suggestions

### India-Specific Features
- **GST-compliant Invoices** - CGST/SGST/IGST support
- **UPI Payment Tracking** - Record UPI transactions with UTR numbers
- **TDS Calculation** - Track TDS deductions on payments
- **INR Currency** - Default INR with multi-currency support

### Automation
- **Auto Payment Reminders** - Send reminders for upcoming due dates
- **Overdue Detection** - Automatic marking of overdue invoices
- **Recurring Invoices** - Set up recurring billing (Pro)

## 🛠️ Tech Stack

### Frontend
- **React 19** - UI framework
- **Vite** - Build tool
- **React Router DOM v7** - Client-side routing
- **Zustand** - State management
- **TanStack Query** - Server state & caching
- **Recharts** - Charts and visualizations
- **Framer Motion** - Animations

### Backend
- **Node.js** - JavaScript runtime
- **Express v5** - Web framework
- **MongoDB + Mongoose** - Database and ODM
- **JWT** - Authentication
- **PDFKit** - PDF generation
- **Nodemailer** - Email sending

## 📦 Installation

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (or local MongoDB)
- npm or yarn

### Setup

1. **Clone the repository**
```bash
git clone https://github.com/farhankh8/freelanceflow.git
cd freelanceflow
```

2. **Setup Backend**
```bash
cd server
cp .env.example .env
# Edit .env with your MongoDB URI and secrets
npm install
npm run dev
```

3. **Setup Frontend**
```bash
cd client
cp .env.example .env
npm install
npm run dev
```

4. **Open the app**
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

## 🔐 Environment Variables

### Server (.env)
```env
PORT=5000
MONGO_URI=mongodb+srv://...
JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
GMAIL_USER=your-email@gmail.com
GMAIL_PASS=your-app-password
```

### Client (.env)
```env
VITE_API_URL=https://your-api-url.com/api/v1
VITE_ANTHROPIC_API_KEY=your_anthropic_key
```

## 📁 Project Structure

```
freelanceflow/
├── client/                 # React Frontend
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── store/         # Zustand stores
│   │   ├── lib/           # Utilities (API client)
│   │   └── App.jsx        # Main app with routes
│   └── package.json
│
├── server/                 # Node.js Backend
│   ├── controllers/        # Route handlers
│   ├── services/          # Business logic layer
│   ├── models/            # Mongoose schemas
│   ├── routes/            # API routes
│   ├── middleware/       # Auth middleware
│   ├── config/            # Database, email config
│   └── server.js         # Express app
│
├── .github/workflows/     # CI/CD pipelines
├── .env.example           # Environment template
└── README.md
```

## 🔌 API Endpoints

All endpoints are prefixed with `/api/v1/`

| Resource   | Endpoints                          |
|------------|------------------------------------|
| Auth       | `/auth/register`, `/auth/login`     |
| Clients    | `/clients` (CRUD)                   |
| Projects   | `/projects` (CRUD)                  |
| Tasks      | `/tasks` (CRUD)                    |
| TimeLogs   | `/timelogs` (CRUD)                 |
| Invoices   | `/invoices` (CRUD + PDF)           |
| Leads      | `/leads` (CRUD)                    |
| Contacts   | `/contacts` (CRUD)                 |
| Expenses   | `/expenses` (CRUD)                 |
| Payments   | `/payments` (CRUD)                 |
| Proposals  | `/proposals` (CRUD)                |
| Dashboard  | `/dashboard/stats`                 |
| Search     | `/search?q=query`                  |

## 🎨 Design System

### Color Palette
- Primary: `#6c63ff` (Purple)
- Secondary: `#ff6584` (Pink)
- Success: `#00d97e` (Green)
- Warning: `#ffb800` (Yellow)
- Danger: `#ff4d6d` (Red)

### Typography
- Font: System sans-serif stack
- Headings: 800 weight
- Body: 400 weight

## 📊 Plans & Pricing

### Free Plan
- Up to 2 clients
- Basic invoicing
- Time tracking
- Email support

### Pro Plan (₹999/month)
- Unlimited clients
- GST-compliant invoices
- AI-powered insights
- Advanced reports
- Recurring invoices
- Payment reminders
- Priority support

## 🔒 Security

- JWT-based authentication with refresh tokens
- Password hashing with bcrypt (12 rounds)
- Rate limiting on auth endpoints
- Helmet security headers
- Input validation with express-validator
- Row-level security with user-scoped queries

## 🚢 Deployment

### Vercel (Frontend)
1. Connect GitHub repository
2. Set environment variables
3. Deploy

### Railway/Render (Backend)
1. Connect GitHub repository
2. Set environment variables
3. Deploy

### MongoDB Atlas
1. Create free cluster
2. Get connection string
3. Add to environment variables

## 📝 License

MIT License - feel free to use this project for personal or commercial purposes.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📧 Support

For support, email mohammadfarhan@gmail.com or open an issue on GitHub.

---

Built with ❤️ for freelancers in India 🇮🇳
