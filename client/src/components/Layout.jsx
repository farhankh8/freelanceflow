import { useState, useEffect } from "react"
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom"
import toast from "react-hot-toast"
import useAuthStore from "../store/authStore"
import AIChatbot from "./AIChatbot"
import GlobalSearch from "./GlobalSearch"

const navGroups = [
  {
    label: "Main",
    items: [
      { to: "/app", icon: "⬡", label: "Dashboard" },
      { to: "/app/clients", icon: "👥", label: "Clients" },
      { to: "/app/projects", icon: "🚀", label: "Projects" },
      { to: "/app/leads", icon: "🎯", label: "Leads", badge: "New" },
      { to: "/app/contacts", icon: "📇", label: "Contacts" },
    ]
  },
  {
    label: "Finance",
    items: [
      { to: "/app/invoices", icon: "🧾", label: "Invoices" },
      { to: "/app/expenses", icon: "💸", label: "Expenses", badge: "New" },
      { to: "/app/payments", icon: "💳", label: "Payments" },
      { to: "/app/time", icon: "⏱️", label: "Time Logs" },
      { to: "/app/proposals", icon: "📝", label: "Proposals", badge: "New" },
      { to: "/app/contracts", icon: "📜", label: "Contracts", badge: "New" },
    ]
  },
  {
    label: "Work",
    items: [
      { to: "/app/tasks", icon: "✅", label: "Tasks", count: 3 },
      { to: "/app/calendar", icon: "📅", label: "Calendar" },
      { to: "/app/kanban", icon: "📌", label: "Kanban Board", badge: "New" },
      { to: "/app/meetings", icon: "🎥", label: "Meetings", badge: "New" },
    ]
  },
  {
    label: "Growth",
    items: [
      { to: "/app/marketplace", icon: "🌐", label: "Find Projects", badge: "Hot" },
      { to: "/app/reports", icon: "📊", label: "Reports" },
      { to: "/app/analytics", icon: "📈", label: "Analytics", badge: "New" },
      { to: "/app/clients-portal", icon: "🏠", label: "Client Portal", badge: "New" },
    ]
  },
  {
    label: "Tools",
    items: [
      { to: "/app/documents", icon: "📁", label: "Documents" },
      { to: "/app/templates", icon: "🗂️", label: "Templates", badge: "New" },
      { to: "/app/automations", icon: "🤖", label: "Automations", badge: "Pro" },
      { to: "/app/integrations", icon: "🔗", label: "Integrations", badge: "New" },
    ]
  }
]

const badgeColors = {
  "New": { bg: "rgba(0,217,126,0.15)", color: "#00d97e", border: "rgba(0,217,126,0.3)" },
  "Hot": { bg: "rgba(255,77,109,0.15)", color: "#ff4d6d", border: "rgba(255,77,109,0.3)" },
  "Pro": { bg: "rgba(255,184,0,0.15)", color: "#ffb800", border: "rgba(255,184,0,0.3)" },
}

export default function Layout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [search, setSearch] = useState("")
  const [notifications] = useState(3)
  const [collapsed, setCollapsed] = useState(false)
  const [showSearch, setShowSearch] = useState(false)

  useEffect(() => {
    const handleKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setShowSearch(true)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  const handleLogout = () => { logout(); toast.success("Logged out!"); navigate("/") }

  const getPageName = () => {
    if (location.pathname === "/app") return "Dashboard"
    return location.pathname.replace("/app/", "").replace(/-/g, " ").replace(/^\w/, c => c.toUpperCase())
  }

  const allItems = navGroups.flatMap(g => g.items)
  const searchResults = search.length > 1 ? allItems.filter(i => i.label.toLowerCase().includes(search.toLowerCase())) : []

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}>

      {/* Sidebar */}
      <div style={{ width: collapsed ? "60px" : "240px", background: "var(--surface)", borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", position: "fixed", height: "100vh", zIndex: 100, transition: "width 0.2s ease", overflow: "hidden" }}>

        {/* Logo */}
        <div style={{ padding: collapsed ? "16px 8px" : "16px 14px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {!collapsed && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ width: "30px", height: "30px", borderRadius: "8px", background: "linear-gradient(135deg,#6c63ff,#ff6584)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", flexShrink: 0 }}>💼</div>
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
          <button onClick={() => setCollapsed(c => !c)} style={{ background: "transparent", border: "none", color: "var(--text2)", cursor: "pointer", fontSize: "16px", padding: "4px", borderRadius: "6px", flexShrink: 0 }}>{collapsed ? "→" : "←"}</button>
        </div>

        {/* Search */}
        {!collapsed && (
          <div style={{ padding: "10px 12px", borderBottom: "1px solid var(--border)", position: "relative" }}>
            <span style={{ position: "absolute", left: "20px", top: "50%", transform: "translateY(-50%)", fontSize: "12px", color: "var(--text2)" }}>🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search menu..." style={{ width: "100%", padding: "7px 10px 7px 28px", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text)", fontSize: "12px", outline: "none", boxSizing: "border-box" }} />
            {searchResults.length > 0 && (
              <div style={{ position: "absolute", top: "100%", left: "12px", right: "12px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "8px", zIndex: 200, boxShadow: "0 8px 24px rgba(0,0,0,0.3)" }}>
                {searchResults.map(r => (
                  <Link key={r.to} to={r.to} onClick={() => setSearch("")} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 12px", textDecoration: "none", color: "var(--text)", fontSize: "13px", borderBottom: "1px solid var(--border)" }}
                    onMouseEnter={e => e.currentTarget.style.background = "var(--surface2)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <span>{r.icon}</span>{r.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Nav Groups */}
        <div style={{ flex: 1, overflowY: "auto", padding: collapsed ? "8px 6px" : "10px 8px" }}>
          {navGroups.map(group => (
            <div key={group.label} style={{ marginBottom: "16px" }}>
              {!collapsed && <div style={{ fontSize: "9px", fontWeight: 700, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.12em", padding: "0 6px", marginBottom: "4px" }}>{group.label}</div>}
              {group.items.map(({ to, icon, label, badge, count }) => {
                const active = location.pathname === to
                return (
                  <Link key={to} to={to} title={collapsed ? label : ""}
                    style={{ display: "flex", alignItems: "center", gap: "8px", padding: collapsed ? "10px" : "7px 8px", borderRadius: "8px", marginBottom: "1px", color: active ? "var(--accent)" : "var(--text2)", background: active ? "rgba(108,99,255,0.12)" : "transparent", textDecoration: "none", fontSize: "13px", fontWeight: active ? 600 : 500, border: active ? "1px solid rgba(108,99,255,0.2)" : "1px solid transparent", transition: "all 0.15s", justifyContent: collapsed ? "center" : "flex-start" }}
                    onMouseEnter={e => { if (!active) { e.currentTarget.style.background = "var(--surface2)"; e.currentTarget.style.color = "var(--text)" } }}
                    onMouseLeave={e => { if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text2)" } }}>
                    <span style={{ fontSize: "15px", flexShrink: 0 }}>{icon}</span>
                    {!collapsed && (
                      <>
                        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
                        {count && <div style={{ background: "var(--accent)", color: "#fff", fontSize: "9px", fontWeight: 700, padding: "1px 5px", borderRadius: "99px", flexShrink: 0 }}>{count}</div>}
                        {badge && !count && (
                          <div style={{ fontSize: "9px", fontWeight: 700, padding: "1px 5px", borderRadius: "99px", flexShrink: 0, background: badgeColors[badge]?.bg, color: badgeColors[badge]?.color, border: "1px solid " + badgeColors[badge]?.border }}>{badge}</div>
                        )}
                      </>
                    )}
                  </Link>
                )
              })}
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div style={{ borderTop: "1px solid var(--border)", padding: collapsed ? "8px 6px" : "10px 8px" }}>
          {!collapsed && (
            <>
              {[{ icon: "⚙️", label: "Settings", to: "/app/settings" }, { icon: "❓", label: "Help & Support", to: "/app/help" }].map(({ icon, label, to }) => (
                <Link key={label} to={to} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "7px 8px", borderRadius: "8px", marginBottom: "1px", color: "var(--text2)", textDecoration: "none", fontSize: "13px", fontWeight: 500, transition: "all 0.15s" }}
                  onMouseEnter={e => { e.currentTarget.style.background = "var(--surface2)"; e.currentTarget.style.color = "var(--text)" }}
                  onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text2)" }}>
                  <span style={{ fontSize: "14px" }}>{icon}</span>{label}
                </Link>
              ))}
            </>
          )}

          {/* User */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: collapsed ? "8px 4px" : "10px 8px", borderRadius: "10px", background: "var(--surface2)", border: "1px solid var(--border)", marginTop: "6px" }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "linear-gradient(135deg,#6c63ff,#ff6584)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: 700, color: "#fff", flexShrink: 0 }}>{user?.name?.charAt(0).toUpperCase()}</div>
            {!collapsed && (
              <>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "12px", fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.name}</div>
                  <div style={{ fontSize: "10px", color: "var(--text2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.email}</div>
                </div>
                <button onClick={handleLogout} title="Logout" style={{ background: "transparent", border: "none", color: "var(--text2)", cursor: "pointer", fontSize: "14px", padding: "4px", borderRadius: "6px", flexShrink: 0 }}
                  onMouseEnter={e => { e.currentTarget.style.color = "var(--danger)"; e.currentTarget.style.background = "rgba(255,77,109,0.1)" }}
                  onMouseLeave={e => { e.currentTarget.style.color = "var(--text2)"; e.currentTarget.style.background = "transparent" }}>
                  🚪
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ marginLeft: collapsed ? "60px" : "240px", flex: 1, display: "flex", flexDirection: "column", minHeight: "100vh", transition: "margin-left 0.2s ease" }}>

        {/* Top Bar */}
        <div style={{ height: "52px", background: "var(--surface)", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", position: "sticky", top: 0, zIndex: 50 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "13px", color: "var(--text2)" }}>FreelanceFlow</span>
            <span style={{ color: "var(--border)" }}>›</span>
            <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)", textTransform: "capitalize" }}>{getPageName()}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ position: "relative", cursor: "pointer" }}>
              <div style={{ width: "34px", height: "34px", borderRadius: "10px", background: "var(--surface2)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "15px" }}>🔔</div>
              {notifications > 0 && <div style={{ position: "absolute", top: "-4px", right: "-4px", width: "15px", height: "15px", borderRadius: "50%", background: "var(--danger)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "8px", fontWeight: 700, color: "#fff" }}>{notifications}</div>}
            </div>
            <div onClick={() => setShowSearch(true)} style={{ display: "flex", alignItems: "center", gap: "6px", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: "10px", padding: "6px 12px", cursor: "pointer" }}>
              <span style={{ fontSize: "12px" }}>🔍</span>
              <span style={{ fontSize: "12px", color: "var(--text2)" }}>Search anything...</span>
              <span style={{ fontSize: "10px", color: "var(--text2)", background: "var(--border)", padding: "1px 5px", borderRadius: "4px" }}>⌘K</span>
            </div>
            <div style={{ width: "34px", height: "34px", borderRadius: "50%", background: "linear-gradient(135deg,#6c63ff,#ff6584)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: 700, color: "#fff", cursor: "pointer" }}>{user?.name?.charAt(0).toUpperCase()}</div>
            <button onClick={handleLogout} style={{ padding: "6px 12px", background: "rgba(255,77,109,0.1)", border: "1px solid rgba(255,77,109,0.3)", borderRadius: "8px", color: "#ff4d6d", cursor: "pointer", fontSize: "12px", fontWeight: 600 }}>Logout</button>
          </div>
        </div>

        {/* Page Content */}
        <div style={{ flex: 1, padding: "24px 28px", background: "var(--bg)" }}>
          <Outlet />
        </div>
      </div>

      <AIChatbot />
      <GlobalSearch isOpen={showSearch} onClose={() => setShowSearch(false)} />
    </div>
  )
}