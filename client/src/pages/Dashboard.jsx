import { useState, useEffect, useCallback, useMemo } from "react"
import { Link } from "react-router-dom"
import api from "../lib/api"
import toast from "react-hot-toast"
import useAuthStore from "../store/authStore"

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]

const SkeletonCard = () => (
  <div style={{
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "14px",
    padding: "18px 20px",
    height: "86px",
    animation: "pulse 1.5s ease-in-out infinite"
  }}>
    <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>
  </div>
)

export default function Dashboard() {
  const { user } = useAuthStore()
  const [stats, setStats] = useState({ clients: 0, projects: 0, invoices: 0, revenue: 0, leads: 0, expenses: 0, payments: 0, timelogs: 0 })
  const [recentClients, setRecentClients] = useState([])
  const [recentInvoices, setRecentInvoices] = useState([])
  const [projects, setProjects] = useState([])
  const [leads, setLeads] = useState([])
  const [payments, setPayments] = useState([])
  const [expenses, setExpenses] = useState([])
  const [timelogs, setTimelogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [time, setTime] = useState(new Date())
  const [seeding, setSeeding] = useState(false)

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => { fetchAll() }, [])

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const results = await Promise.all([
        api.get("/clients?limit=10"),
        api.get("/projects?limit=10"),
        api.get("/invoices?limit=10"),
        api.get("/leads?limit=10"),
        api.get("/payments?limit=10"),
        api.get("/expenses?limit=10"),
        api.get("/timelogs?limit=10"),
      ])
      
      const clientsData = results[0]?.data?.data || []
      const projectsData = results[1]?.data?.data || []
      const invoicesData = results[2]?.data?.data || []
      const leadsData = results[3]?.data?.data || []
      const paymentsData = results[4]?.data?.data || []
      const expensesData = results[5]?.data?.data || []
      const timelogsData = results[6]?.data?.data || []

      const revenue = paymentsData.filter(p => p.status === "completed").reduce((s, p) => s + (p.amount || 0), 0)
      const totalExpenses = expensesData.reduce((s, e) => s + (e.amount || 0), 0)

      setStats({
        clients: clientsData.length,
        projects: projectsData.filter(p => p.status === "active").length,
        invoices: invoicesData.length,
        revenue,
        leads: leadsData.length,
        expenses: totalExpenses,
        payments: paymentsData.length,
        timelogs: timelogsData.reduce((s, t) => s + (t.duration || 0), 0),
      })
      setRecentClients(clientsData.slice(0, 5))
      setRecentInvoices(invoicesData.slice(0, 4))
      setProjects(projectsData.slice(0, 4))
      setLeads(leadsData.slice(0, 5))
      setPayments(paymentsData.slice(0, 5))
      setExpenses(expensesData)
      setTimelogs(timelogsData)
    } catch {
      toast.error("Failed to load dashboard data")
    } finally {
      setLoading(false)
    }
  }, [])

  const loadSampleData = useCallback(async () => {
    if (!window.confirm("This will add sample data (clients, projects, invoices). Continue?")) return
    setSeeding(true)
    try {
      toast.loading("Loading sample data...", { id: "seed" })
      const { data } = await api.post("/seed/load")
      toast.success(data.message || "Sample data loaded!", { id: "seed" })
      fetchAll()
    } catch (e) {
      toast.error(e?.response?.data?.error || "Failed to load sample data", { id: "seed" })
    } finally {
      setSeeding(false)
    }
  }, [fetchAll])

  const clearAllData = useCallback(async () => {
    if (!window.confirm("This will DELETE all your data (clients, projects, invoices). Are you sure?")) return
    try {
      toast.loading("Clearing data...", { id: "clear" })
      await api.delete("/seed/clear")
      toast.success("All data cleared!", { id: "clear" })
      fetchAll()
    } catch {
      toast.error("Failed to clear data", { id: "clear" })
    }
  }, [fetchAll])

  const hour = time.getHours()
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening"
  const greetEmoji = hour < 12 ? "🌅" : hour < 17 ? "☀️" : "🌙"
  const firstName = user?.name?.split(" ")[0] || "there"

  const revenueByMonth = useMemo(() => Array(6).fill(0).map((_, i) => {
    const d = new Date()
    d.setMonth(d.getMonth() - (5 - i))
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    const total = payments.filter(p => p.status === "completed" && (new Date(p.date).toISOString().substring(0, 7) === key)).reduce((s, p) => s + (p.amount || 0), 0)
    return { month: MONTHS[d.getMonth()], total }
  }), [payments])

  const maxRevenue = useMemo(() => Math.max(...revenueByMonth.map(r => r.total), 1), [revenueByMonth])

  const expenseByMonth = useMemo(() => Array(6).fill(0).map((_, i) => {
    const d = new Date()
    d.setMonth(d.getMonth() - (5 - i))
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    return expenses.filter(e => new Date(e.date).toISOString().substring(0, 7) === key).reduce((s, e) => s + (e.amount || 0), 0)
  }), [expenses])

  const statCards = useMemo(() => [
    { label: "Total Clients",   value: stats.clients,  icon: "👥", color: "#6c63ff", link: "/app/clients"  },
    { label: "Active Projects", value: stats.projects, icon: "🚀", color: "#ffb800", link: "/app/projects" },
    { label: "Total Revenue",   value: "₹" + stats.revenue.toLocaleString(), icon: "💰", color: "#00d97e", link: "/app/payments" },
    { label: "Total Leads",     value: stats.leads,    icon: "🎯", color: "#ff6584", link: "/app/leads"    },
    { label: "Invoices",        value: stats.invoices, icon: "🧾", color: "#2CA5E0", link: "/app/invoices" },
    { label: "Expenses",        value: "₹" + stats.expenses.toLocaleString(), icon: "💸", color: "#ff4d6d", link: "/app/expenses" },
    { label: "Time Logged",     value: Math.floor(stats.timelogs / 60) + "h", icon: "⏱️", color: "#a78bfa", link: "/app/time" },
    { label: "Payments",        value: stats.payments, icon: "💳", color: "#00c9a7", link: "/app/payments" },
  ], [stats])

  const quickActions = useMemo(() => [
    { label: "New Client",      icon: "👥", link: "/app/clients",   color: "#6c63ff" },
    { label: "New Project",     icon: "🚀", link: "/app/projects",  color: "#ffb800" },
    { label: "New Invoice",     icon: "🧾", link: "/app/invoices",  color: "#00d97e" },
    { label: "Add Lead",        icon: "🎯", link: "/app/leads",     color: "#ff6584" },
    { label: "Log Time",        icon: "⏱️", link: "/app/time",      color: "#a78bfa" },
    { label: "Add Expense",     icon: "💸", link: "/app/expenses",  color: "#ff4d6d" },
    { label: "New Proposal",    icon: "📝", link: "/app/proposals", color: "#2CA5E0" },
    { label: "Record Payment",  icon: "💳", link: "/app/payments",  color: "#00c9a7" },
  ], [])

  if (loading) return (
    <div style={{ maxWidth: "1300px" }}>
      <div style={{ marginBottom: "28px" }}>
        <div style={{ height: "32px", width: "300px", background: "var(--surface2)", borderRadius: "8px", marginBottom: "8px", animation: "pulse 1.5s ease-in-out infinite" }} />
        <div style={{ height: "20px", width: "200px", background: "var(--surface2)", borderRadius: "6px", animation: "pulse 1.5s ease-in-out infinite" }} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "14px", marginBottom: "14px" }}>
        {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "14px", marginBottom: "24px" }}>
        {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
        {[...Array(2)].map((_, i) => <div key={i} style={{ height: "200px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "16px", animation: "pulse 1.5s ease-in-out infinite" }} />)}
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>
    </div>
  )

  return (
    <div style={{ maxWidth: "1300px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px" }}>
        <div>
          <h1 style={{ fontSize: "26px", fontWeight: 800, letterSpacing: "-0.5px", marginBottom: "4px" }}>
            {greetEmoji} {greeting}, {firstName}!
          </h1>
          <p style={{ color: "var(--text2)", fontSize: "14px" }}>
            {time.toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })} · {time.toLocaleTimeString("en-IN")}
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={fetchAll} style={{ padding: "9px 18px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "10px", color: "var(--text2)", cursor: "pointer", fontSize: "13px", fontWeight: 600 }}>🔄 Refresh</button>
          <button onClick={loadSampleData} disabled={seeding} style={{ padding: "9px 18px", background: "rgba(108,99,255,0.1)", border: "1px solid rgba(108,99,255,0.3)", borderRadius: "10px", color: "#6c63ff", cursor: seeding ? "not-allowed" : "pointer", fontSize: "13px", fontWeight: 600, opacity: seeding ? 0.7 : 1 }}>
            {seeding ? "⏳ Loading..." : "📊 Load Sample Data"}
          </button>
          {stats.clients > 0 && (
            <button onClick={clearAllData} style={{ padding: "9px 18px", background: "rgba(255,77,109,0.1)", border: "1px solid rgba(255,77,109,0.3)", borderRadius: "10px", color: "#ff4d6d", cursor: "pointer", fontSize: "13px", fontWeight: 600 }}>
              🗑️ Clear Data
            </button>
          )}
        </div>
      </div>

      {/* Stats Row 1 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "14px", marginBottom: "14px" }}>
        {statCards.slice(0, 4).map(s => (
          <Link key={s.label} to={s.link} style={{ textDecoration: "none" }}>
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "14px", padding: "18px 20px", position: "relative", overflow: "hidden", transition: "all 0.2s" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = s.color + "60"; e.currentTarget.style.transform = "translateY(-2px)" }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.transform = "translateY(0)" }}>
              <div style={{ position: "absolute", top: 0, right: 0, width: "70px", height: "70px", borderRadius: "0 14px 0 70px", background: s.color + "15" }} />
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: s.color + "20", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>{s.icon}</div>
                <div>
                  <div style={{ fontSize: "22px", fontWeight: 800, color: "var(--text)" }}>{s.value}</div>
                  <div style={{ fontSize: "11px", color: "var(--text2)" }}>{s.label}</div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Stats Row 2 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "14px", marginBottom: "24px" }}>
        {statCards.slice(4).map(s => (
          <Link key={s.label} to={s.link} style={{ textDecoration: "none" }}>
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "14px", padding: "18px 20px", position: "relative", overflow: "hidden", transition: "all 0.2s" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = s.color + "60"; e.currentTarget.style.transform = "translateY(-2px)" }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.transform = "translateY(0)" }}>
              <div style={{ position: "absolute", top: 0, right: 0, width: "70px", height: "70px", borderRadius: "0 14px 0 70px", background: s.color + "15" }} />
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: s.color + "20", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>{s.icon}</div>
                <div>
                  <div style={{ fontSize: "22px", fontWeight: 800, color: "var(--text)" }}>{s.value}</div>
                  <div style={{ fontSize: "11px", color: "var(--text2)" }}>{s.label}</div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Charts */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "16px", padding: "22px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <div>
              <h3 style={{ fontSize: "15px", fontWeight: 700, marginBottom: "2px" }}>💰 Revenue Overview</h3>
              <p style={{ fontSize: "12px", color: "var(--text2)" }}>Last 6 months</p>
            </div>
            <div style={{ fontSize: "18px", fontWeight: 800, color: "#00d97e" }}>₹{stats.revenue.toLocaleString()}</div>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: "8px", height: "120px" }}>
            {revenueByMonth.map((r, i) => (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                <div style={{ fontSize: "9px", color: "var(--text2)", fontWeight: 600 }}>{r.total > 0 ? "₹" + (r.total / 1000).toFixed(0) + "k" : ""}</div>
                <div style={{ width: "100%", background: "linear-gradient(180deg,#6c63ff,#ff6584)", borderRadius: "6px 6px 0 0", height: Math.max((r.total / maxRevenue) * 100, r.total > 0 ? 8 : 2) + "px", opacity: i === 5 ? 1 : 0.5 }} />
                <div style={{ fontSize: "10px", color: "var(--text2)" }}>{r.month}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "16px", padding: "22px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <div>
              <h3 style={{ fontSize: "15px", fontWeight: 700, marginBottom: "2px" }}>💸 Expense Overview</h3>
              <p style={{ fontSize: "12px", color: "var(--text2)" }}>Last 6 months</p>
            </div>
            <div style={{ fontSize: "18px", fontWeight: 800, color: "#ff4d6d" }}>₹{stats.expenses.toLocaleString()}</div>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: "8px", height: "120px" }}>
            {expenseByMonth.map((total, i) => {
              const maxExp = Math.max(...expenseByMonth, 1)
              const d = new Date(); d.setMonth(d.getMonth() - (5 - i))
              return (
                <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                  <div style={{ fontSize: "9px", color: "var(--text2)", fontWeight: 600 }}>{total > 0 ? "₹" + (total / 1000).toFixed(0) + "k" : ""}</div>
                  <div style={{ width: "100%", background: "linear-gradient(180deg,#ff4d6d,#ff6584)", borderRadius: "6px 6px 0 0", height: Math.max((total / maxExp) * 100, total > 0 ? 8 : 2) + "px", opacity: i === 5 ? 1 : 0.5 }} />
                  <div style={{ fontSize: "10px", color: "var(--text2)" }}>{MONTHS[d.getMonth()]}</div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Projects + Leads */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "16px", padding: "22px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={{ fontSize: "15px", fontWeight: 700 }}>🚀 Active Projects</h3>
            <Link to="/app/projects" style={{ fontSize: "12px", color: "#6c63ff", textDecoration: "none", fontWeight: 600 }}>View all →</Link>
          </div>
          {projects.length === 0 ? (
            <div style={{ textAlign: "center", padding: "30px", color: "var(--text2)" }}>
              <div style={{ fontSize: "32px", marginBottom: "8px" }}>🚀</div>
              <p style={{ fontSize: "13px" }}>No projects yet</p>
              <Link to="/app/projects" style={{ fontSize: "12px", color: "#6c63ff", textDecoration: "none" }}>+ Create your first project</Link>
            </div>
          ) : projects.map(p => (
            <div key={p._id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "13px", fontWeight: 700, marginBottom: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.title}</div>
                <div style={{ fontSize: "11px", color: "var(--text2)", marginBottom: "5px" }}>{p.client?.name || "No client"}</div>
                <div style={{ height: "4px", background: "var(--surface2)", borderRadius: "99px", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: (p.progress || 0) + "%", background: "linear-gradient(90deg,#6c63ff,#ff6584)", borderRadius: "99px" }} />
                </div>
              </div>
              <span style={{ fontSize: "10px", padding: "2px 8px", borderRadius: "99px", background: "rgba(255,184,0,0.15)", color: "#ffb800", border: "1px solid rgba(255,184,0,0.3)", fontWeight: 700, flexShrink: 0 }}>Active</span>
            </div>
          ))}
        </div>

        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "16px", padding: "22px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={{ fontSize: "15px", fontWeight: 700 }}>🎯 Leads Pipeline</h3>
            <Link to="/app/leads" style={{ fontSize: "12px", color: "#6c63ff", textDecoration: "none", fontWeight: 600 }}>View all →</Link>
          </div>
          {leads.length === 0 ? (
            <div style={{ textAlign: "center", padding: "30px", color: "var(--text2)" }}>
              <div style={{ fontSize: "32px", marginBottom: "8px" }}>🎯</div>
              <p style={{ fontSize: "13px" }}>No leads yet</p>
              <Link to="/app/leads" style={{ fontSize: "12px", color: "#6c63ff", textDecoration: "none" }}>+ Add your first lead</Link>
            </div>
          ) : (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: "6px", marginBottom: "14px" }}>
                {["new","contacted","proposal","negotiation","won"].map((s, i) => {
                  const colors = ["#6c63ff","#2CA5E0","#ffb800","#ff6584","#00d97e"]
                  return (
                    <div key={s} style={{ textAlign: "center", padding: "8px 4px", background: colors[i] + "15", borderRadius: "8px", border: "1px solid " + colors[i] + "30" }}>
                      <div style={{ fontSize: "16px", fontWeight: 800, color: colors[i] }}>{leads.filter(l => l.stage === s).length}</div>
                      <div style={{ fontSize: "9px", color: "var(--text2)", textTransform: "capitalize" }}>{s}</div>
                    </div>
                  )
                })}
              </div>
              {leads.slice(0, 3).map(l => (
                <div key={l._id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: 700 }}>{l.name}</div>
                    <div style={{ fontSize: "11px", color: "var(--text2)" }}>{l.company || l.source}</div>
                  </div>
                  <span style={{ fontSize: "13px", fontWeight: 800, color: "#00d97e" }}>₹{(l.value || 0).toLocaleString()}</span>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Payments + Clients */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "16px", padding: "22px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={{ fontSize: "15px", fontWeight: 700 }}>💳 Recent Payments</h3>
            <Link to="/app/payments" style={{ fontSize: "12px", color: "#6c63ff", textDecoration: "none", fontWeight: 600 }}>View all →</Link>
          </div>
          {payments.length === 0 ? (
            <div style={{ textAlign: "center", padding: "30px", color: "var(--text2)" }}>
              <div style={{ fontSize: "32px", marginBottom: "8px" }}>💳</div>
              <p style={{ fontSize: "13px" }}>No payments yet</p>
              <Link to="/app/payments" style={{ fontSize: "12px", color: "#6c63ff", textDecoration: "none" }}>+ Record payment</Link>
            </div>
          ) : payments.map(p => (
            <div key={p._id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
              <div>
                <div style={{ fontSize: "13px", fontWeight: 700 }}>{p.client?.name || p.client || "Unknown"}</div>
                <div style={{ fontSize: "11px", color: "var(--text2)" }}>{new Date(p.date).toLocaleDateString("en-IN")}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "14px", fontWeight: 800, color: p.status === "completed" ? "#00d97e" : "#ffb800" }}>₹{(p.amount || 0).toLocaleString()}</div>
                <div style={{ fontSize: "10px", color: p.status === "completed" ? "#00d97e" : "#ffb800" }}>{p.status}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "16px", padding: "22px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={{ fontSize: "15px", fontWeight: 700 }}>👥 Recent Clients</h3>
            <Link to="/app/clients" style={{ fontSize: "12px", color: "#6c63ff", textDecoration: "none", fontWeight: 600 }}>View all →</Link>
          </div>
          {recentClients.length === 0 ? (
            <div style={{ textAlign: "center", padding: "30px", color: "var(--text2)" }}>
              <div style={{ fontSize: "32px", marginBottom: "8px" }}>👥</div>
              <p style={{ fontSize: "13px" }}>No clients yet</p>
              <Link to="/app/clients" style={{ fontSize: "12px", color: "#6c63ff", textDecoration: "none" }}>+ Add your first client</Link>
            </div>
          ) : recentClients.map(c => (
            <div key={c._id} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
              <div style={{ width: "34px", height: "34px", borderRadius: "50%", background: "linear-gradient(135deg,#6c63ff,#ff6584)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: 800, color: "#fff", flexShrink: 0 }}>{c.name?.[0]?.toUpperCase()}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "13px", fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</div>
                <div style={{ fontSize: "11px", color: "var(--text2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.email}</div>
              </div>
              {c.hourlyRate && <span style={{ fontSize: "12px", color: "#6c63ff", fontWeight: 700, flexShrink: 0 }}>₹{c.hourlyRate}/hr</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "16px", padding: "22px", marginBottom: "20px" }}>
        <h3 style={{ fontSize: "15px", fontWeight: 700, marginBottom: "16px" }}>⚡ Quick Actions</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(8,1fr)", gap: "10px" }}>
          {quickActions.map(a => (
            <Link key={a.label} to={a.link} style={{ textDecoration: "none" }}>
              <div style={{ textAlign: "center", padding: "14px 8px", background: "var(--surface2)", borderRadius: "12px", border: "1px solid var(--border)", cursor: "pointer", transition: "all 0.15s" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = a.color; e.currentTarget.style.background = a.color + "15"; e.currentTarget.style.transform = "translateY(-2px)" }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.background = "var(--surface2)"; e.currentTarget.style.transform = "translateY(0)" }}>
                <div style={{ fontSize: "22px", marginBottom: "6px" }}>{a.icon}</div>
                <div style={{ fontSize: "10px", fontWeight: 700, color: "var(--text2)" }}>{a.label}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* P&L Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "14px" }}>
        <div style={{ background: "linear-gradient(135deg,rgba(0,217,126,0.15),rgba(0,217,126,0.05))", border: "1px solid rgba(0,217,126,0.3)", borderRadius: "16px", padding: "20px" }}>
          <div style={{ fontSize: "12px", color: "#00d97e", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>💰 Total Revenue</div>
          <div style={{ fontSize: "28px", fontWeight: 800, color: "#00d97e" }}>₹{stats.revenue.toLocaleString()}</div>
          <div style={{ fontSize: "12px", color: "var(--text2)", marginTop: "4px" }}>From {payments.filter(p => p.status === "completed").length} payments</div>
        </div>
        <div style={{ background: "linear-gradient(135deg,rgba(255,77,109,0.15),rgba(255,77,109,0.05))", border: "1px solid rgba(255,77,109,0.3)", borderRadius: "16px", padding: "20px" }}>
          <div style={{ fontSize: "12px", color: "#ff4d6d", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>💸 Total Expenses</div>
          <div style={{ fontSize: "28px", fontWeight: 800, color: "#ff4d6d" }}>₹{stats.expenses.toLocaleString()}</div>
          <div style={{ fontSize: "12px", color: "var(--text2)", marginTop: "4px" }}>From {expenses.length} entries</div>
        </div>
        <div style={{ background: "linear-gradient(135deg,rgba(108,99,255,0.15),rgba(108,99,255,0.05))", border: "1px solid rgba(108,99,255,0.3)", borderRadius: "16px", padding: "20px" }}>
          <div style={{ fontSize: "12px", color: "#6c63ff", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>📊 Net Profit</div>
          <div style={{ fontSize: "28px", fontWeight: 800, color: stats.revenue - stats.expenses >= 0 ? "#00d97e" : "#ff4d6d" }}>₹{(stats.revenue - stats.expenses).toLocaleString()}</div>
          <div style={{ fontSize: "12px", color: "var(--text2)", marginTop: "4px" }}>Revenue minus expenses</div>
        </div>
      </div>
    </div>
  )
}
