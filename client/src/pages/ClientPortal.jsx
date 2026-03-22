import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import api from "../lib/api"
import toast from "react-hot-toast"

export default function ClientPortal() {
  const [invoices, setInvoices] = useState([])
  const [payments, setPayments] = useState([])
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedTab, setSelectedTab] = useState("invoices")
  const [clientToken, setClientToken] = useState(null)
  const [showLogin, setShowLogin] = useState(false)
  const [clientEmail, setClientEmail] = useState("")
  const [verifying, setVerifying] = useState(false)

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    try {
      const [invRes, payRes, projRes] = await Promise.allSettled([
        api.get("/invoices"),
        api.get("/payments"),
        api.get("/projects"),
      ])
      setInvoices(invRes.value?.data?.invoices || [])
      setPayments(payRes.value?.data?.payments || payRes.value?.data?.data || [])
      setProjects(projRes.value?.data?.projects || [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const stats = {
    totalInvoiced: invoices.reduce((s, i) => s + (i.total || 0), 0),
    totalPaid: invoices.filter(i => i.status === "paid").reduce((s, i) => s + (i.total || 0), 0),
    totalPending: invoices.filter(i => i.status === "sent").reduce((s, i) => s + (i.total || 0), 0),
    activeProjects: projects.filter(p => p.status === "active").length,
  }

  const pendingInvoices = invoices.filter(i => i.status !== "paid")
  const completedPayments = payments.filter(p => p.status === "completed")

  const STATUS_COLORS = {
    draft: { bg: "rgba(255,184,0,0.15)", color: "#ffb800", label: "Draft" },
    sent: { bg: "rgba(108,99,255,0.15)", color: "#6c63ff", label: "Sent" },
    paid: { bg: "rgba(0,217,126,0.15)", color: "#00d97e", label: "Paid" },
    overdue: { bg: "rgba(255,77,109,0.15)", color: "#ff4d6d", label: "Overdue" },
  }

  const PROJECT_STATUS = {
    planning: { bg: "rgba(108,99,255,0.15)", color: "#6c63ff", label: "Planning" },
    active: { bg: "rgba(255,184,0,0.15)", color: "#ffb800", label: "In Progress" },
    completed: { bg: "rgba(0,217,126,0.15)", color: "#00d97e", label: "Completed" },
    cancelled: { bg: "rgba(255,77,109,0.15)", color: "#ff4d6d", label: "Cancelled" },
  }

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
      <div style={{ width: "48px", height: "48px", border: "3px solid var(--border)", borderTopColor: "#6c63ff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  return (
    <div style={{ maxWidth: "1300px" }}>
      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ fontSize: "32px", fontWeight: 800, letterSpacing: "-0.5px", marginBottom: "8px" }}>🏠 Client Portal</h1>
        <p style={{ color: "var(--text2)", fontSize: "15px" }}>View your invoices, payments, and project progress</p>
      </div>

      {/* Info Banner */}
      <div style={{ background: "linear-gradient(135deg,rgba(108,99,255,0.1),rgba(255,101,132,0.05))", border: "1px solid rgba(108,99,255,0.3)", borderRadius: "16px", padding: "20px 24px", marginBottom: "28px", display: "flex", alignItems: "center", gap: "14px" }}>
        <div style={{ fontSize: "28px" }}>💡</div>
        <div>
          <div style={{ fontSize: "14px", fontWeight: 700, marginBottom: "4px" }}>Welcome to your client portal!</div>
          <div style={{ fontSize: "13px", color: "var(--text2)" }}>Here you can view all your invoices, track payments, and see the progress of your projects. Contact your account manager if you have questions.</div>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "14px", marginBottom: "28px" }}>
        {[
          { label: "Total Invoiced", value: "₹" + stats.totalInvoiced.toLocaleString(), icon: "🧾", color: "#6c63ff" },
          { label: "Total Paid", value: "₹" + stats.totalPaid.toLocaleString(), icon: "✅", color: "#00d97e" },
          { label: "Pending Payment", value: "₹" + stats.totalPending.toLocaleString(), icon: "⏳", color: "#ffb800" },
          { label: "Active Projects", value: stats.activeProjects, icon: "🚀", color: "#ff6584" },
        ].map(s => (
          <div key={s.label} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "14px", padding: "20px", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, right: 0, width: "60px", height: "60px", borderRadius: "0 14px 0 60px", background: s.color + "15" }} />
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: s.color + "20", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>{s.icon}</div>
              <div>
                <div style={{ fontSize: "22px", fontWeight: 800 }}>{s.value}</div>
                <div style={{ fontSize: "11px", color: "var(--text2)" }}>{s.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "6px", marginBottom: "24px", background: "var(--surface)", padding: "6px", borderRadius: "12px", border: "1px solid var(--border)", width: "fit-content" }}>
        {[
          { key: "invoices", label: "🧾 Invoices", count: invoices.length },
          { key: "payments", label: "💳 Payments", count: completedPayments.length },
          { key: "projects", label: "🚀 Projects", count: projects.length },
        ].map(tab => (
          <button key={tab.key} onClick={() => setSelectedTab(tab.key)} style={{ padding: "10px 18px", border: "none", borderRadius: "8px", background: selectedTab === tab.key ? "var(--accent)" : "transparent", color: selectedTab === tab.key ? "#fff" : "var(--text2)", cursor: "pointer", fontSize: "13px", fontWeight: 600 }}>
            {tab.label}
            <span style={{ marginLeft: "6px", background: selectedTab === tab.key ? "rgba(255,255,255,0.2)" : "var(--surface2)", padding: "2px 7px", borderRadius: "99px", fontSize: "11px" }}>{tab.count}</span>
          </button>
        ))}
      </div>

      {/* Invoices Tab */}
      {selectedTab === "invoices" && (
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "16px", overflow: "hidden" }}>
          {invoices.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 40px" }}>
              <div style={{ fontSize: "48px", marginBottom: "16px" }}>🧾</div>
              <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "8px" }}>No invoices yet</h3>
              <p style={{ fontSize: "14px", color: "var(--text2)" }}>Invoices will appear here once created</p>
            </div>
          ) : (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 120px", gap: "12px", padding: "12px 20px", fontSize: "11px", fontWeight: 700, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.08em", borderBottom: "1px solid var(--border)" }}>
                <span>Invoice #</span><span>Amount</span><span>Due Date</span><span>Status</span><span>Actions</span>
              </div>
              {invoices.map(inv => {
                const st = STATUS_COLORS[inv.status] || STATUS_COLORS.draft
                return (
                  <div key={inv._id} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 120px", gap: "12px", padding: "16px 20px", borderBottom: "1px solid var(--border)", alignItems: "center", transition: "background 0.15s" }}
                    onMouseEnter={e => e.currentTarget.style.background = "var(--surface2)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <div style={{ fontWeight: 700, fontSize: "14px", color: "var(--accent)" }}>{inv.invoiceNumber}</div>
                    <div style={{ fontWeight: 800, fontSize: "15px" }}>₹{(inv.total || 0).toLocaleString()}</div>
                    <div style={{ fontSize: "13px", color: inv.status === "overdue" ? "#ff4d6d" : "var(--text2)" }}>
                      {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString("en-IN") : "—"}
                    </div>
                    <div>
                      <span style={{ fontSize: "11px", padding: "4px 10px", borderRadius: "99px", background: st.bg, color: st.color, border: "1px solid " + st.color + "30", fontWeight: 700 }}>{st.label}</span>
                    </div>
                    <div>
                      <Link to="/app/invoices" style={{ fontSize: "12px", color: "var(--accent)", textDecoration: "none", fontWeight: 600 }}>View →</Link>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Payments Tab */}
      {selectedTab === "payments" && (
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "16px", overflow: "hidden" }}>
          {completedPayments.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 40px" }}>
              <div style={{ fontSize: "48px", marginBottom: "16px" }}>💳</div>
              <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "8px" }}>No payments recorded</h3>
              <p style={{ fontSize: "14px", color: "var(--text2)" }}>Payment history will appear here</p>
            </div>
          ) : (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr", gap: "12px", padding: "12px 20px", fontSize: "11px", fontWeight: 700, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.08em", borderBottom: "1px solid var(--border)" }}>
                <span>Client</span><span>Amount</span><span>Date</span><span>Status</span>
              </div>
              {completedPayments.map(pay => (
                <div key={pay._id} style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr", gap: "12px", padding: "16px 20px", borderBottom: "1px solid var(--border)", alignItems: "center", transition: "background 0.15s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "var(--surface2)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <div style={{ fontWeight: 600, fontSize: "14px" }}>{pay.client || "Client"}</div>
                  <div style={{ fontWeight: 800, fontSize: "15px", color: "#00d97e" }}>₹{(pay.amount || 0).toLocaleString()}</div>
                  <div style={{ fontSize: "13px", color: "var(--text2)" }}>
                    {pay.date ? new Date(pay.date).toLocaleDateString("en-IN") : "—"}
                  </div>
                  <div>
                    <span style={{ fontSize: "11px", padding: "4px 10px", borderRadius: "99px", background: "rgba(0,217,126,0.15)", color: "#00d97e", border: "1px solid rgba(0,217,126,0.3)", fontWeight: 700 }}>Completed</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Projects Tab */}
      {selectedTab === "projects" && (
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "16px", overflow: "hidden" }}>
          {projects.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 40px" }}>
              <div style={{ fontSize: "48px", marginBottom: "16px" }}>🚀</div>
              <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "8px" }}>No projects yet</h3>
              <p style={{ fontSize: "14px", color: "var(--text2)" }}>Your projects will appear here</p>
            </div>
          ) : (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: "12px", padding: "12px 20px", fontSize: "11px", fontWeight: 700, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.08em", borderBottom: "1px solid var(--border)" }}>
                <span>Project</span><span>Budget</span><span>Deadline</span><span>Status</span>
              </div>
              {projects.map(proj => {
                const st = PROJECT_STATUS[proj.status] || PROJECT_STATUS.planning
                return (
                  <div key={proj._id} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: "12px", padding: "16px 20px", borderBottom: "1px solid var(--border)", alignItems: "center", transition: "background 0.15s" }}
                    onMouseEnter={e => e.currentTarget.style.background = "var(--surface2)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "14px", marginBottom: "4px" }}>{proj.title}</div>
                      {proj.client && <div style={{ fontSize: "12px", color: "var(--text2)" }}>{proj.client.name}</div>}
                    </div>
                    <div style={{ fontWeight: 700, fontSize: "14px", color: "#00d97e" }}>₹{(proj.budget || 0).toLocaleString()}</div>
                    <div style={{ fontSize: "13px", color: "var(--text2)" }}>
                      {proj.deadline ? new Date(proj.deadline).toLocaleDateString("en-IN") : "—"}
                    </div>
                    <div>
                      <span style={{ fontSize: "11px", padding: "4px 10px", borderRadius: "99px", background: st.bg, color: st.color, border: "1px solid " + st.color + "30", fontWeight: 700 }}>{st.label}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <div style={{ marginTop: "28px", display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "14px" }}>
        {[
          { icon: "📧", label: "Contact Support", desc: "Need help? Reach out to our team", color: "#6c63ff", link: "/app/help" },
          { icon: "💰", label: "View Outstanding", desc: "₹" + stats.totalPending.toLocaleString() + " pending", color: "#ffb800", link: "/app/invoices" },
          { icon: "📋", label: "All Projects", desc: stats.activeProjects + " active projects", color: "#00d97e", link: "/app/projects" },
        ].map(action => (
          <Link key={action.label} to={action.link} style={{ display: "flex", alignItems: "center", gap: "14px", padding: "18px 20px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "14px", textDecoration: "none", transition: "all 0.2s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = action.color; e.currentTarget.style.transform = "translateY(-2px)" }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.transform = "translateY(0)" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "14px", background: action.color + "20", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", flexShrink: 0 }}>{action.icon}</div>
            <div>
              <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text)", marginBottom: "3px" }}>{action.label}</div>
              <div style={{ fontSize: "12px", color: "var(--text2)" }}>{action.desc}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
