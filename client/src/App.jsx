import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { Toaster } from "react-hot-toast"
import { Suspense, lazy, useEffect, useRef } from "react"
import useAuthStore from "./store/authStore"
import ErrorBoundary from "./components/ErrorBoundary"
import Layout from "./components/Layout"
import { requestNotificationPermission, onForegroundMessage } from "./lib/firebase"
import toast from "react-hot-toast"

const Landing = lazy(() => import("./pages/Landing"))
const Login = lazy(() => import("./pages/Login"))
const Register = lazy(() => import("./pages/Register"))
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"))
const ResetPassword = lazy(() => import("./pages/ResetPassword"))
const GoogleAuth = lazy(() => import("./pages/GoogleAuth"))
const Dashboard = lazy(() => import("./pages/Dashboard"))
const Clients = lazy(() => import("./pages/Clients"))
const Invoices = lazy(() => import("./pages/Invoices"))
const Projects = lazy(() => import("./pages/Projects"))
const Leads = lazy(() => import("./pages/Leads"))
const Contacts = lazy(() => import("./pages/Contacts"))
const Expenses = lazy(() => import("./pages/Expenses"))
const Payments = lazy(() => import("./pages/Payments"))
const TimeLogs = lazy(() => import("./pages/TimeLogs"))
const Proposals = lazy(() => import("./pages/Proposals"))
const Contracts = lazy(() => import("./pages/Contracts"))
const Tasks = lazy(() => import("./pages/Tasks"))
const Reports = lazy(() => import("./pages/Reports"))
const Settings = lazy(() => import("./pages/Settings"))
const Calendar = lazy(() => import("./pages/Calendar"))
const Meetings = lazy(() => import("./pages/Meetings"))
const ClientPortal = lazy(() => import("./pages/ClientPortal"))
const Help = lazy(() => import("./pages/Help"))
const Billing = lazy(() => import("./pages/Billing"))

const PageLoader = () => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh", flexDirection: "column", gap: "16px", color: "var(--text2)" }}>
    <div style={{ width: "40px", height: "40px", border: "3px solid var(--border)", borderTop: "3px solid var(--accent)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </div>
)

const PrivateRoute = ({ children }) => {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn())
  const user = useAuthStore((state) => state.user)
  const isPro = user?.plan === 'pro'
  if (!isLoggedIn) return <Navigate to="/login" replace />
  if (!isPro) return <Navigate to="/billing" replace />
  return children
}

const AuthRoute = ({ children }) => {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn())
  if (!isLoggedIn) return <Navigate to="/login" replace />
  return children
}

const ComingSoon = ({ title }) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "400px", gap: "16px", color: "var(--text2)" }}>
    <div style={{ fontSize: "64px" }}>🚧</div>
    <h2 style={{ fontSize: "24px", fontWeight: 800, color: "var(--text)" }}>{title}</h2>
    <p style={{ fontSize: "15px" }}>Coming soon — we're building it!</p>
  </div>
)

import useTimerStore from "./store/timerStore"

export default function App() {
  const timerRef = useRef(null)
  const { running, tick } = useTimerStore()
  
  useEffect(() => {
    if (running && !timerRef.current) {
      timerRef.current = setInterval(() => useTimerStore.getState().tick(), 1000)
    } else if (!running && timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [running])

  useEffect(() => {
    const setupNotifications = async () => {
      const token = await requestNotificationPermission()
      if (token) {
        console.log("FCM Token:", token)
      }
    }
    setupNotifications()
    
    onForegroundMessage((payload) => {
      const { notification } = payload
      if (notification) {
        toast(notification.body, {
          icon: "🔔",
          duration: 5000,
        })
      }
    })
  }, [])
  
  return (
    <BrowserRouter>
      <Toaster 
        position="top-right" 
        toastOptions={{ 
          style: { background: "#1a1a24", color: "#f0f0f8", border: "1px solid #2a2a3a", zIndex: 999999 },
          duration: 3000,
        }} 
        containerStyle={{
          top: 20,
          right: 20,
          zIndex: 999999,
        }}
      />
      <ErrorBoundary>
      <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/google-auth" element={<GoogleAuth />} />
        <Route path="/billing" element={<AuthRoute><Billing /></AuthRoute>} />
        <Route path="/app" element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="clients" element={<Clients />} />
          <Route path="invoices" element={<Invoices />} />
          <Route path="projects" element={<Projects />} />
          <Route path="leads" element={<Leads />} />
          <Route path="contacts" element={<Contacts />} />
          <Route path="expenses" element={<Expenses />} />
          <Route path="payments" element={<Payments />} />
          <Route path="time" element={<TimeLogs />} />
          <Route path="proposals" element={<Proposals />} />
          <Route path="contracts" element={<Contracts />} />
          <Route path="tasks" element={<Tasks />} />
          <Route path="reports" element={<Reports />} />
          <Route path="calendar" element={<Calendar />} />
          <Route path="kanban" element={<Projects />} />
          <Route path="meetings" element={<Meetings />} />
          <Route path="clients-portal" element={<ClientPortal />} />
          <Route path="settings" element={<Settings />} />
          <Route path="help" element={<Help />} />
          <Route path="marketplace" element={<ComingSoon title="Find Projects" />} />
          <Route path="documents" element={<ComingSoon title="Documents" />} />
          <Route path="templates" element={<ComingSoon title="Templates" />} />
          <Route path="automations" element={<ComingSoon title="Automations" />} />
          <Route path="integrations" element={<ComingSoon title="Integrations" />} />
        </Route>
      </Routes>
      </Suspense>
      </ErrorBoundary>
    </BrowserRouter>
  )
}