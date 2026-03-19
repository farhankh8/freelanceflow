import { useState, useEffect } from "react"
import api from "../lib/api"
import toast from "react-hot-toast"

const STATUS = {
  draft:    { label: "Draft",       color: "#8b9cc8", bg: "rgba(139,156,200,0.15)", border: "rgba(139,156,200,0.3)" },
  sent:     { label: "Sent",        color: "#2CA5E0", bg: "rgba(44,165,224,0.15)",  border: "rgba(44,165,224,0.3)"  },
  viewed:   { label: "Viewed",      color: "#ffb800", bg: "rgba(255,184,0,0.15)",   border: "rgba(255,184,0,0.3)"   },
  accepted: { label: "Accepted ✓",  color: "#00d97e", bg: "rgba(0,217,126,0.15)",  border: "rgba(0,217,126,0.3)"  },
  declined: { label: "Declined",    color: "#ff4d6d", bg: "rgba(255,77,109,0.15)", border: "rgba(255,77,109,0.3)" },
  expired:  { label: "Expired",     color: "#ff6584", bg: "rgba(255,101,132,0.15)",border: "rgba(255,101,132,0.3)"},
}

const LS_KEY = "freelanceflow_proposals"
const OLD_SAMPLE_IDS = new Set(["pr1","pr2","pr3","pr4","pr5"])
const EMPTY_FORM = { title: "", client: "", company: "", amount: "", validUntil: "", services: "", notes: "", status: "draft" }

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed.filter(p => !OLD_SAMPLE_IDS.has(p._id))
    }
  } catch (_) {}
  return []
}

function saveToStorage(data) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(data)) } catch (_) {}
}

export default function Proposals() {
  const [proposals, setProposals] = useState(() => loadFromStorage())
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showPreview, setShowPreview] = useState(null)
  const [editMode, setEditMode] = useState(false)
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)

  // ── Fetch from API + clients ──────────────────────────────────────────────
  useEffect(() => {
    api.get("/clients")
      .then(({ data }) => setClients(data.clients || []))
      .catch(() => {})

    api.get("/proposals")
      .then(({ data }) => {
        const apiList = data?.proposals || data?.data || (Array.isArray(data) ? data : [])
        if (apiList.length > 0) {
          setProposals(prev => {
            const localOnly = prev.filter(p => String(p._id).startsWith("local_"))
            const apiIds = new Set(apiList.map(p => p._id))
            const stillLocal = localOnly.filter(p => !apiIds.has(p._id))
            const merged = [...stillLocal, ...apiList]
            saveToStorage(merged)
            return merged
          })
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const updateProposals = (fn) => {
    setProposals(prev => {
      const next = typeof fn === "function" ? fn(prev) : fn
      saveToStorage(next)
      return next
    })
  }

  const handleCreate = async () => {
    if (!form.title || !form.client) { toast.error("Title and client are required"); return }
    setSaving(true)
    const tempId = "local_" + Date.now()
    const newProposal = {
      _id: tempId,
      ...form,
      amount: Number(form.amount) || 0,
      services: form.services ? form.services.split(",").map(s => s.trim()).filter(Boolean) : [],
      createdAt: new Date().toISOString().split("T")[0],
    }
    updateProposals(prev => [newProposal, ...prev])
    toast.success("Proposal created! 📝")
    setShowModal(false)
    setForm(EMPTY_FORM)
    setSaving(false)

    try {
      const { data } = await api.post("/proposals", {
        ...form,
        amount: Number(form.amount) || 0,
        services: form.services ? form.services.split(",").map(s => s.trim()).filter(Boolean) : [],
      })
      const saved = data?.proposal || data?.data
      if (saved?._id) {
        updateProposals(prev => prev.map(p => p._id === tempId ? saved : p))
      }
    } catch (_) {}
  }

  const handleEdit = async () => {
    if (!form.title || !form.client) { toast.error("Title and client are required"); return }
    setSaving(true)
    const updated = {
      ...showPreview,
      ...form,
      amount: Number(form.amount) || 0,
      services: form.services ? form.services.split(",").map(s => s.trim()).filter(Boolean) : [],
    }
    updateProposals(prev => prev.map(p => p._id === showPreview._id ? updated : p))
    setShowPreview(updated)
    setEditMode(false)
    setSaving(false)
    toast.success("Proposal updated!")

    try {
      await api.put(`/proposals/${showPreview._id}`, updated)
    } catch (_) {}
  }

  const updateStatus = async (id, status) => {
    updateProposals(prev => prev.map(p => p._id === id ? { ...p, status } : p))
    setShowPreview(prev => prev?._id === id ? { ...prev, status } : prev)
    if (status === "accepted") toast.success("🎉 Proposal accepted!")
    else toast.success("Status updated!")
    try { await api.put(`/proposals/${id}`, { status }) } catch (_) {}
  }

  const deleteProposal = async (id) => {
    if (!window.confirm("Delete this proposal?")) return
    updateProposals(prev => prev.filter(p => p._id !== id))
    setShowPreview(null)
    toast.success("Deleted")
    try { await api.delete(`/proposals/${id}`) } catch (_) {}
  }

  const openEdit = (p) => {
    setForm({
      title: p.title, client: p.client, company: p.company || "",
      amount: p.amount || "", validUntil: p.validUntil || "",
      services: p.services?.join(", ") || "", notes: p.notes || "", status: p.status,
    })
    setEditMode(true)
  }

  const shareProposal = (p) => {
    const text = `Hi ${p.client}! 👋\n\n📋 PROPOSAL: ${p.title}\n💰 Amount: ₹${(p.amount || 0).toLocaleString()}\n📅 Valid Until: ${p.validUntil || "—"}\n\n✅ Services:\n${p.services?.map(s => `  • ${s}`).join("\n") || "—"}\n\n${p.notes ? `📝 Notes: ${p.notes}\n\n` : ""}Thank you for your time!\n— Sent via FreelanceFlow`
    navigator.clipboard.writeText(text).then(() => toast.success("Copied! Paste on WhatsApp 💬"))
  }

  const filtered = proposals.filter(p => {
    const matchSearch = !search || p.title?.toLowerCase().includes(search.toLowerCase()) || p.client?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = filterStatus === "all" || p.status === filterStatus
    return matchSearch && matchStatus
  })

  const totalValue    = proposals.reduce((s, p) => s + (p.amount || 0), 0)
  const acceptedValue = proposals.filter(p => p.status === "accepted").reduce((s, p) => s + (p.amount || 0), 0)
  const acceptRate    = proposals.length ? Math.round((proposals.filter(p => p.status === "accepted").length / proposals.length) * 100) : 0
  const pendingCount  = proposals.filter(p => ["sent","viewed"].includes(p.status)).length

  const inp = { width: "100%", padding: "10px 14px", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text)", fontSize: "13px", outline: "none", boxSizing: "border-box" }

  const ProposalForm = ({ onSubmit, submitLabel }) => (
    <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: "14px" }}>
      <div>
        <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text2)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Proposal Title *</label>
        <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. E-commerce Website Development" style={inp} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
        <div>
          <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text2)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Client Name *</label>
          <input value={form.client} onChange={e => setForm(f => ({ ...f, client: e.target.value }))} placeholder="John Doe" list="client-list" style={inp} />
          <datalist id="client-list">{clients.map(c => <option key={c._id} value={c.name} />)}</datalist>
        </div>
        <div>
          <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text2)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Company</label>
          <input value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} placeholder="Company name" style={inp} />
        </div>
        <div>
          <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text2)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Total Amount (₹)</label>
          <input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="50000" style={inp} />
        </div>
        <div>
          <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text2)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Valid Until</label>
          <input type="date" value={form.validUntil} onChange={e => setForm(f => ({ ...f, validUntil: e.target.value }))} style={inp} />
        </div>
        <div>
          <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text2)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Status</label>
          <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} style={inp}>
            {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text2)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Services (comma separated)</label>
        <input value={form.services} onChange={e => setForm(f => ({ ...f, services: e.target.value }))} placeholder="Frontend Dev, Backend API, Deployment..." style={inp} />
      </div>
      <div>
        <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text2)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Notes / Terms</label>
        <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3} placeholder="Project details, timeline, payment terms..." style={{ ...inp, resize: "vertical" }} />
      </div>
      {form.amount && (
        <div style={{ padding: "12px 16px", background: "rgba(0,217,126,0.08)", border: "1px solid rgba(0,217,126,0.25)", borderRadius: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "13px", color: "var(--text2)" }}>Proposal value:</span>
          <span style={{ fontSize: "18px", fontWeight: 800, color: "#00d97e" }}>₹{Number(form.amount).toLocaleString()}</span>
        </div>
      )}
      <div style={{ display: "flex", gap: "10px", paddingTop: "4px" }}>
        <button onClick={() => { setShowModal(false); setEditMode(false) }} style={{ flex: 1, padding: "12px", background: "transparent", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text2)", cursor: "pointer", fontWeight: 600 }}>Cancel</button>
        <button onClick={onSubmit} disabled={saving} style={{ flex: 2, padding: "12px", background: "linear-gradient(135deg,#6c63ff,#ff6584)", border: "none", borderRadius: "8px", color: "#fff", cursor: saving ? "not-allowed" : "pointer", fontWeight: 700, fontSize: "15px", opacity: saving ? 0.7 : 1 }}>{saving ? "Saving..." : submitLabel}</button>
      </div>
    </div>
  )

  return (
    <div style={{ maxWidth: "1200px" }}>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: 800, letterSpacing: "-0.5px", marginBottom: "4px" }}>Proposals</h1>
          <p style={{ color: "var(--text2)", fontSize: "14px" }}>{proposals.length} total · {acceptRate}% acceptance rate · {pendingCount} pending response</p>
        </div>
        <button onClick={() => { setForm(EMPTY_FORM); setShowModal(true) }} style={{ padding: "10px 20px", background: "linear-gradient(135deg,#6c63ff,#ff6584)", border: "none", borderRadius: "10px", color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: "14px" }}>+ New Proposal</button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "14px", marginBottom: "24px" }}>
        {[
          { label: "Total Proposals", value: proposals.length,                          icon: "📝", color: "#6c63ff" },
          { label: "Total Value",     value: "₹" + totalValue.toLocaleString(),          icon: "💰", color: "#ffb800" },
          { label: "Accepted Value",  value: "₹" + acceptedValue.toLocaleString(),       icon: "🏆", color: "#00d97e" },
          { label: "Accept Rate",     value: acceptRate + "%",                           icon: "📈", color: "#ff6584" },
        ].map(s => (
          <div key={s.label} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "14px", padding: "18px 20px", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, right: 0, width: "60px", height: "60px", borderRadius: "0 14px 0 60px", background: s.color + "15" }} />
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: s.color + "20", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>{s.icon}</div>
              <div>
                <div style={{ fontSize: "20px", fontWeight: 800 }}>{s.value}</div>
                <div style={{ fontSize: "11px", color: "var(--text2)" }}>{s.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: "200px" }}>
          <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }}>🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by title or client..." style={{ ...inp, padding: "9px 12px 9px 36px" }} />
        </div>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          <button onClick={() => setFilterStatus("all")} style={{ padding: "7px 14px", borderRadius: "8px", border: "1px solid var(--border)", background: filterStatus === "all" ? "var(--accent)" : "var(--surface)", color: filterStatus === "all" ? "#fff" : "var(--text2)", fontSize: "12px", cursor: "pointer", fontWeight: 600 }}>All</button>
          {Object.entries(STATUS).map(([k, v]) => (
            <button key={k} onClick={() => setFilterStatus(filterStatus === k ? "all" : k)} style={{ padding: "7px 14px", borderRadius: "8px", border: "1px solid " + (filterStatus === k ? v.color : "var(--border)"), background: filterStatus === k ? v.bg : "var(--surface)", color: filterStatus === k ? v.color : "var(--text2)", fontSize: "12px", cursor: "pointer", fontWeight: 600 }}>{v.label}</button>
          ))}
        </div>
      </div>

      {/* Empty state */}
      {proposals.length === 0 && !loading && (
        <div style={{ textAlign: "center", padding: "80px 20px", background: "var(--surface)", border: "2px dashed var(--border)", borderRadius: "20px" }}>
          <div style={{ fontSize: "56px", marginBottom: "16px" }}>📝</div>
          <p style={{ fontSize: "18px", fontWeight: 700, marginBottom: "8px" }}>No proposals yet</p>
          <p style={{ fontSize: "14px", color: "var(--text2)", marginBottom: "20px" }}>Create your first proposal and win more clients</p>
          <button onClick={() => { setForm(EMPTY_FORM); setShowModal(true) }} style={{ padding: "12px 28px", background: "linear-gradient(135deg,#6c63ff,#ff6584)", border: "none", borderRadius: "10px", color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: "14px" }}>+ Create First Proposal</button>
        </div>
      )}

      {/* Grid */}
      {proposals.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "16px" }}>
          {filtered.map(p => {
            const st = STATUS[p.status] || STATUS.draft
            const daysLeft = p.validUntil ? Math.ceil((new Date(p.validUntil) - new Date()) / 86400000) : null
            const isLocal = String(p._id).startsWith("local_")
            return (
              <div key={p._id}
                style={{ background: "var(--surface)", border: "1px solid " + (isLocal ? "rgba(255,184,0,0.3)" : "var(--border)"), borderRadius: "16px", padding: "20px", cursor: "pointer", transition: "all 0.2s", position: "relative" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(108,99,255,0.5)"; e.currentTarget.style.transform = "translateY(-3px)" }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = isLocal ? "rgba(255,184,0,0.3)" : "var(--border)"; e.currentTarget.style.transform = "translateY(0)" }}
                onClick={() => setShowPreview(p)}>

                {/* Edit button */}
                <button onClick={e => { e.stopPropagation(); openEdit(p); setShowPreview(p); setEditMode(true) }}
                  style={{ position: "absolute", top: "14px", right: "14px", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: "6px", cursor: "pointer", fontSize: "12px", padding: "3px 8px", color: "var(--text2)" }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = "#6c63ff"}
                  onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}>✏️</button>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px", paddingRight: "36px" }}>
                  <span style={{ fontSize: "11px", padding: "3px 10px", borderRadius: "99px", background: st.bg, color: st.color, border: "1px solid " + st.border, fontWeight: 700 }}>{st.label}</span>
                  {daysLeft !== null && (
                    <span style={{ fontSize: "10px", color: daysLeft < 0 ? "#ff4d6d" : daysLeft < 5 ? "#ffb800" : "var(--text2)", fontWeight: 600 }}>
                      {daysLeft < 0 ? "Expired" : daysLeft === 0 ? "Expires today!" : `${daysLeft}d left`}
                    </span>
                  )}
                </div>

                <h3 style={{ fontSize: "15px", fontWeight: 800, marginBottom: "8px", lineHeight: "1.3" }}>{p.title}</h3>

                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
                  <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "linear-gradient(135deg,#6c63ff,#ff6584)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 800, color: "#fff", flexShrink: 0 }}>{p.client?.[0]?.toUpperCase()}</div>
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: 700 }}>{p.client}</div>
                    {p.company && <div style={{ fontSize: "11px", color: "var(--text2)" }}>{p.company}</div>}
                  </div>
                  {isLocal && <span style={{ fontSize: "9px", marginLeft: "auto", padding: "1px 6px", borderRadius: "99px", background: "rgba(255,184,0,0.15)", color: "#ffb800", border: "1px solid rgba(255,184,0,0.3)", fontWeight: 700 }}>LOCAL</span>}
                </div>

                <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", marginBottom: "14px" }}>
                  {p.services?.slice(0, 3).map(s => <span key={s} style={{ fontSize: "10px", padding: "2px 7px", borderRadius: "99px", background: "rgba(108,99,255,0.1)", color: "#6c63ff", border: "1px solid rgba(108,99,255,0.2)" }}>{s}</span>)}
                  {p.services?.length > 3 && <span style={{ fontSize: "10px", padding: "2px 7px", borderRadius: "99px", background: "var(--surface2)", color: "var(--text2)" }}>+{p.services.length - 3} more</span>}
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "12px", borderTop: "1px solid var(--border)" }}>
                  <span style={{ fontSize: "20px", fontWeight: 800, color: "#00d97e" }}>₹{(p.amount || 0).toLocaleString()}</span>
                  <span style={{ fontSize: "11px", color: "var(--text2)" }}>{p.createdAt}</span>
                </div>
              </div>
            )
          })}
          {filtered.length === 0 && proposals.length > 0 && (
            <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "60px", color: "var(--text2)", background: "var(--surface)", borderRadius: "16px", border: "1px solid var(--border)" }}>
              <div style={{ fontSize: "40px", marginBottom: "12px" }}>🔍</div>
              <p style={{ fontWeight: 600 }}>No proposals match your filters</p>
            </div>
          )}
        </div>
      )}

      {/* CREATE MODAL */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "20px", width: "100%", maxWidth: "600px", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ padding: "24px 28px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div><h2 style={{ fontSize: "20px", fontWeight: 800 }}>New Proposal</h2><p style={{ fontSize: "13px", color: "var(--text2)", marginTop: "2px" }}>Create a professional proposal</p></div>
              <button onClick={() => setShowModal(false)} style={{ background: "transparent", border: "none", color: "var(--text2)", cursor: "pointer", fontSize: "22px" }}>×</button>
            </div>
            <ProposalForm onSubmit={handleCreate} submitLabel="Create Proposal 📝" />
          </div>
        </div>
      )}

      {/* PREVIEW / EDIT MODAL */}
      {showPreview && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "20px", width: "100%", maxWidth: "620px", maxHeight: "90vh", overflowY: "auto" }}>

            {editMode ? (
              <>
                <div style={{ padding: "24px 28px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div><h2 style={{ fontSize: "20px", fontWeight: 800 }}>Edit Proposal</h2><p style={{ fontSize: "13px", color: "var(--text2)", marginTop: "2px" }}>Editing — {showPreview.title}</p></div>
                  <button onClick={() => setEditMode(false)} style={{ background: "transparent", border: "none", color: "var(--text2)", cursor: "pointer", fontSize: "22px" }}>×</button>
                </div>
                <ProposalForm onSubmit={handleEdit} submitLabel="Save Changes ✏️" />
              </>
            ) : (
              <>
                {/* Proposal Header */}
                <div style={{ background: "linear-gradient(135deg,#1a1a2e,#16213e)", padding: "32px", borderRadius: "20px 20px 0 0" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontSize: "20px", fontWeight: 800, color: "#a78bfa", marginBottom: "4px" }}>💼 FreelanceFlow</div>
                      <div style={{ fontSize: "11px", color: "#7c6fcd" }}>Professional Proposal</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "22px", fontWeight: 800, color: "#fff", letterSpacing: "2px" }}>PROPOSAL</div>
                      <div style={{ fontSize: "11px", color: "#a78bfa", marginTop: "2px" }}>#{String(showPreview._id).slice(-6).toUpperCase()}</div>
                    </div>
                  </div>
                </div>

                <div style={{ padding: "28px 32px", display: "flex", flexDirection: "column", gap: "20px" }}>
                  {/* Title + Client */}
                  <div>
                    <h2 style={{ fontSize: "22px", fontWeight: 800, marginBottom: "10px", lineHeight: "1.3" }}>{showPreview.title}</h2>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "linear-gradient(135deg,#6c63ff,#ff6584)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: 800, color: "#fff" }}>{showPreview.client?.[0]?.toUpperCase()}</div>
                      <div>
                        <div style={{ fontSize: "15px", fontWeight: 700 }}>{showPreview.client}</div>
                        {showPreview.company && <div style={{ fontSize: "12px", color: "var(--text2)" }}>{showPreview.company}</div>}
                      </div>
                      <span style={{ marginLeft: "auto", fontSize: "11px", padding: "3px 12px", borderRadius: "99px", background: STATUS[showPreview.status]?.bg, color: STATUS[showPreview.status]?.color, border: "1px solid " + STATUS[showPreview.status]?.border, fontWeight: 700 }}>{STATUS[showPreview.status]?.label}</span>
                    </div>
                  </div>

                  {/* Services */}
                  {showPreview.services?.length > 0 && (
                    <div>
                      <h3 style={{ fontSize: "12px", fontWeight: 700, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>Services Included</h3>
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        {showPreview.services.map((s, i) => (
                          <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", background: "var(--surface2)", borderRadius: "8px" }}>
                            <div style={{ width: "22px", height: "22px", borderRadius: "50%", background: "linear-gradient(135deg,#6c63ff,#ff6584)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 800, color: "#fff", flexShrink: 0 }}>{i + 1}</div>
                            <span style={{ fontSize: "13px", fontWeight: 600, flex: 1 }}>{s}</span>
                            <span style={{ color: "#00d97e" }}>✓</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Info Grid */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    {[
                      { label: "Total Amount",  value: "₹" + (showPreview.amount || 0).toLocaleString(), big: true },
                      { label: "Valid Until",   value: showPreview.validUntil || "—" },
                      { label: "Created",       value: showPreview.createdAt },
                      { label: "Services",      value: (showPreview.services?.length || 0) + " included" },
                    ].map(item => (
                      <div key={item.label} style={{ background: "var(--surface2)", borderRadius: "10px", padding: "12px 16px" }}>
                        <div style={{ fontSize: "10px", color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "4px" }}>{item.label}</div>
                        <div style={{ fontSize: item.big ? "22px" : "14px", fontWeight: 800, color: item.big ? "#00d97e" : "var(--text)" }}>{item.value}</div>
                      </div>
                    ))}
                  </div>

                  {showPreview.notes && (
                    <div style={{ background: "var(--surface2)", borderRadius: "10px", padding: "16px" }}>
                      <div style={{ fontSize: "11px", color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>📝 Notes / Terms</div>
                      <p style={{ fontSize: "13px", lineHeight: "1.7", color: "var(--text)" }}>{showPreview.notes}</p>
                    </div>
                  )}

                  {/* Status Update */}
                  <div>
                    <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>Update Status</div>
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                      {Object.entries(STATUS).map(([k, v]) => (
                        <button key={k} onClick={() => updateStatus(showPreview._id, k)}
                          style={{ padding: "6px 12px", borderRadius: "99px", border: "1px solid " + v.border, background: showPreview.status === k ? v.bg : "transparent", color: v.color, cursor: "pointer", fontSize: "11px", fontWeight: 700 }}>{v.label}</button>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button onClick={() => shareProposal(showPreview)} style={{ flex: 1, padding: "11px", background: "rgba(37,211,102,0.1)", border: "1px solid rgba(37,211,102,0.3)", borderRadius: "8px", color: "#25D366", cursor: "pointer", fontWeight: 700, fontSize: "13px" }}>💬 Share</button>
                    <button onClick={() => openEdit(showPreview)} style={{ flex: 1, padding: "11px", background: "rgba(108,99,255,0.1)", border: "1px solid rgba(108,99,255,0.3)", borderRadius: "8px", color: "#6c63ff", cursor: "pointer", fontWeight: 700, fontSize: "13px" }}>✏️ Edit</button>
                    <button onClick={() => setShowPreview(null)} style={{ flex: 1, padding: "11px", background: "transparent", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text2)", cursor: "pointer", fontWeight: 600 }}>Close</button>
                    <button onClick={() => deleteProposal(showPreview._id)} style={{ flex: 1, padding: "11px", background: "rgba(255,77,109,0.1)", border: "1px solid rgba(255,77,109,0.3)", borderRadius: "8px", color: "#ff4d6d", cursor: "pointer", fontWeight: 700 }}>🗑️ Delete</button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}