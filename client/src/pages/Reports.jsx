import { useState, useEffect } from "react"
import api from "../lib/api"
import toast from "react-hot-toast"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts"

const COLORS = ["#6c63ff", "#ff6584", "#00d97e", "#ffb800", "#2CA5E0", "#a78bfa"]

export default function Reports() {
  const [loading, setLoading] = useState(true)
  const [reportType, setReportType] = useState("overview")
  const [dateRange, setDateRange] = useState("month")
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    totalInvoices: 0,
    paidInvoices: 0,
    pendingInvoices: 0,
    overdueInvoices: 0,
    totalClients: 0,
    activeProjects: 0,
    completedProjects: 0,
    totalHoursLogged: 0
  })
  const [monthlyData, setMonthlyData] = useState([])
  const [categoryData, setCategoryData] = useState([])
  const [clientRevenue, setClientRevenue] = useState([])
  const [recentTransactions, setRecentTransactions] = useState([])

  useEffect(() => { fetchData() }, [dateRange])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [invoices, payments, expenses, clients, projects, timelogs] = await Promise.all([
        api.get("/invoices"),
        api.get("/payments"),
        api.get("/expenses"),
        api.get("/clients"),
        api.get("/projects"),
        api.get("/timelogs")
      ])

      const invoiceData = invoices.data?.data || invoices.data || []
      const paymentData = payments.data?.data || payments.data || []
      const expenseData = expenses.data?.data || expenses.data || []
      const projectData = projects.data?.data || projects.data || []
      const timeData = timelogs.data?.data || timelogs.data || []

      const totalRevenue = paymentData.filter(p => p.status === "completed").reduce((s, p) => s + (p.amount || 0), 0)
      const totalExpenses = expenseData.reduce((s, e) => s + (e.amount || 0), 0)

      setStats({
        totalRevenue,
        totalExpenses,
        netProfit: totalRevenue - totalExpenses,
        totalInvoices: invoiceData.length,
        paidInvoices: invoiceData.filter(i => i.status === "paid").length,
        pendingInvoices: invoiceData.filter(i => i.status === "sent").length,
        overdueInvoices: invoiceData.filter(i => i.status === "overdue").length,
        totalClients: clients.data.data?.length || 0,
        activeProjects: projectData.filter(p => p.status === "active").length,
        completedProjects: projectData.filter(p => p.status === "completed").length,
        totalHoursLogged: timeData.reduce((s, t) => s + (t.duration || 0), 0)
      })

      generateMonthlyData(invoiceData, paymentData, expenseData)
      generateCategoryData(expenseData)
      generateClientRevenue(invoiceData)
      generateRecentTransactions(paymentData, expenseData)
    } catch { toast.error("Failed to load reports") }
    finally { setLoading(false) }
  }

  const generateMonthlyData = (invoices, payments, expenses) => {
    const months = dateRange === "week" ? 4 : dateRange === "month" ? 6 : 12
    const data = []
    
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date()
      d.setMonth(d.getMonth() - i)
      const monthKey = d.toISOString().substring(0, 7)
      const monthName = d.toLocaleDateString("en-IN", { month: "short" })
      
      const revenue = payments
        .filter(p => p.date?.substring(0, 7) === monthKey && p.status === "completed")
        .reduce((s, p) => s + (p.amount || 0), 0)
      
      const expense = expenses
        .filter(e => e.date?.substring(0, 7) === monthKey)
        .reduce((s, e) => s + (e.amount || 0), 0)
      
      const billed = invoices
        .filter(i => i.createdAt?.substring(0, 7) === monthKey)
        .reduce((s, i) => s + (i.total || 0), 0)
      
      data.push({ month: monthName, revenue, expense, billed })
    }
    
    setMonthlyData(data)
  }

  const generateCategoryData = (expenses) => {
    const categories = {}
    expenses.forEach(e => {
      const cat = e.category || "Other"
      categories[cat] = (categories[cat] || 0) + (e.amount || 0)
    })
    
    const data = Object.entries(categories).map(([name, value]) => ({ name, value }))
    setCategoryData(data)
  }

  const generateClientRevenue = (invoices) => {
    const clients = {}
    invoices.filter(i => i.status === "paid").forEach(i => {
      const name = i.client?.name || "Unknown"
      clients[name] = (clients[name] || 0) + (i.total || 0)
    })
    
    const data = Object.entries(clients)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)
    
    setClientRevenue(data)
  }

  const generateRecentTransactions = (payments, expenses) => {
    const trPayments = Array.isArray(payments) ? payments : [];
    const trExpenses = Array.isArray(expenses) ? expenses : [];
    const transactions = [
      ...trPayments.map(p => ({ ...p, type: "payment", id: p._id })),
      ...trExpenses.map(e => ({ ...e, type: "expense", id: e._id }))
    ].sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date)).slice(0, 10)
    
    setRecentTransactions(transactions)
  }

  const exportToCSV = () => {
    const headers = ["Date", "Type", "Description", "Amount", "Status"]
    const rows = recentTransactions.map(t => [
      new Date(t.createdAt || t.date).toLocaleDateString("en-IN"),
      t.type === "payment" ? "Income" : "Expense",
      t.description || t.client?.name || t.invoiceNumber || "-",
      t.amount || 0,
      t.status || t.type
    ])
    
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `freelanceflow-report-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    toast.success("Report exported!")
  }

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
      <div style={{ width: "48px", height: "48px", border: "3px solid var(--border)", borderTopColor: "#6c63ff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  return (
    <div style={{ maxWidth: "1300px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px", gap: "12px", flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: 800, letterSpacing: "-0.5px", marginBottom: "4px" }}>Reports</h1>
          <p style={{ color: "var(--text2)", fontSize: "14px" }}>Financial insights and analytics</p>
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          <select value={dateRange} onChange={e => setDateRange(e.target.value)} style={{ padding: "9px 14px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text)", fontSize: "13px" }}>
            <option value="week">Last 4 Weeks</option>
            <option value="month">Last 6 Months</option>
            <option value="year">Last 12 Months</option>
          </select>
          <button onClick={exportToCSV} style={{ padding: "9px 18px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text)", cursor: "pointer", fontSize: "13px", fontWeight: 600 }}>📥 Export CSV</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "14px", marginBottom: "24px" }}>
        {[
          { label: "Total Revenue", value: "₹" + stats.totalRevenue.toLocaleString(), icon: "💰", color: "#00d97e", change: "+12%" },
          { label: "Total Expenses", value: "₹" + stats.totalExpenses.toLocaleString(), icon: "💸", color: "#ff4d6d" },
          { label: "Net Profit", value: "₹" + stats.netProfit.toLocaleString(), icon: "📊", color: stats.netProfit >= 0 ? "#00d97e" : "#ff4d6d" },
          { label: "Invoices Paid", value: `${stats.paidInvoices}/${stats.totalInvoices}`, icon: "🧾", color: "#6c63ff" }
        ].map(s => (
          <div key={s.label} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "14px", padding: "18px 20px", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, right: 0, width: "60px", height: "60px", borderRadius: "0 14px 0 60px", background: s.color + "15" }} />
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: s.color + "20", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>{s.icon}</div>
              <div>
                <div style={{ fontSize: "22px", fontWeight: 800 }}>{s.value}</div>
                <div style={{ fontSize: "11px", color: "var(--text2)" }}>{s.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px", marginBottom: "20px" }}>
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "16px", padding: "22px" }}>
          <h3 style={{ fontSize: "15px", fontWeight: 700, marginBottom: "20px" }}>📈 Revenue vs Expenses</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={monthlyData}>
              <XAxis dataKey="month" tick={{ fill: "#8888aa", fontSize: 12 }} axisLine={{ stroke: "#2a2a3a" }} />
              <YAxis tick={{ fill: "#8888aa", fontSize: 12 }} axisLine={{ stroke: "#2a2a3a" }} tickFormatter={v => "₹" + (v / 1000).toFixed(0) + "k"} />
              <Tooltip contentStyle={{ background: "#1a1a24", border: "1px solid #2a2a3a", borderRadius: "8px" }} formatter={(v) => "₹" + ((v ?? 0).toLocaleString())} />
              <Bar dataKey="revenue" fill="#00d97e" radius={[4, 4, 0, 0]} name="Revenue" />
              <Bar dataKey="expense" fill="#ff4d6d" radius={[4, 4, 0, 0]} name="Expenses" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "16px", padding: "22px" }}>
          <h3 style={{ fontSize: "15px", fontWeight: 700, marginBottom: "20px" }}>💳 Expense Categories</h3>
          {categoryData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                    {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
              <Tooltip contentStyle={{ background: "#1a1a24", border: "1px solid #2a2a3a", borderRadius: "8px" }} formatter={(v) => "₹" + ((v ?? 0).toLocaleString())} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", marginTop: "10px" }}>
                {categoryData.map((c, i) => (
                  <div key={c.name} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px" }}>
                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: COLORS[i % COLORS.length] }} />
                    <span style={{ color: "var(--text2)" }}>{c.name}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ textAlign: "center", padding: "40px", color: "var(--text2)" }}>No expense data</div>
          )}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px", marginBottom: "20px" }}>
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "16px", padding: "22px" }}>
          <h3 style={{ fontSize: "15px", fontWeight: 700, marginBottom: "16px" }}>👥 Top Clients by Revenue</h3>
          {clientRevenue.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={clientRevenue} layout="vertical">
                <XAxis type="number" tick={{ fill: "#8888aa", fontSize: 11 }} tickFormatter={v => "₹" + (v / 1000).toFixed(0) + "k"} />
                <YAxis type="category" dataKey="name" tick={{ fill: "#8888aa", fontSize: 11 }} width={100} />
                <Tooltip contentStyle={{ background: "#1a1a24", border: "1px solid #2a2a3a", borderRadius: "8px" }} formatter={(v) => "₹" + ((v ?? 0).toLocaleString())} />
                <Bar dataKey="value" fill="#6c63ff" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ textAlign: "center", padding: "40px", color: "var(--text2)" }}>No client data</div>
          )}
        </div>

        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "16px", padding: "22px" }}>
          <h3 style={{ fontSize: "15px", fontWeight: 700, marginBottom: "16px" }}>📋 Business Summary</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {[
              { label: "Total Clients", value: stats.totalClients, icon: "👥", color: "#6c63ff" },
              { label: "Active Projects", value: stats.activeProjects, icon: "🚀", color: "#ffb800" },
              { label: "Completed Projects", value: stats.completedProjects, icon: "✅", color: "#00d97e" },
              { label: "Pending Invoices", value: stats.pendingInvoices, icon: "⏳", color: "#ffb800" },
              { label: "Overdue Invoices", value: stats.overdueInvoices, icon: "⚠️", color: "#ff4d6d" },
              { label: "Hours Logged", value: Math.floor(stats.totalHoursLogged / 60) + "h", icon: "⏱️", color: "#a78bfa" }
            ].map(s => (
              <div key={s.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "var(--surface2)", borderRadius: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "16px" }}>{s.icon}</span>
                  <span style={{ fontSize: "13px", color: "var(--text2)" }}>{s.label}</span>
                </div>
                <span style={{ fontSize: "15px", fontWeight: 700, color: s.color }}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "16px", padding: "22px" }}>
        <h3 style={{ fontSize: "15px", fontWeight: 700, marginBottom: "16px" }}>💱 Recent Transactions</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr 1fr 1fr", gap: "12px", padding: "10px 0", fontSize: "11px", fontWeight: 700, color: "var(--text2)", textTransform: "uppercase", borderBottom: "1px solid var(--border)" }}>
          <span>Date</span><span>Description</span><span>Type</span><span style={{ textAlign: "right" }}>Amount</span>
        </div>
        {recentTransactions.map(t => (
          <div key={t.id} style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr 1fr 1fr", gap: "12px", padding: "12px 0", borderBottom: "1px solid var(--border)", alignItems: "center" }}>
            <span style={{ fontSize: "12px", color: "var(--text2)" }}>{new Date(t.createdAt || t.date).toLocaleDateString("en-IN")}</span>
            <span style={{ fontSize: "13px", fontWeight: 600 }}>{t.description || t.client?.name || t.invoiceNumber || "-"}</span>
            <span style={{ fontSize: "11px", padding: "3px 10px", borderRadius: "99px", background: t.type === "payment" ? "rgba(0,217,126,0.15)" : "rgba(255,77,109,0.15)", color: t.type === "payment" ? "#00d97e" : "#ff4d6d", width: "fit-content", fontWeight: 600 }}>
              {t.type === "payment" ? "Income" : "Expense"}
            </span>
            <span style={{ fontSize: "14px", fontWeight: 700, textAlign: "right", color: t.type === "payment" ? "#00d97e" : "#ff4d6d" }}>
              {t.type === "payment" ? "+" : "-"}₹{(t.amount || 0).toLocaleString()}
            </span>
          </div>
        ))}
        {recentTransactions.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px", color: "var(--text2)" }}>No transactions yet</div>
        )}
      </div>
    </div>
  )
}
