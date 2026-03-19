import { useState, useEffect } from "react"
import api from "../lib/api"
import toast from "react-hot-toast"

const STATUS = {
  draft:     { label: "Draft",      color: "#8b9cc8", bg: "rgba(139,156,200,0.15)", border: "rgba(139,156,200,0.3)" },
  sent:      { label: "Sent",       color: "#2CA5E0", bg: "rgba(44,165,224,0.15)",  border: "rgba(44,165,224,0.3)"  },
  signed:    { label: "Signed ✓",   color: "#00d97e", bg: "rgba(0,217,126,0.15)",  border: "rgba(0,217,126,0.3)"  },
  active:    { label: "Active",     color: "#6c63ff", bg: "rgba(108,99,255,0.15)", border: "rgba(108,99,255,0.3)" },
  completed: { label: "Completed",  color: "#00c9a7", bg: "rgba(0,201,167,0.15)",  border: "rgba(0,201,167,0.3)"  },
  cancelled: { label: "Cancelled",  color: "#ff4d6d", bg: "rgba(255,77,109,0.15)", border: "rgba(255,77,109,0.3)" },
  expired:   { label: "Expired",    color: "#ff6584", bg: "rgba(255,101,132,0.15)",border: "rgba(255,101,132,0.3)"},
}

const CONTRACT_TYPES = [
  "Fixed Price", "Hourly Rate", "Retainer", "Milestone-Based", "Revenue Share", "Subscription"
]

const PAYMENT_TERMS = [
  "50% upfront, 50% on delivery",
  "100% upfront",
  "Monthly invoicing",
  "Net 15",
  "Net 30",
  "Milestone payments",
  "Weekly payments",
]

const LS_KEY = "freelanceflow_contracts"

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed
    }
  } catch (_) {}
  return []
}

function saveToStorage(data) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(data)) } catch (_) {}
}

const EMPTY_FORM = {
  title: "", client: "", company: "", contractType: "Fixed Price",
  value: "", startDate: "", endDate: "", paymentTerms: "50% upfront, 50% on delivery",
  scope: "", deliverables: "", revisions: "2", status: "draft",
  notes: "", signedDate: "",
}

export default function Contracts() {
  const [contracts, setContracts] = useState(() => loadFromStorage())
  const [clients, setClients]     = useState([])
  const [projects, setProjects]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [modal, setModal]         = useState(null)
  const [selected, setSelected]   = useState(null)
  const [search, setSearch]       = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterType, setFilterType]     = useState("all")
  const [saving, setSaving]       = useState(false)
  const [form, setForm]           = useState(EMPTY_FORM)
  const [activeTab, setActiveTab] = useState("details")

  useEffect(() => {
    api.get("/clients").then(({ data }) => setClients(data.clients || [])).catch(() => {})
    api.get("/projects").then(({ data }) => setProjects(data.projects || [])).catch(() => {})
    api.get("/contracts")
      .then(({ data }) => {
        const apiList = data?.contracts || data?.data || (Array.isArray(data) ? data : [])
        if (apiList.length > 0) {
          setContracts(prev => {
            const localOnly = prev.filter(c => String(c._id).startsWith("local_"))
            const apiIds = new Set(apiList.map(c => c._id))
            const stillLocal = localOnly.filter(c => !apiIds.has(c._id))
            const merged = [...stillLocal, ...apiList]
            saveToStorage(merged)
            return merged
          })
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const updateContracts = (fn) => {
    setContracts(prev => {
      const next = typeof fn === "function" ? fn(prev) : fn
      saveToStorage(next)
      return next
    })
  }

  const openCreate = () => {
    setForm(EMPTY_FORM)
    setActiveTab("details")
    setModal("create")
  }

  const openEdit = (c) => {
    setForm({
      title: c.title || "", client: c.client || "", company: c.company || "",
      contractType: c.contractType || "Fixed Price", value: c.value || "",
      startDate: c.startDate || "", endDate: c.endDate || "",
      paymentTerms: c.paymentTerms || "50% upfront, 50% on delivery",
      scope: c.scope || "", deliverables: c.deliverables || "",
      revisions: c.revisions || "2", status: c.status || "draft",
      notes: c.notes || "", signedDate: c.signedDate || "",
    })
    setActiveTab("details")
    setSelected(c)
    setModal("edit")
  }

  const handleCreate = async () => {
    if (!form.title || !form.client) { toast.error("Title and client are required"); return }
    setSaving(true)
    const tempId = "local_" + Date.now()
    const newContract = {
      _id: tempId, ...form,
      value: Number(form.value) || 0,
      revisions: Number(form.revisions) || 2,
      createdAt: new Date().toISOString().split("T")[0],
      contractNo: "CON-" + Date.now().toString().slice(-6),
    }
    updateContracts(prev => [newContract, ...prev])
    toast.success("Contract created!")
    setModal(null)
    setSaving(false)
    try {
      const { data } = await api.post("/contracts", { ...form, value: Number(form.value) || 0 })
      const saved = data?.contract || data?.data
      if (saved?._id) updateContracts(prev => prev.map(c => c._id === tempId ? saved : c))
    } catch (_) {}
  }

  const handleEdit = async () => {
    if (!form.title || !form.client) { toast.error("Title and client are required"); return }
    setSaving(true)
    const updated = { ...selected, ...form, value: Number(form.value) || 0 }
    updateContracts(prev => prev.map(c => c._id === selected._id ? updated : c))
    setSelected(updated)
    setModal("view")
    setSaving(false)
    toast.success("Contract updated!")
    try { await api.put(`/contracts/${selected._id}`, updated) } catch (_) {}
  }

  const updateStatus = async (id, status) => {
    const extra = status === "signed" ? { signedDate: new Date().toISOString().split("T")[0] } : {}
    updateContracts(prev => prev.map(c => c._id === id ? { ...c, status, ...extra } : c))
    setSelected(s => s?._id === id ? { ...s, status, ...extra } : s)
    if (status === "signed") toast.success("Contract signed!")
    else toast.success("Status updated!")
    try { await api.put(`/contracts/${id}`, { status, ...extra }) } catch (_) {}
  }

  const deleteContract = async (id) => {
    if (!window.confirm("Delete this contract? This cannot be undone.")) return
    updateContracts(prev => prev.filter(c => c._id !== id))
    setModal(null)
    setSelected(null)
    toast.success("Contract deleted")
    try { await api.delete(`/contracts/${id}`) } catch (_) {}
  }

  const copyContractText = (c) => {
    const text = `CONTRACT AGREEMENT\n\nContract No: ${c.contractNo || "CON-" + String(c._id).slice(-6).toUpperCase()}\nDate: ${c.createdAt}\n\nClient: ${c.client}${c.company ? " - " + c.company : ""}\nTitle: ${c.title}\nType: ${c.contractType}\nValue: ${(c.value || 0).toLocaleString()}\nStart: ${c.startDate || "TBD"}\nEnd: ${c.endDate || "TBD"}\n\nScope:\n${c.scope || "As agreed."}\n\nDeliverables:\n${c.deliverables || "As specified."}\n\nPayment Terms: ${c.paymentTerms}`
    navigator.clipboard.writeText(text).then(() => toast.success("Copied!"))
  }

  const filtered = contracts.filter(c => {
    const q = search.toLowerCase()
    const matchSearch = !search || c.title?.toLowerCase().includes(q) || c.client?.toLowerCase().includes(q)
    const matchStatus = filterStatus === "all" || c.status === filterStatus
    const matchType   = filterType === "all" || c.contractType === filterType
    return matchSearch && matchStatus && matchType
  })

  const totalValue    = contracts.reduce((s, c) => s + (c.value || 0), 0)
  const activeValue   = contracts.filter(c => ["active","signed"].includes(c.status)).reduce((s, c) => s + (c.value || 0), 0)
  const signedCount   = contracts.filter(c => ["signed","active","completed"].includes(c.status)).length
  const signRate      = contracts.length ? Math.round((signedCount / contracts.length) * 100) : 0
  const expiringCount = contracts.filter(c => {
    if (!c.endDate || c.status === "completed" || c.status === "cancelled") return false
    const days = Math.ceil((new Date(c.endDate) - new Date()) / 86400000)
    return days >= 0 && days <= 7
  }).length

  const inp = { width: "100%", padding: "10px 14px", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text)", fontSize: "13px", outline: "none", boxSizing: "border-box" }

  const Tab = ({ id, label }) => (
    <button onClick={() => setActiveTab(id)} style={{ padding: "8px 16px", border: "none", background: activeTab === id ? "var(--accent)" : "transparent", color: activeTab === id ? "#fff" : "var(--text2)", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: 600 }}>{label}</button>
  )

  const FormContent = () => (
    <div style={{ padding: "0 28px 24px", display: "flex", flexDirection: "column", gap: "14px" }}>
      <div style={{ display: "flex", gap: "4px", padding: "4px", background: "var(--surface2)", borderRadius: "10px" }}>
        <Tab id="details" label="Details" />
        <Tab id="scope"   label="Scope" />
        <Tab id="payment" label="Payment" />
      </div>

      {activeTab === "details" && (
        <>
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text2)", marginBottom: "6px", textTransform: "uppercase" }}>Contract Title *</label>
            <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Website Development Agreement" style={inp} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text2)", marginBottom: "6px", textTransform: "uppercase" }}>Client Name *</label>
              <input value={form.client} onChange={e => setForm(f => ({ ...f, client: e.target.value }))} placeholder="Client name" list="client-list-c" style={inp} />
              <datalist id="client-list-c">{clients.map(c => <option key={c._id} value={c.name} />)}</datalist>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text2)", marginBottom: "6px", textTransform: "uppercase" }}>Company</label>
              <input value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} placeholder="Company name" style={inp} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text2)", marginBottom: "6px", textTransform: "uppercase" }}>Contract Type</label>
              <select value={form.contractType} onChange={e => setForm(f => ({ ...f, contractType: e.target.value }))} style={inp}>
                {CONTRACT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text2)", marginBottom: "6px", textTransform: "uppercase" }}>Value</label>
              <input type="number" value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} placeholder="50000" style={inp} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text2)", marginBottom: "6px", textTransform: "uppercase" }}>Start Date</label>
              <input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} style={inp} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text2)", marginBottom: "6px", textTransform: "uppercase" }}>End Date</label>
              <input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} style={inp} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text2)", marginBottom: "6px", textTransform: "uppercase" }}>Status</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} style={inp}>
                {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text2)", marginBottom: "6px", textTransform: "uppercase" }}>Revisions</label>
              <input type="number" min="0" value={form.revisions} onChange={e => setForm(f => ({ ...f, revisions: e.target.value }))} placeholder="2" style={inp} />
            </div>
          </div>
        </>
      )}

      {activeTab === "scope" && (
        <>
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text2)", marginBottom: "6px", textTransform: "uppercase" }}>Scope of Work</label>
            <textarea value={form.scope} onChange={e => setForm(f => ({ ...f, scope: e.target.value }))} rows={5} placeholder="Describe what is included..." style={{ ...inp, resize: "vertical" }} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text2)", marginBottom: "6px", textTransform: "uppercase" }}>Deliverables</label>
            <textarea value={form.deliverables} onChange={e => setForm(f => ({ ...f, deliverables: e.target.value }))} rows={4} placeholder="List deliverables..." style={{ ...inp, resize: "vertical" }} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text2)", marginBottom: "6px", textTransform: "uppercase" }}>Notes / Exclusions</label>
            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3} placeholder="What is NOT included, special terms..." style={{ ...inp, resize: "vertical" }} />
          </div>
        </>
      )}

      {activeTab === "payment" && (
        <>
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text2)", marginBottom: "6px", textTransform: "uppercase" }}>Payment Terms</label>
            <select value={form.paymentTerms} onChange={e => setForm(f => ({ ...f, paymentTerms: e.target.value }))} style={inp}>
              {PAYMENT_TERMS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text2)", marginBottom: "6px", textTransform: "uppercase" }}>Signed Date</label>
            <input type="date" value={form.signedDate} onChange={e => setForm(f => ({ ...f, signedDate: e.target.value }))} style={inp} />
          </div>
          {form.value && (
            <div style={{ padding: "14px 18px", background: "rgba(108,99,255,0.08)", border: "1px solid rgba(108,99,255,0.2)", borderRadius: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "13px", color: "var(--text2)" }}>Total Value</span>
              <span style={{ fontSize: "22px", fontWeight: 800, color: "#6c63ff" }}>&#8377;{Number(form.value).toLocaleString()}</span>
            </div>
          )}
        </>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", paddingTop: "8px" }}>
        <div style={{ display: "flex", gap: "8px" }}>
          {activeTab !== "details" && <button onClick={() => setActiveTab(activeTab === "payment" ? "scope" : "details")} style={{ padding: "11px 16px", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text2)", cursor: "pointer", fontWeight: 600, fontSize: "13px" }}>Back</button>}
          {activeTab !== "payment" && <button onClick={() => setActiveTab(activeTab === "details" ? "scope" : "payment")} style={{ padding: "11px 16px", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text)", cursor: "pointer", fontWeight: 600, fontSize: "13px" }}>Next</button>}
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={() => setModal(selected ? "view" : null)} style={{ padding: "11px 20px", background: "transparent", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text2)", cursor: "pointer", fontWeight: 600 }}>Cancel</button>
          <button onClick={modal === "edit" ? handleEdit : handleCreate} disabled={saving} style={{ padding: "11px 28px", background: "linear-gradient(135deg,#6c63ff,#ff6584)", border: "none", borderRadius: "8px", color: "#fff", cursor: saving ? "not-allowed" : "pointer", fontWeight: 700, fontSize: "14px", opacity: saving ? 0.7 : 1 }}>
            {saving ? "Saving..." : modal === "edit" ? "Save Changes" : "Create Contract"}
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div style={{ maxWidth: "1200px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: 800, letterSpacing: "-0.5px", marginBottom: "4px" }}>Contracts</h1>
          <p style={{ color: "var(--text2)", fontSize: "14px" }}>
            {contracts.length} total · {signRate}% sign rate
            {expiringCount > 0 && <span style={{ marginLeft: "8px", padding: "2px 8px", borderRadius: "99px", background: "rgba(255,184,0,0.15)", color: "#ffb800", fontSize: "12px", fontWeight: 700 }}>⚠️ {expiringCount} expiring soon</span>}
          </p>
        </div>
        <button onClick={openCreate} style={{ padding: "10px 20px", background: "linear-gradient(135deg,#6c63ff,#ff6584)", border: "none", borderRadius: "10px", color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: "14px" }}>+ New Contract</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "14px", marginBottom: "24px" }}>
        {[
          { label: "Total Contracts", value: contracts.length,                  icon: "📜", color: "#6c63ff" },
          { label: "Total Value",     value: "₹" + totalValue.toLocaleString(), icon: "💰", color: "#ffb800" },
          { label: "Active Value",    value: "₹" + activeValue.toLocaleString(),icon: "⚡", color: "#00d97e" },
          { label: "Sign Rate",       value: signRate + "%",                    icon: "✍️", color: "#ff6584" },
        ].map(s => (
          <div key={s.label} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "14px", padding: "18px 20px" }}>
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

      <div style={{ display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: "200px" }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by title or client..." style={{ ...inp, padding: "9px 12px" }} />
        </div>
        <select value={filterType} onChange={e => setFilterType(e.target.value)} style={{ ...inp, width: "auto", padding: "9px 14px" }}>
          <option value="all">All Types</option>
          {CONTRACT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          <button onClick={() => setFilterStatus("all")} style={{ padding: "7px 14px", borderRadius: "8px", border: "1px solid var(--border)", background: filterStatus === "all" ? "var(--accent)" : "var(--surface)", color: filterStatus === "all" ? "#fff" : "var(--text2)", fontSize: "12px", cursor: "pointer", fontWeight: 600 }}>All</button>
          {Object.entries(STATUS).map(([k, v]) => (
            <button key={k} onClick={() => setFilterStatus(filterStatus === k ? "all" : k)} style={{ padding: "7px 14px", borderRadius: "8px", border: "1px solid " + (filterStatus === k ? v.color : "var(--border)"), background: filterStatus === k ? v.bg : "var(--surface)", color: filterStatus === k ? v.color : "var(--text2)", fontSize: "12px", cursor: "pointer", fontWeight: 600 }}>{v.label}</button>
          ))}
        </div>
      </div>

      {contracts.length === 0 && !loading && (
        <div style={{ textAlign: "center", padding: "80px 20px", background: "var(--surface)", border: "2px dashed var(--border)", borderRadius: "20px" }}>
          <div style={{ fontSize: "56px", marginBottom: "16px" }}>📜</div>
          <p style={{ fontSize: "18px", fontWeight: 700, marginBottom: "8px" }}>No contracts yet</p>
          <p style={{ fontSize: "14px", color: "var(--text2)", marginBottom: "20px" }}>Protect your work and get paid on time</p>
          <button onClick={openCreate} style={{ padding: "12px 28px", background: "linear-gradient(135deg,#6c63ff,#ff6584)", border: "none", borderRadius: "10px", color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: "14px" }}>+ Create First Contract</button>
        </div>
      )}

      {contracts.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {filtered.map(c => {
            const st = STATUS[c.status] || STATUS.draft
            const daysLeft = c.endDate ? Math.ceil((new Date(c.endDate) - new Date()) / 86400000) : null
            const isLocal  = String(c._id).startsWith("local_")
            const isExpiring = daysLeft !== null && daysLeft >= 0 && daysLeft <= 7
            return (
              <div key={c._id}
                style={{ display: "flex", alignItems: "center", gap: "16px", padding: "18px 20px", background: "var(--surface)", border: "1px solid " + (isExpiring ? "rgba(255,184,0,0.4)" : "var(--border)"), borderRadius: "14px", cursor: "pointer", transition: "all 0.15s" }}
                onClick={() => { setSelected(c); setModal("view") }}>
                <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: st.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", flexShrink: 0 }}>📜</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: "15px", marginBottom: "4px" }}>{c.title}</div>
                  <div style={{ display: "flex", gap: "12px", fontSize: "12px", color: "var(--text2)" }}>
                    <span>👤 {c.client}</span>
                    <span>📋 {c.contractType}</span>
                    {c.startDate && <span>📅 {c.startDate}{c.endDate ? " → " + c.endDate : ""}</span>}
                  </div>
                </div>
                <div style={{ textAlign: "center", flexShrink: 0 }}>
                  <span style={{ fontSize: "11px", padding: "4px 12px", borderRadius: "99px", background: st.bg, color: st.color, border: "1px solid " + st.border, fontWeight: 700 }}>{st.label}</span>
                  {daysLeft !== null && (
                    <div style={{ fontSize: "10px", marginTop: "5px", color: daysLeft < 0 ? "#ff4d6d" : isExpiring ? "#ffb800" : "var(--text2)", fontWeight: 600 }}>
                      {daysLeft < 0 ? Math.abs(daysLeft) + "d overdue" : daysLeft === 0 ? "Ends today!" : daysLeft + "d left"}
                    </div>
                  )}
                </div>
                <div style={{ textAlign: "right", flexShrink: 0, minWidth: "100px" }}>
                  <div style={{ fontSize: "18px", fontWeight: 800, color: "#00d97e" }}>&#8377;{(c.value || 0).toLocaleString()}</div>
                </div>
                <div style={{ display: "flex", gap: "5px", flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                  <button onClick={() => openEdit(c)} style={{ padding: "7px 10px", background: "rgba(108,99,255,0.1)", border: "1px solid rgba(108,99,255,0.25)", borderRadius: "8px", cursor: "pointer", fontSize: "13px", color: "#6c63ff" }}>✏️</button>
                  <button onClick={() => copyContractText(c)} style={{ padding: "7px 10px", background: "rgba(0,217,126,0.1)", border: "1px solid rgba(0,217,126,0.25)", borderRadius: "8px", cursor: "pointer", fontSize: "13px", color: "#00d97e" }}>📋</button>
                  <button onClick={() => deleteContract(c._id)} style={{ padding: "7px 10px", background: "rgba(255,77,109,0.1)", border: "1px solid rgba(255,77,109,0.25)", borderRadius: "8px", cursor: "pointer", fontSize: "13px", color: "#ff4d6d" }}>🗑️</button>
                </div>
              </div>
            )
          })}
          {filtered.length === 0 && (
            <div style={{ textAlign: "center", padding: "40px", color: "var(--text2)", background: "var(--surface)", borderRadius: "14px", border: "1px solid var(--border)" }}>No contracts match your filters</div>
          )}
        </div>
      )}

      {(modal === "create" || modal === "edit") && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "20px", width: "100%", maxWidth: "660px", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ padding: "24px 28px 16px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h2 style={{ fontSize: "20px", fontWeight: 800 }}>{modal === "edit" ? "Edit Contract" : "New Contract"}</h2>
                <p style={{ fontSize: "13px", color: "var(--text2)", marginTop: "2px" }}>{modal === "edit" ? "Editing — " + selected?.title : "Create a professional contract"}</p>
              </div>
              <button onClick={() => setModal(selected ? "view" : null)} style={{ background: "transparent", border: "none", color: "var(--text2)", cursor: "pointer", fontSize: "22px" }}>×</button>
            </div>
            <FormContent />
          </div>
        </div>
      )}

      {modal === "view" && selected && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "20px", width: "100%", maxWidth: "640px", maxHeight: "92vh", overflowY: "auto" }}>
            <div style={{ background: "linear-gradient(135deg,#0f0c29,#302b63,#24243e)", padding: "32px", borderRadius: "20px 20px 0 0", position: "relative" }}>
              <button onClick={() => { setModal(null); setSelected(null) }} style={{ position: "absolute", top: "16px", right: "16px", background: "rgba(255,255,255,0.1)", border: "none", borderRadius: "8px", color: "#fff", cursor: "pointer", fontSize: "18px", padding: "4px 10px" }}>×</button>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontSize: "13px", color: "#a78bfa", marginBottom: "6px", fontWeight: 600, textTransform: "uppercase" }}>Contract Agreement</div>
                  <div style={{ fontSize: "20px", fontWeight: 800, color: "#fff", marginBottom: "4px" }}>{selected.title}</div>
                  <div style={{ fontSize: "12px", color: "#a78bfa" }}>#{(selected.contractNo || String(selected._id).slice(-8)).toUpperCase()}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span style={{ fontSize: "11px", padding: "4px 14px", borderRadius: "99px", background: STATUS[selected.status]?.bg, color: STATUS[selected.status]?.color, border: "1px solid " + STATUS[selected.status]?.border, fontWeight: 700 }}>{STATUS[selected.status]?.label}</span>
                  <div style={{ fontSize: "26px", fontWeight: 800, color: "#00d97e", marginTop: "8px" }}>&#8377;{(selected.value || 0).toLocaleString()}</div>
                </div>
              </div>
            </div>
            <div style={{ padding: "28px 32px", display: "flex", flexDirection: "column", gap: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px 16px", background: "var(--surface2)", borderRadius: "12px" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "linear-gradient(135deg,#6c63ff,#ff6584)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", fontWeight: 800, color: "#fff" }}>{selected.client?.[0]?.toUpperCase()}</div>
                <div>
                  <div style={{ fontSize: "15px", fontWeight: 800 }}>{selected.client}</div>
                  {selected.company && <div style={{ fontSize: "12px", color: "var(--text2)" }}>{selected.company}</div>}
                </div>
                <div style={{ marginLeft: "auto", textAlign: "right" }}>
                  <div style={{ fontSize: "12px", color: "var(--text2)" }}>Type</div>
                  <div style={{ fontSize: "13px", fontWeight: 700 }}>{selected.contractType}</div>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "10px" }}>
                {[
                  { label: "Start Date", value: selected.startDate || "—" },
                  { label: "End Date",   value: selected.endDate || "—" },
                  { label: "Revisions",  value: (selected.revisions ?? "—") + " included" },
                  { label: "Payment",    value: selected.paymentTerms?.split(",")[0] || "—" },
                  { label: "Created",    value: selected.createdAt || "—" },
                  { label: "Signed",     value: selected.signedDate || "Not yet" },
                ].map(item => (
                  <div key={item.label} style={{ background: "var(--surface2)", borderRadius: "10px", padding: "12px 14px" }}>
                    <div style={{ fontSize: "10px", color: "var(--text2)", textTransform: "uppercase", marginBottom: "4px" }}>{item.label}</div>
                    <div style={{ fontSize: "13px", fontWeight: 700 }}>{item.value}</div>
                  </div>
                ))}
              </div>
              {selected.scope && <div style={{ background: "var(--surface2)", borderRadius: "12px", padding: "16px 18px" }}><div style={{ fontSize: "11px", fontWeight: 700, color: "var(--text2)", textTransform: "uppercase", marginBottom: "8px" }}>Scope of Work</div><p style={{ fontSize: "13px", lineHeight: "1.7", whiteSpace: "pre-wrap" }}>{selected.scope}</p></div>}
              {selected.deliverables && <div style={{ background: "var(--surface2)", borderRadius: "12px", padding: "16px 18px" }}><div style={{ fontSize: "11px", fontWeight: 700, color: "var(--text2)", textTransform: "uppercase", marginBottom: "8px" }}>Deliverables</div><p style={{ fontSize: "13px", lineHeight: "1.7", whiteSpace: "pre-wrap" }}>{selected.deliverables}</p></div>}
              {selected.notes && <div style={{ background: "var(--surface2)", borderRadius: "12px", padding: "16px 18px" }}><div style={{ fontSize: "11px", fontWeight: 700, color: "var(--text2)", textTransform: "uppercase", marginBottom: "8px" }}>Notes</div><p style={{ fontSize: "13px", lineHeight: "1.7", whiteSpace: "pre-wrap" }}>{selected.notes}</p></div>}
              <div>
                <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--text2)", textTransform: "uppercase", marginBottom: "10px" }}>Update Status</div>
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                  {Object.entries(STATUS).map(([k, v]) => (
                    <button key={k} onClick={() => updateStatus(selected._id, k)} style={{ padding: "6px 14px", borderRadius: "99px", border: "1px solid " + v.border, background: selected.status === k ? v.bg : "transparent", color: v.color, cursor: "pointer", fontSize: "11px", fontWeight: 700 }}>{v.label}</button>
                  ))}
                </div>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={() => copyContractText(selected)} style={{ flex: 1, padding: "11px", background: "rgba(0,217,126,0.1)", border: "1px solid rgba(0,217,126,0.3)", borderRadius: "8px", color: "#00d97e", cursor: "pointer", fontWeight: 700, fontSize: "13px" }}>📋 Copy</button>
                <button onClick={() => openEdit(selected)} style={{ flex: 1, padding: "11px", background: "rgba(108,99,255,0.1)", border: "1px solid rgba(108,99,255,0.3)", borderRadius: "8px", color: "#6c63ff", cursor: "pointer", fontWeight: 700, fontSize: "13px" }}>✏️ Edit</button>
                <button onClick={() => { setModal(null); setSelected(null) }} style={{ flex: 1, padding: "11px", background: "transparent", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--text2)", cursor: "pointer", fontWeight: 600 }}>Close</button>
                <button onClick={() => deleteContract(selected._id)} style={{ flex: 1, padding: "11px", background: "rgba(255,77,109,0.1)", border: "1px solid rgba(255,77,109,0.3)", borderRadius: "8px", color: "#ff4d6d", cursor: "pointer", fontWeight: 700 }}>🗑️ Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}