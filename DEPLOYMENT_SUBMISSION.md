# FreelanceFlow - Deployment Guide

## Live URLs

| Service | URL |
|---------|-----|
| Frontend (Vercel) | https://freelanceflow-blue-delta.vercel.app |
| Backend API (Render) | https://freelanceflow-api-80zc.onrender.com |

---

## Quick Start (Local Development)

### 1. Clone the Repository
```bash
git clone https://github.com/farhankh8/freelanceflow.git
cd freelanceflow
```

### 2. Setup Backend
```bash
cd server
npm install
cp .env.example .env
# Add your MongoDB Atlas URI to .env
npm run dev
```
Backend runs on: http://localhost:5000

### 3. Setup Frontend
```bash
cd client
npm install
npm run dev
```
Frontend runs on: http://localhost:5173

---

## Environment Variables Required

### Backend (.env)
```
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
NODE_ENV=production
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:5000/api/v1
```

---

## Deployment Platforms

### Frontend → Vercel
1. Connect GitHub repo to Vercel
2. Set Root Directory: `client`
3. Set Environment Variable: `VITE_API_URL=https://freelanceflow-api-80zc.onrender.com/api/v1`

### Backend → Render
1. Connect GitHub repo to Render
2. Set Root Directory: `server`
3. Build Command: `npm install`
4. Start Command: `npm start`
5. Add Environment Variables from .env

### Database → MongoDB Atlas
1. Create free cluster at mongodb.com/atlas
2. Get connection string
3. Add to Backend environment variables

---

## Testing the Application

1. Open https://freelanceflow-blue-delta.vercel.app
2. Register a new account
3. Click "Load Sample Data" on Dashboard to see demo data
4. Explore all features:
   - Add/Edit/Delete Clients
   - Create Projects
   - Log Time (Stopwatch or Manual)
   - Generate Invoices with PDF Download
   - View Reports/Charts

---

## Default Test Credentials (if available)

No default credentials - users must register.

---

## API Endpoints

### Authentication
- POST /api/v1/auth/register
- POST /api/v1/auth/login
- POST /api/v1/auth/refresh

### Resources (all require auth)
- GET/POST /api/v1/clients
- GET/PUT/DELETE /api/v1/clients/:id
- GET/POST /api/v1/projects
- GET/POST /api/v1/invoices
- GET/POST /api/v1/timelogs
- GET/POST /api/v1/expenses
- GET/POST /api/v1/payments
- GET/POST /api/v1/seed/sample

---

For questions: mohammadfarhankh.08@gmail.com
