import { useState, useCallback, memo, useEffect, useRef } from "react"
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom"
import toast from "react-hot-toast"
import useAuthStore from "../store/authStore"
import useNotificationStore from "../store/notificationStore"

const navGroups = [
  { label: "Main", items: [
    { to: "/app", icon: "⬡", label: "Dashboard" },
    { to: "/app/clients", icon: "👥", label: "Clients" },
    { to: "/app/projects", icon: "🚀", label: "Projects" },
    { to: "/app/leads", icon: "🎯", label: "Leads" },
    { to: "/app/contacts", icon: "📇", label: "Contacts" },
  ]},
  { label: "Finance", items: [
    { to: "/app/invoices", icon: "🧾", label: "Invoices" },
    { to: "/app/expenses", icon: "💸", label: "Expenses" },
    { to: "/app/payments", icon: "💳", label: "Payments" },
    { to: "/app/time", icon: "⏱️", label: "Time Logs" },
    { to: "/app/proposals", icon: "📝", label: "Proposals" },
    { to: "/app/contracts", icon: "📜", label: "Contracts" },
  ]},
  { label: "Work", items: [
    { to: "/app/tasks", icon: "✅", label: "Tasks" },
    { to: "/app/calendar", icon: "📅", label: "Calendar" },
    { to: "/app/kanban", icon: "📌", label: "Kanban" },
    { to: "/app/meetings", icon: "🎥", label: "Meetings" },
  ]},
  { label: "Growth", items: [
    { to: "/app/reports", icon: "📊", label: "Reports" },
    { to: "/app/clients-portal", icon: "🏠", label: "Client Portal" },
  ]},
  { label: "Tools", items: [
    { to: "/app/settings", icon: "⚙️", label: "Settings" },
    { to: "/app/help", icon: "❓", label: "Help" },
  ]}
]

const workerNavGroups = [
  { label: "Work", items: [
    { to: "/app", icon: "⬡", label: "Dashboard" },
    { to: "/app/tasks", icon: "✅", label: "Tasks" },
    { to: "/app/time", icon: "⏱️", label: "Time Logs" },
    { to: "/app/worker-payments", icon: "💳", label: "Payments" },
  ]},
]

const managerNavGroups = [
  { label: "Main", items: [
    { to: "/app", icon: "⬡", label: "Dashboard" },
    { to: "/app/clients", icon: "👥", label: "Clients" },
    { to: "/app/projects", icon: "🚀", label: "Projects" },
    { to: "/app/leads", icon: "🎯", label: "Leads" },
    { to: "/app/contacts", icon: "📇", label: "Contacts" },
  ]},
  { label: "Finance", items: [
    { to: "/app/invoices", icon: "🧾", label: "Invoices" },
    { to: "/app/expenses", icon: "💸", label: "Expenses" },
    { to: "/app/payments", icon: "💳", label: "Payments" },
    { to: "/app/time", icon: "⏱️", label: "Time Logs" },
    { to: "/app/proposals", icon: "📝", label: "Proposals" },
    { to: "/app/contracts", icon: "📜", label: "Contracts" },
  ]},
  { label: "Work", items: [
    { to: "/app/tasks", icon: "✅", label: "Tasks" },
    { to: "/app/calendar", icon: "📅", label: "Calendar" },
    { to: "/app/kanban", icon: "📌", label: "Kanban" },
    { to: "/app/meetings", icon: "🎥", label: "Meetings" },
  ]},
  { label: "Team", items: [
    { to: "/app/workers", icon: "👥", label: "Workers" },
  ]},
  { label: "Growth", items: [
    { to: "/app/reports", icon: "📊", label: "Reports" },
    { to: "/app/clients-portal", icon: "🏠", label: "Client Portal" },
  ]},
  { label: "Tools", items: [
    { to: "/app/settings", icon: "⚙️", label: "Settings" },
    { to: "/app/help", icon: "❓", label: "Help" },
  ]}
]

const badgeColors = { "New": { bg: "rgba(0,217,126,0.15)", color: "#00d97e", border: "rgba(0,217,126,0.3)" } }

export default memo(function Layout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const [showNotif, setShowNotif] = useState(false)
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotificationStore()
  const notifRef = useRef(null)
  
  useEffect(() => {
    if (!showNotif) return
    const handleClick = (e) => { if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotif(false) }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [showNotif])

  const isWorker = user?.role === "worker"
  const groups = isWorker ? workerNavGroups : managerNavGroups

  const handleLogout = useCallback(() => { logout(); toast.success("Logged out!"); navigate("/") }, [logout, navigate])

  const getPageName = () => {
    if (location.pathname === "/app") return "Dashboard"
    return location.pathname.replace("/app/", "").replace(/-/g, " ").replace(/^\w/, c => c.toUpperCase())
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}>
      {/* Skip to main content link */}
      <a href="#main-content" className="skip-link">Skip to main content</a>

      <nav aria-label="Main navigation" style={{ width: collapsed ? "60px" : "240px", background: "var(--surface)", borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", position: "fixed", height: "100vh", zIndex: 100, transition: "width 0.2s ease", overflow: "hidden" }}>
        <div style={{ padding: collapsed ? "16px 8px" : "16px 14px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {!collapsed && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ width: "30px", height: "30px", borderRadius: "8px", background: "linear-gradient(135deg,#6c63ff,#ff6584)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px" }}>💼</div>
              <div>
                <div style={{ fontSize: "14px", fontWeight: 800, background: "linear-gradient(135deg,#6c63ff,#ff6584)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>FreelanceFlow</div>
                <div style={{ fontSize: "9px", color: "var(--text2)", display: "flex", alignItems: "center", gap: "3px" }}>
                  <div style={{ width: "4px", height: "4px", borderRadius: "50%", background: "var(--success)" }} />
                  {user?.plan === "pro" ? "Pro Plan" : "Free Plan"}
                </div>
              </div>
            </div>
          )}
          {collapsed && <div style={{ width: "30px", height: "30px", borderRadius: "8px", background: "linear-gradient(135deg,#6c63ff,#ff6584)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px" }}>💼</div>}
          <button onClick={() => setCollapsed(c => !c)} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} style={{ background: "transparent", border: "none", color: "var(--text2)", cursor: "pointer", fontSize: "16px", padding: "4px", borderRadius: "6px" }}>{collapsed ? "→" : "←"}</button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: collapsed ? "8px 6px" : "10px 8px" }}>
          {groups.map(group => (
            <div key={group.label} style={{ marginBottom: "16px" }}>
              {!collapsed && <div style={{ fontSize: "9px", fontWeight: 700, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.12em", padding: "0 6px", marginBottom: "4px" }}>{group.label}</div>}
              {group.items.map(({ to, icon, label, badge }) => {
                const active = location.pathname === to
                return (
                  <Link key={to} to={to} aria-label={collapsed ? label : undefined} aria-current={active ? "page" : undefined}
                    style={{ display: "flex", alignItems: "center", gap: "8px", padding: collapsed ? "10px" : "7px 8px", borderRadius: "8px", marginBottom: "1px", color: active ? "var(--accent)" : "var(--text2)", background: active ? "rgba(108,99,255,0.12)" : "transparent", textDecoration: "none", fontSize: "13px", fontWeight: active ? 600 : 500, border: active ? "1px solid rgba(108,99,255,0.2)" : "1px solid transparent", justifyContent: collapsed ? "center" : "flex-start" }}>
                    <span style={{ fontSize: "15px" }}>{icon}</span>
                    {!collapsed && <span style={{ flex: 1 }}>{label}</span>}
                  </Link>
                )
              })}
            </div>
          ))}
        </div>

        <div style={{ borderTop: "1px solid var(--border)", padding: collapsed ? "8px 6px" : "10px 8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: collapsed ? "8px 4px" : "10px 8px", borderRadius: "10px", background: "var(--surface2)", border: "1px solid var(--border)" }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "linear-gradient(135deg,#6c63ff,#ff6584)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: 700, color: "#fff" }}>{user?.name?.charAt(0).toUpperCase()}</div>
            {!collapsed && (
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "12px", fontWeight: 700 }}>{user?.name}</div>
                <div style={{ fontSize: "10px", color: "var(--text2)" }}>{user?.email}</div>
              </div>
            )}
          </div>
        </div>
      </nav>

      <div style={{ marginLeft: collapsed ? "60px" : "240px", flex: 1, display: "flex", flexDirection: "column", minHeight: "100vh", transition: "margin-left 0.2s ease" }}>
        <header style={{ height: "52px", background: "var(--surface)", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", position: "sticky", top: 0, zIndex: 50 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "13px", color: "var(--text2)" }}>FreelanceFlow</span>
            <span style={{ color: "var(--border)" }}>›</span>
            <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)", textTransform: "capitalize" }}>{getPageName()}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {/* Notification Bell */}
            <div style={{ position: "relative" }} ref={notifRef}>
              <button onClick={() => setShowNotif(!showNotif)} style={{ width: "36px", height: "36px", borderRadius: "50%", background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", position: "relative" }}>
                🔔
                {unreadCount > 0 && <span style={{ position: "absolute", top: "2px", right: "2px", width: "16px", height: "16px", borderRadius: "50%", background: "#ff4d6d", color: "#fff", fontSize: "10px", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{unreadCount > 9 ? "9+" : unreadCount}</span>}
              </button>
              {showNotif && (
                <div style={{ position: "absolute", top: "100%", right: 0, width: "320px", maxHeight: "400px", overflow: "auto", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "8px", boxShadow: "0 4px 12px rgba(0,0,0,0.15)", zIndex: 100, marginTop: "8px" }}>
                  <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "14px", fontWeight: 600 }}>Notifications</span>
                    {unreadCount > 0 && <button onClick={markAllAsRead} style={{ fontSize: "12px", color: "var(--accent)", background: "none", border: "none", cursor: "pointer" }}>Mark all read</button>}
                  </div>
                  {(!notifications || notifications.length === 0) ? (
                    <div style={{ padding: "24px", textAlign: "center", color: "var(--text2)", fontSize: "13px" }}>No notifications yet</div>
                  ) : (
                    notifications.slice(0, 10).map(n => (
                      <div key={n.id} onClick={() => markAsRead(n.id)} style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", background: n.read ? "transparent" : "rgba(108,99,255,0.05)", cursor: "pointer" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                          <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: n.color || "#2979ff" }} />
                          <span style={{ fontSize: "13px", fontWeight: 600 }}>{n.title}</span>
                        </div>
                        <p style={{ fontSize: "12px", color: "var(--text2)", margin: 0 }}>{n.message}</p>
                        <span style={{ fontSize: "11px", color: "var(--text2)" }}>{new Date(n.timestamp).toLocaleTimeString()}</span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
            <div style={{ width: "34px", height: "34px", borderRadius: "50%", background: "linear-gradient(135deg,#6c63ff,#ff6584)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: 700, color: "#fff" }}>{user?.name?.charAt(0).toUpperCase()}</div>
            <button onClick={handleLogout} aria-label="Log out of your account" style={{ padding: "6px 12px", background: "rgba(255,77,109,0.1)", border: "1px solid rgba(255,77,109,0.3)", borderRadius: "8px", color: "#ff4d6d", cursor: "pointer", fontSize: "12px", fontWeight: 600 }}>Logout</button>
          </div>
        </header>
        <main id="main-content" style={{ flex: 1, padding: "24px 28px", background: "var(--bg)" }} tabIndex={-1}>
          <Outlet />
        </main>
      </div>
    </div>
  )
})
