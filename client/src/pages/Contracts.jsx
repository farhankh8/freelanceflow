import { useState, useEffect, useCallback, useMemo } from "react"
import { createPortal } from "react-dom"
import api from "../lib/api"
import toast from "react-hot-toast"

const STATUS = {
  draft:     { label: "Draft",      color: "#a8aec0", bg: "rgba(168,174,192,0.15)", border: "rgba(168,174,192,0.3)" },
  sent:      { label: "Sent",       color: "#2CA5E0", bg: "rgba(44,165,224,0.15)",  border: "rgba(44,165,224,0.3)"  },
  signed:    { label: "Signed ✓",   color: "#00d97e", bg: "rgba(0,217,126,0.15)",  border: "rgba(0,217,126,0.3)"  },
  active:    { label: "Active",     color: "#6c63ff", bg: "rgba(108,99,255,0.15)", border: "rgba(108,99,255,0.3)" },
  completed:  { label: "Completed",  color: "#00c9a7", bg: "rgba(0,201,167,0.15)",  border: "rgba(0,201,167,0.3)"  },
  cancelled:  { label: "Cancelled",  color: "#ff4d6d", bg: "rgba(255,77,109,0.15)", border: "rgba(255,77,109,0.3)" },
  expired:    { label: "Expired",    color: "#ff6584", bg: "rgba(255,101,132,0.15)",border: "rgba(255,101,132,0.3)"},
}

const CONTRACT_TYPES = ["Fixed Price", "Hourly Rate", "Retainer", "Milestone-Based", "Revenue Share", "Subscription"]
const PAYMENT_TERMS = ["50% upfront, 50% on delivery", "100% upfront", "Monthly invoicing", "Net 15", "Net 30", "Milestone payments", "Weekly payments"]

const EMPTY_FORM = {
  title: "", client: "", company: "", contractType: "Fixed Price",
  value: "", startDate: "", endDate: "", paymentTerms: "50% upfront, 50% on delivery",
  terms: "", deliverables: "", revisions: "2", status: "draft", notes: "", signedAt: "",
}

const inputStyle = {
  width: "100%", padding: "10px 14px",
  background: "var(--surface2, #1a1a24)",
  border: "1px solid var(--border, rgba(255,255,255,0.1))",
  borderRadius: "8px", color: "var(--text, #fafafa)", fontSize: "13px",
}

function ContractModal({ contract, onSubmit, onClose }) {
  const [form, setForm] = useState(contract ? {
    title: contract.title || "", client: contract.client || "", company: contract.company || "",
    contractType: contract.contractType || "Fixed Price", value: contract.value || "",
    startDate: contract.startDate || "", endDate: contract.endDate || "",
    paymentTerms: contract.paymentTerms || "50% upfront, 50% on delivery",
    terms: contract.terms || "", deliverables: contract.deliverables || "",
    revisions: contract.revisions || "2", status: contract.status || "draft",
    notes: contract.notes || "", signedAt: contract.signedAt || "",
  } : EMPTY_FORM)
  const [activeTab, setActiveTab] = useState("details")

  const setField = useCallback((key, value) => {
    setForm(f => ({ ...f, [key]: value }))
  }, [])

  const handleSubmit = () => {
    if (!form.title || !form.client) {
      toast.error("Title and client are required")
      return
    }
    const data = { ...form, value: Number(form.value) || 0, revisions: Number(form.revisions) || 2, terms: form.terms || '', services: form.deliverables ? form.deliverables.split(',').map(s => s.trim()).filter(Boolean) : [] }
    delete data.scope
    if (contract?._id) data._id = contract._id
    onSubmit(data)
  }

  return createPortal(
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }} onClick={onClose}>
      <div style={{ background: "var(--surface, #111118)", border: "1px solid var(--border, rgba(255,255,255,0.1))", borderRadius: "20px", width: "100%", maxWidth: "660px", maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: "24px 28px 16px", borderBottom: "1px solid var(--border, rgba(255,255,255,0.1))", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div><h2 style={{ fontSize: "20px", fontWeight: 800 }}>{contract ? "Edit Contract" : "New Contract"}</h2><p style={{ fontSize: "13px", color: "var(--text2, #a1a1aa)", marginTop: "2px" }}>{contract ? `Editing — ${contract.title}` : "Create a professional contract"}</p></div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: "var(--text2, #a1a1aa)", cursor: "pointer", fontSize: "22px" }}>×</button>
        </div>
        <div style={{ padding: "0 28px 24px", display: "flex", flexDirection: "column", gap: "14px" }}>
          <div style={{ display: "flex", gap: "4px", padding: "4px", background: "var(--surface2, #1a1a24)", borderRadius: "10px" }}>
            <button onClick={() => setActiveTab("details")} style={{ padding: "8px 16px", border: "none", background: activeTab === "details" ? "#6c63ff" : "transparent", color: activeTab === "details" ? "#fff" : "var(--text2, #a1a1aa)", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: 600 }}>Details</button>
            <button onClick={() => setActiveTab("scope")} style={{ padding: "8px 16px", border: "none", background: activeTab === "scope" ? "#6c63ff" : "transparent", color: activeTab === "scope" ? "#fff" : "var(--text2, #a1a1aa)", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: 600 }}>Scope</button>
            <button onClick={() => setActiveTab("payment")} style={{ padding: "8px 16px", border: "none", background: activeTab === "payment" ? "#6c63ff" : "transparent", color: activeTab === "payment" ? "#fff" : "var(--text2, #a1a1aa)", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: 600 }}>Payment</button>
          </div>

          {activeTab === "details" && (
            <>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text2, #a1a1aa)", marginBottom: "6px" }}>Contract Title *</label>
                <input type="text" value={form.title} onChange={e => setField("title", e.target.value)} placeholder="e.g. Website Development Agreement" style={inputStyle} autoFocus />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text2, #a1a1aa)", marginBottom: "6px" }}>Client Name *</label>
                  <input type="text" value={form.client} onChange={e => setField("client", e.target.value)} placeholder="Client name" style={inputStyle} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text2, #a1a1aa)", marginBottom: "6px" }}>Company</label>
                  <input type="text" value={form.company} onChange={e => setField("company", e.target.value)} placeholder="Company name" style={inputStyle} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text2, #a1a1aa)", marginBottom: "6px" }}>Contract Type</label>
                  <select value={form.contractType} onChange={e => setField("contractType", e.target.value)} style={inputStyle}>
                    {CONTRACT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text2, #a1a1aa)", marginBottom: "6px" }}>Value</label>
                  <input type="number" value={form.value} onChange={e => setField("value", e.target.value)} placeholder="50000" style={inputStyle} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text2, #a1a1aa)", marginBottom: "6px" }}>Start Date</label>
                  <input type="date" value={form.startDate} onChange={e => setField("startDate", e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text2, #a1a1aa)", marginBottom: "6px" }}>End Date</label>
                  <input type="date" value={form.endDate} onChange={e => setField("endDate", e.target.value)} style={inputStyle} />
                </div>
              </div>
            </>
          )}

          {activeTab === "scope" && (
            <>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text2, #a1a1aa)", marginBottom: "6px" }}>Scope of Work</label>
                <textarea value={form.terms} onChange={e => setField("terms", e.target.value)} rows={5} placeholder="Describe what is included..." style={{ ...inputStyle, resize: "vertical" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text2, #a1a1aa)", marginBottom: "6px" }}>Deliverables</label>
                <textarea value={form.deliverables} onChange={e => setField("deliverables", e.target.value)} rows={4} placeholder="List deliverables..." style={{ ...inputStyle, resize: "vertical" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text2, #a1a1aa)", marginBottom: "6px" }}>Notes / Exclusions</label>
                <textarea value={form.notes} onChange={e => setField("notes", e.target.value)} rows={3} placeholder="What is NOT included..." style={{ ...inputStyle, resize: "vertical" }} />
              </div>
            </>
          )}

          {activeTab === "payment" && (
            <>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 700, color: "var(--text2, #a1a1aa)", marginBottom: "6px" }}>Payment Terms</label>
                <select value={form.paymentTerms} onChange={e => setField("paymentTerms", e.target.value)} style={inputStyle}>
                  {PAYMENT_TERMS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              {form.value && (
                <div style={{ padding: "14px 18px", background: "rgba(108,99,255,0.08)", border: "1px solid rgba(108,99,255,0.2)", borderRadius: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "13px", color: "var(--text2, #a1a1aa)" }}>Total Value</span>
                  <span style={{ fontSize: "22px", fontWeight: 800, color: "#6c63ff" }}>₹{Number(form.value).toLocaleString()}</span>
                </div>
              )}
            </>
          )}

          <div style={{ display: "flex", gap: "10px", paddingTop: "8px" }}>
            <button onClick={onClose} style={{ flex: 1, padding: "11px 20px", background: "transparent", border: "1px solid var(--border, rgba(255,255,255,0.1))", borderRadius: "8px", color: "var(--text2, #a1a1aa)", cursor: "pointer", fontWeight: 600 }}>Cancel</button>
            <button onClick={handleSubmit} style={{ flex: 2, padding: "11px 28px", background: "linear-gradient(135deg,#6c63ff,#ff6584)", border: "none", borderRadius: "8px", color: "#fff", cursor: "pointer", fontWeight: 700, fontSize: "14px" }}>{contract ? "Save Changes ✏️" : "Create Contract"}</button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

function ContractDetail({ contract, onEdit, onClose, onDelete, onUpdateStatus }) {
  const st = STATUS[contract.status] || STATUS.draft
  const daysLeft = contract.endDate ? Math.ceil((new Date(contract.endDate) - new Date()) / 86400000) : null
  const isExpiring = daysLeft !== null && daysLeft >= 0 && daysLeft <= 7

  return createPortal(
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }} onClick={onClose}>
      <div style={{ background: "var(--surface, #111118)", border: "1px solid var(--border, rgba(255,255,255,0.1))", borderRadius: "20px", width: "100%", maxWidth: "640px", maxHeight: "92vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
        <div style={{ background: "linear-gradient(135deg,#0f0c29,#302b63,#24243e)", padding: "32px", borderRadius: "20px 20px 0 0" }}>
          <button onClick={onClose} style={{ position: "absolute", top: "16px", right: "16px", background: "rgba(255,255,255,0.1)", border: "none", borderRadius: "8px", color: "#fff", cursor: "pointer", fontSize: "18px", padding: "4px 10px" }}>×</button>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div><div style={{ fontSize: "13px", color: "#a78bfa", marginBottom: "6px", fontWeight: 600 }}>Contract Agreement</div><div style={{ fontSize: "20px", fontWeight: 800, color: "#fff", marginBottom: "4px" }}>{contract.title}</div><div style={{ fontSize: "12px", color: "#a78bfa" }}>#{String(contract._id).slice(-8).toUpperCase()}</div></div>
            <div style={{ textAlign: "right" }}>
              <span style={{ fontSize: "11px", padding: "4px 14px", borderRadius: "99px", background: st.bg, color: st.color, border: "1px solid " + st.border, fontWeight: 700 }}>{st.label}</span>
              <div style={{ fontSize: "26px", fontWeight: 800, color: "#00d97e", marginTop: "8px" }}>₹{(contract.value || 0).toLocaleString()}</div>
            </div>
          </div>
        </div>
        <div style={{ padding: "28px 32px", display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px 16px", background: "var(--surface2, #1a1a24)", borderRadius: "12px" }}>
            <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "linear-gradient(135deg,#6c63ff,#ff6584)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", fontWeight: 800, color: "#fff" }}>{contract.client?.[0]?.toUpperCase()}</div>
            <div><div style={{ fontSize: "15px", fontWeight: 800 }}>{contract.client}</div>{contract.company && <div style={{ fontSize: "12px", color: "var(--text2, #a1a1aa)" }}>{contract.company}</div>}</div>
            <div style={{ marginLeft: "auto", textAlign: "right" }}><div style={{ fontSize: "12px", color: "var(--text2, #a1a1aa)" }}>Type</div><div style={{ fontSize: "13px", fontWeight: 700 }}>{contract.contractType}</div></div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "10px" }}>
            {[{ label: "Start Date", value: contract.startDate || "—" }, { label: "End Date", value: contract.endDate || "—" }, { label: "Revisions", value: (contract.revisions ?? "—") + " included" }, { label: "Payment", value: contract.paymentTerms?.split(",")[0] || "—" }, { label: "Created", value: contract.createdAt || "—" }, { label: "Signed", value: contract.signedAt || "Not yet" }].map(item => (
              <div key={item.label} style={{ background: "var(--surface2, #1a1a24)", borderRadius: "10px", padding: "12px 14px" }}>
                <div style={{ fontSize: "10px", color: "var(--text2, #a1a1aa)", marginBottom: "4px" }}>{item.label}</div>
                <div style={{ fontSize: "13px", fontWeight: 700 }}>{item.value}</div>
              </div>
            ))}
          </div>
          {contract.scope && <div style={{ background: "var(--surface2, #1a1a24)", borderRadius: "12px", padding: "16px 18px" }}><div style={{ fontSize: "11px", fontWeight: 700, color: "var(--text2, #a1a1aa)", marginBottom: "8px" }}>Scope of Work</div><p style={{ fontSize: "13px", lineHeight: "1.7", whiteSpace: "pre-wrap" }}>{contract.scope}</p></div>}
          {contract.deliverables && <div style={{ background: "var(--surface2, #1a1a24)", borderRadius: "12px", padding: "16px 18px" }}><div style={{ fontSize: "11px", fontWeight: 700, color: "var(--text2, #a1a1aa)", marginBottom: "8px" }}>Deliverables</div><p style={{ fontSize: "13px", lineHeight: "1.7", whiteSpace: "pre-wrap" }}>{contract.deliverables}</p></div>}
          <div>
            <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--text2, #a1a1aa)", marginBottom: "10px" }}>Update Status</div>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {Object.entries(STATUS).map(([k, v]) => (
                <button key={k} onClick={() => onUpdateStatus(contract._id, k)} style={{ padding: "6px 14px", borderRadius: "99px", border: "1px solid " + v.border, background: contract.status === k ? v.bg : "transparent", color: v.color, cursor: "pointer", fontSize: "11px", fontWeight: 700 }}>{v.label}</button>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={onEdit} style={{ flex: 1, padding: "11px", background: "rgba(108,99,255,0.1)", border: "1px solid rgba(108,99,255,0.3)", borderRadius: "8px", color: "#6c63ff", cursor: "pointer", fontWeight: 700 }}>✏️ Edit</button>
            <button onClick={onClose} style={{ flex: 1, padding: "11px", background: "transparent", border: "1px solid var(--border, rgba(255,255,255,0.1))", borderRadius: "8px", color: "var(--text2, #a1a1aa)", cursor: "pointer", fontWeight: 600 }}>Close</button>
            <button onClick={() => onDelete(contract._id)} style={{ flex: 1, padding: "11px", background: "rgba(255,77,109,0.1)", border: "1px solid rgba(255,77,109,0.3)", borderRadius: "8px", color: "#ff4d6d", cursor: "pointer", fontWeight: 700 }}>🗑️ Delete</button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

export default function Contracts() {
  const [contracts, setContracts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterType, setFilterType] = useState("all")
  const [showModal, setShowModal] = useState(false)
  const [editContract, setEditContract] = useState(null)
  const [viewContract, setViewContract] = useState(null)

  useEffect(() => {
    api.get("/contracts").then(({ data }) => {
      setContracts(data?.data || [])
      setLoading(false)
    }).catch(() => { setLoading(false) })
  }, [])

  const handleCreate = async (formData) => {
    try {
      const { data } = await api.post("/contracts", formData)
      setContracts(prev => [data.data, ...prev])
      toast.success("Contract created!")
      setShowModal(false)
    } catch (e) {
      toast.error("Failed to create contract")
    }
  }

  const handleEdit = async (formData) => {
    if (!editContract) return
    try {
      const { data } = await api.put(`/contracts/${editContract._id}`, formData)
      setContracts(prev => (prev || []).map(c => c._id === editContract._id ? data.data : c))
      setViewContract(data.data)
      toast.success("Contract updated!")
      setShowModal(false)
      setEditContract(null)
    } catch (e) {
      toast.error("Failed to update contract")
    }
  }

  const updateStatus = async (id, status) => {
    const extra = status === "signed" ? { signedAt: new Date().toISOString().split("T")[0] } : {}
    try {
      const { data } = await api.put(`/contracts/${id}`, { status, ...extra })
      setContracts(prev => (prev || []).map(c => c._id === id ? data.data : c))
      setViewContract(prev => prev?._id === id ? data.data : prev)
      toast.success(status === "signed" ? "Contract signed!" : "Status updated!")
    } catch (e) {
      toast.error("Failed to update status")
    }
  }

  const deleteContract = async (id) => {
    if (!window.confirm("Delete this contract? This cannot be undone.")) return
    try {
      await api.delete(`/contracts/${id}`)
      setContracts(prev => prev.filter(c => c._id !== id))
      setViewContract(null)
      toast.success("Contract deleted")
    } catch (e) {
      toast.error("Failed to delete")
    }
  }

  const filtered = useMemo(() => contracts.filter(c => {
    const q = search.toLowerCase()
    const matchSearch = !search || c.title?.toLowerCase().includes(q) || c.client?.toLowerCase().includes(q)
    const matchStatus = filterStatus === "all" || c.status === filterStatus
    const matchType = filterType === "all" || c.contractType === filterType
    return matchSearch && matchStatus && matchType
  }), [contracts, search, filterStatus, filterType])

  const totalValue = useMemo(() => contracts.reduce((s, c) => s + (c.value || 0), 0), [contracts])
  const activeValue = useMemo(() => contracts.filter(c => ["active","signed"].includes(c.status)).reduce((s, c) => s + (c.value || 0), 0), [contracts])
  const signedCount = useMemo(() => contracts.filter(c => ["signed","active","completed"].includes(c.status)).length, [contracts])
  const signRate = useMemo(() => contracts.length ? Math.round((signedCount / contracts.length) * 100) : 0, [contracts, signedCount])

  return (
    <div style={{ maxWidth: "1200px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px", gap: "12px", flexWrap: "wrap" }}>
        <div><h1 style={{ fontSize: "28px", fontWeight: 800, marginBottom: "4px" }}>Contracts</h1><p style={{ color: "var(--text2, #a1a1aa)", fontSize: "14px" }}>{contracts.length} total · {signRate}% sign rate</p></div>
        <button onClick={() => { setEditContract(null); setShowModal(true) }} style={{ padding: "10px 20px", background: "linear-gradient(135deg,#6c63ff,#ff6584)", border: "none", borderRadius: "10px", color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: "14px" }}>+ New Contract</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "14px", marginBottom: "24px" }}>
        {[{ label: "Total Contracts", value: contracts.length, icon: "📜", color: "#6c63ff" }, { label: "Total Value", value: "₹" + totalValue.toLocaleString(), icon: "💰", color: "#ffb800" }, { label: "Active Value", value: "₹" + activeValue.toLocaleString(), icon: "⚡", color: "#00d97e" }, { label: "Sign Rate", value: signRate + "%", icon: "✍️", color: "#ff6584" }].map(s => (
          <div key={s.label} style={{ background: "var(--surface, #111118)", border: "1px solid var(--border, rgba(255,255,255,0.1))", borderRadius: "14px", padding: "18px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: s.color + "20", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px" }}>{s.icon}</div>
              <div><div style={{ fontSize: "20px", fontWeight: 800 }}>{s.value}</div><div style={{ fontSize: "11px", color: "var(--text2, #a1a1aa)" }}>{s.label}</div></div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap" }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." style={{ ...inputStyle, maxWidth: "200px" }} />
        <select value={filterType} onChange={e => setFilterType(e.target.value)} style={{ ...inputStyle, width: "auto" }}>
          <option value="all">All Types</option>
          {CONTRACT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <button onClick={() => setFilterStatus("all")} style={{ padding: "7px 14px", borderRadius: "8px", border: "1px solid var(--border, rgba(255,255,255,0.1))", background: filterStatus === "all" ? "#6c63ff" : "transparent", color: filterStatus === "all" ? "#fff" : "var(--text2, #a1a1aa)", fontSize: "12px", cursor: "pointer", fontWeight: 600 }}>All</button>
        {Object.entries(STATUS).map(([k, v]) => (
          <button key={k} onClick={() => setFilterStatus(filterStatus === k ? "all" : k)} style={{ padding: "7px 14px", borderRadius: "8px", border: "1px solid " + (filterStatus === k ? v.color : "var(--border, rgba(255,255,255,0.1))"), background: filterStatus === k ? v.bg : "transparent", color: filterStatus === k ? v.color : "var(--text2, #a1a1aa)", fontSize: "12px", cursor: "pointer", fontWeight: 600 }}>{v.label}</button>
        ))}
      </div>

      {loading && (
        <div style={{ textAlign: "center", padding: "80px", color: "var(--text2)" }}>
          <div style={{ fontSize: "32px", marginBottom: "12px" }}>⏳</div>
          <p>Loading contracts...</p>
        </div>
      )}

      {!loading && contracts.length === 0 && (
        <div style={{ textAlign: "center", padding: "80px 20px", background: "var(--surface, #111118)", border: "2px dashed var(--border, rgba(255,255,255,0.1))", borderRadius: "20px" }}>
          <div style={{ fontSize: "56px", marginBottom: "16px" }}>📜</div>
          <p style={{ fontSize: "18px", fontWeight: 700, marginBottom: "8px" }}>No contracts yet</p>
          <button onClick={() => setShowModal(true)} style={{ padding: "12px 28px", background: "linear-gradient(135deg,#6c63ff,#ff6584)", border: "none", borderRadius: "10px", color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: "14px" }}>+ Create First Contract</button>
        </div>
      )}

      {!loading && contracts.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {(filtered || []).map(c => {
            const st = STATUS[c.status] || STATUS.draft
            const daysLeft = c.endDate ? Math.ceil((new Date(c.endDate) - new Date()) / 86400000) : null
            const isExpiring = daysLeft !== null && daysLeft >= 0 && daysLeft <= 7
            return (
              <div key={c._id} onClick={() => setViewContract(c)} style={{ display: "flex", alignItems: "center", gap: "16px", padding: "18px 20px", background: "var(--surface, #111118)", border: "1px solid " + (isExpiring ? "rgba(255,184,0,0.4)" : "var(--border, rgba(255,255,255,0.1))"), borderRadius: "14px", cursor: "pointer", flexWrap: "wrap" }}>
                <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: st.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", flexShrink: 0 }}>📜</div>
                <div style={{ flex: "1 1 200px", minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: "15px", marginBottom: "4px" }}>{c.title}</div>
                  <div style={{ display: "flex", gap: "12px", fontSize: "12px", color: "var(--text2, #a1a1aa)", flexWrap: "wrap" }}>
                    <span>👤 {c.client}</span>
                    <span>📋 {c.contractType}</span>
                    {c.startDate && <span>📅 {c.startDate}{c.endDate ? " → " + c.endDate : ""}</span>}
                  </div>
                </div>
                <div style={{ textAlign: "center", flexShrink: 0 }}>
                  <span style={{ fontSize: "11px", padding: "4px 12px", borderRadius: "99px", background: st.bg, color: st.color, border: "1px solid " + st.border, fontWeight: 700 }}>{st.label}</span>
                  {daysLeft !== null && <div style={{ fontSize: "10px", marginTop: "5px", color: daysLeft < 0 ? "#ff4d6d" : isExpiring ? "#ffb800" : "var(--text2, #a1a1aa)", fontWeight: 600 }}>{daysLeft < 0 ? Math.abs(daysLeft) + "d overdue" : daysLeft === 0 ? "Ends today!" : daysLeft + "d left"}</div>}
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}><div style={{ fontSize: "18px", fontWeight: 800, color: "#00d97e" }}>₹{(c.value || 0).toLocaleString()}</div></div>
                <div style={{ display: "flex", gap: "5px", flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                  <button onClick={() => { setEditContract(c); setShowModal(true) }} style={{ padding: "7px 10px", background: "rgba(108,99,255,0.1)", border: "1px solid rgba(108,99,255,0.25)", borderRadius: "8px", cursor: "pointer", fontSize: "13px", color: "#6c63ff" }}>✏️</button>
                  <button onClick={() => deleteContract(c._id)} style={{ padding: "7px 10px", background: "rgba(255,77,109,0.1)", border: "1px solid rgba(255,77,109,0.25)", borderRadius: "8px", cursor: "pointer", fontSize: "13px", color: "#ff4d6d" }}>🗑️</button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showModal && <ContractModal contract={editContract} onSubmit={editContract ? handleEdit : handleCreate} onClose={() => { setShowModal(false); setEditContract(null) }} />}
      {viewContract && <ContractDetail contract={viewContract} onEdit={() => { setEditContract(viewContract); setShowModal(true) }} onClose={() => setViewContract(null)} onDelete={deleteContract} onUpdateStatus={updateStatus} />}
    </div>
  )
}
