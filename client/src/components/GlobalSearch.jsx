import { useState, useEffect, useRef, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import api from "../lib/api"

const TYPE_ICONS = {
  client: { icon: "👥", color: "#6c63ff" },
  project: { icon: "🚀", color: "#ffb800" },
  invoice: { icon: "🧾", color: "#00d97e" },
  lead: { icon: "🎯", color: "#ff6584" },
  task: { icon: "✅", color: "#2CA5E0" },
  payment: { icon: "💳", color: "#00d97e" },
  expense: { icon: "💸", color: "#ff4d6d" },
  contact: { icon: "📇", color: "#a78bfa" },
  proposal: { icon: "📝", color: "#6c63ff" }
}

const TYPE_ROUTES = {
  client: "/app/clients",
  project: "/app/projects",
  invoice: "/app/invoices",
  lead: "/app/leads",
  task: "/app/tasks",
  payment: "/app/payments",
  expense: "/app/expenses",
  contact: "/app/contacts",
  proposal: "/app/proposals"
}

const QUICK_ACTIONS = [
  { label: "Create Invoice", icon: "🧾", action: () => {}, route: "/app/invoices" },
  { label: "Add Client", icon: "👥", action: () => {}, route: "/app/clients" },
  { label: "New Project", icon: "🚀", action: () => {}, route: "/app/projects" },
  { label: "Log Time", icon: "⏱️", action: () => {}, route: "/app/time" },
  { label: "Add Expense", icon: "💸", action: () => {}, route: "/app/expenses" },
  { label: "View Reports", icon: "📊", action: () => {}, route: "/app/reports" }
]

export default function GlobalSearch({ isOpen, onClose }) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [recentSearches, setRecentSearches] = useState([])
  const inputRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (isOpen) {
      setQuery("")
      setResults([])
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 100)
      const saved = localStorage.getItem("ff_recent_searches")
      if (saved) setRecentSearches(JSON.parse(saved))
    }
  }, [isOpen])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.length >= 2) {
        search(query)
      } else {
        setResults([])
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  useEffect(() => {
    const handleKey = (e) => {
      if (!isOpen) return
      
      if (e.key === "Escape") {
        onClose()
      } else if (e.key === "ArrowDown") {
        e.preventDefault()
        setSelectedIndex(i => Math.min(i + 1, results.length - 1))
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        setSelectedIndex(i => Math.max(i - 1, 0))
      } else if (e.key === "Enter" && results[selectedIndex]) {
        e.preventDefault()
        handleSelect(results[selectedIndex])
      }
    }
    
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [isOpen, results, selectedIndex])

  const search = async (q) => {
    setLoading(true)
    try {
      const { data } = await api.get(`/search?q=${encodeURIComponent(q)}&limit=10`)
      setResults(data.results || [])
    } catch {
      setResults([])
    }
    finally { setLoading(false) }
  }

  const handleSelect = (result) => {
    const route = TYPE_ROUTES[result.type]
    if (route) {
      navigate(`${route}?id=${result._id}`)
    }
    
    const searches = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5)
    setRecentSearches(searches)
    localStorage.setItem("ff_recent_searches", JSON.stringify(searches))
    onClose()
  }

  const handleQuickAction = (action) => {
    navigate(action.route)
    onClose()
  }

  if (!isOpen) return null

  const showRecent = query.length < 2

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 9999, display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: "100px" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{ width: "100%", maxWidth: "640px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "16px", overflow: "hidden", boxShadow: "0 25px 80px rgba(0,0,0,0.5)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
          <span style={{ fontSize: "20px" }}>🔍</span>
          <input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Search clients, projects, invoices, tasks..."
            style={{ flex: 1, background: "transparent", border: "none", color: "var(--text)", fontSize: "16px", outline: "none" }} />
          {loading && <div style={{ width: "16px", height: "16px", border: "2px solid var(--border)", borderTopColor: "#6c63ff", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />}
          <kbd style={{ padding: "3px 8px", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: "4px", fontSize: "11px", color: "var(--text2)" }}>ESC</kbd>
        </div>

        <div style={{ maxHeight: "400px", overflowY: "auto" }}>
          {showRecent && (
            <>
              {recentSearches.length > 0 && (
                <div style={{ padding: "12px 16px" }}>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--text2)", textTransform: "uppercase", marginBottom: "8px" }}>Recent Searches</div>
                  {recentSearches.map((s, i) => (
                    <button key={i} onClick={() => setQuery(s)} style={{ display: "flex", alignItems: "center", gap: "8px", width: "100%", padding: "8px 10px", background: "transparent", border: "none", borderRadius: "8px", color: "var(--text)", cursor: "pointer", fontSize: "13px", textAlign: "left" }}
                      onMouseEnter={e => e.currentTarget.style.background = "var(--surface2)"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      <span style={{ fontSize: "12px" }}>🕐</span>
                      {s}
                    </button>
                  ))}
                </div>
              )}
              
              <div style={{ padding: "12px 16px", borderTop: recentSearches.length > 0 ? "1px solid var(--border)" : "none" }}>
                <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--text2)", textTransform: "uppercase", marginBottom: "8px" }}>Quick Actions</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                  {QUICK_ACTIONS.map(a => (
                    <button key={a.label} onClick={() => handleQuickAction(a)} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 12px", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: "10px", color: "var(--text)", cursor: "pointer", fontSize: "12px", fontWeight: 500 }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = "#6c63ff" }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)" }}>
                      <span style={{ fontSize: "16px" }}>{a.icon}</span>
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {query.length >= 2 && results.length === 0 && !loading && (
            <div style={{ padding: "40px 20px", textAlign: "center" }}>
              <div style={{ fontSize: "32px", marginBottom: "8px" }}>🔍</div>
              <p style={{ color: "var(--text2)", fontSize: "14px" }}>No results for "{query}"</p>
              <p style={{ color: "var(--text2)", fontSize: "12px", marginTop: "4px" }}>Try searching for clients, projects, invoices, or tasks</p>
            </div>
          )}

          {results.length > 0 && (
            <div style={{ padding: "8px" }}>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--text2)", textTransform: "uppercase", padding: "4px 10px 8px" }}>
                Results ({results.length})
              </div>
              {results.map((r, i) => {
                const typeInfo = TYPE_ICONS[r.type] || { icon: "📄", color: "#8888aa" }
                return (
                  <button key={r._id + i} onClick={() => handleSelect(r)} onMouseEnter={() => setSelectedIndex(i)}
                    style={{ display: "flex", alignItems: "center", gap: "12px", width: "100%", padding: "10px 12px", background: selectedIndex === i ? "rgba(108,99,255,0.15)" : "transparent", border: "none", borderRadius: "10px", color: "var(--text)", cursor: "pointer", textAlign: "left" }}>
                    <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: typeInfo.color + "20", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>
                      {typeInfo.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "14px", fontWeight: 600, marginBottom: "2px" }}>{r.title}</div>
                      <div style={{ fontSize: "12px", color: "var(--text2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.subtitle}</div>
                    </div>
                    <span style={{ fontSize: "10px", padding: "2px 8px", borderRadius: "99px", background: "var(--surface2)", color: "var(--text2)", fontWeight: 600, textTransform: "capitalize" }}>{r.type}</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <div style={{ padding: "12px 16px", borderTop: "1px solid var(--border)", display: "flex", gap: "16px", fontSize: "11px", color: "var(--text2)" }}>
          <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><kbd style={{ padding: "2px 6px", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: "3px" }}>↑↓</kbd> Navigate</span>
          <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><kbd style={{ padding: "2px 6px", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: "3px" }}>↵</kbd> Select</span>
          <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><kbd style={{ padding: "2px 6px", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: "3px" }}>ESC</kbd> Close</span>
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
