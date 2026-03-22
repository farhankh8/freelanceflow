import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { Toaster } from "react-hot-toast"
import useAuthStore from "./store/authStore"
import Landing from "./pages/Landing"
import Login from "./pages/Login"
import Register from "./pages/Register"
import Dashboard from "./pages/Dashboard"
import Clients from "./pages/Clients"
import Invoices from "./pages/Invoices"
import Projects from "./pages/Projects"
import Leads from "./pages/Leads"
import Contacts from "./pages/Contacts"
import Expenses from "./pages/Expenses"
import Payments from "./pages/Payments"
import TimeLogs from "./pages/TimeLogs"
import Proposals from "./pages/Proposals"
import Contracts from "./pages/Contracts"
import Tasks from "./pages/Tasks"
import Reports from "./pages/Reports"
import Settings from "./pages/Settings"
import Calendar from "./pages/Calendar"
import Meetings from "./pages/Meetings"
import ClientPortal from "./pages/ClientPortal"
import Help from "./pages/Help"
import Layout from "./components/Layout"
import GlobalSearch from "./components/GlobalSearch"

const PrivateRoute = ({ children }) => {
  const { accessToken } = useAuthStore()
  return accessToken ? children : <Navigate to="/login" replace />
}

const ComingSoon = ({ title }) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "400px", gap: "16px", color: "var(--text2)" }}>
    <div style={{ fontSize: "64px" }}>🚧</div>
    <h2 style={{ fontSize: "24px", fontWeight: 800, color: "var(--text)" }}>{title}</h2>
    <p style={{ fontSize: "15px" }}>Coming soon — we're building it!</p>
  </div>
)

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{ style: { background: "#1a1a24", color: "#f0f0f8", border: "1px solid #2a2a3a" } }} />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
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
          <Route path="marketplace" element={<ComingSoon title="Find Projects" />} />
          <Route path="analytics" element={<Reports />} />
          <Route path="clients-portal" element={<ClientPortal />} />
          <Route path="documents" element={<ComingSoon title="Documents" />} />
          <Route path="templates" element={<ComingSoon title="Templates" />} />
          <Route path="automations" element={<ComingSoon title="Automations" />} />
          <Route path="integrations" element={<ComingSoon title="Integrations" />} />
          <Route path="settings" element={<Settings />} />
          <Route path="help" element={<Help />} />
        </Route>
      </Routes>
      <GlobalSearch />
    </BrowserRouter>
  )
}